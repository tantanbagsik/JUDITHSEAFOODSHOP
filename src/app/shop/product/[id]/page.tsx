'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, ShoppingCart, Minus, Plus, Play, X, Check, Loader2, Star } from 'lucide-react';
import { addToCart as addToStoreCart } from '@/lib/cart';

interface VariantOption {
  name: string;
  price: number;
  inventory: number;
}

interface Variant {
  name: string;
  options: VariantOption[];
}

interface Product {
  _id: string;
  name: string;
  description?: string;
  price: number;
  comparePrice?: number;
  images: string[];
  videos?: string[];
  inventory: number;
  sku?: string;
  categoryId?: { name: string };
  storeId?: string;
  storeName?: string;
  storeSlug?: string;
  attributes?: Record<string, string>;
  variants?: Variant[];
  isFeatured?: boolean;
}

export default function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [product, setProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [addingToCart, setAddingToCart] = useState(false);
  const [addedToCart, setAddedToCart] = useState(false);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'details' | 'videos'>('details');
  const [variantSelections, setVariantSelections] = useState<Record<number, number>>({});
  const [resolvedParams, setResolvedParams] = useState<{ id: string } | null>(null);

  useEffect(() => {
    params.then((p) => setResolvedParams(p));
  }, [params]);

  useEffect(() => {
    if (resolvedParams?.id) {
      fetchProduct(resolvedParams.id);
    }
  }, [resolvedParams]);

  const fetchProduct = async (id: string) => {
    try {
      const res = await fetch(`/api/products/${id}`);
      if (res.ok) {
        const data = await res.json();
        setProduct(data);
        if (data.variants) {
          const initial: Record<number, number> = {};
          data.variants.forEach((_: Variant, idx: number) => {
            initial[idx] = 0;
          });
          setVariantSelections(initial);
        }
      }
    } catch (error) {
      console.error('Error fetching product:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSelectedVariantPrice = () => {
    if (!product?.variants?.length) return product?.price || 0;
    
    let price = product.price;
    Object.entries(variantSelections).forEach(([idx, optIdx]) => {
      const variant = product.variants?.[parseInt(idx)];
      if (variant?.options?.[optIdx]) {
        price += variant.options[optIdx].price;
      }
    });
    return price;
  };

  const getSelectedVariantInventory = () => {
    if (!product?.variants?.length) return product?.inventory || 0;
    
    let inventory = product.inventory;
    Object.entries(variantSelections).forEach(([idx, optIdx]) => {
      const variant = product.variants?.[parseInt(idx)];
      const opt = variant?.options?.[optIdx as number];
      if (opt) {
        inventory = Math.min(inventory, opt.inventory);
      }
    });
    return inventory;
  };

  const getVariantSelectionLabel = () => {
    if (!product?.variants?.length) return '';
    const selections = product.variants.map((variant, idx) => {
      const selectedOpt = variant.options[variantSelections[idx]];
      return selectedOpt ? `${variant.name}: ${selectedOpt.name}` : null;
    }).filter((v): v is string => v !== null);
    return selections.join(', ');
  };

  const addToCart = async () => {
    if (!product) return;
    setAddingToCart(true);
    
    try {
      let storeId = product.storeId;
      let storeSlug = product.storeSlug;
      let storeName = product.storeName;
      
      if (!storeId) {
        const storesRes = await fetch('/api/public/stores');
        if (storesRes.ok) {
          const stores = await storesRes.json();
          const store = stores.find((s: any) => s._id === product.storeId) || stores[0];
          if (store) {
            storeId = store._id;
            storeSlug = store.slug;
            storeName = store.name;
          }
        }
      }

      const variantLabel = getVariantSelectionLabel();
      
      addToStoreCart(storeId || 'default', storeName || 'Store', storeSlug || '', {
        _id: product._id,
        name: product.name,
        price: getSelectedVariantPrice(),
        images: product.images,
        inventory: getSelectedVariantInventory(),
        quantity: quantity,
        variantSelection: variantLabel || undefined,
      });

      setAddedToCart(true);
      window.dispatchEvent(new Event('cartUpdated'));
      
      setTimeout(() => {
        if (storeSlug) {
          router.push(`/shop/${storeSlug}`);
        } else {
          router.push('/shop/cart');
        }
      }, 1000);
      
    } catch (error) {
      console.error('Error adding to cart:', error);
    } finally {
      setAddingToCart(false);
    }
  };

  const getYouTubeEmbedUrl = (url: string) => {
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/);
    if (match) {
      return `https://www.youtube.com/embed/${match[1]}`;
    }
    return url;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Product not found</h1>
          <Link href="/shop" className="text-blue-600 hover:underline">Back to shop</Link>
        </div>
      </div>
    );
  }

  const discount = product.comparePrice 
    ? Math.round((1 - product.price / product.comparePrice) * 100)
    : 0;

  const currentPrice = getSelectedVariantPrice();
  const currentInventory = getSelectedVariantInventory();

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <Link href="/shop" className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
            <ArrowLeft className="h-5 w-5" />
            Back to Shop
          </Link>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 p-6 lg:p-8">
            <div>
              <div className="aspect-square bg-gray-100 rounded-xl overflow-hidden mb-4 relative">
                {product.isFeatured && (
                  <span className="absolute top-4 left-4 z-10 bg-yellow-400 text-yellow-900 text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1">
                    <Star className="h-3 w-3 fill-current" />
                    Featured
                  </span>
                )}
                {product.images?.[selectedImage] ? (
                  <img 
                    src={product.images[selectedImage]} 
                    alt={product.name} 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-400">No Image</div>
                )}
              </div>
              
              {product.videos && product.videos.length > 0 && (
                <div className="mb-4">
                  <div className="flex gap-2 mb-3">
                    <button
                      onClick={() => setActiveTab('details')}
                      className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                        activeTab === 'details' 
                          ? 'bg-blue-600 text-white' 
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      Photos ({product.images.length})
                    </button>
                    <button
                      onClick={() => setActiveTab('videos')}
                      className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                        activeTab === 'videos' 
                          ? 'bg-purple-600 text-white' 
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      <Play className="h-4 w-4 inline mr-2" />
                      Videos ({product.videos.length})
                    </button>
                  </div>
                  
                  {activeTab === 'videos' && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {product.videos.map((video, idx) => (
                        <button
                          key={idx}
                          onClick={() => setShowVideoModal(true)}
                          className="relative aspect-video bg-gray-900 rounded-lg overflow-hidden group"
                        >
                          {video.includes('youtube') || video.includes('youtu.be') ? (
                            <img 
                              src={`https://img.youtube.com/vi/${video.match(/(?:v=|youtu\.be\/)([^&\n?#]+)/)?.[1]}/mqdefault.jpg`} 
                              alt="Video thumbnail"
                              className="w-full h-full object-cover group-hover:opacity-80 transition-opacity"
                            />
                          ) : (
                            <div className="flex items-center justify-center h-full bg-gray-800">
                              <Play className="h-8 w-8 text-white" />
                            </div>
                          )}
                          <div className="absolute inset-0 flex items-center justify-center">
                            <Play className="h-10 w-10 text-white opacity-80 group-hover:opacity-100 transition-opacity" />
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
              
              {product.images.length > 1 && activeTab === 'details' && (
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {product.images.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedImage(idx)}
                      className={`w-20 h-20 rounded-lg overflow-hidden border-2 flex-shrink-0 transition-all ${
                        idx === selectedImage ? 'border-blue-600 ring-2 ring-blue-200' : 'border-transparent hover:border-gray-300'
                      }`}
                    >
                      <img src={img} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="flex flex-col">
              {product.categoryId?.name && (
                <span className="text-sm text-blue-600 font-medium">{product.categoryId.name}</span>
              )}
              <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mt-2">{product.name}</h1>
              
              <div className="flex items-baseline gap-3 mt-4">
                <span className="text-3xl font-bold text-blue-600">₱{currentPrice.toFixed(2)}</span>
                {product.comparePrice && (
                  <>
                    <span className="text-xl text-gray-400 line-through">₱{product.comparePrice.toFixed(2)}</span>
                    <span className="bg-red-100 text-red-600 px-2 py-1 rounded text-sm font-medium">
                      -{discount}% OFF
                    </span>
                  </>
                )}
              </div>

              <div className="mt-4">
                {currentInventory > 10 && (
                  <span className="inline-flex items-center gap-1 text-green-600 font-medium">
                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                    In Stock
                  </span>
                )}
                {currentInventory > 0 && currentInventory <= 10 && (
                  <span className="inline-flex items-center gap-1 text-orange-600 font-medium">
                    <span className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></span>
                    Only {currentInventory} left!
                  </span>
                )}
                {currentInventory === 0 && (
                  <span className="inline-flex items-center gap-1 text-red-600 font-medium">
                    <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                    Out of Stock
                  </span>
                )}
              </div>

              {product.variants && product.variants.length > 0 && (
                <div className="mt-6 space-y-4">
                  {product.variants.map((variant, variantIndex) => (
                    <div key={variantIndex}>
                      <label className="text-sm font-medium text-gray-700 mb-2 block">
                        {variant.name}
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {variant.options.map((option, optionIndex) => (
                          <button
                            key={optionIndex}
                            onClick={() => {
                              setVariantSelections(prev => ({
                                ...prev,
                                [variantIndex]: optionIndex
                              }));
                            }}
                            disabled={option.inventory === 0}
                            className={`px-4 py-2 border rounded-lg font-medium transition-all ${
                              variantSelections[variantIndex] === optionIndex
                                ? 'border-blue-600 bg-blue-600 text-white'
                                : option.inventory === 0
                                  ? 'border-gray-200 text-gray-400 cursor-not-allowed opacity-50'
                                  : 'border-gray-300 text-gray-700 hover:border-blue-400'
                            }`}
                          >
                            {option.name}
                            {option.price > 0 && (
                              <span className="ml-1 text-sm opacity-80">
                                (+₱{option.price.toFixed(2)})
                              </span>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {product.attributes && Object.keys(product.attributes).length > 0 && (
                <div className="mt-6 p-4 bg-gray-50 rounded-xl">
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Specifications</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(product.attributes).map(([key, value]) => (
                      <div key={key} className="flex">
                        <span className="text-sm text-gray-500">{key}:</span>
                        <span className="text-sm text-gray-900 ml-2">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {product.description && (
                <div className="mt-6">
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Description</h3>
                  <p className="text-gray-600 leading-relaxed">{product.description}</p>
                </div>
              )}

              {product.sku && (
                <p className="text-sm text-gray-500 mt-4">SKU: {product.sku}</p>
              )}

              <div className="mt-8">
                <label className="text-sm font-medium text-gray-700 mb-2 block">Quantity</label>
                <div className="flex items-center gap-4">
                  <div className="flex items-center border border-gray-300 rounded-lg bg-white">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="p-3 hover:bg-gray-100 transition-colors"
                      disabled={quantity <= 1}
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <span className="px-4 font-medium min-w-[60px] text-center">{quantity}</span>
                    <button
                      onClick={() => setQuantity(Math.min(currentInventory, quantity + 1))}
                      className="p-3 hover:bg-gray-100 transition-colors"
                      disabled={quantity >= currentInventory}
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                  <span className="text-sm text-gray-500">
                    {currentInventory} available
                  </span>
                </div>
              </div>

              <button
                onClick={addToCart}
                disabled={currentInventory === 0 || addingToCart || addedToCart}
                className={`w-full mt-6 py-4 rounded-xl font-semibold text-lg flex items-center justify-center gap-2 transition-all ${
                  addedToCart 
                    ? 'bg-green-500 text-white' 
                    : currentInventory === 0 
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                      : 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-500/30'
                }`}
              >
                {addingToCart ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Adding...
                  </>
                ) : addedToCart ? (
                  <>
                    <Check className="h-5 w-5" />
                    Added!
                  </>
                ) : (
                  <>
                    <ShoppingCart className="h-5 w-5" />
                    {currentInventory === 0 ? 'Out of Stock' : 'Add to Cart'}
                  </>
                )}
              </button>
              
              {product.storeSlug && (
                <p className="text-center text-sm text-gray-500 mt-3">
                  You'll be redirected to{' '}
                  <span className="font-medium text-purple-600">{product.storeName || 'the store'}</span>
                </p>
              )}
            </div>
          </div>
        </div>
      </main>

      {showVideoModal && product.videos && product.videos.length > 0 && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-auto">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="text-lg font-bold text-gray-900">Product Videos</h3>
              <button
                onClick={() => setShowVideoModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-4 space-y-6">
              {product.videos.map((video, idx) => (
                <div key={idx}>
                  <p className="text-sm font-medium text-gray-700 mb-2">Video {idx + 1}</p>
                  <div className="aspect-video bg-gray-100 rounded-xl overflow-hidden">
                    {video.includes('youtube') || video.includes('youtu.be') ? (
                      <iframe
                        src={getYouTubeEmbedUrl(video)}
                        className="w-full h-full"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    ) : video.includes('vimeo') ? (
                      <iframe
                        src={video.replace('vimeo.com/', 'player.vimeo.com/video/')}
                        className="w-full h-full"
                        allow="autoplay; fullscreen; picture-in-picture"
                        allowFullScreen
                      />
                    ) : (
                      <video
                        src={video}
                        controls
                        className="w-full h-full"
                      />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}