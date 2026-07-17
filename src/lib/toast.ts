'use client';

import { useAppStore, type ToastVariant } from '@/lib/store';

/**
 * Imperative toast API usable from anywhere in a client component:
 *   import { toast } from '@/lib/toast';
 *   toast.success('Saved', 'Record updated');
 *
 * It writes into the global zustand store; the <Toast /> UI renders the stack.
 */
export const toast = {
  push: (title: string, description?: string, variant: ToastVariant = 'info') =>
    useAppStore.getState().pushToast({ title, description, variant }),
  success: (title: string, description?: string) => toast.push(title, description, 'success'),
  error: (title: string, description?: string) => toast.push(title, description, 'error'),
  warn: (title: string, description?: string) => toast.push(title, description, 'warn'),
  info: (title: string, description?: string) => toast.push(title, description, 'info'),
};
