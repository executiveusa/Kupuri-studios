import Stripe from 'stripe';
import { db, stripePayments, tokenBalances, tokenTransactions } from '../db/index';
import { eq } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { AppError } from '../middleware/errorHandler';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '');

export const STRIPE_PRICES = {
  starter: { id: process.env.STRIPE_PRICE_STARTER || 'price_starter', tokens: 1100, bonus: 0.1 },
  creator: { id: process.env.STRIPE_PRICE_CREATOR || 'price_creator', tokens: 6000, bonus: 0.2 },
  pro: { id: process.env.STRIPE_PRICE_PRO || 'price_pro', tokens: 20250, bonus: 0.35 },
  studio: { id: process.env.STRIPE_PRICE_STUDIO || 'price_studio', tokens: 75000, bonus: 0.5 },
};

export class StripeService {
  async createCheckoutSession(userId: string, priceId: string, packageId: string): Promise<{ sessionId: string; url: string }> {
    try {
      const user = await db.query.users.findFirst({
        where: (users, { eq }) => eq(users.id, userId),
      });

      if (!user) {
        throw new AppError('User not found', 'USER_NOT_FOUND', 404);
      }

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        mode: 'payment',
        success_url: `${process.env.WEB_BASE_URL || 'http://localhost:3000'}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.WEB_BASE_URL || 'http://localhost:3000'}/checkout/cancel`,
        customer_email: user.email,
        metadata: {
          userId,
          packageId,
        },
      });

      // Store session in DB
      await db.insert(stripePayments).values({
        id: session.id,
        userId,
        sessionId: session.id,
        packageId,
        amount: session.amount_total ? (session.amount_total / 100).toString() : '0',
        status: 'pending',
      });

      return {
        sessionId: session.id,
        url: session.url || '',
      };
    } catch (error) {
      console.error('Stripe checkout error:', error);
      throw new AppError('Failed to create checkout session', 'CHECKOUT_ERROR', 500);
    }
  }

  async handlePaymentSuccess(sessionId: string): Promise<void> {
    try {
      const session = await stripe.checkout.sessions.retrieve(sessionId);

      if (session.payment_status !== 'paid') {
        throw new Error('Payment not completed');
      }

      const userId = session.metadata?.userId;
      const packageId = session.metadata?.packageId as keyof typeof STRIPE_PRICES;

      if (!userId || !packageId) {
        throw new Error('Missing metadata');
      }

      const packageConfig = STRIPE_PRICES[packageId];
      if (!packageConfig) {
        throw new Error('Invalid package');
      }

      // Calculate tokens with bonus
      const baseTokens = packageConfig.tokens;
      const bonusTokens = Math.floor(baseTokens * packageConfig.bonus);
      const totalTokens = baseTokens + bonusTokens;

      // Update token balance
      const currentBalance = await db.query.tokenBalances.findFirst({
        where: eq(tokenBalances.userId, userId),
      });

      if (currentBalance) {
        await db
          .update(tokenBalances)
          .set({
            balance: (currentBalance.balance || 0) + totalTokens,
            earned: (currentBalance.earned || 0) + totalTokens,
            updatedAt: new Date(),
          })
          .where(eq(tokenBalances.userId, userId));
      }

      // Record transaction
      await db.insert(tokenTransactions).values({
        id: randomUUID(),
        userId,
        type: 'purchase',
        amount: totalTokens,
        reason: `Purchased ${packageId} package (${baseTokens} + ${bonusTokens} bonus)`,
        relatedId: sessionId,
      });

      // Update payment status
      await db
        .update(stripePayments)
        .set({
          status: 'completed',
          completedAt: new Date(),
        })
        .where(eq(stripePayments.id, sessionId));

      console.log(`Payment successful: User ${userId} received ${totalTokens} tokens`);
    } catch (error) {
      console.error('Payment success handling error:', error);
      throw error;
    }
  }

  async verifyWebhookSignature(body: string, signature: string): Promise<Stripe.Event> {
    try {
      return stripe.webhooks.constructEvent(
        body,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET || ''
      );
    } catch (error) {
      throw new AppError('Invalid webhook signature', 'WEBHOOK_ERROR', 400);
    }
  }
}

export const stripeService = new StripeService();
