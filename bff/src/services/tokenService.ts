import { db, tokenBalances, tokenTransactions, users } from '../db/index';
import { eq } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { AppError } from '../middleware/errorHandler';

export interface TokenBalance {
  userId: string;
  balance: number;
  spent: number;
  earned: number;
  updatedAt: Date;
}

export interface TokenTransaction {
  id: string;
  userId: string;
  type: 'purchase' | 'spend' | 'bonus' | 'refund';
  amount: number;
  reason: string;
  relatedId?: string;
  createdAt: Date;
}

export class TokenService {
  // Get current token balance for user
  async getBalance(userId: string): Promise<TokenBalance> {
    const balance = await db.query.tokenBalances.findFirst({
      where: eq(tokenBalances.userId, userId),
    });

    if (!balance) {
      // Create initial balance if doesn't exist
      await db.insert(tokenBalances).values({
        userId,
        balance: 1100, // Sign-up bonus
        spent: 0,
        earned: 1100,
      });

      return {
        userId,
        balance: 1100,
        spent: 0,
        earned: 1100,
        updatedAt: new Date(),
      };
    }

    return balance;
  }

  // Deduct tokens from user balance
  async deductTokens(userId: string, amount: number, reason: string, relatedId?: string): Promise<void> {
    const balance = await this.getBalance(userId);

    if (balance.balance < amount) {
      throw new AppError(
        `Insufficient tokens. Required: ${amount}, Available: ${balance.balance}`,
        'INSUFFICIENT_TOKENS',
        402
      );
    }

    // Update balance
    await db
      .update(tokenBalances)
      .set({
        balance: balance.balance - amount,
        spent: (balance.spent || 0) + amount,
        updatedAt: new Date(),
      })
      .where(eq(tokenBalances.userId, userId));

    // Record transaction
    await db.insert(tokenTransactions).values({
      id: randomUUID(),
      userId,
      type: 'spend',
      amount,
      reason,
      relatedId,
    });
  }

  // Add tokens to user balance
  async addTokens(userId: string, amount: number, reason: string, relatedId?: string, type: 'purchase' | 'bonus' = 'bonus'): Promise<void> {
    const balance = await this.getBalance(userId);

    await db
      .update(tokenBalances)
      .set({
        balance: balance.balance + amount,
        earned: (balance.earned || 0) + amount,
        updatedAt: new Date(),
      })
      .where(eq(tokenBalances.userId, userId));

    // Record transaction
    await db.insert(tokenTransactions).values({
      id: randomUUID(),
      userId,
      type,
      amount,
      reason,
      relatedId,
    });
  }

  // Refund tokens
  async refundTokens(userId: string, amount: number, reason: string, relatedId?: string): Promise<void> {
    const balance = await this.getBalance(userId);

    await db
      .update(tokenBalances)
      .set({
        balance: balance.balance + amount,
        spent: Math.max(0, (balance.spent || 0) - amount),
        updatedAt: new Date(),
      })
      .where(eq(tokenBalances.userId, userId));

    // Record transaction
    await db.insert(tokenTransactions).values({
      id: randomUUID(),
      userId,
      type: 'refund',
      amount,
      reason,
      relatedId,
    });
  }

  // Get transaction history
  async getTransactionHistory(userId: string, limit: number = 50): Promise<TokenTransaction[]> {
    return await db.query.tokenTransactions.findMany({
      where: eq(tokenTransactions.userId, userId),
      limit,
      orderBy: (transactions, { desc }) => [desc(transactions.createdAt)],
    });
  }

  // Get user statistics
  async getUserStats(userId: string): Promise<{
    balance: number;
    totalEarned: number;
    totalSpent: number;
    transactionCount: number;
  }> {
    const balance = await this.getBalance(userId);
    const transactions = await db.query.tokenTransactions.findMany({
      where: eq(tokenTransactions.userId, userId),
    });

    return {
      balance: balance.balance,
      totalEarned: balance.earned || 0,
      totalSpent: balance.spent || 0,
      transactionCount: transactions.length,
    };
  }

  // Apply login bonus
  async applyLoginBonus(userId: string): Promise<void> {
    // Check if user already got bonus today
    const today = new Date().toDateString();
    const lastBonus = await db.query.tokenTransactions.findFirst({
      where: (tx, { eq, and }) =>
        and(
          eq(tx.userId, userId),
          eq(tx.type, 'bonus'),
        ),
      orderBy: (tx, { desc }) => [desc(tx.createdAt)],
    });

    if (lastBonus) {
      const lastDate = lastBonus.createdAt?.toDateString();
      if (lastDate === today) {
        // Already got bonus today
        return;
      }
    }

    // Add 10 token login bonus
    await this.addTokens(userId, 10, 'Daily login bonus');
  }

  // Apply referral bonus
  async applyReferralBonus(referrerId: string, newUserId: string): Promise<void> {
    await this.addTokens(referrerId, 100, 'Referral bonus', newUserId, 'bonus');
  }
}

export const tokenService = new TokenService();
