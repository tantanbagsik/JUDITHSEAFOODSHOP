import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Product, CartItem, SelectedVariant } from '../types';
import { cartService } from '../services/apiClient';

const CART_STORAGE_KEY = 'rn_cart_items';
const AUTH_TOKEN_KEY = 'auth_token';

interface CartContextType {
  cartItems: CartItem[];
  addToCart: (product: Product, variant?: SelectedVariant | null) => void;
  removeFromCart: (productId: string, variantKey?: string) => void;
  updateQuantity: (productId: string, quantity: number, variantKey?: string) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
  isSyncing: boolean;
  syncToDb: () => Promise<void>;
  syncFromDb: () => Promise<void>;
}

const CartContext = createContext<CartContextType>({
  cartItems: [],
  addToCart: () => {},
  removeFromCart: () => {},
  updateQuantity: () => {},
  clearCart: () => {},
  totalItems: 0,
  totalPrice: 0,
  isSyncing: false,
  syncToDb: async () => {},
  syncFromDb: async () => {},
});

function cartItemKey(productId: string, variant?: string): string {
  return variant ? `${productId}_${variant}` : productId;
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    loadCart();
  }, []);

  useEffect(() => {
    saveCart(cartItems);
  }, [cartItems]);

  const loadCart = async () => {
    try {
      const stored = await AsyncStorage.getItem(CART_STORAGE_KEY);
      if (stored) {
        setCartItems(JSON.parse(stored));
      }
      await syncFromDb();
    } catch (e) {
      console.error('Error loading cart:', e);
    }
  };

  const saveCart = async (items: CartItem[]) => {
    try {
      await AsyncStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    } catch (e) {
      console.error('Error saving cart:', e);
    }
  };

  const syncFromDb = async () => {
    const token = await AsyncStorage.getItem(AUTH_TOKEN_KEY);
    if (!token) return;

    setIsSyncing(true);
    try {
      const { storeCarts } = await cartService.getCart();
      if (storeCarts && storeCarts.length > 0) {
        const remoteItems: CartItem[] = [];
        for (const storeCart of storeCarts) {
          for (const item of storeCart.items) {
            remoteItems.push(item);
          }
        }
        const merged = mergeCartItems(cartItems, remoteItems);
        setCartItems(merged);
      }
    } catch (e) {
      console.error('Cart sync from DB error:', e);
    } finally {
      setIsSyncing(false);
    }
  };

  const syncToDb = async () => {
    const token = await AsyncStorage.getItem(AUTH_TOKEN_KEY);
    if (!token) return;

    try {
      const storeCarts = groupByStore(cartItems);
      await cartService.syncCart(storeCarts);
    } catch (e) {
      console.error('Cart sync to DB error:', e);
    }
  };

  const addToCart = useCallback((product: Product, variant?: SelectedVariant | null) => {
    const selVariant = variant || null;
    const vKey = selVariant ? `${selVariant.groupName}_${selVariant.optionName}` : undefined;
    const key = cartItemKey(product._id, vKey);
    const price = selVariant ? selVariant.price : product.price;

    setCartItems(prev => {
      const existing = prev.find(item =>
        item.product._id === product._id &&
        ((!item.selectedVariant && !selVariant) ||
          (item.selectedVariant?.groupName === selVariant?.groupName &&
            item.selectedVariant?.optionName === selVariant?.optionName))
      );

      const updated = existing
        ? prev.map(item => {
            const match = item.product._id === product._id &&
              ((!item.selectedVariant && !selVariant) ||
                (item.selectedVariant?.groupName === selVariant?.groupName &&
                  item.selectedVariant?.optionName === selVariant?.optionName));
            return match ? { ...item, quantity: item.quantity + 1 } : item;
          })
        : [...prev, { product: { ...product, price }, quantity: 1, selectedVariant: selVariant }];

      setTimeout(() => syncToDb(), 500);
      return updated;
    });
  }, []);

  const removeFromCart = useCallback((productId: string, variantKey?: string) => {
    setCartItems(prev => {
      const updated = variantKey
        ? prev.filter(item => cartItemKey(item.product._id,
            item.selectedVariant ? `${item.selectedVariant.groupName}_${item.selectedVariant.optionName}` : undefined) !== cartItemKey(productId, variantKey))
        : prev.filter(item => item.product._id !== productId);
      setTimeout(() => syncToDb(), 500);
      return updated;
    });
  }, []);

  const updateQuantity = useCallback((productId: string, quantity: number, variantKey?: string) => {
    setCartItems(prev => {
      const updated = quantity < 1
        ? (variantKey
            ? prev.filter(item => cartItemKey(item.product._id,
                item.selectedVariant ? `${item.selectedVariant.groupName}_${item.selectedVariant.optionName}` : undefined) !== cartItemKey(productId, variantKey))
            : prev.filter(item => item.product._id !== productId))
        : prev.map(item => {
            const match = variantKey
              ? cartItemKey(item.product._id,
                  item.selectedVariant ? `${item.selectedVariant.groupName}_${item.selectedVariant.optionName}` : undefined) === cartItemKey(productId, variantKey)
              : item.product._id === productId;
            return match ? { ...item, quantity } : item;
          });
      setTimeout(() => syncToDb(), 500);
      return updated;
    });
  }, []);

  const clearCart = useCallback(() => {
    setCartItems([]);
    AsyncStorage.removeItem(CART_STORAGE_KEY);
    syncToDb();
  }, []);

  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = cartItems.reduce(
    (sum, item) => sum + (item.selectedVariant?.price || item.product.price) * item.quantity,
    0
  );

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        totalItems,
        totalPrice,
        isSyncing,
        syncToDb,
        syncFromDb,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);

function mergeCartItems(local: CartItem[], remote: CartItem[]): CartItem[] {
  const merged = [...remote];
  for (const localItem of local) {
    const idx = merged.findIndex(i => i.product._id === localItem.product._id);
    if (idx >= 0) {
      merged[idx].quantity += localItem.quantity;
    } else {
      merged.push(localItem);
    }
  }
  return merged;
}

function groupByStore(items: CartItem[]) {
  const storeMap: Record<string, any> = {};
  for (const item of items) {
    const storeId = item.product.storeId._id;
    if (!storeMap[storeId]) {
      storeMap[storeId] = {
        storeId,
        storeName: item.product.storeId.name,
        storeSlug: item.product.storeId.slug,
        items: [],
        updatedAt: Date.now(),
      };
    }
    storeMap[storeId].items.push({
      _id: item.product._id,
      name: item.product.name,
      price: item.selectedVariant?.price || item.product.price,
      images: item.product.images,
      inventory: item.product.inventory,
      quantity: item.quantity,
      selectedVariant: item.selectedVariant || undefined,
    });
  }
  return Object.values(storeMap);
}
