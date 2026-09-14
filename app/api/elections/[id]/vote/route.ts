import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import crypto from 'crypto';
import { z } from 'zod';

const voteSchema = z.object({
  optionId: z.string(),
});

export async function POST(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: electionId } = await context.params;
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'You must be logged in to cast a vote.' }, { status: 401 });
    }

    const userId = session.user.id;
    const body = await req.json();
    const { optionId } = voteSchema.parse(body);

    const election = await db.election.findUnique({
      where: { id: electionId },
      include: { options: true },
    });

    if (!election) {
      return NextResponse.json({ error: 'Election not found.' }, { status: 404 });
    }

    if (election.status !== 'ACTIVE') {
      return NextResponse.json({ error: 'This election is not currently active.' }, { status: 400 });
    }

    const now = new Date();
    if (now > new Date(election.endDate)) {
      return NextResponse.json({ error: 'Voting for this election has closed.' }, { status: 400 });
    }

    const optionExists = election.options.some((opt) => opt.id === optionId);
    if (!optionExists) {
      return NextResponse.json({ error: 'Invalid candidate/option selected.' }, { status: 400 });
    }

    const salt = crypto.randomBytes(16).toString('hex');
    const receiptHash = `AEGIS-${crypto
      .createHash('sha256')
      .update(`${electionId}-${optionId}-${userId}-${salt}-${Date.now()}`)
      .digest('hex')
      .slice(0, 16)
      .toUpperCase()}`;

    const result = await db.$transaction(async (tx) => {
      const existingStatus = await tx.voterStatus.findUnique({
        where: {
          userId_electionId: {
            userId,
            electionId,
          },
        },
      });

      if (existingStatus) {
        throw new Error('DUPLICATE_VOTE');
      }

      await tx.voterStatus.create({
        data: {
          userId,
          electionId,
        },
      });

      const vote = await tx.vote.create({
        data: {
          receiptHash,
          electionId,
          optionId,
        },
      });

      return { receiptHash: vote.receiptHash };
    });

    return NextResponse.json({
      success: true,
      message: 'Vote cast successfully!',
      receiptHash: result.receiptHash,
    });
  } catch (error: any) {
    if (error.message === 'DUPLICATE_VOTE') {
      return NextResponse.json({ error: 'You have already cast a ballot in this election.' }, { status: 400 });
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    console.error('Error casting vote:', error);
    return NextResponse.json({ error: error.message || 'Failed to submit vote.' }, { status: 500 });
  }
}
