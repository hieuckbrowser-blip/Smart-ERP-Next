import { apiClient } from './api-client';
import { db } from './offline-db';

const getClientId = (): string => {
  let id = localStorage.getItem('sync_client_id');
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem('sync_client_id', id);
  }
  return id;
};

export class SyncService {
  private clientId = getClientId();
  private debounceTimer: number | null = null;

  async pull(): Promise<void> {
    const lastSync = await db.syncLog.orderBy('lastSyncAt').last();
    const vectorClock = lastSync?.vectorClock || {};

    const res = await apiClient.post('/sync/pull', {
      clientId: this.clientId,
      vectorClock,
    });
    const { changes, vectorClock: newClock } = res.data;

    for (const product of changes.products || []) {
      await db.products.put({ ...product, updatedAt: Date.now() });
    }

    await db.syncLog.add({
      clientId: this.clientId,
      lastSyncAt: Date.now(),
      vectorClock: newClock,
    });
  }

  private debouncedPush = () => {
    if (this.debounceTimer) clearTimeout(this.debounceTimer);
    this.debounceTimer = setTimeout(() => this.push(), 5000);
  };

  async push(): Promise<void> {
    const lastSync = await db.syncLog.orderBy('lastSyncAt').last();
    const since = lastSync?.lastSyncAt || 0;
    const localChanges = await db.products.where('updatedAt').above(since).toArray();

    if (localChanges.length === 0) return;

    await apiClient.post('/sync/push', {
      clientId: this.clientId,
      changes: {
        products: localChanges.map(({ id, name, sku, stock, minStock, reorderQuantity, leadTimeDays, safetyStock, deleted }) => ({
          id, name, sku, stock, minStock, reorderQuantity, leadTimeDays, safetyStock, deleted
        })),
      },
    });

    await this.pull();
  }

  async sync(): Promise<void> {
    await this.push();
    await this.pull();
  }

  // Call this on any local mutation
  queueSync() {
    this.debouncedPush();
  }
}

export const syncService = new SyncService();
