import { db, SyncQueueItem } from './db';

export class SyncService {
  private apiBase: string;

  constructor(apiBase: string) {
    this.apiBase = apiBase;
  }

  async queueOperation(entity: string, action: 'create' | 'update' | 'delete', data: any, entityId: string, version?: number): Promise<void> {
    // Get current vector clock for this entity
    const existing = await db.entities.get(entityId);
    const newVersion = (existing?.version || 0) + 1;
    const vectorClock = existing?.vectorClock || {};
    vectorClock[localStorage.getItem('device_id') || 'local'] = newVersion;

    await db.syncQueue.add({
      entity,
      action,
      data,
      entityId,
      retries: 0,
      createdAt: Date.now(),
      version: version || newVersion,
      vectorClock
    });
    // Trigger sync in background
    this.processQueue();
  }

  async processQueue(): Promise<void> {
    const pending = await db.syncQueue.toArray();
    for (const item of pending) {
      try {
        await this.executeSyncItem(item);
        await db.syncQueue.delete(item.id!);
      } catch (err) {
        console.error('Sync failed for item', item.id, err);
        // Increment retries, maybe backoff later
        await db.syncQueue.update(item.id!, { retries: item.retries + 1 });
      }
    }
  }

  private async executeSyncItem(item: SyncQueueItem): Promise<void> {
    const token = localStorage.getItem('access_token');
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
    const tenantId = localStorage.getItem('tenant_id');
    if (tenantId) {
      headers['X-Tenant-ID'] = tenantId;
    }

    // CRDT: Send version and vector clock for conflict resolution
    const payload = {
      ...item.data,
      _version: item.version,
      _vectorClock: item.vectorClock,
      _deviceId: localStorage.getItem('device_id')
    };

    let url = `${this.apiBase}/${item.entity}`;
    let options: RequestInit = { method: 'POST', headers, body: JSON.stringify(payload) };

    if (item.action === 'update') {
      url = `${this.apiBase}/${item.entity}/${item.entityId}`;
      options = { method: 'PATCH', headers, body: JSON.stringify(payload) };
    } else if (item.action === 'delete') {
      url = `${this.apiBase}/${item.entity}/${item.entityId}`;
      options = { method: 'DELETE', headers };
    }

    const response = await fetch(url, options);
    if (!response.ok) {
      // Handle conflict (409): merge logic
      if (response.status === 409) {
        const conflict = await response.json();
        await this.resolveConflict(item, conflict);
        return;
      }
      throw new Error(`Sync failed: ${response.status}`);
    }

    // Update local entity version after successful sync
    await db.entities.put({
      id: item.entityId,
      version: item.version,
      vectorClock: item.vectorClock,
      lastSyncedAt: Date.now()
    });
  }

  private async resolveConflict(localItem: SyncQueueItem, remoteVersion: any): Promise<void> {
    // Last-write-wins with vector clock comparison
    const localClock = localItem.vectorClock;
    const remoteClock = remoteVersion.vectorClock || {};

    // If remote is newer, pull and overwrite local
    if (this.isNewer(remoteClock, localClock)) {
      const merged = await this.mergeData(localItem.data, remoteVersion.data);
      await db.entities.update(localItem.entityId, { data: merged, version: remoteVersion.version, vectorClock: remoteClock });
    }
    // Remove from queue after conflict resolution
    await db.syncQueue.delete(localItem.id!);
  }

  private isNewer(clockA: Record<string, number>, clockB: Record<string, number>): boolean {
    let newer = false;
    for (const [device, time] of Object.entries(clockA)) {
      if ((clockB[device] || 0) < time) newer = true;
      if ((clockB[device] || 0) > time) return false;
    }
    return newer;
  }

  private async mergeData(local: any, remote: any): Promise<any> {
    // Simple deep merge for now - can be extended per entity type
    return { ...local, ...remote, _mergedAt: Date.now() };
  }

  async syncUsers(users: any[]): Promise<void> {
    await db.users.bulkPut(users.map(u => ({ ...u, syncedAt: Date.now() })));
  }

  async getOfflineUsers(): Promise<any[]> {
    return await db.users.toArray();
  }
}

export const syncService = new SyncService(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000');
