import { getServerSession } from 'next-auth';
import { generateAuthenticationOptions } from '@simplewebauthn/server';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { rpID, storeChallenge } from '@/lib/webauthn';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !(session.user as any).id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id;

    // Get user's credentials to filter allowed Authenticators
    const userCreds = await db.webAuthnCredential.findMany({
      where: { userId },
      select: { id: true, transports: true },
    });

    const options = await generateAuthenticationOptions({
      rpID,
      allowCredentials: userCreds.map((cred) => ({
        id: cred.id,
        transports: (cred.transports?.split(',') || []) as any[],
      })),
      userVerification: 'preferred',
    });

    storeChallenge(userId, options.challenge);

    return NextResponse.json(options);
  } catch (error: any) {
    console.error('[WebAuthn Auth Options Error]', error.message);
    return NextResponse.json({ error: 'Failed to generate options' }, { status: 500 });
  }
}
