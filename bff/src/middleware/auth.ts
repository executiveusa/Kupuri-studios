import { Context, Next } from 'hono';
import { verify } from 'jsonwebtoken';
import { AppError } from './errorHandler';

export interface JWTPayload {
  userId: string;
  email: string;
  iat: number;
  exp: number;
}

export interface AuthContext extends Context {
  user?: JWTPayload;
}

export const authMiddleware = async (c: Context, next: Next) => {
  const token = extractToken(c);

  if (!token) {
    throw new AppError('Missing authorization token', 'MISSING_TOKEN', 401);
  }

  try {
    const payload = verify(token, process.env.JWT_SECRET || 'secret') as JWTPayload;
    (c as any).user = payload;
    await next();
  } catch (err) {
    if (err instanceof Error && err.message === 'jwt expired') {
      throw new AppError('Token expired', 'TOKEN_EXPIRED', 401);
    }
    throw new AppError('Invalid token', 'INVALID_TOKEN', 401);
  }
};

export const optionalAuthMiddleware = async (c: Context, next: Next) => {
  const token = extractToken(c);

  if (token) {
    try {
      const payload = verify(token, process.env.JWT_SECRET || 'secret') as JWTPayload;
      (c as any).user = payload;
    } catch (err) {
      // Silently fail - user will be undefined
    }
  }

  await next();
};

function extractToken(c: Context): string | null {
  const header = c.req.header('Authorization');
  if (!header) return null;

  const [scheme, token] = header.split(' ');
  if (scheme !== 'Bearer' || !token) return null;

  return token;
}

export const getUser = (c: Context): JWTPayload => {
  const user = (c as any).user;
  if (!user) {
    throw new AppError('User not authenticated', 'NOT_AUTHENTICATED', 401);
  }
  return user;
};
