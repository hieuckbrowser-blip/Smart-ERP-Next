import { Module } from '@nestjs/common';
import { MRPController } from './mrp.controller';
import { MRPService } from './mrp.service';

@Module({
  controllers: [MRPController],
  providers: [MRPService],
  exports: [MRPService],
})
export class MRPModule {}