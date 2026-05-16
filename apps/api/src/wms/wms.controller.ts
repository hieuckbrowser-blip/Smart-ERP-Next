import { Controller, Get, Post, Patch, Body, UseGuards, Request, Param, Query } from '@nestjs/common';
import { WmsService } from './wms.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('Warehouse Management (WMS)')
@UseGuards(JwtAuthGuard)
@Controller('wms')
export class WmsController {
  constructor(private readonly wmsService: WmsService) {}

  @ApiOperation({ summary: 'List warehouse tasks' })
  @Get('tasks')
  listTasks(@Request() req: any, @Query('type') type?: string) {
    return this.wmsService.listTasks(req.user.tenantId, type);
  }

  @ApiOperation({ summary: 'Get task details with pick list' })
  @Get('tasks/:id')
  getTaskDetails(@Request() req: any, @Param('id') id: string) {
    return this.wmsService.getTaskDetails(req.user.tenantId, id);
  }

  @ApiOperation({ summary: 'Confirm picking quantity for an item' })
  @Patch('items/:id/pick')
  confirmPick(@Request() req: any, @Param('id') id: string, @Body() body: { quantity: number }) {
    return this.wmsService.confirmPick(req.user.tenantId, id, body.quantity);
  }

  @ApiOperation({ summary: 'Create manual picking task (Internal)' })
  @Post('tasks/pick')
  createPick(@Request() req: any, @Body() body: any) {
    return this.wmsService.createPickingTask(req.user.tenantId, body);
  }
}
