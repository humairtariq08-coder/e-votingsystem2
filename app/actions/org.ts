'use server';

import { db } from '@/lib/db';
import { z } from 'zod';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

// ─── Validation Schemas ────────────────────────────────────────────────────

const createOrgSchema = z.object({
  name: z.string().min(2, 'Organization name must be at least 2 characters').max(100),
  slug: z
    .string()
    .min(3, 'Slug must be at least 3 characters')
    .max(50)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must be lowercase, URL-safe (e.g., "my-org")'),
  description: z.string().max(500).optional(),
  website: z.string().url().optional().or(z.literal('')),
});

// ─── Get Current User ID ───────────────────────────────────────────────────

async function getCurrentUserId(): Promise<string> {
  const session = await getServerSession(authOptions);
  if (!session?.user || !(session.user as any).id) {
    throw new Error('Authentication required.');
  }
  return (session.user as any).id;
}

// ─── Create Organization ───────────────────────────────────────────────────

export async function createOrganization(formData: {
  name: string;
  slug: string;
  description?: string;
  website?: string;
}): Promise<{ success: boolean; error?: string; orgSlug?: string }> {
  try {
    const userId = await getCurrentUserId();
    const validated = createOrgSchema.parse(formData);

    // Check if slug is already taken
    const existingOrg = await db.organization.findUnique({
      where: { slug: validated.slug },
    });

    if (existingOrg) {
      return { success: false, error: 'This organization slug is already taken.' };
    }

    // Create org + set creator as OWNER in a transaction
    const org = await db.$transaction(async (tx) => {
      const organization = await tx.organization.create({
        data: {
          name: validated.name.trim(),
          slug: validated.slug,
          description: validated.description?.trim() || null,
          website: validated.website || null,
        },
      });

      await tx.organizationMember.create({
        data: {
          userId,
          organizationId: organization.id,
          role: 'OWNER',
        },
      });

      // Log the creation in audit trail
      await tx.auditLog.create({
        data: {
          organizationId: organization.id,
          userId,
          action: 'ORGANIZATION_CREATED',
          targetType: 'Organization',
          targetId: organization.id,
          metadata: JSON.stringify({ name: organization.name, slug: organization.slug }),
        },
      });

      return organization;
    });

    revalidatePath('/dashboard');
    return { success: true, orgSlug: org.slug };
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return { success: false, error: err.errors[0]?.message || 'Validation failed.' };
    }
    console.error('[CreateOrganization Error]', err.message);
    return { success: false, error: err.message || 'Failed to create organization.' };
  }
}

// ─── List User's Organizations ─────────────────────────────────────────────

export async function getUserOrganizations() {
  try {
    const userId = await getCurrentUserId();

    const memberships = await db.organizationMember.findMany({
      where: { userId },
      include: {
        organization: {
          include: {
            _count: {
              select: { elections: true, members: true },
            },
          },
        },
      },
      orderBy: { joinedAt: 'desc' },
    });

    return memberships.map((m) => ({
      ...m.organization,
      userRole: m.role,
      memberCount: m.organization._count.members,
      electionCount: m.organization._count.elections,
    }));
  } catch (err: any) {
    console.error('[GetUserOrganizations Error]', err.message);
    return [];
  }
}

// ─── Get Organization Details ──────────────────────────────────────────────

export async function getOrganizationBySlug(slug: string) {
  try {
    const userId = await getCurrentUserId();

    const org = await db.organization.findUnique({
      where: { slug },
      include: {
        members: {
          include: { user: { select: { id: true, name: true, email: true, avatarUrl: true } } },
        },
        elections: {
          orderBy: { createdAt: 'desc' },
          include: {
            _count: { select: { votes: true, voterStatuses: true, options: true } },
          },
        },
        _count: { select: { elections: true, members: true, auditLogs: true } },
      },
    });

    if (!org) return null;

    // Verify user is a member
    const membership = org.members.find((m) => m.userId === userId);
    if (!membership) return null;

    return { ...org, currentUserRole: membership.role };
  } catch (err: any) {
    console.error('[GetOrganizationBySlug Error]', err.message);
    return null;
  }
}
