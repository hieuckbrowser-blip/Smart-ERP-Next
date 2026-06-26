import { Controller, Get, Post, Param, Body, Query, Res, UseGuards, Request } from '@nestjs/common';
import { Response } from 'express';
import { DataExportService } from './data-export.service';
import { ExportFormat } from './export.enums';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@Controller('exports')
@UseGuards(JwtAuthGuard)
export class ExportController {
  constructor(private readonly service: DataExportService) {}

  @Get('entities')
  getExportableEntities() {
    return this.service.getExportableEntities();
  }

  @Post()
  async createExport(
    @Request() req: any,
    @Body() body: { format: ExportFormat; entities: string[]; dateFrom?: string; dateTo?: string },
  ) {
    return this.service.exportData(req.user.tenantId, body.format, body.entities);
  }

  @Get(':id/status')
  getExportStatus(@Request() req: any, @Param('id') id: string) {
    return this.service.getExportStatus(req.user.tenantId, id);
  }

  @Get(':id/download')
  async downloadExport(
    @Request() req: any,
    @Param('id') id: string,
    @Query('format') format: ExportFormat,
    @Res() res: Response,
  ) {
    const fmt = format || ExportFormat.JSON;
    const result = await this.service.exportData(req.user.tenantId, fmt, [id]);
    res.setHeader('Content-Type', result.mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
    res.send(Buffer.from(result.data));
  }
}