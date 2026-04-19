'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { 
  ShoppingCart, 
  Search, 
  ArrowLeft, 
  Store, 
  Plus, 
  Minus,
  Star,
  ChevronDown,
  ChevronUp,
  Filter,
  X,
  Heart,
  Share2,
  Eye,
  Package,
  Truck,
  Shield,
  RefreshCw,
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

  useEffect(() => {
    if (storeSlug) {
      fetchStoreData();
    }
    updateCartCount();
  }, [storeSlug]);

  const updateCartCount = () => {
    const count = getCartCount(store?._id);
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
          <Link href="/shop/stores" className="text-blue-600 hover:underline">
            Browse all stores
          </Link>
        </div>
      </div>
    );
  }

  const filteredProducts = getFilteredProducts();

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-4">
            <Link href="/shop/stores" className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
              <ArrowLeft className="h-5 w-5" />
              <span className="hidden sm:inline">All Stores</span>
            </Link>
            
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center overflow-hidden">
                {store.logo ? (
                  <img src={store.logo} alt={store.name} className="w-full h-full object-cover" />
                ) : (
                  <Store className="h-5 w-5 text-white" />
                )}
              </div>
              <div className="hidden sm:block">
                <h1 className="font-bold text-gray-900">{store.name}</h1>
                {store.description && (
                  <p className="text-sm text-gray-500 truncate max-w-xs">{store.description}</p>
                )}
              </div>
            </div>
            
            <Link href="/shop/cart" className="relative p-2 hover:bg-gray-100 rounded-full">
              <ShoppingCart className="h-6 w-6 text-gray-700" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </Link>
          </div>
        </div>
      </header>

      <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-purple-700 text-white py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center">
            <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
              {store.logo ? (
                <img src={store.logo} alt={store.name} className="w-20 h-20 rounded-full object-cover" />
              ) : (
                <Store className="h-12 w-12" />
              )}
            </div>
            <h1 className="text-4xl font-bold mb-3">{store.name}</h1>
            {store.description && (
              <p className="text-blue-100 max-w-2xl mx-auto text-lg mb-6">{store.description}</p>
            )}
            
            <div className="flex justify-center gap-8 text-sm">
              <div className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                <span>{products.length} Products</span>
              </div>
              <div className="flex items-center gap-2">
                <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                <span>4.9 Rating</span>
              </div>
              <div className="flex items-center gap-2">
                <Truck className="h-5 w-5" />
                <span>Fast Delivery</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4">
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
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5 sticky top-24">
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-semibold text-gray-900">Filters</h3>
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="lg:hidden p-1 hover:bg-gray-100 rounded"
                >
                  {showFilters ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                </button>
              </div>

              <div className={`space-y-5 ${showFilters ? 'block' : 'hidden lg:block'}`}>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Search</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search products..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Categories</label>
                  <div className="space-y-1">
                    <button
                      onClick={() => setSelectedCategory(null)}
                      className={`w-full text-left px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                        !selectedCategory
                          ? 'bg-blue-600 text-white'
                          : 'hover:bg-gray-100 text-gray-700'
                      }`}
                    >
                      All Products
                    </button>
                    {categories.map((cat) => (
                      <button
                        key={cat._id}
                        onClick={() => setSelectedCategory(cat._id)}
                        className={`w-full text-left px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                          selectedCategory === cat._id
                            ? 'bg-blue-600 text-white'
                            : 'hover:bg-gray-100 text-gray-700'
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
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  >
                    <option value="newest">Newest First</option>
                    <option value="price-low">Price: Low to High</option>
                    <option value="price-high">Price: High to Low</option>
                    <option value="name">Name: A-Z</option>
                  </select>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="checkbox"
                    id="featured"
                    checked={featuredOnly}
                    onChange={(e) => setFeaturedOnly(e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <label htmlFor="featured" className="text-sm text-gray-700 font-medium">
                    Featured Only
                  </label>
                </div>

                {(selectedCategory || search || featuredOnly) && (
                  <button
                    onClick={() => {
                      setSelectedCategory(null);
                      setSearch('');
                      setFeaturedOnly(false);
                    }}
                    className="w-full py-2.5 text-sm text-red-600 hover:text-red-700 flex items-center justify-center gap-1 bg-red-50 rounded-xl"
                  >
                    <X className="h-4 w-4" />
                    Clear Filters
                  </button>
                )}
              </div>
            </div>
          </aside>

          <div className="flex-1">
            <div className="flex items-center justify-between mb-6">
              <p className="text-gray-600 font-medium">
                {filteredProducts.length} product{filteredProducts.length !== 1 ? 's' : ''}
                {selectedCategory && ` in "${categories.find(c => c._id === selectedCategory)?.name}"`}
              </p>
            </div>

            {filteredProducts.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-16 text-center">
                <Package className="h-20 w-20 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No products found</h3>
                <p className="text-gray-500">
                  {search || selectedCategory
                    ? 'Try adjusting your filters.'
                    : 'This store has no products yet.'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProducts.map((product) => (
                  <div
                    key={product._id}
                    className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden group hover:shadow-xl hover:border-blue-300 transition-all duration-300"
                  >
                    <div className="relative aspect-square bg-gray-100 overflow-hidden">
                      {product.images[0] ? (
                        <img
                          src={product.images[0]}
                          alt={product.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full text-gray-400">
                          <Store className="h-20 w-20" />
                        </div>
                      )}
                      
                      {product.isFeatured && (
                        <span className="absolute top-3 left-3 bg-yellow-400 text-yellow-900 text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1 shadow-md">
                          <Star className="h-3 w-3 fill-current" />
                          Featured
                        </span>
                      )}
                      
                      {product.inventory === 0 && (
                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                          <span className="bg-white text-gray-900 font-bold px-6 py-3 rounded-xl text-lg">
                            Out of Stock
                          </span>
                        </div>
                      )}
                      
                      {product.inventory > 0 && product.inventory <= 5 && (
                        <span className="absolute top-3 right-3 bg-orange-500 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-md animate-pulse">
                          Only {product.inventory} left!
                        </span>
                      )}
                      
                      <div className="absolute top-3 right-3 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => setQuickViewProduct(product)}
                          className="bg-white p-3 rounded-full hover:bg-gray-100 shadow-lg transform translate-y-2 group-hover:translate-y-0 transition-all"
                          title="Quick View"
                        >
                          <Eye className="h-5 w-5 text-gray-700" />
                        </button>
                        <button
                          className="bg-white p-3 rounded-full hover:bg-gray-100 shadow-lg transform translate-y-2 group-hover:translate-y-0 transition-all"
                          title="Add to Wishlist"
                        >
                          <Heart className="h-5 w-5 text-gray-700" />
                        </button>
                      </div>
                    </div>
                    
                    <div className="p-4">
                      {product.categoryId && (
                        <span className="text-xs text-blue-600 font-semibold uppercase tracking-wide">
                          {product.categoryId.name}
                        </span>
                      )}
                      <h3 className="font-bold text-gray-900 text-lg mt-1 line-clamp-2 group-hover:text-blue-600 transition-colors">
                        {product.name}
                      </h3>
                      
                      <div className="flex items-center gap-2 mt-3">
                        <span className="text-xl font-bold text-blue-600">
                          {formatPrice(product.price)}
                        </span>
                        {product.comparePrice && product.comparePrice > product.price && (
                          <span className="text-sm text-gray-400 line-through">
                            {formatPrice(product.comparePrice)}
                          </span>
                        )}
                        {product.comparePrice && product.comparePrice > product.price && (
                          <span className="bg-red-100 text-red-600 text-xs font-bold px-2 py-1 rounded-full">
                            {Math.round((1 - product.price / product.comparePrice) * 100)}% OFF
                          </span>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2 mt-4">
                        <div className="flex items-center border border-gray-300 rounded-lg bg-gray-50">
                          <button
                            onClick={() => setQuantity(Math.max(1, quantity - 1))}
                            disabled={quantity <= 1}
                            className="p-2 hover:bg-gray-100 rounded-l-lg disabled:opacity-50"
                          >
                            <Minus className="h-4 w-4" />
                          </button>
                          <span className="px-3 font-semibold min-w-[40px] text-center">{quantity}</span>
                          <button
                            onClick={() => setQuantity(Math.min(product.inventory, quantity + 1))}
                            disabled={quantity >= product.inventory}
                            className="p-2 hover:bg-gray-100 rounded-r-lg disabled:opacity-50"
                          >
                            <Plus className="h-4 w-4" />
                          </button>
                        </div>
                        
                        <button
                          onClick={() => {
                            handleAddToCart(product, quantity);
                            setQuantity(1);
                          }}
                          disabled={product.inventory === 0}
                          className={`flex-1 py-2.5 rounded-xl font-semibold transition-all ${
                            product.inventory === 0
                              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                              : addedToCart === product._id
                              ? 'bg-green-500 text-white'
                              : 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-500/30'
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
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {quickViewProduct && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <button
              onClick={() => setQuickViewProduct(null)}
              className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full bg-white shadow-lg z-10"
            >
              <X className="h-6 w-6" />
            </button>
            
            <div className="grid grid-cols-1 md:grid-cols-2">
              <div className="aspect-square bg-gray-100 rounded-t-3xl md:rounded-l-3xl md:rounded-tr-none overflow-hidden">
                {quickViewProduct.images[0] ? (
                  <img
                    src={quickViewProduct.images[0]}
                    alt={quickViewProduct.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-400">
                    <Store className="h-24 w-24" />
                  </div>
                )}
              </div>
              
              <div className="p-8">
                {quickViewProduct.categoryId && (
                  <span className="text-sm text-blue-600 font-semibold uppercase tracking-wide">
                    {quickViewProduct.categoryId.name}
                  </span>
                )}
                <h2 className="text-3xl font-bold text-gray-900 mt-2">
                  {quickViewProduct.name}
                </h2>
                
                <div className="flex items-baseline gap-3 mt-4">
                  <span className="text-3xl font-bold text-blue-600">
                    {formatPrice(quickViewProduct.price)}
                  </span>
                  {quickViewProduct.comparePrice && quickViewProduct.comparePrice > quickViewProduct.price && (
                    <>
                      <span className="text-xl text-gray-400 line-through">
                        {formatPrice(quickViewProduct.comparePrice)}
                      </span>
                      <span className="bg-red-100 text-red-600 px-3 py-1 rounded-full text-sm font-bold">
                        {Math.round((1 - quickViewProduct.price / quickViewProduct.comparePrice) * 100)}% OFF
                      </span>
                    </>
                  )}
                </div>

                <div className="mt-5">
                  {quickViewProduct.inventory > 10 && (
                    <span className="inline-flex items-center gap-2 text-green-600 font-semibold">
                      <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                      In Stock
                    </span>
                  )}
                  {quickViewProduct.inventory > 0 && quickViewProduct.inventory <= 10 && (
                    <span className="inline-flex items-center gap-2 text-orange-600 font-semibold">
                      <span className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></span>
                      Only {quickViewProduct.inventory} left!
                    </span>
                  )}
                  {quickViewProduct.inventory === 0 && (
                    <span className="inline-flex items-center gap-2 text-red-600 font-semibold">
                      <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                      Out of Stock
                    </span>
                  )}
                </div>
                
                {quickViewProduct.description && (
                  <p className="text-gray-600 mt-6 leading-relaxed">{quickViewProduct.description}</p>
                )}
                
                <div className="flex items-center gap-3 mt-6">
                  <div className="flex items-center border-2 border-gray-300 rounded-xl bg-gray-50">
                    <button
                      onClick={() => setQvQuantity(Math.max(1, qvQuantity - 1))}
                      disabled={qvQuantity <= 1}
                      className="p-3 hover:bg-gray-100 rounded-l-xl disabled:opacity-50"
                    >
                      <Minus className="h-5 w-5" />
                    </button>
                    <span className="px-5 font-bold text-lg min-w-[50px] text-center">{qvQuantity}</span>
                    <button
                      onClick={() => setQvQuantity(Math.min(quickViewProduct.inventory, qvQuantity + 1))}
                      disabled={qvQuantity >= quickViewProduct.inventory}
                      className="p-3 hover:bg-gray-100 rounded-r-xl disabled:opacity-50"
                    >
                      <Plus className="h-5 w-5" />
                    </button>
                  </div>
                  
                  <button
                    onClick={() => {
                      handleAddToCart(quickViewProduct, qvQuantity);
                      setQuickViewProduct(null);
                      setQvQuantity(1);
                    }}
                    disabled={quickViewProduct.inventory === 0 || qvQuantity > quickViewProduct.inventory}
                    className="flex-1 py-4 bg-blue-600 text-white rounded-xl font-bold text-lg hover:bg-blue-700 shadow-lg shadow-blue-500/30 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    <ShoppingCart className="h-5 w-5" />
                    {quickViewProduct.inventory === 0 ? 'Out of Stock' : 'Add to Cart'}
                  </button>
                </div>
                
                <div className="mt-6 pt-6 border-t border-gray-200 grid grid-cols-3 gap-4 text-center">
                  <div>
                    <Truck className="h-6 w-6 mx-auto text-blue-600 mb-1" />
                    <span className="text-xs text-gray-600">Free Shipping</span>
                  </div>
                  <div>
                    <Shield className="h-6 w-6 mx-auto text-green-600 mb-1" />
                    <span className="text-xs text-gray-600">Secure Pay</span>
                  </div>
                  <div>
                    <RefreshCw className="h-6 w-6 mx-auto text-purple-600 mb-1" />
                    <span className="text-xs text-gray-600">Easy Returns</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <footer className="bg-gray-900 text-white py-12 mt-12">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            {store.logo && (
              <img src={store.logo} alt={store.name} className="h-10 w-10 rounded-full object-cover" />
            )}
            <span className="text-2xl font-bold">{store.name}</span>
          </div>
          <p className="text-gray-400 mb-4">© 2026 {store.name}. All rights reserved.</p>
          <div className="flex justify-center gap-6 text-gray-400">
            <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-white transition-colors">Contact Us</a>
          </div>
        </div>
      </footer>
    </div>
  );
}