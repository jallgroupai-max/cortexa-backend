import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import jwt from 'jsonwebtoken';
import { env } from '../../config/env';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

export interface JwtPayload {
  userId: string;
  email: string;
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest();
    const header = request.headers.authorization as string | undefined;

    if (!header?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Token de autenticación requerido');
    }

    const token = header.slice(7);
    try {
      const payload = jwt.verify(token, env.JWT_SECRET) as JwtPayload;
      request.user = payload;
      return true;
    } catch {
      throw new UnauthorizedException('Token inválido o expirado');
    }
  }
}
