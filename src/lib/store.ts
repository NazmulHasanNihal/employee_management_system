import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ToastVariant = 'success' | 'error' | 'warn' | 'info';

export interface ToastItem {
  id: string;
  title: string;
  description?: string;
  variant: ToastVariant;
}

interface AppState {
  isOffline: boolean;
  offlineQueue: number;
  language: 'en' | 'bn';
  toasts: ToastItem[];
  setOffline: (offline: boolean) => void;
  incrementOfflineQueue: () => void;
  clearOfflineQueue: () => void;
  setLanguage: (lang: 'en' | 'bn') => void;
  pushToast: (toast: Omit<ToastItem, 'id'>) => void;
  dismissToast: (id: string) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      isOffline: false,
      offlineQueue: 0,
      language: 'en',
      toasts: [],
      setOffline: (offline) => set({ isOffline: offline }),
      incrementOfflineQueue: () => set((state) => ({ offlineQueue: state.offlineQueue + 1 })),
      clearOfflineQueue: () => set({ offlineQueue: 0 }),
      setLanguage: (lang) => set({ language: lang }),
      pushToast: (toast) =>
        set((state) => ({
          toasts: [...state.toasts, { ...toast, id: Math.random().toString(36).slice(2) }],
        })),
      dismissToast: (id) =>
        set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
    }),
    {
      name: 'ems-app-store',
      partialize: (state) => ({ language: state.language }),
    }
  )
);
