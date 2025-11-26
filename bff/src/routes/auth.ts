import { Hono } from 'hono';
import { z } from 'zod';
import { AuthService } from '../services/authService';
import { AppError } from '../middleware/errorHandler';

const router = new Hono();

const LoginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

const RegisterSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
});

const RefreshSchema = z.object({
  refreshToken: z.string(),
});

router.post('/login', async (c) => {
  try {
    const body = await c.req.json();
    const data = LoginSchema.parse(body);

    const result = await AuthService.login(data.email, data.password);

    return c.json({
      success: true,
      data: result,
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

router.post('/register', async (c) => {
  try {
    const body = await c.req.json();
    const data = RegisterSchema.parse(body);

    const result = await AuthService.register(data.email, data.password, data.name);

    return c.json({
      success: true,
      data: result,
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

router.post('/refresh', async (c) => {
  try {
    const body = await c.req.json();
    const data = RefreshSchema.parse(body);

    const result = await AuthService.refreshToken(data.refreshToken);

    return c.json({
      success: true,
      data: result,
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

router.post('/logout', async (c) => {
  // Client-side cleanup handled by frontend
  return c.json({
    success: true,
    message: 'Logged out successfully',
  });
});

export default router;
