import { Injectable } from '@nestjs/common';
import { InjectDatabase } from '../../database/database.decorator';
import { Database } from '../../database/database.module';
import { syncMetadata, SyncMetadata } from '@smart-erp/database';
import { eq, and } from 'drizzle-orm';

@Injectable()
export class SyncService {
  constructor(@InjectDatabase() private db: Database) {}

  async getMetadata(tenantId: string, clientId: string) {
    const [record] = await this.db
      .select()
      .from(syncMetadata)
      .where(and(eq(syncMetadata.tenantId, tenantId), eq(syncMetadata.clientId, clientId)));
    return record;
  }

  async updateMetadata(tenantId: string, clientId: string, vectorClock: Record<string, number>) {
    const existing = await this.getMetadata(tenantId, clientId);
    if (existing) {
      await this.db
        .update(syncMetadata)
        .set({ vectorClock, updatedAt: new Date() })
        .where(eq(syncMetadata.id, existing.id));
    } else {
      await this.db.insert(syncMetadata).values({
        tenantId,
        clientId,
        vectorClock,
      });
    }
  }

  async pull(tenantId: string, clientId: string, sinceVector: Record<string, number>) {
    // For now, return empty changes. Full CRDT merge coming soon.
    // Will aggregate changes from all tables where updated_at > sinceVector[table]
    const changes = {
      products: [],
      orders: [],
      customers: [],
      suppliers: [],
      inventory_transactions: [],
    };
    // Update last sync time
    await this.updateMetadata(tenantId, clientId, {});
    return { changes, vectorClock: {} };
  }

  async push(tenantId: string, clientId: string, changes: any) {
    // Apply incoming changes (CRDT merge). This will apply to each entity type.
    // Transactional apply per entity group.
    // For now just record metadata.
    await this.updateMetadata(tenantId, clientId, {});
    return { accepted: true };
  }
}
