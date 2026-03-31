import { Injectable, ServiceUnavailableException, BadGatewayException } from '@nestjs/common';
import OpenAI, { RateLimitError, AuthenticationError, APIError } from 'openai';
import { PrismaService } from '../../prisma/prisma.service';
import { UsageService } from '../usage/usage.service';
import { ConversationsService } from '../conversations/conversations.service';
import { NotFoundError, AuthorizationError } from '../../common/errors/app.error';
import type { CreateAgentInput, UpdateAgentInput } from './agents.schema';
import { ALLOWED_MODELS, type AllowedModel } from './agents.schema';
import type { PaginationParams } from '../../common/pagination';
import { getPaginationArgs } from '../../common/pagination';
import fs from 'fs';
import path from 'path';

type SdkConfig   = { strategy: 'sdk';   envKey: string; baseURL: string; model: string };
type FetchConfig = { strategy: 'fetch'; envKey: string; url: string;     model: string };
type ModelConfig = SdkConfig | FetchConfig;

const MODEL_CONFIGS: Record<AllowedModel, ModelConfig> = {
  Groq: {
    strategy: 'sdk',
    envKey:  'GROQ_API_KEY',
    baseURL: 'https://api.groq.com/openai/v1',
    model:   'llama-3.3-70b-versatile',
  },
  Gemini: {
    strategy: 'sdk',
    envKey:  'GEMINI_API_KEY',
    baseURL: 'https://generativelanguage.googleapis.com/v1beta/openai/',
    model:   'gemini-2.0-flash',
  },
  DeepSeek: {
    strategy: 'sdk',
    envKey:  'DEEPSEEK_API_KEY',
    baseURL: 'https://api.deepseek.com',
    model:   'deepseek-chat',
  },
  Kimi: {
    strategy: 'sdk',
    envKey:  'KIMI_API_KEY',
    baseURL: 'https://api.moonshot.ai/v1',
    model:   'kimi-k2.5',
  },
};

@Injectable()
export class AgentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly usageService: UsageService,
    private readonly conversationsService: ConversationsService,
  ) {}

  async listAgents(userId: string, params: PaginationParams) {
    const { skip, take } = getPaginationArgs(params);
    const where: any = { userId };
    if (params.search) {
      where.name = { contains: params.search, mode: 'insensitive' };
    }

    const [agents, total] = await this.prisma.$transaction([
      this.prisma.agent.findMany({
        where, skip, take,
        orderBy: { createdAt: params.sortOrder },
        select: {
          id: true, name: true, description: true, tone: true, color: true,
          welcomeMessage: true, model: true, prompt: true, workspaceId: true,
          createdAt: true, updatedAt: true,
          _count: { select: { knowledgeSources: true } },
        },
      }),
      this.prisma.agent.count({ where }),
    ]);

    return { agents, total };
  }

  async getAgent(userId: string, agentId: string) {
    const agent = await this.prisma.agent.findUnique({
      where: { id: agentId },
      include: { knowledgeSources: { orderBy: { uploadedAt: 'desc' } } },
    });
    if (!agent) throw new NotFoundError('Agente');
    if (agent.userId !== userId) throw new AuthorizationError();
    return agent;
  }

  async createAgent(userId: string, input: CreateAgentInput) {
    return this.prisma.agent.create({
      data: {
        userId,
        name: input.name,
        description: input.description,
        tone: input.tone,
        color: input.color,
        welcomeMessage: input.welcomeMessage,
        prompt: input.prompt,
        model: input.model,
        workspaceId: input.workspaceId,
      },
    });
  }

  async updateAgent(userId: string, agentId: string, input: UpdateAgentInput) {
    const agent = await this.prisma.agent.findUnique({ where: { id: agentId } });
    if (!agent) throw new NotFoundError('Agente');
    if (agent.userId !== userId) throw new AuthorizationError();
    return this.prisma.agent.update({ where: { id: agentId }, data: input });
  }

  async deleteAgent(userId: string, agentId: string) {
    const agent = await this.prisma.agent.findUnique({ where: { id: agentId } });
    if (!agent) throw new NotFoundError('Agente');
    if (agent.userId !== userId) throw new AuthorizationError();
    await this.prisma.agent.delete({ where: { id: agentId } });
  }

  async chatWithAgent(
    userId: string,
    agent: { id: string; prompt: string | null; model: string | null },
    messages: { role: string; content: string }[],
    conversationOptions?: {
      conversationId?: string;
      visitorName?: string;
      visitorEmail?: string;
      visitorId?: string;
      contactData?: Record<string, string>;
      channel?: string;
    },
  ): Promise<{ reply: string; conversationId: string }> {
    const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { plan: true } });
    const plan = user?.plan ?? 'Free';

    const inputText = messages.map((m) => m.content).join('\n');
    const inputTokens = await this.usageService.validate(userId, plan, inputText);

    const modelName = (ALLOWED_MODELS as readonly string[]).includes(agent.model ?? '')
      ? (agent.model as AllowedModel)
      : 'Groq';

    const config = MODEL_CONFIGS[modelName];
    const apiKey = process.env[config.envKey]?.trim();
    if (!apiKey) {
      throw new BadGatewayException(
        `La API key para ${modelName} (${config.envKey}) no está configurada en el servidor.`,
      );
    }

    const systemMessages = [
      { role: 'system' as const, content: agent.prompt ?? 'Eres un asistente de IA útil y amable.' },
      ...(messages as { role: 'user' | 'assistant'; content: string }[]),
    ];

    let reply: string;
    if (config.strategy === 'fetch') {
      reply = await this.chatViaFetch(modelName, config, apiKey, systemMessages);
    } else {
      reply = await this.chatViaSdk(modelName, config, apiKey, systemMessages);
    }

    const outputTokens = this.usageService.estimateTokens(reply);
    await this.usageService.record(userId, inputTokens, outputTokens);

    // Persist conversation
    const lastUserMessage = [...messages].reverse().find((m) => m.role === 'user')?.content ?? '';
    const conversation = await this.conversationsService.findOrCreate(
      agent.id,
      conversationOptions?.conversationId,
      conversationOptions?.visitorName,
      conversationOptions?.visitorEmail,
      conversationOptions?.visitorId,
      conversationOptions?.contactData,
      conversationOptions?.channel ?? 'web',
    );
    await this.conversationsService.saveExchange(
      conversation.id,
      lastUserMessage,
      reply,
      inputTokens + outputTokens,
    );

    return { reply, conversationId: conversation.id };
  }

  async analyzeDocument(userId: string, filePath: string, fileExt: string): Promise<any[]> {
    try {
      const raw = fs.readFileSync(filePath, 'utf-8');
      const truncated = raw.slice(0, 12000);

      const prompt = `Analiza el siguiente documento y genera entre 2 y 4 sugerencias de bots especializados en español.

Documento:
${truncated}

Responde ÚNICAMENTE con un JSON array válido (sin texto adicional, sin markdown). Formato exacto:
[
  {
    "name": "Nombre descriptivo del bot",
    "description": "Propósito del bot en 1-2 oraciones",
    "tone": "amigable",
    "color": "#7C3AED",
    "welcomeMessage": "¡Hola! Soy [nombre] y puedo ayudarte con...",
    "prompt": "Eres un asistente de IA llamado [nombre]. Tu función es [rol]. Solo responde usando la información de tu contexto. Tu tono es [tono]."
  }
]

Tonos válidos: profesional, amigable, técnico, casual. Colores: usa colores variados en hex (#7C3AED, #3B82F6, #10B981, #EC4899, #F59E0B, #6366F1).`;

      // Try Kimi first, fall back to Groq
      const kimiKey = process.env['KIMI_API_KEY']?.trim();
      const configKey: AllowedModel = kimiKey ? 'Kimi' : 'Groq';
      const config = MODEL_CONFIGS[configKey];
      const apiKey = process.env[config.envKey]?.trim();
      if (!apiKey) return [];

      const client = new OpenAI({ apiKey, baseURL: (config as SdkConfig).baseURL });
      const completion = await client.chat.completions.create({
        model: config.model,
        messages: [{ role: 'user', content: prompt }],
      });

      const text = completion.choices[0].message.content ?? '';
      const match = text.match(/\[[\s\S]*\]/);
      if (!match) return [];
      return JSON.parse(match[0]);
    } catch {
      return [];
    }
  }

  private async chatViaSdk(
    modelName: string,
    config: SdkConfig,
    apiKey: string,
    messages: { role: 'system' | 'user' | 'assistant'; content: string }[],
  ): Promise<string> {
    const client = new OpenAI({ apiKey, baseURL: config.baseURL });
    try {
      const completion = await client.chat.completions.create({ model: config.model, messages });
      return completion.choices[0].message.content ?? 'No pude generar una respuesta.';
    } catch (err) {
      if (err instanceof RateLimitError) {
        throw new ServiceUnavailableException(
          `Límite de solicitudes alcanzado para ${modelName}. Espera unos segundos e intenta de nuevo.`,
        );
      }
      if (err instanceof AuthenticationError) {
        throw new BadGatewayException(
          `API key de ${modelName} inválida o sin permisos. Verifica la variable ${config.envKey}.`,
        );
      }
      if (err instanceof APIError) {
        throw new BadGatewayException(`Error del proveedor ${modelName} (${err.status}): ${err.message}`);
      }
      throw err;
    }
  }

  private async chatViaFetch(
    modelName: string,
    config: FetchConfig,
    apiKey: string,
    messages: { role: string; content: string }[],
  ): Promise<string> {
    const res = await fetch(config.url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ model: config.model, messages }),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      if (res.status === 429) {
        throw new ServiceUnavailableException(
          `Límite de solicitudes alcanzado para ${modelName}. Espera unos segundos e intenta de nuevo.`,
        );
      }
      if (res.status === 401) {
        throw new BadGatewayException(
          `API key de ${modelName} inválida o sin permisos. Verifica la variable ${config.envKey}.`,
        );
      }
      throw new BadGatewayException(`Error del proveedor ${modelName} (${res.status}): ${text}`);
    }

    const data = await res.json() as { choices: { message: { content: string } }[] };
    return data.choices[0].message.content ?? 'No pude generar una respuesta.';
  }
}
