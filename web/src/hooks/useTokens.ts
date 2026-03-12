import { useCallback } from 'react';
import { useUserStore } from '@/store/useUserStore';

export const useTokens = () => {
  const { tokenBalance, fetchTokenBalance } = useUserStore();

  const refreshBalance = useCallback(async () => {
    await fetchTokenBalance();
  }, [fetchTokenBalance]);

  const hasEnoughTokens = useCallback(
    (required: number) => {
      return tokenBalance && tokenBalance.balance >= required;
    },
    [tokenBalance]
  );

  const getRemainingTokens = useCallback(
    (required: number) => {
      if (!tokenBalance) return 0;
      return Math.max(0, required - tokenBalance.balance);
    },
    [tokenBalance]
  );

  return {
    tokenBalance,
    balance: tokenBalance?.balance ?? 0,
    spent: tokenBalance?.spent ?? 0,
    earned: tokenBalance?.earned ?? 0,
    refreshBalance,
    hasEnoughTokens,
    getRemainingTokens,
  };
};
