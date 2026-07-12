import { create } from 'zustand';

interface AppState {
  isOffline: boolean;
  offlineQueue: number;
  setOffline: (offline: boolean) => void;
  incrementOfflineQueue: () => void;
  clearOfflineQueue: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  isOffline: false,
  offlineQueue: 0,
  setOffline: (offline) => set({ isOffline: offline }),
  incrementOfflineQueue: () => set((state) => ({ offlineQueue: state.offlineQueue + 1 })),
  clearOfflineQueue: () => set({ offlineQueue: 0 }),
}));
