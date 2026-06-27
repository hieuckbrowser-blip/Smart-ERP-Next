import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseGuards,
  Request,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { ImportService } from './import.service';

@Controller('import')
@UseGuards(JwtAuthGuard)
export class ImportController {
  constructor(private readonly importService: ImportService) {}

  @Post('products/preview')
  @UseInterceptors(FileInterceptor('file'))
  async previewProducts(@Request() req: any, @UploadedFile() file: any) {
    if (!file) throw new BadRequestException('File is required');
    return this.importService.previewProducts(req.user.tenantId, file.buffer, file.originalname);
  }

  @Post('products/confirm')
  async confirmImport(@Request() req: any, @Body() body: { batchId: string }) {
    if (!body.batchId) throw new BadRequestException('batchId is required');
    return this.importService.confirmImport(req.user.tenantId, body.batchId);
  }

  @Get('preview/:batchId')
  getPreview(@Param('batchId') batchId: string) {
    const preview = this.importService.getPreview(batchId);
    if (!preview) throw new BadRequestException('Batch not found or expired');
    return preview;
  }
}
