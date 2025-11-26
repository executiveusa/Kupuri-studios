import { sign, verify } from 'jsonwebtoken';
import { randomUUID } from 'crypto';
import bcrypt from 'bcrypt';
import { db, users, tokenBalances } from '../db/index';
import { eq } from 'drizzle-orm';
import { AppError } from '../middleware/errorHandler';

export interface JWTPayload {
  userId: string;
  email: string;
  iat: number;
  exp: number;
}

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRY = process.env.JWT_EXPIRY || '7d';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key';
const JWT_REFRESH_EXPIRY = process.env.JWT_REFRESH_EXPIRY || '30d';

export class AuthService {
  static generateToken(userId: string, email: string): string {
    return sign(
      {
        userId,
        email,
      },
      JWT_SECRET,
      {
        expiresIn: JWT_EXPIRY,
      }
    );
  }

  static generateRefreshToken(userId: string): string {
    return sign({ userId }, JWT_REFRESH_SECRET, {
      expiresIn: JWT_REFRESH_EXPIRY,
    });
  }

  static verifyToken(token: string): JWTPayload {
    try {
      return verify(token, JWT_SECRET) as JWTPayload;
    } catch (err) {
      throw new AppError('Invalid or expired token', 'INVALID_TOKEN', 401);
    }
  }

  static verifyRefreshToken(token: string): { userId: string } {
    try {
      return verify(token, JWT_REFRESH_SECRET) as { userId: string };
    } catch (err) {
      throw new AppError('Invalid or expired refresh token', 'INVALID_REFRESH_TOKEN', 401);
    }
  }

  static async register(email: string, password: string, name: string) {
    // Check if user already exists
    const existingUser = await db.query.users.findFirst({
      where: eq(users.email, email),
    });

    if (existingUser) {
      throw new AppError('Email already registered', 'EMAIL_EXISTS', 409);
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user
    const userId = randomUUID();
    try {
      await db.insert(users).values({
        id: userId,
        email,
        name,
        passwordHash,
      });

      // Create token balance record
      await db.insert(tokenBalances).values({
        userId,
        balance: 1100, // Starter package (10% bonus)
        spent: 0,
        earned: 1100,
      });
    } catch (error) {
      throw new AppError('Failed to create user', 'USER_CREATION_FAILED', 500);
    }

    const token = this.generateToken(userId, email);
    const refreshToken = this.generateRefreshToken(userId);

    return {
      token,
      refreshToken,
      user: {
        id: userId,
        email,
        name,
      },
    };
  }

  static async login(email: string, password: string) {
    // Find user
    const user = await db.query.users.findFirst({
      where: eq(users.email, email),
    });

    if (!user) {
      throw new AppError('Invalid email or password', 'AUTH_FAILED', 401);
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.passwordHash);

    if (!isValidPassword) {
      throw new AppError('Invalid email or password', 'AUTH_FAILED', 401);
    }

    const token = this.generateToken(user.id, user.email);
    const refreshToken = this.generateRefreshToken(user.id);

    return {
      token,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    };
  }

  static async refreshToken(refreshToken: string) {
    const payload = this.verifyRefreshToken(refreshToken);

    const user = await db.query.users.findFirst({
      where: eq(users.id, payload.userId),
    });

    if (!user) {
      throw new AppError('User not found', 'USER_NOT_FOUND', 404);
    }

    const newToken = this.generateToken(user.id, user.email);
    const newRefreshToken = this.generateRefreshToken(user.id);

    return {
      token: newToken,
      refreshToken: newRefreshToken,
    };
  }
}
