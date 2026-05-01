'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ShoppingCart, Trash2, Plus, Minus, ArrowLeft, Store, Check, ChevronRight, ChevronLeft, MapPin, CreditCard, Truck, Lock, Shield, Package, Mail, Phone, User, AlertCircle, Copy, ExternalLink } from 'lucide-react';
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

type CheckoutStep = 'cart' | 'shipping' | 'payment' | 'review' | 'success';

const PAYMENT_METHODS = [
  { id: 'cod', name: 'Cash on Delivery', description: 'Pay when you receive your order', icon: '💵' },
  { id: 'gcash', name: 'GCash', description: 'Pay via GCash mobile wallet', icon: '📱' },
  { id: 'maya', name: 'Maya', description: 'Pay via Maya digital wallet', icon: '💳' },
  { id: 'bank', name: 'Bank Transfer', description: 'Direct bank transfer', icon: '🏦' },
];

export default function CartPage() {
  const [storeCarts, setStoreCarts] = useState<StoreCart[]>([]);
  const [selectedStore, setSelectedStore] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkoutStep, setCheckoutStep] = useState<CheckoutStep>('cart');
  const [orderData, setOrderData] = useState<any>(null);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');

  const [shippingForm, setShippingForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address1: '',
    address2: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'Philippines',
    notes: '',
  });

  const [shippingErrors, setShippingErrors] = useState<Record<string, string>>({});
  const [selectedPayment, setSelectedPayment] = useState('cod');

  const steps = [
    { id: 'cart', label: 'Cart', icon: ShoppingCart },
    { id: 'shipping', label: 'Shipping', icon: MapPin },
    { id: 'payment', label: 'Payment', icon: CreditCard },
    { id: 'review', label: 'Review', icon: Package },
    { id: 'success', label: 'Complete', icon: Check },
  ];

  useEffect(() => {
    loadCarts();
    window.addEventListener('cartUpdated', loadCarts);
    syncCartFromDb();
    return () => window.removeEventListener('cartUpdated', loadCarts);
  }, []);

  const syncCartFromDb = async () => {
    try {
      const res = await fetch('/api/cart');
      if (res.ok) {
        const { storeCarts: dbCarts } = await res.json();
        if (dbCarts.length > 0) {
          const { getStoreCartsKey } = await import('@/lib/cart');
          localStorage.setItem(getStoreCartsKey(), JSON.stringify(dbCarts));
          loadCarts();
        }
      }
    } catch (e) {
      console.error('Sync cart from DB error:', e);
    }
  };

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
  const storeSettings = currentStore?.storeSettings || { taxRate: 0.12, shippingFee: 50, freeShippingThreshold: 500 };
  const totals = calculateCartTotals(currentCart, storeSettings.taxRate, storeSettings.shippingFee, storeSettings.freeShippingThreshold);
  const totalItems = storeCarts.reduce((sum, cart) => sum + cart.items.reduce((s, i) => s + i.quantity, 0), 0);

  const handleUpdateQuantity = (itemId: string, quantity: number) => {
    if (!selectedStore || quantity < 1) return;
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

  const validateShipping = () => {
    const errors: Record<string, string> = {};
    if (!shippingForm.firstName.trim()) errors.firstName = 'First name is required';
    if (!shippingForm.lastName.trim()) errors.lastName = 'Last name is required';
    if (!shippingForm.email.trim()) errors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(shippingForm.email)) errors.email = 'Invalid email address';
    if (!shippingForm.phone.trim()) errors.phone = 'Phone number is required';
    if (!shippingForm.address1.trim()) errors.address1 = 'Address is required';
    if (!shippingForm.city.trim()) errors.city = 'City is required';
    setShippingErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const goToStep = (step: CheckoutStep) => {
    if (step === 'shipping' && currentCart.length === 0) {
      setError('Your cart is empty');
      return;
    }
    if (step === 'payment' && !validateShipping()) return;
    if (step === 'review') {
      if (!validateShipping()) return;
    }
    setError('');
    setCheckoutStep(step);
  };

  const handlePlaceOrder = async () => {
    setProcessing(true);
    setError('');

    try {
      const orderData = {
        storeId: selectedStore,
        customer: {
          name: `${shippingForm.firstName} ${shippingForm.lastName}`.trim(),
          email: shippingForm.email,
          phone: shippingForm.phone,
        },
        shippingAddress: {
          firstName: shippingForm.firstName,
          lastName: shippingForm.lastName,
          address1: shippingForm.address1,
          address2: shippingForm.address2,
          city: shippingForm.city,
          state: shippingForm.state,
          postalCode: shippingForm.postalCode,
          country: shippingForm.country,
          phone: shippingForm.phone,
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
        paymentMethod: selectedPayment,
        notes: shippingForm.notes,
      };

      const res = await fetch('/api/public/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData),
      });

      const data = await res.json();

      if (res.ok) {
        setOrderData({
          order: data.order,
          customer: data.customer,
          items: currentCart,
          totals,
          paymentMethod: selectedPayment,
        });
        clearCart(selectedStore!);
        loadCarts();
        setCheckoutStep('success');
      } else {
        setError(data.error || 'Failed to place order');
      }
    } catch (err) {
      setError('Failed to place order. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent mx-auto"></div>
          <p className="mt-4 text-gray-600 font-medium">Loading your cart...</p>
        </div>
      </div>
    );
  }

  if (checkoutStep === 'success' && orderData) {
    return <OrderSuccessPage order={orderData} />;
  }

  if (storeCarts.length === 0) {
    return <EmptyCart />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <header className="bg-white/80 backdrop-blur-lg border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link href="/shop" className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors group">
              <div className="p-2 rounded-lg bg-gray-100 group-hover:bg-gray-200 transition-colors">
                <ArrowLeft className="h-5 w-5" />
              </div>
              <span className="hidden sm:inline font-medium">Continue Shopping</span>
            </Link>
            <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Checkout
            </h1>
            <div className="w-20" />
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <CheckoutStepper steps={steps} currentStep={checkoutStep} />
      </div>

      {error && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
            <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
            <p className="text-red-700 font-medium">{error}</p>
            <button onClick={() => setError('')} className="ml-auto text-red-500 hover:text-red-700">&times;</button>
          </div>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {storeCarts.length > 1 && (
          <div className="mb-6 bg-white rounded-xl p-4 border border-gray-200">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Select store to checkout:</h3>
            <div className="flex flex-wrap gap-2">
              {storeCarts.map((cart) => (
                <button
                  key={cart.storeId}
                  onClick={() => setSelectedStore(cart.storeId)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    selectedStore === cart.storeId
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-blue-500/25'
                      : 'bg-gray-50 border border-gray-200 text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Store className="h-4 w-4" />
                  {cart.storeName}
                  <span className={`px-2 py-0.5 rounded-full text-xs ${
                    selectedStore === cart.storeId ? 'bg-white/20' : 'bg-gray-200'
                  }`}>
                    {cart.items.reduce((s, i) => s + i.quantity, 0)}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            {checkoutStep === 'cart' && (
              <CartItems
                items={currentCart}
                onUpdateQuantity={handleUpdateQuantity}
                onRemoveItem={handleRemoveItem}
                onClearCart={handleClearStoreCart}
                storeName={currentStore?.storeName || ''}
              />
            )}
            {checkoutStep === 'shipping' && (
              <ShippingForm
                form={shippingForm}
                onChange={setShippingForm}
                errors={shippingErrors}
              />
            )}
            {checkoutStep === 'payment' && (
              <PaymentSelection
                selected={selectedPayment}
                onChange={setSelectedPayment}
              />
            )}
            {checkoutStep === 'review' && (
              <OrderReview
                items={currentCart}
                totals={totals}
                shipping={shippingForm}
                payment={selectedPayment}
                storeName={currentStore?.storeName || ''}
              />
            )}
          </div>

          <div className="lg:col-span-1">
            <OrderSummary
              items={currentCart}
              totals={totals}
              storeName={currentStore?.storeName || ''}
              checkoutStep={checkoutStep}
              onBack={() => {
                const stepOrder: CheckoutStep[] = ['cart', 'shipping', 'payment', 'review'];
                const idx = stepOrder.indexOf(checkoutStep);
                if (idx > 0) setCheckoutStep(stepOrder[idx - 1]);
              }}
              onNext={() => {
                const stepOrder: CheckoutStep[] = ['cart', 'shipping', 'payment', 'review'];
                const idx = stepOrder.indexOf(checkoutStep);
                if (idx < stepOrder.length - 1) goToStep(stepOrder[idx + 1]);
              }}
              onPlaceOrder={handlePlaceOrder}
              processing={processing}
            />
          </div>
        </div>
      </main>
    </div>
  );
}

function CheckoutStepper({ steps, currentStep }: { steps: any[], currentStep: CheckoutStep }) {
  const stepOrder = ['cart', 'shipping', 'payment', 'review', 'success'];
  const currentIdx = stepOrder.indexOf(currentStep);

  return (
    <div className="flex items-center justify-center max-w-2xl mx-auto">
      {steps.map((step, idx) => {
        const Icon = step.icon;
        const isActive = idx === currentIdx;
        const isCompleted = idx < currentIdx;

        return (
          <div key={step.id} className="flex items-center">
            <div className="flex flex-col items-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                isCompleted ? 'bg-green-500 text-white' :
                isActive ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-blue-500/25' :
                'bg-gray-200 text-gray-500'
              }`}>
                {isCompleted ? <Check className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
              </div>
              <span className={`mt-2 text-xs font-medium ${
                isActive ? 'text-blue-600' : isCompleted ? 'text-green-600' : 'text-gray-400'
              }`}>
                {step.label}
              </span>
            </div>
            {idx < steps.length - 1 && (
              <div className={`w-12 sm:w-20 h-0.5 mx-2 mb-6 ${
                isCompleted ? 'bg-green-500' : 'bg-gray-200'
              }`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

function CartItems({ items, onUpdateQuantity, onRemoveItem, onClearCart, storeName }: any) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
        <h2 className="font-semibold text-gray-900 flex items-center gap-2">
          <ShoppingCart className="h-5 w-5 text-blue-600" />
          Cart Items
        </h2>
        <button onClick={onClearCart} className="text-sm text-red-600 hover:text-red-700 font-medium hover:bg-red-50 px-3 py-1.5 rounded-lg transition-colors">
          Clear Cart
        </button>
      </div>
      <div className="divide-y divide-gray-100">
        {items.map((item: CartItem) => (
          <div key={item._id} className="p-4 sm:p-6 flex gap-4 hover:bg-gray-50/50 transition-colors">
            <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gray-100 rounded-xl overflow-hidden flex-shrink-0 border border-gray-200">
              {item.images?.[0] ? (
                <img src={item.images[0]} alt={item.name} className="w-full h-full object-cover" />
              ) : (
                <div className="flex items-center justify-center h-full text-gray-400">
                  <Package className="h-8 w-8" />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-900 truncate">{item.name}</h3>
              <p className="text-blue-600 font-bold mt-1">₱{item.price.toFixed(2)}</p>
              <div className="flex items-center gap-3 mt-3">
                <button
                  onClick={() => onUpdateQuantity(item._id, item.quantity - 1)}
                  className="p-1.5 hover:bg-gray-100 rounded-lg border border-gray-200 transition-colors"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="font-semibold w-8 text-center">{item.quantity}</span>
                <button
                  onClick={() => onUpdateQuantity(item._id, item.quantity + 1)}
                  className="p-1.5 hover:bg-gray-100 rounded-lg border border-gray-200 transition-colors disabled:opacity-50"
                  disabled={item.quantity >= item.inventory}
                >
                  <Plus className="h-4 w-4" />
                </button>
                <button
                  onClick={() => onRemoveItem(item._id)}
                  className="ml-auto p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="font-bold text-lg">₱{(item.price * item.quantity).toFixed(2)}</p>
              {item.comparePrice && (
                <p className="text-sm text-gray-400 line-through">₱{item.comparePrice.toFixed(2)}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ShippingForm({ form, onChange, errors }: any) {
  const inputClass = (field: string) => `w-full px-4 py-3 border ${errors[field] ? 'border-red-300 bg-red-50' : 'border-gray-300'} rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all`;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-blue-100 rounded-xl">
          <MapPin className="h-6 w-6 text-blue-600" />
        </div>
        <div>
          <h2 className="font-semibold text-gray-900 text-lg">Shipping Address</h2>
          <p className="text-gray-500 text-sm">Where should we deliver your order?</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">First Name *</label>
          <div className="relative">
            <User className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
            <input type="text" value={form.firstName} onChange={(e) => onChange({ ...form, firstName: e.target.value })} className={`${inputClass('firstName')} pl-10`} placeholder="Juan" />
          </div>
          {errors.firstName && <p className="text-red-500 text-xs mt-1">{errors.firstName}</p>}
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Last Name *</label>
          <input type="text" value={form.lastName} onChange={(e) => onChange({ ...form, lastName: e.target.value })} className={inputClass('lastName')} placeholder="Dela Cruz" />
          {errors.lastName && <p className="text-red-500 text-xs mt-1">{errors.lastName}</p>}
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Email *</label>
          <div className="relative">
            <Mail className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
            <input type="email" value={form.email} onChange={(e) => onChange({ ...form, email: e.target.value })} className={`${inputClass('email')} pl-10`} placeholder="juan@email.com" />
          </div>
          {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Phone *</label>
          <div className="relative">
            <Phone className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
            <input type="tel" value={form.phone} onChange={(e) => onChange({ ...form, phone: e.target.value })} className={`${inputClass('phone')} pl-10`} placeholder="+63 912 345 6789" />
          </div>
          {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
        </div>
        <div className="sm:col-span-2">
          <label className="block text-sm font-semibold text-gray-700 mb-2">Street Address *</label>
          <input type="text" value={form.address1} onChange={(e) => onChange({ ...form, address1: e.target.value })} className={inputClass('address1')} placeholder="House/Unit number, Street name" />
          {errors.address1 && <p className="text-red-500 text-xs mt-1">{errors.address1}</p>}
        </div>
        <div className="sm:col-span-2">
          <label className="block text-sm font-semibold text-gray-700 mb-2">Apartment, suite, etc. (optional)</label>
          <input type="text" value={form.address2} onChange={(e) => onChange({ ...form, address2: e.target.value })} className={inputClass('address2')} placeholder="Building name, floor, unit" />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">City *</label>
          <input type="text" value={form.city} onChange={(e) => onChange({ ...form, city: e.target.value })} className={inputClass('city')} placeholder="Manila" />
          {errors.city && <p className="text-red-500 text-xs mt-1">{errors.city}</p>}
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">State/Province</label>
          <input type="text" value={form.state} onChange={(e) => onChange({ ...form, state: e.target.value })} className={inputClass('state')} placeholder="Metro Manila" />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Postal Code</label>
          <input type="text" value={form.postalCode} onChange={(e) => onChange({ ...form, postalCode: e.target.value })} className={inputClass('postalCode')} placeholder="1000" />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Country</label>
          <input type="text" value={form.country} onChange={(e) => onChange({ ...form, country: e.target.value })} className={inputClass('country')} />
        </div>
        <div className="sm:col-span-2">
          <label className="block text-sm font-semibold text-gray-700 mb-2">Order Notes (optional)</label>
          <textarea value={form.notes} onChange={(e) => onChange({ ...form, notes: e.target.value })} rows={3} className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none" placeholder="Special delivery instructions..." />
        </div>
      </div>
    </div>
  );
}

function PaymentSelection({ selected, onChange }: any) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-green-100 rounded-xl">
          <CreditCard className="h-6 w-6 text-green-600" />
        </div>
        <div>
          <h2 className="font-semibold text-gray-900 text-lg">Payment Method</h2>
          <p className="text-gray-500 text-sm">Choose how you want to pay</p>
        </div>
      </div>

      <div className="space-y-3">
        {PAYMENT_METHODS.map((method) => (
          <button
            key={method.id}
            onClick={() => onChange(method.id)}
            className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
              selected === method.id
                ? 'border-blue-500 bg-blue-50 shadow-sm'
                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center gap-4">
              <span className="text-2xl">{method.icon}</span>
              <div className="flex-1">
                <p className={`font-semibold ${selected === method.id ? 'text-blue-700' : 'text-gray-900'}`}>{method.name}</p>
                <p className="text-sm text-gray-500">{method.description}</p>
              </div>
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                selected === method.id ? 'border-blue-500' : 'border-gray-300'
              }`}>
                {selected === method.id && <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />}
              </div>
            </div>
          </button>
        ))}
      </div>

      <div className="mt-6 p-4 bg-gray-50 rounded-xl flex items-center gap-3">
        <Lock className="h-5 w-5 text-gray-400 flex-shrink-0" />
        <p className="text-sm text-gray-600">Your payment information is secure and encrypted</p>
      </div>
    </div>
  );
}

function OrderReview({ items, totals, shipping, payment, storeName }: any) {
  const paymentMethod = PAYMENT_METHODS.find((p) => p.id === payment);

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <h2 className="font-semibold text-gray-900 text-lg flex items-center gap-2 mb-4">
          <MapPin className="h-5 w-5 text-blue-600" />
          Shipping to
        </h2>
        <div className="bg-gray-50 rounded-xl p-4">
          <p className="font-semibold">{shipping.firstName} {shipping.lastName}</p>
          <p className="text-gray-600">{shipping.address1}{shipping.address2 && `, ${shipping.address2}`}</p>
          <p className="text-gray-600">{shipping.city}{shipping.state && `, ${shipping.state}`} {shipping.postalCode}</p>
          <p className="text-gray-600">{shipping.country}</p>
          <p className="text-gray-600 mt-2">{shipping.phone}</p>
          <p className="text-gray-600">{shipping.email}</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <h2 className="font-semibold text-gray-900 text-lg flex items-center gap-2 mb-4">
          <CreditCard className="h-5 w-5 text-green-600" />
          Payment Method
        </h2>
        <div className="bg-gray-50 rounded-xl p-4 flex items-center gap-3">
          <span className="text-2xl">{paymentMethod?.icon}</span>
          <div>
            <p className="font-semibold">{paymentMethod?.name}</p>
            <p className="text-sm text-gray-500">{paymentMethod?.description}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <h2 className="font-semibold text-gray-900 text-lg flex items-center gap-2 mb-4">
          <ShoppingCart className="h-5 w-5 text-purple-600" />
          Order Items
        </h2>
        <div className="space-y-3">
          {items.map((item: CartItem) => (
            <div key={item._id} className="flex items-center gap-4 p-3 bg-gray-50 rounded-xl">
              <div className="w-16 h-16 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                {item.images?.[0] ? (
                  <img src={item.images[0]} alt={item.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-400"><Package className="h-6 w-6" /></div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold truncate">{item.name}</p>
                <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
              </div>
              <p className="font-bold">₱{(item.price * item.quantity).toFixed(2)}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function OrderSummary({ items, totals, storeName, checkoutStep, onBack, onNext, onPlaceOrder, processing }: any) {
  const isReview = checkoutStep === 'review';
  const isCart = checkoutStep === 'cart';

  return (
    <div className="lg:sticky lg:top-24">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
          <h2 className="font-semibold text-gray-900 flex items-center gap-2">
            <Store className="h-5 w-5 text-blue-600" />
            {storeName}
          </h2>
        </div>

        <div className="p-6">
          {!isCart && (
            <div className="mb-4 pb-4 border-b border-gray-100">
              <p className="text-sm text-gray-600 mb-2">{items.length} item{items.length !== 1 ? 's' : ''}</p>
              {items.map((item: CartItem) => (
                <div key={item._id} className="flex justify-between text-sm py-1">
                  <span className="text-gray-600 truncate flex-1">{item.name} x{item.quantity}</span>
                  <span className="font-medium ml-2">₱{(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>
          )}

          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Subtotal</span>
              <span className="font-medium">₱{totals.subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Tax (12%)</span>
              <span className="font-medium">₱{totals.tax.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Shipping</span>
              <span className={`font-medium ${totals.shipping === 0 ? 'text-green-600' : ''}`}>
                {totals.shipping === 0 ? 'FREE' : `₱${totals.shipping.toFixed(2)}`}
              </span>
            </div>
            {totals.shipping > 0 && (
              <p className="text-xs text-gray-500 bg-yellow-50 p-2 rounded-lg">
                💡 Free shipping on orders over ₱500
              </p>
            )}
            <div className="border-t border-gray-200 pt-3 flex justify-between items-baseline">
              <span className="font-semibold text-gray-900">Total</span>
              <span className="font-bold text-2xl bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">₱{totals.total.toFixed(2)}</span>
            </div>
          </div>

          <div className="mt-6 space-y-3">
            {isReview ? (
              <>
                <button
                  onClick={onPlaceOrder}
                  disabled={processing}
                  className="w-full py-3.5 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-semibold hover:from-green-700 hover:to-emerald-700 disabled:from-gray-300 disabled:to-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-green-500/25 transition-all"
                >
                  {processing ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Lock className="h-4 w-4" />
                      Place Order
                    </>
                  )}
                </button>
                <button onClick={onBack} className="w-full py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-medium flex items-center justify-center gap-2 transition-colors">
                  <ChevronLeft className="h-4 w-4" />
                  Back
                </button>
              </>
            ) : (
              <button
                onClick={onNext}
                disabled={items.length === 0}
                className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 disabled:from-gray-300 disabled:to-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25 transition-all"
              >
                Continue
                <ChevronRight className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        <div className="px-6 py-3 bg-gray-50 border-t border-gray-100 flex items-center justify-center gap-2 text-xs text-gray-500">
          <Shield className="h-4 w-4" />
          Secure checkout powered by Judith Seafoods
        </div>
      </div>
    </div>
  );
}

function EmptyCart() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 sm:p-12 max-w-md w-full text-center">
        <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <ShoppingCart className="h-12 w-12 text-gray-300" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Your cart is empty</h1>
        <p className="text-gray-600 mb-8">Browse our amazing stores and add some products to get started!</p>
        <Link href="/shop/stores" className="inline-flex items-center gap-2 px-8 py-3.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 shadow-lg shadow-blue-500/25 transition-all">
          <Store className="h-5 w-5" />
          Browse Stores
        </Link>
      </div>
    </div>
  );
}

function OrderSuccessPage({ order }: { order: any }) {
  const [copied, setCopied] = useState(false);
  const orderNum = order.order?.orderNumber;

  const handleCopy = () => {
    navigator.clipboard.writeText(orderNum);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const paymentMethod = PAYMENT_METHODS.find((p) => p.id === order.paymentMethod);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50">
      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-green-500 to-emerald-500 px-6 py-12 text-center text-white">
            <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="h-10 w-10" />
            </div>
            <h1 className="text-3xl font-bold mb-2">Order Placed!</h1>
            <p className="text-green-100">Thank you for your purchase</p>
          </div>

          <div className="p-6 sm:p-8">
            <div className="bg-gray-50 rounded-xl p-4 mb-6 flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Order Number</p>
                <p className="font-bold text-lg">{orderNum}</p>
              </div>
              <button onClick={handleCopy} className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                <span className="text-sm font-medium">{copied ? 'Copied!' : 'Copy'}</span>
              </button>
            </div>

            <div className="space-y-4 mb-6">
              <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-xl">
                <Mail className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-sm text-gray-500">Confirmation sent to</p>
                  <p className="font-semibold">{order.order?.customer?.email}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-4 bg-purple-50 rounded-xl">
                <CreditCard className="h-5 w-5 text-purple-600" />
                <div>
                  <p className="text-sm text-gray-500">Payment Method</p>
                  <p className="font-semibold">{paymentMethod?.icon} {paymentMethod?.name}</p>
                </div>
              </div>

              {order.order?.shippingAddress && (
                <div className="flex items-start gap-3 p-4 bg-orange-50 rounded-xl">
                  <MapPin className="h-5 w-5 text-orange-600 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500">Shipping to</p>
                    <p className="font-semibold">{order.order.shippingAddress.firstName} {order.order.shippingAddress.lastName}</p>
                    <p className="text-gray-600 text-sm">{order.order.shippingAddress.address1}</p>
                    <p className="text-gray-600 text-sm">{order.order.shippingAddress.city}, {order.order.shippingAddress.state} {order.order.shippingAddress.postalCode}</p>
                  </div>
                </div>
              )}
            </div>

            <div className="border-t border-gray-200 pt-6">
              <h3 className="font-semibold text-gray-900 mb-4">Order Summary</h3>
              <div className="space-y-3">
                {order.items?.map((item: CartItem) => (
                  <div key={item._id} className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gray-100 rounded-lg overflow-hidden">
                        {item.images?.[0] ? (
                          <img src={item.images[0]} alt={item.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="flex items-center justify-center h-full text-gray-400"><Package className="h-5 w-5" /></div>
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-sm">{item.name}</p>
                        <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                      </div>
                    </div>
                    <p className="font-semibold">₱{(item.price * item.quantity).toFixed(2)}</p>
                  </div>
                ))}
              </div>

              <div className="mt-4 pt-4 border-t border-gray-200 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal</span>
                  <span>₱{order.totals?.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Tax</span>
                  <span>₱{order.totals?.tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Shipping</span>
                  <span>{order.totals?.shipping === 0 ? 'FREE' : `₱${order.totals?.shipping.toFixed(2)}`}</span>
                </div>
                <div className="flex justify-between font-bold text-lg pt-2 border-t">
                  <span>Total</span>
                  <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">₱{order.totals?.total.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <Link href="/shop" className="mt-8 w-full flex items-center justify-center gap-2 py-3.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 shadow-lg shadow-blue-500/25 transition-all">
              <ExternalLink className="h-4 w-4" />
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
