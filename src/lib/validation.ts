import { z } from "zod";

export const signupSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100),
  email: z.string().trim().toLowerCase().email("Enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  familyName: z.string().trim().min(1, "Family name is required").max(100),
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

export const childSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100),
  birthdate: z.string().optional(),
});

export const toothPostSchema = z.object({
  childId: z.string().min(1),
  note: z.string().trim().max(2000).optional(),
});

export const inviteSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email"),
});

export const giftSchema = z.object({
  toothPostId: z.string().min(1),
  inviteToken: z.string().min(1),
  senderName: z.string().trim().min(1, "Name is required").max(100),
  senderEmail: z.string().trim().toLowerCase().email("Enter a valid email"),
  amountCents: z
    .number()
    .int()
    .min(100, "Minimum gift is $1")
    .max(100000000, "Amount is too large"),
});
