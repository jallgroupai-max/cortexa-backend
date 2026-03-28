import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string(),
  JWT_SECRET: z.string().min(16),
  JWT_EXPIRES_IN: z.string().default("7d"),
  PORT: z.coerce.number().default(3001),
  CORS_ORIGIN: z.string().default("http://localhost:5173"),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  OPENAI_API_KEY: z.string().optional(),
  GROQ_API_KEY: z.string().optional(),
  GEMINI_API_KEY: z.string().optional(),
  KIMI_API_KEY: z.string().optional(),
  DEEPSEEK_API_KEY: z.string().optional(),
});

export const env = envSchema.parse(process.env);
