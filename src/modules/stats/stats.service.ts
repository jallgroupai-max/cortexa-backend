import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class StatsService {
  constructor(private readonly prisma: PrismaService) {}

  async getDashboardStats(userId: string) {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [
      totalAgents,
      activeConversations,
      messagesThisMonth,
      topAgentsRaw,
      recentConversationsRaw,
      messagesPerDayRaw,
    ] = await Promise.all([
      this.prisma.agent.count({ where: { userId } }),

      this.prisma.conversation.count({
        where: { agent: { userId }, status: 'open' },
      }),

      this.prisma.message.count({
        where: {
          conversation: { agent: { userId } },
          createdAt: { gte: startOfMonth },
        },
      }),

      this.prisma.agent.findMany({
        where: { userId },
        select: {
          id: true, name: true, color: true,
          _count: { select: { conversations: true } },
        },
        orderBy: { conversations: { _count: 'desc' } },
        take: 5,
      }),

      this.prisma.conversation.findMany({
        where: { agent: { userId } },
        orderBy: { updatedAt: 'desc' },
        take: 5,
        include: {
          agent: { select: { id: true, name: true, color: true } },
          messages: { orderBy: { createdAt: 'desc' }, take: 1 },
          _count: { select: { messages: true } },
        },
      }),

      this.prisma.$queryRaw<{ day: Date; count: bigint }[]>`
        SELECT DATE_TRUNC('day', m.created_at) AS day, COUNT(*) AS count
        FROM messages m
        JOIN conversations c ON c.id = m.conversation_id
        JOIN agents a ON a.id = c.agent_id
        WHERE a.user_id = ${userId}::uuid
          AND m.created_at >= ${thirtyDaysAgo}
        GROUP BY DATE_TRUNC('day', m.created_at)
        ORDER BY day ASC
      `,
    ]);

    // Build 30-day array filling gaps with 0
    const dayMap = new Map<string, number>();
    for (const row of messagesPerDayRaw) {
      dayMap.set(row.day.toISOString().slice(0, 10), Number(row.count));
    }
    const messagesPerDay = Array.from({ length: 30 }, (_, i) => {
      const d = new Date(now.getTime() - (29 - i) * 24 * 60 * 60 * 1000);
      const key = d.toISOString().slice(0, 10);
      return { date: key, messages: dayMap.get(key) ?? 0 };
    });

    const topAgents = topAgentsRaw.map((a) => ({
      id: a.id, name: a.name, color: a.color,
      conversations: a._count.conversations,
    }));

    const recentConversations = recentConversationsRaw.map((c) => ({
      id: c.id,
      visitorName:  c.visitorName,
      visitorEmail: (c as any).visitorEmail ?? null,
      status: c.status,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
      agent: c.agent,
      lastMessage: c.messages[0] ?? null,
      messageCount: c._count.messages,
    }));

    return { totalAgents, activeConversations, messagesThisMonth, messagesPerDay, topAgents, recentConversations };
  }

  async getVisitors(userId: string, page = 1, limit = 20, search?: string) {
    const skip = (page - 1) * limit;

    type RawVisitor = {
      visitor_id: string | null;
      visitor_name: string;
      visitor_email: string | null;
      total_chats: bigint;
      last_seen: Date;
      agent_names: string;
    };

    let raw: RawVisitor[];
    let countRaw: { total: bigint }[];

    if (search) {
      const like = `%${search}%`;
      raw = await this.prisma.$queryRaw<RawVisitor[]>`
        SELECT
          COALESCE(c.visitor_id, c.id::text) AS visitor_id,
          MAX(c.visitor_name) AS visitor_name,
          MAX(c.visitor_email) AS visitor_email,
          COUNT(DISTINCT c.id) AS total_chats,
          MAX(c.updated_at) AS last_seen,
          STRING_AGG(DISTINCT a.name, ', ') AS agent_names
        FROM conversations c
        JOIN agents a ON a.id = c.agent_id
        WHERE a.user_id = ${userId}::uuid
          AND (c.visitor_name ILIKE ${like} OR c.visitor_email ILIKE ${like})
        GROUP BY COALESCE(c.visitor_id, c.id::text)
        ORDER BY last_seen DESC
        LIMIT ${limit} OFFSET ${skip}
      `;
      countRaw = await this.prisma.$queryRaw<{ total: bigint }[]>`
        SELECT COUNT(DISTINCT COALESCE(c.visitor_id, c.id::text)) AS total
        FROM conversations c
        JOIN agents a ON a.id = c.agent_id
        WHERE a.user_id = ${userId}::uuid
          AND (c.visitor_name ILIKE ${like} OR c.visitor_email ILIKE ${like})
      `;
    } else {
      raw = await this.prisma.$queryRaw<RawVisitor[]>`
        SELECT
          COALESCE(c.visitor_id, c.id::text) AS visitor_id,
          MAX(c.visitor_name) AS visitor_name,
          MAX(c.visitor_email) AS visitor_email,
          COUNT(DISTINCT c.id) AS total_chats,
          MAX(c.updated_at) AS last_seen,
          STRING_AGG(DISTINCT a.name, ', ') AS agent_names
        FROM conversations c
        JOIN agents a ON a.id = c.agent_id
        WHERE a.user_id = ${userId}::uuid
        GROUP BY COALESCE(c.visitor_id, c.id::text)
        ORDER BY last_seen DESC
        LIMIT ${limit} OFFSET ${skip}
      `;
      countRaw = await this.prisma.$queryRaw<{ total: bigint }[]>`
        SELECT COUNT(DISTINCT COALESCE(c.visitor_id, c.id::text)) AS total
        FROM conversations c
        JOIN agents a ON a.id = c.agent_id
        WHERE a.user_id = ${userId}::uuid
      `;
    }

    const total = Number(countRaw[0]?.total ?? 0);
    const visitors = raw.map((r) => ({
      visitorId:    r.visitor_id,
      visitorName:  r.visitor_name,
      visitorEmail: r.visitor_email,
      totalChats:   Number(r.total_chats),
      lastSeen:     r.last_seen,
      agentNames:   r.agent_names,
    }));

    return { visitors, total, page, limit };
  }
}
