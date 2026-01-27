import { Hono } from 'hono';
import { z } from 'zod';
import { UserService } from '../services/userService';
import { getUser } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';

const router = new Hono();

const UpdateProfileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').optional(),
  avatar: z.string().url('Invalid image URL').optional(),
});

const ChangePasswordSchema = z.object({
  currentPassword: z.string().min(8, 'Current password is required'),
  newPassword: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

// GET user profile (protected)
router.get('/profile', async (c) => {
  try {
    const user = getUser(c);
    const profile = await UserService.getProfile(user.userId);

    return c.json({
      success: true,
      data: profile,
    });
  } catch (err) {
    throw err;
  }
});

// UPDATE profile (protected)
router.put('/profile', async (c) => {
  try {
    const user = getUser(c);
    const body = await c.req.json();
    const data = UpdateProfileSchema.parse(body);

    const updatedUser = await UserService.updateProfile(user.userId, data);

    return c.json({
      success: true,
      data: updatedUser,
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      throw new AppError('Validation failed', 'VALIDATION_ERROR', 400, {
        errors: err.errors,
      });
    }
    throw err;
  }
});

// CHANGE password (protected)
router.post('/change-password', async (c) => {
  try {
    const user = getUser(c);
    const body = await c.req.json();
    const data = ChangePasswordSchema.parse(body);

    await UserService.changePassword(user.userId, data.currentPassword, data.newPassword);

    return c.json({
      success: true,
      message: 'Password changed successfully',
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      throw new AppError('Validation failed', 'VALIDATION_ERROR', 400, {
        errors: err.errors,
      });
    }
    throw err;
  }
});

// GET token balance (protected)
router.get('/tokens/balance', async (c) => {
  try {
    const user = getUser(c);
    const balance = await UserService.getTokenBalance(user.userId);

    return c.json({
      success: true,
      data: balance,
    });
  } catch (err) {
    throw err;
  }
});

export default router;
