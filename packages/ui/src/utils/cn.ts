import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Utility function for combining Tailwind CSS classes
 * Used by all @kupuri/ui components for consistent styling
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
