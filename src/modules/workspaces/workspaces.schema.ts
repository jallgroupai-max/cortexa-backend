import { z } from "zod";

export const createWorkspaceSchema = z.object({
  name: z.string().min(1, "Nombre requerido"),
  icon: z.string().optional(),
});

export const updateWorkspaceSchema = z.object({
  name: z.string().min(1).optional(),
  icon: z.string().optional(),
});

export const inviteMemberSchema = z.object({
  email: z.string().email("Email inválido"),
  permission: z.enum(["view", "edit"]).default("view"),
});

export const updateMemberPermissionsSchema = z.object({
  agentIds: z.array(z.string().uuid()).default([]),
  workflowIds: z.array(z.string().uuid()).default([]),
});

export type CreateWorkspaceInput = z.infer<typeof createWorkspaceSchema>;
export type UpdateWorkspaceInput = z.infer<typeof updateWorkspaceSchema>;
export type InviteMemberInput = z.infer<typeof inviteMemberSchema>;
export type UpdateMemberPermissionsInput = z.infer<typeof updateMemberPermissionsSchema>;
