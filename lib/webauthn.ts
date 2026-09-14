import type {
  GenerateRegistrationOptionsOpts,
  GenerateAuthenticationOptionsOpts,
} from '@simplewebauthn/server';

// ─── WebAuthn Configuration ───────────────────────────────────────────────
// Relying Party (RP) configuration for FIDO2/WebAuthn
export const rpName = 'AegisVote Enterprise';
export const rpID = process.env.WEBAUTHN_RP_ID || 'localhost';
export const origin = process.env.WEBAUTHN_ORIGIN || `http://${rpID}:3000`;

/**
 * In-memory challenge store for WebAuthn registration/authentication.
 * In production, use Redis or a database-backed store.
 */
const challengeStore = new Map<string, string>();

export function storeChallenge(userId: string, challenge: string) {
  challengeStore.set(userId, challenge);
  // Auto-expire after 5 minutes
  setTimeout(() => challengeStore.delete(userId), 5 * 60 * 1000);
}

export function getChallenge(userId: string): string | undefined {
  const challenge = challengeStore.get(userId);
  challengeStore.delete(userId); // One-time use
  return challenge;
}
