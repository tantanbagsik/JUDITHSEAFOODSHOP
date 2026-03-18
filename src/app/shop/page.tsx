'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { ShoppingCart, Store, Search, Star, ArrowRight, Layers, Zap, Globe, ChevronRight, Sparkles } from 'lucide-react';
import { addToCart, getCartCount } from '@/lib/cart';

interface Store {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  logo?: string;
  banner?: string;
  productCount?: number;
  isActive?: boolean;
}

interface Product {
  _id: string;
  name: string;
  price: number;
  images: string[];
  storeId: string;
  storeName?: string;
  inventory: number;
  isActive: boolean;
  isFeatured?: boolean;
}

export default function ShopPage() {
  const [stores, setStores] = useState<Store[]>([]);
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [cartCount, setCartCount] = useState(0);
  const [activeStoreIndex, setActiveStoreIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const storeRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    fetchData();
    updateCartCount();
    setIsVisible(true);
    
    const handleCartUpdate = () => updateCartCount();
    window.addEventListener('cartUpdated', handleCartUpdate);
    return () => window.removeEventListener('cartUpdated', handleCartUpdate);
  }, []);

  const updateCartCount = () => {
    setCartCount(getCartCount());
  };

  const fetchData = async () => {
    try {
      const [storesRes, productsRes] = await Promise.all([
        fetch('/api/public/stores'),
        fetch('/api/products?active=true'),
      ]);
      
      if (storesRes.ok) {
        const storesData = await storesRes.json();
        setStores(storesData.filter((s: Store) => s.isActive !== false));
      }
      
      if (productsRes.ok) {
        const productsData = await productsRes.json();
        const activeProducts = productsData.filter((p: Product) => p.isActive && p.inventory > 0);
        const featured = activeProducts.filter((p: Product) => p.isFeatured).slice(0, 8);
        setFeaturedProducts(featured.length > 0 ? featured : activeProducts.slice(0, 8));
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = (product: Product, store: Store) => {
    addToCart(store._id, store.name, store.slug, {
      _id: product._id,
      name: product.name,
      price: product.price,
      images: product.images,
      inventory: product.inventory,
      quantity: 1,
    });
    updateCartCount();
    window.dispatchEvent(new Event('cartUpdated'));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-purple-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-40 right-20 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute bottom-20 left-1/3 w-80 h-80 bg-pink-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
        
        {/* Floating Grid */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)',
            backgroundSize: '50px 50px'
          }}></div>
        </div>
      </div>

      {/* Header */}
      <header className="relative z-50 bg-white/10 backdrop-blur-xl border-b border-white/10 sticky top-0">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="relative">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/30 group-hover:shadow-purple-500/50 transition-all duration-300 group-hover:scale-110">
                  <Layers className="h-6 w-6 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-400 rounded-full animate-bounce"></div>
              </div>
              <div>
                <span className="text-2xl font-bold bg-gradient-to-r from-white via-purple-200 to-pink-200 bg-clip-text text-transparent">
                  MultiStore
                </span>
                <p className="text-xs text-white/60">Multi-Tenant E-Commerce</p>
              </div>
            </Link>
            
            <div className="flex items-center gap-4">
              <Link 
                href="/shop/stores" 
                className="hidden sm:flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-full text-white/90 hover:text-white transition-all duration-300 backdrop-blur-sm"
              >
                <Globe className="h-4 w-4" />
                Browse Stores
              </Link>
              <Link href="/shop/cart" className="relative p-3 bg-white/10 hover:bg-white/20 border border-white/20 rounded-full transition-all duration-300 backdrop-blur-sm group">
                <ShoppingCart className="h-5 w-5 text-white/90 group-hover:text-white" />
                {cartCount > 0 && (
                  <span className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-r from-pink-500 to-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center animate-bounce shadow-lg">
                    {cartCount}
                  </span>
                )}
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative z-10 py-20 px-4">
        <div className={`max-w-7xl mx-auto text-center transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full border border-white/20 mb-8">
            <Sparkles className="h-4 w-4 text-yellow-400 animate-pulse" />
            <span className="text-white/90 text-sm font-medium">The Future of E-Commerce</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold mb-6">
            <span className="bg-gradient-to-r from-white via-purple-200 to-pink-200 bg-clip-text text-transparent">
              One Platform,
            </span>
            <br />
            <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-red-400 bg-clip-text text-transparent animate-gradient-x">
              Infinite Stores
            </span>
          </h1>
          
          <p className="text-xl text-white/70 max-w-2xl mx-auto mb-10">
            Experience seamless shopping across multiple independent stores. 
            Each vendor has their own branded storefront, all in one marketplace.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link 
              href="/shop/stores" 
              className="group px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-2xl shadow-2xl shadow-purple-500/30 hover:shadow-purple-500/50 transition-all duration-300 hover:scale-105 flex items-center gap-2"
            >
              Explore All Stores
              <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link 
              href="/register" 
              className="px-8 py-4 bg-white/10 backdrop-blur-sm border border-white/20 text-white font-semibold rounded-2xl hover:bg-white/20 transition-all duration-300"
            >
              Start Your Store
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="relative z-10 py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { icon: Store, title: 'Independent Stores', desc: 'Each vendor runs their own branded storefront with full customization' },
              { icon: Zap, title: 'Instant Setup', desc: 'Create your store in seconds with our streamlined onboarding' },
              { icon: Globe, title: 'One Marketplace', desc: 'Shop from multiple stores in one seamless experience' },
            ].map((feature, i) => (
              <div 
                key={i}
                className={`group p-6 bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl hover:bg-white/10 transition-all duration-500 hover:scale-105 hover:border-purple-500/50 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
                style={{ transitionDelay: `${i * 100}ms` }}
              >
                <div className="w-14 h-14 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-xl flex items-center justify-center mb-4 group-hover:from-purple-500/30 group-hover:to-pink-500/30 transition-all">
                  <feature.icon className="h-7 w-7 text-purple-400" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">{feature.title}</h3>
                <p className="text-white/60">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 3D Store Showcase */}
      <section className="relative z-10 py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent mb-4">
              Featured Stores
            </h2>
            <p className="text-white/60">Click to explore each unique storefront</p>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="h-80 bg-white/5 rounded-3xl animate-pulse border border-white/10" />
              ))}
            </div>
          ) : stores.length === 0 ? (
            <div className="text-center py-20">
              <Store className="h-20 w-20 text-white/20 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-white mb-2">No Stores Yet</h3>
              <p className="text-white/60 mb-6">Be the first to create a store on our platform!</p>
              <Link href="/register" className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors">
                Create Store
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {stores.slice(0, 6).map((store, index) => (
                <Link
                  key={store._id}
                  href={`/shop/${store.slug}`}
                  className="group relative h-80 rounded-3xl overflow-hidden border border-white/10 hover:border-purple-500/50 transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl hover:shadow-purple-500/20"
                  style={{
                    animation: `float ${3 + index * 0.5}s ease-in-out infinite`,
                    animationDelay: `${index * 0.2}s`,
                  }}
                >
                  {/* Background Pattern */}
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-900/50 to-pink-900/50">
                    <div className="absolute inset-0 opacity-10" style={{
                      backgroundImage: `radial-gradient(circle at 2px 2px, rgba(255,255,255,0.3) 1px, transparent 0)`,
                      backgroundSize: '20px 20px'
                    }}></div>
                  </div>
                  
                  {/* Store Logo */}
                  <div className="absolute top-6 left-6">
                    <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-xl shadow-purple-500/30 group-hover:shadow-pink-500/40 transition-all group-hover:scale-110">
                      {store.logo ? (
                        <img src={store.logo} alt={store.name} className="w-full h-full object-cover rounded-2xl" />
                      ) : (
                        <Store className="h-10 w-10 text-white" />
                      )}
                    </div>
                  </div>
                  
                  {/* Content */}
                  <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 via-black/50 to-transparent">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="px-2 py-1 bg-purple-500/30 rounded-full text-xs text-purple-200 backdrop-blur-sm">
                        Active Store
                      </span>
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-2 group-hover:text-purple-200 transition-colors">
                      {store.name}
                    </h3>
                    {store.description && (
                      <p className="text-white/70 text-sm line-clamp-2 mb-3">
                        {store.description}
                      </p>
                    )}
                    <div className="flex items-center justify-between">
                      <span className="text-white/60 text-sm flex items-center gap-1">
                        <ShoppingCart className="h-4 w-4" />
                        {store.productCount || 0} products
                      </span>
                      <span className="flex items-center gap-1 text-purple-300 text-sm font-medium group-hover:gap-2 transition-all">
                        Visit Store
                        <ChevronRight className="h-4 w-4" />
                      </span>
                    </div>
                  </div>
                  
                  {/* Hover Glow */}
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
                    <div className="absolute -inset-1 bg-gradient-to-r from-purple-500/20 via-pink-500/20 to-purple-500/20 rounded-3xl blur-xl"></div>
                  </div>
                </Link>
              ))}
            </div>
          )}
          
          {stores.length > 6 && (
            <div className="text-center mt-10">
              <Link 
                href="/shop/stores" 
                className="inline-flex items-center gap-2 px-6 py-3 bg-white/10 backdrop-blur-sm border border-white/20 text-white rounded-xl hover:bg-white/20 transition-all"
              >
                View All {stores.length} Stores
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Featured Products */}
      {featuredProducts.length > 0 && (
        <section className="relative z-10 py-20 px-4">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent mb-4">
                Featured Products
              </h2>
              <p className="text-white/60">Handpicked items from our top stores</p>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {featuredProducts.slice(0, 8).map((product, index) => {
                const store = stores.find(s => s._id === product.storeId);
                return (
                  <div 
                    key={product._id}
                    className="group bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl overflow-hidden hover:bg-white/10 hover:border-purple-500/30 transition-all duration-300 hover:scale-[1.02]"
                    style={{
                      animation: `fadeInUp 0.5s ease-out forwards`,
                      animationDelay: `${index * 0.1}s`,
                    }}
                  >
                    <div className="aspect-square relative bg-gradient-to-br from-gray-800 to-gray-900">
                      {product.images[0] ? (
                        <img 
                          src={product.images[0]} 
                          alt={product.name} 
                          className="w-full h-full object-cover opacity-90 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Store className="h-12 w-12 text-white/20" />
                        </div>
                      )}
                      {product.isFeatured && (
                        <span className="absolute top-2 left-2 px-2 py-1 bg-yellow-500/90 text-yellow-900 text-xs font-bold rounded-full flex items-center gap-1">
                          <Star className="h-3 w-3 fill-current" />
                          Featured
                        </span>
                      )}
                    </div>
                    <div className="p-4">
                      <p className="text-purple-400 text-xs mb-1 truncate">{store?.name || 'Store'}</p>
                      <h3 className="font-semibold text-white truncate mb-2">{product.name}</h3>
                      <div className="flex items-center justify-between">
                        <span className="text-lg font-bold bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent">
                          ₱{product.price.toFixed(2)}
                        </span>
                        <button
                          onClick={() => store && handleAddToCart(product, store)}
                          disabled={product.inventory === 0}
                          className="px-3 py-1.5 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
                        >
                          {product.inventory === 0 ? 'Out' : 'Add'}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* CTA Section */}
      <section className="relative z-10 py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="relative p-12 rounded-3xl overflow-hidden border border-purple-500/30">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-600/20 to-pink-600/20"></div>
            <div className="absolute -top-20 -right-20 w-40 h-40 bg-purple-500/30 rounded-full blur-3xl"></div>
            <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-pink-500/30 rounded-full blur-3xl"></div>
            
            <div className="relative text-center">
              <h2 className="text-4xl font-bold text-white mb-4">
                Ready to Start Selling?
              </h2>
              <p className="text-white/70 text-lg mb-8 max-w-2xl mx-auto">
                Join our multi-tenant marketplace and launch your own branded store in minutes. 
                No coding required.
              </p>
              <Link 
                href="/register" 
                className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-2xl shadow-2xl shadow-purple-500/30 hover:shadow-purple-500/50 transition-all duration-300 hover:scale-105"
              >
                Create Your Store
                <ArrowRight className="h-5 w-5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/10 bg-black/20 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                <Layers className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold text-white">MultiStore</span>
            </div>
            <div className="flex items-center gap-6 text-white/60 text-sm">
              <span>{stores.length} Active Stores</span>
              <span>•</span>
              <span>Powered by Judith Foods</span>
            </div>
          </div>
        </div>
      </footer>

      {/* CSS Animations */}
      <style jsx global>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes gradient-x {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        
        .animate-gradient-x {
          background-size: 200% 200%;
          animation: gradient-x 3s ease infinite;
        }
        
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
