import { getServerSession } from 'next-auth';
import { verifyRegistrationResponse } from '@simplewebauthn/server';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { rpID, origin, getChallenge } from '@/lib/webauthn';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !(session.user as any).id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const body = await req.json();

    const expectedChallenge = await getChallenge(userId);
    if (!expectedChallenge) {
      return NextResponse.json({ error: 'Challenge expired or not found' }, { status: 400 });
    }

    const verification = await verifyRegistrationResponse({
      response: body,
      expectedChallenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
    });

    if (!verification.verified || !verification.registrationInfo) {
      return NextResponse.json({ error: 'Verification failed' }, { status: 400 });
    }

    const { credential, credentialDeviceType, credentialBackedUp } = verification.registrationInfo;

    // Store credential in database
    await db.webAuthnCredential.create({
      data: {
        id: credential.id,
        userId,
        publicKey: Buffer.from(credential.publicKey).toString('base64url'),
        counter: credential.counter,
        deviceType: credentialDeviceType,
        backedUp: credentialBackedUp,
        transports: body.response?.transports?.join(',') || null,
      },
    });

    return NextResponse.json({ verified: true });
  } catch (error: any) {
    console.error('[WebAuthn Register Verify Error]', error.message);
    return NextResponse.json({ error: 'Verification failed' }, { status: 500 });
  }
}
