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
} from 'lucide-react';
import { addToCart, getCartCount } from '@/lib/cart';

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
  categoryId?: { _id: string; name: string; slug: string };
  tags: string[];
}

interface StoreData {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  logo?: string;
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

  const handleAddToCart = (product: Product) => {
    if (!store) return;
    
    addToCart(store._id, store.name, store.slug, {
      _id: product._id,
      name: product.name,
      price: product.price,
      images: product.images,
      inventory: product.inventory,
      quantity: 1,
    });
    
    setCartCount(prev => prev + 1);
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!store) {
    return (
      <div className="min-h-screen flex items-center justify-center">
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

      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-2">Welcome to {store.name}</h2>
          {store.description && (
            <p className="text-blue-100 max-w-2xl mx-auto">{store.description}</p>
          )}
          <div className="flex justify-center gap-6 mt-6 text-sm">
            <div className="flex items-center gap-2">
              <Store className="h-4 w-4" />
              <span>{products.length} Products</span>
            </div>
            <div className="flex items-center gap-2">
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              <span>Top Quality</span>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          <aside className="lg:w-64 flex-shrink-0">
            <div className="bg-white rounded-xl shadow-md p-4 sticky top-24">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">Filters</h3>
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="lg:hidden p-1 hover:bg-gray-100 rounded"
                >
                  {showFilters ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                </button>
              </div>

              <div className={`space-y-4 ${showFilters ? 'block' : 'hidden lg:block'}`}>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Search</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search products..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Categories</label>
                  <div className="space-y-1">
                    <button
                      onClick={() => setSelectedCategory(null)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm ${
                        !selectedCategory
                          ? 'bg-blue-100 text-blue-700'
                          : 'hover:bg-gray-100 text-gray-700'
                      }`}
                    >
                      All Products
                    </button>
                    {categories.map((cat) => (
                      <button
                        key={cat._id}
                        onClick={() => setSelectedCategory(cat._id)}
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm ${
                          selectedCategory === cat._id
                            ? 'bg-blue-100 text-blue-700'
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  >
                    <option value="newest">Newest</option>
                    <option value="price-low">Price: Low to High</option>
                    <option value="price-high">Price: High to Low</option>
                    <option value="name">Name: A-Z</option>
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="featured"
                    checked={featuredOnly}
                    onChange={(e) => setFeaturedOnly(e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <label htmlFor="featured" className="text-sm text-gray-700">
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
                    className="w-full text-sm text-red-600 hover:text-red-700 flex items-center justify-center gap-1"
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
              <p className="text-gray-600">
                {filteredProducts.length} product{filteredProducts.length !== 1 ? 's' : ''}
                {selectedCategory && ` in "${categories.find(c => c._id === selectedCategory)?.name}"`}
              </p>
            </div>

            {filteredProducts.length === 0 ? (
              <div className="bg-white rounded-xl shadow-md p-12 text-center">
                <ShoppingCart className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No products found</h3>
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
                    className="bg-white rounded-xl shadow-md overflow-hidden group hover:shadow-xl transition-all duration-300"
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
                          <Store className="h-16 w-16" />
                        </div>
                      )}
                      
                      {product.isFeatured && (
                        <span className="absolute top-2 left-2 bg-yellow-400 text-yellow-900 text-xs font-bold px-2 py-1 rounded flex items-center gap-1">
                          <Star className="h-3 w-3 fill-current" />
                          Featured
                        </span>
                      )}
                      
                      {product.inventory === 0 && (
                        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                          <span className="bg-white text-gray-900 font-bold px-4 py-2 rounded-lg">
                            Out of Stock
                          </span>
                        </div>
                      )}
                      
                      {product.inventory > 0 && product.inventory <= 5 && (
                        <span className="absolute top-2 right-2 bg-orange-500 text-white text-xs font-bold px-2 py-1 rounded">
                          Only {product.inventory} left!
                        </span>
                      )}
                      
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-300 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                        <button
                          onClick={() => setQuickViewProduct(product)}
                          className="bg-white text-gray-900 p-3 rounded-full hover:bg-gray-100 transform hover:scale-110 transition-all"
                        >
                          <Search className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                    
                    <div className="p-4">
                      {product.categoryId && (
                        <span className="text-xs text-blue-600 font-medium">
                          {product.categoryId.name}
                        </span>
                      )}
                      <h3 className="font-semibold text-gray-900 truncate mt-1">
                        {product.name}
                      </h3>
                      
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-lg font-bold text-blue-600">
                          {formatPrice(product.price)}
                        </span>
                        {product.comparePrice && product.comparePrice > product.price && (
                          <span className="text-sm text-gray-400 line-through">
                            {formatPrice(product.comparePrice)}
                          </span>
                        )}
                      </div>
                      
                      <button
                        onClick={() => handleAddToCart(product)}
                        disabled={product.inventory === 0}
                        className={`w-full mt-4 py-2.5 rounded-lg font-medium transition-all ${
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
                          ? 'Added!'
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

      {quickViewProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto relative">
            <div className="grid grid-cols-1 md:grid-cols-2">
              <div className="aspect-square bg-gray-100">
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
              
              <div className="p-6">
                <button
                  onClick={() => setQuickViewProduct(null)}
                  className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full"
                >
                  <X className="h-5 w-5" />
                </button>
                
                {quickViewProduct.categoryId && (
                  <span className="text-sm text-blue-600 font-medium">
                    {quickViewProduct.categoryId.name}
                  </span>
                )}
                <h2 className="text-2xl font-bold text-gray-900 mt-1">
                  {quickViewProduct.name}
                </h2>
                
                <div className="flex items-center gap-3 mt-3">
                  <span className="text-2xl font-bold text-blue-600">
                    {formatPrice(quickViewProduct.price)}
                  </span>
                  {quickViewProduct.comparePrice && quickViewProduct.comparePrice > quickViewProduct.price && (
                    <span className="text-lg text-gray-400 line-through">
                      {formatPrice(quickViewProduct.comparePrice)}
                    </span>
                  )}
                </div>
                
                {quickViewProduct.description && (
                  <p className="text-gray-600 mt-4">{quickViewProduct.description}</p>
                )}
                
                <div className="mt-4 flex items-center gap-2">
                  {quickViewProduct.inventory > 10 && (
                    <span className="text-green-600 font-medium">In Stock</span>
                  )}
                  {quickViewProduct.inventory > 0 && quickViewProduct.inventory <= 10 && (
                    <span className="text-orange-600 font-medium">
                      Only {quickViewProduct.inventory} left!
                    </span>
                  )}
                  {quickViewProduct.inventory === 0 && (
                    <span className="text-red-600 font-medium">Out of Stock</span>
                  )}
                </div>
                
                <button
                  onClick={() => {
                    handleAddToCart(quickViewProduct);
                    setQuickViewProduct(null);
                  }}
                  disabled={quickViewProduct.inventory === 0}
                  className="w-full mt-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  {quickViewProduct.inventory === 0 ? 'Out of Stock' : 'Add to Cart'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <footer className="bg-gray-900 text-white py-8 mt-12">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            {store.logo && (
              <img src={store.logo} alt={store.name} className="h-6 w-6 object-contain" />
            )}
            <span className="font-semibold">{store.name}</span>
          </div>
          <p className="text-gray-400 text-sm">© 2026 {store.name}. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
