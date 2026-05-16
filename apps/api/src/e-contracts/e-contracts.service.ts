import { Injectable, NotFoundException } from '@nestjs/common';
import { DrizzleService } from '../drizzle/drizzle.service';
import { e_contracts } from '@smart-erp/database';
import { eq, desc } from 'drizzle-orm';

@Injectable()
export class EContractsService {
  constructor(private readonly drizzle: DrizzleService) {}

  async getContracts(tenantId: string) {
    return this.drizzle.db
      .select()
      .from(e_contracts)
      .where(eq(e_contracts.tenantId, tenantId))
      .orderBy(desc(e_contracts.createdAt));
  }

  async createContract(tenantId: string, data: any) {
    const [contract] = await this.drizzle.db
      .insert(e_contracts)
      .values({
        tenantId,
        ...data,
      })
      .returning();
    return contract;
  }

  async signContract(tenantId: string, contractId: string, signatureData: any) {
    const [updated] = await this.drizzle.db
      .update(e_contracts)
      .set({ 
        status: 'signed', 
        signatureData,
        updatedAt: new Date() 
      })
      .where(eq(e_contracts.id, contractId))
      .returning();
      
    if (!updated) {
      throw new NotFoundException('E-Contract not found');
    }
    return updated;
  }
}
