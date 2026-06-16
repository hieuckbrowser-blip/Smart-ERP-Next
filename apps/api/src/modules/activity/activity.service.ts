import { Injectable } from '@nestjs/common';
import { DrizzleService } from '../../drizzle/drizzle.service';
import { eq, and, desc, gte, lte, sql } from 'drizzle-orm';
import { activityLogs, users } from '@smart-erp/database';
import { QueryActivityDto } from './dto/query-activity.dto';

@Injectable()
export class ActivityService {
  constructor(private readonly drizzle: DrizzleService) {}

  async getRecentActivities(tenantId: string, limit = 10): Promise<any[]> {
    return this.drizzle.db
      .select({
        id: activityLogs.id,
        tenantId: activityLogs.tenantId,
        userId: activityLogs.userId,
        action: activityLogs.action,
        entityType: activityLogs.entityType,
        entityId: activityLogs.entityId,
        details: activityLogs.details,
        createdAt: activityLogs.createdAt,
        user: {
          id: users.id,
          name: users.name,
          email: users.email,
        },
      })
      .from(activityLogs)
      .leftJoin(users, eq(activityLogs.userId, users.id))
      .where(eq(activityLogs.tenantId, tenantId))
      .orderBy(desc(activityLogs.createdAt))
      .limit(limit);
  }

  async findAllPaginated(
    tenantId: string,
    query: QueryActivityDto,
  ): Promise<{ items: any[]; total: number; page: number; limit: number; totalPages: number }> {
    const page = query.page || 1;
    const limit = query.limit || 10;
    const { entityType, action, userId, fromDate, toDate } = query;
    const offset = (page - 1) * limit;

    const conditions = [eq(activityLogs.tenantId, tenantId)];
    if (entityType) conditions.push(eq(activityLogs.entityType, entityType));
    if (action) conditions.push(eq(activityLogs.action, action));
    if (userId) conditions.push(eq(activityLogs.userId, userId));
    if (fromDate) conditions.push(gte(activityLogs.createdAt, new Date(fromDate)));
    if (toDate) conditions.push(lte(activityLogs.createdAt, new Date(toDate)));

    const whereClause = and(...conditions);

    // Get total count
    const [countResult] = await this.drizzle.db
      .select({ count: sql<number>`count(*)` })
      .from(activityLogs)
      .where(whereClause);
    const total = Number(countResult?.count || 0);

    // Get paginated items
    const items = await this.drizzle.db
      .select({
        id: activityLogs.id,
        tenantId: activityLogs.tenantId,
        userId: activityLogs.userId,
        action: activityLogs.action,
        entityType: activityLogs.entityType,
        entityId: activityLogs.entityId,
        details: activityLogs.details,
        createdAt: activityLogs.createdAt,
        user: {
          id: users.id,
          name: users.name,
          email: users.email,
        },
      })
      .from(activityLogs)
      .leftJoin(users, eq(activityLogs.userId, users.id))
      .where(whereClause)
      .orderBy(desc(activityLogs.createdAt))
      .limit(limit)
      .offset(offset);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async log(
    tenantId: string,
    userId: string,
    action: string,
    entityType: string,
    entityId: string,
    details?: Record<string, any>,
  ): Promise<any> {
    const [inserted] = await this.drizzle.db
      .insert(activityLogs)
      .values({
        tenantId,
        userId: userId || undefined as any,
        action,
        entityType,
        entityId,
        details,
      })
      .returning();
    return inserted;
  }
}
