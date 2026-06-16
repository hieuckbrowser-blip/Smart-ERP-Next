import { Module } from '@nestjs/common';
import { InsightsController } from './insights.controller';
import { InsightsService } from './insights.service';
import { ForecastModule } from '../forecast/forecast.module';

@Module({
  imports: [ForecastModule],
  controllers: [InsightsController],
  providers: [InsightsService],
})
export class InsightsModule {}
