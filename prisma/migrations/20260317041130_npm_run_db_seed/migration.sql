-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "profiles" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "display_name" TEXT,
    "avatar_url" TEXT,
    "company" TEXT,
    "phone" TEXT,
    "address" TEXT,
    "bio" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workspaces" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "icon" TEXT DEFAULT 'FolderKanban',
    "owner_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "workspaces_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workspace_members" (
    "id" UUID NOT NULL,
    "workspace_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "permission" TEXT NOT NULL DEFAULT 'view',
    "status" TEXT NOT NULL DEFAULT 'pending',
    "invited_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "workspace_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "agents" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "workspace_id" UUID,
    "name" TEXT NOT NULL,
    "prompt" TEXT DEFAULT 'Eres un asistente de IA útil y amable.',
    "model" TEXT DEFAULT 'DeepSeek V3.2',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "agents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "knowledge_sources" (
    "id" UUID NOT NULL,
    "agent_id" UUID NOT NULL,
    "file_name" TEXT NOT NULL,
    "file_type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Procesando',
    "uploaded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "knowledge_sources_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workflows" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "workspace_id" UUID,
    "name" TEXT NOT NULL DEFAULT 'Nuevo Workflow',
    "description" TEXT DEFAULT '',
    "nodes" JSONB NOT NULL DEFAULT '[]',
    "edges" JSONB NOT NULL DEFAULT '[]',
    "status" TEXT NOT NULL DEFAULT 'draft',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "workflows_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "member_agent_permissions" (
    "id" UUID NOT NULL,
    "member_id" UUID NOT NULL,
    "agent_id" UUID NOT NULL,

    CONSTRAINT "member_agent_permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "member_workflow_permissions" (
    "id" UUID NOT NULL,
    "member_id" UUID NOT NULL,
    "workflow_id" UUID NOT NULL,

    CONSTRAINT "member_workflow_permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "billing_orders" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "amount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "status" TEXT NOT NULL DEFAULT 'pending',
    "receipt_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "billing_orders_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "profiles_user_id_key" ON "profiles"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "workspace_members_workspace_id_email_key" ON "workspace_members"("workspace_id", "email");

-- CreateIndex
CREATE INDEX "agents_user_id_idx" ON "agents"("user_id");

-- CreateIndex
CREATE INDEX "agents_workspace_id_idx" ON "agents"("workspace_id");

-- CreateIndex
CREATE INDEX "knowledge_sources_agent_id_idx" ON "knowledge_sources"("agent_id");

-- CreateIndex
CREATE INDEX "workflows_user_id_idx" ON "workflows"("user_id");

-- CreateIndex
CREATE INDEX "workflows_workspace_id_idx" ON "workflows"("workspace_id");

-- CreateIndex
CREATE UNIQUE INDEX "member_agent_permissions_member_id_agent_id_key" ON "member_agent_permissions"("member_id", "agent_id");

-- CreateIndex
CREATE UNIQUE INDEX "member_workflow_permissions_member_id_workflow_id_key" ON "member_workflow_permissions"("member_id", "workflow_id");

-- CreateIndex
CREATE INDEX "billing_orders_user_id_idx" ON "billing_orders"("user_id");

-- AddForeignKey
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workspaces" ADD CONSTRAINT "workspaces_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workspace_members" ADD CONSTRAINT "workspace_members_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workspace_members" ADD CONSTRAINT "workspace_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agents" ADD CONSTRAINT "agents_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agents" ADD CONSTRAINT "agents_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "knowledge_sources" ADD CONSTRAINT "knowledge_sources_agent_id_fkey" FOREIGN KEY ("agent_id") REFERENCES "agents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workflows" ADD CONSTRAINT "workflows_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workflows" ADD CONSTRAINT "workflows_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "member_agent_permissions" ADD CONSTRAINT "member_agent_permissions_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "workspace_members"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "member_agent_permissions" ADD CONSTRAINT "member_agent_permissions_agent_id_fkey" FOREIGN KEY ("agent_id") REFERENCES "agents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "member_workflow_permissions" ADD CONSTRAINT "member_workflow_permissions_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "workspace_members"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "member_workflow_permissions" ADD CONSTRAINT "member_workflow_permissions_workflow_id_fkey" FOREIGN KEY ("workflow_id") REFERENCES "workflows"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "billing_orders" ADD CONSTRAINT "billing_orders_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
