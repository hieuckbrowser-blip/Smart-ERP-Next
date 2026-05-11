import { Controller, Post, Get, Body, Query, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { EcommerceService } from './ecommerce.service';

@Controller('ecommerce')
@UseGuards(JwtAuthGuard)
export class EcommerceController {
  constructor(private readonly ecommerceService: EcommerceService) {}

  // existing endpoints omitted

  @Post('stores/:storeId/sync/tiktokshop')
  async syncTikTokShop(@Param('storeId') storeId: string, @CurrentUser() user: any) {
    await this.ecommerceService.syncTikTokShopProducts(storeId);
    await this.ecommerceService.syncTikTokShopOrders(storeId);
    return { message: 'TikTok Shop sync completed' };
  }

  @Post('stores/:storeId/sync/amazon')
  async syncAmazon(@Param('storeId') storeId: string, @CurrentUser() user: any) {
    await this.ecommerceService.syncAmazonProducts(storeId);
    await this.ecommerceService.syncAmazonOrders(storeId);
    return { message: 'Amazon sync completed' };
  }
}
