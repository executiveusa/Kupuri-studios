/**
 * @kupuri/ui - Shared UI Component Library
 * 
 * Motion-enhanced components for the Kupuri Studios ecosystem
 * Used across all bubble apps: JAAZ, POSTIZ, Designer, Analytics
 */

// Utils
export { cn } from './utils/cn';

// Core Components
export { Button, buttonVariants } from './components/Button';
export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from './components/Card';
export { Input } from './components/Input';
export { Modal, ModalBody, ModalFooter, ConfirmModal } from './components/Modal';
export { Tabs, TabPanel, TabsContainer } from './components/Tabs';
export { Badge, StatusBadge, TokenBadge, PlanBadge } from './components/Badge';
export { Avatar, AvatarGroup } from './components/Avatar';
export { Dropdown, DropdownItem, DropdownSeparator, DropdownLabel, Select } from './components/Dropdown';
export { Toast, ToastContainer, useToast } from './components/Toast';
export { 
  Spinner, 
  Progress, 
  LoadingDots, 
  SkeletonLoader, 
  PageLoader, 
  CircularProgress 
} from './components/Loading';

// Ecosystem Components (shared across all bubbles)
export { TokenBalance } from './components/ecosystem/TokenBalance';
export { BubbleSwitcher, defaultBubbles } from './components/ecosystem/BubbleSwitcher';
export { UserMenu } from './components/ecosystem/UserMenu';
export { EcosystemPanel } from './components/ecosystem/EcosystemPanel';

// Motion Primitives
export {
  FadeIn,
  ScaleIn,
  SlideIn,
  StaggerContainer,
  StaggerItem,
  AnimatedContainer,
  HoverScale,
  PressScale,
  Skeleton,
  Pulse,
  Spin,
  Bounce
} from './components/motion';

// Re-export motion/react for convenience
export { motion, AnimatePresence } from 'motion/react';

// Re-export CVA for variant creation
export { cva, type VariantProps } from 'class-variance-authority';

// Types
export type { ButtonProps } from './components/Button';
export type { ToastProps } from './components/Toast';
