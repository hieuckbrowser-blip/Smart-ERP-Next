import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useTranslation } from '@smart-erp/i18n';
import { useApi } from '../lib/api';

export default function HelpdeskScreen() {
  const { t } = useTranslation('common');
  const api = useApi();
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadTickets(); }, []);

  const loadTickets = async () => {
    try {
      const res = await api.get('/helpdesk/tickets');
      setTickets(res.data?.items || []);
    } catch (err) {
      console.error('Failed to load tickets:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return '#3b82f6';
      case 'in_progress': return '#f59e0b';
      case 'resolved': return '#22c55e';
      case 'closed': return '#6b7280';
      case 'reopened': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return '#ef4444';
      case 'high': return '#f59e0b';
      case 'medium': return '#3b82f6';
      default: return '#6b7280';
    }
  };

  const renderItem = ({ item }: { item: any }) => (
    <TouchableOpacity style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.ticketNumber}>{item.ticketNumber}</Text>
        <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(item.priority) }]}>
          <Text style={styles.priorityText}>{t(`helpdesk.priorities.${item.priority}`)}</Text>
        </View>
      </View>
      <Text style={styles.title}>{item.title}</Text>
      <View style={styles.cardFooter}>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <Text style={styles.statusText}>{t(`helpdesk.statuses.${item.status}`)}</Text>
        </View>
        <Text style={styles.date}>{new Date(item.createdAt).toLocaleDateString('vi-VN')}</Text>
      </View>
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
      <Text style={styles.title}>{t('helpdesk.title')}</Text>
      <FlatList
        data={tickets}
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
  ticketNumber: { fontSize: 14, fontWeight: '600', color: '#666' },
  priorityBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  priorityText: { color: 'white', fontSize: 12, fontWeight: '600' },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  statusText: { color: 'white', fontSize: 12, fontWeight: '600' },
  date: { fontSize: 12, color: '#999' },
  empty: { textAlign: 'center', marginTop: 32, color: '#999' },
});