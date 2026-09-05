/**
 * Cache local IndexedDB pour les données API.
 * Stocke les réponses GET en cache et les sert quand offline.
 */
import type { Ref, WatchSource } from 'vue';

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
 * Wrapper autour de useFetch qui persiste les réponses en IndexedDB et
 * réhydrate depuis le cache quand le réseau échoue / est absent.
 *
 * Conserve EXACTEMENT la signature de retour de useFetch (data, pending,
 * error, refresh) pour être un drop-in dans les composables existants —
 * et garde donc le comportement SSR/SW Workbox quand on est en ligne.
 *
 * Le cache IndexedDB est un filet de dernier recours : si le SW Workbox
 * n'a rien (cache expiré, 1ère visite offline), on sert quand même la
 * dernière donnée connue au lieu d'une page vide.
 *
 * ── Affichage instantané (stale-while-revalidate) ──────────────────────
 * Revenir sur un onglet déjà visité NE DOIT PAS repasser par un écran de
 * chargement : la dernière réponse connue est réaffichée tout de suite,
 * puis remplacée par la version fraîche dès son arrivée. Le clignotement
 * venait de la condition d'affichage : `pending` repasse à true à chaque
 * revalidation, y compris quand la liste est déjà à l'écran. D'où
 * `chargementInitial`, vrai UNIQUEMENT quand il n'y a rien à afficher —
 * c'est LA condition à utiliser pour les skeletons.
 *
 * ⚠️ CLOISONNEMENT — le cache local est nominatif. La clé porte l'identifiant
 * du compte ET les paramètres de requête : sans cela, un appareil partagé
 * (tablette de camion, poste d'association) réafficherait la liste du compte
 * précédent, ou une liste filtrée à la place de la vue par défaut. Le cache
 * est en outre purgé à la déconnexion (cf. `purgeOfflineCache`).
 */
export function useCachedFetch<T>(
  url: string,
  options: {
    key: string;
    lazy?: boolean;
    dedupe?: 'cancel' | 'defer';
    query?: Record<string, unknown> | Ref<Record<string, unknown>>;
    watch?: WatchSource[];
  },
) {
  const utilisateur = useSupabaseUser();

  /** Clé nominative + dépendante des filtres courants. */
  function cleCourante(): string | null {
    const uid = utilisateur.value?.id;
    if (!uid) return null;
    const q = options.query ? unref(options.query) : undefined;
    const suffixe = q && Object.keys(q).length > 0 ? `:${JSON.stringify(q)}` : '';
    return `cache:${uid}:${options.key}${suffixe}`;
  }

  /**
   * ⚠️ `useAsyncData` + `appelApi`, ET PAS `useFetch` — MESURÉ, PAS PRÉFÉRÉ.
   *
   * Cet emballage est appelé par DOUZE écrans ; c'était donc le site le plus
   * rentable du dépôt, et le dernier à franchir la limite de profondeur
   * d'instanciation de TypeScript.
   *
   * ⚠️ ET L'ANCIENNE FORME ÉTAIT LE PIRE CAS POSSIBLE, pas un cas neutre.
   * `url` est ici typé `string`, pas un littéral : `useFetch<T>(url)` devait
   * donc confronter `string` à l'union des 213 routes — c'est-à-dire les
   * déplier TOUTES, et avec elles le type de retour réel de chaque handler
   * (chaînes Drizzle et inférences Zod comprises). Élargir un chemin en
   * `string` n'allège rien : ça aggrave.
   *
   * Ce qu'on perd : rien ici, le type était déjà donné par `<T>`.
   * Ce qu'on garde : SSR, `lazy`, `dedupe`, `watch`, `refresh`, et la même
   * forme de retour — l'en-tête de ce composable promet un drop-in, et il le
   * reste. La `query` est simplement sérialisée à la main dans l'URL, ce que
   * `useFetch` faisait pour nous.
   *
   * `app/utils/appelApi.ts` porte la mesure complète.
   */
  function urlCourante(): string {
    const q = options.query ? unref(options.query) : undefined;
    if (!q) return url;
    const params = new URLSearchParams();
    for (const [cle, valeur] of Object.entries(q)) {
      if (valeur === undefined || valeur === null || valeur === '') continue;
      params.set(cle, String(valeur));
    }
    const chaine = params.toString();
    return chaine ? `${url}${url.includes('?') ? '&' : '?'}${chaine}` : url;
  }

  const result = useAsyncData<T>(options.key, () => appelApi<T>(urlCourante()), {
    lazy: options.lazy,
    dedupe: options.dedupe,
    ...(options.watch ? { watch: options.watch } : {}),
  });

  /** true uniquement quand il n'y a encore rien à afficher (1er chargement). */
  const chargementInitial = computed(
    () => result.pending.value && (result.data.value as unknown) == null,
  );

  /** Revalidation en cours alors que des données sont déjà à l'écran. */
  const revalidation = computed(
    () => result.pending.value && (result.data.value as unknown) != null,
  );

  if (import.meta.client) {
    // Persiste chaque réponse réussie
    watch(
      result.data,
      (val) => {
        const cle = cleCourante();
        if (val != null && cle) setCache(cle, toRaw(val));
      },
      { immediate: true },
    );

    // Réhydrate depuis IndexedDB si pas de données (offline / échec réseau)
    const dataRef = result.data as unknown as Ref<T | null>;
    const hydrateFromCache = async () => {
      const cle = cleCourante();
      // Pas de session → on ne ressort jamais de données du disque.
      if (!cle || dataRef.value != null) return;
      const cached = await getCached<T>(cle);
      if (cached != null && dataRef.value == null) {
        dataRef.value = cached;
      }
    };
    onMounted(hydrateFromCache);
    // immediate : couvre l'erreur déjà présente au moment où le watcher
    // s'enregistre (réponse réseau plus rapide que le setup)
    watch(
      result.error,
      (err) => {
        if (err) hydrateFromCache();
      },
      { immediate: true },
    );
  }

  // Object.assign (et non un spread) : préserve l'objet AsyncData de Nuxt,
  // qui est aussi « awaitable » — un spread en ferait un objet nu.
  return Object.assign(result, { chargementInitial, revalidation });
}

/**
 * Vide le cache local de données. Appelé à la déconnexion : les réponses
 * d'un compte ne doivent jamais rester sur le disque d'un appareil partagé.
 */
export async function purgeOfflineCache(): Promise<void> {
  if (!import.meta.client) return;
  try {
    const db = await openCacheDB();
    await new Promise<void>((resolve) => {
      const tx = db.transaction(CACHE_STORE_NAME, 'readwrite');
      tx.objectStore(CACHE_STORE_NAME).clear();
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    });
    db.close();
  } catch {
    // Purge best-effort : ne doit jamais empêcher la déconnexion.
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
        const result = await appelApi<T>(resolvedUrl, { query });
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
