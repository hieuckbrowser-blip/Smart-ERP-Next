import { SettingsService } from './settings.service';

describe('SettingsService', () => {
  let service: SettingsService;

  beforeEach(() => {
    service = new SettingsService();
  });

  it('getRegisterSettings returns default values', () => {
    const result = service.getRegisterSettings();
    expect(result.companyName).toBe('');
    expect(result.tenantName).toBe('');
    expect(result.adminName).toBe('');
  });

  it('getRegisterSettings passes tenantId through', () => {
    const result = service.getRegisterSettings('tenant-123');
    expect(result.tenantId).toBe('tenant-123');
  });

  it('getRegisterSettings handles undefined tenantId', () => {
    const result = service.getRegisterSettings();
    expect(result.tenantId).toBeUndefined();
  });
});
