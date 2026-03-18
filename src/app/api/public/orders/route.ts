import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Order from '@/lib/models/Order';
import Product from '@/lib/models/Product';
import Store from '@/lib/models/Store';

export async function POST(request: Request) {
  try {
    await dbConnect();

    const body = await request.json();
    const {
      storeId,
      customer,
      items,
      subtotal,
      tax,
      shipping,
      discount,
      total,
      paymentMethod,
      notes,
    } = body;

    if (!customer || !items?.length || !total) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (!storeId) {
      return NextResponse.json({ error: 'Store ID is required' }, { status: 400 });
    }

    const store = await Store.findById(storeId);
    if (!store) {
      return NextResponse.json({ error: 'Store not found' }, { status: 404 });
    }

    for (const item of items) {
      const product = await Product.findOne({ _id: item.productId, storeId });
      if (!product) {
        return NextResponse.json({ error: `Product not found: ${item.name}` }, { status: 400 });
      }
      if (product.inventory < item.quantity) {
        return NextResponse.json({ 
          error: `Insufficient inventory for ${item.name}. Available: ${product.inventory}` 
        }, { status: 400 });
      }
    }

    const orderCount = await Order.countDocuments({ storeId });
    const orderNumber = `ORD-${storeId.slice(-4).toUpperCase()}-${String(orderCount + 1).padStart(4, '0')}`;

    const order = await Order.create({
      storeId,
      orderNumber,
      customer,
      items,
      subtotal,
      tax,
      shipping,
      discount: discount || 0,
      total,
      paymentMethod,
      notes,
      status: 'pending',
      paymentStatus: 'pending',
    });

    for (const item of items) {
      await Product.findByIdAndUpdate(item.productId, {
        $inc: { inventory: -item.quantity },
      });
    }

    return NextResponse.json(order, { status: 201 });
  } catch (error: any) {
    console.error('Create order error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const storeId = searchParams.get('storeId');
    const status = searchParams.get('status');

    const query: any = {};
    if (storeId) {
      query.storeId = storeId;
    }
    if (status) {
      query.status = status;
    }

    const orders = await Order.find(query)
      .sort({ createdAt: -1 })
      .limit(100);

    return NextResponse.json(orders);
  } catch (error: any) {
    console.error('Get orders error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
