'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  Plus,
  Search,
  Edit,
  Trash2,
  X,
  Check,
  Loader2,
  Store,
  Mail,
  Phone,
  Calendar,
  Eye,
  AlertCircle,
  Shield,
  Filter,
  Globe,
  Clock,
} from 'lucide-react';

interface Owner {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
}

interface Store {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  logo?: string;
  banner?: string;
  owner: Owner;
  subscription: {
    plan: 'free' | 'pro' | 'premium';
    status: 'active' | 'cancelled' | 'expired';
    expiresAt?: string;
  };
  settings: {
    currency: string;
    timezone: string;
    shippingFee: number;
    freeShippingThreshold: number;
    taxRate: number;
  };
  customDomain?: string;
  isActive: boolean;
  isApproved: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function AdminStoresPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved'>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState<Store | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState<Store | null>(null);
  const [showDetailModal, setShowDetailModal] = useState<Store | null>(null);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    ownerEmail: '',
    subscription: {
      plan: 'free' as 'free' | 'pro' | 'premium',
      status: 'active' as 'active' | 'cancelled' | 'expired',
    },
    settings: {
      currency: 'PHP',
      timezone: 'Asia/Manila',
      shippingFee: 0,
      freeShippingThreshold: 0,
      taxRate: 0,
    },
    isActive: true,
    isApproved: false,
  });

  useEffect(() => {
    if (status === 'unauthenticated' || (status === 'authenticated' && session?.user?.role !== 'admin' && session?.user?.role !== 'superadmin')) {
      router.push('/dashboard');
    }
  }, [status, session, router]);

  useEffect(() => {
    if (status === 'authenticated' && (session?.user?.role === 'admin' || session?.user?.role === 'superadmin')) {
      fetchStores();
    }
  }, [status, session, filter]);

  const fetchStores = async () => {
    try {
      const url = filter === 'all' 
        ? '/api/admin/stores' 
        : `/api/admin/stores?status=${filter}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setStores(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error('Failed to fetch stores:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddStore = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/admin/stores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        await fetchStores();
        setShowAddModal(false);
        resetForm();
      }
    } catch (error) {
      console.error('Failed to add store:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateStore = async () => {
    if (!showEditModal) return;
    
    setSaving(true);
    try {
      const res = await fetch('/api/admin/stores', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storeId: showEditModal._id,
          name: formData.name,
          description: formData.description,
          isActive: formData.isActive,
          isApproved: formData.isApproved,
          subscription: formData.subscription,
          settings: formData.settings,
        }),
      });

      if (res.ok) {
        await fetchStores();
        setShowEditModal(null);
        resetForm();
      }
    } catch (error) {
      console.error('Failed to update store:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteStore = async () => {
    if (!showDeleteModal) return;
    
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/stores?storeId=${showDeleteModal._id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        await fetchStores();
        setShowDeleteModal(null);
      }
    } catch (error) {
      console.error('Failed to delete store:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleApproveStore = async (store: Store) => {
    setSaving(true);
    try {
      const res = await fetch('/api/admin/stores', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storeId: store._id,
          isApproved: true,
        }),
      });

      if (res.ok) {
        await fetchStores();
      }
    } catch (error) {
      console.error('Failed to approve store:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (store: Store) => {
    setSaving(true);
    try {
      const res = await fetch('/api/admin/stores', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storeId: store._id,
          isActive: !store.isActive,
        }),
      });

      if (res.ok) {
        await fetchStores();
      }
    } catch (error) {
      console.error('Failed to toggle store:', error);
    } finally {
      setSaving(false);
    }
  };

  const openEditModal = (store: Store) => {
    setFormData({
      name: store.name,
      description: store.description || '',
      ownerEmail: store.owner.email,
      subscription: store.subscription,
      settings: store.settings,
      isActive: store.isActive,
      isApproved: store.isApproved,
    });
    setShowEditModal(store);
  };

  const openAddModal = () => {
    resetForm();
    setShowAddModal(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      ownerEmail: '',
      subscription: {
        plan: 'free',
        status: 'active',
      },
      settings: {
        currency: 'PHP',
        timezone: 'Asia/Manila',
        shippingFee: 0,
        freeShippingThreshold: 0,
        taxRate: 0,
      },
      isActive: true,
      isApproved: false,
    });
  };

  const filteredStores = stores.filter(store =>
    store.name.toLowerCase().includes(search.toLowerCase()) ||
    store.owner.name.toLowerCase().includes(search.toLowerCase()) ||
    store.owner.email.toLowerCase().includes(search.toLowerCase())
  );

  const pendingCount = stores.filter(s => !s.isApproved).length;
  const approvedCount = stores.filter(s => s.isApproved).length;

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (status === 'authenticated' && session?.user?.role !== 'admin' && session?.user?.role !== 'superadmin') {
    return (
      <div className="text-center py-16">
        <Shield className="h-16 w-16 text-red-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
        <p className="text-gray-500">You need admin privileges to access this page.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Store Management</h1>
          <p className="text-gray-500 mt-1">Manage all stores and pending requests</p>
        </div>
        <button
          onClick={openAddModal}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-xl shadow-lg shadow-blue-500/30 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Store
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <button
          onClick={() => setFilter('all')}
          className={`p-4 rounded-xl border-2 transition-all ${
            filter === 'all'
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-200 bg-white hover:border-gray-300'
          }`}
        >
          <div className="flex items-center gap-3">
            <Store className="h-8 w-8 text-blue-600" />
            <div className="text-left">
              <p className="text-2xl font-bold text-gray-900">{stores.length}</p>
              <p className="text-sm text-gray-500">Total Stores</p>
            </div>
          </div>
        </button>

        <button
          onClick={() => setFilter('pending')}
          className={`p-4 rounded-xl border-2 transition-all ${
            filter === 'pending'
              ? 'border-amber-500 bg-amber-50'
              : 'border-gray-200 bg-white hover:border-gray-300'
          }`}
        >
          <div className="flex items-center gap-3">
            <Clock className="h-8 w-8 text-amber-600" />
            <div className="text-left">
              <p className="text-2xl font-bold text-gray-900">{pendingCount}</p>
              <p className="text-sm text-gray-500">Pending Approval</p>
            </div>
          </div>
        </button>

        <button
          onClick={() => setFilter('approved')}
          className={`p-4 rounded-xl border-2 transition-all ${
            filter === 'approved'
              ? 'border-green-500 bg-green-50'
              : 'border-gray-200 bg-white hover:border-gray-300'
          }`}
        >
          <div className="flex items-center gap-3">
            <Check className="h-8 w-8 text-green-600" />
            <div className="text-left">
              <p className="text-2xl font-bold text-gray-900">{approvedCount}</p>
              <p className="text-sm text-gray-500">Approved</p>
            </div>
          </div>
        </button>
      </div>

      <div className="mb-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search stores..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-5 w-5 text-gray-400" />
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as 'all' | 'pending' | 'approved')}
            className="px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Stores</option>
            <option value="pending">Pending Only</option>
            <option value="approved">Approved Only</option>
          </select>
        </div>
      </div>

      <div className="bg-white shadow-lg rounded-2xl overflow-hidden">
        {filteredStores.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Store className="h-10 w-10 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No stores found</h3>
            <p className="text-gray-500 mb-4">
              {search ? 'Try adjusting your search.' : filter === 'pending' ? 'No pending store requests.' : 'No stores registered yet.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Store
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Owner
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Plan
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredStores.map((store) => (
                  <tr key={store._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="h-12 w-12 flex-shrink-0 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl overflow-hidden flex items-center justify-center">
                          {store.logo ? (
                            <img src={store.logo} alt={store.name} className="h-full w-full object-cover" />
                          ) : (
                            <Store className="h-6 w-6 text-white" />
                          )}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-semibold text-gray-900">{store.name}</div>
                          <div className="text-xs text-gray-500">/{store.slug}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{store.owner.name}</div>
                      <div className="text-xs text-gray-500 flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        {store.owner.email}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full capitalize ${
                        store.subscription.plan === 'premium' ? 'bg-purple-100 text-purple-800' :
                        store.subscription.plan === 'pro' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {store.subscription.plan}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col gap-1">
                        <span className={`px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          store.isApproved ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {store.isApproved ? 'Approved' : 'Pending'}
                        </span>
                        <span className={`px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          store.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                        }`}>
                          {store.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(store.createdAt).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-2">
                        {!store.isApproved && (
                          <button
                            onClick={() => handleApproveStore(store)}
                            disabled={saving}
                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors disabled:opacity-50"
                            title="Approve store"
                          >
                            <Check className="h-4 w-4" />
                          </button>
                        )}
                        <button
                          onClick={() => setShowDetailModal(store)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="View details"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => openEditModal(store)}
                          className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                          title="Edit store"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleToggleActive(store)}
                          disabled={saving}
                          className={`p-2 rounded-lg transition-colors disabled:opacity-50 ${
                            store.isActive 
                              ? 'text-amber-600 hover:bg-amber-50' 
                              : 'text-green-600 hover:bg-green-50'
                          }`}
                          title={store.isActive ? 'Deactivate' : 'Activate'}
                        >
                          {store.isActive ? <AlertCircle className="h-4 w-4" /> : <Check className="h-4 w-4" />}
                        </button>
                        <button
                          onClick={() => setShowDeleteModal(store)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete store"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl p-6 w-full max-w-2xl my-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Plus className="h-5 w-5 text-blue-600" />
                Add New Store
              </h3>
              <button onClick={() => { setShowAddModal(false); resetForm(); }} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Store Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter store name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                  placeholder="Store description"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Owner Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={formData.ownerEmail}
                  onChange={(e) => setFormData({ ...formData, ownerEmail: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="owner@email.com"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Subscription Plan
                  </label>
                  <select
                    value={formData.subscription.plan}
                    onChange={(e) => setFormData({
                      ...formData,
                      subscription: { ...formData.subscription, plan: e.target.value as any }
                    })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="free">Free</option>
                    <option value="pro">Pro</option>
                    <option value="premium">Premium</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Auto Approve
                  </label>
                  <select
                    value={formData.isApproved ? 'yes' : 'no'}
                    onChange={(e) => setFormData({ ...formData, isApproved: e.target.value === 'yes' })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="no">Pending</option>
                    <option value="yes">Approved</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Shipping Fee
                  </label>
                  <input
                    type="number"
                    value={formData.settings.shippingFee}
                    onChange={(e) => setFormData({
                      ...formData,
                      settings: { ...formData.settings, shippingFee: parseFloat(e.target.value) || 0 }
                    })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tax Rate (%)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.settings.taxRate}
                    onChange={(e) => setFormData({
                      ...formData,
                      settings: { ...formData.settings, taxRate: parseFloat(e.target.value) || 0 }
                    })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => { setShowAddModal(false); resetForm(); }}
                className="flex-1 py-2.5 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleAddStore}
                disabled={saving || !formData.name || !formData.ownerEmail}
                className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4" />
                    Create Store
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl p-6 w-full max-w-2xl my-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Edit className="h-5 w-5 text-indigo-600" />
                Edit Store
              </h3>
              <button onClick={() => { setShowEditModal(null); resetForm(); }} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Store Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Owner
                </label>
                <input
                  type="text"
                  value={showEditModal.owner.name}
                  disabled
                  className="w-full px-4 py-3 border border-gray-200 bg-gray-50 rounded-xl text-gray-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Subscription Plan
                  </label>
                  <select
                    value={formData.subscription.plan}
                    onChange={(e) => setFormData({
                      ...formData,
                      subscription: { ...formData.subscription, plan: e.target.value as any }
                    })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="free">Free</option>
                    <option value="pro">Pro</option>
                    <option value="premium">Premium</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Approval Status
                  </label>
                  <select
                    value={formData.isApproved ? 'approved' : 'pending'}
                    onChange={(e) => setFormData({ ...formData, isApproved: e.target.value === 'approved' })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Store Status
                  </label>
                  <select
                    value={formData.isActive ? 'active' : 'inactive'}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.value === 'active' })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tax Rate (%)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.settings.taxRate}
                    onChange={(e) => setFormData({
                      ...formData,
                      settings: { ...formData.settings, taxRate: parseFloat(e.target.value) || 0 }
                    })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Shipping Fee
                  </label>
                  <input
                    type="number"
                    value={formData.settings.shippingFee}
                    onChange={(e) => setFormData({
                      ...formData,
                      settings: { ...formData.settings, shippingFee: parseFloat(e.target.value) || 0 }
                    })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Free Shipping Threshold
                  </label>
                  <input
                    type="number"
                    value={formData.settings.freeShippingThreshold}
                    onChange={(e) => setFormData({
                      ...formData,
                      settings: { ...formData.settings, freeShippingThreshold: parseFloat(e.target.value) || 0 }
                    })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => { setShowEditModal(null); resetForm(); }}
                className="flex-1 py-2.5 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateStore}
                disabled={saving || !formData.name}
                className="flex-1 py-2.5 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4" />
                    Update Store
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">Delete Store</h3>
              <button onClick={() => setShowDeleteModal(null)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-4 bg-red-50 rounded-xl mb-4">
              <div className="flex items-center gap-3">
                <AlertCircle className="h-6 w-6 text-red-600" />
                <div>
                  <p className="font-medium text-gray-900">{showDeleteModal.name}</p>
                  <p className="text-sm text-gray-500">Owner: {showDeleteModal.owner.name}</p>
                </div>
              </div>
            </div>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this store? This action cannot be undone and will remove all associated data.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteModal(null)}
                className="flex-1 py-2.5 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteStore}
                disabled={saving}
                className="flex-1 py-2.5 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 disabled:opacity-50"
              >
                {saving ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {showDetailModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl p-6 w-full max-w-2xl my-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Eye className="h-5 w-5 text-blue-600" />
                Store Details
              </h3>
              <button onClick={() => setShowDetailModal(null)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="h-5 w-5" />
              </button>
            </div>

            {showDetailModal.banner && (
              <div className="mb-6">
                <img
                  src={showDetailModal.banner}
                  alt={showDetailModal.name}
                  className="w-full h-32 object-cover rounded-xl"
                />
              </div>
            )}

            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="h-16 w-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center flex-shrink-0">
                  {showDetailModal.logo ? (
                    <img src={showDetailModal.logo} alt={showDetailModal.name} className="h-full w-full object-cover rounded-xl" />
                  ) : (
                    <Store className="h-8 w-8 text-white" />
                  )}
                </div>
                <div>
                  <h4 className="text-xl font-bold text-gray-900">{showDetailModal.name}</h4>
                  <p className="text-sm text-gray-500">/{showDetailModal.slug}</p>
                </div>
              </div>

              {showDetailModal.description && (
                <div>
                  <h5 className="text-sm font-semibold text-gray-700 mb-1">Description</h5>
                  <p className="text-gray-600">{showDetailModal.description}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h5 className="text-sm font-semibold text-gray-700 mb-2">Owner Information</h5>
                  <div className="p-3 bg-gray-50 rounded-xl space-y-2">
                    <p className="text-sm font-medium text-gray-900">{showDetailModal.owner.name}</p>
                    <p className="text-sm text-gray-600 flex items-center gap-1">
                      <Mail className="h-3 w-3" />
                      {showDetailModal.owner.email}
                    </p>
                    {showDetailModal.owner.phone && (
                      <p className="text-sm text-gray-600 flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        {showDetailModal.owner.phone}
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <h5 className="text-sm font-semibold text-gray-700 mb-2">Subscription</h5>
                  <div className="p-3 bg-gray-50 rounded-xl space-y-2">
                    <p className="text-sm font-medium capitalize text-gray-900">{showDetailModal.subscription.plan} Plan</p>
                    <p className="text-sm text-gray-600 capitalize">Status: {showDetailModal.subscription.status}</p>
                    {showDetailModal.subscription.expiresAt && (
                      <p className="text-sm text-gray-600">
                        Expires: {new Date(showDetailModal.subscription.expiresAt).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <h5 className="text-sm font-semibold text-gray-700 mb-2">Store Settings</h5>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-gray-50 rounded-xl">
                    <p className="text-xs text-gray-500">Currency</p>
                    <p className="text-sm font-medium text-gray-900">{showDetailModal.settings.currency}</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-xl">
                    <p className="text-xs text-gray-500">Timezone</p>
                    <p className="text-sm font-medium text-gray-900">{showDetailModal.settings.timezone}</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-xl">
                    <p className="text-xs text-gray-500">Shipping Fee</p>
                    <p className="text-sm font-medium text-gray-900">₱{showDetailModal.settings.shippingFee}</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-xl">
                    <p className="text-xs text-gray-500">Free Shipping Threshold</p>
                    <p className="text-sm font-medium text-gray-900">₱{showDetailModal.settings.freeShippingThreshold}</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-xl">
                    <p className="text-xs text-gray-500">Tax Rate</p>
                    <p className="text-sm font-medium text-gray-900">{showDetailModal.settings.taxRate}%</p>
                  </div>
                  {showDetailModal.customDomain && (
                    <div className="p-3 bg-gray-50 rounded-xl">
                      <p className="text-xs text-gray-500">Custom Domain</p>
                      <p className="text-sm font-medium text-gray-900 flex items-center gap-1">
                        <Globe className="h-3 w-3" />
                        {showDetailModal.customDomain}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className={`px-3 py-1 inline-flex text-sm font-semibold rounded-full ${
                    showDetailModal.isApproved ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'
                  }`}>
                    {showDetailModal.isApproved ? 'Approved' : 'Pending'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-3 py-1 inline-flex text-sm font-semibold rounded-full ${
                    showDetailModal.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {showDetailModal.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-200">
                <p className="text-xs text-gray-500 flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  Created: {new Date(showDetailModal.createdAt).toLocaleString()}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Last Updated: {new Date(showDetailModal.updatedAt).toLocaleString()}
                </p>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowDetailModal(null)}
                className="flex-1 py-2.5 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50"
              >
                Close
              </button>
              {!showDetailModal.isApproved && (
                <button
                  onClick={() => {
                    handleApproveStore(showDetailModal);
                    setShowDetailModal(null);
                  }}
                  disabled={saving}
                  className="flex-1 py-2.5 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <Check className="h-4 w-4" />
                  Approve Store
                </button>
              )}
              <button
                onClick={() => {
                  openEditModal(showDetailModal);
                  setShowDetailModal(null);
                }}
                className="flex-1 py-2.5 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 flex items-center justify-center gap-2"
              >
                <Edit className="h-4 w-4" />
                Edit Store
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
