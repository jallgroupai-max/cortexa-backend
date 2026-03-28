-- AlterTable
ALTER TABLE "knowledge_sources" ADD COLUMN "file_size" INTEGER;
ALTER TABLE "knowledge_sources" ADD COLUMN "original_name" TEXT;
UPDATE "knowledge_sources" SET "original_name" = "file_name" WHERE "original_name" IS NULL;
ALTER TABLE "knowledge_sources" ALTER COLUMN "original_name" SET NOT NULL;
