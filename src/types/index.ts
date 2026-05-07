import { NavigatorScreenParams } from '@react-navigation/native';

export type RootStackParamList = {
  MainTabs: NavigatorScreenParams<TabParamList>;
  StoreMenu: { store: Store };
  ProductDetail: { product: Product };
  Login: undefined;
  Register: undefined;
  ProfileEdit: undefined;
  OrderHistory: { title?: string; icon?: string; message?: string } | undefined;
  ShippingAddresses: { title?: string; icon?: string; message?: string } | undefined;
  PaymentMethods: { title?: string; icon?: string; message?: string } | undefined;
  Wishlist: { title?: string; icon?: string; message?: string } | undefined;
  HelpSupport: { title?: string; icon?: string; message?: string } | undefined;
  Settings: { title?: string; icon?: string; message?: string } | undefined;
};

export type TabParamList = {
  Home: undefined;
  Stores: undefined;
  Cart: undefined;
  Profile: undefined;
};

export interface Store {
  _id: string;
  name: string;
  slug: string;
  logo?: string;
  banner?: string;
  description?: string;
  productCount: number;
  totalProducts?: number;
  isActive: boolean;
  settings?: {
    shippingFee: number;
    freeShippingThreshold: number;
    taxRate: number;
  };
}

export interface ProductVariant {
  name: string;
  options: {
    name: string;
    price: number;
    inventory: number;
  }[];
}

export interface Product {
  _id: string;
  name: string;
  description?: string;
  sku?: string;
  price: number;
  comparePrice?: number;
  images: string[];
  storeId: { _id: string; name: string; slug: string };
  categoryId?: { _id: string; name: string };
  isFeatured: boolean;
  inventory: number;
  isActive: boolean;
  tags: string[];
  variants: ProductVariant[];
  attributes: Record<string, string>;
  weight?: number;
}

export interface SelectedVariant {
  groupName: string;
  optionName: string;
  price: number;
}

export interface CartItem {
  product: Product;
  quantity: number;
  selectedVariant: SelectedVariant | null;
}

export interface StoreCart {
  storeId: string;
  storeName: string;
  items: CartItem[];
}

export interface StoreMenuResponse {
  store: Store & {
    totalProducts?: number;
  };
  categories: {
    name: string;
    items: Product[];
  }[];
  allProducts: Product[];
  featured: Product[];
  totalProducts: number;
}

export interface CustomerInfo {
  name: string;
  email: string;
  phone: string;
}

export interface ShippingAddress {
  firstName: string;
  lastName: string;
  address1: string;
  address2: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone: string;
}
