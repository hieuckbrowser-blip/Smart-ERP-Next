import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { SettingsService } from './settings.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@Controller('settings')
@UseGuards(JwtAuthGuard)
export class SettingsController {
  constructor(private readonly service: SettingsService) {}

  @Get('register')
  async getRegisterSettings(@Request() req: any) {
    return this.service.getRegisterSettings(req.tenantId);
  }
}
