import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { z } from 'zod';

const createElectionSchema = z.object({
  organizationId: z.string(),
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  type: z.enum(['CANDIDATE_SELECTION', 'REFERENDUM', 'MULTI_SELECT']).default('CANDIDATE_SELECTION'),
  visibility: z.enum(['PUBLIC', 'PRIVATE', 'INVITE_ONLY']).default('PUBLIC'),
  requireBiometric: z.boolean().default(false),
  startDate: z.string(),
  endDate: z.string(),
  options: z.array(
    z.object({
      name: z.string().min(1, 'Option name is required'),
      bio: z.string().optional(),
      party: z.string().optional(),
      imageUrl: z.string().optional(),
      type: z.enum(['CANDIDATE', 'YES', 'NO', 'CUSTOM']).default('CANDIDATE'),
    })
  ).min(2, 'At least 2 options are required'),
});

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const orgId = searchParams.get('orgId');
    const status = searchParams.get('status');

    const session = await getServerSession(authOptions);

    const where: any = {};
    if (orgId) {
      where.organizationId = orgId;
    } else {
      where.visibility = 'PUBLIC';
    }

    if (status) {
      where.status = status;
    }

    const elections = await db.election.findMany({
      where,
      include: {
        organization: {
          select: { id: true, name: true, slug: true, isVerified: true, logoUrl: true },
        },
        options: true,
        _count: {
          select: {
            votes: true,
            voterStatuses: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(elections);
  } catch (error: any) {
    console.error('Error fetching elections:', error);
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
    const validated = createElectionSchema.parse(body);

    // Verify user belongs to org
    const member = await db.organizationMember.findUnique({
      where: {
        userId_organizationId: {
          userId: session.user.id,
          organizationId: validated.organizationId,
        },
      },
    });

    if (!member) {
      return NextResponse.json({ error: 'You are not a member of this organization' }, { status: 403 });
    }

    const election = await db.election.create({
      data: {
        organizationId: validated.organizationId,
        title: validated.title,
        description: validated.description,
        type: validated.type,
        visibility: validated.visibility,
        requireBiometric: validated.requireBiometric,
        startDate: new Date(validated.startDate),
        endDate: new Date(validated.endDate),
        status: 'ACTIVE',
        options: {
          create: validated.options.map((opt, idx) => ({
            name: opt.name,
            bio: opt.bio,
            party: opt.party,
            imageUrl: opt.imageUrl,
            type: opt.type,
            sortOrder: idx,
          })),
        },
      },
      include: {
        options: true,
      },
    });

    // Create audit log
    await db.auditLog.create({
      data: {
        organizationId: validated.organizationId,
        userId: session.user.id,
        action: 'ELECTION_CREATED',
        targetType: 'Election',
        targetId: election.id,
        metadata: JSON.stringify({ title: election.title, type: election.type }),
      },
    });

    return NextResponse.json(election, { status: 201 });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    console.error('Error creating election:', error);
    return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 });
  }
}
