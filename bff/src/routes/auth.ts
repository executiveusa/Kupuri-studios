import { Hono } from 'hono';
import { z } from 'zod';

const router = new Hono();

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

const RegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(2),
});

router.post('/login', async (c) => {
  // TODO: Implement login
  return c.json({ message: 'Login endpoint' });
});

router.post('/register', async (c) => {
  // TODO: Implement registration
  return c.json({ message: 'Register endpoint' });
});

router.post('/refresh', async (c) => {
  // TODO: Implement token refresh
  return c.json({ message: 'Refresh endpoint' });
});

router.post('/logout', async (c) => {
  return c.json({ message: 'Logged out' });
});

export default router;
