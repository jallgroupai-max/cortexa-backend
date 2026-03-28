import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { getPlan } from '../../config/plans';
import type { UserUsage } from '@prisma/client';

@Injectable()
export class UsageService {
  constructor(private readonly prisma: PrismaService) {}

  estimateTokens(text: string): number {
    return Math.ceil(text.length / 4);
  }

  async getOrCreate(userId: string): Promise<UserUsage> {
    const existing = await this.prisma.userUsage.findUnique({ where: { userId } });
    if (existing) return existing;
    return this.prisma.userUsage.create({ data: { userId } });
  }

  private needsDayReset(usage: UserUsage): boolean {
    return new Date().toDateString() !== new Date(usage.lastResetDay).toDateString();
  }

  private needsMonthReset(usage: UserUsage): boolean {
    const now = new Date();
    const last = new Date(usage.lastResetMonth);
    return now.getFullYear() !== last.getFullYear() || now.getMonth() !== last.getMonth();
  }

  async applyResets(usage: UserUsage): Promise<UserUsage> {
    const updates: any = {};
    const now = new Date();

    if (this.needsDayReset(usage)) {
      updates.tokensUsedDay = 0;
      updates.requestsToday = 0;
      updates.lastResetDay = now;
    }
    if (this.needsMonthReset(usage)) {
      updates.tokensUsedMonth = 0;
      updates.lastResetMonth = now;
    }

    if (Object.keys(updates).length === 0) return usage;

    return this.prisma.userUsage.update({
      where: { userId: usage.userId },
      data: updates,
    });
  }

  async validate(userId: string, plan: string, inputText: string): Promise<number> {
    const planConfig = getPlan(plan);
    const inputTokens = this.estimateTokens(inputText);

    if (inputTokens > planConfig.maxInputTokens) {
      throw new HttpException(
        `Tu plan ${plan} permite máximo ${planConfig.maxInputTokens.toLocaleString()} tokens de entrada. Tu mensaje tiene ~${inputTokens.toLocaleString()} tokens.`,
        HttpStatus.PAYLOAD_TOO_LARGE,
      );
    }

    let usage = await this.getOrCreate(userId);
    usage = await this.applyResets(usage);

    if (usage.tokensUsedDay + inputTokens > planConfig.dailyTokens) {
      throw new HttpException(
        `Límite diario alcanzado para el plan ${plan}. Límite: ${planConfig.dailyTokens.toLocaleString()} tokens/día. Vuelve mañana o mejora tu plan.`,
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    if (usage.tokensUsedMonth + inputTokens > planConfig.monthlyTokens) {
      throw new HttpException(
        `Límite mensual alcanzado para el plan ${plan}. Límite: ${planConfig.monthlyTokens.toLocaleString()} tokens/mes. Mejora tu plan para continuar.`,
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    return inputTokens;
  }

  async record(userId: string, inputTokens: number, outputTokens: number): Promise<void> {
    const total = inputTokens + outputTokens;
    await this.prisma.userUsage.update({
      where: { userId },
      data: {
        tokensUsedDay: { increment: total },
        tokensUsedMonth: { increment: total },
        requestsToday: { increment: 1 },
      },
    });
  }

  async getStats(userId: string) {
    const dbUser = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { plan: true },
    });
    const plan = dbUser?.plan ?? 'Free';
    const planConfig = getPlan(plan);

    let usage = await this.getOrCreate(userId);
    usage = await this.applyResets(usage);

    return {
      plan,
      limits: {
        dailyTokens: planConfig.dailyTokens,
        monthlyTokens: planConfig.monthlyTokens,
        maxInputTokens: planConfig.maxInputTokens,
        maxOutputTokens: planConfig.maxOutputTokens,
        requestsPerMinute: planConfig.requestsPerMinute,
      },
      used: {
        tokensToday: usage.tokensUsedDay,
        tokensThisMonth: usage.tokensUsedMonth,
        requestsToday: usage.requestsToday,
      },
      percentages: {
        daily: Math.min(100, Math.round((usage.tokensUsedDay / planConfig.dailyTokens) * 100)),
        monthly: Math.min(100, Math.round((usage.tokensUsedMonth / planConfig.monthlyTokens) * 100)),
      },
    };
  }
}
