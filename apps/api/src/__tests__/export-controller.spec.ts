import { ExportController } from '../exports/export.controller';
import { ExportFormat } from '../exports/export.enums';

describe('ExportController', () => {
  let controller: ExportController;
  let mockService: any;

  beforeEach(() => {
    mockService = {
      getExportableEntities: jest.fn(),
      exportData: jest.fn(),
    };
    controller = new (ExportController as any)(mockService) as ExportController;
  });

  describe('GET /entities', () => {
    it('returns entity list', () => {
      const entities = [
        { key: 'customers', label: 'Customers' },
        { key: 'products', label: 'Products' },
      ];
      mockService.getExportableEntities.mockReturnValue(entities);

      const result = controller.getExportableEntities();

      expect(result).toEqual(entities);
      expect(mockService.getExportableEntities).toHaveBeenCalled();
    });
  });

  describe('POST /exports', () => {
    it('calls exportData with CSV format and correct params', async () => {
      const req = { user: { tenantId: 'tenant-1' } };
      const body = { format: ExportFormat.CSV, entities: ['customers', 'products'] };
      const expected = {
        data: 'name\nfoo',
        format: 'csv',
        filename: 'export.csv',
        mimeType: 'text/csv',
        entityCount: 1,
      };
      mockService.exportData.mockResolvedValue(expected);

      const result = await controller.createExport(req as any, body as any);

      expect(mockService.exportData).toHaveBeenCalledWith('tenant-1', ExportFormat.CSV, ['customers', 'products']);
      expect(result).toEqual(expected);
    });

    it('calls exportData with JSON format', async () => {
      const req = { user: { tenantId: 'tenant-2' } };
      const body = { format: ExportFormat.JSON, entities: ['orders'] };
      const expected = {
        data: '{"orders":[]}',
        format: 'json',
        filename: 'export.json',
        mimeType: 'application/json',
        entityCount: 0,
      };
      mockService.exportData.mockResolvedValue(expected);

      const result = await controller.createExport(req as any, body as any);

      expect(mockService.exportData).toHaveBeenCalledWith('tenant-2', ExportFormat.JSON, ['orders']);
      expect(result).toEqual(expected);
    });
  });

  describe('GET /:id/download', () => {
    it('returns buffer with correct headers', async () => {
      const req = { user: { tenantId: 'tenant-1' } };
      const res = { setHeader: jest.fn(), send: jest.fn() };
      const exportResult = {
        data: 'col1,col2\nval1,val2',
        format: 'csv',
        filename: 'export-123.csv',
        mimeType: 'text/csv',
        entityCount: 1,
      };
      mockService.exportData.mockResolvedValue(exportResult);

      await controller.downloadExport(req as any, 'customers', ExportFormat.CSV, res as any);

      expect(mockService.exportData).toHaveBeenCalledWith('tenant-1', ExportFormat.CSV, ['customers']);
      expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'text/csv');
      expect(res.setHeader).toHaveBeenCalledWith('Content-Disposition', 'attachment; filename="export-123.csv"');
      expect(res.send).toHaveBeenCalledWith(Buffer.from('col1,col2\nval1,val2'));
    });
  });
});
