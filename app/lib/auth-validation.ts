import { z } from 'zod';

export const passwordSchema = z
  .string()
  .min(8, 'A senha deve ter pelo menos 8 caracteres.')
  .max(128, 'A senha deve ter no máximo 128 caracteres.')
  .regex(/[a-z]/, 'Inclua pelo menos uma letra minúscula.')
  .regex(/[A-Z]/, 'Inclua pelo menos uma letra maiúscula.')
  .regex(/\d/, 'Inclua pelo menos um número.')
  .regex(/[^A-Za-z0-9]/, 'Inclua pelo menos um caractere especial.');

export const brazilPhoneSchema = z
  .string()
  .transform((value) => value.replace(/\D/g, ''))
  .refine((value) => /^(?:55)?[1-9]\d{9,10}$/.test(value), 'Informe um celular brasileiro válido com DDD.')
  .transform((value) => (value.startsWith('55') ? value : '55' + value));

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email('Informe um e-mail válido.'),
  password: z.string().min(1, 'Informe sua senha.').max(128, 'Senha inválida.'),
});

export const companyRegistrationSchema = z.object({
  company: z.string().trim().min(2, 'Informe a razão social.').max(160, 'Razão social muito longa.'),
  name: z.string().trim().min(2, 'Informe o nome do responsável.').max(120, 'Nome muito longo.'),
  email: z.string().trim().toLowerCase().email('Informe um e-mail corporativo válido.'),
  phone: brazilPhoneSchema,
  password: passwordSchema,
});

export type LoginInput = z.input<typeof loginSchema>;
export type CompanyRegistrationInput = z.input<typeof companyRegistrationSchema>;
