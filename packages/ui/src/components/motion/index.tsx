import * as React from 'react';
import { motion, AnimatePresence, type MotionProps, type Variants } from 'motion/react';
import { cn } from '../../utils/cn';

/**
 * Motion Primitives - Shared animation components for Kupuri Studios ecosystem
 * These provide consistent animations across all bubble apps (JAAZ, POSTIZ, etc)
 */

// ============================================================================
// FADE IN
// ============================================================================
interface FadeInProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  direction?: 'up' | 'down' | 'left' | 'right' | 'none';
  distance?: number;
}

export function FadeIn({
  children,
  delay = 0,
  duration = 0.4,
  direction = 'up',
  distance = 20,
  className,
  ...props
}: FadeInProps) {
  const directions = {
    up: { y: distance },
    down: { y: -distance },
    left: { x: distance },
    right: { x: -distance },
    none: {}
  };

  return (
    <motion.div
      initial={{ opacity: 0, ...directions[direction] }}
      animate={{ opacity: 1, x: 0, y: 0 }}
      transition={{ duration, delay, ease: 'easeOut' }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}

// ============================================================================
// SCALE IN
// ============================================================================
interface ScaleInProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  initialScale?: number;
}

export function ScaleIn({
  children,
  delay = 0,
  duration = 0.3,
  initialScale = 0.9,
  className,
  ...props
}: ScaleInProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: initialScale }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration, delay, type: 'spring', stiffness: 300, damping: 25 }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}

// ============================================================================
// SLIDE IN
// ============================================================================
interface SlideInProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  direction?: 'up' | 'down' | 'left' | 'right';
  distance?: number | string;
}

export function SlideIn({
  children,
  delay = 0,
  duration = 0.4,
  direction = 'left',
  distance = '100%',
  className,
  ...props
}: SlideInProps) {
  const directions = {
    up: { y: distance },
    down: { y: typeof distance === 'number' ? -distance : `-${distance}` },
    left: { x: distance },
    right: { x: typeof distance === 'number' ? -distance : `-${distance}` }
  };

  return (
    <motion.div
      initial={{ ...directions[direction] }}
      animate={{ x: 0, y: 0 }}
      transition={{ duration, delay, type: 'spring', stiffness: 300, damping: 30 }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}

// ============================================================================
// STAGGER CONTAINER & CHILDREN
// ============================================================================
interface StaggerContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  staggerDelay?: number;
  initialDelay?: number;
}

export function StaggerContainer({
  children,
  staggerDelay = 0.1,
  initialDelay = 0,
  className,
  ...props
}: StaggerContainerProps) {
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        delayChildren: initialDelay,
        staggerChildren: staggerDelay
      }
    }
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}

interface StaggerItemProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  direction?: 'up' | 'down' | 'left' | 'right';
  distance?: number;
}

export function StaggerItem({
  children,
  direction = 'up',
  distance = 20,
  className,
  ...props
}: StaggerItemProps) {
  const directions = {
    up: { y: distance },
    down: { y: -distance },
    left: { x: distance },
    right: { x: -distance }
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, ...directions[direction] },
    visible: { opacity: 1, x: 0, y: 0 }
  };

  return (
    <motion.div variants={itemVariants} className={className} {...props}>
      {children}
    </motion.div>
  );
}

// ============================================================================
// ANIMATED CONTAINER
// ============================================================================
interface AnimatedContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  isVisible?: boolean;
  animation?: 'fade' | 'scale' | 'slide' | 'none';
}

export function AnimatedContainer({
  children,
  isVisible = true,
  animation = 'fade',
  className,
  ...props
}: AnimatedContainerProps) {
  const animations = {
    fade: {
      initial: { opacity: 0 },
      animate: { opacity: 1 },
      exit: { opacity: 0 }
    },
    scale: {
      initial: { opacity: 0, scale: 0.9 },
      animate: { opacity: 1, scale: 1 },
      exit: { opacity: 0, scale: 0.9 }
    },
    slide: {
      initial: { opacity: 0, y: 20 },
      animate: { opacity: 1, y: 0 },
      exit: { opacity: 0, y: -20 }
    },
    none: {
      initial: {},
      animate: {},
      exit: {}
    }
  };

  return (
    <AnimatePresence mode="wait">
      {isVisible && (
        <motion.div
          {...animations[animation]}
          transition={{ duration: 0.2 }}
          className={className}
          {...props}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ============================================================================
// HOVER SCALE
// ============================================================================
interface HoverScaleProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  scale?: number;
}

export function HoverScale({
  children,
  scale = 1.02,
  className,
  ...props
}: HoverScaleProps) {
  return (
    <motion.div
      whileHover={{ scale }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}

// ============================================================================
// PRESS SCALE
// ============================================================================
interface PressScaleProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  scale?: number;
}

export function PressScale({
  children,
  scale = 0.95,
  className,
  ...props
}: PressScaleProps) {
  return (
    <motion.div
      whileTap={{ scale }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}

// ============================================================================
// SKELETON LOADER
// ============================================================================
interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  width?: string | number;
  height?: string | number;
  rounded?: 'none' | 'sm' | 'md' | 'lg' | 'full';
}

export function Skeleton({
  width,
  height,
  rounded = 'md',
  className,
  ...props
}: SkeletonProps) {
  const roundedClasses = {
    none: 'rounded-none',
    sm: 'rounded-sm',
    md: 'rounded-md',
    lg: 'rounded-lg',
    full: 'rounded-full'
  };

  return (
    <motion.div
      className={cn(
        'bg-muted animate-pulse',
        roundedClasses[rounded],
        className
      )}
      style={{ width, height }}
      initial={{ opacity: 0.5 }}
      animate={{ opacity: [0.5, 1, 0.5] }}
      transition={{ duration: 1.5, repeat: Infinity }}
      {...props}
    />
  );
}

// ============================================================================
// PULSE
// ============================================================================
interface PulseProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  duration?: number;
}

export function Pulse({
  children,
  duration = 2,
  className,
  ...props
}: PulseProps) {
  return (
    <motion.div
      animate={{ opacity: [1, 0.5, 1] }}
      transition={{ duration, repeat: Infinity, ease: 'easeInOut' }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}

// ============================================================================
// SPIN
// ============================================================================
interface SpinProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  duration?: number;
}

export function Spin({
  children,
  duration = 1,
  className,
  ...props
}: SpinProps) {
  return (
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ duration, repeat: Infinity, ease: 'linear' }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}

// ============================================================================
// BOUNCE
// ============================================================================
interface BounceProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  height?: number;
  duration?: number;
}

export function Bounce({
  children,
  height = 10,
  duration = 0.6,
  className,
  ...props
}: BounceProps) {
  return (
    <motion.div
      animate={{ y: [0, -height, 0] }}
      transition={{ duration, repeat: Infinity, ease: 'easeInOut' }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}
