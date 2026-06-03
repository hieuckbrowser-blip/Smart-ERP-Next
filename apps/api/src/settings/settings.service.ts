import { Injectable } from '@nestjs/common';

@Injectable()
export class SettingsService {
  getRegisterSettings(tenantId?: string) {
    return {
      tenantId,
      companyName: '',
      tenantName: '',
      adminName: '',
    };
  }
}
