import { Controller, Get, Post, Patch, Body, Param, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { EContractsService } from './e-contracts.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@ApiTags('E-Contracts')
@Controller('e-contracts')
@UseGuards(JwtAuthGuard)
export class EContractsController {
  constructor(private readonly service: EContractsService) {}

  @ApiOperation({ summary: 'List all digital contracts' })
  @Get()
  getContracts(@Request() req: any) {
    return this.service.getContracts(req.user.tenantId);
  }

  @ApiOperation({ summary: 'Create a new e-contract' })
  @Post()
  createContract(@Request() req: any, @Body() body: any) {
    return this.service.createContract(req.user.tenantId, body);
  }

  @ApiOperation({ summary: 'Digitally sign a contract' })
  @Patch(':id/sign')
  signContract(@Request() req: any, @Param('id') id: string, @Body() body: any) {
    return this.service.signContract(req.user.tenantId, id, body);
  }
}
