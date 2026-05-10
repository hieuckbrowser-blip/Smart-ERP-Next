import { Injectable } from '@nestjs/common';
import { db } from '@smart-erp/database';
import { orders, orderItems, products, customers } from '@smart-erp/database/schema';
import { eq, and, gte, lte, sql, desc } from '@smart-erp/database/drizzle';

@Injectable()
export class ReportsService {
  // ── Revenue report ──────────────────────────────────────────────────────────
  async getRevenueReport(
    tenantId: string,
    from: Date,
    to: Date,
    groupBy: 'day' | 'week' | 'month' = 'day'
  ) {
    const rows = await db.execute(
      sql`
        SELECT
          DATE_TRUNC(${groupBy}, created_at) AS period,
          COUNT(*)::int AS order_count,
          SUM(total)::numeric AS revenue,
          SUM(total - COALESCE(discount_amount, 0))::numeric AS net_revenue
        FROM orders
        WHERE tenant_id = ${tenantId}
          AND created_at >= ${from}
          AND created_at <= ${to}
          AND status NOT IN ('cancelled', 'returned')
        GROUP BY period
        ORDER BY period ASC
      `
    );

    return (rows.rows as any[]).map((r) => ({
      period: r.period,
      orderCount: r.order_count,
      revenue: parseFloat(r.revenue ?? '0'),
      netRevenue: parseFloat(r.net_revenue ?? '0'),
    }));
  }

  // ── Profit report ───────────────────────────────────────────────────────────
  async getProfitReport(tenantId: string, from: Date, to: Date) {
    const rows = await db.execute(
      sql`
        SELECT
          DATE_TRUNC('day', o.created_at) AS period,
          SUM(oi.line_total)::numeric AS revenue,
          SUM(oi.quantity * p.cost::numeric)::numeric AS cost,
          SUM(oi.line_total - oi.quantity * p.cost::numeric)::numeric AS profit
        FROM order_items oi
        JOIN orders o ON o.id = oi.order_id
        JOIN products p ON p.id = oi.product_id
        WHERE o.tenant_id = ${tenantId}
          AND o.created_at >= ${from}
          AND o.created_at <= ${to}
          AND o.status NOT IN ('cancelled', 'returned')
        GROUP BY period
        ORDER BY period ASC
      `
    );

    return (rows.rows as any[]).map((r) => ({
      period: r.period,
      revenue: parseFloat(r.revenue ?? '0'),
      cost: parseFloat(r.cost ?? '0'),
      profit: parseFloat(r.profit ?? '0'),
      margin: r.revenue > 0
        ? parseFloat(((r.profit / r.revenue) * 100).toFixed(1))
        : 0,
    }));
  }

  // ── Top products ────────────────────────────────────────────────────────────
  async getTopProducts(tenantId: string, from: Date, to: Date, limit = 10) {
    const rows = await db.execute(
      sql`
        SELECT
          oi.product_id,
          oi.product_name,
          oi.product_sku,
          SUM(oi.quantity)::int AS sold,
          SUM(oi.line_total)::numeric AS revenue,
          SUM(oi.quantity * p.cost::numeric)::numeric AS cost
        FROM order_items oi
        JOIN orders o ON o.id = oi.order_id
        JOIN products p ON p.id = oi.product_id
        WHERE o.tenant_id = ${tenantId}
          AND o.created_at >= ${from}
          AND o.created_at <= ${to}
          AND o.status NOT IN ('cancelled', 'returned')
        GROUP BY oi.product_id, oi.product_name, oi.product_sku
        ORDER BY sold DESC
        LIMIT ${limit}
      `
    );

    return (rows.rows as any[]).map((r) => ({
      productId: r.product_id,
      name: r.product_name,
      sku: r.product_sku,
      sold: r.sold,
      revenue: parseFloat(r.revenue ?? '0'),
      cost: parseFloat(r.cost ?? '0'),
      profit: parseFloat(r.revenue ?? '0') - parseFloat(r.cost ?? '0'),
    }));
  }

  // ── Inventory report ────────────────────────────────────────────────────────
  async getInventoryReport(tenantId: string) {
    const items = await db
      .select()
      .from(products)
      .where(and(eq(products.tenantId, tenantId), eq(products.isActive, true)))
      .orderBy(products.stock);

    const totalValue = items.reduce(
      (s, p) => s + p.stock * parseFloat(p.cost as string ?? '0'),
      0
    );
    const lowStock = items.filter((p) => p.stock <= (p.minStock ?? 0));
    const outOfStock = items.filter((p) => p.stock === 0);

    return {
      totalProducts: items.length,
      totalStockValue: totalValue,
      lowStockCount: lowStock.length,
      outOfStockCount: outOfStock.length,
      lowStockItems: lowStock.slice(0, 20).map((p) => ({
        id: p.id,
        name: p.name,
        sku: p.sku,
        stock: p.stock,
        minStock: p.minStock,
        unit: p.unit,
      })),
    };
  }

  // ── Customer report ─────────────────────────────────────────────────────────
  async getCustomerReport(tenantId: string, from: Date, to: Date) {
    const rows = await db.execute(
      sql`
        SELECT
          c.id,
          c.name,
          c.phone,
          c.customer_group,
          COUNT(o.id)::int AS order_count,
          SUM(o.total)::numeric AS total_spent,
          MAX(o.created_at) AS last_order_at
        FROM customers c
        LEFT JOIN orders o ON o.customer_id = c.id
          AND o.created_at >= ${from}
          AND o.created_at <= ${to}
          AND o.status NOT IN ('cancelled')
        WHERE c.tenant_id = ${tenantId}
        GROUP BY c.id, c.name, c.phone, c.customer_group
        ORDER BY total_spent DESC NULLS LAST
        LIMIT 20
      `
    );

    return (rows.rows as any[]).map((r) => ({
      id: r.id,
      name: r.name,
      phone: r.phone,
      group: r.customer_group,
      orderCount: r.order_count ?? 0,
      totalSpent: parseFloat(r.total_spent ?? '0'),
      lastOrderAt: r.last_order_at,
    }));
  }

  // ── Summary stats ───────────────────────────────────────────────────────────
  async getSummary(tenantId: string, from: Date, to: Date) {
    const [revenueRow] = await db.execute(
      sql`
        SELECT
          COUNT(*)::int AS order_count,
          SUM(total)::numeric AS revenue,
          SUM(paid_amount)::numeric AS collected,
          SUM(debt_amount)::numeric AS outstanding_debt
        FROM orders
        WHERE tenant_id = ${tenantId}
          AND created_at >= ${from}
          AND created_at <= ${to}
          AND status NOT IN ('cancelled', 'returned')
      `
    );

    const r = (revenueRow as any).rows?.[0] ?? revenueRow;

    return {
      orderCount: r.order_count ?? 0,
      revenue: parseFloat(r.revenue ?? '0'),
      collected: parseFloat(r.collected ?? '0'),
      outstandingDebt: parseFloat(r.outstanding_debt ?? '0'),
    };
  }
}
