import { Controller, Get, Post, Put, Delete, Param, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { WorkspacesService } from './workspaces.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtPayload } from '../../common/guards/jwt-auth.guard';
import { CreateWorkspaceInput, UpdateWorkspaceInput, InviteMemberInput, UpdateMemberPermissionsInput } from './workspaces.schema';

@Controller('workspaces')
export class WorkspacesController {
  constructor(private readonly workspacesService: WorkspacesService) {}

  @Get()
  async list(@CurrentUser() user: JwtPayload) {
    const workspaces = await this.workspacesService.listWorkspaces(user.userId);
    return { success: true, data: workspaces };
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@CurrentUser() user: JwtPayload, @Body() body: CreateWorkspaceInput) {
    const workspace = await this.workspacesService.createWorkspace(user.userId, body);
    return { success: true, data: workspace, message: 'Workspace creado exitosamente' };
  }

  @Put(':id')
  async update(@CurrentUser() user: JwtPayload, @Param('id') id: string, @Body() body: UpdateWorkspaceInput) {
    const workspace = await this.workspacesService.updateWorkspace(user.userId, id, body);
    return { success: true, data: workspace, message: 'Workspace actualizado exitosamente' };
  }

  @Delete(':id')
  async remove(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    await this.workspacesService.deleteWorkspace(user.userId, id);
    return { success: true, message: 'Workspace eliminado exitosamente' };
  }

  @Get(':id/members')
  async listMembers(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    const members = await this.workspacesService.listMembers(user.userId, id);
    return { success: true, data: members };
  }

  @Post(':id/members')
  @HttpCode(HttpStatus.CREATED)
  async inviteMember(@CurrentUser() user: JwtPayload, @Param('id') id: string, @Body() body: InviteMemberInput) {
    const member = await this.workspacesService.inviteMember(user.userId, id, body);
    return { success: true, data: member, message: 'Invitación enviada exitosamente' };
  }

  @Delete(':id/members/:memberId')
  async removeMember(@CurrentUser() user: JwtPayload, @Param('memberId') memberId: string) {
    await this.workspacesService.removeMember(user.userId, memberId);
    return { success: true, message: 'Miembro eliminado exitosamente' };
  }

  @Put('members/:memberId/permissions')
  async updateMemberPermissions(@CurrentUser() user: JwtPayload, @Param('memberId') memberId: string, @Body() body: UpdateMemberPermissionsInput) {
    await this.workspacesService.updateMemberPermissions(user.userId, memberId, body);
    return { success: true, data: null, message: 'Permisos actualizados exitosamente' };
  }
}
