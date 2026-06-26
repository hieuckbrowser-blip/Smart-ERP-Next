import { Injectable } from '@nestjs/common';
import { DrizzleService } from '../drizzle/drizzle.service';
import { ExportFormat } from './export.enums';
import * as schema from '@smart-erp/database/schema';
import { eq } from '@smart-erp/database/drizzle';

export interface ExportJob {
  id: string;
  tenantId: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  format: ExportFormat;
  entities: string[]; // e.g. ['customers', 'products', 'orders']
  fileUrl?: string;
  fileSize?: number;
  createdAt: string;
  completedAt?: string;
  error?: string;
}

@Injectable()
export class DataExportService {
  private readonly entityMapping: Record<string, any> = {
    products: schema.products,
    customers: schema.customers,
    orders: schema.orders,
    inventory: schema.inventoryTransactions,
    payments: schema.payments,
    accounting: schema.journalEntries,
    suppliers: schema.suppliers,
    crm: schema.crmLeads,
  };

  constructor(private readonly drizzle: DrizzleService) {}

  /** Export data in the requested format */
  async exportData(tenantId: string, format: ExportFormat, entities: string[], filters?: any) {
    const collected: Record<string, any[]> = {};
    let totalCount = 0;

    for (const entity of entities) {
      const table = this.entityMapping[entity];
      if (!table) {
        throw new Error(`Unknown entity: ${entity}`);
      }
      const data = await this.drizzle.db.select().from(table).where(eq(table.tenantId, tenantId));
      collected[entity] = data;
      totalCount += data.length;
    }

    if (format === ExportFormat.CSV) {
      let csv = '';
      for (const entity of entities) {
        const rows = collected[entity];
        if (rows.length > 0) {
          const headers = Object.keys(rows[0]);
          csv += headers.join(',') + '\n';
          for (const row of rows) {
            csv += headers.map((h) => this.escapeCsvField(row[h])).join(',') + '\n';
          }
        }
      }
      return {
        data: csv,
        format: 'csv',
        filename: `export-${Date.now()}.csv`,
        mimeType: 'text/csv',
        entityCount: totalCount,
      };
    }

    return {
      data: JSON.stringify(collected),
      format: 'json',
      filename: `export-${Date.now()}.json`,
      mimeType: 'application/json',
      entityCount: totalCount,
    };
  }

  private escapeCsvField(value: any): string {
    if (value === null || value === undefined) return '';
    const str = String(value);
    if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
      return '"' + str.replace(/"/g, '""') + '"';
    }
    return str;
  }

  /** Create a new export job */
  async createExportJob(tenantId: string, format: ExportFormat, entities: string[]) {
    const job: Partial<ExportJob> = {
      tenantId,
      format,
      entities,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    // In a real implementation, this would be saved to a jobs table
    // and processed by a background queue (e.g. BullMQ)
    return job;
  }

  /** Get export status */
  async getExportStatus(tenantId: string, jobId: string) {
    // Placeholder: return mock status
    return {
      id: jobId,
      tenantId,
      status: 'completed',
      format: 'json',
      entities: ['customers', 'products'],
      fileUrl: '/exports/data-export-2026-05-14.json',
      fileSize: 1024 * 512,
      createdAt: new Date(Date.now() - 3600000).toISOString(),
      completedAt: new Date().toISOString(),
    };
  }

  /** Download export file */
  async getExportFile(tenantId: string, jobId: string): Promise<Buffer> {
    // In a real implementation, this would read from S3/GCS
    // For now, return mock JSON data
    const mockData = JSON.stringify({ exportDate: new Date().toISOString(), tenantId });
    return Buffer.from(mockData);
  }

  /** List available entities for export */
  getExportableEntities() {
    return [
      { key: 'customers', label: 'Customers' },
      { key: 'products', label: 'Products' },
      { key: 'orders', label: 'Orders' },
      { key: 'inventory', label: 'Inventory' },
      { key: 'payments', label: 'Payments' },
      { key: 'accounting', label: 'Accounting' },
      { key: 'suppliers', label: 'Suppliers' },
      { key: 'crm', label: 'CRM' },
    ];
  }
}