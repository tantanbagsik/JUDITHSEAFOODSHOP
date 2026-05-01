'use client';

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import {
  Search,
  ShoppingCart,
  Menu,
  X,
  Package,
  Truck,
  Shield,
  RefreshCw,
  ArrowRight,
  Store as StoreIcon,
  Fish,
  Star,
  Users,
  Award,
  BadgeCheck,
  TrendingUp,
  Phone,
  Mail,
  MapPin,
  Facebook,
  Instagram,
  Twitter,
  User,
} from 'lucide-react';
import { addToCart, getCartCount } from '@/lib/cart';
import { useToastStore } from '@/lib/store/toast';

interface Product {
  _id: string;
  name: string;
  description?: string;
  price: number;
  comparePrice?: number;
  images: string[];
  inventory: number;
  isActive: boolean;
  isFeatured?: boolean;
  storeId: { _id: string; name: string; slug: string; logo?: string };
  categoryId?: { _id: string; name: string };
}

interface Store {
  _id: string;
  name: string;
  slug: string;
  logo?: string;
  description?: string;
  productCount?: number;
}

export default function Home() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [products, setProducts] = useState<Product[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedStore, setSelectedStore] = useState<string | null>(null);
  const [cartCount, setCartCount] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const heroRef = useRef<HTMLDivElement>(null);
  const addToast = useToastStore((state) => state.addToast);

  useEffect(() => {
    fetchData();
    updateCartCount();
    const handleScroll = () => setScrolled(window.scrollY > 20);
    const handleCartUpdate = () => updateCartCount();
    window.addEventListener('scroll', handleScroll);
    window.addEventListener('cartUpdated', handleCartUpdate);
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('cartUpdated', handleCartUpdate);
    };
  }, []);

  const updateCartCount = useCallback(() => {
    const count = getCartCount();
    setCartCount(count);
  }, []);

  const fetchData = async () => {
    try {
      const res = await fetch('/api/homepage-data');
      if (res.ok) {
        const data = await res.json();
        setStores(data.stores);
        setProducts(data.products);
        setFeaturedProducts(data.featuredProducts);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = useMemo(() => products.filter(p => {
    const matchesSearch = !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.description?.toLowerCase().includes(search.toLowerCase());
    const matchesStore = !selectedStore || p.storeId?._id === selectedStore;
    return matchesSearch && matchesStore;
  }), [products, search, selectedStore]);

  const searchSuggestions = useMemo(() => {
    if (search.length < 2) return [];
    return products.filter(p =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.description?.toLowerCase().includes(search.toLowerCase())
    ).slice(0, 8);
  }, [products, search]);

  const formatPrice = (price: number) => `₱${price.toFixed(2)}`;

  const handleAddToCart = useCallback((product: Product) => {
    addToCart(product.storeId._id, product.storeId.name, product.storeId.slug, {
      _id: product._id,
      name: product.name,
      price: product.price,
      images: product.images,
      inventory: product.inventory,
      quantity: 1,
    });
    updateCartCount();
    addToast(`${product.name} added to cart!`, 'success');
  }, [updateCartCount, addToast]);

  const handleCartClick = () => {
    router.push('/shop/cart');
  };

  const handleSignOut = async () => {
    const { signOut } = await import('next-auth/react');
    await signOut({ redirect: true, callbackUrl: '/' });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="relative w-16 h-16 mx-auto">
            <div className="absolute inset-0 border-4 border-blue-200 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-transparent border-t-blue-600 rounded-full animate-spin"></div>
          </div>
          <p className="mt-4 text-gray-500 font-medium">Loading fresh seafood...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-white/95 backdrop-blur-md shadow-lg' : 'bg-transparent'}`}>
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-16 md:h-20">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="relative">
                <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/25 group-hover:shadow-blue-500/40 transition-all group-hover:scale-105">
                  <Fish className="h-5 w-5 md:h-6 md:w-6 text-white" />
                </div>
              </div>
              <div>
                <span className={`text-xl md:text-2xl font-bold transition-colors ${scrolled ? 'text-gray-900' : 'text-white'}`}>Judith</span>
                <span className={`text-xl md:text-2xl font-light transition-colors ${scrolled ? 'text-blue-600' : 'text-cyan-300'}`}>Seafoods</span>
              </div>
            </Link>

            <div className="hidden lg:flex items-center flex-1 max-w-xl mx-8">
              <div className="relative w-full">
                <div className={`flex items-center rounded-2xl transition-all ${scrolled ? 'bg-gray-100' : 'bg-white/15 backdrop-blur-sm border border-white/20'}`}>
                  <Search className={`ml-4 h-5 w-5 ${scrolled ? 'text-gray-400' : 'text-white/70'}`} />
                  <input
                    type="text"
                    placeholder="Search fresh seafood..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    onFocus={() => setShowSuggestions(true)}
                    onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                    className={`w-full px-4 py-3 bg-transparent focus:outline-none ${scrolled ? 'text-gray-900 placeholder-gray-400' : 'text-white placeholder-white/60'}`}
                  />
                </div>
                {showSuggestions && searchSuggestions.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-gray-100 py-2 z-50 max-h-96 overflow-y-auto">
                    {searchSuggestions.map((product) => (
                      <Link
                        key={product._id}
                        href={`/shop/${product.storeId?.slug}`}
                        className="flex items-center gap-3 px-4 py-3 hover:bg-blue-50 transition-colors"
                        onClick={() => setShowSuggestions(false)}
                      >
                        <div className="w-12 h-12 bg-gray-100 rounded-xl overflow-hidden flex-shrink-0">
                          {product.images[0] ? (
                            <img src={product.images[0]} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <Package className="w-full h-full p-2 text-gray-400" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm text-gray-900 truncate">{product.name}</p>
                          <p className="text-xs text-gray-500">{product.storeId?.name}</p>
                        </div>
                        <span className="text-blue-600 font-bold">{formatPrice(product.price)}</span>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 md:gap-4">
              {status === 'authenticated' && session?.user ? (
                <div className="hidden md:flex items-center gap-2">
                  <Link href="/dashboard" className={`px-4 py-2 rounded-xl font-medium transition-all ${scrolled ? 'text-gray-700 hover:text-blue-600 hover:bg-blue-50' : 'text-white/90 hover:text-white hover:bg-white/10'}`}>
                    Dashboard
                  </Link>
                  <Link href="/dashboard/profile" className={`px-4 py-2 rounded-xl font-medium transition-all ${scrolled ? 'text-gray-700 hover:text-blue-600 hover:bg-blue-50' : 'text-white/90 hover:text-white hover:bg-white/10'}`}>
                    Profile
                  </Link>
                  <button
                    onClick={handleSignOut}
                    className={`px-4 py-2 rounded-xl font-medium transition-all ${scrolled ? 'text-red-600 hover:bg-red-50' : 'text-red-300 hover:text-red-200'}`}
                  >
                    Sign Out
                  </button>
                </div>
              ) : (
                <div className="hidden md:flex items-center gap-2">
                  <Link href="/login" className={`px-4 py-2 rounded-xl font-medium transition-all ${scrolled ? 'text-gray-700 hover:text-blue-600 hover:bg-blue-50' : 'text-white/90 hover:text-white hover:bg-white/10'}`}>
                    Sign In
                  </Link>
                  <Link href="/register" className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-blue-500/25 hover:scale-105 transition-all">
                    Get Started
                  </Link>
                </div>
              )}
              <button
                onClick={handleCartClick}
                className={`relative p-2.5 rounded-xl transition-all ${scrolled ? 'hover:bg-gray-100' : 'hover:bg-white/10'}`}
              >
                <ShoppingCart className={`h-6 w-6 ${scrolled ? 'text-gray-700' : 'text-white'}`} />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center shadow-lg animate-pulse">
                    {cartCount}
                  </span>
                )}
              </button>
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className={`md:hidden p-2.5 rounded-xl transition-all ${scrolled ? 'hover:bg-gray-100' : 'hover:bg-white/10'}`}
              >
                {mobileMenuOpen ? <X className={`h-6 w-6 ${scrolled ? 'text-gray-700' : 'text-white'}`} /> : <Menu className={`h-6 w-6 ${scrolled ? 'text-gray-700' : 'text-white'}`} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-t shadow-xl">
            <div className="p-4 space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search products..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="pt-2 border-t">
                <p className="text-sm font-semibold text-gray-500 mb-2 px-1">Stores</p>
                <div className="space-y-1 max-h-40 overflow-y-auto">
                  {stores.map((store) => (
                    <Link key={store._id} href={`/shop/${store.slug}`} className="flex items-center gap-3 px-3 py-2 text-gray-700 hover:bg-blue-50 rounded-lg" onClick={() => setMobileMenuOpen(false)}>
                      <StoreIcon className="h-4 w-4 text-blue-600" />
                      <span className="text-sm">{store.name}</span>
                    </Link>
                  ))}
                </div>
              </div>
              {status === 'authenticated' ? (
                <div className="space-y-2 pt-2 border-t">
                  <Link href="/dashboard" className="block w-full py-3 bg-blue-600 text-white rounded-xl font-semibold text-center" onClick={() => setMobileMenuOpen(false)}>
                    Dashboard
                  </Link>
                  <button onClick={() => { handleSignOut(); setMobileMenuOpen(false); }} className="w-full py-3 border-2 border-red-200 text-red-600 rounded-xl font-semibold text-center">
                    Sign Out
                  </button>
                </div>
              ) : (
                <div className="flex gap-2 pt-2 border-t">
                  <Link href="/login" className="flex-1 py-3 border-2 border-gray-200 text-gray-700 rounded-xl font-semibold text-center hover:bg-gray-50" onClick={() => setMobileMenuOpen(false)}>Sign In</Link>
                  <Link href="/register" className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-semibold text-center" onClick={() => setMobileMenuOpen(false)}>Register</Link>
                </div>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Hero Section */}
      <section ref={heroRef} className="relative min-h-screen flex items-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-blue-900 to-cyan-900"></div>
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-cyan-500 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
          <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-purple-500 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
        </div>
        <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.05) 1px, transparent 0)', backgroundSize: '40px 40px' }}></div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 py-32 md:py-40">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full border border-white/20 mb-8">
                <BadgeCheck className="h-4 w-4 text-cyan-400" />
                <span className="text-white/90 text-sm font-medium">Premium Quality Seafood</span>
              </div>
              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white leading-tight mb-6">
                Ocean Fresh
                <br />
                <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
                  To Your Table
                </span>
              </h1>
              <p className="text-lg md:text-xl text-blue-100/80 max-w-xl mx-auto lg:mx-0 mb-10 leading-relaxed">
                Discover the finest selection of fresh seafood sourced directly from local fishermen. Quality guaranteed, delivered to your doorstep.
              </p>
              <div className="flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start">
                <Link href="/shop" className="group w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-bold rounded-2xl shadow-2xl shadow-blue-500/30 hover:shadow-blue-500/50 hover:scale-105 transition-all flex items-center justify-center gap-2">
                  Shop Now
                  <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link href="/register" className="w-full sm:w-auto px-8 py-4 bg-white/10 backdrop-blur-sm border border-white/20 text-white font-bold rounded-2xl hover:bg-white/20 transition-all text-center">
                  Start Selling
                </Link>
              </div>
              <div className="flex items-center gap-8 mt-12 justify-center lg:justify-start">
                <div className="text-center">
                  <p className="text-3xl font-bold text-white">{stores.length}+</p>
                  <p className="text-sm text-blue-200/70">Active Stores</p>
                </div>
                <div className="w-px h-12 bg-white/20"></div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-white">{products.length}+</p>
                  <p className="text-sm text-blue-200/70">Products</p>
                </div>
                <div className="w-px h-12 bg-white/20"></div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-white">24h</p>
                  <p className="text-sm text-blue-200/70">Delivery</p>
                </div>
              </div>
            </div>
            <div className="hidden lg:block relative">
              <div className="relative">
                <div className="absolute -inset-4 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-3xl blur-2xl"></div>
                <div className="relative grid grid-cols-2 gap-4">
                  <div className="space-y-4">
                    <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-3xl p-6 hover:bg-white/15 transition-all hover:scale-105">
                      <Fish className="h-10 w-10 text-cyan-400 mb-3" />
                      <h3 className="text-white font-bold text-lg">Fresh Fish</h3>
                      <p className="text-blue-200/60 text-sm mt-1">Daily catch from local waters</p>
                    </div>
                    <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-3xl p-6 hover:bg-white/15 transition-all hover:scale-105">
                      <Award className="h-10 w-10 text-purple-400 mb-3" />
                      <h3 className="text-white font-bold text-lg">Premium</h3>
                      <p className="text-blue-200/60 text-sm mt-1">Hand-picked quality</p>
                    </div>
                  </div>
                  <div className="space-y-4 mt-8">
                    <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-3xl p-6 hover:bg-white/15 transition-all hover:scale-105">
                      <Truck className="h-10 w-10 text-green-400 mb-3" />
                      <h3 className="text-white font-bold text-lg">Fast Ship</h3>
                      <p className="text-blue-200/60 text-sm mt-1">Express delivery</p>
                    </div>
                    <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-3xl p-6 hover:bg-white/15 transition-all hover:scale-105">
                      <Shield className="h-10 w-10 text-amber-400 mb-3" />
                      <h3 className="text-white font-bold text-lg">Guaranteed</h3>
                      <p className="text-blue-200/60 text-sm mt-1">100% fresh promise</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-white to-transparent"></div>
      </section>

      {/* Stores Section */}
      {stores.length > 0 && (
        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4">
            <div className="text-center mb-12">
              <span className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-full text-sm font-semibold mb-4">
                <StoreIcon className="h-4 w-4" />
                Our Partners
              </span>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Trusted Seafood Stores</h2>
              <p className="text-gray-500 max-w-2xl mx-auto">Browse through our collection of premium seafood vendors, each offering the freshest catch</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
              {stores.map((store, i) => (
                <Link
                  key={store._id}
                  href={`/shop/${store.slug}`}
                  className="group relative bg-gradient-to-br from-gray-50 to-white rounded-2xl border border-gray-100 p-5 text-center hover:border-blue-200 hover:shadow-xl hover:shadow-blue-500/5 hover:-translate-y-1 transition-all duration-300"
                  style={{ animationDelay: `${i * 50}ms` }}
                >
                  <div className="w-16 h-16 mx-auto mb-3 bg-gradient-to-br from-blue-100 to-cyan-100 rounded-2xl flex items-center justify-center overflow-hidden group-hover:scale-110 transition-transform">
                    {store.logo ? (
                      <img src={store.logo} alt={store.name} className="w-full h-full object-cover" />
                    ) : (
                      <StoreIcon className="h-7 w-7 text-blue-600" />
                    )}
                  </div>
                  <h3 className="font-bold text-sm text-gray-900 line-clamp-2 group-hover:text-blue-600 transition-colors">{store.name}</h3>
                  <p className="text-xs text-gray-400 mt-1">{store.productCount || 0} products</p>
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-blue-500/5 to-cyan-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Featured Products */}
      {featuredProducts.length > 0 && (
        <section className="py-20 bg-gradient-to-b from-gray-50 to-white">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex items-center justify-between mb-10">
              <div>
                <span className="inline-flex items-center gap-2 px-4 py-2 bg-amber-50 text-amber-600 rounded-full text-sm font-semibold mb-3">
                  <Star className="h-4 w-4" />
                  Top Picks
                </span>
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900">Featured Products</h2>
                <p className="text-gray-500 mt-2">Handpicked favorites from our best vendors</p>
              </div>
              <Link href="/shop" className="hidden sm:flex items-center gap-2 px-5 py-3 bg-white border border-gray-200 rounded-xl font-semibold text-gray-700 hover:border-blue-300 hover:text-blue-600 hover:shadow-lg transition-all">
                View All
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {featuredProducts.slice(0, 8).map((product) => (
                <div
                  key={product._id}
                  className="group bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-xl hover:shadow-blue-500/5 hover:-translate-y-1 transition-all duration-300"
                >
                  <Link href={`/shop/${product.storeId?.slug}`}>
                    <div className="relative aspect-square bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden">
                      {product.images[0] ? (
                        <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                      ) : (
                        <div className="flex items-center justify-center h-full text-gray-300">
                          <Package className="h-16 w-16" />
                        </div>
                      )}
                      {product.isFeatured && (
                        <span className="absolute top-3 left-3 px-3 py-1 bg-gradient-to-r from-amber-400 to-orange-400 text-white text-xs font-bold rounded-full shadow-lg">
                          Featured
                        </span>
                      )}
                      {product.comparePrice && product.comparePrice > product.price && (
                        <span className="absolute top-3 right-3 px-3 py-1 bg-red-500 text-white text-xs font-bold rounded-full shadow-lg">
                          -{Math.round((1 - product.price / product.comparePrice) * 100)}%
                        </span>
                      )}
                    </div>
                  </Link>
                  <div className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-5 h-5 bg-blue-100 rounded-md flex items-center justify-center overflow-hidden">
                        {product.storeId?.logo ? (
                          <img src={product.storeId.logo} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <StoreIcon className="h-3 w-3 text-blue-600" />
                        )}
                      </div>
                      <Link href={`/shop/${product.storeId?.slug}`}>
                        <span className="text-xs text-gray-500 font-medium truncate hover:text-blue-600">{product.storeId?.name}</span>
                      </Link>
                    </div>
                    <Link href={`/shop/${product.storeId?.slug}`}>
                      <h3 className="font-bold text-gray-900 text-sm line-clamp-2 mb-2 group-hover:text-blue-600 transition-colors">{product.name}</h3>
                    </Link>
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold text-blue-600">{formatPrice(product.price)}</span>
                      {product.comparePrice && product.comparePrice > product.price && (
                        <span className="text-sm text-gray-400 line-through">{formatPrice(product.comparePrice)}</span>
                      )}
                    </div>
                    <button
                      onClick={() => handleAddToCart(product)}
                      disabled={product.inventory === 0}
                      className={`w-full mt-3 py-2.5 rounded-xl font-semibold text-sm transition-colors ${
                        product.inventory === 0
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'bg-blue-600 text-white hover:bg-blue-700'
                      }`}
                    >
                      {product.inventory === 0 ? 'Out of Stock' : 'Add to Cart'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <div className="sm:hidden text-center mt-8">
              <Link href="/shop" className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors">
                View All Products
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Store Filter + All Products */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-10">
            <span className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-50 text-cyan-600 rounded-full text-sm font-semibold mb-4">
              <TrendingUp className="h-4 w-4" />
              Full Catalog
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              {selectedStore ? stores.find(s => s._id === selectedStore)?.name : 'All Products'}
            </h2>
            <p className="text-gray-500">{filteredProducts.length} products available</p>
          </div>

          {stores.length > 1 && (
            <div className="flex items-center gap-2 mb-8 overflow-x-auto pb-2 scrollbar-hide">
              <button
                onClick={() => setSelectedStore(null)}
                className={`px-5 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap transition-all ${!selectedStore ? 'bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-lg shadow-blue-500/25' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
              >
                All Stores
              </button>
              {stores.map((store) => (
                <button
                  key={store._id}
                  onClick={() => setSelectedStore(store._id)}
                  className={`px-5 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap transition-all ${selectedStore === store._id ? 'bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-lg shadow-blue-500/25' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                >
                  {store.name}
                </button>
              ))}
            </div>
          )}

          {filteredProducts.length === 0 ? (
            <div className="text-center py-20">
              <div className="w-24 h-24 bg-gray-100 rounded-3xl flex items-center justify-center mx-auto mb-6">
                <Package className="h-12 w-12 text-gray-300" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">No products found</h3>
              <p className="text-gray-500 mb-6">Try adjusting your search or browse other stores.</p>
              {selectedStore && (
                <button onClick={() => setSelectedStore(null)} className="px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors">
                  View All Stores
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
              {filteredProducts.map((product) => (
                <div
                  key={product._id}
                  className="group bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-xl hover:shadow-blue-500/5 hover:-translate-y-1 transition-all duration-300"
                >
                  <Link href={`/shop/${product.storeId?.slug}`}>
                    <div className="relative aspect-square bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden">
                      {product.images[0] ? (
                        <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                      ) : (
                        <div className="flex items-center justify-center h-full text-gray-300">
                          <Package className="h-16 w-16" />
                        </div>
                      )}
                      {product.inventory === 0 && (
                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center backdrop-blur-sm">
                          <span className="bg-white text-gray-900 font-bold px-4 py-2 rounded-xl text-sm">Out of Stock</span>
                        </div>
                      )}
                      {product.comparePrice && product.comparePrice > product.price && (
                        <span className="absolute top-3 right-3 px-3 py-1 bg-red-500 text-white text-xs font-bold rounded-full shadow-lg">
                          -{Math.round((1 - product.price / product.comparePrice) * 100)}%
                        </span>
                      )}
                    </div>
                  </Link>
                  <div className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-5 h-5 bg-blue-100 rounded-md flex items-center justify-center overflow-hidden">
                        {product.storeId?.logo ? (
                          <img src={product.storeId.logo} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <StoreIcon className="h-3 w-3 text-blue-600" />
                        )}
                      </div>
                      <Link href={`/shop/${product.storeId?.slug}`}>
                        <span className="text-xs text-gray-500 font-medium truncate hover:text-blue-600">{product.storeId?.name}</span>
                      </Link>
                    </div>
                    <Link href={`/shop/${product.storeId?.slug}`}>
                      <h3 className="font-bold text-gray-900 text-sm line-clamp-2 mb-2 group-hover:text-blue-600 transition-colors">{product.name}</h3>
                    </Link>
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold text-blue-600">{formatPrice(product.price)}</span>
                      {product.comparePrice && product.comparePrice > product.price && (
                        <span className="text-sm text-gray-400 line-through">{formatPrice(product.comparePrice)}</span>
                      )}
                    </div>
                    <button
                      onClick={() => handleAddToCart(product)}
                      disabled={product.inventory === 0}
                      className={`w-full mt-3 py-2.5 rounded-xl font-semibold text-sm transition-colors ${
                        product.inventory === 0
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'bg-blue-600 text-white hover:bg-blue-700'
                      }`}
                    >
                      {product.inventory === 0 ? 'Out of Stock' : 'Add to Cart'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Trust Section */}
      <section className="py-20 bg-gradient-to-br from-slate-900 via-blue-900 to-cyan-900 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-96 h-96 bg-blue-500 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 right-0 w-80 h-80 bg-cyan-500 rounded-full blur-3xl"></div>
        </div>
        <div className="relative max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Why Choose Judith Seafoods?</h2>
            <p className="text-blue-200/70 max-w-2xl mx-auto">We deliver the freshest seafood with unmatched quality and service</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
            {[
              { icon: Fish, title: 'Fresh Daily', desc: 'Sourced every morning from local fishermen', color: 'from-cyan-500 to-blue-500' },
              { icon: Truck, title: 'Fast Delivery', desc: 'Same-day delivery within Metro Manila', color: 'from-green-500 to-emerald-500' },
              { icon: Shield, title: 'Quality Check', desc: 'Every product passes strict quality control', color: 'from-amber-500 to-orange-500' },
              { icon: RefreshCw, title: 'Easy Returns', desc: '30-day hassle-free return policy', color: 'from-purple-500 to-pink-500' },
            ].map((item, i) => (
              <div key={i} className="group text-center">
                <div className={`w-16 h-16 mx-auto mb-4 bg-gradient-to-br ${item.color} rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-all duration-300`}>
                  <item.icon className="h-7 w-7 text-white" />
                </div>
                <h3 className="text-white font-bold text-lg mb-2">{item.title}</h3>
                <p className="text-blue-200/60 text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
          <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { icon: StoreIcon, value: `${stores.length}+`, label: 'Active Stores' },
              { icon: Package, value: `${products.length}+`, label: 'Products' },
              { icon: Users, value: '1000+', label: 'Happy Customers' },
              { icon: Award, value: '99%', label: 'Satisfaction Rate' },
            ].map((stat, i) => (
              <div key={i} className="text-center">
                <stat.icon className="h-8 w-8 text-cyan-400 mx-auto mb-3" />
                <p className="text-3xl md:text-4xl font-bold text-white mb-1">{stat.value}</p>
                <p className="text-blue-200/60 text-sm">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-white">
        <div className="max-w-5xl mx-auto px-4">
          <div className="relative bg-gradient-to-br from-blue-600 via-blue-700 to-cyan-600 rounded-3xl p-8 md:p-16 overflow-hidden">
            <div className="absolute -top-20 -right-20 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
            <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-cyan-400/20 rounded-full blur-3xl"></div>
            <div className="relative text-center">
              <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">Ready to Start Selling?</h2>
              <p className="text-blue-100/80 text-lg max-w-2xl mx-auto mb-10">
                Join our marketplace and launch your own seafood store in minutes. Reach thousands of customers looking for fresh, quality seafood.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link href="/register" className="group px-8 py-4 bg-white text-blue-600 font-bold rounded-2xl shadow-2xl hover:shadow-white/25 hover:scale-105 transition-all flex items-center gap-2">
                  Create Your Store
                  <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link href="/shop" className="px-8 py-4 bg-white/10 backdrop-blur-sm border border-white/20 text-white font-bold rounded-2xl hover:bg-white/20 transition-all">
                  Browse Stores
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-950 text-white">
        <div className="max-w-7xl mx-auto px-4 py-16">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
            <div className="md:col-span-1">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-2xl flex items-center justify-center">
                  <Fish className="h-6 w-6 text-white" />
                </div>
                <div>
                  <span className="text-2xl font-bold text-white">Judith</span>
                  <span className="text-2xl font-light text-cyan-400">Seafoods</span>
                </div>
              </div>
              <p className="text-gray-400 text-sm leading-relaxed mb-6">
                The premier destination for fresh, quality seafood delivered directly from local fishermen to your table.
              </p>
              <div className="flex gap-3">
                {[Facebook, Instagram, Twitter].map((Icon, i) => (
                  <a key={i} href="#" className="w-10 h-10 bg-gray-800 rounded-xl flex items-center justify-center text-gray-400 hover:bg-blue-600 hover:text-white transition-all">
                    <Icon className="h-4 w-4" />
                  </a>
                ))}
              </div>
            </div>
            <div>
              <h4 className="font-bold text-white mb-6">Quick Links</h4>
              <ul className="space-y-3">
                {[['Home', '/'], ['Shop', '/shop'], ['About Us', '#'], ['Contact', '#']].map(([label, href]) => (
                  <li key={label}><Link href={href} className="text-gray-400 hover:text-white text-sm transition-colors">{label}</Link></li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-white mb-6">For Sellers</h4>
              <ul className="space-y-3">
                {[['Start Selling', '/register'], ['Seller Dashboard', '/dashboard'], ['Pricing', '#'], ['FAQ', '#']].map(([label, href]) => (
                  <li key={label}><Link href={href} className="text-gray-400 hover:text-white text-sm transition-colors">{label}</Link></li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-white mb-6">Contact Us</h4>
              <ul className="space-y-4">
                <li className="flex items-start gap-3 text-gray-400 text-sm">
                  <MapPin className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
                  <span>Metro Manila, Philippines</span>
                </li>
                <li className="flex items-center gap-3 text-gray-400 text-sm">
                  <Phone className="h-5 w-5 text-blue-500 flex-shrink-0" />
                  <span>+63 912 345 6789</span>
                </li>
                <li className="flex items-center gap-3 text-gray-400 text-sm">
                  <Mail className="h-5 w-5 text-blue-500 flex-shrink-0" />
                  <span>hello@judithseafoods.com</span>
                </li>
              </ul>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t border-gray-800 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-gray-500 text-sm">© 2026 Judith Seafoods. All rights reserved.</p>
            <div className="flex gap-6">
              <a href="#" className="text-gray-500 hover:text-white text-sm transition-colors">Privacy Policy</a>
              <a href="#" className="text-gray-500 hover:text-white text-sm transition-colors">Terms of Service</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
