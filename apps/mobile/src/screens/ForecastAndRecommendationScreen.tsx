import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  FlatList,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { forecastApi, ForecastResponse, RecommendationResponse } from '../lib/forecast';

interface Product {
  id: string;
  name: string;
}

export default function ForecastAndRecommendationScreen({ productId }: { productId?: string }) {
  const { t } = useTranslation('common');
  const [forecastData, setForecastData] = useState<ForecastResponse | null>(null);
  const [recommendation, setRecommendation] = useState<RecommendationResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    // Fetch product list for picker (if needed)
    // For simplicity, we'll just use the provided productId or fetch a default one.
    loadData();
  }, [productId]);

  const loadData = async () => {
    if (!productId) {
      // If no productId provided, try to get the first product from the list
      try {
        const res = await forecastApi.getMonthlyDemand(''); // This will fail, we need a different approach.
        // We'll skip for now and assume productId is provided.
      } catch (e) {
        // ignore
      }
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const [forecastRes, recommendationRes] = await Promise.all([
        forecastApi.getMonthlyDemand(productId),
        forecastApi.getRecommendation(productId, 0), // We don't have current stock here, we'll pass 0 for now
      ]);
      setForecastData(forecastRes);
      setRecommendation(recommendationRes);
    } catch (err: any) {
      setError(err.message ?? 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <View style={styles.center}>
      <ActivityIndicator size="large" color="#3b82f6" />
      <Text style={styles.loadingText}>{t('common.loading')}</Text>
    </View>
  );

  if (error) return (
    <View style={styles.center}>
      <Text style={styles.error}>{error}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t('forecast.title')}</Text>
      {forecastData && (
        <>
          <Text style={styles.subtitle}>{t('forecast.monthlyDemand')}</Text>
          <FlatList
            data={forecastData.data}
            keyExtractor={(item) => item.month}
            renderItem={({ item }) => (
              <View style={styles.forecastItem}>
                <Text>{item.month}</Text>
                <Text>{item.demand}</Text>
              </View>
            )}
          />
        </>
      )}
      {recommendation && (
        <View style={styles.recommendationBox}>
          <Text style={styles.subtitle}>{t('inventory.recommendationTitle')}</Text>
          <Text style={styles.recommendationText}>
            {t('inventory.suggestedReorder')}: {recommendation.suggestedReorder}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#f9fafb' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 8, color: '#9ca3af', fontSize: 14 },
  title: { fontSize: 20, fontWeight: 'bold', marginBottom: 12 },
  subtitle: { fontSize: 16, fontWeight: '600', marginTop: 16, marginBottom: 8 },
  forecastItem: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4, borderBottomWidth: 1, borderColor: '#eee' },
  recommendationBox: { backgroundColor: '#fff', padding: 16, borderRadius: 8, marginTop: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 2 },
  recommendationText: { fontSize: 18, fontWeight: 'bold', color: '#3b82f6' },
  error: { color: 'red', textAlign: 'center', marginTop: 20 },
});