import { Module } from '@nestjs/common';
import { EInvoiceController } from './e-invoice.controller';
import { EInvoiceService } from './e-invoice.service';
import { DrizzleModule } from '../drizzle/drizzle.module';

@Module({
  imports: [DrizzleModule],
  controllers: [EInvoiceController],
  providers: [EInvoiceService],
  exports: [EInvoiceService],
})
export class EInvoiceModule {}
