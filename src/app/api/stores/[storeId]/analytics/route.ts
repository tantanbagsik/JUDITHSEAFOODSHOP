import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import dbConnect from '@/lib/db';
import Order from '@/lib/models/Order';
import Product from '@/lib/models/Product';
import Customer from '@/lib/models/Customer';
import { authOptions } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const storeId = searchParams.get('storeId');
    const days = parseInt(searchParams.get('days') || '30');

    if (!storeId) {
      return NextResponse.json({ error: 'Store ID is required' }, { status: 400 });
    }

    await dbConnect();

    const orders = await Order.find({ storeId }).sort({ createdAt: -1 });
    const customers = await Customer.countDocuments({ storeId });

    const totalRevenue = orders.reduce((sum, order) => sum + (order.total || 0), 0);
    const totalOrders = orders.length;
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    const pendingOrders = orders.filter(order => order.status === 'pending').length;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const revenueByDay: Record<string, number> = {};
    orders
      .filter(order => new Date(order.createdAt) >= startDate)
      .forEach(order => {
        const date = new Date(order.createdAt).toISOString().split('T')[0];
        revenueByDay[date] = (revenueByDay[date] || 0) + order.total;
      });

    const revenueByDayArray = Object.entries(revenueByDay)
      .map(([date, revenue]) => ({ date, revenue }))
      .sort((a, b) => a.date.localeCompare(b.date));

    const productSales: Record<string, number> = {};
    orders.forEach(order => {
      order.items.forEach(item => {
        const name = item.name;
        productSales[name] = (productSales[name] || 0) + item.quantity;
      });
    });

    const topProducts = Object.entries(productSales)
      .map(([name, sold]) => ({ name, sold }))
      .sort((a, b) => b.sold - a.sold)
      .slice(0, 10);

    return NextResponse.json({
      totalRevenue,
      totalOrders,
      averageOrderValue,
      revenueByDay: revenueByDayArray,
      topProducts,
      totalCustomers: customers,
      pendingOrders,
    });
  } catch (error: any) {
    console.error('Get analytics error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
