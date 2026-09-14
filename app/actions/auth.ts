'use server';

import { db } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

// ─── Validation Schemas ────────────────────────────────────────────────────

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain an uppercase letter')
    .regex(/[0-9]/, 'Password must contain a number'),
});

// ─── Register New User ─────────────────────────────────────────────────────

export async function registerUser(formData: {
  name: string;
  email: string;
  password: string;
}): Promise<{ success: boolean; error?: string; userId?: string }> {
  try {
    const validated = registerSchema.parse(formData);

    // Check if email already taken
    const existingUser = await db.user.findUnique({
      where: { email: validated.email.toLowerCase().trim() },
    });

    if (existingUser) {
      return { success: false, error: 'An account with this email already exists.' };
    }

    // Hash password with bcrypt (12 salt rounds)
    const passwordHash = await bcrypt.hash(validated.password, 12);

    const user = await db.user.create({
      data: {
        name: validated.name.trim(),
        email: validated.email.toLowerCase().trim(),
        passwordHash,
      },
    });

    return { success: true, userId: user.id };
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return { success: false, error: err.errors[0]?.message || 'Validation failed.' };
    }
    console.error('[RegisterUser Error]', err.message);
    return { success: false, error: 'Registration failed. Please try again.' };
  }
}
