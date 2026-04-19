'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { 
  Search, 
  ShoppingCart, 
  Menu, 
  X, 
  Star, 
  ChevronDown,
  Package,
  Truck,
  Shield,
  RefreshCw,
  ArrowRight,
  Heart,
  Filter,
  Store,
} from 'lucide-react';
import { addToCart, getCartCount, getAllStoreCarts, calculateCartTotals, clearCart } from '@/lib/cart';

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
}

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedStore, setSelectedStore] = useState<string | null>(null);
  const [cartCount, setCartCount] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showCart, setShowCart] = useState(false);
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    notes: '',
  });
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchData();
    updateCartCount();
  }, []);

  const fetchData = async () => {
    try {
      const storesRes = await fetch('/api/public/stores');
      if (storesRes.ok) {
        const storesData = await storesRes.json();
        setStores(storesData);
        
        const allProducts: Product[] = [];
        for (const store of storesData) {
          const productsRes = await fetch(`/api/stores/${store._id}/products?storeId=${store._id}&active=true`);
          if (productsRes.ok) {
            const productsData = await productsRes.json();
            if (Array.isArray(productsData)) {
              allProducts.push(...productsData.filter((p: Product) => p.isActive));
            }
          }
        }
        setProducts(allProducts);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateCartCount = () => {
    const count = getCartCount();
    setCartCount(count);
  };

  const filteredProducts = products.filter(p => {
    const matchesSearch = !search || p.name.toLowerCase().includes(search.toLowerCase());
    const matchesStore = !selectedStore || p.storeId?._id === selectedStore;
    return matchesSearch && matchesStore;
  });

  const featuredProducts = filteredProducts.filter(p => p.isFeatured);
  const regularProducts = filteredProducts.filter(p => !p.isFeatured);

  const formatPrice = (price: number) => `₱${price.toFixed(2)}`;

  const handleAddToCart = (product: Product) => {
    const qty = quantities[product._id] || 1;
    addToCart(product.storeId._id, product.storeId.name, product.storeId.slug, {
      _id: product._id,
      name: product.name,
      price: product.price,
      images: product.images,
      inventory: product.inventory,
      quantity: qty,
    });
    setQuantities({ ...quantities, [product._id]: 1 });
    updateCartCount();
  };

  const handleCheckout = async () => {
    if (!formData.name || !formData.email || !formData.address || !formData.city) {
      alert('Please fill in all required fields');
      return;
    }

    const storeCarts = getAllStoreCarts();
    if (storeCarts.length === 0) {
      alert('Your cart is empty');
      return;
    }

    setProcessing(true);

    try {
      for (const storeCart of storeCarts) {
        const totals = calculateCartTotals(storeCart.items, 0.12, 100, 0);
        
        const orderData = {
          storeId: storeCart.storeId,
          customer: {
            name: formData.name,
            email: formData.email,
            phone: formData.phone,
          },
          shippingAddress: {
            firstName: formData.name.split(' ')[0],
            lastName: formData.name.split(' ').slice(1).join(' ') || '',
            address1: formData.address,
            city: formData.city,
            country: 'Philippines',
          },
          items: storeCart.items.map(item => ({
            productId: item._id,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
          })),
          subtotal: totals.subtotal,
          tax: totals.tax,
          shipping: totals.shipping,
          total: totals.total,
          paymentMethod: 'cod',
          notes: formData.notes,
        };

        await fetch('/api/public/orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(orderData),
        });
      }

      storeCarts.forEach(c => clearCart(c.storeId));
      setOrderPlaced(true);
      updateCartCount();
    } catch (error) {
      console.error('Order error:', error);
      alert('Failed to place order. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <header className="sticky top-0 z-40 bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2">
              {stores[0]?.logo ? (
                <img src={stores[0].logo} alt="Seafoods" className="h-8 w-8 object-contain" />
              ) : (
                <Package className="h-8 w-8 text-blue-600" />
              )}
              <span className="text-xl font-bold text-gray-900">Seafoods</span>
            </Link>

            <div className="hidden md:flex items-center flex-1 max-w-md mx-8">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search products..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="flex items-center gap-4">
              <button
                onClick={() => setShowCart(true)}
                className="relative p-2 hover:bg-gray-100 rounded-full"
              >
                <ShoppingCart className="h-6 w-6 text-gray-700" />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                    {cartCount}
                  </span>
                )}
              </button>
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2"
              >
                <Menu className="h-6 w-6" />
              </button>
            </div>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden border-t p-4 bg-white">
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search products..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-full"
              />
            </div>
            <Link href="/login" className="block py-2 text-gray-700">Sign In</Link>
            <Link href="/register" className="block py-2 text-blue-600">Create Account</Link>
          </div>
        )}
      </header>

      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Fresh Seafood Delivered to Your Door
          </h1>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Shop the freshest seafood directly from local suppliers. Quality guaranteed, delivered fresh.
          </p>
          <div className="flex justify-center gap-8 text-sm">
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              <span>Fresh Catch Daily</span>
            </div>
            <div className="flex items-center gap-2">
              <Truck className="h-5 w-5" />
              <span>Fast Delivery</span>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              <span>Quality Guaranteed</span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-gray-50 border-b">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-4 overflow-x-auto">
          <button
            onClick={() => setSelectedStore(null)}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap ${
              !selectedStore ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            All Products
          </button>
          {stores.map((store) => (
            <button
              key={store._id}
              onClick={() => setSelectedStore(store._id)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap ${
                selectedStore === store._id ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              {store.name}
            </button>
          ))}
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            {selectedStore ? stores.find(s => s._id === selectedStore)?.name : 'Featured Products'}
          </h2>
          <span className="text-gray-500">{filteredProducts.length} products</span>
        </div>

        {filteredProducts.length === 0 ? (
          <div className="text-center py-16">
            <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No products found</h3>
            <p className="text-gray-500">Try adjusting your search or filters.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
            {filteredProducts.map((product) => (
              <div
                key={product._id}
                className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden group hover:shadow-md transition-shadow"
              >
                <div className="relative aspect-square bg-gray-100">
                  {product.images[0] ? (
                    <img
                      src={product.images[0]}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-400">
                      <Package className="h-12 w-12" />
                    </div>
                  )}
                  {product.isFeatured && (
                    <span className="absolute top-2 left-2 bg-yellow-400 text-yellow-900 text-xs font-bold px-2 py-1 rounded">
                      Featured
                    </span>
                  )}
                  {product.inventory === 0 && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <span className="bg-white text-gray-900 font-bold px-3 py-1 rounded-lg text-sm">
                        Out of Stock
                      </span>
                    </div>
                  )}
                </div>
                
                <div className="p-3">
                  <p className="text-xs text-blue-600 font-medium mb-1">
                    {product.storeId?.name || 'Store'}
                  </p>
                  <h3 className="font-semibold text-gray-900 text-sm line-clamp-2 mb-2">
                    {product.name}
                  </h3>
                  
                  <div className="flex items-center gap-2 mb-3">
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
                    className={`w-full py-2 rounded-xl font-semibold text-sm transition-colors ${
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
      </main>

      <section className="bg-gray-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <Package className="h-10 w-10 mx-auto mb-3 text-blue-400" />
              <h3 className="font-bold text-lg mb-1">Fresh Seafood</h3>
              <p className="text-gray-400 text-sm">Sourced daily from local fishermen</p>
            </div>
            <div>
              <Truck className="h-10 w-10 mx-auto mb-3 text-blue-400" />
              <h3 className="font-bold text-lg mb-1">Fast Delivery</h3>
              <p className="text-gray-400 text-sm">Same-day delivery available</p>
            </div>
            <div>
              <Shield className="h-10 w-10 mx-auto mb-3 text-blue-400" />
              <h3 className="font-bold text-lg mb-1">Quality Guarantee</h3>
              <p className="text-gray-400 text-sm">100% satisfaction guaranteed</p>
            </div>
            <div>
              <RefreshCw className="h-10 w-10 mx-auto mb-3 text-blue-400" />
              <h3 className="font-bold text-lg mb-1">Easy Returns</h3>
              <p className="text-gray-400 text-sm">30-day return policy</p>
            </div>
          </div>
        </div>
      </section>

      <footer className="bg-gray-900 text-white py-8 border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-gray-400">© 2026 Seafoods. All rights reserved.</p>
        </div>
      </footer>

      {showCart && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-end">
          <div className="bg-white w-full max-w-md h-full overflow-y-auto">
            <div className="p-4 border-b flex items-center justify-between sticky top-0 bg-white">
              <h2 className="text-xl font-bold">Shopping Cart</h2>
              <button onClick={() => setShowCart(false)} className="p-2 hover:bg-gray-100 rounded-full">
                <X className="h-5 w-5" />
              </button>
            </div>

            {orderPlaced ? (
              <div className="p-8 text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <ArrowRight className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="text-xl font-bold mb-2">Order Placed!</h3>
                <p className="text-gray-600 mb-6">Thank you for your order. We'll contact you shortly.</p>
                <button
                  onClick={() => {
                    setShowCart(false);
                    setOrderPlaced(false);
                  }}
                  className="w-full py-3 bg-blue-600 text-white rounded-xl font-semibold"
                >
                  Continue Shopping
                </button>
              </div>
            ) : (
              <>
                <div className="p-4 flex-1">
                  {(() => {
                    const storeCarts = getAllStoreCarts();
                    if (storeCarts.length === 0) {
                      return (
                        <div className="text-center py-12">
                          <ShoppingCart className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                          <p className="text-gray-500">Your cart is empty</p>
                        </div>
                      );
                    }

                    return storeCarts.map((storeCart) => (
                      <div key={storeCart.storeId} className="mb-6">
                        <div className="flex items-center gap-2 mb-3 pb-2 border-b">
                          <Store className="h-4 w-4 text-blue-600" />
                          <span className="font-semibold">{storeCart.storeName}</span>
                        </div>
                        {storeCart.items.map((item) => (
                          <div key={item._id} className="flex gap-3 py-3 border-b">
                            <img
                              src={item.images?.[0] || '/placeholder.png'}
                              alt={item.name}
                              className="w-16 h-16 object-cover rounded-lg"
                            />
                            <div className="flex-1">
                              <h4 className="font-medium text-sm line-clamp-2">{item.name}</h4>
                              <p className="text-blue-600 font-bold">₱{item.price.toFixed(2)}</p>
                              <p className="text-gray-500 text-sm">Qty: {item.quantity}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ));
                  })()}
                </div>

                <div className="p-4 border-t bg-gray-50">
                  <div className="mb-4 space-y-3">
                    <input
                      type="text"
                      placeholder="Full Name *"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl"
                    />
                    <input
                      type="email"
                      placeholder="Email *"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl"
                    />
                    <input
                      type="tel"
                      placeholder="Phone Number *"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl"
                    />
                    <input
                      type="text"
                      placeholder="Delivery Address *"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl"
                    />
                    <input
                      type="text"
                      placeholder="City *"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl"
                    />
                    <textarea
                      placeholder="Order Notes (optional)"
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl"
                      rows={2}
                    />
                  </div>

                  <button
                    onClick={handleCheckout}
                    disabled={processing}
                    className="w-full py-4 bg-blue-600 text-white rounded-xl font-bold text-lg hover:bg-blue-700 disabled:bg-gray-300"
                  >
                    {processing ? 'Processing...' : 'Place Order'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}