export interface CartItem {
  _id: string;
  name: string;
  price: number;
  images?: string[];
  quantity: number;
  inventory: number;
  storeId: string;
  storeName?: string;
  storeSlug?: string;
}

export interface StoreCart {
  storeId: string;
  storeName: string;
  storeSlug: string;
  items: CartItem[];
  updatedAt: number;
}

export function getCartKey(storeId?: string): string {
  if (!storeId) return 'cart';
  return `cart_${storeId}`;
}

export function getStoreCartsKey(): string {
  return 'store_carts';
}

export function getAllStoreCarts(): StoreCart[] {
  if (typeof window === 'undefined') return [];
  const data = localStorage.getItem(getStoreCartsKey());
  return data ? JSON.parse(data) : [];
}

export function getCart(storeId: string): CartItem[] {
  if (typeof window === 'undefined') return [];
  const cart = localStorage.getItem(getCartKey(storeId));
  return cart ? JSON.parse(cart) : [];
}

export function setCart(storeId: string, items: CartItem[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(getCartKey(storeId), JSON.stringify(items));
  updateStoreCartsIndex(storeId, items);
}

export function addToCart(storeId: string, storeName: string, storeSlug: string, item: Omit<CartItem, 'storeId' | 'storeName' | 'storeSlug'>): CartItem[] {
  const cart = getCart(storeId);
  const existingIndex = cart.findIndex(i => i._id === item._id);
  
  if (existingIndex >= 0) {
    cart[existingIndex].quantity += item.quantity;
  } else {
    cart.push({
      ...item,
      storeId,
      storeName,
      storeSlug,
    } as CartItem);
  }
  
  setCart(storeId, cart);
  return cart;
}

export function updateCartItemQuantity(storeId: string, itemId: string, quantity: number): CartItem[] {
  const cart = getCart(storeId);
  const index = cart.findIndex(i => i._id === itemId);
  
  if (index >= 0) {
    if (quantity <= 0) {
      cart.splice(index, 1);
    } else {
      cart[index].quantity = Math.min(quantity, cart[index].inventory);
    }
  }
  
  setCart(storeId, cart);
  return cart;
}

export function removeFromCart(storeId: string, itemId: string): CartItem[] {
  const cart = getCart(storeId).filter(i => i._id !== itemId);
  setCart(storeId, cart);
  return cart;
}

export function clearCart(storeId: string): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(getCartKey(storeId));
  removeStoreFromIndex(storeId);
}

export function updateStoreCartsIndex(storeId: string, items: CartItem[]): void {
  if (typeof window === 'undefined') return;
  
  const allCarts = getAllStoreCarts();
  const existingIndex = allCarts.findIndex(c => c.storeId === storeId);
  const storeCart: StoreCart = {
    storeId,
    storeName: items[0]?.storeName || 'Store',
    storeSlug: items[0]?.storeSlug || '',
    items,
    updatedAt: Date.now(),
  };
  
  if (existingIndex >= 0) {
    if (items.length === 0) {
      allCarts.splice(existingIndex, 1);
    } else {
      allCarts[existingIndex] = storeCart;
    }
  } else if (items.length > 0) {
    allCarts.push(storeCart);
  }
  
  localStorage.setItem(getStoreCartsKey(), JSON.stringify(allCarts));
}

export function removeStoreFromIndex(storeId: string): void {
  if (typeof window === 'undefined') return;
  
  const allCarts = getAllStoreCarts().filter(c => c.storeId !== storeId);
  localStorage.setItem(getStoreCartsKey(), JSON.stringify(allCarts));
}

export function getCartCount(storeId?: string): number {
  if (storeId) {
    const cart = getCart(storeId);
    return cart.reduce((sum, item) => sum + item.quantity, 0);
  }
  
  const allCarts = getAllStoreCarts();
  return allCarts.reduce((sum, cart) => sum + cart.items.reduce((s, i) => s + i.quantity, 0), 0);
}

export function getAllCartItems(): { storeId: string; storeName: string; storeSlug: string; items: CartItem[] }[] {
  return getAllStoreCarts().map(cart => ({
    storeId: cart.storeId,
    storeName: cart.storeName,
    storeSlug: cart.storeSlug,
    items: cart.items,
  }));
}

export function calculateCartTotals(items: CartItem[], taxRate: number = 0.12, shippingThreshold: number = 500, shippingFee: number = 50) {
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const tax = subtotal * taxRate;
  const shipping = subtotal >= shippingThreshold ? 0 : shippingFee;
  const total = subtotal + tax + shipping;
  
  return { subtotal, tax, shipping, total };
}
