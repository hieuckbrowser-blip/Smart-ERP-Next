import React, { useEffect, useState } from 'react';
import { useTranslation } from '@smart-erp/i18n';
import { invoke } from '@tauri-apps/api/tauri';

interface ReorderSuggestion {
  id: string;
  name: string;
  sku: string;
  stock: number;
  min_stock: number;
  reorder_quantity: number;
  suggested_order_quantity: number;
}

/**
 * Desktop Reorder Points component with AI-powered suggestions.
 * Manages reorder thresholds and displays AI-generated order suggestions.
 */
export default function ReorderPoints() {
  const { t } = useTranslation();
  const [suggestions, setSuggestions] = useState<ReorderSuggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  const fetchSuggestions = async () => {
    try {
      setLoading(true);
      const result = await invoke<ReorderSuggestion[]>('get_reorder_suggestions');
      setSuggestions(result);
    } catch (err) {
      console.error(err);
      alert(t('inventory.fetchSuggestionsError'));
    } finally {
      setLoading(false);
    }
  };

  const updateReorderPoint = async (productId: string, minStock?: number, reorderQuantity?: number) => {
    setUpdating(productId);
    try {
      await invoke('update_reorder_point', { productId, minStock, reorderQuantity });
      await fetchSuggestions();
    } catch (err) {
      console.error(err);
      alert(t('inventory.updateFailed'));
    } finally {
      setUpdating(null);
    }
  };

  useEffect(() => {
    fetchSuggestions();
  }, []);

  const getStockStatus = (item: ReorderSuggestion) => {
    if (item.stock <= 0) return { color: 'bg-red-100 text-red-800', label: t('inventory.outOfStock') };
    if (item.stock <= item.min_stock) return { color: 'bg-yellow-100 text-yellow-800', label: t('inventory.lowStock') };
    return { color: 'bg-green-100 text-green-800', label: t('inventory.normal') };
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3">{t('common.loading')}</span>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">{t('inventory.reorderPoints')}</h1>
        {suggestions.length > 0 && (
          <span className="px-3 py-1 text-sm bg-blue-100 text-blue-800 rounded-full">
            {suggestions.length} {t('inventory.reorderPoints')}
          </span>
        )}
      </div>

      {suggestions.length === 0 ? (
        <div className="text-center text-gray-500 py-12">
          {t('inventory.noReorderSuggestions')}
        </div>
      ) : (
        <div className="space-y-4">
          {suggestions.map((item) => {
            const status = getStockStatus(item);
            return (
              <div key={item.id} className="bg-white rounded-xl shadow p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-semibold text-lg">{item.name}</h3>
                    <p className="text-sm text-gray-500">{item.sku}</p>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-sm font-medium ${status.color}`}>
                    {status.label}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 mt-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 uppercase">
                      {t('inventory.minStock')}
                    </label>
                    <input
                      type="number"
                      value={item.min_stock}
                      onChange={(e) => {
                        const val = parseInt(e.target.value) || 0;
                        updateReorderPoint(item.id, val, item.reorder_quantity);
                      }}
                      disabled={updating === item.id}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 uppercase">
                      {t('inventory.reorderQuantity')}
                    </label>
                    <input
                      type="number"
                      value={item.reorder_quantity}
                      onChange={(e) => {
                        const val = parseInt(e.target.value) || 0;
                        updateReorderPoint(item.id, item.min_stock, val);
                      }}
                      disabled={updating === item.id}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 uppercase">
                      {t('inventory.suggestedOrder')}
                    </label>
                    <div className="mt-1 text-xl font-bold text-blue-600">
                      {item.suggested_order_quantity > 0 ? item.suggested_order_quantity : '—'}
                    </div>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
                  <span className="text-sm text-gray-500">
                    {t('inventory.stock')}: <strong>{item.stock}</strong>
                  </span>
                  {updating === item.id && (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                      <span className="ml-2 text-sm text-gray-500">{t('common.processing')}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}