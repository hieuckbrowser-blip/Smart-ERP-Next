import { Injectable } from '@nestjs/common';
import { DrizzleService } from '../drizzle/drizzle.service';
import { eInvoices, eInvoiceItems, purchaseOrders, purchaseOrderItems } from '@smart-erp/database';
import { eq, and } from 'drizzle-orm';
import PDFDocument from 'pdfkit';

@Injectable()
export class ExportPdfService {
  constructor(private readonly drizzle: DrizzleService) {}

  async generateInvoicePdf(tenantId: string, invoiceId: string): Promise<Buffer> {
    const [invoice] = await this.drizzle.db
      .select()
      .from(eInvoices)
      .where(and(eq(eInvoices.tenantId, tenantId), eq(eInvoices.id, invoiceId)))
      .limit(1);

    if (!invoice) throw new Error('Invoice not found');

    const items = await this.drizzle.db
      .select()
      .from(eInvoiceItems)
      .where(eq(eInvoiceItems.invoiceId, invoiceId));

    return this.buildPdf({ ...invoice, items }, 'invoice');
  }

  async generatePurchaseOrderPdf(tenantId: string, poId: string): Promise<Buffer> {
    const [po] = await this.drizzle.db
      .select()
      .from(purchaseOrders)
      .where(and(eq(purchaseOrders.tenantId, tenantId), eq(purchaseOrders.id, poId)))
      .limit(1);

    if (!po) throw new Error('Purchase order not found');

    const items = await this.drizzle.db
      .select()
      .from(purchaseOrderItems)
      .where(eq(purchaseOrderItems.purchaseOrderId, poId));

    return this.buildPdf({ ...po, items }, 'purchase-order');
  }

  private buildPdf(data: any, type: string): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 50 });
      const buffers: Buffer[] = [];
      doc.on('data', (chunk: Buffer) => buffers.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', reject);

      const isInvoice = type === 'invoice';
      const title = isInvoice ? 'INVOICE' : 'PURCHASE ORDER';
      const date = data.date || data.orderDate || new Date().toISOString().split('T')[0];
      const items: any[] = data.items || [];
      const total = data.total ?? data.totalAmount ?? 0;

      const buyerName = data.buyerName || data.customerName || data.supplierName || '';
      const buyerAddress = data.buyerAddress || data.customerAddress || data.supplierAddress || '';

      doc.fontSize(20).text(title, { align: 'center' });
      doc.moveDown();
      doc.fontSize(10).text(`Date: ${date}`, { align: 'right' });
      doc.moveDown();

      if (buyerName) {
        doc.fontSize(12).text(`${isInvoice ? 'Bill To' : 'Supplier'}: ${buyerName}`);
        if (buyerAddress) {
          doc.fontSize(10).text(buyerAddress);
        }
        doc.moveDown();
      }

      const tableTop = doc.y;
      const colX = [50, 150, 300, 370, 440];
      const colWidths = [90, 140, 60, 60, 80];
      const headers = ['#', 'Item', 'Qty', 'Price', 'Total'];

      doc.fontSize(10).font('Helvetica-Bold');
      headers.forEach((h, i) => {
        doc.text(h, colX[i], tableTop, { width: colWidths[i], align: 'left' });
      });

      doc.moveDown(0.5);
      let y = doc.y;

      items.forEach((item: any, idx: number) => {
        const name = item.name || item.itemName || item.productName || '';
        const qty = item.quantity ?? 0;
        const price = item.unitPrice ?? item.price ?? 0;
        const lineTotal = qty * Number(price);

        doc.font('Helvetica').fontSize(9);
        const row = [(idx + 1).toString(), name, qty.toString(), `$${Number(price).toFixed(2)}`, `$${lineTotal.toFixed(2)}`];

        row.forEach((val, i) => {
          doc.text(val, colX[i], y, { width: colWidths[i], align: i === 0 ? 'left' : 'left' });
        });

        y += 18;
      });

      doc.moveDown();
      doc.font('Helvetica-Bold').fontSize(12);
      doc.text(`Total: $${Number(total).toFixed(2)}`, { align: 'right' });

      doc.moveDown(2);
      doc.fontSize(8).font('Helvetica').fillColor('#666');
      doc.text(`Smart ERP Next — Generated on ${new Date().toISOString()}`, { align: 'center' });

      doc.end();
    });
  }
}
