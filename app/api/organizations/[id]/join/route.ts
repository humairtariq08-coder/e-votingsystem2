import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

export async function POST(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: organizationId } = await context.params;
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'You must be logged in to apply.' }, { status: 401 });
    }

    const org = await db.organization.findUnique({ where: { id: organizationId } });
    if (!org) {
      return NextResponse.json({ error: 'Organization not found.' }, { status: 404 });
    }

    // Check if already a member
    const existing = await db.organizationMember.findUnique({
      where: {
        userId_organizationId: {
          userId: session.user.id,
          organizationId,
        },
      },
    });

    if (existing) {
      return NextResponse.json({
        error: `You have already applied. Your status is: ${existing.status}`,
      }, { status: 400 });
    }

    const member = await db.organizationMember.create({
      data: {
        userId: session.user.id,
        organizationId,
        role: 'VOTER',
        status: 'PENDING',
      },
    });

    return NextResponse.json({ success: true, status: member.status }, { status: 201 });
  } catch (error: any) {
    console.error('Error joining org:', error);
    return NextResponse.json({ error: error.message || 'Failed to apply.' }, { status: 500 });
  }
}
