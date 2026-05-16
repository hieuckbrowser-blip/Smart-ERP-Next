import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { api } from '../lib/api';

interface WmsTask {
  id: string;
  type: 'pick' | 'pack' | 'putaway' | 'transfer';
  status: string;
  priority: string;
  createdAt: string;
}

export default function WmsScreen() {
  const [tasks, setTasks] = useState<WmsTask[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const res = await api.get('/wms/tasks');
      setTasks(res || []);
    } catch (error) {
      console.error('Failed to fetch WMS tasks', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const handleScanBarcode = () => {
    Alert.alert(
      'Mô phỏng Quét Barcode',
      'Đang tìm sản phẩm trong danh sách lấy hàng...',
      [
        { text: 'Hủy', style: 'cancel' },
        { 
          text: 'Quét SP: IP15-PRO-MAX', 
          onPress: () => Alert.alert('Thành công', 'Đã xác nhận lấy 1x iPhone 15 Pro Max tại vị trí A-02-12.') 
        }
      ]
    );
  };

  const renderTask = ({ item }: { item: WmsTask }) => {
    return (
      <TouchableOpacity style={styles.card} onPress={() => {}}>
        <View style={styles.cardHeader}>
          <Text style={styles.taskType}>{item.type.toUpperCase()}</Text>
          <View style={[styles.priorityBadge, { backgroundColor: item.priority === 'urgent' ? '#fef2f2' : '#f3f4f6' }]}>
            <Text style={[styles.priorityText, { color: item.priority === 'urgent' ? '#dc2626' : '#6b7280' }]}>
              {item.priority.toUpperCase()}
            </Text>
          </View>
        </View>

        <Text style={styles.taskId}>ID: {item.id.slice(0, 8).toUpperCase()}</Text>
        <Text style={styles.date}>Ngày tạo: {new Date(item.createdAt).toLocaleString('vi-VN')}</Text>

        <View style={styles.footer}>
          <Text style={[styles.status, { color: item.status === 'completed' ? '#059669' : '#d97706' }]}>
            {item.status.toUpperCase()}
          </Text>
          <Text style={styles.actionText}>Chi tiết ➔</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Kho thông minh (WMS)</Text>
        <TouchableOpacity style={styles.scanBtn} onPress={handleScanBarcode}>
          <Text style={styles.scanBtnText}>📷 Quét mã</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statBox}>
          <Text style={styles.statVal}>{tasks.filter(t => t.status === 'pending').length}</Text>
          <Text style={styles.statLabel}>Chờ xử lý</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statVal}>{tasks.filter(t => t.type === 'pick').length}</Text>
          <Text style={styles.statLabel}>Đang lấy hàng</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statVal}>{tasks.filter(t => t.status === 'completed').length}</Text>
          <Text style={styles.statLabel}>Hoàn tất</Text>
        </View>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#3b82f6" style={{ marginTop: 50 }} />
      ) : (
        <FlatList
          data={tasks}
          renderItem={renderTask}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          onRefresh={fetchTasks}
          refreshing={loading}
          ListEmptyComponent={
            <Text style={styles.empty}>Chưa có nhiệm vụ kho nào.</Text>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb', padding: 16 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  title: { fontSize: 20, fontWeight: 'bold', color: '#111827' },
  scanBtn: { backgroundColor: '#1e1b4b', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  scanBtnText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  statsContainer: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  statBox: { flex: 1, backgroundColor: '#fff', borderRadius: 12, padding: 12, alignItems: 'center', elevation: 1 },
  statVal: { fontSize: 18, fontWeight: '800', color: '#1e1b4b' },
  statLabel: { fontSize: 11, color: '#6b7280', marginTop: 4 },
  list: { paddingBottom: 20 },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 12, elevation: 2 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  taskType: { fontSize: 14, fontWeight: '800', color: '#4f46e5' },
  priorityBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  priorityText: { fontSize: 10, fontWeight: '800' },
  taskId: { fontSize: 13, color: '#111827', fontWeight: '600', marginBottom: 4 },
  date: { fontSize: 12, color: '#9ca3af', marginBottom: 12 },
  footer: { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: '#f3f4f6', paddingTop: 12 },
  status: { fontSize: 11, fontWeight: '700' },
  actionText: { fontSize: 12, color: '#4f46e5', fontWeight: '600' },
  empty: { textAlign: 'center', color: '#9ca3af', marginTop: 50 },
});
