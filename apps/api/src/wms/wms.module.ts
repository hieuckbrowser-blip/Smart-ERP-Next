import { Module } from '@nestjs/common';
import { WmsService } from './wms.service';
import { WmsController } from './wms.controller';
import { DrizzleModule } from '../drizzle/drizzle.module';

@Module({
  imports: [DrizzleModule],
  controllers: [WmsController],
  providers: [WmsService],
  exports: [WmsService],
})
export class WmsModule {}
