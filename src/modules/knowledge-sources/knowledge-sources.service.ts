import { Injectable } from '@nestjs/common';
import path from 'path';
import fs from 'fs';
import { PrismaService } from '../../prisma/prisma.service';
import { NotFoundError, AuthorizationError } from '../../common/errors/app.error';
import { UPLOADS_DIR } from '../../config/upload';

@Injectable()
export class KnowledgeSourcesService {
  constructor(private readonly prisma: PrismaService) {}

  private async verifyAgentOwnership(userId: string, agentId: string) {
    const agent = await this.prisma.agent.findUnique({ where: { id: agentId }, select: { userId: true } });
    if (!agent) throw new NotFoundError('Agente');
    if (agent.userId !== userId) throw new AuthorizationError();
  }

  async listByAgent(userId: string, agentId: string) {
    await this.verifyAgentOwnership(userId, agentId);
    return this.prisma.knowledgeSource.findMany({ where: { agentId }, orderBy: { uploadedAt: 'desc' } });
  }

  async createFromUpload(userId: string, agentId: string, file: Express.Multer.File) {
    await this.verifyAgentOwnership(userId, agentId);
    const ext = path.extname(file.originalname).replace('.', '').toLowerCase();
    return this.prisma.knowledgeSource.create({
      data: { agentId, fileName: file.filename, originalName: file.originalname, fileType: ext, fileSize: file.size, status: 'Procesando' },
    });
  }

  async createBatchFromUpload(userId: string, agentId: string, files: Express.Multer.File[]) {
    await this.verifyAgentOwnership(userId, agentId);
    const sources = [];
    for (const file of files) {
      const ext = path.extname(file.originalname).replace('.', '').toLowerCase();
      const source = await this.prisma.knowledgeSource.create({
        data: { agentId, fileName: file.filename, originalName: file.originalname, fileType: ext, fileSize: file.size, status: 'Procesando' },
      });
      sources.push(source);
    }
    return sources;
  }

  async createSource(userId: string, input: { agentId: string; fileName: string; fileType: string; status?: string }) {
    await this.verifyAgentOwnership(userId, input.agentId);
    return this.prisma.knowledgeSource.create({
      data: { agentId: input.agentId, fileName: input.fileName, originalName: input.fileName, fileType: input.fileType, status: input.status ?? 'Procesando' },
    });
  }

  async createBatch(userId: string, agentId: string, files: { fileName: string; fileType: string }[]) {
    await this.verifyAgentOwnership(userId, agentId);
    const sources = [];
    for (const f of files) {
      const source = await this.prisma.knowledgeSource.create({
        data: { agentId, fileName: f.fileName, originalName: f.fileName, fileType: f.fileType, status: 'Procesando' },
      });
      sources.push(source);
    }
    return sources;
  }

  async updateStatus(userId: string, sourceId: string, status: string) {
    const source = await this.prisma.knowledgeSource.findUnique({
      where: { id: sourceId },
      include: { agent: { select: { userId: true } } },
    });
    if (!source) throw new NotFoundError('Fuente de conocimiento');
    if (source.agent.userId !== userId) throw new AuthorizationError();
    return this.prisma.knowledgeSource.update({ where: { id: sourceId }, data: { status } });
  }

  async getSourceForDownload(userId: string, sourceId: string) {
    const source = await this.prisma.knowledgeSource.findUnique({
      where: { id: sourceId },
      include: { agent: { select: { userId: true } } },
    });
    if (!source) throw new NotFoundError('Fuente de conocimiento');
    if (source.agent.userId !== userId) throw new AuthorizationError();

    const filePath = path.join(UPLOADS_DIR, source.fileName);
    if (!fs.existsSync(filePath)) throw new NotFoundError('Archivo físico');
    return { filePath, originalName: source.originalName };
  }

  async deleteSource(userId: string, sourceId: string) {
    const source = await this.prisma.knowledgeSource.findUnique({
      where: { id: sourceId },
      include: { agent: { select: { userId: true } } },
    });
    if (!source) throw new NotFoundError('Fuente de conocimiento');
    if (source.agent.userId !== userId) throw new AuthorizationError();

    const filePath = path.join(UPLOADS_DIR, source.fileName);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    await this.prisma.knowledgeSource.delete({ where: { id: sourceId } });
  }
}
