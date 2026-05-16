import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { api } from '../lib/api';
import { useTranslation } from '@smart-erp/i18n';

interface EContract {
  id: string;
  contractNumber: string;
  title: string;
  status: 'draft' | 'sent' | 'viewed' | 'signed' | 'expired' | 'cancelled';
  totalValue: string;
  createdAt: string;
}

export default function EContractScreen() {
  const { t } = useTranslation();
  const [contracts, setContracts] = useState<EContract[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchContracts = async () => {
    try {
      setLoading(true);
      const res = await api.get<EContract[]>('/e-contracts');
      setContracts(res);
    } catch (error) {
      console.error('Failed to fetch contracts', error);
      Alert.alert(t('common.error'), t('contracts.fetchFailed'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContracts();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'signed': return '#059669';
      case 'sent': return '#3b82f6';
      case 'draft': return '#6b7280';
      case 'cancelled': return '#dc2626';
      default: return '#f59e0b';
    }
  };

  const handleSign = (contract: EContract) => {
    Alert.alert(
      t('contracts.signTitle'),
      `${t('contracts.confirmSign')} ${contract.contractNumber}?`,
      [
        { text: t('common.cancel'), style: 'cancel' },
        { 
          text: t('contracts.signNow'), 
          onPress: async () => {
            try {
              await api.patch(`/e-contracts/${contract.id}/sign`, {
                signerName: 'Mobile User',
                method: 'e-signature',
              });
              Alert.alert(t('common.success'), t('contracts.signedSuccess'));
              fetchContracts();
            } catch (error) {
              Alert.alert(t('common.error'), t('contracts.signFailed'));
            }
          }
        }
      ]
    );
  };

  const renderItem = ({ item }: { item: EContract }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.contractNumber}>{item.contractNumber}</Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <Text style={styles.statusText}>{t(`contracts.status.${item.status}`)}</Text>
        </View>
      </View>
      <Text style={styles.title}>{item.title}</Text>
      <View style={styles.cardFooter}>
        <Text style={styles.value}>
          {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(item.totalValue))}
        </Text>
        {item.status === 'sent' && (
          <TouchableOpacity 
            style={styles.signButton}
            onPress={() => handleSign(item)}
          >
            <Text style={styles.signButtonText}>{t('contracts.signAction')}</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.headerTitle}>{t('nav.contracts')}</Text>
      <FlatList
        data={contracts}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        onRefresh={fetchContracts}
        refreshing={loading}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>{t('contracts.empty')}</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f4f6', padding: 16 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 24, fontWeight: 'bold', marginBottom: 16, color: '#111827' },
  list: { paddingBottom: 20 },
  card: { 
    backgroundColor: '#fff', 
    borderRadius: 12, 
    padding: 16, 
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  contractNumber: { fontSize: 14, fontWeight: '600', color: '#6b7280' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  statusText: { color: '#fff', fontSize: 12, fontWeight: '700', textTransform: 'capitalize' },
  title: { fontSize: 18, fontWeight: 'bold', color: '#111827', marginBottom: 12 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  value: { fontSize: 16, fontWeight: '600', color: '#059669' },
  signButton: { backgroundColor: '#3b82f6', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
  signButtonText: { color: '#fff', fontWeight: '700' },
  empty: { marginTop: 40, alignItems: 'center' },
  emptyText: { color: '#9ca3af', fontSize: 16 },
});
