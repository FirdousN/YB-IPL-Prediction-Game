import { signSession } from './auth';

/**
 * Creates a session for the given payload and returns the signed JWT token.
 * Optionally, you can include logic to attach the session directly to a response 
 * cookie if needed, but the primary duty is issuing the token payload.
 */
export async function createSession(payload: { participantId: string; version: number; role: string }) {
  // Leverage the existing auth utility to sign the session payload
  return await signSession(payload);
}
