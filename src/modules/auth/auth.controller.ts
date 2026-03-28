import { Controller, Post, Get, Body } from '@nestjs/common';
import { AuthService } from './auth.service';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtPayload } from '../../common/guards/jwt-auth.guard';
import {
  RegisterInput,
  LoginInput,
  RequestResetInput,
  ResetPasswordInput,
} from './auth.schema';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register')
  register(@Body() body: RegisterInput) {
    return this.authService.register(body);
  }

  @Public()
  @Post('login')
  login(@Body() body: LoginInput) {
    return this.authService.login(body);
  }

  @Public()
  @Post('request-reset')
  requestPasswordReset(@Body() body: RequestResetInput) {
    return this.authService.requestPasswordReset(body);
  }

  @Public()
  @Post('reset-password')
  resetPassword(@Body() body: ResetPasswordInput) {
    return this.authService.resetPassword(body);
  }

  @Get('me')
  getMe(@CurrentUser() user: JwtPayload) {
    return this.authService.getMe(user.userId);
  }
}
