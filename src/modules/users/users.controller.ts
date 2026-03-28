import { Controller, Get, Put, Body } from '@nestjs/common';
import { UsersService } from './users.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtPayload } from '../../common/guards/jwt-auth.guard';
import { UpdateProfileInput } from './users.schema';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('profile')
  async getProfile(@CurrentUser() user: JwtPayload) {
    const profile = await this.usersService.getProfile(user.userId);
    return { success: true, data: profile };
  }

  @Put('profile')
  async updateProfile(@CurrentUser() user: JwtPayload, @Body() body: UpdateProfileInput) {
    const profile = await this.usersService.updateProfile(user.userId, body);
    return { success: true, data: profile, message: 'Perfil actualizado exitosamente' };
  }
}
