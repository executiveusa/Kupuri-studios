import { db, users, tokenBalances } from '../db/index';
import { eq } from 'drizzle-orm';
import { AppError } from '../middleware/errorHandler';
import type { User, TokenBalance } from '@kupuri/types';
import bcrypt from 'bcrypt';

export class UserService {
  static async getUserProfile(userId: string): Promise<User> {
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    if (!user) {
      throw new AppError('User not found', 'USER_NOT_FOUND', 404);
    }

    return this.mapUserFromDB(user);
  }

  static async updateProfile(
    userId: string,
    updates: { name?: string; avatar?: string }
  ): Promise<User> {
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    if (!user) {
      throw new AppError('User not found', 'USER_NOT_FOUND', 404);
    }

    const updateData: Record<string, any> = {
      updatedAt: new Date(),
    };

    if (updates.name) updateData.name = updates.name;
    if (updates.avatar) updateData.avatar = updates.avatar;

    try {
      await db.update(users).set(updateData).where(eq(users.id, userId));

      return this.getUserProfile(userId);
    } catch (error) {
      throw new AppError('Failed to update profile', 'PROFILE_UPDATE_FAILED', 500);
    }
  }

  static async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string
  ): Promise<void> {
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    if (!user) {
      throw new AppError('User not found', 'USER_NOT_FOUND', 404);
    }

    // Verify current password
    const isValidPassword = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isValidPassword) {
      throw new AppError('Current password is incorrect', 'INVALID_PASSWORD', 401);
    }

    // Hash new password
    const passwordHash = await bcrypt.hash(newPassword, 10);

    try {
      await db
        .update(users)
        .set({
          passwordHash,
          updatedAt: new Date(),
        })
        .where(eq(users.id, userId));
    } catch (error) {
      throw new AppError('Failed to change password', 'PASSWORD_CHANGE_FAILED', 500);
    }
  }

  static async getTokenBalance(userId: string): Promise<TokenBalance> {
    const balance = await db.query.tokenBalances.findFirst({
      where: eq(tokenBalances.userId, userId),
    });

    if (!balance) {
      throw new AppError('Token balance not found', 'BALANCE_NOT_FOUND', 404);
    }

    return {
      userId: balance.userId,
      balance: balance.balance,
      spent: balance.spent,
      earned: balance.earned,
      updatedAt: balance.updatedAt,
    };
  }

  static async getProfile(userId: string): Promise<{
    user: User;
    tokenBalance: TokenBalance;
  }> {
    const user = await this.getUserProfile(userId);
    const tokenBalance = await this.getTokenBalance(userId);

    return {
      user,
      tokenBalance,
    };
  }

  private static mapUserFromDB(dbUser: any): User {
    return {
      id: dbUser.id,
      email: dbUser.email,
      name: dbUser.name,
      avatar: dbUser.avatar || undefined,
      createdAt: dbUser.createdAt,
      updatedAt: dbUser.updatedAt,
    };
  }
}
