/**
 * Tracking d'activité produit (analytics 1ère partie, côté client).
 *
 * - Navigation : un événement 'page' à chaque changement de route.
 * - Actions clés : écoute le DataBus et trace les créations métier majeures.
 * - Présence : heartbeat périodique pour garder « en ligne » à jour.
 *
 * Volontairement minimaliste : on n'envoie que le chemin de route et le nom
 * d'action, jamais le contenu métier. N'opère que pour un utilisateur connecté
 * et hors pages publiques.
 */
import type { DataEvent } from '~/config/evenements-donnees';

const PAGES_PUBLIQUES = new Set([
  '/',
  '/login',
  '/register',
  '/reset-password',
  '/confirm',
  '/onboarding',
  '/activer-essai',
]);

// Actions métier clés à tracer (adoption des fonctionnalités)
const ACTIONS_CLES: DataEvent[] = [
  'intervention:created',
  'recolte:created',
  'vente:created',
  'achat:created',
  'ruche:created',
  'rucher:created',
  'stock:created',
  'client:created',
  'hausse:created',
  'bl:created',
  'reine:created',
];

const HEARTBEAT_MS = 60_000;

interface TrackPayload {
  type: 'page' | 'action';
  nom: string;
  titre?: string;
  dureeMs?: number;
  sessionId?: string;
  ping?: boolean;
}

export default defineNuxtPlugin(() => {
  if (!import.meta.client) return;

  const user = useSupabaseUser();
  const router = useRouter();
  const { on } = useDataBus();

  // Identifiant de session (regroupe une visite) — tolérant au mode privé
  let sessionId = '';
  try {
    sessionId = sessionStorage.getItem('apigo_sid') ?? '';
    if (!sessionId) {
      sessionId =
        typeof crypto !== 'undefined' && crypto.randomUUID
          ? crypto.randomUUID()
          : Math.random().toString(36).slice(2);
      sessionStorage.setItem('apigo_sid', sessionId);
    }
  } catch {
    /* sessionStorage indisponible (mode privé) — on continue sans id stable */
  }

  function send(payload: TrackPayload) {
    if (!user.value) return;
    const body = JSON.stringify({ ...payload, sessionId });
    try {
      const blob = new Blob([body], { type: 'application/json' });
      if (navigator.sendBeacon?.('/api/track', blob)) return;
    } catch {
      /* sendBeacon indisponible — fallback fetch */
    }
    appelApi('/api/track', { method: 'POST', body, keepalive: true }).catch(() => {});
  }

  // ── Navigation ────────────────────────────────────────────────────────────
  let lastPath = '';
  let enteredAt = Date.now();

  function trackPage(path: string, titre?: string) {
    if (!user.value || PAGES_PUBLIQUES.has(path) || path === lastPath) return;
    const now = Date.now();
    const dureeMs = lastPath ? now - enteredAt : undefined;
    lastPath = path;
    enteredAt = now;
    send({ type: 'page', nom: path, titre, dureeMs });
  }

  router.afterEach((to) => {
    nextTick(() => {
      const titre = typeof document !== 'undefined' ? document.title : undefined;
      trackPage(to.path, titre);
    });
  });

  // Première page : le afterEach ne se déclenche pas pour la route initiale, et
  // l'utilisateur Supabase peut n'être résolu qu'après l'init du plugin. On
  // trace donc dès que l'utilisateur est connu.
  watch(
    user,
    (u) => {
      if (!u) return;
      const titre = typeof document !== 'undefined' ? document.title : undefined;
      nextTick(() => trackPage(router.currentRoute.value.path, titre));
    },
    { immediate: true },
  );

  // ── Actions clés ──────────────────────────────────────────────────────────
  ACTIONS_CLES.forEach((evt) => {
    on(evt, () => send({ type: 'action', nom: evt }));
  });

  // ── Présence (heartbeat) ───────────────────────────────────────────────────
  const timer = window.setInterval(() => {
    if (user.value && lastPath && document.visibilityState === 'visible') {
      send({ type: 'page', nom: lastPath, ping: true });
    }
  }, HEARTBEAT_MS);

  if (import.meta.hot) {
    import.meta.hot.dispose(() => window.clearInterval(timer));
  }
});
