'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { 
  Package, 
  ShoppingCart, 
  Users, 
  DollarSign, 
  TrendingUp, 
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  Eye,
  Clock,
  MoreHorizontal,
  Store,
  AlertTriangle,
  CheckCircle,
  ArrowRight,
  BarChart3
} from 'lucide-react';

interface Stats {
  totalProducts: number;
  totalOrders: number;
  totalCustomers: number;
  totalRevenue: number;
  pendingOrders: number;
  lowStock: number;
  totalViews?: number;
}

interface RecentOrder {
  _id: string;
  orderNumber: string;
  customer: { name: string; email: string };
  total: number;
  status: string;
  createdAt: string;
  items: Array<{ name: string; quantity: number }>;
}

interface TopProduct {
  _id: string;
  name: string;
  price: number;
  inventory: number;
  images?: string[];
}

interface Store {
  _id: string;
  name: string;
  slug: string;
  logo?: string;
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState<Stats>({
    totalProducts: 0,
    totalOrders: 0,
    totalCustomers: 0,
    totalRevenue: 0,
    pendingOrders: 0,
    lowStock: 0,
  });
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [store, setStore] = useState<Store | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    if (session?.user?.storeId) {
      fetchData();
    } else if (status === 'authenticated') {
      fetchStoreOnly();
    }
  }, [session, status]);

  const fetchStoreOnly = async () => {
    try {
      const res = await fetch(`/api/stores?owner=${session?.user?.id}`);
      if (res.ok) {
        const data = await res.json();
        if (data.length > 0) {
          setStore(data[0]);
        }
      }
    } catch (error) {
      console.error('Error fetching store:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchData = async () => {
    try {
      const [productsRes, ordersRes, customersRes, storeRes] = await Promise.all([
        fetch(`/api/stores/${session?.user?.storeId}/products?storeId=${session?.user?.storeId}`),
        fetch(`/api/stores/${session?.user?.storeId}/orders?storeId=${session?.user?.storeId}`),
        fetch(`/api/stores/${session?.user?.storeId}/customers?storeId=${session?.user?.storeId}`),
        fetch(`/api/stores?owner=${session?.user?.id}`),
      ]);

      const products = productsRes.ok ? await productsRes.json() : [];
      const orders = ordersRes.ok ? await ordersRes.json() : [];
      const customers = customersRes.ok ? await customersRes.json() : [];
      const storesData = storeRes.ok ? await storeRes.json() : [];

      if (storesData.length > 0) {
        setStore(storesData[0]);
      }

      const revenue = Array.isArray(orders) 
        ? orders.reduce((sum: number, order: any) => sum + (order.total || 0), 0)
        : 0;

      const pending = Array.isArray(orders) 
        ? orders.filter((o: any) => o.status === 'pending').length
        : 0;

      const lowStockCount = Array.isArray(products)
        ? products.filter((p: any) => p.inventory <= 5 && p.inventory > 0).length
        : 0;

      setStats({
        totalProducts: Array.isArray(products) ? products.length : 0,
        totalOrders: Array.isArray(orders) ? orders.length : 0,
        totalCustomers: Array.isArray(customers) ? customers.length : 0,
        totalRevenue: revenue,
        pendingOrders: pending,
        lowStock: lowStockCount,
      });

      setRecentOrders(Array.isArray(orders) ? orders.slice(0, 5) : []);
      setTopProducts(Array.isArray(products) ? products.slice(0, 5) : []);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    return `₱${price.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatDate = (date: string) => {
    const now = new Date();
    const orderDate = new Date(date);
    const diff = now.getTime() - orderDate.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    
    if (hours < 1) return 'Just now';
    if (hours < 24) return `${hours}h ago`;
    if (hours < 48) return 'Yesterday';
    return orderDate.toLocaleDateString('en-PH', { month: 'short', day: 'numeric' });
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, { bg: string; text: string; dot: string }> = {
      pending: { bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500' },
      processing: { bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-500' },
      shipped: { bg: 'bg-purple-50', text: 'text-purple-700', dot: 'bg-purple-500' },
      delivered: { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500' },
      cancelled: { bg: 'bg-red-50', text: 'text-red-700', dot: 'bg-red-500' },
    };
    return colors[status] || { bg: 'bg-gray-50', text: 'text-gray-700', dot: 'bg-gray-500' };
  };

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!store) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="relative bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 px-8 py-16">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-50"></div>
          <div className="relative text-center">
            <div className="w-20 h-20 bg-white/20 backdrop-blur rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Store className="h-10 w-10 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-white mb-3">Welcome to Judith Foods</h2>
            <p className="text-blue-100 mb-8 max-w-md mx-auto">
              Create your online store and start selling your products to customers worldwide.
            </p>
            <Link
              href="/dashboard/settings"
              className="inline-flex items-center gap-2 px-6 py-3 bg-white text-blue-600 rounded-xl font-semibold hover:bg-blue-50 transition-all shadow-xl"
            >
              <Plus className="h-5 w-5" />
              Create Your Store
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const statCards = [
    {
      name: 'Total Revenue',
      value: formatPrice(stats.totalRevenue),
      icon: DollarSign,
      gradient: 'from-emerald-500 to-teal-500',
      shadow: 'shadow-emerald-500/20',
      trend: '+12.5%',
      trendUp: true,
    },
    {
      name: 'Total Orders',
      value: stats.totalOrders.toString(),
      icon: ShoppingCart,
      gradient: 'from-blue-500 to-indigo-500',
      shadow: 'shadow-blue-500/20',
      trend: stats.pendingOrders > 0 ? `${stats.pendingOrders} pending` : 'All caught up',
      trendUp: stats.pendingOrders === 0,
    },
    {
      name: 'Total Products',
      value: stats.totalProducts.toString(),
      icon: Package,
      gradient: 'from-purple-500 to-pink-500',
      shadow: 'shadow-purple-500/20',
      trend: stats.lowStock > 0 ? `${stats.lowStock} low stock` : 'Well stocked',
      trendUp: stats.lowStock === 0,
    },
    {
      name: 'Total Customers',
      value: stats.totalCustomers.toString(),
      icon: Users,
      gradient: 'from-orange-500 to-red-500',
      shadow: 'shadow-orange-500/20',
      trend: '+8.2%',
      trendUp: true,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 mt-1">Welcome back! Here's what's happening with your store.</p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href={store ? `/shop/${store.slug}` : '/shop'}
            target="_blank"
            className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-all"
          >
            <Eye className="h-4 w-4" />
            <span className="hidden sm:inline">View Store</span>
          </Link>
          <Link
            href="/dashboard/products/new"
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-medium shadow-lg shadow-blue-500/30 transition-all hover:shadow-xl hover:shadow-blue-500/40 hover:-translate-y-0.5"
          >
            <Plus className="h-4 w-4" />
            Add Product
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        {statCards.map((stat, idx) => (
          <div key={idx} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg transition-shadow duration-300">
            <div className="p-6">
              <div className="flex items-start justify-between">
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${stat.gradient} flex items-center justify-center shadow-lg ${stat.shadow}`}>
                  <stat.icon className="h-7 w-7 text-white" />
                </div>
                <div className={`flex items-center gap-1 text-sm font-medium ${stat.trendUp ? 'text-emerald-600' : 'text-amber-600'}`}>
                  {stat.trendUp ? (
                    <ArrowUpRight className="h-4 w-4" />
                  ) : (
                    <ArrowDownRight className="h-4 w-4" />
                  )}
                  <span className="hidden sm:inline">{stat.trend}</span>
                </div>
              </div>
              <div className="mt-4">
                <p className="text-sm text-gray-500">{stat.name}</p>
                <p className="text-2xl lg:text-3xl font-bold text-gray-900 mt-1">{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Recent Orders</h2>
              <p className="text-sm text-gray-500">Latest customer orders</p>
            </div>
            <Link href="/dashboard/orders" className="flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700">
              View All
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          
          {recentOrders.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <ShoppingCart className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No orders yet</h3>
              <p className="text-gray-500 mb-6">Orders will appear here when customers make a purchase</p>
              <Link
                href={store ? `/shop/${store.slug}` : '/shop'}
                target="_blank"
                className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700"
              >
                Share your store
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {recentOrders.map((order) => {
                const statusStyle = getStatusColor(order.status);
                return (
                  <div key={order._id} className="p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
                          <ShoppingCart className="h-5 w-5 text-gray-500" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{order.customer?.name || 'Guest Customer'}</p>
                          <p className="text-sm text-gray-500">
                            {order.items?.length || 0} item{order.items?.length !== 1 ? 's' : ''} • {formatDate(order.createdAt)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900">{formatPrice(order.total)}</p>
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full capitalize ${statusStyle.bg} ${statusStyle.text}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${statusStyle.dot}`}></span>
                          {order.status}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Top Products</h2>
              <p className="text-sm text-gray-500">Best selling items</p>
            </div>
            <Link href="/dashboard/products" className="flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700">
              View All
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          
          {topProducts.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Package className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No products yet</h3>
              <Link
                href="/dashboard/products/new"
                className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700"
              >
                <Plus className="h-4 w-4" />
                Add your first product
              </Link>
            </div>
          ) : (
            <div className="p-4 space-y-3">
              {topProducts.map((product, idx) => (
                <div key={product._id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors">
                  <div className="relative">
                    <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center overflow-hidden">
                      {product.images?.[0] ? (
                        <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
                      ) : (
                        <Package className="h-6 w-6 text-gray-400" />
                      )}
                    </div>
                    <span className="absolute -top-1 -left-1 w-5 h-5 bg-gray-900 text-white text-xs font-bold rounded-full flex items-center justify-center">
                      {idx + 1}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">{product.name}</p>
                    <p className="text-sm text-gray-500">{formatPrice(product.price)}</p>
                  </div>
                  <div className="text-right">
                    {product.inventory <= 5 ? (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-600">
                        <AlertTriangle className="h-3 w-3" />
                        {product.inventory}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600">
                        <CheckCircle className="h-3 w-3" />
                        {product.inventory}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Link
          href="/dashboard/products/new"
          className="group bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl p-6 text-white hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 hover:-translate-y-1"
        >
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-white/20 backdrop-blur rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <Plus className="h-7 w-7" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">Add New Product</h3>
              <p className="text-blue-100 text-sm">Create a new product listing</p>
            </div>
          </div>
        </Link>

        <Link
          href="/dashboard/orders"
          className="group bg-gradient-to-br from-emerald-600 to-teal-600 rounded-2xl p-6 text-white hover:from-emerald-700 hover:to-teal-700 transition-all shadow-lg shadow-emerald-500/30 hover:shadow-xl hover:shadow-emerald-500/40 hover:-translate-y-1"
        >
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-white/20 backdrop-blur rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <ShoppingCart className="h-7 w-7" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">Manage Orders</h3>
              <p className="text-emerald-100 text-sm">
                {stats.pendingOrders > 0 ? `${stats.pendingOrders} orders to process` : 'All orders fulfilled'}
              </p>
            </div>
          </div>
        </Link>

        <Link
          href="/dashboard/analytics"
          className="group bg-gradient-to-br from-purple-600 to-pink-600 rounded-2xl p-6 text-white hover:from-purple-700 hover:to-pink-700 transition-all shadow-lg shadow-purple-500/30 hover:shadow-xl hover:shadow-purple-500/40 hover:-translate-y-1"
        >
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-white/20 backdrop-blur rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <BarChart3 className="h-7 w-7" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">View Analytics</h3>
              <p className="text-purple-100 text-sm">Track your store performance</p>
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
}
