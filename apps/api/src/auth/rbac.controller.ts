import { Controller, Get, Post, Patch, Delete, Param, Body, Req, UseGuards } from '@nestjs/common';
import { RbacService } from './rbac.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('rbac')
@UseGuards(JwtAuthGuard)
export class RbacController {
  constructor(private readonly rbacService: RbacService) {}

  @Get('permissions')
  getPermissions() {
    return this.rbacService.getPermissions();
  }

  @Get('roles')
  @Roles('admin')
  @UseGuards(RolesGuard)
  async getRoles(@Req() req: any) {
    return this.rbacService.getRoles(req.user.tenantId);
  }

  @Post('roles')
  @Roles('admin')
  @UseGuards(RolesGuard)
  async createRole(@Req() req: any, @Body() body: { name: string; permissions: string[]; description?: string }) {
    return this.rbacService.createRole(req.user.tenantId, body);
  }

  @Patch('roles/:id')
  @Roles('admin')
  @UseGuards(RolesGuard)
  async updateRole(@Req() req: any, @Param('id') id: string, @Body() body: { name?: string; permissions?: string[]; description?: string }) {
    return this.rbacService.updateRole(req.user.tenantId, id, body);
  }

  @Delete('roles/:id')
  @Roles('admin')
  @UseGuards(RolesGuard)
  async deleteRole(@Req() req: any, @Param('id') id: string) {
    return this.rbacService.deleteRole(req.user.tenantId, id);
  }
}
