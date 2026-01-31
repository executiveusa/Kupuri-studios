import * as React from 'react';
import { motion } from 'motion/react';
import { cn } from '../../utils/cn';

interface TokenBalanceProps {
  balance: number;
  breakdown?: Record<string, number>;
  onRecharge?: () => void;
  className?: string;
}

/**
 * TokenBalance - Shared component for displaying token balance across all bubbles
 * Shows unified token economy balance that spans JAAZ, POSTIZ, and all bubbles
 */
export function TokenBalance({ 
  balance, 
  breakdown, 
  onRecharge,
  className 
}: TokenBalanceProps) {
  const isLowBalance = balance < 100;
  
  return (
    <motion.div
      className={cn(
        'rounded-lg border bg-card p-3 shadow-sm',
        isLowBalance && 'border-yellow-500/50 bg-yellow-50/10',
        className
      )}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2 }}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-muted-foreground">Token Balance</p>
          <p className={cn(
            'text-xl font-bold',
            isLowBalance ? 'text-yellow-600' : 'text-foreground'
          )}>
            {balance.toLocaleString()}
          </p>
        </div>
        {onRecharge && (
          <motion.button
            onClick={onRecharge}
            className="rounded-md bg-gradient-to-r from-purple-600 to-pink-600 px-3 py-1.5 text-xs font-medium text-white shadow-sm"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            + Recharge
          </motion.button>
        )}
      </div>
      
      {breakdown && Object.keys(breakdown).length > 0 && (
        <div className="mt-2 border-t pt-2">
          <p className="mb-1 text-xs text-muted-foreground">Usage by Bubble</p>
          <div className="flex flex-wrap gap-2">
            {Object.entries(breakdown).map(([bubble, used]) => (
              <span
                key={bubble}
                className="inline-flex items-center rounded-full bg-secondary px-2 py-0.5 text-xs"
              >
                <span className="font-medium capitalize">{bubble}:</span>
                <span className="ml-1">{used}</span>
              </span>
            ))}
          </div>
        </div>
      )}
      
      {isLowBalance && (
        <motion.p
          className="mt-2 text-xs text-yellow-600"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          ⚠️ Low balance - Recharge to continue using services
        </motion.p>
      )}
    </motion.div>
  );
}
