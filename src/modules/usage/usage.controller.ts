import { Controller, Get } from '@nestjs/common';
import { UsageService } from './usage.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtPayload } from '../../common/guards/jwt-auth.guard';

@Controller('usage')
export class UsageController {
  constructor(private readonly usageService: UsageService) {}

  @Get()
  async getUsage(@CurrentUser() user: JwtPayload) {
    const stats = await this.usageService.getStats(user.userId);
    return { success: true, data: stats };
  }
}
