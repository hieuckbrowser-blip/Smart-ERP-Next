import { Injectable } from '@nestjs/common';
import { db } from '@smart-erp/database';
import { eq, and, sql } from '@smart-erp/database/drizzle';
import { ecommerceStores } from '@smart-erp/database/schema';
import { TikTokShopClient, TikTokShopConfig } from './tiktokshop.client';
import { AmazonClient, AmazonConfig } from './amazon.client';

@Injectable()
export class EcommerceService {
  // existing methods omitted for brevity

  async syncTikTokShopProducts(storeId: string) {
    const store = await db.select().from(ecommerceStores).where(eq(ecommerceStores.id, storeId)).then(r => r[0]);
    if (!store || store.platform !== 'tiktokshop') throw new Error('Invalid TikTok Shop store');
    const config: TikTokShopConfig = JSON.parse(store.configJson || '{}');
    const client = new TikTokShopClient(config);
    let page = 1;
    let hasMore = true;
    while (hasMore) {
      const res = await client.getProducts(page, 100);
      for (const product of res.products) {
        await this.upsertProductFromTikTok(store.tenantId, product);
      }
      hasMore = res.pagination.has_more;
      page++;
    }
  }

  private async upsertProductFromTikTok(tenantId: string, tiktokProduct: any) {
    const existing = await db.select().from(products).where(and(eq(products.tenantId, tenantId), eq(products.externalId, tiktokProduct.id))).then(r => r[0]);
    const productData = {
      name: tiktokProduct.title,
      sku: tiktokProduct.sku || tiktokProduct.id,
      price: parseFloat(tiktokProduct.price),
      stock: tiktokProduct.quantity,
      description: tiktokProduct.description,
      images: JSON.stringify(tiktokProduct.images || []),
      isActive: true,
      externalId: tiktokProduct.id,
      externalPlatform: 'tiktokshop',
    };
    if (existing) {
      await db.update(products).set(productData).where(eq(products.id, existing.id));
    } else {
      await db.insert(products).values({ ...productData, tenantId });
    }
  }

  async syncTikTokShopOrders(storeId: string, since?: string) {
    const store = await db.select().from(ecommerceStores).where(eq(ecommerceStores.id, storeId)).then(r => r[0]);
    if (!store) throw new Error('Store not found');
    const config: TikTokShopConfig = JSON.parse(store.configJson || '{}');
    const client = new TikTokShopClient(config);
    let page = 1;
    let hasMore = true;
    while (hasMore) {
      const res = await client.getOrders(since, page, 100);
      for (const order of res.orders) {
        await this.upsertOrderFromTikTok(store.tenantId, order);
      }
      hasMore = res.pagination.has_more;
      page++;
    }
  }

  private async upsertOrderFromTikTok(tenantId: string, tiktokOrder: any) {
    // map TikTok order to local order format
    const orderData = {
      tenantId,
      code: tiktokOrder.order_id,
      customerName: tiktokOrder.buyer_name,
      customerPhone: tiktokOrder.buyer_phone,
      total: parseFloat(tiktokOrder.total_amount),
      status: this.mapTikTokStatus(tiktokOrder.order_status),
      channel: 'tiktokshop',
      externalId: tiktokOrder.order_id,
      externalPlatform: 'tiktokshop',
      orderDate: new Date(tiktokOrder.create_time * 1000),
    };
    const existing = await db.select().from(orders).where(and(eq(orders.tenantId, tenantId), eq(orders.externalId, tiktokOrder.order_id))).then(r => r[0]);
    if (existing) {
      await db.update(orders).set(orderData).where(eq(orders.id, existing.id));
    } else {
      await db.insert(orders).values(orderData);
    }
  }

  private mapTikTokStatus(tiktokStatus: string): string {
    const map: Record<string, string> = {
      'AWAITING_PAYMENT': 'pending',
      'PAID': 'confirmed',
      'PROCESSING': 'processing',
      'SHIPPED': 'shipped',
      'DELIVERED': 'delivered',
      'CANCELLED': 'cancelled',
    };
    return map[tiktokStatus] || 'pending';
  }
}
