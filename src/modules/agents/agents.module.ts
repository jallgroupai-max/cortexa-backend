import { Module } from '@nestjs/common';
import { AgentsController } from './agents.controller';
import { AgentsService } from './agents.service';
import { UsageModule } from '../usage/usage.module';
import { ConversationsModule } from '../conversations/conversations.module';

@Module({
  imports: [UsageModule, ConversationsModule],
  controllers: [AgentsController],
  providers: [AgentsService],
})
export class AgentsModule {}
