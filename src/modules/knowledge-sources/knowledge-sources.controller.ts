import {
  Controller, Get, Post, Patch, Delete, Param, Body, Res,
  UseInterceptors, UploadedFile, UploadedFiles, HttpCode, HttpStatus,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { KnowledgeSourcesService } from './knowledge-sources.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtPayload } from '../../common/guards/jwt-auth.guard';
import { ValidationError } from '../../common/errors/app.error';
import { multerOptions } from '../../config/upload';

@Controller('knowledge-sources')
export class KnowledgeSourcesController {
  constructor(private readonly ksService: KnowledgeSourcesService) {}

  @Get('agent/:agentId')
  async listByAgent(@CurrentUser() user: JwtPayload, @Param('agentId') agentId: string) {
    const sources = await this.ksService.listByAgent(user.userId, agentId);
    return { success: true, data: sources };
  }

  @Post('upload')
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(FileInterceptor('file', multerOptions))
  async upload(
    @CurrentUser() user: JwtPayload,
    @Body() body: { agentId: string },
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!body.agentId) throw new ValidationError('agentId es requerido');
    if (!file) throw new ValidationError('Archivo requerido');
    const source = await this.ksService.createFromUpload(user.userId, body.agentId, file);
    return { success: true, data: source, message: 'Archivo subido exitosamente' };
  }

  @Post('upload-batch')
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(FilesInterceptor('files', 10, multerOptions))
  async uploadBatch(
    @CurrentUser() user: JwtPayload,
    @Body() body: { agentId: string },
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    if (!body.agentId) throw new ValidationError('agentId es requerido');
    if (!files || files.length === 0) throw new ValidationError('Al menos un archivo es requerido');
    const sources = await this.ksService.createBatchFromUpload(user.userId, body.agentId, files);
    return { success: true, data: sources, message: 'Archivos subidos exitosamente' };
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@CurrentUser() user: JwtPayload, @Body() body: { agentId: string; fileName: string; fileType: string; status?: string }) {
    const source = await this.ksService.createSource(user.userId, body);
    return { success: true, data: source, message: 'Fuente de conocimiento creada' };
  }

  @Post('batch')
  @HttpCode(HttpStatus.CREATED)
  async createBatch(@CurrentUser() user: JwtPayload, @Body() body: { agentId: string; files: { fileName: string; fileType: string }[] }) {
    const sources = await this.ksService.createBatch(user.userId, body.agentId, body.files);
    return { success: true, data: sources, message: 'Fuentes de conocimiento creadas' };
  }

  @Get(':id/download')
  async download(@CurrentUser() user: JwtPayload, @Param('id') id: string, @Res() res: Response) {
    const { filePath, originalName } = await this.ksService.getSourceForDownload(user.userId, id);
    res.download(filePath, originalName);
  }

  @Patch(':id/status')
  async updateStatus(@CurrentUser() user: JwtPayload, @Param('id') id: string, @Body() body: { status: string }) {
    const source = await this.ksService.updateStatus(user.userId, id, body.status);
    return { success: true, data: source, message: 'Estado actualizado' };
  }

  @Delete(':id')
  async remove(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    await this.ksService.deleteSource(user.userId, id);
    return { success: true, message: 'Fuente de conocimiento eliminada' };
  }
}
