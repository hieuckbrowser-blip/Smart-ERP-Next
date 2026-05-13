import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet,
  ActivityIndicator, RefreshControl, Dimensions,
} from 'react-native';
import { useTranslation } from '@smart-erp/i18n';
import { api } from '../lib/api';
import { formatVND } from '@smart-erp/utils';

const { width } = Dimensions.get('window');

interface SummaryStats {
  orderCount: number;
  revenue: number;
  collected: number;
  outstandingDebt: number;
}

interface TopProduct {
  productId: string;
  name: string;
  sku: string;
  sold: number;
  revenue: number;
}

interface TopCustomer {
  id: string;
  name: string;
  phone: string;
  orderCount: number;
  totalSpent: number;
}

interface InventoryStats {
  totalProducts: number;
  totalStockValue: number;
  lowStockCount: number;
  outOfStockCount: number;
}

export default function ReportsScreen() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'sales' | 'inventory'>('sales');

  const [summary, setSummary] = useState<SummaryStats | null>(null);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [topCustomers, setTopCustomers] = useState<TopCustomer[]>([]);
  const [inventory, setInventory] = useState<InventoryStats | null>(null);

  const fetchReports = useCallback(async () => {
    try {
      const today = new Date();
      const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString();
      const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString();

      const [summaryRes, topProductsRes, topCustomersRes, invRes] = await Promise.allSettled([
        api.get<SummaryStats>(`/reports/summary?from=${firstDayOfMonth}&to=${lastDayOfMonth}`),
        api.get<TopProduct[]>(`/reports/top-products?from=${firstDayOfMonth}&to=${lastDayOfMonth}`),
        api.get<TopCustomer[]>(`/reports/customers?from=${firstDayOfMonth}&to=${lastDayOfMonth}`),
        api.get<InventoryStats>('/reports/inventory'),
      ]);

      if (summaryRes.status === 'fulfilled') setSummary(summaryRes.value);
      if (topProductsRes.status === 'fulfilled') setTopProducts(topProductsRes.value);
      if (topCustomersRes.status === 'fulfilled') setTopCustomers(topCustomersRes.value);
      if (invRes.status === 'fulfilled') setInventory(invRes.value);
    } catch (err) {
      console.error('Reports fetch error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchReports(); }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchReports();
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.loadingText}>{t('common.loading')}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t('reports.title')}</Text>
        <Text style={styles.headerSub}>{t('reports.thisMonth')}</Text>
      </View>

      <View style={styles.tabRow}>
        <TouchableOpacity
          onPress={() => setActiveTab('sales')}
          style={[styles.tab, activeTab === 'sales' && styles.tabActive]}
        >
          <Text style={[styles.tabText, activeTab === 'sales' && styles.tabTextActive]}>
            Doanh số
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setActiveTab('inventory')}
          style={[styles.tab, activeTab === 'inventory' && styles.tabActive]}
        >
          <Text style={[styles.tabText, activeTab === 'inventory' && styles.tabTextActive]}>
            {t('reports.inventory')}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#3b82f6" />}
      >
        {activeTab === 'sales' && summary && (
          <View style={styles.section}>
            {/* Summary Cards */}
            <View style={styles.cardGrid}>
              <View style={[styles.statCard, { borderLeftColor: '#3b82f6' }]}>
                <Text style={styles.statLabel}>{t('reports.totalRevenue')}</Text>
                <Text style={[styles.statValue, { color: '#3b82f6' }]}>{formatVND(summary.revenue)}</Text>
              </View>
              <View style={[styles.statCard, { borderLeftColor: '#10b981' }]}>
                <Text style={styles.statLabel}>{t('reports.orderCount')}</Text>
                <Text style={[styles.statValue, { color: '#10b981' }]}>{summary.orderCount}</Text>
              </View>
              <View style={[styles.statCard, { borderLeftColor: '#8b5cf6' }]}>
                <Text style={styles.statLabel}>{t('reports.avgOrderValue')}</Text>
                <Text style={[styles.statValue, { color: '#8b5cf6' }]}>
                  {formatVND(summary.orderCount > 0 ? summary.revenue / summary.orderCount : 0)}
                </Text>
              </View>
            </View>

            {/* Top Products */}
            <Text style={styles.sectionTitle}>{t('reports.topProducts')}</Text>
            <View style={styles.listCard}>
              {topProducts.length === 0 ? (
                <Text style={styles.emptyText}>{t('reports.noData')}</Text>
              ) : (
                topProducts.map((p, index) => (
                  <View key={p.productId} style={[styles.listItem, index < topProducts.length - 1 && styles.borderBottom]}>
                    <Text style={styles.rank}>{index + 1}</Text>
                    <View style={styles.itemInfo}>
                      <Text style={styles.itemName} numberOfLines={1}>{p.name}</Text>
                      <Text style={styles.itemSub}>{p.sku} • {p.sold} {t('common.sold')}</Text>
                    </View>
                    <Text style={styles.itemValue}>{formatVND(p.revenue)}</Text>
                  </View>
                ))
              )}
            </View>

            {/* Top Customers */}
            <Text style={styles.sectionTitle}>{t('reports.topCustomers')}</Text>
            <View style={styles.listCard}>
              {topCustomers.length === 0 ? (
                <Text style={styles.emptyText}>{t('reports.noData')}</Text>
              ) : (
                topCustomers.slice(0, 10).map((c, index) => (
                  <View key={c.id} style={[styles.listItem, index < Math.min(topCustomers.length, 10) - 1 && styles.borderBottom]}>
                    <Text style={styles.rank}>{index + 1}</Text>
                    <View style={styles.itemInfo}>
                      <Text style={styles.itemName} numberOfLines={1}>{c.name}</Text>
                      <Text style={styles.itemSub}>{c.phone} • {c.orderCount} {t('nav.orders')}</Text>
                    </View>
                    <Text style={styles.itemValue}>{formatVND(c.totalSpent)}</Text>
                  </View>
                ))
              )}
            </View>
          </View>
        )}

        {activeTab === 'inventory' && inventory && (
          <View style={styles.section}>
            {/* Inventory Summary Cards */}
            <View style={styles.cardGrid}>
              <View style={[styles.statCard, { borderLeftColor: '#3b82f6' }]}>
                <Text style={styles.statLabel}>{t('reports.inventoryValue')}</Text>
                <Text style={[styles.statValue, { color: '#3b82f6' }]}>{formatVND(inventory.totalStockValue)}</Text>
              </View>
              <View style={[styles.statCard, { borderLeftColor: '#10b981' }]}>
                <Text style={styles.statLabel}>{t('nav.products')}</Text>
                <Text style={[styles.statValue, { color: '#10b981' }]}>{inventory.totalProducts}</Text>
              </View>
              <View style={[styles.statCard, { borderLeftColor: inventory.lowStockCount > 0 ? '#f59e0b' : '#10b981' }]}>
                <Text style={styles.statLabel}>{t('reports.lowStockItems')}</Text>
                <Text style={[styles.statValue, { color: inventory.lowStockCount > 0 ? '#f59e0b' : '#10b981' }]}>
                  {inventory.lowStockCount}
                </Text>
              </View>
              <View style={[styles.statCard, { borderLeftColor: inventory.outOfStockCount > 0 ? '#ef4444' : '#10b981' }]}>
                <Text style={styles.statLabel}>{t('inventory.outOfStock')}</Text>
                <Text style={[styles.statValue, { color: inventory.outOfStockCount > 0 ? '#ef4444' : '#10b981' }]}>
                  {inventory.outOfStockCount}
                </Text>
              </View>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingText: { marginTop: 8, color: '#9ca3af', fontSize: 14 },
  header: { padding: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#111827' },
  headerSub: { fontSize: 13, color: '#6b7280', marginTop: 2 },
  tabRow: { flexDirection: 'row', backgroundColor: '#e5e7eb', padding: 4, borderRadius: 10, marginHorizontal: 16, marginTop: 12 },
  tab: { flex: 1, paddingVertical: 8, borderRadius: 8, alignItems: 'center' },
  tabActive: { backgroundColor: '#fff', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 1, elevation: 1 },
  tabText: { fontSize: 13, color: '#6b7280', fontWeight: '500' },
  tabTextActive: { color: '#2563eb', fontWeight: '700' },
  scrollContent: { padding: 16 },
  section: { gap: 16 },
  cardGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  statCard: {
    width: (width - 44) / 2, backgroundColor: '#fff', padding: 14, borderRadius: 12,
    borderLeftWidth: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 2,
  },
  statLabel: { fontSize: 12, color: '#6b7280', marginBottom: 4 },
  statValue: { fontSize: 16, fontWeight: '700' },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#111827', marginTop: 8 },
  listCard: { backgroundColor: '#fff', borderRadius: 12, padding: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 2 },
  listItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, gap: 12 },
  borderBottom: { borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  rank: { width: 24, fontSize: 14, fontWeight: '700', color: '#9ca3af', textAlign: 'center' },
  itemInfo: { flex: 1 },
  itemName: { fontSize: 14, fontWeight: '600', color: '#111827' },
  itemSub: { fontSize: 12, color: '#6b7280', marginTop: 2 },
  itemValue: { fontSize: 13, fontWeight: '700', color: '#059669' },
  emptyText: { color: '#9ca3af', fontSize: 14, textAlign: 'center', paddingVertical: 20 },
});