import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useTranslation } from '@smart-erp/i18n';
import { useApi } from '../lib/api';

export default function LoyaltyScreen() {
  const { t } = useTranslation('common');
  const api = useApi();
  const [cards, setCards] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCards();
  }, []);

  const loadCards = async () => {
    try {
      const res = await api.get('/loyalty/cards');
      setCards(res.data?.items || []);
    } catch (err) {
      console.error('Failed to load loyalty cards:', err);
    } finally {
      setLoading(false);
    }
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'platinum': return '#9333ea';
      case 'gold': return '#eab308';
      case 'silver': return '#6b7280';
      default: return '#3b82f6';
    }
  };

  const renderItem = ({ item }: { item: any }) => (
    <TouchableOpacity style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.customerName}>{item.customerName}</Text>
        <View style={[styles.tierBadge, { backgroundColor: getTierColor(item.tier) }]}>
          <Text style={styles.tierText}>{t(`loyalty.tiers.${item.tier}`)}</Text>
        </View>
      </View>
      <Text style={styles.points}>{item.points} {t('loyalty.points')}</Text>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
        <Text>{t('common.loading')}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t('loyalty.title')}</Text>
      <FlatList
        data={cards}
        renderItem={renderItem}
        keyExtractor={(item) => String(item.id)}
        ListEmptyComponent={<Text style={styles.empty}>{t('common.noData')}</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#f5f5f5' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 16 },
  card: { backgroundColor: 'white', padding: 16, borderRadius: 8, marginBottom: 8, elevation: 2 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  customerName: { fontSize: 16, fontWeight: '600' },
  tierBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  tierText: { color: 'white', fontSize: 12, fontWeight: '600' },
  points: { fontSize: 18, fontWeight: 'bold', color: '#3b82f6' },
  empty: { textAlign: 'center', marginTop: 32, color: '#999' },
});