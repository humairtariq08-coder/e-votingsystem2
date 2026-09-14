import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { z } from 'zod';

const createOrgSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  slug: z.string().min(2).regex(/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens'),
  description: z.string().optional(),
  website: z.string().url().optional().or(z.literal('')),
  tier: z.enum(['FREE', 'PRO', 'ENTERPRISE', 'GOVERNMENT']).default('FREE'),
});

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const memberships = await db.organizationMember.findMany({
      where: { userId: session.user.id },
      include: {
        organization: {
          include: {
            _count: {
              select: {
                elections: true,
                members: true,
              },
            },
          },
        },
      },
      orderBy: { joinedAt: 'desc' },
    });

    return NextResponse.json(memberships.map((m) => ({ ...m.organization, role: m.role })));
  } catch (error: any) {
    console.error('Error fetching organizations:', error);
    return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const validated = createOrgSchema.parse(body);

    const existingSlug = await db.organization.findUnique({
      where: { slug: validated.slug },
    });

    if (existingSlug) {
      return NextResponse.json({ error: 'Organization slug is already taken' }, { status: 400 });
    }

    const org = await db.organization.create({
      data: {
        name: validated.name,
        slug: validated.slug,
        description: validated.description,
        website: validated.website,
        tier: validated.tier,
        members: {
          create: {
            userId: session.user.id,
            role: 'OWNER',
          },
        },
        auditLogs: {
          create: {
            userId: session.user.id,
            action: 'ORGANIZATION_CREATED',
            targetType: 'Organization',
            metadata: JSON.stringify({ name: validated.name, tier: validated.tier }),
          },
        },
      },
    });

    return NextResponse.json(org, { status: 201 });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    console.error('Error creating organization:', error);
    return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 });
  }
}
