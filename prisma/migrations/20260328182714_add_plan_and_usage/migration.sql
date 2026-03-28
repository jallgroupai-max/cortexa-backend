-- AlterTable
ALTER TABLE "users" ADD COLUMN     "plan" TEXT NOT NULL DEFAULT 'Free';

-- CreateTable
CREATE TABLE "user_usage" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "tokens_used_day" INTEGER NOT NULL DEFAULT 0,
    "tokens_used_month" INTEGER NOT NULL DEFAULT 0,
    "credits_used" INTEGER NOT NULL DEFAULT 0,
    "requests_today" INTEGER NOT NULL DEFAULT 0,
    "last_reset_day" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_reset_month" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_usage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_usage_user_id_key" ON "user_usage"("user_id");

-- AddForeignKey
ALTER TABLE "user_usage" ADD CONSTRAINT "user_usage_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
