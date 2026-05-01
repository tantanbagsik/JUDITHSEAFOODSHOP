'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import {
  ShoppingCart,
  Search,
  ArrowLeft,
  Store,
  Star,
  Filter,
  X,
  Package,
  Truck,
  Shield,
  RefreshCw,
  User,
  LogOut,
  Menu,
} from 'lucide-react';
import { addToCart, getCartCount } from '@/lib/cart';

interface Product {
  _id: string;
  name: string;
  description?: string;
  price: number;
  comparePrice?: number;
  images: string[];
  videos?: string[];
  inventory: number;
  isActive: boolean;
  isFeatured?: boolean;
  categoryId?: { _id: string; name: string; slug: string };
  tags: string[];
}

interface StoreData {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  logo?: string;
  coverImage?: string;
  settings?: {
    currency: string;
    taxRate: number;
  };
}

interface Category {
  _id: string;
  name: string;
  slug: string;
}

export default function StorePage() {
  const params = useParams();
  const router = useRouter();
  const { data: session, status } = useSession();
  const storeSlug = params.storeSlug as string;
  
  const [store, setStore] = useState<StoreData | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'newest' | 'price-low' | 'price-high' | 'name'>('newest');
  const [showFilters, setShowFilters] = useState(false);
  const [featuredOnly, setFeaturedOnly] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [addedToCart, setAddedToCart] = useState<string | null>(null);
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [qvQuantity, setQvQuantity] = useState(1);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (storeSlug) {
      fetchStoreData();
    }
    updateCartCount();
  }, [storeSlug]);

  useEffect(() => {
    window.addEventListener('cartUpdated', updateCartCount);
    return () => window.removeEventListener('cartUpdated', updateCartCount);
  }, []);

  const updateCartCount = () => {
    const count = getCartCount();
    setCartCount(count);
  };

  const fetchStoreData = async () => {
    try {
      const storesRes = await fetch('/api/public/stores');
      if (storesRes.ok) {
        const stores = await storesRes.json();
        const foundStore = stores.find((s: StoreData) => s.slug === storeSlug);
        if (foundStore) {
          setStore(foundStore);
          
          const productsRes = await fetch(`/api/stores/${foundStore._id}/products?storeId=${foundStore._id}&active=true`);
          if (productsRes.ok) {
            const productsData = await productsRes.json();
            setProducts(Array.isArray(productsData) ? productsData.filter((p: Product) => p.isActive) : []);
          }
          
          const categoriesRes = await fetch(`/api/stores/${foundStore._id}/categories?storeId=${foundStore._id}`);
          if (categoriesRes.ok) {
            const categoriesData = await categoriesRes.json();
            setCategories(Array.isArray(categoriesData) ? categoriesData : []);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching store:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = (product: Product, qty: number = 1) => {
    if (!store) return;
    
    addToCart(store._id, store.name, store.slug, {
      _id: product._id,
      name: product.name,
      price: product.price,
      images: product.images,
      inventory: product.inventory,
      quantity: qty,
    });
    
    setCartCount(prev => prev + qty);
    setAddedToCart(product._id);
    setTimeout(() => setAddedToCart(null), 2000);
    window.dispatchEvent(new Event('cartUpdated'));
  };

  const getFilteredProducts = () => {
    let filtered = [...products];
    
    if (search) {
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(search.toLowerCase()) ||
          p.description?.toLowerCase().includes(search.toLowerCase())
      );
    }
    
    if (selectedCategory) {
      filtered = filtered.filter((p) => p.categoryId?._id === selectedCategory);
    }
    
    if (featuredOnly) {
      filtered = filtered.filter((p) => p.isFeatured);
    }
    
    switch (sortBy) {
      case 'price-low':
        filtered.sort((a, b) => a.price - b.price);
        break;
      case 'price-high':
        filtered.sort((a, b) => b.price - a.price);
        break;
      case 'name':
        filtered.sort((a, b) => a.name.localeCompare(b.name));
        break;
      default:
        filtered.sort((a, b) => new Date(b._id).getTime() - new Date(a._id).getTime());
    }
    
    return filtered;
  };

  const formatPrice = (price: number) => {
    const currency = store?.settings?.currency || 'PHP';
    const symbol = currency === 'PHP' ? '₱' : currency === 'USD' ? '$' : currency === 'EUR' ? '€' : '£';
    return `${symbol}${price.toFixed(2)}`;
  };

  const handleCartClick = () => {
    router.push('/shop/cart');
  };

  const handleLogout = async () => {
    await signOut({ redirect: false });
    router.refresh();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!store) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Store className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Store not found</h1>
          <Link href="/" className="text-blue-600 hover:underline">
            Browse all stores
          </Link>
        </div>
      </div>
    );
  }

  const filteredProducts = getFilteredProducts();

  return (
    <div className="min-h-screen bg-white">
      <header className="bg-white border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2">
              <ArrowLeft className="h-5 w-5 text-gray-600" />
              <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center overflow-hidden">
                {store.logo ? (
                  <img src={store.logo} alt={store.name} className="w-full h-full object-cover" />
                ) : (
                  <Store className="h-5 w-5 text-white" />
                )}
              </div>
              <span className="font-bold text-gray-900 hidden sm:block">{store.name}</span>
            </Link>

            <div className="hidden md:flex items-center gap-4">
              {status === 'authenticated' && session?.user ? (
                <div className="relative">
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-full hover:bg-gray-200"
                  >
                    <User className="h-4 w-4" />
                    <span className="text-sm font-medium">{session.user.name || session.user.email}</span>
                  </button>
                  {showUserMenu && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border py-2">
                      <Link href="/dashboard/orders" className="block px-4 py-2 text-sm hover:bg-gray-50">
                        My Orders
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                      >
                        <LogOut className="h-4 w-4 inline mr-2" />
                        Sign Out
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Link href="/login" className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">
                    Sign In
                  </Link>
                  <Link href="/register" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                    Register
                  </Link>
                </div>
              )}
            </div>

            <button
              onClick={handleCartClick}
              className="relative p-2 hover:bg-gray-100 rounded-full"
            >
              <ShoppingCart className="h-6 w-6 text-gray-700" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center gap-6">
            <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
              {store.logo ? (
                <img src={store.logo} alt={store.name} className="w-20 h-20 rounded-full object-cover" />
              ) : (
                <Store className="h-12 w-12" />
              )}
            </div>
            <div>
              <h1 className="text-3xl font-bold mb-2">{store.name}</h1>
              {store.description && (
                <p className="text-blue-100 max-w-xl">{store.description}</p>
              )}
              <div className="flex items-center gap-4 mt-3 text-sm">
                <div className="flex items-center gap-1">
                  <Package className="h-4 w-4" />
                  <span>{products.length} Products</span>
                </div>
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <span>4.9 Rating</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <Truck className="h-4 w-4 text-blue-600" />
                <span>Free Shipping</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-green-600" />
                <span>Secure Payment</span>
              </div>
              <div className="flex items-center gap-2">
                <RefreshCw className="h-4 w-4 text-purple-600" />
                <span>Easy Returns</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          <aside className="lg:w-64 flex-shrink-0">
            <div className="bg-gray-50 rounded-2xl p-5 sticky top-36">
              <div className="relative mb-5">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search products..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm"
                />
              </div>

              <div className="mb-5">
                <h3 className="font-semibold text-gray-900 mb-3">Categories</h3>
                <div className="space-y-1">
                  <button
                    onClick={() => setSelectedCategory(null)}
                    className={`w-full text-left px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                      !selectedCategory ? 'bg-blue-600 text-white' : 'hover:bg-gray-200'
                    }`}
                  >
                    All Products
                  </button>
                  {categories.map((cat) => (
                    <button
                      key={cat._id}
                      onClick={() => setSelectedCategory(cat._id)}
                      className={`w-full text-left px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                        selectedCategory === cat._id ? 'bg-blue-600 text-white' : 'hover:bg-gray-200'
                      }`}
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Sort By</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm"
                >
                  <option value="newest">Newest First</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                  <option value="name">Name: A-Z</option>
                </select>
              </div>
            </div>
          </aside>

          <div className="flex-1">
            <div className="flex items-center justify-between mb-6">
              <p className="text-gray-600 font-medium">
                {filteredProducts.length} product{filteredProducts.length !== 1 ? 's' : ''}
              </p>
            </div>

            {filteredProducts.length === 0 ? (
              <div className="bg-gray-50 rounded-2xl p-16 text-center">
                <Package className="h-20 w-20 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No products found</h3>
                <p className="text-gray-500">This store has no products yet.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredProducts.map((product) => (
                  <div
                    key={product._id}
                    className="bg-white rounded-2xl border border-gray-200 overflow-hidden group hover:shadow-lg transition-shadow"
                  >
                    <div className="relative aspect-square bg-gray-100">
                      {product.images[0] ? (
                        <img
                          src={product.images[0]}
                          alt={product.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full text-gray-400">
                          <Package className="h-16 w-16" />
                        </div>
                      )}
                      
                      {product.isFeatured && (
                        <span className="absolute top-3 left-3 bg-yellow-400 text-yellow-900 text-xs font-bold px-3 py-1 rounded-full">
                          Featured
                        </span>
                      )}
                      
                      {product.inventory === 0 && (
                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                          <span className="bg-white text-gray-900 font-bold px-4 py-2 rounded-xl">
                            Out of Stock
                          </span>
                        </div>
                      )}
                      
                      {product.inventory > 0 && product.inventory <= 5 && (
                        <span className="absolute top-3 right-3 bg-orange-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                          Only {product.inventory} left!
                        </span>
                      )}
                    </div>
                    
                    <div className="p-4">
                      {product.categoryId && (
                        <span className="text-xs text-blue-600 font-semibold uppercase">
                          {product.categoryId.name}
                        </span>
                      )}
                      <h3 className="font-bold text-gray-900 mt-1 line-clamp-2">
                        {product.name}
                      </h3>
                      
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-xl font-bold text-blue-600">
                          {formatPrice(product.price)}
                        </span>
                        {product.comparePrice && product.comparePrice > product.price && (
                          <span className="text-sm text-gray-400 line-through">
                            {formatPrice(product.comparePrice)}
                          </span>
                        )}
                      </div>
                      
                      <button
                        onClick={() => handleAddToCart(product, 1)}
                        disabled={product.inventory === 0}
                        className={`w-full mt-4 py-2.5 rounded-xl font-semibold text-sm transition-colors ${
                          product.inventory === 0
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            : addedToCart === product._id
                            ? 'bg-green-500 text-white'
                            : 'bg-blue-600 text-white hover:bg-blue-700'
                        }`}
                      >
                        {product.inventory === 0
                          ? 'Out of Stock'
                          : addedToCart === product._id
                          ? '✓ Added!'
                          : 'Add to Cart'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      <footer className="bg-gray-900 text-white py-8 mt-12">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            {store.logo && (
              <img src={store.logo} alt={store.name} className="h-8 w-8 rounded-full object-cover" />
            )}
            <span className="text-xl font-bold">{store.name}</span>
          </div>
          <p className="text-gray-400">© 2026 {store.name}. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}