import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's organizations
    const memberships = await db.organizationMember.findMany({
      where: { userId: session.user.id },
      select: { organizationId: true },
    });
    const orgIds = memberships.map((m) => m.organizationId);

    if (orgIds.length === 0) {
      return NextResponse.json([]);
    }

    const logs = await db.auditLog.findMany({
      where: {
        organizationId: { in: orgIds },
      },
      include: {
        user: {
          select: { id: true, email: true, name: true },
        },
        organization: {
          select: { id: true, name: true, slug: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });

    return NextResponse.json(logs);
  } catch (error: any) {
    console.error('Error fetching audit logs:', error);
    return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 });
  }
}
