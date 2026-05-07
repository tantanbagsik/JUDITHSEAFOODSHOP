import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ScrollView,
  TextInput,
  Modal,
  Animated,
} from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList, Product, Store } from '../types';
import { storeService } from '../services/apiClient';
import { useCart } from '../hooks/useCart';

type StoreMenuRouteProp = RouteProp<RootStackParamList, 'StoreMenu'>;

export default function StoreMenuScreen() {
  const route = useRoute<StoreMenuRouteProp>();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { store: initialStore } = route.params;

  const [store, setStore] = useState(initialStore);
  const [allStores, setAllStores] = useState<Store[]>([]);
  const [categories, setCategories] = useState<{ name: string; items: Product[] }[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [featured, setFeatured] = useState<Product[]>([]);
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showStorePicker, setShowStorePicker] = useState(false);

  const { addToCart, totalItems } = useCart();

  const fetchStoreMenu = useCallback(async () => {
    try {
      const data = await storeService.getStoreMenu(initialStore._id);
      setStore(data.store);
      setCategories(data.categories);
      setAllProducts(data.allProducts);
      setFeatured(data.featured);
    } catch (err) {
      console.error('Fetch store menu error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [initialStore._id]);

  const fetchAllStores = useCallback(async () => {
    try {
      const stores = await storeService.getStores();
      setAllStores(stores);
    } catch (err) {
      console.error('Fetch stores error:', err);
    }
  }, []);

  useEffect(() => {
    fetchStoreMenu();
    fetchAllStores();
  }, [fetchStoreMenu, fetchAllStores]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchStoreMenu();
  };

  const switchStore = (s: Store) => {
    setShowStorePicker(false);
    navigation.replace('StoreMenu', { store: s });
  };

  const filteredProducts = allProducts.filter(p => {
    const matchesCategory = activeCategory === 'All' ||
      (p.categoryId && p.categoryId.name === activeCategory);
    const matchesSearch = !searchQuery ||
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const displayProducts = activeCategory === 'All' && !searchQuery
    ? allProducts
    : filteredProducts;

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50">
        <Ionicons name="fish" size={48} color="#0284C7" />
        <Text className="mt-3 text-base text-gray-500 font-medium">Loading store...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['top']}>
      <LinearGradient colors={['#0C4A6E', '#0284C7']} className="px-4 pt-3 pb-4">
        <View className="flex-row items-center justify-between mb-3">
          <View className="flex-row items-center flex-1">
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              className="w-9 h-9 items-center justify-center rounded-full bg-white/10"
            >
              <Ionicons name="arrow-back" size={20} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setShowStorePicker(true)}
              className="flex-1 ml-3"
            >
              <View className="flex-row items-center">
                <View className="flex-1">
                  <Text className="text-lg font-bold text-white" numberOfLines={1}>
                    {store.name}
                  </Text>
                  {store.description ? (
                    <Text className="text-xs text-white/70 mt-0.5" numberOfLines={1}>
                      {store.description}
                    </Text>
                  ) : null}
                </View>
                <Ionicons name="chevron-down" size={16} color="rgba(255,255,255,0.7)" />
              </View>
            </TouchableOpacity>
          </View>
          <View className="flex-row items-center gap-2 ml-2">
            <TouchableOpacity
              onPress={() => setShowSearch(!showSearch)}
              className="w-9 h-9 items-center justify-center rounded-full bg-white/10"
            >
              <Ionicons name="search" size={18} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity
              className="w-9 h-9 items-center justify-center rounded-full bg-white/10 relative"
              onPress={() => navigation.getParent()?.navigate('Cart')}
            >
              <Ionicons name="cart" size={18} color="#fff" />
              {totalItems > 0 && (
                <View className="absolute -top-1 -right-1 bg-red-500 rounded-full w-4 h-4 items-center justify-center">
                  <Text className="text-white text-[9px] font-bold">{totalItems}</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {showSearch && (
          <View className="flex-row items-center bg-white/15 rounded-xl px-3 py-2 mt-1">
            <Ionicons name="search" size={16} color="rgba(255,255,255,0.7)" />
            <TextInput
              className="flex-1 text-white text-sm ml-2 py-0"
              placeholder="Search products..."
              placeholderTextColor="rgba(255,255,255,0.5)"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={18} color="rgba(255,255,255,0.7)" />
              </TouchableOpacity>
            )}
          </View>
        )}

        <View className="flex-row items-center justify-between mt-3">
          <View className="flex-row items-center bg-white/10 rounded-lg px-3 py-1.5">
            <Ionicons name="cube-outline" size={14} color="rgba(255,255,255,0.8)" />
            <Text className="text-white/90 text-xs font-medium ml-1.5">
              {store.totalProducts || allProducts.length} Products
            </Text>
          </View>
          <TouchableOpacity
            className="flex-row items-center bg-white/10 rounded-lg px-3 py-1.5"
            onPress={() => setShowStorePicker(true)}
          >
            <Ionicons name="storefront-outline" size={14} color="rgba(255,255,255,0.8)" />
            <Text className="text-white/90 text-xs font-medium ml-1.5">
              {allStores.length} Stores
            </Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Category Tabs */}
      {categories.length > 0 && (
        <View className="bg-white border-b border-gray-100">
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 12, paddingVertical: 8, gap: 8 }}
          >
            <TouchableOpacity
              onPress={() => setActiveCategory('All')}
              className={`px-4 py-2 rounded-full ${activeCategory === 'All' ? 'bg-ocean-600' : 'bg-gray-100'}`}
            >
              <Text className={`text-sm font-semibold ${activeCategory === 'All' ? 'text-white' : 'text-gray-600'}`}>
                All
              </Text>
            </TouchableOpacity>
            {categories.map((cat) => (
              <TouchableOpacity
                key={cat.name}
                onPress={() => setActiveCategory(cat.name)}
                className={`px-4 py-2 rounded-full ${activeCategory === cat.name ? 'bg-ocean-600' : 'bg-gray-100'}`}
              >
                <Text className={`text-sm font-semibold ${activeCategory === cat.name ? 'text-white' : 'text-gray-600'}`}>
                  {cat.name}
                  <Text className="text-xs opacity-70 ml-1">({cat.items.length})</Text>
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Products Grid */}
      <FlatList
        data={displayProducts}
        keyExtractor={(item: Product) => item._id}
        numColumns={2}
        contentContainerClassName="p-3 gap-3"
        columnWrapperClassName="gap-3"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#0284C7" />
        }
        ListHeaderComponent={
          featured.length > 0 && activeCategory === 'All' && !searchQuery ? (
            <View className="mb-3">
              <View className="flex-row items-center justify-between mb-2">
                <View className="flex-row items-center">
                  <Ionicons name="star" size={16} color="#F59E0B" />
                  <Text className="text-base font-bold text-gray-900 ml-1.5">Featured</Text>
                </View>
              </View>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 12 }}
              >
                {featured.slice(0, 6).map((product: Product) => (
                  <FeaturedProductCard
                    key={product._id}
                    product={product}
                    onPress={() => navigation.navigate('ProductDetail', { product })}
                    onAddToCart={addToCart}
                  />
                ))}
              </ScrollView>
            </View>
          ) : null
        }
        ListEmptyComponent={
          <View className="items-center justify-center py-16">
            <Ionicons name="search-outline" size={48} color="#ccc" />
            <Text className="text-gray-400 text-base mt-3 font-medium">No products found</Text>
            <Text className="text-gray-300 text-sm mt-1">Try adjusting your search</Text>
          </View>
        }
        renderItem={({ item }: { item: Product }) => (
          <ProductCard
            product={item}
            onPress={() => navigation.navigate('ProductDetail', { product: item })}
            onAddToCart={addToCart}
          />
        )}
      />

      {/* Store Picker Modal */}
      <Modal visible={showStorePicker} transparent animationType="slide">
        <View className="flex-1 bg-black/40">
          <TouchableOpacity
            className="flex-1"
            onPress={() => setShowStorePicker(false)}
          />
          <View className="bg-white rounded-t-3xl max-h-[60%]">
            <View className="items-center pt-3 pb-2">
              <View className="w-10 h-1 bg-gray-300 rounded-full" />
            </View>
            <View className="px-4 pb-3 border-b border-gray-100">
              <Text className="text-lg font-bold text-gray-900">Select Store</Text>
              <Text className="text-sm text-gray-500 mt-1">
                Browse products from {allStores.length} stores
              </Text>
            </View>
            <ScrollView className="px-4 pt-2 pb-4">
              {allStores.map((s) => (
                <TouchableOpacity
                  key={s._id}
                  className={`flex-row items-center p-4 rounded-xl mb-2 ${
                    s._id === store._id ? 'bg-ocean-50 border border-ocean-200' : 'bg-gray-50'
                  }`}
                  onPress={() => switchStore(s)}
                >
                  <View className="w-12 h-12 rounded-xl bg-white items-center justify-center mr-3">
                    {s.logo ? (
                      <Image source={{ uri: s.logo }} className="w-10 h-10 rounded-lg" contentFit="cover" />
                    ) : (
                      <Ionicons name="storefront" size={24} color="#0284C7" />
                    )}
                  </View>
                  <View className="flex-1">
                    <Text className="font-bold text-gray-900 text-base">{s.name}</Text>
                    <Text className="text-xs text-gray-500 mt-0.5">
                      {s.productCount || 0} products
                    </Text>
                  </View>
                  {s._id === store._id && (
                    <Ionicons name="checkmark-circle" size={22} color="#0284C7" />
                  )}
                </TouchableOpacity>
              ))}
              <TouchableOpacity
                className="flex-row items-center p-4 rounded-xl bg-ocean-600 mt-1"
                onPress={() => {
                  setShowStorePicker(false);
                  navigation.navigate('MainTabs' as any, { screen: 'Stores' });
                }}
              >
                <Ionicons name="apps" size={20} color="#fff" />
                <Text className="text-white font-bold ml-3">Browse All Stores</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function FeaturedProductCard({
  product,
  onPress,
  onAddToCart,
}: {
  product: Product;
  onPress: () => void;
  onAddToCart: (p: Product) => void;
}) {
  const hasVariants = product.variants && product.variants.length > 0;
  return (
    <TouchableOpacity
      className="w-40 bg-white rounded-xl overflow-hidden shadow-sm"
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View className="relative">
        {product.images?.[0] ? (
          <Image source={{ uri: product.images[0] }} className="w-full h-28" contentFit="cover" />
        ) : (
          <View className="w-full h-28 bg-gray-100 items-center justify-center">
            <Ionicons name="fish" size={32} color="#ccc" />
          </View>
        )}
        {product.comparePrice && product.comparePrice > product.price && (
          <View className="absolute top-2 left-2 bg-red-500 px-2 py-0.5 rounded-full">
            <Text className="text-white text-[10px] font-bold">
              -{Math.round((1 - product.price / product.comparePrice) * 100)}%
            </Text>
          </View>
        )}
        {hasVariants && (
          <View className="absolute top-2 right-2 bg-ocean-600 px-2 py-0.5 rounded-full">
            <Text className="text-white text-[9px] font-bold">Variants</Text>
          </View>
        )}
        {product.inventory === 0 && (
          <View className="absolute inset-0 bg-black/50 items-center justify-center">
            <Text className="text-white font-bold text-xs">Out of Stock</Text>
          </View>
        )}
      </View>
      <View className="p-2.5">
        <Text className="text-sm font-semibold text-gray-900" numberOfLines={1}>
          {product.name}
        </Text>
        <Text className="text-[10px] text-ocean-600 mt-0.5" numberOfLines={1}>
          {product.storeId?.name || ''}
        </Text>
        <View className="flex-row items-center mt-1 gap-2">
          <Text className="text-base font-bold text-ocean-600">
            ₱{product.price.toFixed(2)}
          </Text>
          {product.comparePrice && product.comparePrice > product.price && (
            <Text className="text-xs text-gray-400 line-through">
              ₱{product.comparePrice.toFixed(2)}
            </Text>
          )}
        </View>
        <TouchableOpacity
          onPress={() => onAddToCart(product)}
          disabled={product.inventory === 0}
          className={`mt-2 flex-row items-center justify-center py-2 rounded-lg ${
            product.inventory === 0 ? 'bg-gray-200' : 'bg-ocean-600'
          }`}
        >
          <Ionicons name="cart" size={14} color={product.inventory === 0 ? '#999' : '#fff'} />
          <Text className={`text-xs font-semibold ml-1 ${
            product.inventory === 0 ? 'text-gray-400' : 'text-white'
          }`}>Add</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

function ProductCard({
  product,
  onPress,
  onAddToCart,
}: {
  product: Product;
  onPress: () => void;
  onAddToCart: (p: Product) => void;
}) {
  const hasVariants = product.variants && product.variants.length > 0;
  return (
    <TouchableOpacity
      className="flex-1 bg-white rounded-xl overflow-hidden shadow-sm"
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View className="relative">
        {product.images?.[0] ? (
          <Image
            source={{ uri: product.images[0] }}
            className="w-full h-36"
            contentFit="cover"
          />
        ) : (
          <View className="w-full h-36 bg-gray-100 items-center justify-center">
            <Ionicons name="fish" size={40} color="#ccc" />
          </View>
        )}
        {product.isFeatured && (
          <View className="absolute top-2 left-2 bg-amber-400 px-2 py-0.5 rounded-full">
            <Text className="text-white text-[10px] font-bold">Featured</Text>
          </View>
        )}
        {product.comparePrice && product.comparePrice > product.price && (
          <View className="absolute top-2 right-2 bg-red-500 px-2 py-0.5 rounded-full">
            <Text className="text-white text-[10px] font-bold">
              -{Math.round((1 - product.price / product.comparePrice) * 100)}%
            </Text>
          </View>
        )}
        {hasVariants && (
          <View className="absolute top-2 right-2 bg-ocean-600 px-2 py-0.5 rounded-full"
            style={{ top: product.comparePrice && product.comparePrice > product.price ? 28 : 8 }}
          >
            <Text className="text-white text-[9px] font-bold">Variants</Text>
          </View>
        )}
        {product.inventory === 0 && (
          <View className="absolute inset-0 bg-black/50 items-center justify-center">
            <Text className="text-white font-bold text-xs">Out of Stock</Text>
          </View>
        )}
      </View>
      <View className="p-3">
        <Text className="text-sm font-semibold text-gray-900" numberOfLines={2}>
          {product.name}
        </Text>
        <Text className="text-[10px] text-ocean-600 font-medium mt-1" numberOfLines={1}>
          {product.storeId?.name || ''}
        </Text>
        <Text className="text-xs text-gray-400 mt-0.5" numberOfLines={1}>
          {product.description || 'Fresh seafood'}
        </Text>
        <View className="flex-row items-center justify-between mt-2">
          <View className="flex-row items-center gap-1.5">
            <Text className="text-base font-bold text-ocean-600">
              ₱{product.price.toFixed(2)}
            </Text>
            {product.comparePrice && product.comparePrice > product.price && (
              <Text className="text-xs text-gray-400 line-through">
                ₱{product.comparePrice.toFixed(2)}
              </Text>
            )}
          </View>
        </View>
        <TouchableOpacity
          onPress={() => onAddToCart(product)}
          disabled={product.inventory === 0}
          className={`mt-2.5 flex-row items-center justify-center py-2.5 rounded-lg ${
            product.inventory === 0 ? 'bg-gray-200' : 'bg-ocean-600'
          }`}
        >
          <Ionicons name="cart" size={14} color={product.inventory === 0 ? '#999' : '#fff'} />
          <Text className={`text-xs font-semibold ml-1.5 ${
            product.inventory === 0 ? 'text-gray-400' : 'text-white'
          }`}>Add to Cart</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}
