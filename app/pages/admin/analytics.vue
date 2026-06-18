<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-[26px] font-semibold tracking-[-0.02em]" style="color: var(--text-primary)">
          Analytics
        </h1>
        <p class="text-sm" style="color: var(--text-secondary)">
          Comportement produit & présence en temps réel
        </p>
      </div>
      <UButton
        icon="i-lucide-refresh-cw"
        variant="outline"
        color="neutral"
        size="sm"
        :loading="pending"
        @click="refresh()"
      >
        Rafraîchir
      </UButton>
    </div>

    <AdminTabs />

    <!-- Schéma non poussé : message d'installation -->
    <div
      v-if="payload && payload.schemaReady === false"
      class="flex items-start gap-3 rounded-[12px] border px-4 py-3"
      style="border-color: var(--status-warn); background: #fdf3e3"
    >
      <UIcon
        name="i-lucide-database"
        class="mt-0.5 h-4 w-4 shrink-0"
        style="color: var(--status-warn)"
      />
      <div>
        <p class="text-[13px] font-semibold" style="color: var(--text-primary)">
          Tracking pas encore activé
        </p>
        <p class="text-[12.5px]" style="color: var(--text-secondary)">
          Lance
          <code class="rounded bg-white/70 px-1 py-0.5 text-[12px]">npm run db:push</code> pour
          créer les tables d'analytics, puis les données apparaîtront ici.
        </p>
      </div>
    </div>

    <!-- KPIs -->
    <div class="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
      <div
        v-for="card in kpiCards"
        :key="card.label"
        class="rounded-[14px] border bg-white p-4"
        style="border-color: var(--border-default)"
      >
        <p
          class="mb-1 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.12em]"
          style="color: var(--honey-deep)"
        >
          <span v-if="card.live" class="relative flex h-2 w-2">
            <span
              class="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"
            />
            <span class="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
          </span>
          {{ card.label }}
        </p>
        <p class="text-[22px] font-bold tracking-[-0.02em]" :style="`color:${card.color}`">
          {{ card.value }}
        </p>
      </div>
    </div>

    <div class="grid gap-5 lg:grid-cols-3">
      <!-- En ligne maintenant -->
      <div
        class="rounded-[14px] border bg-white lg:col-span-1"
        style="border-color: var(--border-default)"
      >
        <div
          class="flex items-center justify-between border-b px-4 py-3"
          style="border-color: var(--border-default)"
        >
          <h2
            class="flex items-center gap-2 text-[14px] font-semibold"
            style="color: var(--text-primary)"
          >
            <span class="relative flex h-2 w-2">
              <span
                class="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"
              />
              <span class="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
            En ligne
          </h2>
          <span class="text-[12px]" style="color: var(--text-tertiary)">{{ enLigne.length }}</span>
        </div>
        <div class="max-h-[420px] overflow-y-auto">
          <button
            v-for="u in enLigne"
            :key="u.id"
            class="flex w-full items-center gap-3 border-b px-4 py-2.5 text-left transition-colors last:border-0 hover:bg-stone-50"
            style="border-color: var(--border-faint)"
            :title="`Suivre ${nomComplet(u)}`"
            @click="selectedUserId = u.id"
          >
            <div
              class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-bold"
              style="background: var(--honey-soft); color: var(--honey-deep)"
            >
              {{ initiales(u) }}
            </div>
            <div class="min-w-0 flex-1">
              <p class="truncate text-[13px] font-medium" style="color: var(--text-primary)">
                {{ nomComplet(u) }}
              </p>
              <p
                class="flex items-center gap-1 truncate text-[11.5px]"
                style="color: var(--text-tertiary)"
              >
                <UIcon name="i-lucide-navigation" class="h-3 w-3 shrink-0" />
                {{ pageLabel(u.dernierePage) }}
              </p>
            </div>
            <span class="shrink-0 text-[11px] tabular-nums" style="color: var(--text-quaternary)">
              {{ ilYA(u.derniereActiviteAt) }}
            </span>
          </button>
          <div
            v-if="enLigne.length === 0"
            class="px-4 py-10 text-center text-[13px]"
            style="color: var(--text-tertiary)"
          >
            Personne en ligne actuellement
          </div>
        </div>
      </div>

      <!-- Activité par jour (14 j) -->
      <div
        class="rounded-[14px] border bg-white p-4 lg:col-span-2"
        style="border-color: var(--border-default)"
      >
        <h2 class="mb-4 text-[14px] font-semibold" style="color: var(--text-primary)">
          Activité — 14 derniers jours
        </h2>
        <div class="flex h-[180px] items-end gap-1.5">
          <div
            v-for="d in activiteParJour"
            :key="d.jour"
            class="group relative flex flex-1 flex-col items-center justify-end"
          >
            <div
              class="w-full rounded-t-[4px] transition-all"
              :style="{
                height: `${barHeight(d.evenements, maxActivite)}%`,
                background: 'var(--honey)',
                minHeight: d.evenements > 0 ? '3px' : '0',
              }"
            />
            <span class="mt-1 text-[9px]" style="color: var(--text-quaternary)">{{
              jourCourt(d.jour)
            }}</span>
            <!-- Tooltip -->
            <div
              class="pointer-events-none absolute bottom-full mb-1 hidden whitespace-nowrap rounded-md px-2 py-1 text-[10px] text-white group-hover:block"
              style="background: var(--text-primary)"
            >
              {{ d.evenements }} évén. · {{ d.utilisateurs }} actifs
            </div>
          </div>
          <div
            v-if="activiteParJour.length === 0"
            class="flex h-full w-full items-center justify-center text-[13px]"
            style="color: var(--text-tertiary)"
          >
            Pas encore de données d'activité
          </div>
        </div>
      </div>
    </div>

    <div class="grid gap-5 lg:grid-cols-2">
      <!-- Top pages -->
      <div class="rounded-[14px] border bg-white p-4" style="border-color: var(--border-default)">
        <h2 class="mb-4 text-[14px] font-semibold" style="color: var(--text-primary)">
          Pages les plus vues
          <span class="text-[12px] font-normal" style="color: var(--text-tertiary)">— 7 j</span>
        </h2>
        <div class="space-y-2.5">
          <div v-for="p in topPages" :key="p.nom">
            <div class="mb-1 flex items-center justify-between text-[12.5px]">
              <span class="truncate" style="color: var(--text-secondary)">{{
                pageLabel(p.nom)
              }}</span>
              <span
                class="ml-2 shrink-0 tabular-nums font-medium"
                style="color: var(--text-primary)"
              >
                {{ p.count }}
              </span>
            </div>
            <div
              class="h-1.5 overflow-hidden rounded-full"
              style="background: var(--surface-muted)"
            >
              <div
                class="h-full rounded-full"
                :style="{ width: `${barHeight(p.count, maxPage)}%`, background: 'var(--honey)' }"
              />
            </div>
          </div>
          <p
            v-if="topPages.length === 0"
            class="py-6 text-center text-[13px]"
            style="color: var(--text-tertiary)"
          >
            Aucune vue enregistrée
          </p>
        </div>
      </div>

      <!-- Top actions -->
      <div class="rounded-[14px] border bg-white p-4" style="border-color: var(--border-default)">
        <h2 class="mb-4 text-[14px] font-semibold" style="color: var(--text-primary)">
          Actions clés
          <span class="text-[12px] font-normal" style="color: var(--text-tertiary)">— 7 j</span>
        </h2>
        <div class="space-y-2.5">
          <div v-for="a in topActions" :key="a.nom">
            <div class="mb-1 flex items-center justify-between text-[12.5px]">
              <span class="truncate" style="color: var(--text-secondary)">{{
                actionLabel(a.nom)
              }}</span>
              <span
                class="ml-2 shrink-0 tabular-nums font-medium"
                style="color: var(--text-primary)"
              >
                {{ a.count }}
              </span>
            </div>
            <div
              class="h-1.5 overflow-hidden rounded-full"
              style="background: var(--surface-muted)"
            >
              <div
                class="h-full rounded-full"
                :style="{
                  width: `${barHeight(a.count, maxAction)}%`,
                  background: 'var(--sage-deep)',
                }"
              />
            </div>
          </div>
          <p
            v-if="topActions.length === 0"
            class="py-6 text-center text-[13px]"
            style="color: var(--text-tertiary)"
          >
            Aucune action enregistrée
          </p>
        </div>
      </div>
    </div>

    <!-- Suivi par client : chargement -->
    <div
      v-if="selectedUserId && pending && !client"
      class="flex items-center gap-2 rounded-[14px] border bg-white px-4 py-4 text-[13px]"
      style="border-color: var(--honey); color: var(--text-tertiary)"
    >
      <UIcon name="i-lucide-loader-2" class="h-4 w-4 animate-spin" />
      Chargement du suivi client…
    </div>

    <!-- Suivi par client (fiche + historique) -->
    <div
      v-if="client"
      class="rounded-[14px] border bg-white"
      style="border-color: var(--honey); box-shadow: 0 0 0 3px rgba(245, 166, 35, 0.12)"
    >
      <div
        class="flex flex-wrap items-center gap-3 border-b px-4 py-3"
        style="border-color: var(--border-default)"
      >
        <div
          class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[13px] font-bold"
          style="background: var(--honey-soft); color: var(--honey-deep)"
        >
          {{ initiales(clientProfil) }}
        </div>
        <div class="min-w-0 flex-1">
          <p class="text-[14px] font-semibold" style="color: var(--text-primary)">
            {{ nomComplet(clientProfil) }}
            <span
              class="ml-1.5 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase"
              style="background: var(--honey-soft); color: var(--honey-deep)"
              >{{ clientProfil.plan }}</span
            >
          </p>
          <p
            class="flex flex-wrap items-center gap-x-3 text-[12px]"
            style="color: var(--text-tertiary)"
          >
            <a :href="`mailto:${clientProfil.email}`" class="hover:underline">{{
              clientProfil.email
            }}</a>
            <a
              v-if="clientProfil.telephone"
              :href="`tel:${clientProfil.telephone}`"
              class="flex items-center gap-1 hover:underline"
            >
              <UIcon name="i-lucide-phone" class="h-3 w-3" />{{ clientProfil.telephone }}
            </a>
            <span v-else class="flex items-center gap-1 opacity-60">
              <UIcon name="i-lucide-phone-off" class="h-3 w-3" />non renseigné
            </span>
            <span>Inscrit {{ ilYA(clientProfil.createdAt) }}</span>
            <span v-if="clientProfil.derniereActiviteAt">
              Vu {{ ilYA(clientProfil.derniereActiviteAt) }} —
              {{ pageLabel(clientProfil.dernierePage) }}
            </span>
          </p>
        </div>
        <div class="flex items-center gap-4 text-center">
          <div v-for="s in clientStats" :key="s.label">
            <p class="text-[16px] font-bold tabular-nums" style="color: var(--text-primary)">
              {{ s.value }}
            </p>
            <p class="text-[10px]" style="color: var(--text-quaternary)">{{ s.label }}</p>
          </div>
        </div>
        <button
          class="shrink-0 rounded-lg p-1.5 transition-colors hover:bg-stone-100"
          aria-label="Fermer le suivi"
          @click="selectedUserId = null"
        >
          <UIcon name="i-lucide-x" class="h-4 w-4" style="color: var(--text-tertiary)" />
        </button>
      </div>
      <div class="max-h-[380px] overflow-y-auto">
        <div
          v-for="ev in client.evenements"
          :key="ev.id"
          class="flex items-center gap-3 border-b px-4 py-2 last:border-0"
          style="border-color: var(--border-faint)"
        >
          <span
            class="flex h-6 w-6 shrink-0 items-center justify-center rounded-[7px]"
            :style="
              ev.type === 'action'
                ? 'background: var(--sage-soft, #eef3ec); color: var(--sage-deep)'
                : 'background: var(--honey-soft); color: var(--honey-deep)'
            "
          >
            <UIcon
              :name="ev.type === 'action' ? 'i-lucide-zap' : 'i-lucide-navigation'"
              class="h-3 w-3"
            />
          </span>
          <p class="min-w-0 flex-1 truncate text-[12.5px]" style="color: var(--text-secondary)">
            {{ ev.type === 'action' ? actionLabel(ev.nom) : pageLabel(ev.nom) }}
          </p>
          <span class="shrink-0 text-[11px] tabular-nums" style="color: var(--text-quaternary)">
            {{ ilYA(ev.createdAt) }}
          </span>
        </div>
        <div
          v-if="client.evenements.length === 0"
          class="px-4 py-8 text-center text-[13px]"
          style="color: var(--text-tertiary)"
        >
          Aucune activité tracée pour ce client
        </div>
      </div>
    </div>

    <!-- Flux d'activité récent -->
    <div class="rounded-[14px] border bg-white" style="border-color: var(--border-default)">
      <div
        class="flex flex-wrap items-center justify-between gap-3 border-b px-4 py-3"
        style="border-color: var(--border-default)"
      >
        <h2 class="text-[14px] font-semibold" style="color: var(--text-primary)">
          Activité récente
          <span class="text-[12px] font-normal" style="color: var(--text-tertiary)"
            >— cliquez un client pour le suivre</span
          >
        </h2>
        <select
          v-model="selectedUserId"
          class="h-8 max-w-[260px] rounded-[8px] border bg-white px-2 text-[12.5px]"
          style="border-color: var(--border-default); color: var(--text-primary)"
        >
          <option :value="null">Suivi par client…</option>
          <option v-for="u in usersOptions" :key="u.id" :value="u.id">{{ u.label }}</option>
        </select>
      </div>
      <div class="max-h-[460px] overflow-y-auto">
        <button
          v-for="ev in feed"
          :key="ev.id"
          class="flex w-full items-center gap-3 border-b px-4 py-2.5 text-left transition-colors last:border-0 hover:bg-stone-50"
          style="border-color: var(--border-faint)"
          :title="`Suivre ${feedUser(ev)}`"
          @click="selectedUserId = ev.userId"
        >
          <div
            class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[10.5px] font-bold"
            style="background: var(--surface-muted); color: var(--text-secondary)"
          >
            {{ initiales({ nom: ev.userNom, prenom: ev.userPrenom, email: ev.userEmail }) }}
          </div>
          <div class="min-w-0 flex-1">
            <p class="truncate text-[13px]" style="color: var(--text-primary)">
              <span class="font-semibold">{{ feedUser(ev) }}</span>
              <span
                class="ml-1.5 rounded-full px-1.5 py-px text-[9.5px] font-bold uppercase"
                style="background: var(--surface-muted); color: var(--text-tertiary)"
                >{{ ev.userPlan }}</span
              >
            </p>
            <p
              class="flex items-center gap-1.5 truncate text-[12px]"
              style="color: var(--text-secondary)"
            >
              <UIcon
                :name="ev.type === 'action' ? 'i-lucide-zap' : 'i-lucide-navigation'"
                class="h-3 w-3 shrink-0"
                :style="
                  ev.type === 'action' ? 'color: var(--sage-deep)' : 'color: var(--honey-deep)'
                "
              />
              {{ ev.type === 'action' ? actionLabel(ev.nom) : `Consulte « ${pageLabel(ev.nom)} »` }}
            </p>
          </div>
          <span class="shrink-0 text-[11px] tabular-nums" style="color: var(--text-quaternary)">
            {{ ilYA(ev.createdAt) }}
          </span>
        </button>
        <div
          v-if="feed.length === 0"
          class="px-4 py-10 text-center text-[13px]"
          style="color: var(--text-tertiary)"
        >
          Aucune activité enregistrée pour le moment
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'default', middleware: 'admin' });

interface OnlineUser {
  id: string;
  nom: string | null;
  prenom: string | null;
  email: string;
  plan: string;
  dernierePage: string | null;
  derniereActiviteAt: string;
}
interface Kpis {
  enLigne: number;
  actifs24h: number;
  actifs7j: number;
  actifs30j: number;
  evenementsAujourdhui: number;
  inscriptions7j: number;
  totalUsers: number;
}
interface JourActivite {
  jour: string;
  evenements: number;
  utilisateurs: number;
}
interface Compte {
  nom: string;
  count: number;
}
interface FeedItem {
  id: string;
  type: 'page' | 'action';
  nom: string;
  titre: string | null;
  createdAt: string;
  userId: string;
  userNom: string | null;
  userPrenom: string | null;
  userEmail: string;
  userPlan: string;
}
interface ClientProfil {
  id: string;
  nom: string | null;
  prenom: string | null;
  email: string;
  telephone: string | null;
  plan: string;
  createdAt: string;
  dernierePage: string | null;
  derniereActiviteAt: string | null;
}
interface ClientDetail {
  profil: ClientProfil;
  evenements: { id: string; type: 'page' | 'action'; nom: string; createdAt: string }[];
  stats: { pages7j?: number; actions7j?: number; joursActifs30j?: number };
}
interface AnalyticsPayload {
  enLigne: OnlineUser[];
  kpis: Kpis;
  inscriptionsParJour: { jour: string; count: number }[];
  activiteParJour: JourActivite[];
  topPages: Compte[];
  topActions: Compte[];
  feed: FeedItem[];
  client: ClientDetail | null;
  schemaReady?: boolean;
}

// Suivi par client : l'API renvoie la fiche + l'historique quand userId est fourni
const selectedUserId = ref<string | null>(null);
const analyticsQuery = computed(() =>
  selectedUserId.value ? { userId: selectedUserId.value } : {},
);

const { data, pending, refresh } = useFetch<{ data: AnalyticsPayload }>('/api/admin/analytics', {
  key: 'admin-analytics',
  lazy: true,
  query: analyticsQuery,
  watch: [analyticsQuery],
  // Abandon côté client après 15 s : ne jamais laisser la page « tourner »
  // sur une requête serveur qui pend (le serveur borne déjà à ~8 s via
  // dbWatchdog, ceci est le filet de sécurité réseau)
  timeout: 15_000,
});

// Liste complète des clients pour le sélecteur de suivi
const { data: usersData } = useFetch<{
  data: { id: string; email: string; nom: string | null; prenom: string | null }[];
}>('/api/admin/users', { key: 'admin-users-select', lazy: true, timeout: 15_000 });

const usersOptions = computed(
  () =>
    usersData.value?.data.map((u) => ({
      id: u.id,
      label: `${[u.prenom, u.nom].filter(Boolean).join(' ').trim() || u.email} — ${u.email}`,
    })) ?? [],
);

const payload = computed(() => data.value?.data);
const client = computed(() => payload.value?.client ?? null);
const clientProfil = computed(() => client.value?.profil as ClientProfil);
const clientStats = computed(() => {
  const s = client.value?.stats ?? {};
  return [
    { label: 'pages 7 j', value: s.pages7j ?? 0 },
    { label: 'actions 7 j', value: s.actions7j ?? 0 },
    { label: 'jours actifs 30 j', value: s.joursActifs30j ?? 0 },
  ];
});
const enLigne = computed(() => payload.value?.enLigne ?? []);
const kpis = computed(() => payload.value?.kpis ?? null);
const activiteParJour = computed(() => payload.value?.activiteParJour ?? []);
const topPages = computed(() => payload.value?.topPages ?? []);
const topActions = computed(() => payload.value?.topActions ?? []);
const feed = computed(() => payload.value?.feed ?? []);

const maxActivite = computed(() => Math.max(1, ...activiteParJour.value.map((d) => d.evenements)));
const maxPage = computed(() => Math.max(1, ...topPages.value.map((p) => p.count)));
const maxAction = computed(() => Math.max(1, ...topActions.value.map((a) => a.count)));

const kpiCards = computed(() => {
  const k = kpis.value;
  if (!k) return [];
  return [
    { label: 'En ligne', value: k.enLigne, color: 'var(--sage-deep)', live: true },
    { label: 'Actifs 24h', value: k.actifs24h, color: 'var(--text-primary)', live: false },
    { label: 'Actifs 7j', value: k.actifs7j, color: 'var(--text-primary)', live: false },
    { label: 'Actifs 30j', value: k.actifs30j, color: 'var(--text-primary)', live: false },
    {
      label: 'Évén. aujourd’hui',
      value: k.evenementsAujourdhui,
      color: 'var(--honey)',
      live: false,
    },
    { label: 'Inscrits 7j', value: k.inscriptions7j, color: 'var(--honey)', live: false },
  ];
});

function barHeight(value: number, max: number): number {
  return Math.round((value / max) * 100);
}

// ── Auto-refresh présence ───────────────────────────────────────────────────
// Ne JAMAIS empiler les rafraîchissements : si la requête précédente est
// encore en vol (réseau lent, DB qui se réveille), on saute ce tick au lieu
// d'accumuler des requêtes — c'était la cause du « refresh à l'infini ».
// On ne rafraîchit pas non plus quand l'onglet est en arrière-plan.
let timer: ReturnType<typeof setInterval> | null = null;
onMounted(() => {
  timer = setInterval(() => {
    if (!pending.value && document.visibilityState === 'visible') refresh();
  }, 20_000);
});
onUnmounted(() => {
  if (timer) clearInterval(timer);
});

// ── Helpers d'affichage ─────────────────────────────────────────────────────
function nomComplet(u: { nom: string | null; prenom: string | null; email: string }): string {
  const n = [u.prenom, u.nom].filter(Boolean).join(' ').trim();
  return n || u.email;
}
function initiales(u: { nom: string | null; prenom: string | null; email: string }): string {
  const p = (u.prenom ?? '').trim();
  const n = (u.nom ?? '').trim();
  if (p || n) return ((p[0] ?? '') + (n[0] ?? '')).toUpperCase();
  return (u.email[0] ?? '?').toUpperCase();
}
function feedUser(ev: FeedItem): string {
  return nomComplet({ nom: ev.userNom, prenom: ev.userPrenom, email: ev.userEmail });
}

function ilYA(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 10) return "à l'instant";
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} h`;
  const j = Math.floor(h / 24);
  return `${j} j`;
}

function jourCourt(jour: string): string {
  // 'YYYY-MM-DD' → 'DD/MM' compact
  const [, m, d] = jour.split('-');
  return `${d}/${m}`;
}

const PAGE_LABELS: Record<string, string> = {
  '/dashboard': 'Tableau de bord',
  '/ruchers': 'Ruchers',
  '/ruches': 'Ruches',
  '/interventions': 'Interventions',
  '/interventions/nouvelle': 'Nouvelle intervention',
  '/hausses': 'Hausses',
  '/production': 'Production',
  '/production/recoltes': 'Récoltes',
  '/transhumance': 'Transhumance',
  '/elevage': 'Élevage',
  '/elevage/reines': 'Reines',
  '/stocks': 'Stocks',
  '/stocks/alertes': 'Alertes stock',
  '/finances': 'Finances',
  '/finances/bons-livraison': 'Bons de livraison',
  '/clients': 'Clients',
  '/analytics': 'Analytics (perso)',
  '/calendrier': 'Calendrier',
  '/meteo': 'Météo',
  '/alertes': 'Alertes',
  '/parametres': 'Paramètres',
  '/guide': 'Guide',
  '/admin/users': 'Admin · Abonnements',
  '/admin/analytics': 'Admin · Analytics',
};

function pageLabel(path: string | null): string {
  if (!path) return '—';
  if (PAGE_LABELS[path]) return PAGE_LABELS[path];
  // Routes dynamiques : /ruches/:id → "Détail ruche"
  if (path.startsWith('/ruches/')) return 'Détail ruche';
  if (path.startsWith('/ruchers/')) return 'Détail rucher';
  if (path.startsWith('/interventions/')) return 'Détail intervention';
  if (path.startsWith('/finances/facture/')) return 'Facture';
  if (path.startsWith('/clients/')) return 'Fiche client';
  return path;
}

const ACTION_LABELS: Record<string, string> = {
  'intervention:created': 'Intervention créée',
  'recolte:created': 'Récolte enregistrée',
  'vente:created': 'Vente créée',
  'achat:created': 'Achat créé',
  'ruche:created': 'Ruche ajoutée',
  'rucher:created': 'Rucher créé',
  'stock:created': 'Stock ajouté',
  'client:created': 'Client créé',
  'hausse:created': 'Hausse générée',
  'bl:created': 'Bon de livraison créé',
  'reine:created': 'Reine ajoutée',
};

function actionLabel(nom: string): string {
  return ACTION_LABELS[nom] ?? nom;
}
</script>
