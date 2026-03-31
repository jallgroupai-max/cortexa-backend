import { Controller, Get, Post, Param, Body, Query } from '@nestjs/common';
import { Public } from '../../common/decorators/public.decorator';
import { PublicService } from './public.service';

@Public()
@Controller('public')
export class PublicController {
  constructor(private readonly publicService: PublicService) {}

  @Get('agents/:id')
  async getAgent(@Param('id') id: string) {
    const agent = await this.publicService.getAgentPublic(id);
    return { success: true, data: agent };
  }

  @Post('agents/:id/chat')
  async chat(
    @Param('id') id: string,
    @Body() body: {
      messages: { role: string; content: string }[];
      conversationId?: string;
      visitorName?: string;
      visitorEmail?: string;
      visitorId?: string;
      contactData?: Record<string, string>;
    },
  ) {
    const result = await this.publicService.chatPublic(id, body.messages, {
      conversationId: body.conversationId,
      visitorName:    body.visitorName,
      visitorEmail:   body.visitorEmail,
      visitorId:      body.visitorId,
      contactData:    body.contactData,
    });
    return { success: true, data: result };
  }

  @Get('agents/:id/history')
  async history(@Param('id') id: string, @Query('visitorId') visitorId: string) {
    const conversations = await this.publicService.getVisitorHistory(id, visitorId);
    return { success: true, data: conversations };
  }
}
