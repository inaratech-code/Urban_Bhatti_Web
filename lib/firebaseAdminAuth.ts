import { getAuth } from 'firebase-admin/auth';
import './firebaseAdmin';
import { HARDCODED_ADMIN_UIDS } from './adminUids';

export type VerifiedUser = {
  uid: string;
  email?: string;
  role: 'admin' | 'guest';
};

const auth = getAuth();

export async function getUserFromRequest(request: Request): Promise<VerifiedUser | null> {
  const header = request.headers.get('Authorization') ?? request.headers.get('authorization');
  if (!header) {
    console.warn('No Authorization header found in request');
    return null;
  }

  const [scheme, token] = header.split(' ');
  if (scheme?.toLowerCase() !== 'bearer' || !token) {
    console.warn('Invalid Authorization header format. Expected "Bearer <token>"');
    return null;
  }

  if (!token || token.trim().length === 0) {
    console.warn('Empty token in Authorization header');
    return null;
  }

  try {
    const decoded = await auth.verifyIdToken(token);
    let role = (decoded.role as 'admin' | 'guest' | undefined) ?? 'guest';
    if (HARDCODED_ADMIN_UIDS.has(decoded.uid)) {
      role = 'admin';
    }
    return {
      uid: decoded.uid,
      email: decoded.email ?? undefined,
      role
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Failed to verify Firebase token:', errorMessage);
    if (errorMessage.includes('expired') || errorMessage.includes('invalid')) {
      console.error('Token is expired or invalid. User needs to re-authenticate.');
    }
    return null;
  }
}

export async function requireUser(request: Request): Promise<VerifiedUser> {
  const user = await getUserFromRequest(request);
  if (!user) {
    throw new Error('unauthorized');
  }
  return user;
}

export async function requireAdminUser(request: Request): Promise<VerifiedUser> {
  const user = await requireUser(request);
  if (user.role !== 'admin') {
    throw new Error('forbidden');
  }
  return user;
}
