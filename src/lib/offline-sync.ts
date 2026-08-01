import { executeServerMutation } from '@/app/actions/db';
import { useAppStore } from '@/lib/store';

interface OfflineMutation {
  id: string;
  path: string;
  args: any;
  timestamp: number;
}

const DB_NAME = 'ems-offline-db';
const STORE_NAME = 'mutations';

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
    
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function queueOfflineMutation(path: string, args: any): Promise<void> {
  try {
    const db = await openDB();
    const mutation: OfflineMutation = {
      id: crypto.randomUUID(),
      path,
      args,
      timestamp: Date.now(),
    };

    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const request = store.add(mutation);

      request.onsuccess = () => {
        // Increment the queue badge in the UI
        useAppStore.getState().incrementOfflineQueue();
        resolve();
      };
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('Failed to queue offline mutation:', error);
  }
}

export async function processOfflineQueue(): Promise<void> {
  try {
    const db = await openDB();
    
    const mutations = await new Promise<OfflineMutation[]>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const request = store.getAll();
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });

    if (mutations.length === 0) return;

    // Sort by timestamp to preserve order of operations
    mutations.sort((a, b) => a.timestamp - b.timestamp);

    for (const mutation of mutations) {
      try {
        await executeServerMutation(mutation.path, mutation.args);
        
        // Remove from IndexedDB on success
        await new Promise<void>((resolve, reject) => {
          const tx = db.transaction(STORE_NAME, 'readwrite');
          const store = tx.objectStore(STORE_NAME);
          const request = store.delete(mutation.id);
          request.onsuccess = () => resolve();
          request.onerror = () => reject(request.error);
        });
      } catch (error) {
        console.error(`Failed to sync queued mutation ${mutation.path}:`, error);
        // We'll leave it in the queue for the next retry if it's a network error.
        // If it's a validation error, we might want to discard it, but for now keep it simple.
      }
    }

    // Refresh queue count
    const remaining = await new Promise<number>((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const request = store.count();
      request.onsuccess = () => resolve(request.result);
    });

    if (remaining === 0) {
      useAppStore.getState().clearOfflineQueue();
    } else {
      useAppStore.setState({ offlineQueue: remaining });
    }
  } catch (error) {
    console.error('Failed to process offline queue:', error);
  }
}

export async function getOfflineQueueCount(): Promise<number> {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const request = store.count();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => resolve(0);
    });
  } catch {
    return 0;
  }
}
