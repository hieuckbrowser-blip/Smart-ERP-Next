import { Module } from '@nestjs/common';
import { EContractsController } from './e-contracts.controller';
import { EContractsService } from './e-contracts.service';
import { DrizzleModule } from '../drizzle/drizzle.module';

@Module({
  imports: [DrizzleModule],
  controllers: [EContractsController],
  providers: [EContractsService],
  exports: [EContractsService],
})
export class EContractsModule {}
