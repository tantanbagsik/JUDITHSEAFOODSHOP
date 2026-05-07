import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ScrollView,
} from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { storeService, productService } from '../services/apiClient';
import { Store, Product, RootStackParamList } from '../types';
import { useCart } from '../hooks/useCart';

export default function HomeScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [stores, setStores] = useState<Store[]>([]);
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const { addToCart, totalItems } = useCart();

  const fetchData = useCallback(async () => {
    try {
      const [storesData, allProductsData] = await Promise.all([
        storeService.getStores(),
        productService.getAllProducts(),
      ]);
      setStores(storesData);
      setAllProducts(allProductsData);

      const featured = allProductsData.filter((p: Product) => p.isFeatured);
      setFeaturedProducts(featured.length > 0 ? featured : allProductsData.slice(0, 6));
    } catch (err) {
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleStorePress = async (store: Store) => {
    navigation.navigate('StoreMenu', { store });
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50">
        <Ionicons name="fish" size={48} color="#0284C7" />
        <Text className="mt-3 text-base text-gray-500 font-medium">Loading Judith Seafoods...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['top']}>
      <View className="flex-row items-center justify-between px-4 py-3 bg-white">
        <View className="flex-row items-center gap-2.5">
          <View className="w-9 h-9 rounded-full bg-ocean-600 items-center justify-center">
            <Ionicons name="fish" size={18} color="#fff" />
          </View>
          <View>
            <Text className="font-bold text-base text-gray-900">Judith Seafoods</Text>
            <Text className="text-xs text-gray-400">Fresh catch, delivered</Text>
          </View>
        </View>
        <TouchableOpacity
          className="relative"
          onPress={() => navigation.getParent()?.navigate('Cart')}
        >
          <Ionicons name="cart" size={24} color="#0284C7" />
          {totalItems > 0 && (
            <View className="absolute -top-1.5 -right-1.5 bg-red-500 rounded-full w-4 h-4 items-center justify-center">
              <Text className="text-white text-[9px] font-bold">{totalItems}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <View className="flex-1">
        <ScrollView
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#0284C7" />
          }
        >
          <LinearGradient
            colors={['#0D47A1', '#1565C0', '#1E88E5']}
            className="mx-4 mt-3 rounded-2xl p-5"
          >
            <View className="flex-row justify-between items-center">
              <View>
                <Text className="text-white font-extrabold text-xl">Fresh Catch!</Text>
                <Text className="text-white/90 text-sm mt-1">
                  Premium seafood delivered fresh
                </Text>
                <TouchableOpacity className="bg-white px-4 py-2 rounded-xl mt-3 self-start">
                  <Text className="text-ocean-600 font-bold">Shop Now</Text>
                </TouchableOpacity>
              </View>
              <View className="w-16 h-16 rounded-full bg-white/15 items-center justify-center">
                <Ionicons name="boat" size={48} color="rgba(255,255,255,0.8)" />
              </View>
            </View>
          </LinearGradient>

          {stores.length > 0 && (
            <>
              <Text className="font-bold text-base px-4 mt-5 mb-2.5 text-gray-900">Partner Stores</Text>
              <FlatList
                horizontal
                data={stores}
                keyExtractor={(item: Store) => item._id}
                showsHorizontalScrollIndicator={false}
                contentContainerClassName="px-4 gap-3"
                renderItem={({ item }: { item: Store }) => (
                  <TouchableOpacity
                    className="w-20 items-center"
                    onPress={() => handleStorePress(item)}
                  >
                    <View className="w-14 h-14 rounded-2xl bg-white items-center justify-center shadow-sm">
                      {item.logo ? (
                        <Image source={{ uri: item.logo }} className="w-10 h-10 rounded-xl" />
                      ) : (
                        <Ionicons name="storefront" size={24} color="#0284C7" />
                      )}
                    </View>
                    <Text className="mt-1.5 text-xs font-semibold text-gray-700 text-center" numberOfLines={1}>
                      {item.name}
                    </Text>
                    <Text className="text-[9px] text-gray-400 mt-0.5">
                      {item.productCount || 0} products
                    </Text>
                  </TouchableOpacity>
                )}
              />
            </>
          )}

          {featuredProducts.length > 0 && (
            <>
              <Text className="font-bold text-base px-4 mt-5 mb-2.5 text-gray-900">Featured Products</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}
              >
                {featuredProducts.map(product => (
                  <TouchableOpacity
                    key={product._id}
                    className="w-36 bg-white rounded-xl overflow-hidden shadow-sm"
                    onPress={() => navigation.navigate('ProductDetail', { product })}
                    activeOpacity={0.7}
                  >
                    <View className="relative">
                      {product.images?.[0] ? (
                        <Image
                          source={{ uri: product.images[0] }}
                          className="w-full h-24"
                          contentFit="cover"
                        />
                      ) : (
                        <View className="w-full h-24 bg-gray-100 items-center justify-center">
                          <Ionicons name="fish" size={32} color="#ccc" />
                        </View>
                      )}
                      {product.comparePrice && product.comparePrice > product.price && (
                        <View className="absolute top-1 left-1 bg-red-500 px-1.5 py-0.5 rounded-full">
                          <Text className="text-white text-[9px] font-bold">
                            -{Math.round((1 - product.price / product.comparePrice) * 100)}%
                          </Text>
                        </View>
                      )}
                      {product.inventory === 0 && (
                        <View className="absolute inset-0 bg-black/50 items-center justify-center">
                          <Text className="text-white font-bold text-xs">Out of Stock</Text>
                        </View>
                      )}
                    </View>
                    <View className="p-2.5">
                      <Text className="font-semibold text-xs text-gray-800" numberOfLines={1}>
                        {product.name}
                      </Text>
                      <Text className="text-[9px] text-ocean-600 mt-0.5" numberOfLines={1}>
                        {typeof product.storeId === 'object' ? product.storeId.name : ''}
                      </Text>
                      <Text className="text-ocean-600 font-bold text-sm mt-1">
                        ₱{product.price.toFixed(2)}
                      </Text>
                      <TouchableOpacity
                        className="absolute bottom-2.5 right-2.5 w-7 h-7 rounded-full bg-ocean-600 items-center justify-center"
                        onPress={() => addToCart(product)}
                      >
                        <Ionicons name="add" size={18} color="#fff" />
                      </TouchableOpacity>
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </>
          )}

          <Text className="font-bold text-base px-4 mt-5 mb-2.5 text-gray-900">All Products</Text>
          {allProducts.map(product => {
            const hasVariants = product.variants && product.variants.length > 0;
            return (
            <TouchableOpacity
              key={product._id}
              className="flex-row mx-4 mb-2.5 bg-white rounded-xl p-3 items-center gap-3 shadow-sm"
              onPress={() => navigation.navigate('ProductDetail', { product })}
              activeOpacity={0.7}
            >
              <View className="w-[70px] h-[70px] rounded-xl overflow-hidden">
                {product.images?.[0] ? (
                  <Image
                    source={{ uri: product.images[0] }}
                    className="w-full h-full"
                    contentFit="cover"
                  />
                ) : (
                  <View className="w-full h-full bg-gray-100 items-center justify-center">
                    <Ionicons name="fish" size={28} color="#ccc" />
                  </View>
                )}
              </View>
              <View className="flex-1">
                <View className="flex-row items-center gap-2">
                  <Text className="font-semibold text-sm text-gray-800" numberOfLines={1}>
                    {product.name}
                  </Text>
                  {hasVariants && (
                    <View className="bg-ocean-100 px-1.5 py-0.5 rounded">
                      <Text className="text-[9px] text-ocean-700 font-bold">VARIANTS</Text>
                    </View>
                  )}
                </View>
                <Text className="text-xs text-ocean-600 font-medium mt-0.5">
                  {typeof product.storeId === 'object' ? product.storeId.name : ''}
                </Text>
                <View className="flex-row items-center gap-2 mt-0.5">
                  <Text className="text-ocean-600 font-bold text-base">
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
                className={`w-9 h-9 rounded-full items-center justify-center ${product.inventory === 0 ? 'bg-gray-300' : 'bg-ocean-600'}`}
                onPress={() => addToCart(product)}
                disabled={product.inventory === 0}
              >
                <Ionicons name="cart" size={18} color={product.inventory === 0 ? '#999' : '#fff'} />
              </TouchableOpacity>
            </TouchableOpacity>
            );
          })}
          </ScrollView>
      </View>
    </SafeAreaView>
  );
}
