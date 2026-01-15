import { useEffect, useRef, useState } from "react";
import { useMotionValue, useSpring, motion, useTransform, animate } from "framer-motion";
import { Coins } from "lucide-react";

interface CreditBalanceProps {
  balance: number;
  className?: string;
  showIcon?: boolean;
}

export function CreditBalance({ balance, className = "", showIcon = true }: CreditBalanceProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  
  // Motion value for the number
  const motionValue = useMotionValue(balance);
  const springValue = useSpring(motionValue, {
    stiffness: 100,
    damping: 10,
    mass: 1,
  });

  // Update effect
  useEffect(() => {
    if (motionValue.get() !== balance) {
      setIsUpdating(true);
      motionValue.set(balance);
      
      // Reset updating state after animation roughly finishes
      const timeout = setTimeout(() => setIsUpdating(false), 1000);
      return () => clearTimeout(timeout);
    }
  }, [balance, motionValue]);

  // Sync spring value to text content
  useEffect(() => {
    const unsubscribe = springValue.on("change", (latest) => {
      if (ref.current) {
        // Format with commas
        ref.current.textContent = Math.floor(latest).toLocaleString();
      }
    });
    return unsubscribe;
  }, [springValue]);

  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      {showIcon && (
        <motion.div
          animate={isUpdating ? { rotate: [0, 20, -20, 0], scale: [1, 1.2, 1] } : {}}
          transition={{ duration: 0.5 }}
        >
          <Coins className="w-5 h-5 text-yellow-400" />
        </motion.div>
      )}
      
      <span className="relative font-mono font-bold text-xl tracking-tight">
        <motion.span
          ref={ref}
          animate={isUpdating ? { 
            color: ["#FFFFFF", "#FACC15", "#FFFFFF"],
            textShadow: ["0px 0px 0px rgba(250, 204, 21, 0)", "0px 0px 10px rgba(250, 204, 21, 0.5)", "0px 0px 0px rgba(250, 204, 21, 0)"]
          } : {}}
          transition={{ duration: 0.8 }}
          className="bg-clip-text text-transparent bg-gradient-to-b from-white to-slate-300"
        >
          {balance.toLocaleString()}
        </motion.span>
        
        {/* Glow effect behind the number on update */}
        {isUpdating && (
          <motion.span
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: [0, 0.5, 0], scale: 1.5 }}
            transition={{ duration: 0.5 }}
            className="absolute inset-0 bg-yellow-500/20 blur-xl rounded-full -z-10"
          />
        )}
      </span>
    </div>
  );
}
