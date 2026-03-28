import { Controller, Get } from '@nestjs/common';
import { BillingService } from './billing.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtPayload } from '../../common/guards/jwt-auth.guard';

@Controller('billing')
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  @Get('orders')
  async listOrders(@CurrentUser() user: JwtPayload) {
    const orders = await this.billingService.listOrders(user.userId);
    return { success: true, data: orders };
  }
}
