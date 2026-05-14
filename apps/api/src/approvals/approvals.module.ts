import { Module } from '@nestjs/common';
import { DrizzleModule } from '../drizzle/drizzle.module';
import { ApprovalsController } from './approvals.controller';
import { ApprovalsService } from './approvals.service';
import { ApprovalRulesService } from './approval-rules.service';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [DrizzleModule, NotificationsModule],
  controllers: [ApprovalsController],
  providers: [ApprovalsService, ApprovalRulesService],
  exports: [ApprovalsService],
})
export class ApprovalsModule {}
