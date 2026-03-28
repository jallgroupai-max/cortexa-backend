import { Injectable } from '@nestjs/common';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaService } from '../../prisma/prisma.service';
import { env } from '../../config/env';
import { AuthenticationError, ConflictError } from '../../common/errors/app.error';
import type { RegisterInput, LoginInput, RequestResetInput, ResetPasswordInput } from './auth.schema';

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService) {}

  private generateToken(userId: string, email: string): string {
    const options: jwt.SignOptions = { expiresIn: env.JWT_EXPIRES_IN as any };
    return jwt.sign({ userId, email }, env.JWT_SECRET, options);
  }

  async register(input: RegisterInput) {
    const existing = await this.prisma.user.findUnique({ where: { email: input.email } });
    if (existing) throw new ConflictError('Ya existe una cuenta con este email');

    const hashedPassword = await bcrypt.hash(input.password, 12);
    const user = await this.prisma.user.create({
      data: {
        email: input.email,
        password: hashedPassword,
        profile: { create: {} },
        usage: { create: {} },
        ownedWorkspaces: { create: { name: 'Mi Proyecto' } },
      },
      select: { id: true, email: true, plan: true, createdAt: true },
    });

    const token = this.generateToken(user.id, user.email);
    return { success: true, data: { user, token }, message: 'Cuenta creada exitosamente' };
  }

  async login(input: LoginInput) {
    const user = await this.prisma.user.findUnique({ where: { email: input.email } });
    if (!user) throw new AuthenticationError('Email o contraseña incorrectos');

    const valid = await bcrypt.compare(input.password, user.password);
    if (!valid) throw new AuthenticationError('Email o contraseña incorrectos');

    const token = this.generateToken(user.id, user.email);
    return {
      success: true,
      data: { user: { id: user.id, email: user.email, plan: user.plan, createdAt: user.createdAt }, token },
      message: 'Inicio de sesión exitoso',
    };
  }

  async requestPasswordReset(input: RequestResetInput) {
    const user = await this.prisma.user.findUnique({ where: { email: input.email } });
    if (!user) return { success: true, data: { message: 'Si el email existe, recibirás un enlace de reseteo' } };

    const resetToken = jwt.sign({ userId: user.id, type: 'reset' }, env.JWT_SECRET, { expiresIn: '1h' });
    console.log(`[PASSWORD RESET] Token for ${input.email}: ${resetToken}`);
    return { success: true, data: { message: 'Si el email existe, recibirás un enlace de reseteo' } };
  }

  async resetPassword(input: ResetPasswordInput) {
    let payload: { userId: string; type: string };
    try {
      payload = jwt.verify(input.token, env.JWT_SECRET) as any;
    } catch {
      throw new AuthenticationError('Token inválido o expirado');
    }
    if (payload.type !== 'reset') throw new AuthenticationError('Token inválido');

    const hashedPassword = await bcrypt.hash(input.password, 12);
    await this.prisma.user.update({ where: { id: payload.userId }, data: { password: hashedPassword } });
    return { success: true, data: { message: 'Contraseña actualizada exitosamente' } };
  }

  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, plan: true, createdAt: true, profile: true },
    });
    return { success: true, data: user };
  }
}
