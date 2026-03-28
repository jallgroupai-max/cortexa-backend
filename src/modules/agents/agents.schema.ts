import { z } from "zod";

export const ALLOWED_MODELS = ['Groq', 'Gemini', 'Kimi', 'DeepSeek'] as const;
export type AllowedModel = typeof ALLOWED_MODELS[number];

const modelField = z.enum(ALLOWED_MODELS, {
  errorMap: () => ({ message: `El modelo debe ser uno de: ${ALLOWED_MODELS.join(', ')}` }),
});

export const createAgentSchema = z.object({
  name: z.string().min(1, "Nombre requerido"),
  description: z.string().optional(),
  tone: z.string().optional(),
  color: z.string().optional(),
  welcomeMessage: z.string().optional(),
  prompt: z.string().optional(),
  model: modelField.optional().default('Groq'),
  workspaceId: z.string().uuid().optional().nullable(),
});

export const updateAgentSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  tone: z.string().optional(),
  color: z.string().optional(),
  welcomeMessage: z.string().optional(),
  prompt: z.string().optional(),
  model: modelField.optional(),
  workspaceId: z.string().uuid().optional().nullable(),
});

export type CreateAgentInput = z.infer<typeof createAgentSchema>;
export type UpdateAgentInput = z.infer<typeof updateAgentSchema>;
