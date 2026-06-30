import { Module } from '@nestjs/common';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { NotificationsModule } from '../notifications/notifications.module';
import { ActivityModule } from '../modules/activity/activity.module';
import { AnalyticsModule } from '../analytics/analytics.module';

@Module({
  imports: [NotificationsModule, ActivityModule, AnalyticsModule],
  controllers: [OrdersController],
  providers: [OrdersService],
  exports: [OrdersService],
})
export class OrdersModule {}
