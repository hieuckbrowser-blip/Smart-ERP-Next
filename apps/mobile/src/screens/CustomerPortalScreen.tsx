import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  Alert,
} from 'react-native';
import { api } from '../lib/api';
import { useTranslation } from '@smart-erp/i18n';
import { formatVND } from '@smart-erp/utils';

export default function CustomerPortalScreen() {
  const { t } = useTranslation();
  const [summary, setSummary] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      setLoading(true);
      const ordersRes = await api.get('/portal/orders');
      setOrders(ordersRes || []);
    } catch (err) {
      console.error('Fetch portal data failed', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateTicket = () => {
    Alert.prompt(
      'Gửi Yêu cầu Hỗ trợ',
      'Nhập nội dung vấn đề của bạn:',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Gửi',
          onPress: async (msg) => {
            if (!msg) return;
            try {
              await api.post('/portal/tickets', { title: 'Yêu cầu từ Mobile', description: msg });
              Alert.alert('Thành công', 'Yêu cầu của bạn đã được tiếp nhận.');
            } catch (err) {
              Alert.alert('Lỗi', 'Không thể gửi yêu cầu');
            }
          }
        }
      ]
    );
  };

  const renderOrder = ({ item }: { item: any }) => (
    <View style={styles.orderCard}>
      <View style={styles.orderHeader}>
        <Text style={styles.orderCode}>{item.code}</Text>
        <Text style={styles.orderStatus}>{item.status.toUpperCase()}</Text>
      </View>
      <Text style={styles.orderTotal}>{formatVND(item.total)}</Text>
      <Text style={styles.orderDate}>{new Date(item.createdAt).toLocaleDateString('vi-VN')}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Trung tâm Khách hàng</Text>
        <TouchableOpacity style={styles.supportBtn} onPress={handleCreateTicket}>
          <Text style={styles.supportBtnText}>🎧 Hỗ trợ</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.tabs}>
        <TouchableOpacity style={[styles.tab, styles.tabActive]}>
          <Text style={styles.tabTextActive}>Đơn hàng</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tab}>
          <Text style={styles.tabText}>Bảo hành</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tab}>
          <Text style={styles.tabText}>Thanh toán</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#3b82f6" style={{ marginTop: 50 }} />
      ) : (
        <FlatList
          data={orders}
          renderItem={renderOrder}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          onRefresh={fetchData}
          refreshing={loading}
          ListEmptyComponent={
            <Text style={styles.empty}>Bạn chưa có đơn hàng nào.</Text>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb', padding: 16 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  title: { fontSize: 22, fontWeight: 'bold', color: '#111827' },
  supportBtn: { backgroundColor: '#1e1b4b', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  supportBtnText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  tabs: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  tab: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 10, backgroundColor: '#fff' },
  tabActive: { backgroundColor: '#4f46e5' },
  tabText: { color: '#6b7280', fontSize: 14, fontWeight: '600' },
  tabTextActive: { color: '#fff', fontSize: 14, fontWeight: '600' },
  list: { paddingBottom: 20 },
  orderCard: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 12, elevation: 2 },
  orderHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  orderCode: { fontSize: 14, fontWeight: '700', color: '#111827' },
  orderStatus: { fontSize: 12, fontWeight: '700', color: '#059669' },
  orderTotal: { fontSize: 18, fontWeight: '800', color: '#1e1b4b' },
  orderDate: { fontSize: 12, color: '#9ca3af', marginTop: 4 },
  empty: { textAlign: 'center', color: '#9ca3af', marginTop: 50 },
});
