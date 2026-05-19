// @ts-nocheck
import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  FlatList,
  TouchableOpacity,
  Alert,
  ScrollView,
} from 'react-native';
import { useTranslation } from '@smart-erp/i18n';
import { forecastApi, ReorderResponse, DailyDemand } from '../lib/forecast';

interface Product {
  id: string;
  name: string;
  sku: string;
  stock: number;
}

interface ReorderSuggestion extends ReorderResponse {
  name: string;
  sku: string;
}

/**
 * Mobile screen showing AI-powered demand forecast and inventory-aware reorder suggestions.
 * Integrates with Python Prophet ML model via NestJS API.
 */
export default function ForecastAndRecommendationScreen() {
  const { t } = useTranslation();
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [forecast, setForecast] = useState<DailyDemand[]>([]);
  const [reorder, setReorder] = useState<ReorderSuggestion | null>(null);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [loadingForecast, setLoadingForecast] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProducts = useCallback(async () => {
    try {
      setLoadingProducts(true);
      const res = await forecastApi.getMonthlyDemand('PROD-001');
      // Fetch products list from API
      const { api } = require('../lib/api');
      const prodRes = await api.get('/products', { params: { limit: 20 } });
      setProducts(prodRes.data.items || []);
    } catch (err: any) {
      console.error('Failed to fetch products:', err);
    } finally {
      setLoadingProducts(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const loadForecast = useCallback(async (product: Product) => {
    setLoadingForecast(true);
    setError(null);
    setForecast([]);
    setReorder(null);

    try {
      // Fetch forecast data
      const forecastRes = await forecastApi.getMonthlyDemand(product.id);
      setForecast(forecastRes.data.data?.predictions || forecastRes.data.predictions || []);

      // Fetch reorder suggestion with current stock
      const reorderRes = await forecastApi.getReorderSuggestion(product.id, product.stock);
      setReorder({
        productId: product.id,
        name: product.name,
        sku: product.sku,
        stock: product.stock,
        ...reorderRes,
      });
    } catch (err: any) {
      const message = err.response?.data?.message || err.message || t('inventory.forecastError');
      setError(message);
      Alert.alert(t('common.error'), message);
    } finally {
      setLoadingForecast(false);
    }
  }, [t]);

  const handleRefresh = useCallback(async () => {
    if (!selectedProduct) return;
    setRefreshing(true);
    await loadForecast(selectedProduct);
    setRefreshing(false);
  }, [selectedProduct, loadForecast]);

  const handleSelectProduct = (product: Product) => {
    setSelectedProduct(product);
    loadForecast(product);
  };

  const getStockStatusColor = (reorder: ReorderSuggestion) => {
    if (reorder.shouldReorder) return '#dc2626'; // Red - needs reorder
    if (reorder.daysUntilStockout && reorder.daysUntilStockout < 14) return '#f59e0b'; // Yellow - low
    return '#10b981'; // Green - OK
  };

  if (loadingProducts) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.loadingText}>{t('common.loading')}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Product Selection */}
      <View style={styles.productSelector}>
        <Text style={styles.sectionTitle}>{t('products.title')}</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.productList}>
          {products.map((product) => (
            <TouchableOpacity
              key={product.id}
              style={[
                styles.productPill,
                selectedProduct?.id === product.id && styles.productPillActive,
              ]}
              onPress={() => handleSelectProduct(product)}
            >
              <Text
                style={[
                  styles.productPillText,
                  selectedProduct?.id === product.id && styles.productPillTextActive,
                ]}
                numberOfLines={1}
              >
                {product.name}
              </Text>
              <Text style={styles.stockBadge}>{product.stock}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Main Content */}
      {!selectedProduct ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>{t('inventory.selectProductToForecast')}</Text>
        </View>
      ) : loadingForecast ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text style={styles.loadingText}>{t('inventory.generatingForecast')}</Text>
        </View>
      ) : error ? (
        <View style={styles.errorState}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => loadForecast(selectedProduct)}>
            <Text style={styles.retryBtnText}>{t('common.retry')}</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          style={styles.content}
          refreshControl={{
            refreshing,
            onRefresh: handleRefresh,
          }}
        >
          {/* Reorder Alert */}
          {reorder && (
            <View
              style={[
                styles.alertCard,
                { borderLeftColor: getStockStatusColor(reorder) },
              ]}
            >
              <View style={styles.alertHeader}>
                <Text style={styles.alertTitle}>
                  {reorder.shouldReorder
                    ? t('inventory.shouldReorder')
                    : t('inventory.stockOk')}
                </Text>
                <Text style={styles.alertSubtitle}>
                  {reorder.daysUntilStockout
                    ? `${reorder.daysUntilStockout} ${t('inventory.daysUntilStockout')}`
                    : t('inventory.sufficientStock')}
                </Text>
              </View>

              <View style={styles.reorderMetrics}>
                <View style={styles.metricBox}>
                  <Text style={styles.metricLabel}>{t('inventory.currentStock')}</Text>
                  <Text style={styles.metricValue}>{reorder.currentStock}</Text>
                </View>
                <View style={styles.metricBox}>
                  <Text style={styles.metricLabel}>{t('inventory.reorderPoint')}</Text>
                  <Text style={styles.metricValue}>{reorder.reorderPoint}</Text>
                </View>
                <View style={styles.metricBox}>
                  <Text style={styles.metricLabel}>{t('inventory.safetyStock')}</Text>
                  <Text style={styles.metricValue}>{reorder.safetyStock}</Text>
                </View>
              </View>

              {reorder.suggestedOrderQuantity > 0 && (
                <View style={styles.suggestionBox}>
                  <Text style={styles.suggestionLabel}>{t('inventory.suggestedOrderQuantity')}</Text>
                  <Text style={styles.suggestionValue}>{reorder.suggestedOrderQuantity}</Text>
                </View>
              )}

              {reorder.reasons?.length > 0 && (
                <View style={styles.reasonsBox}>
                  {reorder.reasons.map((reason, idx) => (
                    <Text key={idx} style={styles.reasonText}>
                      • {reason}
                    </Text>
                  ))}
                </View>
              )}
            </View>
          )}

          {/* Demand Forecast Chart */}
          {forecast.length > 0 && (
            <View style={styles.forecastCard}>
              <Text style={styles.forecastTitle}>{t('analytics.forecast.title')}</Text>
              <Text style={styles.forecastSubtitle}>{t('analytics.forecast.subtitle')}</Text>

              <View style={styles.forecastTable}>
                <View style={styles.tableHeader}>
                  <Text style={[styles.tableCell, styles.tableHeaderCell, { flex: 1 }]}>
                    {t('analytics.forecast.table.date')}
                  </Text>
                  <Text style={[styles.tableCell, styles.tableHeaderCell, { flex: 0.5 }]}>
                    {t('analytics.forecast.table.predicted')}
                  </Text>
                </View>
                {forecast.slice(0, 14).map((day, idx) => (
                  <View key={idx} style={styles.tableRow}>
                    <Text style={[styles.tableCell, { flex: 1 }]}>{day.date}</Text>
                    <Text style={[styles.tableCell, { flex: 0.5, fontWeight: '600' }]}>
                      {day.quantity}
                    </Text>
                  </View>
                ))}
              </View>

              <View style={styles.demandSummary}>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryLabel}>{t('inventory.predictedDemand7d')}</Text>
                  <Text style={styles.summaryValue}>
                    {reorder?.predictedDemandNext7d ?? '-'}
                  </Text>
                </View>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryLabel}>{t('inventory.predictedDemand30d')}</Text>
                  <Text style={styles.summaryValue}>
                    {reorder?.predictedDemandNext30d ?? '-'}
                  </Text>
                </View>
              </View>
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 8, color: '#6b7280', fontSize: 14 },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  emptyText: { fontSize: 16, color: '#9ca3af', textAlign: 'center' },
  errorState: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  errorText: { fontSize: 14, color: '#dc2626', textAlign: 'center', marginBottom: 16 },
  retryBtn: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryBtnText: { color: '#fff', fontWeight: '600' },

  productSelector: { backgroundColor: '#fff', paddingVertical: 12, paddingHorizontal: 16 },
  sectionTitle: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8 },
  productList: { flexDirection: 'row' },
  productPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    maxWidth: 140,
  },
  productPillActive: { backgroundColor: '#3b82f6' },
  productPillText: { fontSize: 13, color: '#374151', maxWidth: 80 },
  productPillTextActive: { color: '#fff' },
  stockBadge: {
    backgroundColor: '#10b981',
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    marginLeft: 6,
    overflow: 'hidden',
  },

  content: { flex: 1, padding: 16 },

  alertCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  alertHeader: { marginBottom: 12 },
  alertTitle: { fontSize: 18, fontWeight: '700', color: '#111827' },
  alertSubtitle: { fontSize: 13, color: '#6b7280', marginTop: 4 },

  reorderMetrics: { flexDirection: 'row', marginBottom: 12 },
  metricBox: { flex: 1, alignItems: 'center' },
  metricLabel: { fontSize: 11, color: '#9ca3af', marginBottom: 4 },
  metricValue: { fontSize: 20, fontWeight: '700', color: '#111827' },

  suggestionBox: {
    backgroundColor: '#eff6ff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    alignItems: 'center',
  },
  suggestionLabel: { fontSize: 12, color: '#1d4ed8' },
  suggestionValue: { fontSize: 28, fontWeight: '800', color: '#1d4ed8' },

  reasonsBox: { borderTopWidth: 1, borderTopColor: '#f3f4f6', paddingTop: 12 },
  reasonText: { fontSize: 12, color: '#6b7280', marginBottom: 4 },

  forecastCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  forecastTitle: { fontSize: 16, fontWeight: '700', color: '#111827' },
  forecastSubtitle: { fontSize: 12, color: '#6b7280', marginTop: 4, marginBottom: 16 },

  forecastTable: { borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 8, overflow: 'hidden' },
  tableHeader: { flexDirection: 'row', backgroundColor: '#f9fafb', paddingVertical: 8 },
  tableRow: { flexDirection: 'row', paddingVertical: 8, borderTopWidth: 1, borderTopColor: '#f3f4f6' },
  tableCell: { fontSize: 12, color: '#374151', textAlign: 'center', paddingHorizontal: 4 },
  tableHeaderCell: { fontWeight: '600', color: '#6b7280' },

  demandSummary: { flexDirection: 'row', marginTop: 16 },
  summaryItem: { flex: 1, alignItems: 'center' },
  summaryLabel: { fontSize: 11, color: '#9ca3af' },
  summaryValue: { fontSize: 18, fontWeight: '700', color: '#111827', marginTop: 4 },
});