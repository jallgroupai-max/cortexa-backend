import { z } from "zod";

export const createKnowledgeSourceSchema = z.object({
  agentId: z.string().uuid(),
  fileName: z.string().min(1),
  fileType: z.string().min(1),
  status: z.string().default("Procesando"),
});

export const createBatchKnowledgeSourceSchema = z.object({
  agentId: z.string().uuid(),
  files: z.array(z.object({
    fileName: z.string().min(1),
    fileType: z.string().min(1),
  })).min(1),
});

export type CreateKnowledgeSourceInput = z.infer<typeof createKnowledgeSourceSchema>;
export type CreateBatchKnowledgeSourceInput = z.infer<typeof createBatchKnowledgeSourceSchema>;
