import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { useTranslation } from '@smart-erp/i18n';
import { api } from '../lib/api';

interface ReorderSuggestion {
  id: string;
  name: string;
  sku: string;
  stock: number;
  minStock: number;
  reorderQuantity: number;
  suggestedOrderQuantity: number;
}

interface Supplier {
  id: string;
  code: string;
  name: string;
}

interface Warehouse {
  id: string;
  name: string;
  isDefault?: boolean;
}

export default function ReorderPointsScreen() {
  const { t } = useTranslation();
  const [suggestions, setSuggestions] = useState<ReorderSuggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  const [showCreatePo, setShowCreatePo] = useState(false);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [supplierSearch, setSupplierSearch] = useState('');
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [creatingPo, setCreatingPo] = useState(false);

  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [selectedWarehouseId, setSelectedWarehouseId] = useState('');
  const [expectedDate, setExpectedDate] = useState('');
  const [poNotes, setPoNotes] = useState('');
  const [poItems, setPoItems] = useState<{ productId: string; name: string; sku: string; quantity: number; included: boolean }[]>([]);

  const fetchSuggestions = async () => {
    try {
      setLoading(true);
      const res = await api.get<ReorderSuggestion[]>('/inventory/reorder-suggestions');
      setSuggestions(res || []);
    } catch (err: any) {
      Alert.alert(t('common.error'), err.response?.data?.message || t('inventory.fetchSuggestionsError'));
    } finally {
      setLoading(false);
    }
  };

  const updateReorderPoints = async (productId: string, minStock?: number, reorderQuantity?: number) => {
    setUpdating(productId);
    try {
      await api.patch(`/products/${productId}/reorder-points`, {
        minStock,
        reorderQuantity,
      });
      await fetchSuggestions();
    } catch (err: any) {
      Alert.alert(t('common.error'), err.message || t('inventory.updateFailed'));
    } finally {
      setUpdating(null);
    }
  };

  const fetchSuppliers = async () => {
    try {
      const res = await api.get<{ items: Supplier[] }>('/suppliers?limit=20');
      setSuppliers(res.items ?? []);
    } catch {
      setSuppliers([]);
    }
  };

  const fetchWarehouses = async () => {
    try {
      const res = await api.get<{ items?: Warehouse[] } | Warehouse[]>('/warehouses');
      const list = Array.isArray(res) ? res : (res.items ?? []);
      setWarehouses(list);
      const def = list.find((w) => w.isDefault);
      setSelectedWarehouseId(def?.id ?? '');
    } catch {
      setWarehouses([]);
    }
  };

  const handleOpenCreatePo = async () => {
    setSelectedSupplier(null);
    setSupplierSearch('');
    setExpectedDate('');
    setPoNotes('');
    setPoItems(
      suggestions
        .filter((s) => s.suggestedOrderQuantity > 0)
        .map((s) => ({
          productId: s.id,
          name: s.name,
          sku: s.sku,
          quantity: s.suggestedOrderQuantity,
          included: true,
        })),
    );
    setShowCreatePo(true);
    await Promise.all([fetchSuppliers(), fetchWarehouses()]);
  };

  const handleCreatePo = async () => {
    if (!selectedSupplier) return;
    setCreatingPo(true);
    try {
      await api.post('/purchasing/from-reorder-suggestions', {
        supplierId: selectedSupplier.id,
        warehouseId: selectedWarehouseId || undefined,
        expectedDate: expectedDate || undefined,
        notes: poNotes || undefined,
        items: poItems
          .filter((i) => i.included && i.quantity > 0)
          .map((i) => ({ productId: i.productId, quantity: i.quantity })),
      });
      setShowCreatePo(false);
      Alert.alert(t('pos.success'), t('purchasing.createSuccess', 'Đã tạo đơn nhập'));
    } catch (err: any) {
      Alert.alert(t('common.error'), err.message || t('purchasing.createError'));
    } finally {
      setCreatingPo(false);
    }
  };

  useEffect(() => {
    fetchSuggestions();
  }, []);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>{t('common.loading')}</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.titleRow}>
        <Text style={styles.title}>{t('inventory.reorderPoints')}</Text>
        {suggestions.length > 0 && (
          <TouchableOpacity style={styles.createPoBtn} onPress={handleOpenCreatePo}>
            <Text style={styles.createPoBtnText}>{t('purchasing.add')}</Text>
          </TouchableOpacity>
        )}
      </View>

      {suggestions.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>{t('inventory.noReorderSuggestions')}</Text>
        </View>
      ) : (
        suggestions.map((item) => (
          <View key={item.id} style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.productName}>{item.name}</Text>
              <Text style={styles.sku}>{item.sku}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>{t('products.stock')}:</Text>
              <Text style={styles.value}>{item.stock}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>{t('inventory.minStock')}:</Text>
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                value={String(item.minStock ?? 0)}
                onChangeText={(text) => {
                  const val = parseInt(text) || 0;
                  updateReorderPoints(item.id, val, item.reorderQuantity);
                }}
                editable={updating !== item.id}
              />
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>{t('inventory.reorderQuantity')}:</Text>
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                value={String(item.reorderQuantity ?? 0)}
                onChangeText={(text) => {
                  const val = parseInt(text) || 0;
                  updateReorderPoints(item.id, item.minStock, val);
                }}
                editable={updating !== item.id}
              />
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>{t('inventory.suggestedOrder')}:</Text>
              <Text style={[styles.value, styles.suggested]}>
                {item.suggestedOrderQuantity > 0 ? item.suggestedOrderQuantity : '—'}
              </Text>
            </View>
            {updating === item.id && (
              <ActivityIndicator size="small" style={styles.inlineLoader} />
            )}
          </View>
        ))
      )}

      {/* Create PO Modal */}
      <Modal visible={showCreatePo} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{t('purchasing.selectSupplierAndItems')}</Text>

            <Text style={styles.modalLabel}>{t('purchasing.selectWarehouseOptional')}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 10 }}>
              {warehouses.map((w) => (
                <TouchableOpacity
                  key={w.id}
                  style={[styles.whPill, selectedWarehouseId === w.id && styles.whPillActive]}
                  onPress={() => setSelectedWarehouseId(w.id)}
                >
                  <Text style={[styles.whPillText, selectedWarehouseId === w.id && styles.whPillTextActive]}>{w.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <TextInput
              style={styles.searchInput}
              placeholder={t('purchasing.expectedDatePlaceholder')}
              value={expectedDate}
              onChangeText={setExpectedDate}
              placeholderTextColor="#9ca3af"
            />

            <TextInput
              style={styles.searchInput}
              placeholder={t('purchasing.notes')}
              value={poNotes}
              onChangeText={setPoNotes}
              placeholderTextColor="#9ca3af"
            />

            <View style={styles.previewBox}>
              <Text style={styles.previewText}>
                {t('purchasing.preview', {
                  items: poItems.filter((i) => i.included && i.quantity > 0).length,
                  quantity: poItems.reduce((sum, i) => sum + (i.included ? i.quantity : 0), 0),
                })}
              </Text>
            </View>

            <View style={styles.itemsBox}>
              <Text style={styles.modalLabel}>{t('purchasing.items')}</Text>
              {poItems.map((it) => (
                <View key={it.productId} style={styles.itemRow}>
                  <TouchableOpacity
                    style={[styles.itemCheck, it.included && styles.itemCheckActive]}
                    onPress={() => setPoItems((prev) => prev.map((p) => p.productId === it.productId ? { ...p, included: !p.included } : p))}
                  >
                    <Text style={[styles.itemCheckText, it.included && styles.itemCheckTextActive]}>{it.included ? '✓' : ''}</Text>
                  </TouchableOpacity>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.itemName} numberOfLines={1}>{it.name}</Text>
                    <Text style={styles.itemSku}>{it.sku}</Text>
                  </View>
                  <TextInput
                    style={styles.qtyInput}
                    keyboardType="numeric"
                    value={String(it.quantity)}
                    onChangeText={(txt) => {
                      const v = parseInt(txt) || 0;
                      setPoItems((prev) => prev.map((p) => p.productId === it.productId ? { ...p, quantity: v } : p));
                    }}
                  />
                </View>
              ))}
            </View>

            <TextInput
              style={styles.searchInput}
              placeholder={t('suppliers.searchPlaceholder')}
              value={supplierSearch}
              onChangeText={setSupplierSearch}
              placeholderTextColor="#9ca3af"
            />

            <ScrollView style={{ maxHeight: 280 }}>
              {suppliers
                .filter((s) => !supplierSearch || s.name.toLowerCase().includes(supplierSearch.toLowerCase()))
                .map((s) => (
                  <TouchableOpacity
                    key={s.id}
                    style={[styles.supplierRow, selectedSupplier?.id === s.id && styles.supplierRowActive]}
                    onPress={() => setSelectedSupplier(s)}
                  >
                    <Text style={styles.supplierName}>{s.name}</Text>
                    <Text style={styles.supplierCode}>{s.code}</Text>
                  </TouchableOpacity>
                ))}
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalBtn} onPress={() => setShowCreatePo(false)}>
                <Text style={styles.modalBtnText}>{t('common.cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtnPrimary, (!selectedSupplier || creatingPo || poItems.filter((i) => i.included && i.quantity > 0).length === 0) && styles.modalBtnDisabled]}
                onPress={handleCreatePo}
                disabled={!selectedSupplier || creatingPo || poItems.filter((i) => i.included && i.quantity > 0).length === 0}
              >
                <Text style={styles.modalBtnPrimaryText}>
                  {creatingPo ? t('common.processing') : t('purchasing.add')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5', paddingHorizontal: 16, paddingTop: 16 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 12, color: '#666' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 16, color: '#1e293b' },
  emptyContainer: { padding: 40, alignItems: 'center' },
  emptyText: { fontSize: 16, color: '#94a3b8' },
  card: {
    backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1,
  },
  cardHeader: { marginBottom: 12, borderBottomWidth: 1, borderBottomColor: '#e2e8f0', paddingBottom: 8 },
  productName: { fontSize: 18, fontWeight: '600', color: '#0f172a' },
  sku: { fontSize: 12, color: '#64748b', marginTop: 2 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 },
  label: { fontSize: 14, color: '#475569', fontWeight: '500' },
  value: { fontSize: 14, color: '#1e293b', fontWeight: '500' },
  suggested: { color: '#3b82f6', fontWeight: 'bold' },
  input: {
    borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 8, paddingHorizontal: 12,
    paddingVertical: 6, width: 100, textAlign: 'right', fontSize: 14, color: '#0f172a',
  },
  inlineLoader: { marginTop: 12 },

  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  createPoBtn: {
    backgroundColor: '#2563eb',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  createPoBtnText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    maxHeight: '70%',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 12,
  },
  modalLabel: {
    fontSize: 12,
    color: '#334155',
    fontWeight: '600',
    marginBottom: 6,
  },
  whPill: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#fff',
    marginRight: 8,
  },
  whPillActive: {
    borderColor: '#2563eb',
    backgroundColor: '#eff6ff',
  },
  whPillText: {
    fontSize: 12,
    color: '#334155',
    fontWeight: '600',
  },
  whPillTextActive: {
    color: '#2563eb',
  },
  searchInput: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginBottom: 10,
    color: '#0f172a',
  },
  supplierRow: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
  },
  supplierRowActive: {
    borderColor: '#2563eb',
    backgroundColor: '#eff6ff',
  },
  supplierName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0f172a',
  },
  supplierCode: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  previewBox: {
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
  },
  previewText: {
    fontSize: 12,
    color: '#334155',
    fontWeight: '600',
  },

  itemsBox: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
    backgroundColor: '#fff',
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  itemCheck: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  itemCheckActive: {
    borderColor: '#2563eb',
    backgroundColor: '#2563eb',
  },
  itemCheckText: {
    fontSize: 14,
    color: '#2563eb',
    fontWeight: '800',
    lineHeight: 16,
  },
  itemCheckTextActive: {
    color: '#fff',
  },
  itemName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0f172a',
  },
  itemSku: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 1,
  },
  qtyInput: {
    width: 72,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    textAlign: 'right',
    color: '#0f172a',
    fontSize: 13,
    fontWeight: '700',
  },

  modalActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
  },
  modalBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    alignItems: 'center',
    paddingVertical: 10,
  },
  modalBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
  },
  modalBtnPrimary: {
    flex: 1,
    borderRadius: 8,
    backgroundColor: '#2563eb',
    alignItems: 'center',
    paddingVertical: 10,
  },
  modalBtnDisabled: {
    backgroundColor: '#93c5fd',
  },
  modalBtnPrimaryText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#fff',
  },
});