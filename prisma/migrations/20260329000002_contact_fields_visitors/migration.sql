-- Add contactFields to agents
ALTER TABLE "agents" ADD COLUMN IF NOT EXISTS "contact_fields" JSONB DEFAULT '[]';

-- Add visitorEmail and contactData to conversations
ALTER TABLE "conversations" ADD COLUMN IF NOT EXISTS "visitor_email" TEXT;
ALTER TABLE "conversations" ADD COLUMN IF NOT EXISTS "contact_data" JSONB;
