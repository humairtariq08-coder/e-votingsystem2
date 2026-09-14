import type {
  GenerateRegistrationOptionsOpts,
  GenerateAuthenticationOptionsOpts,
} from '@simplewebauthn/server';
import { db } from './db';

// ─── WebAuthn Configuration ───────────────────────────────────────────────
// Relying Party (RP) configuration for FIDO2/WebAuthn
export const rpName = 'AegisVote Enterprise';
const rawRpId = process.env.WEBAUTHN_RP_ID || 'localhost';
const rawOrigin = process.env.WEBAUTHN_ORIGIN || `http://${rawRpId}:3000`;

export const rpID = rawRpId.replace(/^https?:\/\//, '').replace(/\/$/, '');
export const origin = rawOrigin.replace(/\/$/, '');

/**
 * Database-backed challenge store for WebAuthn registration/authentication.
 * This replaces the in-memory Map which fails in Serverless environments (like Vercel).
 */
export async function storeChallenge(userId: string, challenge: string) {
  await db.user.update({
    where: { id: userId },
    data: { webauthnChallenge: challenge },
  });

  // We could implement an auto-expiration cron job, but for now it's fine
  // because it's overwritten on next attempt and cleared on verify.
}

export async function getChallenge(userId: string): Promise<string | undefined> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { webauthnChallenge: true },
  });
  
  if (user?.webauthnChallenge) {
    // Clear challenge so it's one-time use
    await db.user.update({
      where: { id: userId },
      data: { webauthnChallenge: null },
    });
    return user.webauthnChallenge;
  }
  
  return undefined;
}
