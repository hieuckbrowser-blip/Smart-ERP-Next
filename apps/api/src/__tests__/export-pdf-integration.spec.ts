import { createMockDb, createMockDrizzleService } from './db.mock';

jest.mock('drizzle-orm', () => ({
  eq: jest.fn((f: any, v: any) => ({ op: 'eq', field: f, value: v })),
  and: jest.fn((...c: any[]) => ({ op: 'and', conditions: c })),
}));

jest.mock('@smart-erp/database', () => ({
  eInvoices: {},
  eInvoiceItems: {},
  purchaseOrders: {},
  purchaseOrderItems: {},
}));

jest.mock('@nestjs/passport', () => ({
  AuthGuard: jest.fn(() => {
    return class MockGuard {
      canActivate() { return true; }
    };
  }),
}));

import { ExportPdfService } from '../export-pdf/export-pdf.service';
import { ExportPdfController } from '../export-pdf/export-pdf.controller';

describe('ExportPdfService', () => {
  let service: ExportPdfService;
  let mockDb: ReturnType<typeof createMockDb>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockDb = createMockDb();
    const mockDrizzleService = createMockDrizzleService(mockDb);
    service = new ExportPdfService(mockDrizzleService as any);
  });

  describe('generateInvoicePdf', () => {
    it('returns a Buffer with size > 0 for valid invoice', async () => {
      const invoice = {
        id: 'inv-1',
        tenantId: 't1',
        buyerName: 'Test Buyer',
        buyerAddress: '123 Test St',
        totalAmount: '1500',
        date: '2024-06-26',
      };
      const items = [
        { invoiceId: 'inv-1', itemName: 'Item A', quantity: 2, unitPrice: '500' },
        { invoiceId: 'inv-1', itemName: 'Item B', quantity: 1, unitPrice: '500' },
      ];

      mockDb._queueSequence([[invoice], items]);

      const result = await service.generateInvoicePdf('t1', 'inv-1');

      expect(Buffer.isBuffer(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
    });

    it('throws error when invoice not found', async () => {
      mockDb._resolveWith([]);

      await expect(service.generateInvoicePdf('t1', 'missing-id')).rejects.toThrow('Invoice not found');
    });
  });

  describe('generatePurchaseOrderPdf', () => {
    it('returns a Buffer for valid purchase order', async () => {
      const po = {
        id: 'po-1',
        tenantId: 't1',
        supplierName: 'Test Supplier',
        totalAmount: '2000',
        orderDate: '2024-06-26',
      };
      const items = [
        { purchaseOrderId: 'po-1', productName: 'Widget', quantity: 10, price: '200' },
      ];

      mockDb._queueSequence([[po], items]);

      const result = await service.generatePurchaseOrderPdf('t1', 'po-1');

      expect(Buffer.isBuffer(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
    });

    it('throws error when purchase order not found', async () => {
      mockDb._resolveWith([]);

      await expect(service.generatePurchaseOrderPdf('t1', 'missing-id')).rejects.toThrow('Purchase order not found');
    });
  });

  describe('PDF format', () => {
    it('produces PDF starting with %PDF magic bytes', async () => {
      const invoice = {
        id: 'inv-1',
        tenantId: 't1',
        buyerName: 'Test Buyer',
        totalAmount: '100',
      };
      const items = [
        { invoiceId: 'inv-1', itemName: 'Item A', quantity: 1, unitPrice: '100' },
      ];

      mockDb._queueSequence([[invoice], items]);

      const result = await service.generateInvoicePdf('t1', 'inv-1');
      const header = result.slice(0, 5).toString('ascii');

      expect(header).toBe('%PDF-');
    });
  });
});

describe('ExportPdfController', () => {
  let controller: ExportPdfController;
  let mockExportPdfService: { generateInvoicePdf: jest.Mock; generatePurchaseOrderPdf: jest.Mock };
  let mockResponse: { setHeader: jest.Mock; send: jest.Mock };

  beforeEach(() => {
    mockExportPdfService = {
      generateInvoicePdf: jest.fn(),
      generatePurchaseOrderPdf: jest.fn(),
    };
    mockResponse = {
      setHeader: jest.fn(),
      send: jest.fn(),
    };
    controller = new ExportPdfController(mockExportPdfService as any);
  });

  describe('exportInvoice', () => {
    it('sets Content-Type to application/pdf and returns PDF buffer', async () => {
      const pdfBuffer = Buffer.from('%PDF-1.4...');
      mockExportPdfService.generateInvoicePdf.mockResolvedValue(pdfBuffer);

      const req = { user: { tenantId: 't1' } };
      await controller.exportInvoice(req, 'inv-1', mockResponse as any);

      expect(mockExportPdfService.generateInvoicePdf).toHaveBeenCalledWith('t1', 'inv-1');
      expect(mockResponse.setHeader).toHaveBeenCalledWith('Content-Type', 'application/pdf');
      expect(mockResponse.setHeader).toHaveBeenCalledWith('Content-Disposition', 'attachment; filename="invoice-inv-1.pdf"');
      expect(mockResponse.send).toHaveBeenCalledWith(pdfBuffer);
    });

    it('throws NotFoundException when invoice not found', async () => {
      mockExportPdfService.generateInvoicePdf.mockRejectedValue(new Error('Invoice not found'));

      const req = { user: { tenantId: 't1' } };

      await expect(
        controller.exportInvoice(req, 'bad-id', mockResponse as any)
      ).rejects.toThrow('Invoice not found');
    });
  });

  describe('exportPurchaseOrder', () => {
    it('sets Content-Type and returns PDF buffer', async () => {
      const pdfBuffer = Buffer.from('%PDF-1.4...');
      mockExportPdfService.generatePurchaseOrderPdf.mockResolvedValue(pdfBuffer);

      const req = { user: { tenantId: 't1' } };
      await controller.exportPurchaseOrder(req, 'po-1', mockResponse as any);

      expect(mockExportPdfService.generatePurchaseOrderPdf).toHaveBeenCalledWith('t1', 'po-1');
      expect(mockResponse.setHeader).toHaveBeenCalledWith('Content-Type', 'application/pdf');
      expect(mockResponse.setHeader).toHaveBeenCalledWith('Content-Disposition', 'attachment; filename="purchase-order-po-1.pdf"');
      expect(mockResponse.send).toHaveBeenCalledWith(pdfBuffer);
    });
  });
});
