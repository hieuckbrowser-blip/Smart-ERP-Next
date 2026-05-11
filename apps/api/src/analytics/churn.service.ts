import { Injectable } from '@nestjs/common';
import { db } from '@smart-erp/database';
import { customers, orders } from '@smart-erp/database/schema';
import { eq, sql, and, desc } from '@smart-erp/database/drizzle';
import { subDays, differenceInDays } from 'date-fns';

@Injectable()
export class ChurnPredictionService {
  /**
   * Compute churn probability for all customers based on RFM + recency.
   * Simple rule-based model:
   * - High risk: recency > 90 days OR frequency < 0.2 orders/month AND total_spent < 500k
   * - Medium risk: recency between 45-90 days OR frequency 0.2-0.5
   * - Low risk: recency < 45 days
   * Probability = scaled risk score 0-100
   */
  async computeAndStore(tenantId: string): Promise<void> {
    const metrics = await this.computeMetrics(tenantId);
    const runDate = new Date().toISOString().slice(0, 10);

    for (const m of metrics) {
      let prob = 0;
      let segment = 'low';

      if (m.recencyDays > 90 || (m.purchaseFrequency < 0.2 && m.totalSpent < 500_000)) {
        prob = 80 + Math.min(20, Math.floor(m.recencyDays / 10));
        segment = 'high';
      } else if (m.recencyDays > 45 || (m.purchaseFrequency < 0.5 && m.totalSpent < 2_000_000)) {
        prob = 40 + Math.min(40, Math.floor(m.recencyDays / 5));
        segment = 'medium';
      } else {
        prob = Math.max(5, Math.min(30, Math.floor(m.recencyDays / 3)));
        segment = 'low';
      }

      prob = Math.min(99, Math.max(1, prob));

      await db.execute(sql`
        INSERT INTO customer_churn_predictions
          (tenant_id, customer_id, run_date, churn_probability, risk_segment,
           days_since_last_purchase, total_spent, purchase_frequency, model_version)
        VALUES
          (${tenantId}, ${m.customerId}, ${runDate}, ${prob}, ${segment},
           ${m.recencyDays}, ${m.totalSpent}, ${m.purchaseFrequency}, 'v1')
        ON CONFLICT (tenant_id, customer_id, run_date) DO UPDATE
        SET churn_probability = ${prob}, risk_segment = ${segment}
      `);
    }
  }

  private async computeMetrics(tenantId: string): Promise<{
    customerId: string;
    totalSpent: number;
    purchaseFrequency: number;
    recencyDays: number;
  }[]> {
    const customerRows = await db.select({ id: customers.id }).from(customers).where(eq(customers.tenantId, tenantId));
    if (customerRows.length === 0) return [];

    const oneYearAgo = subDays(new Date(), 365);
    const metrics: any[] = [];

    for (const c of customerRows) {
      const agg = await db.execute(sql`
        SELECT
          COALESCE(SUM(total), 0) as total_spent,
          COALESCE(COUNT(*), 0) as order_count,
          COALESCE(MAX(created_at), '1970-01-01') as last_order_date
        FROM orders
        WHERE tenant_id = ${tenantId}
          AND customer_id = ${c.id}
          AND created_at >= ${oneYearAgo.toISOString()}
      `);
      const row = agg.rows[0] as any;
      const orderCount = Number(row.order_count);
      const totalSpent = parseFloat(row.total_spent);
      const frequency = orderCount > 0 ? orderCount / 12 : 0;
      const lastOrder = new Date(row.last_order_date);
      const recencyDays = orderCount > 0 ? differenceInDays(new Date(), lastOrder) : 365;
      metrics.push({
        customerId: c.id,
        totalSpent,
        purchaseFrequency: frequency,
        recencyDays,
      });
    }
    return metrics;
  }

  async getLatestPredictions(tenantId: string, riskSegment?: string) {
    const latestRun = await db.execute(sql`
      SELECT run_date FROM customer_churn_predictions
      WHERE tenant_id = ${tenantId}
      ORDER BY run_date DESC
      LIMIT 1
    `);
    if (latestRun.rows.length === 0) return [];
    const runDate = latestRun.rows[0].run_date;

    let query = sql`
      SELECT c.name, c.email, c.phone, churn.*
      FROM customer_churn_predictions churn
      JOIN customers c ON c.id = churn.customer_id
      WHERE churn.tenant_id = ${tenantId} AND churn.run_date = ${runDate}
    `;
    if (riskSegment) {
      query = sql`${query} AND churn.risk_segment = ${riskSegment}`;
    }
    query = sql`${query} ORDER BY churn.churn_probability DESC`;
    const rows = await db.execute(query);
    return rows.rows;
  }

  async getSegmentSummary(tenantId: string) {
    const latestRun = await db.execute(sql`
      SELECT run_date FROM customer_churn_predictions
      WHERE tenant_id = ${tenantId}
      ORDER BY run_date DESC
      LIMIT 1
    `);
    if (latestRun.rows.length === 0) return null;
    const runDate = latestRun.rows[0].run_date;

    const summary = await db.execute(sql`
      SELECT
        risk_segment,
        COUNT(*) as count,
        AVG(churn_probability) as avg_probability
      FROM customer_churn_predictions
      WHERE tenant_id = ${tenantId} AND run_date = ${runDate}
      GROUP BY risk_segment
      ORDER BY avg_probability DESC
    `);
    return summary.rows;
  }
}
