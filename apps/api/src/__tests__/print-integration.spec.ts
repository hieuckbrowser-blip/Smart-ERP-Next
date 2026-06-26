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

import { PrintService } from '../print/print.service';
import { PrintController } from '../print/print.controller';

describe('PrintService', () => {
  let service: PrintService;
  let mockDb: ReturnType<typeof createMockDb>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockDb = createMockDb();
    const mockDrizzleService = createMockDrizzleService(mockDb);
    service = new PrintService(mockDrizzleService as any);
  });

  describe('renderInvoice', () => {
    it('renders HTML containing "INVOICE" and item details when data exists', async () => {
      const invoice = {
        id: 'inv-1',
        tenantId: 't1',
        buyerName: 'Test Buyer',
        totalAmount: '1500',
        lineItems: [
          { itemName: 'Item A', quantity: 2, unitPrice: '500' },
          { itemName: 'Item B', quantity: 1, unitPrice: '500' },
        ],
      };
      const items = [
        { itemName: 'Item A', quantity: 2, unitPrice: '500' },
        { itemName: 'Item B', quantity: 1, unitPrice: '500' },
      ];

      mockDb._queueSequence([[invoice], items]);

      const html = await service.renderInvoice('t1', 'inv-1');

      expect(html).toContain('INVOICE');
      expect(html).toContain('Item A');
      expect(html).toContain('Test Buyer');
      expect(html).toContain('1500');
    });

    it('throws error when invoice not found', async () => {
      mockDb._resolveWith([]);

      await expect(service.renderInvoice('t1', 'missing-id')).rejects.toThrow('Invoice not found');
    });
  });

  describe('renderPurchaseOrder', () => {
    it('renders HTML containing "PURCHASE ORDER"', async () => {
      const po = {
        id: 'po-1',
        tenantId: 't1',
        total: '2000',
        items: [{ productName: 'Widget', quantity: 10, price: 200 }],
      };

      mockDb._resolveWith([po]);

      const html = await service.renderPurchaseOrder('t1', 'po-1');

      expect(html).toContain('PURCHASE ORDER');
    });
  });

  describe('renderHtml', () => {
    it('generates proper table structure with items', () => {
      const data = {
        items: [{ name: 'Test', quantity: 3, price: 100 }],
        total: 300,
      };

      const html = (service as any).renderHtml('invoice', data);

      expect(html).toContain('<table>');
      expect(html).toContain('<th>Item</th>');
      expect(html).toContain('<th>Total</th>');
      expect(html).toContain('<tr><td>Test</td>');
    });

    it('contains CSS styles for printing', () => {
      const data = { items: [], total: 0 };
      const html = (service as any).renderHtml('invoice', data);

      expect(html).toContain('@media print');
      expect(html).toContain('font-family: Arial');
    });
  });
});

describe('PrintController', () => {
  let controller: PrintController;
  let mockPrintService: { renderInvoice: jest.Mock; renderPurchaseOrder: jest.Mock };
  let mockResponse: { setHeader: jest.Mock; send: jest.Mock };

  beforeEach(() => {
    mockPrintService = {
      renderInvoice: jest.fn(),
      renderPurchaseOrder: jest.fn(),
    };
    mockResponse = {
      setHeader: jest.fn(),
      send: jest.fn(),
    };
    controller = new PrintController(mockPrintService as any);
  });

  describe('printInvoice', () => {
    it('sets correct Content-Type and sends HTML for valid ID', async () => {
      const html = '<html>INVOICE</html>';
      mockPrintService.renderInvoice.mockResolvedValue(html);

      const req = { user: { tenantId: 't1' } };
      await controller.printInvoice(req, 'inv-1', mockResponse as any);

      expect(mockPrintService.renderInvoice).toHaveBeenCalledWith('t1', 'inv-1');
      expect(mockResponse.setHeader).toHaveBeenCalledWith('Content-Type', 'text/html; charset=utf-8');
      expect(mockResponse.send).toHaveBeenCalledWith(html);
    });

    it('throws NotFoundException when invoice not found', async () => {
      mockPrintService.renderInvoice.mockRejectedValue(new Error('Invoice not found'));

      const req = { user: { tenantId: 't1' } };

      await expect(
        controller.printInvoice(req, 'bad-id', mockResponse as any)
      ).rejects.toThrow('Invoice not found');
    });
  });

  describe('printPurchaseOrder', () => {
    it('calls service and returns HTML', async () => {
      const html = '<html>PO</html>';
      mockPrintService.renderPurchaseOrder.mockResolvedValue(html);

      const req = { user: { tenantId: 't1' } };
      await controller.printPurchaseOrder(req, 'po-1', mockResponse as any);

      expect(mockPrintService.renderPurchaseOrder).toHaveBeenCalledWith('t1', 'po-1');
      expect(mockResponse.setHeader).toHaveBeenCalledWith('Content-Type', 'text/html; charset=utf-8');
      expect(mockResponse.send).toHaveBeenCalledWith(html);
    });
  });
});
