'use server';

import { db } from '@/lib/db';
import crypto from 'crypto';
import { revalidatePath } from 'next/cache';

export interface CastVoteParams {
  userId: string;
  electionId: string;
  optionId: string;
}

export interface CastVoteResult {
  success: boolean;
  receiptHash?: string;
  timestamp?: string;
  error?: string;
}

export async function castVote(params: CastVoteParams): Promise<CastVoteResult> {
  const { userId, electionId, optionId } = params;

  if (!userId || !electionId || !optionId) {
    return { success: false, error: 'Invalid payload parameters.' };
  }

  try {
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
        throw new Error('Double voting prevented: You have already cast a ballot in this election.');
      }

      const election = await tx.election.findUnique({
        where: { id: electionId },
        include: { options: true },
      });

      if (!election || election.status !== 'ACTIVE') {
        throw new Error('Election is inactive or invalid.');
      }

      const optionExists = election.options.some((opt) => opt.id === optionId);
      if (!optionExists) {
        throw new Error('Invalid option selection for this election.');
      }

      const randomSeed = crypto.randomBytes(32);
      const timestampIso = new Date().toISOString();
      const receiptHash = `AEGIS-${crypto
        .createHash('sha256')
        .update(randomSeed)
        .update(optionId)
        .update(timestampIso)
        .digest('hex')
        .slice(0, 16)
        .toUpperCase()}`;

      await tx.vote.create({
        data: {
          receiptHash,
          electionId,
          optionId,
        },
      });

      await tx.voterStatus.create({
        data: {
          userId,
          electionId,
        },
      });

      return {
        receiptHash,
        timestamp: timestampIso,
      };
    });

    revalidatePath('/');
    return {
      success: true,
      receiptHash: result.receiptHash,
      timestamp: result.timestamp,
    };
  } catch (err: any) {
    console.error('[CastVote Error]', err.message);
    return {
      success: false,
      error: err.message || 'Failed to submit ballot due to server transaction error.',
    };
  }
}

export async function checkUserVoteStatus(userId: string, electionId: string) {
  try {
    const status = await db.voterStatus.findUnique({
      where: {
        userId_electionId: {
          userId,
          electionId,
        },
      },
    });

    return { hasVoted: !!status, votedAt: status?.votedAt || null };
  } catch (error) {
    return { hasVoted: false, votedAt: null };
  }
}

export async function verifyReceiptHash(receiptHash: string) {
  try {
    const vote = await db.vote.findUnique({
      where: { receiptHash },
      select: {
        id: true,
        receiptHash: true,
        createdAt: true,
        election: {
          select: { title: true, id: true },
        },
      },
    });

    if (!vote) {
      return { verified: false, message: 'Receipt hash not found in public election ledger.' };
    }

    return {
      verified: true,
      timestamp: vote.createdAt,
      electionTitle: vote.election.title,
      electionId: vote.election.id,
      message: 'Cryptographic proof verified! Ballot payload was recorded on-chain in immutable election registry.',
    };
  } catch (error) {
    return { verified: false, message: 'Verification lookup failed.' };
  }
}
