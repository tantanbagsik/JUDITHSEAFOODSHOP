'use client';

import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  Users, 
  BarChart3, 
  Menu as MenuIcon, 
  Settings, 
  LogOut,
  Store,
  X,
  Eye,
  ChevronDown,
  Plus,
  ExternalLink,
  Globe,
  LayoutGrid
} from 'lucide-react';
import { useState, useEffect } from 'react';

const mainNav = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Orders', href: '/dashboard/orders', icon: ShoppingCart },
  { name: 'Settings', href: '/dashboard/settings', icon: Settings },
];

interface StoreData {
  _id: string;
  name: string;
  slug: string;
  logo?: string;
  description?: string;
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [store, setStore] = useState<StoreData | null>(null);
  const [profileOpen, setProfileOpen] = useState(false);

  useEffect(() => {
    if (session?.user?.storeId) {
      fetchStore();
    } else if (status === 'authenticated') {
      fetchUserStore();
    }
  }, [session, status]);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  const fetchStore = async () => {
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
    }
  };

  const fetchUserStore = async () => {
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
    }
  };

  const handleSignOut = () => {
    signOut({ callbackUrl: '/' });
  };

  const isActive = (href: string) => {
    return pathname === href || pathname.startsWith(href + '/');
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    router.push('/login');
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50/50">
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <button
                type="button"
                className="lg:hidden p-2 -ml-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                onClick={() => setMobileMenuOpen(true)}
              >
                <MenuIcon className="h-6 w-6" />
              </button>

              <Link href="/dashboard" className="flex items-center gap-3 ml-2 lg:ml-0">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 via-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30">
                  {store?.logo ? (
                    <img src={store.logo} alt={store.name} className="w-6 h-6 object-contain rounded-lg" />
                  ) : (
                    <Store className="h-5 w-5 text-white" />
                  )}
                </div>
                <div className="hidden sm:block">
                  <h1 className="text-lg font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                    {store?.name || 'Judith Foods'}
                  </h1>
                  <p className="text-xs text-gray-500 -mt-0.5">
                    {session.user?.role === 'admin' ? 'Admin' : session.user?.role === 'vendor' ? 'Vendor' : 'Dashboard'}
                  </p>
                </div>
              </Link>
            </div>

            <div className="hidden lg:flex items-center gap-1">
              {mainNav.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                    isActive(item.href)
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <item.icon className="h-4 w-4" />
                  {item.name}
                </Link>
              ))}

<div className="w-px h-6 bg-gray-200 mx-3"></div>

              {store && (
                <Link
                  href={`/shop/${store.slug}`}
                  target="_blank"
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-all"
                >
                  <Globe className="h-4 w-4" />
                  My Store
                </Link>
              )}
            </div>

            <div className="flex items-center gap-2">
<Link
                href="/shop"
                target="_blank"
                className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                title="Browse All Stores"
              >
                <LayoutGrid className="h-5 w-5" />
              </Link>

              <Link
                href={store ? `/shop/${store.slug}` : '/shop'}
                target="_blank"
                className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                title="View Store"
              >
                <Eye className="h-5 w-5" />
              </Link>

              <div className="relative">
                <button
                  onClick={() => setProfileOpen(!profileOpen)}
                  className="flex items-center gap-2 p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-semibold shadow-lg">
                    {session.user?.name?.[0]?.toUpperCase() || 'U'}
                  </div>
                  <ChevronDown className="h-4 w-4 text-gray-500 hidden sm:block" />
                </button>

                {profileOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setProfileOpen(false)} />
                    <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden z-50">
                      <div className="p-4 bg-gradient-to-r from-blue-600 to-indigo-600">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center text-white text-lg font-bold">
                            {session.user?.name?.[0]?.toUpperCase() || 'U'}
                          </div>
                          <div>
                            <p className="font-semibold text-white">{session.user?.name}</p>
                            <p className="text-blue-100 text-sm">{session.user?.email}</p>
                          </div>
                        </div>
                        <div className="mt-3">
                          <span className="inline-flex px-3 py-1 text-xs font-medium bg-white/20 text-white rounded-full capitalize">
                            {session.user?.role}
                          </span>
                        </div>
                      </div>
                      <div className="p-2">
                        {store && (
                          <Link
                            href={`/shop/${store.slug}`}
                            target="_blank"
                            className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                            onClick={() => setProfileOpen(false)}
                          >
                            <Globe className="h-4 w-4 text-indigo-600" />
                            View My Store
                            <ExternalLink className="h-3 w-3 ml-auto text-gray-400" />
                          </Link>
                        )}
                        <Link
                          href="/dashboard/settings"
                          className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                          onClick={() => setProfileOpen(false)}
                        >
                          <Settings className="h-4 w-4 text-gray-500" />
                          Store Settings
                        </Link>
                        <div className="my-2 border-t border-gray-100"></div>
                        <button
                          onClick={handleSignOut}
                          className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <LogOut className="h-4 w-4" />
                          Sign Out
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="lg:hidden border-t border-gray-100 bg-gray-50/50">
          <div className="px-4 py-2 flex gap-1 overflow-x-auto scrollbar-hide">
            {mainNav.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg whitespace-nowrap transition-all ${
                  isActive(item.href)
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
<item.icon className="h-4 w-4" />
                {item.name}
              </Link>
            ))}
          </div>
        </div>
      </nav>

      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)} />
          <div className="fixed inset-y-0 left-0 w-80 max-w-full bg-white shadow-2xl">
            <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-indigo-600">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                  {store?.logo ? (
                    <img src={store.logo} alt={store.name} className="w-6 h-6 object-contain" />
                  ) : (
                    <Store className="h-5 w-5 text-white" />
                  )}
                </div>
                <div>
                  <h1 className="text-lg font-bold text-white">{store?.name || 'Judith Foods'}</h1>
                  <p className="text-xs text-blue-100 capitalize">{session.user?.role}</p>
                </div>
              </div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 text-white/80 hover:text-white hover:bg-white/20 rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

<nav className="p-4 space-y-1">
              {mainNav.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                    isActive(item.href)
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <item.icon className="h-5 w-5" />
                  {item.name}
                </Link>
              ))}
            </nav>

            <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 bg-white">
              <Link
                href={store ? `/shop/${store.slug}` : '/shop'}
                target="_blank"
                className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                <Globe className="h-5 w-5" />
                {store ? 'Visit My Store' : 'Browse Stores'}
              </Link>
            </div>
          </div>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {children}
      </main>
    </div>
  );
}
