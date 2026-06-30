import { Injectable } from '@nestjs/common';
import { db } from '@smart-erp/database';
import { featureFlags } from '@smart-erp/database/schema';
import { eq, and } from '@smart-erp/database/drizzle';

const CACHE_TTL = 60_000;

interface CacheEntry {
  value: boolean;
  expiresAt: number;
}

@Injectable()
export class FeatureFlagsService {
  private cache = new Map<string, CacheEntry>();

  private cacheKey(tenantId: string, flagKey: string): string {
    return `${tenantId}:${flagKey}`;
  }

  clearCache(tenantId?: string) {
    if (tenantId) {
      for (const key of this.cache.keys()) {
        if (key.startsWith(`${tenantId}:`)) this.cache.delete(key);
      }
    } else {
      this.cache.clear();
    }
  }

  async isEnabled(tenantId: string, flagKey: string): Promise<boolean> {
    const key = this.cacheKey(tenantId, flagKey);
    const cached = this.cache.get(key);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.value;
    }

    const [flag] = await db.select().from(featureFlags).where(
      and(eq(featureFlags.tenantId, tenantId), eq(featureFlags.flagKey, flagKey)),
    );
    const value = flag?.enabled ?? false;
    this.cache.set(key, { value, expiresAt: Date.now() + CACHE_TTL });
    return value;
  }

  async getAllFlags(tenantId: string): Promise<{ flagKey: string; enabled: boolean; description?: string }[]> {
    this.clearCache(tenantId);
    const rows = await db.select().from(featureFlags).where(eq(featureFlags.tenantId, tenantId));
    return rows.map((r) => ({ flagKey: r.flagKey, enabled: r.enabled, description: r.description ?? undefined }));
  }

  async setFlag(tenantId: string, flagKey: string, enabled: boolean, updatedBy: string) {
    this.clearCache(tenantId);
    const [existing] = await db.select().from(featureFlags).where(
      and(eq(featureFlags.tenantId, tenantId), eq(featureFlags.flagKey, flagKey)),
    );
    if (existing) {
      await db.update(featureFlags).set({ enabled, updatedBy }).where(eq(featureFlags.id, existing.id));
    } else {
      await db.insert(featureFlags).values({ tenantId, flagKey, enabled, updatedBy });
    }
  }
}
