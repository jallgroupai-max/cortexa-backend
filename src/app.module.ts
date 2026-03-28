import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { AgentsModule } from './modules/agents/agents.module';
import { WorkflowsModule } from './modules/workflows/workflows.module';
import { WorkspacesModule } from './modules/workspaces/workspaces.module';
import { BillingModule } from './modules/billing/billing.module';
import { KnowledgeSourcesModule } from './modules/knowledge-sources/knowledge-sources.module';
import { UsageModule } from './modules/usage/usage.module';
import { ConversationsModule } from './modules/conversations/conversations.module';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    UsersModule,
    AgentsModule,
    WorkflowsModule,
    WorkspacesModule,
    BillingModule,
    KnowledgeSourcesModule,
    UsageModule,
    ConversationsModule,
  ],
  controllers: [AppController],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}
