import { Controller, Get, Post, UseGuards, Request, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery, ApiParam } from '@nestjs/swagger';
import { MRPService } from './mrp.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@ApiTags('MRP')
@Controller('mrp')
@UseGuards(JwtAuthGuard)
export class MRPController {
  constructor(private readonly mrpService: MRPService) {}

  @ApiOperation({ summary: 'Calculate MRP for a single product' })
  @ApiParam({ name: 'productId', type: Number })
  @ApiQuery({ name: 'daysAhead', required: false, type: Number })
  @Get('calculate/:productId')
  async calculateMRP(
    @Request() req: any,
    @Param('productId') productId: number,
    @Query('daysAhead') daysAhead?: number,
  ) {
    return this.mrpService.calculateMRP(req.user.tenantId, Number(productId), daysAhead || 30);
  }

  @ApiOperation({ summary: 'Run full MRP batch for all active products' })
  @ApiQuery({ name: 'daysAhead', required: false, type: Number })
  @Post('calculate-batch')
  async calculateMRPBatch(
    @Request() req: any,
    @Query('daysAhead') daysAhead?: number,
  ) {
    return this.mrpService.calculateMRPBatch(req.user.tenantId, undefined, daysAhead || 30);
  }
}