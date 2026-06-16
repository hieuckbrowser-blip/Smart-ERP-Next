import { Controller, Get, Query, UseGuards, Request } from '@nestjs/common';
import { InsightsService } from './insights.service';
import { ForecastService } from '../forecast/forecast.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@Controller('insights')
@UseGuards(JwtAuthGuard)
export class InsightsController {
  constructor(
    private readonly insightsService: InsightsService,
    private readonly forecastService: ForecastService,
  ) {}

  @Get('dashboard')
  getDashboardInsights(@Request() req: any) {
    return this.insightsService.getDashboardInsights(req.user.tenantId);
  }

  @Get('forecast')
  async getForecast(@Request() req: any, @Query('days') days?: string) {
    return this.insightsService.getForecast(req.user.tenantId, days ? parseInt(days) : 30);
  }
}
