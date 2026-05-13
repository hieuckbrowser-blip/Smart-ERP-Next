import {
  Controller, Get, Post, Patch, Body, Param,
  Query, UseGuards, Request, ParseUUIDPipe,
} from '@nestjs/common';
import { PurchasingService } from './purchasing.service';
import { CreatePurchaseOrderDto } from './dto/create-purchase-order.dto';
import { CreatePoFromReorderDto } from './dto/create-po-from-reorder.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('purchasing')
export class PurchasingController {
  constructor(private readonly purchasingService: PurchasingService) {}

  @Post()
  create(@Request() req: any, @Body() dto: CreatePurchaseOrderDto) {
    return this.purchasingService.create(req.user.tenantId, req.user.sub, dto);
  }

  @Post('from-reorder-suggestions')
  createFromReorderSuggestions(
    @Request() req: any,
    @Body() dto: CreatePoFromReorderDto,
  ) {
    return this.purchasingService.createFromReorderSuggestions(
      req.user.tenantId,
      req.user.sub,
      dto,
    );
  }

  @Get()
  findAll(
    @Request() req: any,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('status') status?: string,
  ) {
    return this.purchasingService.findAll(req.user.tenantId, {
      page: page ? parseInt(page) : undefined,
      limit: limit ? parseInt(limit) : undefined,
      search,
      status,
    });
  }

  @Get(':id')
  findOne(@Request() req: any, @Param('id', ParseUUIDPipe) id: string) {
    return this.purchasingService.findOne(req.user.tenantId, id);
  }

  @Patch(':id/confirm')
  confirm(@Request() req: any, @Param('id', ParseUUIDPipe) id: string) {
    return this.purchasingService.confirm(req.user.tenantId, id);
  }

  @Post(':id/receive')
  receive(
    @Request() req: any,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { items: { itemId: string; receivedQty: number }[] },
  ) {
    return this.purchasingService.receive(req.user.tenantId, id, req.user.sub, body.items);
  }

  @Patch(':id/cancel')
  cancel(@Request() req: any, @Param('id', ParseUUIDPipe) id: string) {
    return this.purchasingService.cancel(req.user.tenantId, id);
  }
}
