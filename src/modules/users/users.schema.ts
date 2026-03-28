import { z } from "zod";

export const updateProfileSchema = z.object({
  displayName:  z.string().optional(),
  company:      z.string().optional(),
  phone:        z.string().optional(),
  address:      z.string().optional(),
  bio:          z.string().optional(),
  avatarUrl:    z.string().optional().nullable(),
  coverPreset:  z.string().optional().nullable(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
