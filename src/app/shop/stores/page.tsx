'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, Store, ArrowLeft, ShoppingBag, Sparkles, Globe } from 'lucide-react';

interface StoreData {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  logo?: string;
  banner?: string;
  isActive: boolean;
  productCount?: number;
}

export default function StoresPage() {
  const [stores, setStores] = useState<StoreData[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    fetchStores();
    setTimeout(() => setIsVisible(true), 100);
  }, []);

  const fetchStores = async () => {
    try {
      const res = await fetch('/api/public/stores');
      if (res.ok) {
        const data = await res.json();
        setStores(data.filter((s: StoreData) => s.isActive !== false));
      }
    } catch (error) {
      console.error('Error fetching stores:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredStores = stores.filter((store) =>
    store.name.toLowerCase().includes(search.toLowerCase()) ||
    store.description?.toLowerCase().includes(search.toLowerCase())
  );

  const gradientColors = [
    'from-purple-600 to-pink-600',
    'from-blue-600 to-cyan-600',
    'from-orange-600 to-red-600',
    'from-green-600 to-teal-600',
    'from-indigo-600 to-purple-600',
    'from-pink-600 to-rose-600',
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>

      {/* Header */}
      <header className="relative z-50 bg-white/5 backdrop-blur-xl border-b border-white/10 sticky top-0">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/shop" className="flex items-center gap-2 text-white hover:text-purple-300 transition-colors">
              <ArrowLeft className="h-5 w-5" />
              <span className="font-medium">Back to Shop</span>
            </Link>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-white/40" />
              <input
                type="text"
                placeholder="Search stores..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-full w-64 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white/20 text-white placeholder-white/40 backdrop-blur-sm transition-all"
              />
            </div>
          </div>
        </div>
      </header>

      <main className="relative z-10 max-w-7xl mx-auto px-4 py-12">
        {/* Hero */}
        <div className={`text-center mb-16 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full border border-white/20 mb-6">
            <Globe className="h-4 w-4 text-purple-400" />
            <span className="text-white/90 text-sm font-medium">{stores.length} Active Stores</span>
          </div>
          
          <h1 className="text-5xl md:text-6xl font-bold mb-6">
            <span className="bg-gradient-to-r from-white via-purple-200 to-pink-200 bg-clip-text text-transparent">
              Discover Our
            </span>
            <br />
            <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-red-400 bg-clip-text text-transparent">
              Partner Stores
            </span>
          </h1>
          
          <p className="text-xl text-white/60 max-w-2xl mx-auto">
            Each store is independently operated with unique products and branding. 
            Shop from multiple vendors in one seamless experience.
          </p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-80 bg-white/5 rounded-3xl animate-pulse border border-white/10" />
            ))}
          </div>
        ) : filteredStores.length === 0 ? (
          <div className="text-center py-20">
            <Store className="h-24 w-24 text-white/20 mx-auto mb-6" />
            <h3 className="text-3xl font-bold text-white mb-4">
              {search ? 'No Stores Found' : 'No Stores Yet'}
            </h3>
            <p className="text-white/60 text-lg mb-8 max-w-md mx-auto">
              {search 
                ? 'Try adjusting your search terms.' 
                : 'Be the first to create a store and start selling on our platform!'}
            </p>
            {!search && (
              <Link 
                href="/register" 
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-xl hover:opacity-90 transition-opacity"
              >
                <Sparkles className="h-5 w-5" />
                Create First Store
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredStores.map((store, index) => {
              const gradient = gradientColors[index % gradientColors.length];
              return (
                <Link
                  key={store._id}
                  href={`/shop/${store.slug}`}
                  className={`group relative h-80 rounded-3xl overflow-hidden border border-white/10 hover:border-transparent transition-all duration-500 hover:scale-[1.03] hover:shadow-2xl hover:shadow-purple-500/20 ${
                    isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
                  }`}
                  style={{ transitionDelay: `${index * 100}ms` }}
                >
                  {/* Gradient Background */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-80`} />
                  
                  {/* Pattern Overlay */}
                  <div className="absolute inset-0 opacity-10">
                    <div className="absolute inset-0" style={{
                      backgroundImage: `radial-gradient(circle at 2px 2px, rgba(255,255,255,0.5) 1px, transparent 0)`,
                      backgroundSize: '24px 24px'
                    }}></div>
                  </div>
                  
                  {/* Store Logo */}
                  <div className="absolute top-6 left-6">
                    <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-xl border border-white/30 group-hover:scale-110 transition-transform duration-300">
                      {store.logo ? (
                        <img src={store.logo} alt={store.name} className="w-full h-full object-cover rounded-2xl" />
                      ) : (
                        <Store className="h-8 w-8 text-white" />
                      )}
                    </div>
                  </div>

                  {/* Badge */}
                  <div className="absolute top-6 right-6">
                    <span className="px-3 py-1.5 bg-white/20 backdrop-blur-sm rounded-full text-white text-xs font-medium border border-white/30 flex items-center gap-1">
                      <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                      Active
                    </span>
                  </div>
                  
                  {/* Content */}
                  <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/60 via-black/30 to-transparent">
                    <h3 className="text-2xl font-bold text-white mb-2 group-hover:text-purple-200 transition-colors">
                      {store.name}
                    </h3>
                    {store.description && (
                      <p className="text-white/80 text-sm line-clamp-2 mb-4">
                        {store.description}
                      </p>
                    )}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 text-white/80 text-sm">
                        <span className="flex items-center gap-1.5 bg-white/10 backdrop-blur-sm px-3 py-1 rounded-full border border-white/20">
                          <ShoppingBag className="h-4 w-4" />
                          {store.productCount || 0} products
                        </span>
                      </div>
                      <span className="flex items-center gap-1 text-white font-medium text-sm group-hover:gap-2 transition-all">
                        Visit Store
                        <ArrowLeft className="h-4 w-4 rotate-180" />
                      </span>
                    </div>
                  </div>
                  
                  {/* Hover Glow */}
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
                    <div className={`absolute -inset-1 bg-gradient-to-r ${gradient} opacity-30 blur-xl rounded-3xl`}></div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        {/* Stats Section */}
        {filteredStores.length > 0 && (
          <div className={`mt-20 grid grid-cols-1 md:grid-cols-3 gap-6 transition-all duration-1000 delay-500 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            <div className="text-center p-8 bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10">
              <div className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-2">
                {stores.length}
              </div>
              <div className="text-white/60">Partner Stores</div>
            </div>
            <div className="text-center p-8 bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10">
              <div className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent mb-2">
                {stores.reduce((sum, s) => sum + (s.productCount || 0), 0)}
              </div>
              <div className="text-white/60">Total Products</div>
            </div>
            <div className="text-center p-8 bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10">
              <div className="text-4xl font-bold bg-gradient-to-r from-green-400 to-teal-400 bg-clip-text text-transparent mb-2">
                100%
              </div>
              <div className="text-white/60">Secure Checkout</div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/10 bg-black/20 backdrop-blur-sm mt-20">
        <div className="max-w-7xl mx-auto px-4 py-8 text-center">
          <p className="text-white/40 text-sm">
            © 2026 MultiStore Platform. Powered by Judith Foods.
          </p>
        </div>
      </footer>

      <style jsx global>{`
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
}
