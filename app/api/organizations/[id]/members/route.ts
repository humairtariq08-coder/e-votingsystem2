import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

// GET: List all members of an org (admin only)
export async function GET(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: organizationId } = await context.params;
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check caller is admin/owner of this org
    const callerMember = await db.organizationMember.findUnique({
      where: {
        userId_organizationId: {
          userId: session.user.id,
          organizationId,
        },
      },
    });

    if (!callerMember || !['OWNER', 'ADMIN', 'MANAGER'].includes(callerMember.role)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const members = await db.organizationMember.findMany({
      where: { organizationId },
      include: {
        user: {
          select: { id: true, email: true, name: true, createdAt: true },
        },
      },
      orderBy: { joinedAt: 'desc' },
    });

    return NextResponse.json(members);
  } catch (error: any) {
    console.error('Error fetching members:', error);
    return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 });
  }
}

// PATCH: Approve or reject a member
export async function PATCH(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: organizationId } = await context.params;
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check caller is admin/owner
    const callerMember = await db.organizationMember.findUnique({
      where: {
        userId_organizationId: {
          userId: session.user.id,
          organizationId,
        },
      },
    });

    if (!callerMember || !['OWNER', 'ADMIN', 'MANAGER'].includes(callerMember.role)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const body = await req.json();
    const { memberId, status } = body;

    if (!memberId || !['APPROVED', 'REJECTED'].includes(status)) {
      return NextResponse.json({ error: 'Invalid request. Provide memberId and status (APPROVED/REJECTED).' }, { status: 400 });
    }

    const updated = await db.organizationMember.update({
      where: { id: memberId },
      data: { status },
      include: {
        user: { select: { email: true, name: true } },
      },
    });

    // Create audit log
    await db.auditLog.create({
      data: {
        organizationId,
        userId: session.user.id,
        action: status === 'APPROVED' ? 'VOTER_APPROVED' : 'VOTER_REJECTED',
        targetType: 'OrganizationMember',
        targetId: memberId,
        metadata: JSON.stringify({ voterEmail: updated.user.email, voterName: updated.user.name }),
      },
    });

    return NextResponse.json({ success: true, member: updated });
  } catch (error: any) {
    console.error('Error updating member:', error);
    return NextResponse.json({ error: error.message || 'Failed to update member.' }, { status: 500 });
  }
}
