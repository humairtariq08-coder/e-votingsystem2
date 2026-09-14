import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

// GET: List voter roll for this election
export async function GET(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: electionId } = await context.params;
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const election = await db.election.findUnique({
      where: { id: electionId },
      select: { organizationId: true },
    });

    if (!election) {
      return NextResponse.json({ error: 'Election not found' }, { status: 404 });
    }

    const roll = await db.voterRoll.findMany({
      where: { electionId },
      include: {
        user: {
          select: { id: true, email: true, name: true },
        },
      },
      orderBy: { addedAt: 'desc' },
    });

    return NextResponse.json(roll);
  } catch (error: any) {
    console.error('Error fetching voter roll:', error);
    return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 });
  }
}

// POST: Add approved org members to this election's voter roll
export async function POST(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: electionId } = await context.params;
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const election = await db.election.findUnique({
      where: { id: electionId },
      select: { organizationId: true },
    });

    if (!election) {
      return NextResponse.json({ error: 'Election not found' }, { status: 404 });
    }

    // Check caller is admin of the org
    const callerMember = await db.organizationMember.findUnique({
      where: {
        userId_organizationId: {
          userId: session.user.id,
          organizationId: election.organizationId,
        },
      },
    });

    if (!callerMember || !['OWNER', 'ADMIN', 'MANAGER'].includes(callerMember.role)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const body = await req.json();
    const { userIds } = body; // Array of user IDs to add

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return NextResponse.json({ error: 'Provide an array of userIds.' }, { status: 400 });
    }

    // Get the users' emails
    const users = await db.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, email: true },
    });

    // Create voter roll entries (skip duplicates)
    const results = [];
    for (const user of users) {
      try {
        const entry = await db.voterRoll.create({
          data: {
            electionId,
            userId: user.id,
            email: user.email,
            status: 'APPROVED',
          },
        });
        results.push(entry);
      } catch (e: any) {
        // Skip duplicate entries (unique constraint on electionId+email)
        if (e.code !== 'P2002') throw e;
      }
    }

    return NextResponse.json({ success: true, added: results.length }, { status: 201 });
  } catch (error: any) {
    console.error('Error adding to voter roll:', error);
    return NextResponse.json({ error: error.message || 'Failed to add voters.' }, { status: 500 });
  }
}

// DELETE: Remove a voter from the roll
export async function DELETE(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: electionId } = await context.params;
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const rollId = searchParams.get('rollId');

    if (!rollId) {
      return NextResponse.json({ error: 'Provide rollId query parameter.' }, { status: 400 });
    }

    await db.voterRoll.delete({ where: { id: rollId } });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error removing from voter roll:', error);
    return NextResponse.json({ error: error.message || 'Failed to remove voter.' }, { status: 500 });
  }
}
