import { Controller, Get, Query } from '@nestjs/common';
import { StatsService } from './stats.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtPayload } from '../../common/guards/jwt-auth.guard';

@Controller('stats')
export class StatsController {
  constructor(private readonly statsService: StatsService) {}

  @Get()
  async dashboard(@CurrentUser() user: JwtPayload) {
    const data = await this.statsService.getDashboardStats(user.userId);
    return { success: true, data };
  }

  @Get('visitors')
  async visitors(
    @CurrentUser() user: JwtPayload,
    @Query('page')   page?:   string,
    @Query('limit')  limit?:  string,
    @Query('search') search?: string,
  ) {
    const data = await this.statsService.getVisitors(
      user.userId,
      page  ? parseInt(page,  10) : 1,
      limit ? parseInt(limit, 10) : 20,
      search,
    );
    return { success: true, data };
  }
}
