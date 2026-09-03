import type { DataEvent } from '~/config/evenements-donnees';

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

/**
 * Événement DataBus à émettre une fois la mutation rejouée — les composables
 * (useRuches, useInterventions…) écoutent ces événements et rafraîchissent
 * leurs listes. Sans ça, l'UI garde des données périmées après la synchro.
 */
function eventForMutation(mutation: OfflineMutation): DataEvent | null {
  const path = mutation.url.split('?')[0] ?? '';
  const suffix =
    mutation.method === 'DELETE' ? 'deleted' : mutation.method === 'PUT' ? 'updated' : 'created';
  if (path.startsWith('/api/ruchers')) return `rucher:${suffix}`;
  if (path.startsWith('/api/ruches')) return `ruche:${suffix}`;
  if (path.startsWith('/api/interventions')) return `intervention:${suffix}`;
  if (path.startsWith('/api/stocks')) return `stock:${suffix}`;
  if (path.startsWith('/api/production')) return `recolte:${suffix}`;
  if (path.startsWith('/api/clients')) return `client:${suffix}`;
  if (path.startsWith('/api/finances/ventes')) return `vente:${suffix}`;
  if (path.startsWith('/api/finances/achats')) return 'achat:created';
  return null;
}

function isPermanentError(err: unknown): boolean {
  const status =
    (err as { statusCode?: number; status?: number })?.statusCode ??
    (err as { status?: number })?.status;
  return typeof status === 'number' && status >= 400 && status < 500;
}

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
    let dropped = 0;
    const events = new Set<DataEvent>();

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
          const evt = eventForMutation(mutation);
          if (evt) events.add(evt);
        } catch (err) {
          // 4xx = rejet définitif (validation, ressource supprimée…) : on purge
          // la mutation au lieu de la rejouer en boucle à chaque synchro
          if (isPermanentError(err)) {
            await removeMutation(mutation.id);
            dropped++;
          }
          failed++;
        }
      }

      pendingCount.value = Math.max(0, pendingCount.value - synced - dropped);
    } finally {
      syncing.value = false;
    }

    // Invalide les listes concernées — l'UI affichait des données périmées
    // après une synchro sans ces événements
    if (events.size > 0) {
      const { emit } = useDataBus();
      events.forEach((evt) => emit(evt));
    }

    return { synced, failed };
  }

  // Init singleton (client only) : compteur initial + auto-sync au retour réseau
  if (import.meta.client && !initialized) {
    initialized = true;
    getAllMutations()
      .then((m) => {
        pendingCount.value = m.length;
      })
      .catch(() => {
        pendingCount.value = 0;
      });

    // Watcher unique au niveau module, dans un scope détaché — l'enregistrer
    // à chaque appel créait un watcher par composant monté, et un scope de
    // composant le détruirait au premier unmount
    const scope = effectScope(true);
    scope.run(() => {
      watch(isOnline, async (online) => {
        if (online && pendingCount.value > 0) {
          await syncPending();
        }
      });
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
