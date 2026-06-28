import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { db } from '@smart-erp/database';
import { products, activityLogs } from '@smart-erp/database/schema';
import { lt, sql } from '@smart-erp/database/drizzle';

@Injectable()
export class SchedulerService {
  private readonly logger = new Logger(SchedulerService.name);

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleCron() {
    this.logger.log('Running daily scheduled tasks...');
    await this.checkLowStock();
    await this.cleanupOldLogs();
  }

  async checkLowStock() {
    const lowStock = await db.select().from(products).where(
      sql`${products.stock} <= ${products.minStock} AND ${products.isActive} = true`,
    );
    this.logger.log(`Low stock check: ${lowStock.length} products below minimum`);
    return { checked: lowStock.length };
  }

  async cleanupOldLogs() {
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    const result = await db.delete(activityLogs).where(
      lt(activityLogs.createdAt, ninetyDaysAgo),
    );
    this.logger.log(`Cleaned up ${result.rowCount || 0} old activity logs`);
    return { deleted: result.rowCount || 0 };
  }
}
