import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class BillingService {
  constructor(private readonly prisma: PrismaService) {}

  async listOrders(userId: string) {
    return this.prisma.billingOrder.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }
}
