import {
  Controller, Get, Post, Body, Param, Query,
  UseGuards, Request, ParseUUIDPipe,
} from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  /** Lịch sử nhập/xuất kho toàn tenant */
  @Get('transactions')
  getTransactions(
    @Request() req: any,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('productId') productId?: string,
    @Query('type') type?: string,
  ) {
    return this.inventoryService.getTransactions(req.user.tenantId, {
      page: page ? parseInt(page) : undefined,
      limit: limit ? parseInt(limit) : undefined,
      productId,
      type,
    });
  }

  /** Điều chỉnh tồn kho thủ công */
  @Post('adjust')
  adjust(
    @Request() req: any,
    @Body()
    body: {
      productId: string;
      quantity: number;
      type: 'IN' | 'OUT' | 'ADJUSTMENT';
      notes?: string;
      reference?: string;
    },
  ) {
    return this.inventoryService.adjust(
      req.user.tenantId,
      req.user.sub,
      body.productId,
      body.quantity,
      body.type,
      body.notes,
      body.reference,
    );
  }

  /** Danh sách sản phẩm sắp hết hàng */
  @Get('low-stock')
  getLowStock(@Request() req: any) {
    return this.inventoryService.getLowStock(req.user.tenantId);
  }

  /** Tổng quan tồn kho */
  @Get('summary')
  getSummary(@Request() req: any) {
    return this.inventoryService.getSummary(req.user.tenantId);
  }

  /** Gợi ý đặt hàng lại dựa trên minStock/reorderQuantity */
  @Get('reorder-suggestions')
  getReorderSuggestions(@Request() req: any) {
    return this.inventoryService.getReorderSuggestions(req.user.tenantId);
  }
}
