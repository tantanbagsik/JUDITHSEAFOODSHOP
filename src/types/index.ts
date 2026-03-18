export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'vendor' | 'customer';
  storeId?: string;
  avatar?: string;
  phone?: string;
}

export interface Store {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  logo?: string;
  banner?: string;
  owner: string | User;
  subscription: {
    plan: 'free' | 'pro' | 'premium';
    status: 'active' | 'cancelled' | 'expired';
    expiresAt?: Date;
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
  createdAt: Date;
}

export interface Product {
  _id: string;
  storeId: string;
  name: string;
  description?: string;
  sku?: string;
  price: number;
  comparePrice?: number;
  cost?: number;
  images: string[];
  categoryId?: string | Category;
  tags: string[];
  inventory: number;
  isActive: boolean;
  isFeatured: boolean;
  variants: {
    name: string;
    options: {
      name: string;
      price: number;
      inventory: number;
    }[];
  }[];
  createdAt: Date;
}

export interface Category {
  _id: string;
  storeId: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  parentId?: string;
  isActive: boolean;
}

export interface OrderItem {
  productId: string | Product;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  variant?: {
    name: string;
    option: string;
  };
}

export interface Order {
  _id: string;
  storeId: string;
  orderNumber: string;
  customer: {
    email: string;
    name: string;
    phone?: string;
  };
  shippingAddress: {
    firstName: string;
    lastName: string;
    address1: string;
    address2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    phone?: string;
  };
  items: OrderItem[];
  subtotal: number;
  tax: number;
  shipping: number;
  discount: number;
  total: number;
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  paymentMethod: string;
  createdAt: Date;
}

export interface MenuItem {
  id: string;
  label: string;
  type: 'link' | 'category' | 'product' | 'external';
  url?: string;
  categoryId?: string;
  productId?: string;
  children?: MenuItem[];
}
