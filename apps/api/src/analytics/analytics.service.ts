import { Injectable } from '@nestjs/common';
import { DrizzleService } from '../drizzle/drizzle.service';
import { sql } from 'drizzle-orm';

export interface KPIResult {
  label: string;
  value: number;
  change: number;
  trend: 'up' | 'down' | 'neutral';
  format: 'currency' | 'number' | 'percent';
}

export interface ChartData {
  labels: string[];
  datasets: { label: string; data: number[]; color: string }[];
}

@Injectable()
export class AnalyticsService {
  constructor(private readonly drizzle: DrizzleService) {}

  /** Get dashboard KPIs */
  async getKPIs(tenantId: string): Promise<KPIResult[]> {
    const now = new Date();
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

    // Revenue this month
    const revenueThisMonth = await this.drizzle.db.execute(
      sql`SELECT COALESCE(SUM(total), 0) as total FROM orders WHERE tenant_id = ${tenantId} AND created_at >= ${thisMonth} AND status != 'cancelled'`
    );
    const revenueLastMonth = await this.drizzle.db.execute(
      sql`SELECT COALESCE(SUM(total), 0) as total FROM orders WHERE tenant_id = ${tenantId} AND created_at >= ${lastMonth} AND created_at < ${thisMonth} AND status != 'cancelled'`
    );

    const currentRevenue = Number((revenueThisMonth as any[])[0]?.total || 0);
    const prevRevenue = Number((revenueLastMonth as any[])[0]?.total || 0);
    const revenueChange = prevRevenue > 0 ? ((currentRevenue - prevRevenue) / prevRevenue) * 100 : 0;

    // Orders count
    const ordersThisMonth = await this.drizzle.db.execute(
      sql`SELECT COUNT(*) as count FROM orders WHERE tenant_id = ${tenantId} AND created_at >= ${thisMonth}`
    );
    const ordersLastMonth = await this.drizzle.db.execute(
      sql`SELECT COUNT(*) as count FROM orders WHERE tenant_id = ${tenantId} AND created_at >= ${lastMonth} AND created_at < ${thisMonth}`
    );

    const currentOrders = Number((ordersThisMonth as any[])[0]?.count || 0);
    const prevOrders = Number((ordersLastMonth as any[])[0]?.count || 0);
    const ordersChange = prevOrders > 0 ? ((currentOrders - prevOrders) / prevOrders) * 100 : 0;

    // New customers
    const customersThisMonth = await this.drizzle.db.execute(
      sql`SELECT COUNT(*) as count FROM customers WHERE tenant_id = ${tenantId} AND created_at >= ${thisMonth}`
    );
    const customersLastMonth = await this.drizzle.db.execute(
      sql`SELECT COUNT(*) as count FROM customers WHERE tenant_id = ${tenantId} AND created_at >= ${lastMonth} AND created_at < ${thisMonth}`
    );

    const currentCustomers = Number((customersThisMonth as any[])[0]?.count || 0);
    const prevCustomers = Number((customersLastMonth as any[])[0]?.count || 0);
    const customersChange = prevCustomers > 0 ? ((currentCustomers - prevCustomers) / prevCustomers) * 100 : 0;

    // Average order value
    const aovThisMonth = currentOrders > 0 ? currentRevenue / currentOrders : 0;
    const aovLastMonth = prevOrders > 0 ? prevRevenue / prevOrders : 0;
    const aovChange = aovLastMonth > 0 ? ((aovThisMonth - aovLastMonth) / aovLastMonth) * 100 : 0;

    return [
      { label: 'Revenue', value: currentRevenue, change: Math.round(revenueChange * 10) / 10, trend: revenueChange >= 0 ? 'up' : 'down', format: 'currency' },
      { label: 'Orders', value: currentOrders, change: Math.round(ordersChange * 10) / 10, trend: ordersChange >= 0 ? 'up' : 'down', format: 'number' },
      { label: 'New Customers', value: currentCustomers, change: Math.round(customersChange * 10) / 10, trend: customersChange >= 0 ? 'up' : 'down', format: 'number' },
      { label: 'Avg Order Value', value: aovThisMonth, change: Math.round(aovChange * 10) / 10, trend: aovChange >= 0 ? 'up' : 'down', format: 'currency' },
    ];
  }

  /** Get revenue chart data */
  async getRevenueChart(tenantId: string, period: '7d' | '30d' | '90d' | '1y' = '30d'): Promise<ChartData> {
    const days = period === '7d' ? 7 : period === '30d' ? 30 : period === '90d' ? 90 : 365;

    const result = await this.drizzle.db.execute(
      sql`
        SELECT
          DATE(created_at) as date,
          SUM(total) as revenue,
          COUNT(*) as orders
        FROM orders
        WHERE tenant_id = ${tenantId}
          AND created_at >= NOW() - MAKE_INTERVAL(days => ${days})
          AND status != 'cancelled'
        GROUP BY DATE(created_at)
        ORDER BY date ASC
      `,
    );

    const labels = (result as any[]).map((r) => r.date);
    const revenue = (result as any[]).map((r) => Number(r.revenue));
    const orders = (result as any[]).map((r) => Number(r.orders));

    return {
      labels,
      datasets: [
        { label: 'Revenue', data: revenue, color: '#3b82f6' },
        { label: 'Orders', data: orders, color: '#10b981' },
      ],
    };
  }

  /** Get top products by revenue */
  async getTopProducts(tenantId: string, limit = 10) {
    return this.drizzle.db.execute(
      sql`
        SELECT
          p.id,
          p.name,
          p.sku,
          SUM(oi.quantity) as total_sold,
          SUM(oi.quantity * oi.unit_price) as total_revenue
        FROM order_items oi
        JOIN orders o ON o.id = oi.order_id
        JOIN products p ON p.id = oi.product_id
        WHERE o.tenant_id = ${tenantId} AND o.status != 'cancelled'
        GROUP BY p.id, p.name, p.sku
        ORDER BY total_revenue DESC
        LIMIT ${limit}
      `,
    );
  }

  /** Get customer segmentation */
  async getCustomerSegmentation(tenantId: string) {
    return this.drizzle.db.execute(
      sql`
        SELECT
          CASE
            WHEN total_spent >= 100000000 THEN 'VIP'
            WHEN total_spent >= 50000000 THEN 'Premium'
            WHEN total_spent >= 10000000 THEN 'Regular'
            ELSE 'New'
          END as segment,
          COUNT(*) as count,
          SUM(total_spent) as total_revenue
        FROM (
          SELECT c.id, COALESCE(SUM(o.total), 0) as total_spent
          FROM customers c
          LEFT JOIN orders o ON o.customer_id = c.id AND o.tenant_id = ${tenantId}
          WHERE c.tenant_id = ${tenantId}
          GROUP BY c.id
        ) sub
        GROUP BY segment
        ORDER BY total_revenue DESC
      `,
    );
  }
}