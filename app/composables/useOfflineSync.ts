interface OfflineMutation {
  id: string;
  url: string;
  method: 'POST' | 'PUT' | 'DELETE';
  body?: Record<string, unknown>;
  createdAt: string;
}

const DB_NAME = 'apigo-offline';
const STORE_NAME = 'mutations';
const DB_VERSION = 1;

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function getAllMutations(): Promise<OfflineMutation[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result as OfflineMutation[]);
    request.onerror = () => reject(request.error);
  });
}

async function addMutation(mutation: OfflineMutation): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.put(mutation);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function removeMutation(id: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

// Singleton state shared across all callers
const pendingCount = ref(0);
const syncing = ref(false);
let initialized = false;

export function useOfflineSync() {
  const isOnline = useOnline();

  /** Queue a mutation for later sync if offline, or execute immediately if online. */
  async function queueMutation(
    url: string,
    method: 'POST' | 'PUT' | 'DELETE',
    body?: Record<string, unknown>,
  ): Promise<boolean> {
    if (isOnline.value) {
      try {
        await $fetch(url, { method, body });
        return true;
      } catch {
        return false;
      }
    }

    const mutation: OfflineMutation = {
      id: crypto.randomUUID(),
      url,
      method,
      body,
      createdAt: new Date().toISOString(),
    };
    await addMutation(mutation);
    pendingCount.value++;
    return true;
  }

  /** Sync all pending mutations to the server. */
  async function syncPending(): Promise<{ synced: number; failed: number }> {
    if (!isOnline.value || syncing.value) return { synced: 0, failed: 0 };
    syncing.value = true;

    let synced = 0;
    let failed = 0;

    try {
      const mutations = await getAllMutations();
      const sorted = mutations.sort(
        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      );

      for (const mutation of sorted) {
        try {
          await $fetch(mutation.url, {
            method: mutation.method,
            body: mutation.body,
          });
          await removeMutation(mutation.id);
          synced++;
        } catch {
          failed++;
        }
      }

      pendingCount.value = Math.max(0, pendingCount.value - synced);
    } finally {
      syncing.value = false;
    }

    return { synced, failed };
  }

  // Auto-sync when coming back online
  watch(isOnline, async (online) => {
    if (online && pendingCount.value > 0) {
      await syncPending();
    }
  });

  // Load count once on init (client only)
  if (import.meta.client && !initialized) {
    initialized = true;
    getAllMutations()
      .then((m) => {
        pendingCount.value = m.length;
      })
      .catch(() => {
        pendingCount.value = 0;
      });
  }

  return {
    isOnline,
    pendingCount,
    syncing,
    queueMutation,
    syncPending,
  };
}
