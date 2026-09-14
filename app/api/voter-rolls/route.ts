import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const electionId = searchParams.get('electionId');

    // Get user's organizations
    const memberships = await db.organizationMember.findMany({
      where: { userId: session.user.id },
      select: { organizationId: true },
    });
    const orgIds = memberships.map((m) => m.organizationId);

    if (orgIds.length === 0) {
      return NextResponse.json([]);
    }

    // Get elections belonging to user's orgs
    const electionsWhere: any = {
      organizationId: { in: orgIds },
    };
    if (electionId) {
      electionsWhere.id = electionId;
    }

    const elections = await db.election.findMany({
      where: electionsWhere,
      select: {
        id: true,
        title: true,
        status: true,
        voterStatuses: {
          select: {
            id: true,
            votedAt: true,
            user: {
              select: {
                id: true,
                email: true,
                name: true,
              },
            },
          },
          orderBy: { votedAt: 'desc' },
        },
        voterRoll: {
          select: {
            id: true,
            email: true,
            status: true,
            addedAt: true,
            user: {
              select: {
                id: true,
                email: true,
                name: true,
              },
            },
          },
          orderBy: { addedAt: 'desc' },
        },
        _count: {
          select: { votes: true, voterStatuses: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(elections);
  } catch (error: any) {
    console.error('Error fetching voter rolls:', error);
    return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 });
  }
}
