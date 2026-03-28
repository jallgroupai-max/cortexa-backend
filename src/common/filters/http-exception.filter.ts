import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';
import multer from 'multer';
import { AppError } from '../errors/app.error';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    this.logger.error(exception instanceof Error ? `${exception.constructor.name}: ${exception.message}` : exception);

    // AppError (custom errors)
    if (exception instanceof AppError) {
      return response.status(exception.statusCode).json({
        success: false,
        error: {
          code: exception.code,
          message: exception.message,
          ...(exception.name === 'ValidationError' && { details: (exception as any).details }),
        },
      });
    }

    // NestJS HttpException
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      return response.status(status).json({
        success: false,
        error: {
          code: 'HTTP_ERROR',
          message: typeof exceptionResponse === 'string'
            ? exceptionResponse
            : (exceptionResponse as any).message || exception.message,
        },
      });
    }

    // Multer errors
    if (exception instanceof multer.MulterError) {
      const messages: Record<string, string> = {
        LIMIT_FILE_SIZE: 'El archivo excede el tamaño máximo permitido (20MB)',
        LIMIT_FILE_COUNT: 'Se excedió el número máximo de archivos',
        LIMIT_UNEXPECTED_FILE: 'Campo de archivo inesperado',
      };
      return response.status(400).json({
        success: false,
        error: {
          code: 'FILE_UPLOAD_ERROR',
          message: messages[exception.code] || exception.message,
        },
      });
    }

    // Multer fileFilter errors
    if (exception instanceof Error && exception.message?.includes('Tipo de archivo no permitido')) {
      return response.status(400).json({
        success: false,
        error: { code: 'INVALID_FILE_TYPE', message: exception.message },
      });
    }

    // Prisma known errors
    if ((exception as any)?.code === 'P2002') {
      return response.status(409).json({
        success: false,
        error: { code: 'CONFLICT', message: 'El recurso ya existe' },
      });
    }

    if ((exception as any)?.code === 'P2025') {
      return response.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Recurso no encontrado' },
      });
    }

    return response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Error interno del servidor' },
    });
  }
}
