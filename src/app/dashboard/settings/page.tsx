'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';
import { 
  Store as StoreIcon, 
  Loader2, 
  Check, 
  ChevronRight, 
  ChevronLeft, 
  Image as ImageIcon,
  Palette, 
  Settings, 
  Rocket,
  Upload,
  X,
  Globe,
  Eye,
  Plus,
  Trash2
} from 'lucide-react';
import { slugify } from '@/lib/utils';

interface Store {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  logo?: string;
  isActive: boolean;
  subscription: {
    plan: string;
    status: string;
  };
  settings: {
    currency: string;
    shippingFee?: number;
    freeShippingThreshold?: number;
    taxRate?: number;
    email?: string;
    phone?: string;
  };
  theme?: {
    primaryColor?: string;
    accentColor?: string;
  };
}

const STEPS = [
  { id: 1, name: 'Basic Info', icon: StoreIcon },
  { id: 2, name: 'Settings', icon: Settings },
  { id: 3, name: 'Customize', icon: Palette },
  { id: 4, name: 'Ready', icon: Rocket },
];

const CURRENCIES = [
  { code: 'PHP', name: 'Philippine Peso', symbol: '₱' },
  { code: 'USD', name: 'US Dollar', symbol: '$' },
  { code: 'EUR', name: 'Euro', symbol: '€' },
  { code: 'GBP', name: 'British Pound', symbol: '£' },
];

export default function SettingsPage() {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [store, setStore] = useState<Store | null>(null);
  const [storeLoading, setStoreLoading] = useState(true);
  const [currentStep, setCurrentStep] = useState(1);
  const [refreshKey, setRefreshKey] = useState(0);

  const [storeName, setStoreName] = useState('');
  const [description, setDescription] = useState('');
  const [logo, setLogo] = useState('');
  const [storeSlug, setStoreSlug] = useState('');
  const [isActive, setIsActive] = useState(true);

  const [currency, setCurrency] = useState('PHP');
  const [shippingFee, setShippingFee] = useState('0');
  const [freeShippingThreshold, setFreeShippingThreshold] = useState('500');
  const [taxRate, setTaxRate] = useState('12');
  const [storeEmail, setStoreEmail] = useState('');
  const [storePhone, setStorePhone] = useState('');

  const [primaryColor, setPrimaryColor] = useState('#3B82F6');
  const [accentColor, setAccentColor] = useState('#10B981');

  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    if (session?.user) {
      fetchStore();
    }
  }, [session, status, refreshKey]);

  useEffect(() => {
    if (storeName && !store) {
      setStoreSlug(slugify(storeName));
    }
  }, [storeName, store]);

  const fetchStore = async () => {
    try {
      const res = await fetch(`/api/stores?owner=${session?.user?.id}`);
      if (res.ok) {
        const data = await res.json();
        if (data.length > 0) {
          const storeData = data[0] as Store;
          setStore(storeData);
          setStoreName(storeData.name || '');
          setDescription(storeData.description || '');
          setStoreSlug(storeData.slug || '');
          setLogo(storeData.logo || '');
          setIsActive(storeData.isActive !== false);
          setCurrency(storeData.settings?.currency || 'PHP');
          setShippingFee((storeData.settings?.shippingFee || 0).toString());
          setFreeShippingThreshold((storeData.settings?.freeShippingThreshold || 500).toString());
          setTaxRate((storeData.settings?.taxRate || 12).toString());
          setStoreEmail(storeData.settings?.email || session?.user?.email || '');
          setStorePhone(storeData.settings?.phone || '');
          setPrimaryColor(storeData.theme?.primaryColor || '#3B82F6');
          setAccentColor(storeData.theme?.accentColor || '#10B981');
        }
      }
    } catch (error) {
      console.error('Failed to fetch store:', error);
    } finally {
      setStoreLoading(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const reader = new FileReader();
      reader.onload = () => {
        setLogo(reader.result as string);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setUploading(false);
    }
  };

  const handleCreateStore = async () => {
    if (!storeName.trim()) {
      alert('Please enter a store name');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/stores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: storeName,
          description,
          slug: storeSlug,
          logo,
          isActive: true,
          settings: {
            currency,
            shippingFee: parseFloat(shippingFee) || 0,
            freeShippingThreshold: parseFloat(freeShippingThreshold) || 500,
            taxRate: parseFloat(taxRate) || 12,
            email: storeEmail || session?.user?.email,
            phone: storePhone,
          },
          theme: {
            primaryColor,
            accentColor,
          },
        }),
      });

      if (res.ok) {
        const newStore = await res.json();
        setStore(newStore);
        setCurrentStep(4);
        setRefreshKey(k => k + 1);
        await update();
        router.refresh();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to create store');
      }
    } catch (error) {
      console.error('Failed to create store:', error);
      alert('Failed to create store');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    if (!store?._id) return;
    setLoading(true);

    try {
      const res = await fetch(`/api/stores/${store._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: storeName,
          description,
          logo,
          isActive,
          settings: {
            currency,
            shippingFee: parseFloat(shippingFee) || 0,
            freeShippingThreshold: parseFloat(freeShippingThreshold) || 500,
            taxRate: parseFloat(taxRate) || 12,
            email: storeEmail || session?.user?.email,
            phone: storePhone,
          },
          theme: {
            primaryColor,
            accentColor,
          },
        }),
      });

      if (res.ok) {
        const updatedStore = await res.json();
        setStore(updatedStore);
        setCurrentStep(4);
        setRefreshKey(k => k + 1);
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to save settings');
      }
    } catch (error) {
      console.error('Failed to save settings:', error);
      alert('Failed to save settings');
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleFinish = async () => {
    if (store?._id) {
      await handleSaveSettings();
    } else {
      await handleCreateStore();
    }
  };

  const renderStepIndicator = () => (
    <div className="mb-8">
      <div className="flex items-center justify-between">
        {STEPS.map((step, idx) => (
          <div key={step.id} className="flex items-center">
            <div className="flex flex-col items-center">
              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${
                  currentStep >= step.id
                    ? 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/30'
                    : 'bg-gray-200 text-gray-500'
                }`}
              >
                {currentStep > step.id ? (
                  <Check className="h-6 w-6" />
                ) : (
                  <step.icon className="h-6 w-6" />
                )}
              </div>
              <span className={`text-xs mt-2 font-medium ${currentStep >= step.id ? 'text-blue-600' : 'text-gray-500'}`}>
                {step.name}
              </span>
            </div>
            {idx < STEPS.length - 1 && (
              <div className={`w-16 lg:w-24 h-1 mx-2 rounded ${currentStep > step.id ? 'bg-gradient-to-r from-blue-500 to-indigo-600' : 'bg-gray-200'}`} />
            )}
          </div>
        ))}
      </div>
    </div>
  );

  const renderStep1_BasicInfo = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-500/30">
          <StoreIcon className="h-8 w-8 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900">Set Up Your Store</h2>
        <p className="text-gray-500 mt-2">Tell us about your business</p>
      </div>

      <div className="flex justify-center mb-6">
        <div className="relative">
          <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center overflow-hidden border-4 border-white shadow-lg">
            {logo ? (
              <img src={logo} alt="Logo" className="w-full h-full object-cover" />
            ) : (
              <StoreIcon className="h-10 w-10 text-gray-400" />
            )}
          </div>
          <label className="absolute bottom-0 right-0 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center cursor-pointer hover:bg-blue-700 transition-colors shadow-lg">
            <Upload className="h-4 w-4 text-white" />
            <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
          </label>
          {uploading && (
            <div className="absolute inset-0 bg-black/50 rounded-2xl flex items-center justify-center">
              <Loader2 className="h-6 w-6 text-white animate-spin" />
            </div>
          )}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Store Name <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={storeName}
          onChange={(e) => setStoreName(e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="e.g., Judith Seafood Market"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Store URL
        </label>
        <div className="flex items-center">
          <span className="px-4 py-3 bg-gray-100 border border-r-0 border-gray-300 rounded-l-xl text-gray-500">
            /
          </span>
          <input
            type="text"
            value={storeSlug}
            onChange={(e) => setStoreSlug(slugify(e.target.value))}
            className="flex-1 px-4 py-3 border border-gray-300 rounded-r-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="your-store-name"
          />
        </div>
        <p className="mt-2 text-sm text-gray-500">
          Your store will be at: judithfoods.com/{storeSlug || 'your-store'}
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Description
        </label>
        <textarea
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          placeholder="Tell customers what makes your store special..."
        />
      </div>
    </div>
  );

  const renderStep2_Settings = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-emerald-500/30">
          <Settings className="h-8 w-8 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900">Store Settings</h2>
        <p className="text-gray-500 mt-2">Configure your store preferences</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Currency
          </label>
          <select
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
          >
            {CURRENCIES.map((curr) => (
              <option key={curr.code} value={curr.code}>
                {curr.symbol} {curr.code} - {curr.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Base Shipping Fee
          </label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={shippingFee}
            onChange={(e) => setShippingFee(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
            placeholder="0"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Free Shipping Threshold
          </label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={freeShippingThreshold}
            onChange={(e) => setFreeShippingThreshold(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
            placeholder="500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Tax Rate (%)
          </label>
          <input
            type="number"
            step="0.01"
            min="0"
            max="100"
            value={taxRate}
            onChange={(e) => setTaxRate(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
            placeholder="12"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Contact Email
          </label>
          <input
            type="email"
            value={storeEmail}
            onChange={(e) => setStoreEmail(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
            placeholder="contact@yourstore.com"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Contact Phone
          </label>
          <input
            type="tel"
            value={storePhone}
            onChange={(e) => setStorePhone(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
            placeholder="+63 9XX XXX XXXX"
          />
        </div>
      </div>
    </div>
  );

  const renderStep3_Customize = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-purple-500/30">
          <Palette className="h-8 w-8 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900">Customize Your Store</h2>
        <p className="text-gray-500 mt-2">Choose your brand colors</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Primary Color
          </label>
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={primaryColor}
              onChange={(e) => setPrimaryColor(e.target.value)}
              className="w-14 h-14 rounded-xl cursor-pointer border-0"
            />
            <input
              type="text"
              value={primaryColor}
              onChange={(e) => setPrimaryColor(e.target.value)}
              className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
              placeholder="#3B82F6"
            />
          </div>
          <p className="mt-2 text-sm text-gray-500">Used for buttons and links</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Accent Color
          </label>
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={accentColor}
              onChange={(e) => setAccentColor(e.target.value)}
              className="w-14 h-14 rounded-xl cursor-pointer border-0"
            />
            <input
              type="text"
              value={accentColor}
              onChange={(e) => setAccentColor(e.target.value)}
              className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
              placeholder="#10B981"
            />
          </div>
          <p className="mt-2 text-sm text-gray-500">Used for highlights</p>
        </div>
      </div>

      <div className="mt-8">
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Preview
        </label>
        <div className="border-2 border-gray-200 rounded-2xl p-6 bg-gradient-to-br from-gray-50 to-white">
          <div className="flex items-center gap-3 mb-4">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: primaryColor }}
            >
              {logo ? (
                <img src={logo} alt="" className="w-8 h-8 object-contain" />
              ) : (
                <StoreIcon className="h-6 w-6 text-white" />
              )}
            </div>
            <div>
              <div className="font-bold text-gray-900">{storeName || 'Your Store'}</div>
              <div className="text-sm text-gray-500">{storeSlug || 'your-store'}</div>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              className="px-4 py-2 text-white rounded-lg text-sm font-medium shadow-lg"
              style={{ backgroundColor: primaryColor }}
            >
              Shop Now
            </button>
            <button
              className="px-4 py-2 border rounded-lg text-sm font-medium"
              style={{ borderColor: primaryColor, color: primaryColor }}
            >
              Learn More
            </button>
            <button
              className="px-4 py-2 rounded-lg text-sm font-medium text-white"
              style={{ backgroundColor: accentColor }}
            >
              Sale!
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderStep4_Ready = () => (
    <div className="text-center py-8">
      <div className="w-24 h-24 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl shadow-green-500/30">
        <Check className="h-12 w-12 text-white" />
      </div>
      <h2 className="text-3xl font-bold text-gray-900 mb-2">
        {store?._id ? 'Settings Saved!' : 'Your Store is Ready!'}
      </h2>
      <p className="text-gray-500 mb-8 max-w-md mx-auto">
        {store?._id
          ? 'Your store settings have been updated successfully.'
          : 'Congratulations! Your store has been created. Start adding products to start selling.'}
      </p>

      <div className="bg-gradient-to-br from-gray-50 to-white border-2 border-gray-200 rounded-2xl p-6 mb-8 max-w-md mx-auto text-left">
        <h3 className="font-semibold text-gray-900 mb-4">Store Summary</h3>
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-gray-500">Store Name</span>
            <span className="font-medium">{storeName}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-500">Store URL</span>
            <span className="font-medium">/{storeSlug}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-500">Currency</span>
            <span className="font-medium">{currency}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-500">Shipping</span>
            <span className="font-medium">
              {parseFloat(shippingFee) === 0 ? 'Free' : `₱${shippingFee}`}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-500">Tax Rate</span>
            <span className="font-medium">{taxRate}%</span>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row justify-center gap-3">
        {store?._id ? (
          <button
            onClick={() => setCurrentStep(1)}
            className="px-6 py-3 border-2 border-gray-300 rounded-xl font-medium hover:bg-gray-50 transition-colors"
          >
            Edit Settings
          </button>
        ) : (
          <button
            onClick={() => router.push('/dashboard/products/new')}
            className="px-6 py-3 border-2 border-gray-300 rounded-xl font-medium hover:bg-gray-50 transition-colors"
          >
            Add Products
          </button>
        )}
        {store?._id ? (
          <a
            href={`/shop/${store.slug}`}
            target="_blank"
            className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-medium hover:from-blue-700 hover:to-indigo-700 shadow-lg shadow-blue-500/30 transition-all"
          >
            <Globe className="h-5 w-5" />
            View Store
          </a>
        ) : (
          <a
            href="/shop"
            className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-medium hover:from-blue-700 hover:to-indigo-700 shadow-lg shadow-blue-500/30 transition-all"
          >
            <StoreIcon className="h-5 w-5" />
            Browse All Stores
          </a>
        )}
      </div>
    </div>
  );

  const renderContent = () => {
    switch (currentStep) {
      case 1:
        return renderStep1_BasicInfo();
      case 2:
        return renderStep2_Settings();
      case 3:
        return renderStep3_Customize();
      case 4:
        return renderStep4_Ready();
      default:
        return null;
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return storeName.trim().length > 0;
      default:
        return true;
    }
  };

  if (status === 'loading' || storeLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          {store?._id ? 'Store Settings' : 'Create Your Store'}
        </h1>
        <p className="text-gray-500 mt-2">
          {store?._id ? 'Manage your store settings' : 'Set up your online store in minutes'}
        </p>
      </div>

      {renderStepIndicator()}

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 lg:p-8">
        {renderContent()}

        {currentStep < 4 && (
          <div className="flex justify-between mt-8 pt-6 border-t border-gray-200">
            {currentStep > 1 ? (
              <button
                onClick={handleBack}
                className="flex items-center gap-2 px-6 py-3 border-2 border-gray-300 rounded-xl font-medium hover:bg-gray-50 transition-colors"
              >
                <ChevronLeft className="h-5 w-5" />
                Back
              </button>
            ) : (
              <div />
            )}

            {currentStep < 3 ? (
              <button
                onClick={handleNext}
                disabled={!canProceed()}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-medium hover:from-blue-700 hover:to-indigo-700 shadow-lg shadow-blue-500/30 disabled:opacity-50 transition-all"
              >
                Continue
                <ChevronRight className="h-5 w-5" />
              </button>
            ) : (
              <button
                onClick={handleFinish}
                disabled={loading || !canProceed()}
                className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-medium hover:from-green-700 hover:to-emerald-700 shadow-lg shadow-green-500/30 disabled:opacity-50 transition-all"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Saving...
                  </>
                ) : store?._id ? (
                  <>
                    <Check className="h-5 w-5" />
                    Save Changes
                  </>
                ) : (
                  <>
                    <Rocket className="h-5 w-5" />
                    Create Store
                  </>
                )}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
