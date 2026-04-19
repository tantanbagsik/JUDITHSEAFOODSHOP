'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ShoppingCart, Trash2, Plus, Minus, ArrowLeft, Store, Check, ChevronRight } from 'lucide-react';
import { 
  getAllStoreCarts, 
  getCart, 
  updateCartItemQuantity, 
  removeFromCart, 
  clearCart,
  calculateCartTotals,
  CartItem,
  StoreCart,
} from '@/lib/cart';

export default function CartPage() {
  const [storeCarts, setStoreCarts] = useState<StoreCart[]>([]);
  const [selectedStore, setSelectedStore] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkoutStep, setCheckoutStep] = useState<'cart' | 'checkout' | 'success'>('cart');
  const [orderNumber, setOrderNumber] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    street: '',
    city: '',
    state: '',
    zip: '',
    country: 'Philippines',
    notes: '',
  });
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadCarts();
    window.addEventListener('cartUpdated', loadCarts);
    return () => window.removeEventListener('cartUpdated', loadCarts);
  }, []);

  const loadCarts = () => {
    const carts = getAllStoreCarts();
    setStoreCarts(carts);
    if (carts.length > 0 && !selectedStore) {
      setSelectedStore(carts[0].storeId);
    } else if (carts.length === 0) {
      setSelectedStore(null);
    }
    setLoading(false);
  };

  const currentCart = selectedStore ? getCart(selectedStore) : [];
  const currentStore = storeCarts.find(c => c.storeId === selectedStore);
  
  const totals = calculateCartTotals(currentCart, 0.12, 500, 50);

  const handleUpdateQuantity = (itemId: string, quantity: number) => {
    if (!selectedStore) return;
    updateCartItemQuantity(selectedStore, itemId, quantity);
    loadCarts();
  };

  const handleRemoveItem = (itemId: string) => {
    if (!selectedStore) return;
    removeFromCart(selectedStore, itemId);
    loadCarts();
  };

  const handleClearStoreCart = () => {
    if (!selectedStore) return;
    clearCart(selectedStore);
    loadCarts();
  };

  const handleCheckout = async () => {
    if (!formData.name || !formData.email || !formData.street || !formData.city) {
      setError('Please fill in all required fields');
      return;
    }

    if (currentCart.length === 0) {
      setError('Your cart is empty');
      return;
    }

    setProcessing(true);
    setError('');

    const nameParts = formData.name.split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';

    try {
      const orderData = {
        storeId: selectedStore,
        customer: {
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
        },
        shippingAddress: {
          firstName,
          lastName,
          address1: formData.street,
          city: formData.city,
          state: formData.state || '',
          postalCode: formData.zip || '',
          country: formData.country,
          phone: formData.phone,
        },
        items: currentCart.map((item: CartItem) => ({
          productId: item._id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          image: item.images?.[0],
        })),
        subtotal: totals.subtotal,
        tax: totals.tax,
        shipping: totals.shipping,
        total: totals.total,
        paymentMethod: 'cod',
        notes: formData.notes,
      };

      const res = await fetch('/api/public/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData),
      });

      if (res.ok) {
        const order = await res.json();
        setOrderNumber(order.orderNumber);
        clearCart(selectedStore!);
        loadCarts();
        setCheckoutStep('success');
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to place order');
      }
    } catch (err) {
      setError('Failed to place order. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const totalItems = storeCarts.reduce((sum, cart) => sum + cart.items.reduce((s, i) => s + i.quantity, 0), 0);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (checkoutStep === 'success') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Check className="w-10 h-10 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Order Placed!</h1>
          {orderNumber && (
            <p className="text-gray-600 mb-2">Order Number: <strong>{orderNumber}</strong></p>
          )}
          <p className="text-gray-600 mb-6">Thank you for your order. The store will process it shortly.</p>
          <Link href="/shop" className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            Continue Shopping
          </Link>
        </div>
      </div>
    );
  }

  if (storeCarts.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
          <ShoppingCart className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Your cart is empty</h1>
          <p className="text-gray-600 mb-6">Add some products from a store to get started!</p>
          <Link href="/shop/stores" className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            Browse Stores
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <Link href="/shop" className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
            <ArrowLeft className="h-5 w-5" />
            Continue Shopping
          </Link>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">
          Shopping Cart ({totalItems} items)
        </h1>

        {storeCarts.length > 1 && (
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Checkout from:</h3>
            <div className="flex flex-wrap gap-2">
              {storeCarts.map((cart) => (
                <button
                  key={cart.storeId}
                  onClick={() => setSelectedStore(cart.storeId)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    selectedStore === cart.storeId
                      ? 'bg-blue-600 text-white'
                      : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Store className="h-4 w-4" />
                  {cart.storeName}
                  <span className="bg-white/20 px-2 py-0.5 rounded text-xs">
                    {cart.items.reduce((s, i) => s + i.quantity, 0)}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            {checkoutStep === 'cart' ? (
              <>
                <div className="bg-white rounded-xl shadow-md divide-y">
                  {currentCart.map((item: CartItem) => (
                    <div key={item._id} className="p-4 flex gap-4">
                      <div className="w-24 h-24 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                        {item.images?.[0] ? (
                          <img src={item.images[0]} alt={item.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="flex items-center justify-center h-full text-gray-400 text-sm">No Image</div>
                        )}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">{item.name}</h3>
                        <p className="text-blue-600 font-bold">₱{item.price.toFixed(2)}</p>
                        <div className="flex items-center gap-3 mt-2">
                          <button
                            onClick={() => handleUpdateQuantity(item._id, item.quantity - 1)}
                            className="p-1 hover:bg-gray-100 rounded"
                          >
                            <Minus className="h-4 w-4" />
                          </button>
                          <span className="font-medium">{item.quantity}</span>
                          <button
                            onClick={() => handleUpdateQuantity(item._id, item.quantity + 1)}
                            className="p-1 hover:bg-gray-100 rounded"
                            disabled={item.quantity >= item.inventory}
                          >
                            <Plus className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleRemoveItem(item._id)}
                            className="ml-auto p-1 text-red-500 hover:bg-red-50 rounded"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">₱{(item.price * item.quantity).toFixed(2)}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-4 flex justify-between">
                  <button
                    onClick={handleClearStoreCart}
                    className="text-red-600 hover:text-red-700 text-sm"
                  >
                    Clear {currentStore?.storeName} Cart
                  </button>
                  {storeCarts.length > 1 && (
                    <p className="text-sm text-gray-500">
                      Showing items from {currentStore?.storeName}. Switch stores above to checkout other items.
                    </p>
                  )}
                </div>
              </>
            ) : (
              <div className="bg-white rounded-xl shadow-md p-6">
                <h2 className="font-semibold text-gray-900 mb-4">Shipping Information</h2>
                {error && (
                  <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm">
                    {error}
                  </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="col-span-2 md:col-span-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div className="col-span-2 md:col-span-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Street Address *</label>
                    <input
                      type="text"
                      value={formData.street}
                      onChange={(e) => setFormData({ ...formData, street: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">City *</label>
                    <input
                      type="text"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">State/Province</label>
                    <input
                      type="text"
                      value={formData.state}
                      onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Postal Code</label>
                    <input
                      type="text"
                      value={formData.zip}
                      onChange={(e) => setFormData({ ...formData, zip: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                    <input
                      type="text"
                      value={formData.country}
                      onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Order Notes</label>
                    <textarea
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Special instructions for your order..."
                    />
                  </div>
                </div>

                <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-medium text-gray-900 mb-2">Order from {currentStore?.storeName}</h3>
                  <div className="space-y-2 text-sm">
                    {currentCart.map((item: CartItem) => (
                      <div key={item._id} className="flex justify-between">
                        <span>{item.name} x{item.quantity}</span>
                        <span>₱{(item.price * item.quantity).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-md p-6 sticky top-4">
              <div className="flex items-center gap-2 mb-4">
                <Store className="h-5 w-5 text-blue-600" />
                <h2 className="font-semibold text-gray-900">{currentStore?.storeName}</h2>
              </div>
              
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal ({currentCart.length} items)</span>
                  <span className="font-medium">₱{totals.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Tax (12%)</span>
                  <span className="font-medium">₱{totals.tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Shipping</span>
                  <span className="font-medium">
                    {totals.shipping === 0 ? 'FREE' : `₱${totals.shipping.toFixed(2)}`}
                  </span>
                </div>
                {totals.shipping > 0 && (
                  <p className="text-xs text-gray-500">Free shipping on orders over ₱500</p>
                )}
                <div className="border-t pt-3 flex justify-between">
                  <span className="font-semibold">Total</span>
                  <span className="font-bold text-lg">₱{totals.total.toFixed(2)}</span>
                </div>
              </div>
              
              {checkoutStep === 'cart' ? (
                <button
                  onClick={() => setCheckoutStep('checkout')}
                  disabled={currentCart.length === 0}
                  className="w-full mt-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  Checkout
                  <ChevronRight className="h-4 w-4" />
                </button>
              ) : (
                <div className="space-y-3 mt-6">
                  <button
                    onClick={handleCheckout}
                    disabled={processing}
                    className="w-full py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                  >
                    {processing ? 'Processing...' : 'Place Order (COD)'}
                  </button>
                  <button
                    onClick={() => setCheckoutStep('cart')}
                    className="w-full py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    Back to Cart
                  </button>
                </div>
              )}

              {storeCarts.length > 1 && (
                <div className="mt-6 pt-4 border-t">
                  <p className="text-xs text-gray-500">
                    You have items from {storeCarts.length} store{storeCarts.length > 1 ? 's' : ''}. 
                    Each store checkout is processed separately.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
