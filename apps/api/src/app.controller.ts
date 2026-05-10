import { Controller, Get } from '@nestjs/common';
import { db } from '@smart-erp/database';
import { sql } from '@smart-erp/database/drizzle';

@Controller()
export class AppController {
  @Get()
  getRoot() {
    return { name: 'Smart ERP Next API', version: '0.3.0' };
  }

  @Get('health')
  async getHealth() {
    let dbStatus = 'ok';
    try {
      await db.execute(sql`SELECT 1`);
    } catch {
      dbStatus = 'error';
    }
    return {
      status: dbStatus === 'ok' ? 'ok' : 'degraded',
      db: dbStatus,
      timestamp: new Date().toISOString(),
      uptime: Math.floor(process.uptime()),
    };
  }
}
