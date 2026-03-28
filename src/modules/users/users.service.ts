import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { NotFoundError } from '../../common/errors/app.error';
import type { UpdateProfileInput } from './users.schema';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async getProfile(userId: string) {
    const profile = await this.prisma.profile.findUnique({
      where: { userId },
      include: { user: { select: { email: true, createdAt: true } } },
    });
    if (!profile) throw new NotFoundError('Perfil');
    return profile;
  }

  async updateProfile(userId: string, input: UpdateProfileInput) {
    return this.prisma.profile.update({
      where: { userId },
      data: {
        displayName:  input.displayName,
        company:      input.company,
        phone:        input.phone,
        address:      input.address,
        bio:          input.bio,
        avatarUrl:    input.avatarUrl,
        coverPreset:  input.coverPreset,
      },
      include: { user: { select: { email: true, createdAt: true } } },
    });
  }
}
