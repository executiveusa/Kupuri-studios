import { Hono } from 'hono';
import { z } from 'zod';
import { stripeService, STRIPE_PRICES } from '../services/stripeService';
import { getUser } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';

const app = new Hono();

// GET /api/stripe/prices
app.get('/prices', async (c) => {
  const prices = Object.entries(STRIPE_PRICES).map(([key, value]) => ({
    id: key,
    ...value,
  }));
  return c.json(prices);
});

// POST /api/stripe/checkout
const checkoutSchema = z.object({
  packageId: z.enum(['starter', 'creator', 'pro', 'studio']),
});

app.post('/checkout', async (c) => {
  const user = getUser(c);
  const body = checkoutSchema.parse(await c.req.json());

  try {
    const packageConfig = STRIPE_PRICES[body.packageId as keyof typeof STRIPE_PRICES];
    if (!packageConfig) {
      throw new AppError('Invalid package', 'INVALID_PACKAGE', 400);
    }

    const result = await stripeService.createCheckoutSession(
      user.userId,
      packageConfig.id,
      body.packageId
    );

    return c.json(result);
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError('Failed to create checkout session', 'CHECKOUT_ERROR', 500);
  }
});

// POST /api/stripe/webhook
app.post('/webhook', async (c) => {
  const body = await c.req.text();
  const signature = c.req.header('stripe-signature');

  if (!signature) {
    throw new AppError('Missing stripe-signature header', 'MISSING_SIGNATURE', 400);
  }

  try {
    const event = await stripeService.verifyWebhookSignature(body, signature);

    // Handle payment success
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as any;
      if (session.payment_status === 'paid') {
        await stripeService.handlePaymentSuccess(session.id);
        console.log(`✓ Payment completed: ${session.id}`);
      }
    }

    return c.json({ received: true });
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError('Webhook processing failed', 'WEBHOOK_ERROR', 500);
  }
});

// GET /api/stripe/session/:sessionId (for debugging)
app.get('/session/:sessionId', async (c) => {
  const user = getUser(c);
  const { sessionId } = c.req.param();

  try {
    // For MVP, just return mock status
    return c.json({
      sessionId,
      status: 'completed',
      paymentStatus: 'paid',
      message: 'Payment verified',
    });
  } catch (error) {
    throw new AppError('Failed to retrieve session', 'SESSION_ERROR', 500);
  }
});

export default app;
