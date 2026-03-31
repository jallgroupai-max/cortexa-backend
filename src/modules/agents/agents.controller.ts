import { Controller, Get, Post, Put, Delete, Param, Body, Query, HttpCode, HttpStatus, BadRequestException, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AgentsService } from './agents.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtPayload } from '../../common/guards/jwt-auth.guard';
import { paginationSchema, buildPaginatedResponse } from '../../common/pagination';
import { CreateAgentInput, UpdateAgentInput } from './agents.schema';
import { multerOptions } from '../../config/upload';
import path from 'path';
import fs from 'fs';

@Controller('agents')
export class AgentsController {
  constructor(private readonly agentsService: AgentsService) {}

  @Get()
  async list(@CurrentUser() user: JwtPayload, @Query() query: Record<string, string>) {
    const params = paginationSchema.parse(query);
    const { agents, total } = await this.agentsService.listAgents(user.userId, params);
    return buildPaginatedResponse(agents, total, params.page, params.limit);
  }

  @Get(':id')
  async getById(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    const agent = await this.agentsService.getAgent(user.userId, id);
    return { success: true, data: agent };
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@CurrentUser() user: JwtPayload, @Body() body: CreateAgentInput) {
    const agent = await this.agentsService.createAgent(user.userId, body);
    return { success: true, data: agent, message: 'Agente creado exitosamente' };
  }

  @Put(':id')
  async update(@CurrentUser() user: JwtPayload, @Param('id') id: string, @Body() body: UpdateAgentInput) {
    const agent = await this.agentsService.updateAgent(user.userId, id, body);
    return { success: true, data: agent, message: 'Agente actualizado exitosamente' };
  }

  @Delete(':id')
  async remove(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    await this.agentsService.deleteAgent(user.userId, id);
    return { success: true, message: 'Agente eliminado exitosamente' };
  }

  @Post('analyze-document')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(FileInterceptor('file', multerOptions))
  async analyzeDocument(
    @CurrentUser() user: JwtPayload,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) throw new BadRequestException('Archivo requerido');
    const ext = path.extname(file.originalname).replace('.', '').toLowerCase();
    const suggestions = await this.agentsService.analyzeDocument(user.userId, file.path, ext);
    try { fs.unlinkSync(file.path); } catch { /* ignore */ }
    return { success: true, data: suggestions };
  }

  @Post(':id/chat')
  async chat(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() body: {
      messages: { role: string; content: string }[];
      conversationId?: string;
      visitorName?: string;
      visitorId?: string;
      channel?: string;
    },
  ) {
    const agent = await this.agentsService.getAgent(user.userId, id);
    if (!Array.isArray(body.messages) || body.messages.length === 0) {
      throw new BadRequestException('messages es requerido');
    }
    const { reply, conversationId } = await this.agentsService.chatWithAgent(
      user.userId,
      agent,
      body.messages,
      {
        conversationId: body.conversationId,
        visitorName:    body.visitorName,
        visitorId:      body.visitorId,
        channel:        body.channel,
      },
    );
    return { success: true, data: { reply, conversationId } };
  }
}
