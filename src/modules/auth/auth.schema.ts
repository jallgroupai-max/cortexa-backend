import { z } from "zod";

export const registerSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
});

export const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(1, "Contraseña requerida"),
});

export const requestResetSchema = z.object({
  email: z.string().email("Email inválido"),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, "Token requerido"),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type RequestResetInput = z.infer<typeof requestResetSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
