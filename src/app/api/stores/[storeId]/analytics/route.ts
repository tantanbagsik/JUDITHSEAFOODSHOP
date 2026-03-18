import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import dbConnect from '@/lib/db';
import Order from '@/lib/models/Order';
import Product from '@/lib/models/Product';
import { authOptions } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const storeId = searchParams.get('storeId');

    if (!storeId) {
      return NextResponse.json({ error: 'Store ID is required' }, { status: 400 });
    }

    await dbConnect();

    const orders = await Order.find({ storeId });
    const products = await Product.find({ storeId, isActive: true });

    const totalRevenue = orders.reduce((sum, order) => sum + (order.total || 0), 0);
    const totalOrders = orders.length;
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    const last30Days = new Date();
    last30Days.setDate(last30Days.getDate() - 30);

    const revenueByDay: Record<string, number> = {};
    orders
      .filter(order => new Date(order.createdAt) >= last30Days)
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
    });
  } catch (error: any) {
    console.error('Get analytics error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
