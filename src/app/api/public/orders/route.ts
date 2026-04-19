import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Order from '@/lib/models/Order';
import Product from '@/lib/models/Product';
import Store from '@/lib/models/Store';
import Customer from '@/lib/models/Customer';

export async function POST(request: Request) {
  try {
    await dbConnect();

    const body = await request.json();
    const {
      storeId,
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

    if (!customer || !shippingAddress || !items?.length || !total) {
      return NextResponse.json({ error: 'Missing required fields: customer, shippingAddress, items, total' }, { status: 400 });
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
      await Product.findByIdAndUpdate(item.productId, {
        $inc: { inventory: -item.quantity },
      });
    }

    // Save or update customer
    let savedCustomer = null;
    try {
      savedCustomer = await Customer.findOne({ storeId, email: customer.email.toLowerCase() });
      
      if (savedCustomer) {
        savedCustomer.name = customer.name;
        if (customer.phone) {
          savedCustomer.phone = customer.phone;
        }
        savedCustomer.orderCount += 1;
        savedCustomer.totalSpent = (savedCustomer.totalSpent || 0) + total;
        await savedCustomer.save();
      } else {
        savedCustomer = await Customer.create({
          storeId,
          email: customer.email.toLowerCase(),
          name: customer.name,
          phone: customer.phone,
          addresses: [{
            firstName: shippingAddress.firstName,
            lastName: shippingAddress.lastName,
            address1: shippingAddress.address1,
            address2: shippingAddress.address2 || '',
            city: shippingAddress.city,
            state: shippingAddress.state || '',
            postalCode: shippingAddress.postalCode || '',
            country: shippingAddress.country || 'Philippines',
            phone: customer.phone,
            isDefault: true,
          }],
          orderCount: 1,
          totalSpent: total,
        });
      }
    } catch (custError) {
      console.error('Error saving customer:', custError);
    }

    return NextResponse.json({ order, customer: savedCustomer }, { status: 201 });
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
