import { getServerSession } from 'next-auth';
import { generateRegistrationOptions, verifyRegistrationResponse } from '@simplewebauthn/server';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { rpName, rpID, origin, storeChallenge } from '@/lib/webauthn';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !(session.user as any).id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id;

    // Get existing credentials for this user
    const existingCreds = await db.webAuthnCredential.findMany({
      where: { userId },
      select: { id: true, transports: true },
    });

    const options = await generateRegistrationOptions({
      rpName,
      rpID,
      userName: session.user.email || userId,
      userDisplayName: session.user.name || session.user.email || 'AegisVote User',
      attestationType: 'none',
      excludeCredentials: existingCreds.map((cred) => ({
        id: cred.id,
        transports: (cred.transports?.split(',') || []) as any[],
      })),
      authenticatorSelection: {
        residentKey: 'preferred',
        userVerification: 'preferred',
      },
    });

    // Store challenge for verification
    storeChallenge(userId, options.challenge);

    return NextResponse.json(options);
  } catch (error: any) {
    console.error('[WebAuthn Register Options Error]', error.message);
    return NextResponse.json({ error: 'Failed to generate options' }, { status: 500 });
  }
}
