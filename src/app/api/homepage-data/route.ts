import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Store from '@/lib/models/Store';
import Product from '@/lib/models/Product';

export const revalidate = 300;

export async function GET() {
  try {
    await dbConnect();

    const [stores, products] = await Promise.all([
      Store.find({ isActive: true }).sort({ createdAt: -1 }).lean(),
      Product.find({ isActive: true })
        .populate('storeId', 'name slug logo')
        .sort({ isFeatured: -1, createdAt: -1 })
        .limit(500)
        .lean(),
    ]);

    const countMap = new Map<string, number>();
    for (const product of products) {
      const storeId = (product.storeId as any)?._id?.toString() || product.storeId?.toString();
      if (storeId) {
        countMap.set(storeId, (countMap.get(storeId) || 0) + 1);
      }
    }

    const storesWithData = stores.map(store => ({
      _id: store._id.toString(),
      name: store.name,
      slug: store.slug,
      description: store.description || '',
      logo: store.logo || null,
      banner: store.banner || null,
      isActive: store.isActive,
      productCount: countMap.get(store._id.toString()) || 0,
      createdAt: store.createdAt,
    }));

    const productsWithData = products.map(product => {
      const store = product.storeId as any;
      return {
        _id: product._id.toString(),
        name: product.name,
        description: product.description || '',
        price: product.price,
        comparePrice: product.comparePrice || undefined,
        images: product.images || [],
        inventory: product.inventory || 0,
        isActive: product.isActive,
        isFeatured: product.isFeatured || false,
        storeId: store ? {
          _id: store._id.toString(),
          name: store.name,
          slug: store.slug,
          logo: store.logo || null,
        } : undefined,
        categoryId: product.categoryId,
      };
    });

    const featuredProducts = productsWithData.filter(p => p.isFeatured);

    const response = NextResponse.json({
      stores: storesWithData,
      products: productsWithData,
      featuredProducts: featuredProducts.length > 0 ? featuredProducts : productsWithData.slice(0, 8),
    });
    response.headers.set('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600');
    return response;
  } catch (error: any) {
    console.error('Get homepage data error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
