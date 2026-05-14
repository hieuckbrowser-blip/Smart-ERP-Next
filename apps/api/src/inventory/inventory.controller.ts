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

  /** Inventory transaction history for tenant */
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

  /** Manual stock adjustment */
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

  /** List of products running low on stock */
  @Get('low-stock')
  getLowStock(@Request() req: any) {
    return this.inventoryService.getLowStock(req.user.tenantId);
  }

  /** Inventory summary overview */
  @Get('summary')
  getSummary(@Request() req: any) {
    return this.inventoryService.getSummary(req.user.tenantId);
  }

  /** Reorder suggestions based on minStock/reorderQuantity */
  @Get('reorder-suggestions')
  getReorderSuggestions(@Request() req: any) {
    return this.inventoryService.getReorderSuggestions(req.user.tenantId);
  }

  // ---------- Omnichannel Inventory Sync ----------

  /** Get available stock (after subtracting reservation + buffer) */
  @Get('available-stock/:productId')
  getAvailableStock(
    @Request() req: any,
    @Param('productId') productId: string,
    @Query('storeId') storeId?: string,
  ) {
    return this.inventoryService.getAvailableStock(req.user.tenantId, productId, storeId);
  }

  /** Create reservation for marketplace order */
  @Post('reservations')
  createReservation(
    @Request() req: any,
    @Body()
    body: {
      storeId: string;
      externalOrderId: string;
      productId: string;
      quantity: number;
    },
  ) {
    return this.inventoryService.createReservation(
      req.user.tenantId,
      body.storeId,
      body.externalOrderId,
      body.productId,
      body.quantity,
    );
  }

  /** Release reservation (when order is cancelled) */
  @Post('reservations/release')
  releaseReservation(
    @Request() req: any,
    @Body()
    body: { externalOrderId: string },
  ) {
    return this.inventoryService.releaseReservation(req.user.tenantId, body.externalOrderId);
  }

  /** Consume reservation (when order is fulfilled) */
  @Post('reservations/consume')
  consumeReservation(
    @Request() req: any,
    @Body()
    body: { externalOrderId: string },
  ) {
    return this.inventoryService.consumeReservation(req.user.tenantId, body.externalOrderId);
  }

  /** Push available stock to marketplace */
  @Post('sync-channel-stock/:storeId')
  pushStockToMarketplace(@Request() req: any, @Param('storeId') storeId: string) {
    return this.inventoryService.pushStockToMarketplace(req.user.tenantId, storeId);
  }

  /** Sync stock for all stores */
  @Post('sync-all-stores-stock')
  syncAllStoresStock(@Request() req: any) {
    return this.inventoryService.syncAllStoresStock(req.user.tenantId);
  }
}
