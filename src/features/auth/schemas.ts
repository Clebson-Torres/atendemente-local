import { z } from "zod";

export const loginSchema = z.object({
  email: z.email("Informe um email valido."),
  password: z.string().min(8, "A senha precisa ter pelo menos 8 caracteres."),
});

export const forgotPasswordSchema = z.object({
  email: z.email("Informe um email valido."),
});

export const inviteAcceptanceSchema = z
  .object({
    fullName: z.string().trim().min(3, "Informe seu nome completo.").optional().or(z.literal("")),
    password: z.string().min(8, "A senha precisa ter pelo menos 8 caracteres."),
    confirmPassword: z.string().min(8, "Confirme a senha."),
  })
  .refine((value) => value.password === value.confirmPassword, {
    path: ["confirmPassword"],
    message: "As senhas precisam ser iguais.",
  });

export const resetPasswordSchema = z
  .object({
    password: z.string().min(8, "A senha precisa ter pelo menos 8 caracteres."),
    confirmPassword: z.string().min(8, "Confirme a senha."),
  })
  .refine((value) => value.password === value.confirmPassword, {
    path: ["confirmPassword"],
    message: "As senhas precisam ser iguais.",
  });

export type LoginInput = z.infer<typeof loginSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type InviteAcceptanceInput = z.infer<typeof inviteAcceptanceSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
