import { SignJWT, jwtVerify } from 'jose';

const SECRET_KEY = process.env.JWT_SECRET || 'fallback-secret-for-dev-only';
const key = new TextEncoder().encode(SECRET_KEY);

export interface JWTPayload {
    userId: string;
    role: 'user' | 'admin';
    name?: string;
}

/**
 * Sign a JWT token for the user session
 */
export async function signToken(payload: JWTPayload) {
    return await new SignJWT(payload as any)
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('7d') // 7 days session
        .sign(key);
}

/**
 * Verify a JWT token
 */
export async function verifyToken(token: string): Promise<JWTPayload | null> {
    try {
        const { payload } = await jwtVerify(token, key, {
            algorithms: ['HS256'],
        });
        return payload as unknown as JWTPayload;
    } catch (error) {
        return null;
    }
}
