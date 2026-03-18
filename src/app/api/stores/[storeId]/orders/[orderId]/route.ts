import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/db';
import Order from '@/lib/models/Order';
import mongoose from 'mongoose';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ storeId: string; orderId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { storeId, orderId } = await params;

    if (!mongoose.Types.ObjectId.isValid(storeId) || !mongoose.Types.ObjectId.isValid(orderId)) {
      return NextResponse.json({ error: 'Invalid ID format' }, { status: 400 });
    }

    if (session.user.storeId !== storeId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    await dbConnect();
    const order = await Order.findOne({ _id: orderId, storeId }).populate('items.product');

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    return NextResponse.json(order);
  } catch (error) {
    console.error('Error fetching order:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ storeId: string; orderId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { storeId, orderId } = await params;
    const body = await req.json();

    if (!mongoose.Types.ObjectId.isValid(storeId) || !mongoose.Types.ObjectId.isValid(orderId)) {
      return NextResponse.json({ error: 'Invalid ID format' }, { status: 400 });
    }

    if (session.user.storeId !== storeId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    await dbConnect();

    const updateData: Record<string, unknown> = {};

    if (body.status) {
      updateData.status = body.status;
    }
    if (body.paymentStatus) {
      updateData.paymentStatus = body.paymentStatus;
    }
    if (body.notes) {
      updateData.notes = body.notes;
    }
    if (body.trackingNumber) {
      updateData.trackingNumber = body.trackingNumber;
    }

    const order = await Order.findOneAndUpdate(
      { _id: orderId, storeId },
      { $set: updateData },
      { new: true }
    );

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    return NextResponse.json(order);
  } catch (error) {
    console.error('Error updating order:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
