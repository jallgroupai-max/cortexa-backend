import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { getPaginationArgs } from '../../common/pagination';

export interface ConversationListParams {
  page?: number;
  limit?: number;
  search?: string;
  agentId?: string;
  status?: string;
}

@Injectable()
export class ConversationsService {
  constructor(private readonly prisma: PrismaService) {}

  /** Create a new conversation or return existing one by id */
  async findOrCreate(
    agentId: string,
    conversationId?: string,
    visitorName?: string,
    visitorEmail?: string,
    visitorId?: string,
    contactData?: Record<string, string>,
    channel = 'web',
  ) {
    if (conversationId) {
      const existing = await this.prisma.conversation.findUnique({
        where: { id: conversationId },
      });
      if (existing && existing.agentId === agentId) return existing;
    }
    return this.prisma.conversation.create({
      data: {
        agentId,
        visitorName:  visitorName  ?? 'Visitante',
        visitorEmail: visitorEmail ?? null,
        visitorId:    visitorId    ?? null,
        contactData:  contactData  ?? undefined,
        channel,
      },
    });
  }

  /** Persist the user message and assistant reply */
  async saveExchange(
    conversationId: string,
    userContent: string,
    assistantContent: string,
    tokensUsed: number,
  ) {
    await this.prisma.$transaction([
      this.prisma.message.create({
        data: { conversationId, role: 'user', content: userContent },
      }),
      this.prisma.message.create({
        data: { conversationId, role: 'assistant', content: assistantContent, tokensUsed },
      }),
      this.prisma.conversation.update({
        where: { id: conversationId },
        data: { updatedAt: new Date() },
      }),
    ]);
  }

  /** List conversations across all agents owned by the user */
  async listForUser(userId: string, params: ConversationListParams) {
    const page  = params.page  ?? 1;
    const limit = params.limit ?? 20;
    const skip  = (page - 1) * limit;

    const where: any = {
      agent: { userId },
    };
    if (params.agentId) where.agentId = params.agentId;
    if (params.status)  where.status  = params.status;
    if (params.search)  where.visitorName = { contains: params.search, mode: 'insensitive' };

    const [rawConversations, total] = await this.prisma.$transaction([
      this.prisma.conversation.findMany({
        where,
        skip,
        take: limit,
        orderBy: { updatedAt: 'desc' },
        include: {
          agent: { select: { id: true, name: true, color: true } },
          messages: {
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
          _count: { select: { messages: true } },
        },
      }),
      this.prisma.conversation.count({ where }),
    ]);

    const conversations = rawConversations.map((c) => ({
      id: c.id,
      visitorName: c.visitorName,
      visitorId: c.visitorId,
      channel: c.channel,
      status: c.status,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
      agent: c.agent,
      lastMessage: c.messages[0] ?? null,
      messageCount: c._count.messages,
    }));

    return { conversations, total, page, limit };
  }

  /** Get full conversation with all messages */
  async getWithMessages(userId: string, conversationId: string) {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        agent: { select: { id: true, name: true, color: true, userId: true } },
        messages: { orderBy: { createdAt: 'asc' } },
        _count: { select: { messages: true } },
      },
    });

    if (!conversation) throw new NotFoundException('Conversación no encontrada');
    if (conversation.agent.userId !== userId) throw new ForbiddenException();

    return conversation;
  }

  /** Update conversation status */
  async updateStatus(userId: string, conversationId: string, status: string) {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      include: { agent: { select: { userId: true } } },
    });
    if (!conversation) throw new NotFoundException('Conversación no encontrada');
    if (conversation.agent.userId !== userId) throw new ForbiddenException();

    return this.prisma.conversation.update({
      where: { id: conversationId },
      data: { status },
    });
  }

  /** Save a manual assistant message (human-agent reply) */
  async addManualMessage(userId: string, conversationId: string, content: string) {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      include: { agent: { select: { userId: true } } },
    });
    if (!conversation) throw new NotFoundException('Conversación no encontrada');
    if (conversation.agent.userId !== userId) throw new ForbiddenException();

    const [message] = await this.prisma.$transaction([
      this.prisma.message.create({
        data: { conversationId, role: 'assistant', content },
      }),
      this.prisma.conversation.update({
        where: { id: conversationId },
        data: { updatedAt: new Date() },
      }),
    ]);
    return message;
  }

  /** Delete a conversation */
  async delete(userId: string, conversationId: string) {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      include: { agent: { select: { userId: true } } },
    });
    if (!conversation) throw new NotFoundException('Conversación no encontrada');
    if (conversation.agent.userId !== userId) throw new ForbiddenException();

    await this.prisma.conversation.delete({ where: { id: conversationId } });
  }
}
