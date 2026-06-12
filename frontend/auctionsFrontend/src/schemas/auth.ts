import { z } from 'zod';

/* ═══════════════════════════════════════════════════
   Auth Schemas — login, register, 2FA
   ═══════════════════════════════════════════════════ */

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),
  password: z
    .string()
    .min(1, 'Password is required')
    .min(8, 'Password must be at least 8 characters'),
  two_factor_code: z
    .string()
    .transform((val) => val.trim())
    .refine((val) => !val || (val.length === 6 && /^\d{6}$/.test(val)), {
      message: 'Code must be exactly 6 digits',
    }),
});

export type LoginFormValues = z.infer<typeof loginSchema>;

export const registerSchema = z
  .object({
    firstName: z
      .string()
      .min(1, 'First name is required')
      .max(50, 'Name must be under 50 characters'),
    lastName: z
      .string()
      .min(1, 'Last name is required')
      .max(50, 'Name must be under 50 characters'),
    email: z
      .string()
      .min(1, 'Email is required')
      .email('Please enter a valid email address'),
    phone: z.string().optional(),
    password: z
      .string()
      .min(1, 'Password is required')
      .min(8, 'Password must be at least 8 characters')
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        'Password must include uppercase, lowercase, and a number',
      ),
    passwordConfirmation: z.string().min(1, 'Please confirm your password'),
    termsAccepted: z.boolean().refine((val) => val === true, {
      message: 'You must accept the terms',
    }),
  })
  .refine((data) => data.password === data.passwordConfirmation, {
    message: 'Passwords do not match',
    path: ['passwordConfirmation'],
  });

export type RegisterFormValues = z.infer<typeof registerSchema>;
