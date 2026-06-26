import { Module } from '@nestjs/common';
import { ExportPdfController } from './export-pdf.controller';
import { ExportPdfService } from './export-pdf.service';

@Module({
  controllers: [ExportPdfController],
  providers: [ExportPdfService],
  exports: [ExportPdfService],
})
export class ExportPdfModule {}
