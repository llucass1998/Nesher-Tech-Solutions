import { UseGuards, SetMetadata } from '@nestjs/common';
import { AuthGuard, PermissionsGuard } from '../../shared/guards/auth.guard';
import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { CreateUserDto } from '../auth/dto';
import { DirectoryService } from './directory.service';

@Controller('api/v1')
@UseGuards(AuthGuard, PermissionsGuard)
@SetMetadata('permissions', ['identity.admin'])
export class DirectoryController {
  constructor(private readonly directoryService: DirectoryService) {}

  @Get('users')
  users() {
    return this.directoryService.users();
  }

  @Post('users/import-reference')
  importReference(@Body() body: { system: string; legacyUserId: string; identityUserId: string }) {
    return this.directoryService.importReference(body);
  }

  @Get('users/:id')
  user(@Param('id') id: string) {
    return this.directoryService.user(id);
  }

  @Patch('users/:id')
  updateUser(@Param('id') id: string, @Body() body: Partial<CreateUserDto>) {
    return this.directoryService.updateUser(id, body);
  }

  @Patch('users/:id/status')
  updateStatus(@Param('id') id: string, @Body() body: { status: 'ACTIVE' | 'INACTIVE' | 'BLOCKED' | 'PENDING' }) {
    return this.directoryService.updateStatus(id, body.status);
  }

  @Delete('users/:id')
  deleteUser(@Param('id') id: string) {
    return this.directoryService.updateStatus(id, 'INACTIVE');
  }

  @Get('roles')
  roles() {
    return this.directoryService.roles();
  }

  @Post('roles')
  createRole(@Body() body: { key: string; name?: string; description?: string }) {
    return this.directoryService.createRole(body);
  }

  @Patch('roles/:id')
  updateRole(@Param('id') id: string, @Body() body: { name?: string; description?: string }) {
    return this.directoryService.updateRole(id, body);
  }

  @Get('permissions')
  permissions() {
    return this.directoryService.permissions();
  }

  @Get('applications')
  applications() {
    return this.directoryService.applications();
  }

  @Post('applications')
  createApplication(@Body() body: { key: string; name?: string; audience?: string }) {
    return this.directoryService.createApplication(body);
  }
}
