'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useCallback, useRef } from 'react';
import { 
Package, 
  Upload, 
  X, 
  Plus,
  Play,
  Image as ImageIcon,
  Check,
  Loader2,
  ChevronLeft,
  Tag,
  Grid3X3,
  DollarSign,
  Layers,
  Eye,
  Star,
  ToggleLeft,
  ToggleRight
} from 'lucide-react';

interface Category {
  _id: string;
  name: string;
  slug: string;
}

interface Variant {
  name: string;
  options: { name: string; price: number; inventory: number }[];
}

export default function NewProductPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [showNewCategory, setShowNewCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [creatingCategory, setCreatingCategory] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  
const [formData, setFormData] = useState({
    name: '',
    description: '',
    sku: '',
    price: '',
    comparePrice: '',
    cost: '',
    categoryId: '',
    tags: '',
    inventory: '0',
    isActive: true,
    isFeatured: false,
    images: [] as string[],
    videos: [] as string[],
    weight: '',
    variants: [] as Variant[],
    attributes: {} as Record<string, string>,
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    if (session?.user?.storeId) {
      fetchCategories();
    }
  }, [session]);

  const fetchCategories = async () => {
    try {
      const res = await fetch(`/api/stores/${session?.user?.storeId}/categories?storeId=${session?.user?.storeId}`);
      const data = await res.json();
      setCategories(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  };

  const createCategory = async () => {
    if (!newCategoryName.trim()) return;
    setCreatingCategory(true);
    
    try {
      const res = await fetch(`/api/stores/${session?.user?.storeId}/categories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newCategoryName }),
      });
      
      if (res.ok) {
        const newCat = await res.json();
        setCategories([...categories, newCat]);
        setFormData({ ...formData, categoryId: newCat._id });
        setShowNewCategory(false);
        setNewCategoryName('');
      }
    } catch (error) {
      console.error('Failed to create category:', error);
    } finally {
      setCreatingCategory(false);
    }
  };

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFiles(e.target.files);
    }
  };

  const handleFiles = async (files: FileList) => {
    const fileArray = Array.from(files);
    const imageFiles = fileArray.filter(file => file.type.startsWith('image/'));
    
    if (imageFiles.length === 0) return;
    
    setUploading(true);
    
    try {
      const uploadedUrls: string[] = [];
      
      for (const file of imageFiles) {
        const formData_upload = new FormData();
        formData_upload.append('file', file);
        formData_upload.append('upload_preset', 'judith-foods');
        
        const res = await fetch('https://api.cloudinary.com/v1_1/demo/image/upload', {
          method: 'POST',
          body: formData_upload,
        });
        
        if (res.ok) {
          const data = await res.json();
          uploadedUrls.push(data.secure_url);
        } else {
          const reader = new FileReader();
          const url = await new Promise<string>((resolve) => {
            reader.onload = () => resolve(reader.result as string);
            reader.readAsDataURL(file);
          });
          uploadedUrls.push(url);
        }
      }
      
      setFormData(prev => ({
        ...prev,
        images: [...prev.images, ...uploadedUrls],
      }));
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  };

  const setAsThumbnail = (index: number) => {
    setFormData(prev => {
      const newImages = [...prev.images];
      const [selected] = newImages.splice(index, 1);
      newImages.unshift(selected);
      return { ...prev, images: newImages };
    });
  };

  const addVariant = () => {
    setFormData(prev => ({
      ...prev,
      variants: [...prev.variants, { name: '', options: [{ name: '', price: 0, inventory: 0 }] }],
    }));
  };

  const updateVariant = (index: number, field: string, value: any) => {
    setFormData(prev => {
      const newVariants = [...prev.variants];
      newVariants[index] = { ...newVariants[index], [field]: value };
      return { ...prev, variants: newVariants };
    });
  };

  const removeVariant = (index: number) => {
    setFormData(prev => ({
      ...prev,
      variants: prev.variants.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.price) {
      alert('Please fill in required fields');
      return;
    }
    
    setLoading(true);

    try {
      const res = await fetch(`/api/stores/${session?.user?.storeId}/products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
          sku: formData.sku,
          price: parseFloat(formData.price),
          comparePrice: formData.comparePrice ? parseFloat(formData.comparePrice) : undefined,
          cost: formData.cost ? parseFloat(formData.cost) : undefined,
          categoryId: formData.categoryId || undefined,
          tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean),
          inventory: parseInt(formData.inventory) || 0,
isActive: formData.isActive,
          isFeatured: formData.isFeatured,
          images: formData.images,
          videos: formData.videos,
          weight: formData.weight ? parseFloat(formData.weight) : undefined,
          variants: formData.variants,
          attributes: formData.attributes,
        }),
      });

      if (res.ok) {
        router.push('/dashboard/products');
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to create product');
      }
    } catch (error) {
      console.error('Failed to create product:', error);
      alert('Failed to create product');
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading') {
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Add New Product</h1>
            <p className="text-gray-500 mt-1">Create a new product for your store</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowPreview(!showPreview)}
            className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
          >
            <Eye className="h-4 w-4" />
            Preview
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 disabled:opacity-50 shadow-lg shadow-blue-500/30 transition-all"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Check className="h-4 w-4" />
                Publish Product
              </>
            )}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Product Information</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Product Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="Enter product name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  rows={4}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                  placeholder="Describe your product..."
                />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Media</h2>
            
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all ${
                dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
              
              {uploading ? (
                <div className="py-4">
                  <Loader2 className="h-12 w-12 text-blue-600 mx-auto animate-spin" />
                  <p className="mt-2 text-gray-600">Uploading images...</p>
                </div>
              ) : (
                <>
                  <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Upload className="h-8 w-8 text-gray-400" />
                  </div>
                  <p className="text-gray-700 font-medium">Drop images here or click to upload</p>
                  <p className="text-sm text-gray-500 mt-1">PNG, JPG up to 10MB</p>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="mt-4 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Select Files
                  </button>
                </>
              )}
            </div>

            {formData.images.length > 0 && (
              <div className="mt-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-medium text-gray-700">Uploaded Images ({formData.images.length})</p>
                  <p className="text-xs text-gray-500">First image is thumbnail</p>
                </div>
                <div className="grid grid-cols-4 gap-3">
                  {formData.images.map((img, idx) => (
                    <div key={idx} className="relative group">
                      <div className={`aspect-square rounded-xl overflow-hidden border-2 ${
                        idx === 0 ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-200'
                      }`}>
                        <img src={img} alt="" className="w-full h-full object-cover" />
                      </div>
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        {idx !== 0 && (
                          <button
                            type="button"
                            onClick={() => setAsThumbnail(idx)}
                            className="p-1.5 bg-white rounded-lg text-xs font-medium"
                            title="Set as thumbnail"
                          >
                            <ImageIcon className="h-4 w-4" />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => removeImage(idx)}
                          className="p-1.5 bg-red-500 text-white rounded-lg"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                      {idx === 0 && (
                        <span className="absolute top-2 left-2 px-2 py-0.5 bg-blue-500 text-white text-xs font-medium rounded-full">
                          Thumbnail
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Product Videos</h2>
            
            <div className="space-y-3">
              {formData.videos.map((video, idx) => (
                <div key={idx} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                  <Play className="h-5 w-5 text-purple-600" />
                  <input
                    type="text"
                    value={video}
                    onChange={(e) => {
                      const newVideos = [...formData.videos];
                      newVideos[idx] = e.target.value;
                      setFormData({ ...formData, videos: newVideos });
                    }}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    placeholder="YouTube or Vimeo URL"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const newVideos = formData.videos.filter((_, i) => i !== idx);
                      setFormData({ ...formData, videos: newVideos });
                    }}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => setFormData({ ...formData, videos: [...formData.videos, ''] })}
                className="flex items-center gap-2 px-4 py-2 text-purple-600 hover:bg-purple-50 rounded-lg"
              >
                <Plus className="h-4 w-4" />
                Add Video URL
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-2">Add YouTube or Vimeo URLs for product videos</p>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Pricing</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Price <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">₱</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="0.00"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Compare at Price
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">₱</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.comparePrice}
                    onChange={(e) => setFormData({ ...formData, comparePrice: e.target.value })}
                    className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="0.00"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">Shows original price with strikethrough</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cost per Item
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">₱</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.cost}
                    onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                    className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="0.00"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">Used for profit calculation</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Inventory</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  SKU (Stock Keeping Unit)
                </label>
                <input
                  type="text"
                  value={formData.sku}
                  onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="SKU-001"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Inventory Quantity
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.inventory}
                  onChange={(e) => setFormData({ ...formData, inventory: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0"
                />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Variants</h2>
            
            {formData.variants.length === 0 ? (
              <button
                type="button"
                onClick={addVariant}
                className="w-full py-4 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 hover:border-gray-400 hover:text-gray-700 transition-colors"
              >
                <Plus className="h-5 w-5 inline mr-2" />
                Add variants (size, color, etc.)
              </button>
) : (
              <div className="space-y-4">
                {formData.variants.map((variant, idx) => (
                  <div key={idx} className="border border-gray-200 rounded-xl p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <input
                        type="text"
                        value={variant.name}
                        onChange={(e) => updateVariant(idx, 'name', e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
                        placeholder="Variant name (e.g., Size)"
                      />
                      <button
                        type="button"
                        onClick={() => removeVariant(idx)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    </div>
                    
                    <div className="ml-4 space-y-2">
                      <p className="text-sm font-medium text-gray-700">Options</p>
                      {variant.options.map((option, optIdx) => (
                        <div key={optIdx} className="flex items-center gap-2">
                          <input
                            type="text"
                            value={option.name}
                            onChange={(e) => {
                              const newVariants = [...formData.variants];
                              newVariants[idx].options[optIdx].name = e.target.value;
                              setFormData({ ...formData, variants: newVariants });
                            }}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                            placeholder="Option name (e.g., Small)"
                          />
                          <input
                            type="number"
                            value={option.price}
                            onChange={(e) => {
                              const newVariants = [...formData.variants];
                              newVariants[idx].options[optIdx].price = parseFloat(e.target.value) || 0;
                              setFormData({ ...formData, variants: newVariants });
                            }}
                            className="w-24 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                            placeholder="+₱"
                            title="Price adjustment"
                          />
                          <input
                            type="number"
                            value={option.inventory}
                            onChange={(e) => {
                              const newVariants = [...formData.variants];
                              newVariants[idx].options[optIdx].inventory = parseInt(e.target.value) || 0;
                              setFormData({ ...formData, variants: newVariants });
                            }}
                            className="w-24 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                            placeholder="Stock"
                            title="Inventory"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const newVariants = [...formData.variants];
                              newVariants[idx].options = newVariants[idx].options.filter((_, i) => i !== optIdx);
                              setFormData({ ...formData, variants: newVariants });
                            }}
                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() => {
                          const newVariants = [...formData.variants];
                          newVariants[idx].options.push({ name: '', price: 0, inventory: 0 });
                          setFormData({ ...formData, variants: newVariants });
                        }}
                        className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
                      >
                        <Plus className="h-4 w-4" />
                        Add Option
                      </button>
                    </div>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addVariant}
                  className="flex items-center gap-2 px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                >
                  <Plus className="h-4 w-4" />
                  Add another variant
                </button>
</div>
            )}
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Specifications / Attributes</h2>
            
            <div className="space-y-3">
              {Object.entries(formData.attributes).map(([key, value], idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={key}
                    onChange={(e) => {
                      const newAttrs = { ...formData.attributes };
                      const oldValue = newAttrs[key];
                      delete newAttrs[key];
                      newAttrs[e.target.value] = oldValue;
                      setFormData({ ...formData, attributes: newAttrs });
                    }}
                    className="w-1/3 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    placeholder="Attribute name"
                  />
                  <span className="text-gray-400">:</span>
                  <input
                    type="text"
                    value={value}
                    onChange={(e) => {
                      const newAttrs = { ...formData.attributes };
                      newAttrs[key] = e.target.value;
                      setFormData({ ...formData, attributes: newAttrs });
                    }}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    placeholder="Value"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const newAttrs = { ...formData.attributes };
                      delete newAttrs[key];
                      setFormData({ ...formData, attributes: newAttrs });
                    }}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => setFormData({ ...formData, attributes: { ...formData.attributes, '': '' } })}
                className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                <Plus className="h-4 w-4" />
                Add Specification
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-2">E.g., Material: Cotton, Brand: Sony, etc.</p>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Organization</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category
                </label>
                {showNewCategory ? (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
                      placeholder="Category name"
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={createCategory}
                      disabled={creatingCategory}
                      className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                    >
                      {creatingCategory ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowNewCategory(false)}
                      className="px-3 py-2 text-gray-500 hover:bg-gray-100 rounded-lg"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <select
                      value={formData.categoryId}
                      onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                      className="flex-1 px-3 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">No category</option>
                      {categories.map((cat) => (
                        <option key={cat._id} value={cat._id}>{cat.name}</option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => setShowNewCategory(true)}
                      className="px-3 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200"
                    >
                      <Plus className="h-5 w-5" />
                    </button>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tags
                </label>
                <input
                  type="text"
                  value={formData.tags}
                  onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                  placeholder="organic, fresh (comma separated)"
                />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Status</h2>
            <div className="space-y-4">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, isActive: !formData.isActive })}
                className={`w-full flex items-center justify-between p-4 rounded-xl transition-all ${
                  formData.isActive ? 'bg-emerald-50 border-2 border-emerald-200' : 'bg-gray-50 border-2 border-gray-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  {formData.isActive ? (
                    <ToggleRight className="h-6 w-6 text-emerald-600" />
                  ) : (
                    <ToggleLeft className="h-6 w-6 text-gray-400" />
                  )}
                  <div className="text-left">
                    <p className={`font-medium ${formData.isActive ? 'text-emerald-700' : 'text-gray-500'}`}>
                      {formData.isActive ? 'Active' : 'Draft'}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formData.isActive ? 'Visible in your store' : 'Only visible to you'}
                    </p>
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setFormData({ ...formData, isFeatured: !formData.isFeatured })}
                className={`w-full flex items-center justify-between p-4 rounded-xl transition-all ${
                  formData.isFeatured ? 'bg-amber-50 border-2 border-amber-200' : 'bg-gray-50 border-2 border-gray-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Star className={`h-6 w-6 ${formData.isFeatured ? 'text-amber-500 fill-amber-500' : 'text-gray-400'}`} />
                  <div className="text-left">
                    <p className={`font-medium ${formData.isFeatured ? 'text-amber-700' : 'text-gray-500'}`}>
                      Featured Product
                    </p>
                    <p className="text-xs text-gray-500">Show on homepage</p>
                  </div>
                </div>
              </button>
            </div>
          </div>

          {showPreview && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Preview</h2>
              <div className="aspect-square bg-gray-100 rounded-xl overflow-hidden mb-4">
                {formData.images[0] ? (
                  <img src={formData.images[0]} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ImageIcon className="h-16 w-16 text-gray-300" />
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <h3 className="font-semibold text-gray-900 truncate">{formData.name || 'Product Name'}</h3>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold text-blue-600">
                    ₱{formData.price || '0.00'}
                  </span>
                  {formData.comparePrice && (
                    <span className="text-sm text-gray-400 line-through">
                      ₱{formData.comparePrice}
                    </span>
                  )}
                </div>
                <div className="flex gap-2">
                  {formData.isActive ? (
                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-xs rounded-full">Active</span>
                  ) : (
                    <span className="px-2 py-0.5 bg-gray-100 text-gray-500 text-xs rounded-full">Draft</span>
                  )}
                  {formData.isFeatured && (
                    <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs rounded-full">Featured</span>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
