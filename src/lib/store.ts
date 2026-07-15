import { create } from 'zustand';

interface AppState {
  isOffline: boolean;
  offlineQueue: number;
  language: 'en' | 'bn';
  setOffline: (offline: boolean) => void;
  incrementOfflineQueue: () => void;
  clearOfflineQueue: () => void;
  setLanguage: (lang: 'en' | 'bn') => void;
}

export const useAppStore = create<AppState>((set) => ({
  isOffline: false,
  offlineQueue: 0,
  language: 'en',
  setOffline: (offline) => set({ isOffline: offline }),
  incrementOfflineQueue: () => set((state) => ({ offlineQueue: state.offlineQueue + 1 })),
  clearOfflineQueue: () => set({ offlineQueue: 0 }),
  setLanguage: (lang) => set({ language: lang }),
}));
