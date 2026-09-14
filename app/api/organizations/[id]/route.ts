import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    const org = await db.organization.findUnique({
      where: { id },
      include: {
        _count: {
          select: { elections: true, members: true },
        },
      },
    });

    if (!org) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    return NextResponse.json(org);
  } catch (error: any) {
    console.error('Error fetching org:', error);
    return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 });
  }
}
