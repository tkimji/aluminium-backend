import { z } from 'zod';

export const registerSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(6),
  role: z.enum(['admin', 'tech', 'user']).optional(),
  phone: z.string().trim().optional(),
  prefix: z.string().trim().optional(),
  firstName: z.string().trim().min(1),
  lastName: z.string().trim().min(1),
  houseNo: z.string().trim().optional(),
  moo: z.string().trim().optional(),
  road: z.string().trim().optional(),
  province: z.string().trim().optional(),
  district: z.string().trim().optional(),
  subdistrict: z.string().trim().optional(),
  postalCode: z.string().trim().optional(),
  subscriptionPlan: z.enum(['monthly', 'yearly']).optional(),
});

export type RegisterBody = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1),
});
