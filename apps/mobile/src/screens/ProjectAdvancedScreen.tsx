import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import { api } from '../lib/api';

export default function ProjectAdvancedScreen({ route }: any) {
  const projectId = route?.params?.projectId || 'dummy-project-id';
  const [gantt, setGantt] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/projects/${projectId}/gantt`);
      setGantt(res);
    } catch (err) {
      console.error('Fetch Gantt failed', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const renderTask = ({ item }: { item: any }) => (
    <View style={styles.taskCard}>
      <View style={styles.taskHeader}>
        <Text style={styles.taskTitle}>{item.text}</Text>
        <Text style={styles.taskProgress}>{Math.round(item.progress * 100)}%</Text>
      </View>
      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: `${item.progress * 100}%` }]} />
      </View>
      <Text style={styles.taskMeta}>Thời gian: {item.duration} ngày</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Quản trị Dự án Nâng cao</Text>
      
      <View style={styles.summaryRow}>
        <View style={styles.statBox}>
          <Text style={styles.statVal}>{gantt?.tasks?.length || 0}</Text>
          <Text style={styles.statLabel}>Công việc</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statVal}>{gantt?.links?.length || 0}</Text>
          <Text style={styles.statLabel}>Liên kết</Text>
        </View>
      </View>

      <Text style={styles.subtitle}>Tiến độ Gantt (Dạng danh sách)</Text>

      {loading ? (
        <ActivityIndicator size="large" color="#3b82f6" style={{ marginTop: 50 }} />
      ) : (
        <FlatList
          data={gantt?.tasks || []}
          renderItem={renderTask}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          onRefresh={fetchData}
          refreshing={loading}
          ListEmptyComponent={
            <Text style={styles.empty}>Chưa có dữ liệu Gantt.</Text>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb', padding: 16 },
  title: { fontSize: 22, fontWeight: 'bold', color: '#111827', marginBottom: 20 },
  summaryRow: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  statBox: { flex: 1, backgroundColor: '#1e1b4b', borderRadius: 16, padding: 16, alignItems: 'center' },
  statVal: { fontSize: 20, fontWeight: '800', color: '#fff' },
  statLabel: { fontSize: 11, color: '#9ca3af', marginTop: 4 },
  subtitle: { fontSize: 16, fontWeight: '700', color: '#374151', marginBottom: 12 },
  list: { paddingBottom: 20 },
  taskCard: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 12, elevation: 2 },
  taskHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  taskTitle: { fontSize: 15, fontWeight: '700', color: '#111827' },
  taskProgress: { fontSize: 13, fontWeight: '800', color: '#4f46e5' },
  progressBar: { height: 6, backgroundColor: '#f3f4f6', borderRadius: 3, overflow: 'hidden', marginBottom: 12 },
  progressFill: { height: '100%', backgroundColor: '#4f46e5' },
  taskMeta: { fontSize: 12, color: '#6b7280' },
  empty: { textAlign: 'center', color: '#9ca3af', marginTop: 50 },
});
