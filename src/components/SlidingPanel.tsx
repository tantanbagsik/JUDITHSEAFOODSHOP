import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  TouchableWithoutFeedback,
  ScrollView,
  Animated,
  PanResponder,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { Product, CartItem } from '../types';
import * as Haptics from 'expo-haptics';

const SCREEN_WIDTH = Dimensions.get('window').width;
const MIN_PANEL_WIDTH = 80;
const MAX_PANEL_WIDTH = SCREEN_WIDTH - 40;
const DEFAULT_PANEL_WIDTH = SCREEN_WIDTH * 0.45;

interface SlidingPanelProps {
  products: Product[];
  storeName: string;
  cartItems: CartItem[];
  onAddToCart: (product: Product) => void;
  onUpdateQuantity: (productId: string, qty: number) => void;
  onRemoveFromCart: (productId: string) => void;
  totalPrice: number;
  totalItems: number;
  onClose: () => void;
}

export default function SlidingPanel({
  products,
  storeName,
  cartItems,
  onAddToCart,
  onUpdateQuantity,
  onRemoveFromCart,
  totalPrice,
  totalItems,
  onClose,
}: SlidingPanelProps) {
  const [panelWidth, setPanelWidth] = useState(DEFAULT_PANEL_WIDTH);
  const [isFull, setIsFull] = useState(false);
  const [activeTab, setActiveTab] = useState<'products' | 'cart'>('products');
  const translateX = useState(new Animated.Value(-DEFAULT_PANEL_WIDTH))[0];

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: (_, gestureState) => {
      return Math.abs(gestureState.dx) > 5;
    },
    onPanResponderMove: (_, gestureState) => {
      if (gestureState.dx > 0 && panelWidth < MAX_PANEL_WIDTH) {
        setPanelWidth(prev => Math.min(prev + gestureState.dx * 0.5, MAX_PANEL_WIDTH));
      } else if (gestureState.dx < 0 && panelWidth > MIN_PANEL_WIDTH) {
        setPanelWidth(prev => Math.max(prev + gestureState.dx * 0.5, MIN_PANEL_WIDTH));
      }
    },
    onPanResponderRelease: () => {
      Haptics.selectionAsync();
    },
  });

  const toggleFull = useCallback(() => {
    Haptics.selectionAsync();
    setIsFull(prev => !prev);
  }, []);

  const cartItemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <View style={[styles.container, { width: isFull ? SCREEN_WIDTH : panelWidth }]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
          <Ionicons name="close" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{storeName}</Text>
        <TouchableOpacity style={styles.expandBtn} onPress={toggleFull}>
          <Ionicons
            name={isFull ? 'contract' : 'expand'}
            size={20}
            color="#fff"
          />
        </TouchableOpacity>
      </View>

      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'products' && styles.activeTab]}
          onPress={() => setActiveTab('products')}
        >
          <Ionicons
            name="grid"
            size={18}
            color={activeTab === 'products' ? '#1565C0' : '#888'}
          />
          <Text
            style={[
              styles.tabText,
              { color: activeTab === 'products' ? '#1565C0' : '#888' },
            ]}
          >
            Products
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'cart' && styles.activeTab]}
          onPress={() => setActiveTab('cart')}
        >
          <Ionicons
            name="cart"
            size={18}
            color={activeTab === 'cart' ? '#1565C0' : '#888'}
          />
          <Text
            style={[
              styles.tabText,
              { color: activeTab === 'cart' ? '#1565C0' : '#888' },
            ]}
          >
            Cart {cartItemCount > 0 && `(${cartItemCount})`}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.resizeHandle} {...panResponder.panHandlers}>
        <View style={styles.resizeIndicator} />
      </View>

      {activeTab === 'products' ? (
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {products.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="cube-outline" size={48} color="#ccc" />
              <Text style={styles.emptyText}>No products available</Text>
            </View>
          ) : (
            products.map(product => (
              <ProductCard
                key={product._id}
                product={product}
                onAdd={onAddToCart}
              />
            ))
          )}
        </ScrollView>
      ) : (
        <View style={styles.cartContent}>
          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {cartItems.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="cart-outline" size={48} color="#ccc" />
                <Text style={styles.emptyText}>Cart is empty</Text>
              </View>
            ) : (
              cartItems.map(item => (
                <CartItemCard
                  key={item.product._id}
                  item={item}
                  onUpdate={onUpdateQuantity}
                  onRemove={onRemoveFromCart}
                />
              ))
            )}
          </ScrollView>
          {cartItems.length > 0 && (
            <View style={styles.cartFooter}>
              <Text style={styles.cartTotal}>Total: ₱{totalPrice.toFixed(2)}</Text>
              <TouchableOpacity style={styles.checkoutBtn}>
                <Text style={styles.checkoutText}>Checkout</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}
    </View>
  );
}

function ProductCard({ product, onAdd }: { product: Product; onAdd: (p: Product) => void }) {
  return (
    <View style={styles.productCard}>
      <View style={styles.productImage}>
        {product.images?.[0] ? (
          <Image
            source={{ uri: product.images[0] }}
            style={styles.image}
            contentFit="cover"
            placeholder="blur"
          />
        ) : (
          <View style={[styles.image, styles.placeholder]}>
            <Ionicons name="fish" size={32} color="#ccc" />
          </View>
        )}
        {product.inventory > 0 && (
          <View style={styles.stockBadge}>
            <Text style={styles.stockText}>In Stock</Text>
          </View>
        )}
      </View>
      <View style={styles.productInfo}>
        <Text style={styles.productName} numberOfLines={2}>{product.name}</Text>
        <Text style={styles.productPrice}>₱{product.price.toFixed(2)}</Text>
        {product.comparePrice && product.comparePrice > product.price && (
          <Text style={styles.comparePrice}>₱{product.comparePrice.toFixed(2)}</Text>
        )}
      </View>
      <TouchableOpacity
        style={[styles.addBtn, product.inventory === 0 && styles.addBtnDisabled]}
        onPress={() => onAdd(product)}
        disabled={product.inventory === 0}
      >
        <Ionicons name="add" size={20} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

function CartItemCard({ item, onUpdate, onRemove }: { item: CartItem; onUpdate: (id: string, qty: number) => void; onRemove: (id: string) => void }) {
  return (
    <View style={styles.cartItemCard}>
      <View style={styles.cartItemImage}>
        {item.product.images?.[0] ? (
          <Image
            source={{ uri: item.product.images[0] }}
            style={styles.image}
            contentFit="cover"
          />
        ) : (
          <View style={[styles.image, styles.placeholder]}>
            <Ionicons name="fish" size={24} color="#ccc" />
          </View>
        )}
      </View>
      <View style={styles.cartItemInfo}>
        <Text style={styles.cartItemName} numberOfLines={1}>{item.product.name}</Text>
        <Text style={styles.cartItemPrice}>₱{item.product.price.toFixed(2)}</Text>
        <View style={styles.qtyRow}>
          <TouchableOpacity
            style={styles.qtyBtn}
            onPress={() => onUpdate(item.product._id, item.quantity - 1)}
          >
            <Ionicons name="remove" size={16} color="#1565C0" />
          </TouchableOpacity>
          <Text style={styles.qtyText}>{item.quantity}</Text>
          <TouchableOpacity
            style={styles.qtyBtn}
            onPress={() => onUpdate(item.product._id, item.quantity + 1)}
          >
            <Ionicons name="add" size={16} color="#1565C0" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.removeBtn}
            onPress={() => onRemove(item.product._id)}
          >
            <Ionicons name="trash-outline" size={16} color="#FF6B6B" />
          </TouchableOpacity>
        </View>
      </View>
      <Text style={styles.cartItemSubtotal}>
        ₱{(item.product.price * item.quantity).toFixed(2)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: '100%',
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 4, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1565C0',
    paddingHorizontal: 12,
    paddingVertical: 14,
    gap: 8,
  },
  closeBtn: {
    padding: 4,
  },
  expandBtn: {
    marginLeft: 'auto',
    padding: 4,
  },
  headerTitle: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
    flex: 1,
  },
  tabs: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#1565C0',
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
  },
  resizeHandle: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  resizeIndicator: {
    width: 4,
    height: 40,
    borderRadius: 2,
    backgroundColor: '#1565C0',
    opacity: 0.5,
  },
  content: {
    flex: 1,
    padding: 8,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    color: '#999',
    marginTop: 8,
    fontSize: 14,
  },
  productCard: {
    flexDirection: 'row',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 8,
    marginBottom: 8,
    alignItems: 'center',
    gap: 8,
  },
  productImage: {
    width: 60,
    height: 60,
    borderRadius: 10,
    overflow: 'hidden',
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  placeholder: {
    backgroundColor: '#e8eaf6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stockBadge: {
    position: 'absolute',
    bottom: 2,
    left: 2,
    backgroundColor: '#00BFA5',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
  },
  stockText: {
    color: '#fff',
    fontSize: 8,
    fontWeight: '700',
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontWeight: '600',
    fontSize: 13,
    color: '#333',
  },
  productPrice: {
    color: '#1565C0',
    fontWeight: '700',
    fontSize: 14,
    marginTop: 2,
  },
  comparePrice: {
    color: '#999',
    fontSize: 11,
    textDecorationLine: 'line-through',
  },
  addBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#1565C0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addBtnDisabled: {
    backgroundColor: '#ccc',
  },
  cartContent: {
    flex: 1,
  },
  cartItemCard: {
    flexDirection: 'row',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 8,
    marginBottom: 8,
    alignItems: 'center',
    gap: 8,
  },
  cartItemImage: {
    width: 50,
    height: 50,
    borderRadius: 8,
    overflow: 'hidden',
  },
  cartItemInfo: {
    flex: 1,
  },
  cartItemName: {
    fontWeight: '600',
    fontSize: 12,
    color: '#333',
  },
  cartItemPrice: {
    color: '#1565C0',
    fontWeight: '700',
    fontSize: 12,
  },
  qtyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 6,
  },
  qtyBtn: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#e3f2fd',
    justifyContent: 'center',
    alignItems: 'center',
  },
  qtyText: {
    fontWeight: '700',
    fontSize: 13,
    minWidth: 20,
    textAlign: 'center',
  },
  removeBtn: {
    marginLeft: 'auto',
    padding: 4,
  },
  cartItemSubtotal: {
    fontWeight: '700',
    color: '#1565C0',
    fontSize: 13,
  },
  cartFooter: {
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    backgroundColor: '#fff',
  },
  cartTotal: {
    fontWeight: '700',
    fontSize: 16,
    marginBottom: 8,
  },
  checkoutBtn: {
    backgroundColor: '#1565C0',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  checkoutText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
});
