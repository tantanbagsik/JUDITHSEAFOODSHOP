import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Store from '@/lib/models/Store';
import Product from '@/lib/models/Product';

export const revalidate = 300;

export async function GET(
  request: Request,
  { params }: { params: Promise<{ storeId: string }> }
) {
  try {
    const { storeId } = await params;
    await dbConnect();

    const store = await Store.findById(storeId).lean();
    if (!store || !store.isActive) {
      return NextResponse.json({ error: 'Store not found' }, { status: 404 });
    }

    const products = await Product.find({ storeId, isActive: true })
      .populate('categoryId', 'name slug')
      .sort({ isFeatured: -1, createdAt: -1 })
      .lean();

    const categoriesMap = new Map<string, any[]>();
    const allProducts: any[] = [];

    for (const product of products) {
      const formatted = formatProduct(product);
      allProducts.push(formatted);

      const category = product.categoryId as any;
      if (category && category.name) {
        const catName = category.name;
        if (!categoriesMap.has(catName)) {
          categoriesMap.set(catName, []);
        }
        categoriesMap.get(catName)!.push(formatted);
      }
    }

    const categories = Array.from(categoriesMap.entries()).map(([name, items]) => ({
      name,
      items,
    }));

    const featured = products.filter(p => p.isFeatured).map(formatProduct);

    const response = NextResponse.json({
      store: {
        _id: store._id.toString(),
        name: store.name,
        slug: store.slug,
        description: store.description || '',
        logo: store.logo || null,
        banner: store.banner || null,
        settings: store.settings || {
          shippingFee: 0,
          freeShippingThreshold: 0,
          taxRate: 0,
        },
      },
      categories,
      allProducts,
      featured,
      totalProducts: products.length,
    });
    response.headers.set('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600');
    return response;
  } catch (error: any) {
    console.error('Get store menu error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

function formatProduct(product: any) {
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
    tags: product.tags || [],
    categoryId: product.categoryId ? {
      _id: (product.categoryId as any)._id?.toString(),
      name: (product.categoryId as any).name,
      slug: (product.categoryId as any).slug,
    } : undefined,
  };
}
