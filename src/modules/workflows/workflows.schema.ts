import { z } from "zod";

export const createWorkflowSchema = z.object({
  name: z.string().default("Nuevo Workflow"),
  description: z.string().optional(),
  workspaceId: z.string().uuid().optional().nullable(),
});

export const updateWorkflowSchema = z.object({
  name: z.string().optional(),
  description: z.string().optional(),
  nodes: z.any().optional(),
  edges: z.any().optional(),
  status: z.enum(["draft", "active", "paused"]).optional(),
});

export type CreateWorkflowInput = z.infer<typeof createWorkflowSchema>;
export type UpdateWorkflowInput = z.infer<typeof updateWorkflowSchema>;
