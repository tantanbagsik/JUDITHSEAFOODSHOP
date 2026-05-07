import axios from 'axios';
import { API_BASE_URL, ENDPOINTS } from './api';
import AsyncStorage from '@react-native-async-storage/async-storage';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const storeService = {
  getStores: async () => {
    const { data } = await api.get(ENDPOINTS.STORES);
    return data;
  },
  getStoreProducts: async (storeId: string) => {
    const { data } = await api.get(`${ENDPOINTS.STORE_PRODUCTS(storeId)}?storeId=${storeId}&active=true`);
    return data;
  },
  getStoreMenu: async (storeId: string) => {
    const { data } = await api.get(ENDPOINTS.STORE_MENU(storeId));
    return data;
  },
};

export const productService = {
  getAllProducts: async (params?: { featured?: boolean; search?: string; storeId?: string }) => {
    const query: Record<string, any> = { active: true };
    if (params?.featured) query.featured = true;
    if (params?.search) query.search = params.search;
    if (params?.storeId) query.storeId = params.storeId;
    const { data } = await api.get(ENDPOINTS.PRODUCTS, { params: query });
    return data;
  },
  getProduct: async (id: string) => {
    const { data } = await api.get(ENDPOINTS.PRODUCT(id));
    return data;
  },
};

export const cartService = {
  getCart: async () => {
    const { data } = await api.get(ENDPOINTS.CART);
    return data;
  },
  syncCart: async (storeCarts: any[]) => {
    const { data } = await api.post(ENDPOINTS.CART, { storeCarts });
    return data;
  },
};

export const orderService = {
  createOrder: async (orderData: any) => {
    const { data } = await api.post(ENDPOINTS.ORDERS, orderData);
    return data;
  },
};

export default api;
