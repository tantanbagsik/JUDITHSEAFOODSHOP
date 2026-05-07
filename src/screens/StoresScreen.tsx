import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { storeService } from '../services/apiClient';
import { Store, RootStackParamList } from '../types';

export default function StoresScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [stores, setStores] = useState<Store[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStores = useCallback(async () => {
    try {
      const data = await storeService.getStores();
      setStores(data);
    } catch (err) {
      console.error('Fetch stores error:', err);
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchStores();
  }, [fetchStores]);

  const handleStorePress = (store: Store) => {
    navigation.navigate('StoreMenu', { store });
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchStores();
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['top']}>
      <View className="px-4 py-3 bg-white border-b border-gray-100">
        <Text className="text-xl font-bold text-gray-900">All Stores</Text>
        <Text className="text-sm text-gray-500 mt-0.5">
          {stores.length} active stores
        </Text>
      </View>

      <FlatList
        data={stores}
        keyExtractor={(item: Store) => item._id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#0284C7" />
        }
        contentContainerClassName="p-4 gap-3"
        renderItem={({ item }: { item: Store }) => (
          <TouchableOpacity
            className="flex-row bg-white rounded-2xl p-4 items-center gap-4 shadow-sm"
            onPress={() => handleStorePress(item)}
          >
            <View className="w-14 h-14 rounded-xl bg-gray-50 items-center justify-center">
              {item.logo ? (
                <Image source={{ uri: item.logo }} className="w-12 h-12 rounded-lg" contentFit="cover" />
              ) : (
                <Ionicons name="storefront" size={28} color="#0284C7" />
              )}
            </View>
            <View className="flex-1">
              <Text className="font-bold text-base text-gray-900">{item.name}</Text>
              {item.description && (
                <Text className="text-sm text-gray-500 mt-0.5" numberOfLines={1}>{item.description}</Text>
              )}
              <View className="flex-row items-center mt-1">
                <Ionicons name="cube-outline" size={14} color="#0284C7" />
                <Text className="text-sm text-ocean-600 font-semibold ml-1">{item.productCount || 0} Products</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View className="items-center justify-center py-16">
            <Ionicons name="storefront-outline" size={48} color="#ccc" />
            <Text className="text-gray-400 mt-2 text-base">No stores available</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}
