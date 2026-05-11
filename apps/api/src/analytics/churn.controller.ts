import { Controller, Post, Get, Query, UseGuards } from '@nestjs/common';
import { ChurnPredictionService } from './churn.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';

@Controller('analytics/churn')
@UseGuards(JwtAuthGuard)
export class ChurnController {
  constructor(private readonly churnService: ChurnPredictionService) {}

  @Post('compute')
  async compute(@CurrentUser() user: { tenantId: string; sub: string }) {
    await this.churnService.computeAndStore(user.tenantId);
    return { message: 'Churn prediction completed' };
  }

  @Get('predictions')
  async getPredictions(
    @CurrentUser() user: { tenantId: string },
    @Query('risk') risk?: string,
  ) {
    const predictions = await this.churnService.getLatestPredictions(user.tenantId, risk);
    return predictions;
  }

  @Get('summary')
  async getSummary(@CurrentUser() user: { tenantId: string }) {
    const summary = await this.churnService.getSegmentSummary(user.tenantId);
    return summary;
  }
}
