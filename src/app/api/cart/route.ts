import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import dbConnect from '@/lib/db';
import Cart from '@/lib/models/Cart';
import Store from '@/lib/models/Store';
import { authOptions } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ storeCarts: [] });
    }

    await dbConnect();

    const cart = await Cart.findOne({ userId: session.user.id }).lean();
    if (!cart) {
      return NextResponse.json({ storeCarts: [] });
    }

    const storeCarts = cart.storeCarts || [];
    const storeIds = [...new Set(storeCarts.map((c: any) => c.storeId))] as string[];
    const stores = await Store.find({ _id: { $in: storeIds } }).select('settings').lean();
    const storeSettingsMap: Record<string, any> = {};
    for (const store of stores) {
      storeSettingsMap[String(store._id)] = store.settings;
    }

    const enrichedCarts = storeCarts.map((storeCart: any) => ({
      ...storeCart,
      storeSettings: storeSettingsMap[storeCart.storeId] || {
        currency: 'PHP',
        shippingFee: 50,
        freeShippingThreshold: 500,
        taxRate: 0.12,
      },
    }));

    return NextResponse.json({ storeCarts: enrichedCarts });
  } catch (error: any) {
    console.error('Get cart error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const { storeCarts } = await request.json();

    const cart = await Cart.findOneAndUpdate(
      { userId: session.user.id },
      {
        userId: session.user.id,
        storeCarts,
        updatedAt: Date.now(),
      },
      { upsert: true, new: true }
    );

    return NextResponse.json({ storeCarts: cart.storeCarts || [] });
  } catch (error: any) {
    console.error('Save cart error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
