/**
 * Cache local IndexedDB pour les données API.
 * Stocke les réponses GET en cache et les sert quand offline.
 */

const CACHE_DB_NAME = 'apigo-cache';
const CACHE_STORE_NAME = 'responses';
const CACHE_DB_VERSION = 1;

interface CachedResponse {
  key: string;
  data: unknown;
  cachedAt: number;
}

function openCacheDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(CACHE_DB_NAME, CACHE_DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(CACHE_STORE_NAME)) {
        db.createObjectStore(CACHE_STORE_NAME, { keyPath: 'key' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function getCached<T>(key: string): Promise<T | null> {
  try {
    const db = await openCacheDB();
    return new Promise((resolve) => {
      const tx = db.transaction(CACHE_STORE_NAME, 'readonly');
      const store = tx.objectStore(CACHE_STORE_NAME);
      const request = store.get(key);
      request.onsuccess = () => {
        const result = request.result as CachedResponse | undefined;
        resolve(result ? (result.data as T) : null);
      };
      request.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}

async function setCache(key: string, data: unknown): Promise<void> {
  try {
    const db = await openCacheDB();
    return new Promise((resolve) => {
      const tx = db.transaction(CACHE_STORE_NAME, 'readwrite');
      const store = tx.objectStore(CACHE_STORE_NAME);
      store.put({ key, data, cachedAt: Date.now() } satisfies CachedResponse);
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    });
  } catch {
    // Cache write failure is non-critical
  }
}

/**
 * Fetches data with offline cache fallback.
 * - Online: fetches from API, caches the result, returns fresh data
 * - Offline: returns cached data from IndexedDB
 *
 * @param url - API endpoint
 * @param options - useFetch options (key is required for caching)
 */
export function useOfflineFetch<T>(
  url: string | (() => string),
  options: {
    key: string;
    query?: Record<string, unknown> | Ref<Record<string, unknown>>;
    lazy?: boolean;
    immediate?: boolean;
  },
) {
  const isOnline = useOnline();
  const cachedData = ref<T | null>(null);
  const loading = ref(true);
  const error = ref<Error | null>(null);
  const cacheKey = `cache:${options.key}`;

  async function fetchData() {
    loading.value = true;
    error.value = null;

    const resolvedUrl = typeof url === 'function' ? url() : url;
    const query = options.query ? unref(options.query) : undefined;

    if (isOnline.value) {
      try {
        const result = await $fetch<T>(resolvedUrl, { query });
        cachedData.value = result;
        // Cache in background
        if (import.meta.client) {
          setCache(cacheKey, result);
        }
      } catch (e) {
        error.value = e instanceof Error ? e : new Error('Fetch failed');
        // Fallback to cache on network error
        if (import.meta.client) {
          const cached = await getCached<T>(cacheKey);
          if (cached) cachedData.value = cached;
        }
      }
    } else {
      // Offline — serve from cache
      if (import.meta.client) {
        const cached = await getCached<T>(cacheKey);
        if (cached) {
          cachedData.value = cached;
        } else {
          error.value = new Error('Hors ligne — aucune donnee en cache');
        }
      }
    }

    loading.value = false;
  }

  // Initial fetch
  if (options.immediate !== false) {
    if (import.meta.client) {
      onMounted(fetchData);
    }
  }

  return {
    data: cachedData,
    pending: loading,
    error,
    refresh: fetchData,
  };
}
