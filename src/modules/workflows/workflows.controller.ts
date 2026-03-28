import { Controller, Get, Post, Put, Delete, Param, Body, Query, HttpCode, HttpStatus } from '@nestjs/common';
import { WorkflowsService } from './workflows.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtPayload } from '../../common/guards/jwt-auth.guard';
import { paginationSchema, buildPaginatedResponse } from '../../common/pagination';
import { CreateWorkflowInput, UpdateWorkflowInput } from './workflows.schema';

@Controller('workflows')
export class WorkflowsController {
  constructor(private readonly workflowsService: WorkflowsService) {}

  @Get()
  async list(@CurrentUser() user: JwtPayload, @Query() query: Record<string, string>) {
    const params = paginationSchema.parse(query);
    const { workflows, total } = await this.workflowsService.listWorkflows(user.userId, params);
    return buildPaginatedResponse(workflows, total, params.page, params.limit);
  }

  @Get(':id')
  async getById(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    const workflow = await this.workflowsService.getWorkflow(user.userId, id);
    return { success: true, data: workflow };
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@CurrentUser() user: JwtPayload, @Body() body: CreateWorkflowInput) {
    const workflow = await this.workflowsService.createWorkflow(user.userId, body);
    return { success: true, data: workflow, message: 'Workflow creado exitosamente' };
  }

  @Put(':id')
  async update(@CurrentUser() user: JwtPayload, @Param('id') id: string, @Body() body: UpdateWorkflowInput) {
    const workflow = await this.workflowsService.updateWorkflow(user.userId, id, body);
    return { success: true, data: workflow, message: 'Workflow actualizado exitosamente' };
  }

  @Delete(':id')
  async remove(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    await this.workflowsService.deleteWorkflow(user.userId, id);
    return { success: true, message: 'Workflow eliminado exitosamente' };
  }

  @Post(':id/duplicate')
  @HttpCode(HttpStatus.CREATED)
  async duplicate(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    const workflow = await this.workflowsService.duplicateWorkflow(user.userId, id);
    return { success: true, data: workflow, message: 'Workflow duplicado exitosamente' };
  }
}
