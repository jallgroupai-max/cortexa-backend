import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AgentsService } from '../agents/agents.service';

@Injectable()
export class PublicService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly agentsService: AgentsService,
  ) {}

  /** Return agent public config (no auth) */
  async getAgentPublic(agentId: string) {
    const agent = await this.prisma.agent.findUnique({
      where: { id: agentId },
      select: {
        id: true,
        name: true,
        description: true,
        tone: true,
        color: true,
        welcomeMessage: true,
        contactFields: true,
      },
    });
    if (!agent) throw new NotFoundException('Agente no encontrado');
    return agent;
  }

  /** Public chat — uses the agent owner's userId for usage tracking */
  async chatPublic(
    agentId: string,
    messages: { role: string; content: string }[],
    opts: {
      conversationId?: string;
      visitorName?: string;
      visitorEmail?: string;
      visitorId?: string;
      contactData?: Record<string, string>;
    },
  ) {
    const agent = await this.prisma.agent.findUnique({
      where: { id: agentId },
      select: { id: true, prompt: true, model: true, userId: true, contactFields: true },
    });
    if (!agent) throw new NotFoundException('Agente no encontrado');
    if (!Array.isArray(messages) || messages.length === 0) {
      throw new BadRequestException('messages es requerido');
    }

    // If contact fields are configured, inject collection instructions into the prompt.
    // Only do this on the very first user message (history length === 1) so the bot
    // asks at the start and never repeats the request in later turns.
    const fields = Array.isArray(agent.contactFields) ? agent.contactFields as any[] : [];
    let effectivePrompt = agent.prompt ?? '';
    if (fields.length > 0 && messages.length === 1) {
      const fieldLines = fields
        .map((f: any) => `- ${f.label}${f.required ? ' (obligatorio)' : ' (opcional)'}`)
        .join('\n');
      const collectInstruction = [
        '\n\n--- INSTRUCCIÓN DE RECOPILACIÓN DE DATOS ---',
        'Antes de responder cualquier consulta, pide amablemente los siguientes datos al usuario:',
        fieldLines,
        'Una vez que el usuario proporcione la información requerida (los opcionales puede omitirlos),',
        'continúa la conversación normalmente y NO vuelvas a pedirlos.',
        '--- FIN DE INSTRUCCIÓN ---',
      ].join('\n');
      effectivePrompt = effectivePrompt + collectInstruction;
    }

    const { reply, conversationId } = await this.agentsService.chatWithAgent(
      agent.userId,
      { ...agent, prompt: effectivePrompt },
      messages,
      {
        conversationId:  opts.conversationId,
        visitorName:     opts.visitorName,
        visitorEmail:    opts.visitorEmail,
        visitorId:       opts.visitorId,
        contactData:     opts.contactData,
        channel:         'widget',
      },
    );
    return { reply, conversationId };
  }

  /** Visitor conversation history */
  async getVisitorHistory(agentId: string, visitorId: string) {
    const agent = await this.prisma.agent.findUnique({ where: { id: agentId }, select: { id: true } });
    if (!agent) throw new NotFoundException('Agente no encontrado');

    const conversations = await this.prisma.conversation.findMany({
      where: { agentId, visitorId },
      orderBy: { updatedAt: 'desc' },
      take: 10,
      include: {
        messages: { orderBy: { createdAt: 'asc' } },
        _count: { select: { messages: true } },
      },
    });
    return conversations;
  }
}
