import { Hono } from 'hono';
import { z } from 'zod';
import { db, users, tokenBalances } from '../db/index';
import { eq } from 'drizzle-orm';
import { sign } from 'jsonwebtoken';
import { randomUUID } from 'crypto';
import crypto from 'crypto';
import { AppError } from '../middleware/errorHandler';
import { getUser } from '../middleware/auth';
import { tokenService } from '../services/tokenService';

const app = new Hono();

const registerSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1).max(255),
  password: z.string().min(8),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

const passwordChangeSchema = z.object({
  currentPassword: z.string(),
  newPassword: z.string().min(8),
});

// Helper to hash password
function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

// Helper to generate JWT
function generateToken(userId: string, email: string): string {
  return sign(
    { userId, email },
    process.env.JWT_SECRET || 'secret',
    { expiresIn: '24h' }
  );
}

// POST /api/auth/register
app.post('/register', async (c) => {
  try {
    const body = registerSchema.parse(await c.req.json());

    // Check if email exists
    const existing = await db.query.users.findFirst({
      where: eq(users.email, body.email),
    });

    if (existing) {
      throw new AppError('Email already registered', 'EMAIL_EXISTS', 409);
    }

    const userId = randomUUID();
    const passwordHash = hashPassword(body.password);

    // Create user
    await db.insert(users).values({
      id: userId,
      email: body.email,
      name: body.name,
      passwordHash,
    });

    // Initialize token balance with sign-up bonus
    await db.insert(tokenBalances).values({
      userId,
      balance: 1100,
      spent: 0,
      earned: 1100,
    });

    // Record the sign-up bonus transaction
    await tokenService.addTokens(userId, 1100, 'Sign-up bonus', undefined, 'bonus');

    const token = generateToken(userId, body.email);

    return c.json(
      {
        success: true,
        message: 'Registration successful',
        token,
        user: {
          id: userId,
          email: body.email,
          name: body.name,
        },
      },
      201
    );
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError('Registration failed', 'REGISTRATION_ERROR', 500);
  }
});

// POST /api/auth/login
app.post('/login', async (c) => {
  try {
    const body = loginSchema.parse(await c.req.json());

    const user = await db.query.users.findFirst({
      where: eq(users.email, body.email),
    });

    if (!user) {
      throw new AppError('Invalid email or password', 'INVALID_CREDENTIALS', 401);
    }

    const passwordHash = hashPassword(body.password);
    if (user.passwordHash !== passwordHash) {
      throw new AppError('Invalid email or password', 'INVALID_CREDENTIALS', 401);
    }

    const token = generateToken(user.id, user.email);

    return c.json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    });
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError('Login failed', 'LOGIN_ERROR', 500);
  }
});

// POST /api/auth/change-password
app.post('/change-password', async (c) => {
  const user = getUser(c);

  try {
    const body = passwordChangeSchema.parse(await c.req.json());

    const currentUser = await db.query.users.findFirst({
      where: eq(users.id, user.userId),
    });

    if (!currentUser) {
      throw new AppError('User not found', 'USER_NOT_FOUND', 404);
    }

    const currentHash = hashPassword(body.currentPassword);
    if (currentUser.passwordHash !== currentHash) {
      throw new AppError('Current password is incorrect', 'INVALID_PASSWORD', 401);
    }

    const newHash = hashPassword(body.newPassword);
    await db
      .update(users)
      .set({ passwordHash: newHash })
      .where(eq(users.id, user.userId));

    return c.json({ success: true, message: 'Password changed successfully' });
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError('Password change failed', 'PASSWORD_CHANGE_ERROR', 500);
  }
});

export default app;
