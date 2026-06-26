import { Controller, Get, Param, UseGuards, Request, Res, NotFoundException } from '@nestjs/common';
import { Response } from 'express';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { ExportPdfService } from './export-pdf.service';

@Controller('export-pdf')
@UseGuards(JwtAuthGuard)
export class ExportPdfController {
  constructor(private readonly exportPdfService: ExportPdfService) {}

  @Get('invoice/:id')
  async exportInvoice(@Request() req: any, @Param('id') id: string, @Res() res: Response) {
    try {
      const pdf = await this.exportPdfService.generateInvoicePdf(req.user.tenantId, id);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="invoice-${id}.pdf"`);
      res.send(pdf);
    } catch {
      throw new NotFoundException('Invoice not found');
    }
  }

  @Get('purchase-order/:id')
  async exportPurchaseOrder(@Request() req: any, @Param('id') id: string, @Res() res: Response) {
    try {
      const pdf = await this.exportPdfService.generatePurchaseOrderPdf(req.user.tenantId, id);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="purchase-order-${id}.pdf"`);
      res.send(pdf);
    } catch {
      throw new NotFoundException('Purchase order not found');
    }
  }
}
