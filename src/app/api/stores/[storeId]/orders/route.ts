import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import dbConnect from '@/lib/db';
import Order from '@/lib/models/Order';
import Product from '@/lib/models/Product';
import { authOptions } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const storeId = searchParams.get('storeId');

    if (!storeId) {
      return NextResponse.json({ error: 'Store ID is required' }, { status: 400 });
    }

    await dbConnect();

    const body = await request.json();
    const {
      customer,
      shippingAddress,
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

    const order = await Order.create({
      storeId,
      customer,
      shippingAddress,
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
      const product = await Product.findById(item.productId);
      if (product && product.inventory < item.quantity) {
        return NextResponse.json({ 
          error: `Insufficient inventory for ${item.name}. Available: ${product.inventory}` 
        }, { status: 400 });
      }
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
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const storeId = searchParams.get('storeId');
    const status = searchParams.get('status');
    const customerEmail = searchParams.get('customerEmail');

    if (!storeId) {
      return NextResponse.json({ error: 'Store ID is required' }, { status: 400 });
    }

    await dbConnect();

    const query: any = { storeId };

    if (status) {
      query.status = status;
    }

    if (customerEmail) {
      query['customer.email'] = customerEmail;
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
