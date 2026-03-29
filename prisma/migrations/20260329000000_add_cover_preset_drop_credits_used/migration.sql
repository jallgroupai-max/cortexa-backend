-- AlterTable: add cover_preset to profiles
ALTER TABLE "profiles" ADD COLUMN "cover_preset" TEXT;

-- AlterTable: drop credits_used from user_usage (removed from schema)
ALTER TABLE "user_usage" DROP COLUMN IF EXISTS "credits_used";
