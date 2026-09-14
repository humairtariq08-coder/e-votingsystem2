import { getServerSession } from 'next-auth';
import { verifyAuthenticationResponse } from '@simplewebauthn/server';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { rpID, origin, getChallenge } from '@/lib/webauthn';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const body = await req.json();

    const expectedChallenge = await getChallenge(userId);
    if (!expectedChallenge) {
      return NextResponse.json({ error: 'Challenge expired or not found' }, { status: 400 });
    }

    // Get the credential from DB
    const credential = await db.webAuthnCredential.findUnique({
      where: { id: body.id, userId },
    });

    if (!credential) {
      return NextResponse.json({ error: 'Credential not found' }, { status: 404 });
    }

    const verification = await verifyAuthenticationResponse({
      response: body,
      expectedChallenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
      credential: {
        id: credential.id,
        publicKey: Buffer.from(credential.publicKey, 'base64url'),
        counter: credential.counter,
        transports: (credential.transports?.split(',') || []) as any[],
      },
    });

    if (!verification.verified || !verification.authenticationInfo) {
      return NextResponse.json({ error: 'Verification failed' }, { status: 400 });
    }

    // Update counter for replay protection
    await db.webAuthnCredential.update({
      where: { id: credential.id },
      data: { counter: verification.authenticationInfo.newCounter },
    });

    return NextResponse.json({ verified: true });
  } catch (error: any) {
    console.error('[WebAuthn Auth Verify Error]', error.message);
    return NextResponse.json({ error: 'Verification failed' }, { status: 500 });
  }
}
