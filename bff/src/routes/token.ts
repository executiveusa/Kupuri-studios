import { Hono } from 'hono';
import { z } from 'zod';
import { tokenService } from '../services/tokenService';
import { getUser } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';

const app = new Hono();

// GET /api/tokens/balance
app.get('/balance', async (c) => {
  const user = getUser(c);
  const balance = await tokenService.getBalance(user.userId);
  return c.json(balance);
});

// GET /api/tokens/history
app.get('/history', async (c) => {
  const user = getUser(c);
  const limit = parseInt(c.req.query('limit') || '50');
  const history = await tokenService.getTransactionHistory(user.userId, limit);
  return c.json(history);
});

// GET /api/tokens/stats
app.get('/stats', async (c) => {
  const user = getUser(c);
  const stats = await tokenService.getUserStats(user.userId);
  return c.json(stats);
});

// POST /api/tokens/login-bonus
app.post('/login-bonus', async (c) => {
  const user = getUser(c);
  try {
    await tokenService.applyLoginBonus(user.userId);
    const balance = await tokenService.getBalance(user.userId);
    return c.json({ success: true, balance });
  } catch (error) {
    throw new AppError('Failed to apply login bonus', 'LOGIN_BONUS_ERROR', 500);
  }
});

// POST /api/tokens/referral
const referralSchema = z.object({
  newUserId: z.string(),
});

app.post('/referral', async (c) => {
  const user = getUser(c);
  const body = referralSchema.parse(await c.req.json());

  try {
    await tokenService.applyReferralBonus(user.userId, body.newUserId);
    return c.json({ success: true, message: 'Referral bonus applied' });
  } catch (error) {
    throw new AppError('Failed to apply referral bonus', 'REFERRAL_ERROR', 500);
  }
});

export default app;
