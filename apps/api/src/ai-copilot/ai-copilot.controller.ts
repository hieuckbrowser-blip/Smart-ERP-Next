import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { AiCopilotService } from './ai-copilot.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('AI Copilot')
@Controller('ai-copilot')
@UseGuards(JwtAuthGuard)
export class AiCopilotController {
  constructor(private readonly service: AiCopilotService) {}

  @ApiOperation({ summary: 'Get AI-driven executive business insights' })
  @Get('insights')
  getInsights(@Request() req: any) {
    return this.service.getExecutiveInsights(req.user.tenantId);
  }
}
