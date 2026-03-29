import { Controller, Get, Post, Patch, Delete, Param, Query, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ConversationsService } from './conversations.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtPayload } from '../../common/guards/jwt-auth.guard';

@Controller('conversations')
export class ConversationsController {
  constructor(private readonly conversationsService: ConversationsService) {}

  @Get()
  async list(
    @CurrentUser() user: JwtPayload,
    @Query() query: Record<string, string>,
  ) {
    const params = {
      page:    query.page    ? Number(query.page)    : 1,
      limit:   query.limit   ? Number(query.limit)   : 20,
      search:  query.search  ?? undefined,
      agentId: query.agentId ?? undefined,
      status:  query.status  ?? undefined,
    };
    const result = await this.conversationsService.listForUser(user.userId, params);
    return {
      success: true,
      data: result.conversations,
      pagination: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: Math.ceil(result.total / result.limit),
      },
    };
  }

  @Get(':id')
  async getById(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    const conversation = await this.conversationsService.getWithMessages(user.userId, id);
    return { success: true, data: conversation };
  }

  @Patch(':id/status')
  async updateStatus(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() body: { status: string },
  ) {
    const conversation = await this.conversationsService.updateStatus(user.userId, id, body.status);
    return { success: true, data: conversation };
  }

  @Post(':id/messages')
  async addMessage(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() body: { content: string },
  ) {
    const message = await this.conversationsService.addManualMessage(user.userId, id, body.content);
    return { success: true, data: message };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    await this.conversationsService.delete(user.userId, id);
  }
}
