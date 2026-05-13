// Mobile POS Screen - Point of Sale for retail
import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  TextInput, Alert, ActivityIndicator,
} from 'react-native';
import { useTranslation } from '@smart-erp/i18n';
import { api } from '../lib/api';

interface Product {
  id: string;
  name: string;
  sku: string;
  price: number;
  stock: number;
}

interface CartItem {
  product: Product;
  quantity: number;
  discount: number;
}

const PAYMENT_METHODS = [
  { key: 'cash', labelKey: 'payment.method.cash', icon: '💵' },
  { key: 'bank_transfer', labelKey: 'payment.method.bank_transfer', icon: '💳' },
  { key: 'momo', labelKey: 'payment.method.momo', icon: '📱' },
  { key: 'vnpay', labelKey: 'payment.method.vnpay', icon: '🏦' },
];

const formatVND = (n: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n);

export default function POSScreen() {
  const { t } = useTranslation();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [search, setSearch] = useState('');
  const [selectedPayment, setSelectedPayment] = useState('cash');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [checkoutMode, setCheckoutMode] = useState(false);
  const [cashReceived, setCashReceived] = useState('');

  const fetchProducts = useCallback(async () => {
    try {
      const res = await api.get<{ items: Product[] }>(`/products?isActive=true&limit=100`);
      setProducts(res.items || []);
    } catch (err) {
      console.error('Failed to fetch products:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.sku.toLowerCase().includes(search.toLowerCase())
  );

  const addToCart = (product: Product) => {
    const existing = cart.find(item => item.product.id === product.id);
    if (existing) {
      setCart(cart.map(item =>
        item.product.id === product.id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setCart([...cart, { product, quantity: 1, discount: 0 }]);
    }
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart(cart.map(item => {
      if (item.product.id === productId) {
        const newQty = item.quantity + delta;
        if (newQty <= 0) return null;
        return { ...item, quantity: newQty };
      }
      return item;
    }).filter(Boolean) as CartItem[]);
  };

  const removeItem = (productId: string) => {
    setCart(cart.filter(item => item.product.id !== productId));
  };

  const subtotal = cart.reduce((sum, item) =>
    sum + (item.product.price * item.quantity - item.discount), 0);
  const tax = Math.round(subtotal * 0.1); // 10% VAT
  const total = subtotal + tax;
  const change = parseFloat(cashReceived || '0') - total;

  const handleCheckout = async () => {
    if (cart.length === 0) {
      Alert.alert(t('pos.cartEmptyError'), t('pos.addProduct'));
      return;
    }
    if (selectedPayment === 'cash' && parseFloat(cashReceived || '0') < total) {
      Alert.alert(t('pos.insufficientCash'), t('pos.enterCashAmount'));
      return;
    }

    try {
      const res = await api.post<{ id: string; code: string }>('/orders', {
        items: cart.map(item => ({
          productId: item.product.id,
          quantity: item.quantity,
          price: item.product.price,
          discount: item.discount,
        })),
        paymentMethod: selectedPayment,
        paymentStatus: selectedPayment === 'cash' ? 'paid' : 'unpaid',
        customerName: customerName || undefined,
        customerPhone: customerPhone || undefined,
        channel: 'pos',
        notes: '',
      });

      Alert.alert(
        t('pos.success'),
        t('pos.orderCreated', { code: res.code }),
        [{ text: 'OK', onPress: () => setCart([]) }]
      );
    } catch (err) {
      console.error('Checkout failed:', err);
      Alert.alert(t('common.error', 'Lỗi'), t('pos.createOrderFailed'));
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.loadingText}>{t('common.loading')}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>{t('nav.pos')}</Text>
        <Text style={styles.cartCount}>{cart.length} {t('common.products', 'sản phẩm')}</Text>
      </View>

      {!checkoutMode ? (
        <>
          {/* Search */}
          <View style={styles.searchContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder={t('pos.searchPlaceholder')}
              value={search}
              onChangeText={setSearch}
              placeholderTextColor="#9ca3af"
            />
          </View>

          {/* Products Grid */}
          <ScrollView style={styles.productsList}>
            <View style={styles.productsGrid}>
              {filteredProducts.map((product) => (
                <TouchableOpacity
                  key={product.id}
                  style={styles.productCard}
                  onPress={() => addToCart(product)}
                >
                  <Text style={styles.productName} numberOfLines={2}>
                    {product.name}
                  </Text>
                  <Text style={styles.productPrice}>{formatVND(product.price)}</Text>
                  <Text style={styles.productStock}>
                    {t('pos.inStock', { stock: product.stock })}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          {/* Cart Summary */}
          {cart.length > 0 && (
            <View style={styles.cartSummary}>
              <View style={styles.cartInfo}>
                <Text style={styles.cartTotal}>{formatVND(total)}</Text>
                <Text style={styles.cartItems}>{cart.length} {t('common.products')}</Text>
              </View>
              <TouchableOpacity
                style={styles.checkoutButton}
                onPress={() => setCheckoutMode(true)}
              >
                <Text style={styles.checkoutButtonText}>{t('pos.checkout')}</Text>
              </TouchableOpacity>
            </View>
          )}
        </>
      ) : (
        /* Checkout Mode */
        <ScrollView style={styles.checkoutContainer}>
          {/* Cart Items */}
          <View style={styles.cartItems}>
            <Text style={styles.sectionTitle}>{t('pos.cart')}</Text>
            {cart.map((item) => (
              <View key={item.product.id} style={styles.cartItem}>
                <View style={styles.cartItemInfo}>
                  <Text style={styles.cartItemName}>{item.product.name}</Text>
                  <Text style={styles.cartItemPrice}>
                    {formatVND(item.product.price)} x {item.quantity}
                  </Text>
                </View>
                <View style={styles.cartItemActions}>
                  <TouchableOpacity
                    style={styles.qtyBtn}
                    onPress={() => updateQuantity(item.product.id, -1)}
                  >
                    <Text style={styles.qtyBtnText}>-</Text>
                  </TouchableOpacity>
                  <Text style={styles.qtyText}>{item.quantity}</Text>
                  <TouchableOpacity
                    style={styles.qtyBtn}
                    onPress={() => updateQuantity(item.product.id, 1)}
                  >
                    <Text style={styles.qtyBtnText}>+</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.removeBtn}
                    onPress={() => removeItem(item.product.id)}
                  >
                    <Text style={styles.removeBtnText}>×</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>

          {/* Customer Info */}
          <View style={styles.customerSection}>
            <Text style={styles.sectionTitle}>{t('pos.customerOptional')}</Text>
            <TextInput
              style={styles.input}
              placeholder={t('pos.customerName')}
              value={customerName}
              onChangeText={setCustomerName}
            />
            <TextInput
              style={styles.input}
              placeholder={t('pos.customerPhone')}
              keyboardType="phone-pad"
              value={customerPhone}
              onChangeText={setCustomerPhone}
            />
          </View>

          {/* Payment Methods */}
          <View style={styles.paymentSection}>
            <Text style={styles.sectionTitle}>{t('pos.paymentMethod')}</Text>
            <View style={styles.paymentMethods}>
              {PAYMENT_METHODS.map((method) => (
                <TouchableOpacity
                  key={method.key}
                  style={[
                    styles.paymentMethod,
                    selectedPayment === method.key && styles.paymentMethodActive,
                  ]}
                  onPress={() => setSelectedPayment(method.key)}
                >
                  <Text style={styles.paymentIcon}>{method.icon}</Text>
                  <Text style={styles.paymentLabel}>{t(method.labelKey as any)}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Cash Input */}
          {selectedPayment === 'cash' && (
            <View style={styles.cashSection}>
              <Text style={styles.sectionTitle}>{t('pos.cashReceived')}</Text>
              <TextInput
                style={styles.input}
                placeholder="0"
                keyboardType="numeric"
                value={cashReceived}
                onChangeText={setCashReceived}
              />
              {change > 0 && (
                <Text style={styles.changeText}>
                  {t('pos.change')}: {formatVND(change)}
                </Text>
              )}
            </View>
          )}

          {/* Total */}
          <View style={styles.totalSection}>
            <View style={styles.totalRow}>
              <Text>{t('pos.subtotal')}:</Text>
              <Text>{formatVND(subtotal)}</Text>
            </View>
            <View style={styles.totalRow}>
              <Text>{t('pos.tax')}:</Text>
              <Text>{formatVND(tax)}</Text>
            </View>
            <View style={[styles.totalRow, styles.grandTotal]}>
              <Text style={styles.grandTotalText}>{t('pos.total')}:</Text>
              <Text style={styles.grandTotalValue}>{formatVND(total)}</Text>
            </View>
          </View>

          {/* Actions */}
          <View style={styles.checkoutActions}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => setCheckoutMode(false)}
            >
              <Text style={styles.backButtonText}>{t('pos.back')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.confirmButton}
              onPress={handleCheckout}
            >
              <Text style={styles.confirmButtonText}>{t('pos.confirmPayment')}</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f4f6' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 12, color: '#6b7280' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 16, backgroundColor: '#fff',
  },
  title: { fontSize: 20, fontWeight: 'bold', color: '#111827' },
  cartCount: { fontSize: 14, color: '#6b7280' },
  searchContainer: { padding: 16, paddingTop: 8 },
  searchInput: {
    backgroundColor: '#fff', padding: 12, borderRadius: 8,
    fontSize: 16, color: '#111827', borderWidth: 1, borderColor: '#e5e7eb',
  },
  productsList: { flex: 1 },
  productsGrid: { flexDirection: 'row', flexWrap: 'wrap', padding: 8, gap: 8 },
  productCard: {
    width: '31%', backgroundColor: '#fff', borderRadius: 12,
    padding: 12, shadowColor: '#000', shadowOpacity: 0.05,
    shadowRadius: 3, elevation: 2,
  },
  productName: { fontSize: 13, fontWeight: '600', color: '#111827', marginBottom: 4 },
  productPrice: { fontSize: 14, fontWeight: '700', color: '#059669' },
  productStock: { fontSize: 11, color: '#9ca3af', marginTop: 2 },
  cartSummary: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: 16, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#e5e7eb',
  },
  cartInfo: { flex: 1 },
  cartTotal: { fontSize: 20, fontWeight: 'bold', color: '#059669' },
  cartItems: { fontSize: 12, color: '#6b7280' },
  checkoutButton: {
    backgroundColor: '#059669', paddingHorizontal: 24, paddingVertical: 12,
    borderRadius: 8,
  },
  checkoutButtonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  checkoutContainer: { flex: 1 },
  cartItems: { padding: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: '#111827', marginBottom: 12 },
  cartItem: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: '#fff', padding: 12, borderRadius: 8, marginBottom: 8,
  },
  cartItemInfo: { flex: 1 },
  cartItemName: { fontSize: 14, fontWeight: '500', color: '#111827' },
  cartItemPrice: { fontSize: 13, color: '#6b7280', marginTop: 2 },
  cartItemActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  qtyBtn: { width: 32, height: 32, backgroundColor: '#e5e7eb', borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  qtyBtnText: { fontSize: 18, fontWeight: '600', color: '#374151' },
  qtyText: { fontSize: 16, fontWeight: '600', minWidth: 24, textAlign: 'center' },
  removeBtn: { width: 32, height: 32, backgroundColor: '#fee2e2', borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  removeBtnText: { fontSize: 20, color: '#dc2626', fontWeight: '600' },
  customerSection: { padding: 16, paddingTop: 0 },
  input: { backgroundColor: '#fff', padding: 12, borderRadius: 8, fontSize: 15, marginBottom: 8, borderWidth: 1, borderColor: '#e5e7eb' },
  paymentSection: { padding: 16, paddingTop: 0 },
  paymentMethods: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  paymentMethod: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#e5e7eb' },
  paymentMethodActive: { borderColor: '#059669', backgroundColor: '#ecfdf5' },
  paymentIcon: { fontSize: 18, marginRight: 6 },
  paymentLabel: { fontSize: 13, color: '#374151' },
  cashSection: { padding: 16, paddingTop: 0 },
  changeText: { fontSize: 16, color: '#059669', fontWeight: '600', marginTop: 8 },
  totalSection: { padding: 16 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  grandTotal: { borderBottomWidth: 0, paddingTop: 12 },
  grandTotalText: { fontSize: 18, fontWeight: '700', color: '#111827' },
  grandTotalValue: { fontSize: 20, fontWeight: '700', color: '#059669' },
  checkoutActions: { flexDirection: 'row', padding: 16, gap: 12, paddingBottom: 32 },
  backButton: { flex: 1, backgroundColor: '#e5e7eb', paddingVertical: 14, borderRadius: 8, alignItems: 'center' },
  backButtonText: { color: '#374151', fontWeight: '600', fontSize: 15 },
  confirmButton: { flex: 2, backgroundColor: '#059669', paddingVertical: 14, borderRadius: 8, alignItems: 'center' },
  confirmButtonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});