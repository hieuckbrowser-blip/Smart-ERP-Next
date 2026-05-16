import { Injectable } from '@nestjs/common';
import { DrizzleService } from '../drizzle/drizzle.service';
import { orders, e_contracts, crm_leads, attendance } from '@smart-erp/database';
import { eq, sql, gte, and } from 'drizzle-orm';

@Injectable()
export class AiCopilotService {
  constructor(private readonly drizzle: DrizzleService) {}

  async getExecutiveInsights(tenantId: string) {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // 1. Calculate Revenue
    const revenueRes = await this.drizzle.db
      .select({ total: sql<number>`sum(${orders.totalAmount})` })
      .from(orders)
      .where(and(eq(orders.tenantId, tenantId), gte(orders.createdAt, startOfMonth)));
    const revenue = revenueRes[0]?.total || 0;

    // 2. Count CRM Leads & Conversion
    const leadsRes = await this.drizzle.db
      .select({ count: sql<number>`count(*)` })
      .from(crm_leads)
      .where(and(eq(crm_leads.tenantId, tenantId), gte(crm_leads.createdAt, startOfMonth)));
    const leadsCount = leadsRes[0]?.count || 0;

    // 3. Attendance Health (Late arrivals)
    // Giả định có trường checkInTime và startTime
    const lateRes = await this.drizzle.db
      .select({ count: sql<number>`count(*)` })
      .from(attendance)
      .where(and(eq(attendance.tenantId, tenantId), eq(attendance.status, 'late')));
    const lateCount = lateRes[0]?.count || 0;

    // 4. E-Contract Status
    const signedContractsRes = await this.drizzle.db
      .select({ count: sql<number>`count(*)` })
      .from(e_contracts)
      .where(and(eq(e_contracts.tenantId, tenantId), eq(e_contracts.status, 'signed')));
    const signedCount = signedContractsRes[0]?.count || 0;

    // Phân tích "thông minh" dựa trên dữ liệu thực
    let healthStatus = 'ổn định';
    let recommendations = [];

    if (lateCount > 5) {
      healthStatus = 'cần chú ý';
      recommendations.push('Tỉ lệ nhân viên đi trễ đang cao. Cần rà soát lại chính sách chuyên cần.');
    }

    if (revenue < 100000000) {
      recommendations.push('Doanh thu chưa đạt kỳ vọng. Hãy đẩy mạnh các Lead trong CRM.');
    }

    if (leadsCount > 10 && signedCount < 2) {
      recommendations.push('Nhiều Lead nhưng tỉ lệ chốt hợp đồng thấp. Cần kiểm tra lại khâu sale B2B.');
    }

    return {
      revenue,
      leadsCount,
      lateCount,
      signedCount,
      healthStatus,
      summary: `Hệ thống hiện tại đang ở trạng thái ${healthStatus}.`,
      recommendations,
      generatedAt: now.toISOString(),
    };
  }
}
