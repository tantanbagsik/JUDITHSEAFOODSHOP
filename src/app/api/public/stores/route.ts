import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Store from '@/lib/models/Store';
import Product from '@/lib/models/Product';

export const revalidate = 300;

export async function GET() {
  try {
    await dbConnect();

    const stores = await Store.find({ isActive: true })
      .sort({ createdAt: -1 })
      .lean();

    const storeIds = stores.map(s => s._id);

    const productCounts = await Product.aggregate([
      { $match: { storeId: { $in: storeIds }, isActive: true } },
      { $group: { _id: '$storeId', count: { $sum: 1 } } }
    ]);

    const countMap = new Map(productCounts.map(p => [p._id.toString(), p.count]));

    const storesWithCounts = stores.map(store => ({
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

    const response = NextResponse.json(storesWithCounts);
    response.headers.set('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600');
    return response;
  } catch (error: any) {
    console.error('Get public stores error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
