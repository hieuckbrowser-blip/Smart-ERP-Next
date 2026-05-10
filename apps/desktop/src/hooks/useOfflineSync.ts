import { useEffect, useState } from 'react';
import { invoke } from '@tauri-apps/api/tauri';

interface Product {
  id: string;
  name: string;
  sku: string;
  stock: number;
  minStock: number;
  reorderQuantity: number;
  leadTimeDays: number;
  safetyStock: number;
  updatedAt: number;
  deleted: boolean;
}

export function useOfflineSync() {
  const [products, setProducts] = useState<Product[]>([]);
  const [syncing, setSyncing] = useState(false);

  const loadLocalProducts = async () => {
    const rows = await invoke<Record<string, any>[]>('get_offline_products');
    setProducts(rows.map(r => ({
      id: r.id,
      name: r.name,
      sku: r.sku,
      stock: r.stock,
      minStock: r.minStock,
      reorderQuantity: r.reorderQuantity,
      leadTimeDays: r.leadTimeDays,
      safetyStock: r.safetyStock,
      updatedAt: r.updatedAt,
      deleted: r.deleted === 1,
    })));
  };

  const syncNow = async () => {
    setSyncing(true);
    try {
      await invoke('sync_offline_changes');
      await loadLocalProducts();
    } catch (err) {
      console.error('Sync failed', err);
    } finally {
      setSyncing(false);
    }
  };

  useEffect(() => {
    invoke('init_offline_db');
    loadLocalProducts();
  }, []);

  return { products, syncing, syncNow };
}
