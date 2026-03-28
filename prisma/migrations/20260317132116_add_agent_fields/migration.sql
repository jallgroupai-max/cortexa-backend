-- AlterTable
ALTER TABLE "agents" ADD COLUMN     "color" TEXT DEFAULT '#7C3AED',
ADD COLUMN     "description" TEXT DEFAULT '',
ADD COLUMN     "tone" TEXT DEFAULT 'profesional',
ADD COLUMN     "welcome_message" TEXT DEFAULT '¡Hola! ¿En qué puedo ayudarte hoy?';
