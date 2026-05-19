import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Controller('loyalty')
export class LoyaltyController {
  constructor() {}

  @UseGuards(AuthGuard('jwt'))
  @Get()
  async getUserPoints() {
    return { points: 0 };
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('redeem')
  async redeemPoints(@Body() dto: any) {
    return { success: true };
  }
}
