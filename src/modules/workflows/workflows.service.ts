import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { NotFoundError, AuthorizationError } from '../../common/errors/app.error';
import type { CreateWorkflowInput, UpdateWorkflowInput } from './workflows.schema';
import type { PaginationParams } from '../../common/pagination';
import { getPaginationArgs } from '../../common/pagination';

@Injectable()
export class WorkflowsService {
  constructor(private readonly prisma: PrismaService) {}

  async listWorkflows(userId: string, params: PaginationParams) {
    const { skip, take } = getPaginationArgs(params);
    const where: any = { userId };
    if (params.search) {
      where.OR = [
        { name: { contains: params.search, mode: 'insensitive' } },
        { description: { contains: params.search, mode: 'insensitive' } },
      ];
    }

    const [workflows, total] = await this.prisma.$transaction([
      this.prisma.workflow.findMany({
        where, skip, take,
        orderBy: { updatedAt: params.sortOrder },
        select: {
          id: true, name: true, description: true, status: true,
          nodes: true, edges: true, workspaceId: true, createdAt: true, updatedAt: true,
        },
      }),
      this.prisma.workflow.count({ where }),
    ]);

    return { workflows, total };
  }

  async getWorkflow(userId: string, workflowId: string) {
    const workflow = await this.prisma.workflow.findUnique({ where: { id: workflowId } });
    if (!workflow) throw new NotFoundError('Workflow');
    if (workflow.userId !== userId) throw new AuthorizationError();
    return workflow;
  }

  async createWorkflow(userId: string, input: CreateWorkflowInput) {
    return this.prisma.workflow.create({
      data: { userId, name: input.name, description: input.description, workspaceId: input.workspaceId },
    });
  }

  async updateWorkflow(userId: string, workflowId: string, input: UpdateWorkflowInput) {
    const workflow = await this.prisma.workflow.findUnique({ where: { id: workflowId } });
    if (!workflow) throw new NotFoundError('Workflow');
    if (workflow.userId !== userId) throw new AuthorizationError();
    return this.prisma.workflow.update({ where: { id: workflowId }, data: input });
  }

  async deleteWorkflow(userId: string, workflowId: string) {
    const workflow = await this.prisma.workflow.findUnique({ where: { id: workflowId } });
    if (!workflow) throw new NotFoundError('Workflow');
    if (workflow.userId !== userId) throw new AuthorizationError();
    await this.prisma.workflow.delete({ where: { id: workflowId } });
  }

  async duplicateWorkflow(userId: string, workflowId: string) {
    const original = await this.getWorkflow(userId, workflowId);
    return this.prisma.workflow.create({
      data: {
        userId,
        name: `${original.name} (copia)`,
        description: original.description,
        nodes: original.nodes ?? [],
        edges: original.edges ?? [],
        workspaceId: original.workspaceId,
      },
    });
  }
}
