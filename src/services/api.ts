export const API_BASE_URL = 'https://judith-seafoods.vercel.app/';

export const ENDPOINTS = {
  STORES: 'api/public/stores',
  PRODUCTS: 'api/products',
  STORE_PRODUCTS: (storeId: string) => `api/stores/${storeId}/products`,
  STORE_MENU: (storeId: string) => `api/public/stores/${storeId}/menu`,
  PRODUCT: (id: string) => `api/products/${id}`,
  ORDERS: 'api/public/orders',
  CART: 'api/cart',
  LOGIN: 'api/auth/callback/credentials',
  REGISTER: 'api/auth/register',
  ME: 'api/auth/me',
};
