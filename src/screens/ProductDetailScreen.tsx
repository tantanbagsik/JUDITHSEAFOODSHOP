import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Animated,
} from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList, SelectedVariant } from '../types';
import { useCart } from '../hooks/useCart';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type ProductDetailRouteProp = RouteProp<RootStackParamList, 'ProductDetail'>;

export default function ProductDetailScreen() {
  const route = useRoute<ProductDetailRouteProp>();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { product } = route.params;
  const { addToCart, totalItems } = useCart();

  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedVariants, setSelectedVariants] = useState<Record<string, string>>({});
  const [quantity, setQuantity] = useState(1);
  const [showFullDesc, setShowFullDesc] = useState(false);
  const scaleAnim = useState(new Animated.Value(1))[0];

  const hasVariants = product.variants && product.variants.length > 0;

  const getCurrentPrice = (): number => {
    if (!hasVariants) return product.price;
    let extra = 0;
    for (const group of product.variants) {
      const selected = selectedVariants[group.name];
      if (selected) {
        const opt = group.options.find(o => o.name === selected);
        if (opt) extra += opt.price;
      }
    }
    return product.price + extra;
  };

  const getCurrentInventory = (): number => {
    if (!hasVariants) return product.inventory;
    for (const group of product.variants) {
      const selected = selectedVariants[group.name];
      if (selected) {
        const opt = group.options.find(o => o.name === selected);
        if (opt) return opt.inventory;
      }
    }
    return 0;
  };

  const getSelectedVariant = (): SelectedVariant | null => {
    if (!hasVariants) return null;
    for (const group of product.variants) {
      const selected = selectedVariants[group.name];
      if (selected) {
        const opt = group.options.find(o => o.name === selected);
        if (opt) {
          return {
            groupName: group.name,
            optionName: selected,
            price: opt.price,
          };
        }
      }
    }
    return null;
  };

  const allVariantsSelected = (): boolean => {
    if (!hasVariants) return true;
    return product.variants.every(g => selectedVariants[g.name]);
  };

  const currentPrice = getCurrentPrice();
  const currentInventory = getCurrentInventory();
  const outOfStock = currentInventory === 0;

  const handleAddToCart = () => {
    if (!allVariantsSelected()) return;
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 0.95, duration: 100, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 1, duration: 100, useNativeDriver: true }),
    ]).start();
    addToCart(product, getSelectedVariant());
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBtn}>
          <Ionicons name="arrow-back" size={22} color="#1A1A2E" />
        </TouchableOpacity>
        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.headerBtn}
            onPress={() => navigation.getParent()?.navigate('Cart')}
          >
            <Ionicons name="cart" size={22} color="#1A1A2E" />
            {totalItems > 0 && (
              <View style={styles.cartBadge}>
                <Text style={styles.cartBadgeText}>{totalItems}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Image Gallery */}
        <View style={styles.gallery}>
          <Image
            source={{ uri: product.images[selectedImage] || 'https://placehold.co/400x400?text=No+Image' }}
            style={styles.mainImage}
            contentFit="cover"
          />
          {product.comparePrice && product.comparePrice > currentPrice && (
            <View style={styles.discountBadge}>
              <Text style={styles.discountText}>
                -{Math.round((1 - currentPrice / product.comparePrice) * 100)}%
              </Text>
            </View>
          )}
          {outOfStock && (
            <View style={styles.soldOutOverlay}>
              <Text style={styles.soldOutText}>Out of Stock</Text>
            </View>
          )}
          {product.images.length > 1 && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.thumbnails}
              contentContainerStyle={{ gap: 8, paddingHorizontal: 16 }}
            >
              {product.images.map((img, idx) => (
                <TouchableOpacity
                  key={idx}
                  onPress={() => setSelectedImage(idx)}
                  style={[
                    styles.thumbWrap,
                    idx === selectedImage && styles.thumbActive,
                  ]}
                >
                  <Image source={{ uri: img }} style={styles.thumbImg} contentFit="cover" />
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </View>

        {/* Product Info */}
        <View style={styles.infoSection}>
          <Text style={styles.productName}>{product.name}</Text>

          <View style={styles.priceRow}>
            <Text style={styles.currentPrice}>₱{currentPrice.toFixed(2)}</Text>
            {product.comparePrice && product.comparePrice > currentPrice && (
              <Text style={styles.oldPrice}>₱{product.comparePrice.toFixed(2)}</Text>
            )}
          </View>

          {product.sku && (
            <Text style={styles.sku}>SKU: {product.sku}</Text>
          )}

          {/* Variant Selectors */}
          {hasVariants && product.variants.map((group) => (
            <View key={group.name} style={styles.variantGroup}>
              <Text style={styles.variantLabel}>{group.name}</Text>
              <View style={styles.variantOptions}>
                {group.options.map((opt) => {
                  const selected = selectedVariants[group.name] === opt.name;
                  return (
                    <TouchableOpacity
                      key={opt.name}
                      style={[
                        styles.variantOption,
                        selected && styles.variantOptionSelected,
                        opt.inventory === 0 && styles.variantOptionDisabled,
                      ]}
                      onPress={() => {
                        if (opt.inventory === 0) return;
                        setSelectedVariants(prev => ({ ...prev, [group.name]: opt.name }));
                      }}
                    >
                      <Text style={[
                        styles.variantOptionText,
                        selected && styles.variantOptionTextSelected,
                        opt.inventory === 0 && styles.variantOptionTextDisabled,
                      ]}>
                        {opt.name}
                      </Text>
                      {opt.price > 0 && (
                        <Text style={[
                          styles.variantPrice,
                          selected && styles.variantPriceSelected,
                        ]}>
                          +₱{opt.price.toFixed(2)}
                        </Text>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          ))}

          {/* Attributes */}
          {product.attributes && Object.keys(product.attributes).length > 0 && (
            <View style={styles.attributesSection}>
              <Text style={styles.sectionTitle}>Product Details</Text>
              {Object.entries(product.attributes).map(([key, val]) => (
                <View key={key} style={styles.attributeRow}>
                  <Text style={styles.attributeKey}>{key}</Text>
                  <Text style={styles.attributeValue}>{val}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Description */}
          {product.description && (
            <View style={styles.descSection}>
              <Text style={styles.sectionTitle}>Description</Text>
              <Text
                style={styles.description}
                numberOfLines={showFullDesc ? undefined : 3}
              >
                {product.description}
              </Text>
              {product.description.length > 150 && (
                <TouchableOpacity onPress={() => setShowFullDesc(!showFullDesc)}>
                  <Text style={styles.readMore}>
                    {showFullDesc ? 'Show less' : 'Read more'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          <View style={{ height: 120 }} />
        </View>
      </ScrollView>

      {/* Bottom Bar */}
      <LinearGradient
        colors={['#fff', '#f8f9fa']}
        style={styles.bottomBar}
      >
        <View style={styles.qtySelector}>
          <TouchableOpacity
            style={styles.qtyBtn}
            onPress={() => setQuantity(Math.max(1, quantity - 1))}
          >
            <Ionicons name="remove" size={20} color="#1565C0" />
          </TouchableOpacity>
          <Text style={styles.qtyText}>{quantity}</Text>
          <TouchableOpacity
            style={styles.qtyBtn}
            onPress={() => setQuantity(quantity + 1)}
          >
            <Ionicons name="add" size={20} color="#1565C0" />
          </TouchableOpacity>
        </View>

        <Animated.View style={{ flex: 1, marginLeft: 12, transform: [{ scale: scaleAnim }] }}>
          <TouchableOpacity
            style={[
              styles.addToCartBtn,
              (!allVariantsSelected() || outOfStock) && styles.addToCartBtnDisabled,
            ]}
            onPress={handleAddToCart}
            disabled={!allVariantsSelected() || outOfStock}
          >
            <Ionicons name="cart" size={18} color="#fff" />
            <Text style={styles.addToCartText}>
              {!allVariantsSelected() ? 'Select Options' : outOfStock ? 'Out of Stock' : 'Add to Cart'}
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerBtn: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', position: 'relative' },
  headerRight: { flexDirection: 'row', gap: 8 },
  cartBadge: {
    position: 'absolute', top: 2, right: 2,
    backgroundColor: '#EF4444', borderRadius: 9,
    width: 18, height: 18, justifyContent: 'center', alignItems: 'center',
  },
  cartBadgeText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  scroll: { flex: 1 },
  gallery: { backgroundColor: '#f8f9fa' },
  mainImage: { width: SCREEN_WIDTH, height: SCREEN_WIDTH, backgroundColor: '#f0f0f0' },
  discountBadge: {
    position: 'absolute', top: 12, left: 12,
    backgroundColor: '#EF4444', paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 8,
  },
  discountText: { color: '#fff', fontWeight: '800', fontSize: 13 },
  soldOutOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center',
  },
  soldOutText: { color: '#fff', fontSize: 20, fontWeight: '800', letterSpacing: 1 },
  thumbnails: { position: 'absolute', bottom: 12, left: 0, right: 0 },
  thumbWrap: {
    width: 48, height: 48, borderRadius: 8, overflow: 'hidden',
    borderWidth: 2, borderColor: 'transparent',
  },
  thumbActive: { borderColor: '#1565C0' },
  thumbImg: { width: '100%', height: '100%' },
  infoSection: { padding: 16 },
  productName: { fontSize: 22, fontWeight: '700', color: '#1A1A2E', lineHeight: 28 },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', marginTop: 10, gap: 8 },
  currentPrice: { fontSize: 26, fontWeight: '800', color: '#1565C0' },
  oldPrice: { fontSize: 16, color: '#999', textDecorationLine: 'line-through' },
  sku: { fontSize: 12, color: '#bbb', marginTop: 4 },
  variantGroup: { marginTop: 16 },
  variantLabel: { fontWeight: '600', fontSize: 14, color: '#333', marginBottom: 8 },
  variantOptions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  variantOption: {
    paddingHorizontal: 16, paddingVertical: 10,
    borderRadius: 10, borderWidth: 1.5, borderColor: '#ddd',
    backgroundColor: '#fff',
  },
  variantOptionSelected: { borderColor: '#1565C0', backgroundColor: '#E3F2FD' },
  variantOptionDisabled: { opacity: 0.4 },
  variantOptionText: { fontSize: 14, fontWeight: '600', color: '#555' },
  variantOptionTextSelected: { color: '#1565C0' },
  variantOptionTextDisabled: { color: '#ccc' },
  variantPrice: { fontSize: 11, color: '#999', marginTop: 2, textAlign: 'center' },
  variantPriceSelected: { color: '#1565C0' },
  attributesSection: { marginTop: 20, backgroundColor: '#f8f9fa', borderRadius: 12, padding: 14 },
  sectionTitle: { fontWeight: '700', fontSize: 16, color: '#1A1A2E', marginBottom: 10 },
  attributeRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: '#eee',
  },
  attributeKey: { fontSize: 14, color: '#888', fontWeight: '500' },
  attributeValue: { fontSize: 14, color: '#333', fontWeight: '600' },
  descSection: { marginTop: 20 },
  description: { fontSize: 14, color: '#666', lineHeight: 22 },
  readMore: { color: '#1565C0', fontWeight: '600', marginTop: 6, fontSize: 13 },
  bottomBar: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 12,
    borderTopWidth: 1, borderTopColor: '#eee',
  },
  qtySelector: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1, borderColor: '#ddd', borderRadius: 12,
  },
  qtyBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  qtyText: { fontWeight: '700', fontSize: 16, minWidth: 32, textAlign: 'center', color: '#1A1A2E' },
  addToCartBtn: {
    flexDirection: 'row', backgroundColor: '#1565C0',
    paddingVertical: 14, borderRadius: 12, justifyContent: 'center', alignItems: 'center', gap: 8,
  },
  addToCartBtnDisabled: { backgroundColor: '#ccc' },
  addToCartText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
