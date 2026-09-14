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
    let isEligible = false;
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

      // Check voter roll eligibility
      const rollEntry = await db.voterRoll.findFirst({
        where: {
          electionId: id,
          userId: session.user.id,
          status: 'APPROVED',
        },
      });
      isEligible = !!rollEntry;
    }

    // Hide per-option vote counts if election hasn't ended
    const now = new Date();
    const isEnded = now > new Date(election.endDate) || election.status === 'CLOSED';

    const sanitizedOptions = election.options.map((opt: any) => ({
      ...opt,
      _count: isEnded ? opt._count : { votes: 0 },
    }));

    return NextResponse.json({
      ...election,
      options: sanitizedOptions,
      _count: isEnded ? election._count : { votes: election._count.votes }, // total votes always visible
      hasVoted,
      isEligible,
      resultsAvailable: isEnded,
    });
  } catch (error: any) {
    console.error('Error fetching election detail:', error);
    return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 });
  }
}
