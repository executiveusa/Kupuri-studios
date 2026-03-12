import { Hono } from 'hono';
import { z } from 'zod';
import { db, users } from '../db/index';
import { eq } from 'drizzle-orm';
import { getUser } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';

const app = new Hono();

const updateProfileSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  avatar: z.string().optional(),
});

// GET /api/user/profile - Get user profile
app.get('/profile', async (c) => {
  const user = getUser(c);

  try {
    const profile = await db.query.users.findFirst({
      where: eq(users.id, user.userId),
    });

    if (!profile) {
      throw new AppError('User not found', 'USER_NOT_FOUND', 404);
    }

    // Remove password hash from response
    const { passwordHash, ...safeProfile } = profile;
    return c.json(safeProfile);
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError('Failed to fetch profile', 'PROFILE_FETCH_ERROR', 500);
  }
});

// PUT /api/user/profile - Update user profile
app.put('/profile', async (c) => {
  const user = getUser(c);
  const body = updateProfileSchema.parse(await c.req.json());

  try {
    const profile = await db.query.users.findFirst({
      where: eq(users.id, user.userId),
    });

    if (!profile) {
      throw new AppError('User not found', 'USER_NOT_FOUND', 404);
    }

    await db
      .update(users)
      .set({
        name: body.name || profile.name,
        avatar: body.avatar !== undefined ? body.avatar : profile.avatar,
        updatedAt: new Date(),
      })
      .where(eq(users.id, user.userId));

    const updated = await db.query.users.findFirst({
      where: eq(users.id, user.userId),
    });

    if (!updated) {
      throw new AppError('Failed to fetch updated profile', 'PROFILE_UPDATE_ERROR', 500);
    }

    // Remove password hash from response
    const { passwordHash, ...safeProfile } = updated;
    return c.json(safeProfile);
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError('Failed to update profile', 'PROFILE_UPDATE_ERROR', 500);
  }
});

// DELETE /api/user/account - Delete user account
app.delete('/account', async (c) => {
  const user = getUser(c);

  try {
    const profile = await db.query.users.findFirst({
      where: eq(users.id, user.userId),
    });

    if (!profile) {
      throw new AppError('User not found', 'USER_NOT_FOUND', 404);
    }

    await db.delete(users).where(eq(users.id, user.userId));

    return c.json({ success: true, message: 'Account deleted' });
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError('Failed to delete account', 'ACCOUNT_DELETE_ERROR', 500);
  }
});

export default app;
