import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { NotFoundError, AuthorizationError } from '../../common/errors/app.error';
import type { CreateWorkspaceInput, UpdateWorkspaceInput, InviteMemberInput, UpdateMemberPermissionsInput } from './workspaces.schema';

@Injectable()
export class WorkspacesService {
  constructor(private readonly prisma: PrismaService) {}

  private async verifyOwner(userId: string, workspaceId: string) {
    const ws = await this.prisma.workspace.findUnique({ where: { id: workspaceId }, select: { ownerId: true } });
    if (!ws) throw new NotFoundError('Workspace');
    if (ws.ownerId !== userId) throw new AuthorizationError();
  }

  async listWorkspaces(userId: string) {
    const owned = await this.prisma.workspace.findMany({ where: { ownerId: userId }, orderBy: { createdAt: 'asc' } });
    const memberships = await this.prisma.workspaceMember.findMany({
      where: { userId, status: 'accepted' },
      select: { workspaceId: true },
    });

    let memberWs: any[] = [];
    if (memberships.length > 0) {
      memberWs = await this.prisma.workspace.findMany({
        where: { id: { in: memberships.map((m) => m.workspaceId) } },
      });
    }

    return [
      ...owned.map((w) => ({ ...w, is_owner: true })),
      ...memberWs.map((w) => ({ ...w, is_owner: false })),
    ];
  }

  async createWorkspace(userId: string, input: CreateWorkspaceInput) {
    return this.prisma.workspace.create({
      data: { name: input.name, icon: input.icon, ownerId: userId },
    });
  }

  async updateWorkspace(userId: string, workspaceId: string, input: UpdateWorkspaceInput) {
    await this.verifyOwner(userId, workspaceId);
    return this.prisma.workspace.update({ where: { id: workspaceId }, data: input });
  }

  async deleteWorkspace(userId: string, workspaceId: string) {
    await this.verifyOwner(userId, workspaceId);
    await this.prisma.workspace.delete({ where: { id: workspaceId } });
  }

  async listMembers(userId: string, workspaceId: string) {
    await this.verifyOwner(userId, workspaceId);
    const members = await this.prisma.workspaceMember.findMany({
      where: { workspaceId },
      include: {
        agentPermissions: { select: { agentId: true } },
        workflowPermissions: { select: { workflowId: true } },
      },
    });

    return members.map((m) => ({
      id: m.id, email: m.email, permission: m.permission, status: m.status,
      userId: m.userId, invitedAt: m.invitedAt,
      agentPermissions: m.agentPermissions.map((ap) => ap.agentId),
      workflowPermissions: m.workflowPermissions.map((wp) => wp.workflowId),
    }));
  }

  async inviteMember(userId: string, workspaceId: string, input: InviteMemberInput) {
    await this.verifyOwner(userId, workspaceId);
    const targetUser = await this.prisma.user.findUnique({ where: { email: input.email } });

    return this.prisma.workspaceMember.create({
      data: {
        workspaceId,
        userId: targetUser?.id ?? '00000000-0000-0000-0000-000000000000',
        email: input.email,
        permission: input.permission,
        status: 'pending',
      },
    });
  }

  async removeMember(userId: string, memberId: string) {
    const member = await this.prisma.workspaceMember.findUnique({
      where: { id: memberId },
      include: { workspace: { select: { ownerId: true } } },
    });
    if (!member) throw new NotFoundError('Miembro');
    if (member.workspace.ownerId !== userId) throw new AuthorizationError();
    await this.prisma.workspaceMember.delete({ where: { id: memberId } });
  }

  async updateMemberPermissions(userId: string, memberId: string, input: UpdateMemberPermissionsInput) {
    const member = await this.prisma.workspaceMember.findUnique({
      where: { id: memberId },
      include: { workspace: { select: { ownerId: true } } },
    });
    if (!member) throw new NotFoundError('Miembro');
    if (member.workspace.ownerId !== userId) throw new AuthorizationError();

    await this.prisma.$transaction([
      this.prisma.memberAgentPermission.deleteMany({ where: { memberId } }),
      this.prisma.memberWorkflowPermission.deleteMany({ where: { memberId } }),
      ...(input.agentIds.length > 0
        ? [this.prisma.memberAgentPermission.createMany({ data: input.agentIds.map((agentId) => ({ memberId, agentId })) })]
        : []),
      ...(input.workflowIds.length > 0
        ? [this.prisma.memberWorkflowPermission.createMany({ data: input.workflowIds.map((workflowId) => ({ memberId, workflowId })) })]
        : []),
    ]);
  }
}
