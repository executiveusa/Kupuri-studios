import { useState, useCallback } from 'react';

interface Toast {
  id: string;
  title?: string;
  description?: string;
  variant?: 'default' | 'destructive' | 'success';
  duration?: number;
}

interface ToastState {
  toasts: Toast[];
}

let toastCount = 0;

function genId() {
  toastCount = (toastCount + 1) % Number.MAX_SAFE_INTEGER;
  return toastCount.toString();
}

export function useToast() {
  const [state, setState] = useState<ToastState>({ toasts: [] });

  const toast = useCallback(
    ({ title, description, variant = 'default', duration = 5000 }: Omit<Toast, 'id'>) => {
      const id = genId();
      const newToast: Toast = { id, title, description, variant, duration };
      
      setState((prev) => ({
        toasts: [...prev.toasts, newToast],
      }));

      // Auto dismiss
      setTimeout(() => {
        setState((prev) => ({
          toasts: prev.toasts.filter((t) => t.id !== id),
        }));
      }, duration);

      return { id, dismiss: () => dismiss(id) };
    },
    []
  );

  const dismiss = useCallback((toastId?: string) => {
    setState((prev) => ({
      toasts: toastId 
        ? prev.toasts.filter((t) => t.id !== toastId)
        : [],
    }));
  }, []);

  return {
    toasts: state.toasts,
    toast,
    dismiss,
  };
}

export type { Toast };