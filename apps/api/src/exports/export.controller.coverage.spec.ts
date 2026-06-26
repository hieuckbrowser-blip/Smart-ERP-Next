import { ExportController } from './export.controller';

describe('ExportController', () => {
  let svc: any;
  let ctrl: ExportController;

  beforeEach(() => {
    svc = {
      getExportableEntities: jest.fn(),
      exportData: jest.fn(),
      getExportStatus: jest.fn(),
    };
    ctrl = new ExportController(svc);
  });

  const req = { user: { tenantId: 't1', sub: 'u1' } };

  it('getExportableEntities delegates to service', async () => {
    svc.getExportableEntities.mockResolvedValue(['customers', 'products']);
    const r = await ctrl.getExportableEntities();
    expect(svc.getExportableEntities).toHaveBeenCalledWith();
    expect(r).toEqual(['customers', 'products']);
  });

  it('createExport delegates to service', async () => {
    const result = { data: '{}', format: 'json', filename: 'export.json', mimeType: 'application/json', entityCount: 0 };
    svc.exportData.mockResolvedValue(result);
    const body = { format: 'json' as const, entities: ['customers', 'products'], dateFrom: '2024-01-01' };
    const r = await ctrl.createExport(req, body);
    expect(svc.exportData).toHaveBeenCalledWith('t1', 'json', ['customers', 'products']);
    expect(r).toEqual(result);
  });

  it('getExportStatus delegates to service', async () => {
    svc.getExportStatus.mockResolvedValue({ id: 'exp1', status: 'completed' });
    const r = await ctrl.getExportStatus(req, 'exp1');
    expect(svc.getExportStatus).toHaveBeenCalledWith('t1', 'exp1');
    expect(r).toEqual({ id: 'exp1', status: 'completed' });
  });

  it('downloadExport delegates to service and streams response', async () => {
    const exportResult = { data: 'col1,col2\nv1,v2', format: 'csv', filename: 'export.csv', mimeType: 'text/csv', entityCount: 1 };
    svc.exportData.mockResolvedValue(exportResult);
    const res = { setHeader: jest.fn(), send: jest.fn() };
    await ctrl.downloadExport(req, 'customers', 'csv' as any, res as any);
    expect(svc.exportData).toHaveBeenCalledWith('t1', 'csv', ['customers']);
    expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'text/csv');
    expect(res.setHeader).toHaveBeenCalledWith('Content-Disposition', 'attachment; filename="export.csv"');
    expect(res.send).toHaveBeenCalledWith(Buffer.from('col1,col2\nv1,v2'));
  });
});
