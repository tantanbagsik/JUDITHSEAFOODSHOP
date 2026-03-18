import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Store from '@/lib/models/Store';
import Product from '@/lib/models/Product';

export async function GET() {
  try {
    await dbConnect();

    const stores = await Store.find({ isActive: true })
      .populate('owner', 'name email')
      .sort({ createdAt: -1 });

    const storesWithCounts = await Promise.all(
      stores.map(async (store) => {
        const productCount = await Product.countDocuments({ 
          storeId: store._id, 
          isActive: true 
        });
        
        return {
          ...store.toObject(),
          productCount,
        };
      })
    );

    return NextResponse.json(storesWithCounts);
  } catch (error: any) {
    console.error('Get public stores error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
