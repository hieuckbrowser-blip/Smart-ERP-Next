import { Injectable, BadRequestException } from '@nestjs/common';
import { DrizzleService } from '../drizzle/drizzle.service';
import { reportTemplates, ReportTemplate } from '@smart-erp/database';
import { eq, and } from 'drizzle-orm';
import { sql } from 'drizzle-orm';

@Injectable()
export class ReportEngineService {
  constructor(private drizzle: DrizzleService) {}

  async createTemplate(tenantId: string, data: any): Promise<ReportTemplate> {
    const [template] = await this.drizzle.db
      .insert(reportTemplates)
      .values({
        tenantId,
        name: data.name,
        description: data.description,
        querySql: data.querySql,
        parameters: data.parameters,
        outputSchema: data.outputSchema,
        isSystem: data.isSystem || false,
      })
      .returning();
    return template;
  }

  async getAllTemplates(tenantId: string): Promise<ReportTemplate[]> {
    return this.drizzle.db
      .select()
      .from(reportTemplates)
      .where(eq(reportTemplates.tenantId, tenantId));
  }

  async getTemplate(tenantId: string, id: string): Promise<ReportTemplate> {
    const [template] = await this.drizzle.db
      .select()
      .from(reportTemplates)
      .where(and(eq(reportTemplates.tenantId, tenantId), eq(reportTemplates.id, id)))
      .limit(1);
    if (!template) throw new BadRequestException('Template not found');
    return template;
  }

  async runTemplate(tenantId: string, templateId: string, parameters: Record<string, any>): Promise<any[]> {
    const template = await this.getTemplate(tenantId, templateId);
    // Replace placeholders in SQL (simple :paramName -> value)
    let sqlQuery = template.querySql;
    for (const [key, value] of Object.entries(parameters)) {
      const placeholder = new RegExp(`:${key}\\b`, 'g');
      // Basic escaping – in production use parameterized queries
      const escaped = typeof value === 'string' ? `'${value.replace(/'/g, "''")}'` : value;
      sqlQuery = sqlQuery.replace(placeholder, escaped);
    }
    // Add tenantId
    sqlQuery = sqlQuery.replace(/:tenantId/g, `'${tenantId}'`);

    const result = await this.drizzle.db.execute(sql.raw(sqlQuery));
    return result.rows;
  }

  // Predefined revenue report example (SQL for PostgreSQL)
  static getRevenueReportSql(): string {
    return `
      SELECT
        date_trunc('month', o.created_at) as month,
        COUNT(o.id) as order_count,
        SUM(o.total) as total_revenue,
        SUM(o.tax_amount) as total_tax,
        AVG(o.total) as avg_order_value
      FROM orders o
      WHERE o.tenant_id = :tenantId
        AND o.status != 'cancelled'
        AND o.created_at BETWEEN :startDate AND :endDate
      GROUP BY month
      ORDER BY month ASC
    `;
  }
}
