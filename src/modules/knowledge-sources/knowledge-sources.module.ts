import { Module } from '@nestjs/common';
import { KnowledgeSourcesController } from './knowledge-sources.controller';
import { KnowledgeSourcesService } from './knowledge-sources.service';

@Module({
  controllers: [KnowledgeSourcesController],
  providers: [KnowledgeSourcesService],
})
export class KnowledgeSourcesModule {}
