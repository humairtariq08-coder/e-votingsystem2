import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const session = await getServerSession(authOptions);

    const election = await db.election.findUnique({
      where: { id },
      include: {
        organization: true,
        options: {
          orderBy: { sortOrder: 'asc' },
          include: {
            _count: {
              select: { votes: true },
            },
          },
        },
        _count: {
          select: { votes: true },
        },
      },
    });

    if (!election) {
      return NextResponse.json({ error: 'Election not found' }, { status: 404 });
    }

    let hasVoted = false;
    if (session?.user?.id) {
      const status = await db.voterStatus.findUnique({
        where: {
          userId_electionId: {
            userId: session.user.id,
            electionId: id,
          },
        },
      });
      hasVoted = !!status;
    }

    return NextResponse.json({
      ...election,
      hasVoted,
    });
  } catch (error: any) {
    console.error('Error fetching election detail:', error);
    return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 });
  }
}
