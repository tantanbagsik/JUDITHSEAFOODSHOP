import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Product from '@/lib/models/Product';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const storeId = searchParams.get('storeId');
    const categoryId = searchParams.get('categoryId');
    const featured = searchParams.get('featured');
    const search = searchParams.get('search');

    await dbConnect();

    const query: any = { isActive: true };

    if (storeId) {
      query.storeId = storeId;
    }

    if (categoryId) {
      query.categoryId = categoryId;
    }

    if (featured === 'true') {
      query.isFeatured = true;
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    const products = await Product.find(query)
      .populate('categoryId', 'name slug')
      .populate('storeId', 'name slug')
      .sort({ isFeatured: -1, createdAt: -1 })
      .limit(100);

    return NextResponse.json(products);
  } catch (error: any) {
    console.error('Get products error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
