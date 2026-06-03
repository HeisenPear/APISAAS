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
          <div
            v-for="u in enLigne"
            :key="u.id"
            class="flex items-center gap-3 border-b px-4 py-2.5 last:border-0"
            style="border-color: var(--border-faint)"
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
          </div>
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

    <!-- Flux d'activité récent -->
    <div class="rounded-[14px] border bg-white" style="border-color: var(--border-default)">
      <div class="border-b px-4 py-3" style="border-color: var(--border-default)">
        <h2 class="text-[14px] font-semibold" style="color: var(--text-primary)">
          Activité récente — qui fait quoi
        </h2>
      </div>
      <div class="max-h-[460px] overflow-y-auto">
        <div
          v-for="ev in feed"
          :key="ev.id"
          class="flex items-center gap-3 border-b px-4 py-2.5 last:border-0"
          style="border-color: var(--border-faint)"
        >
          <span
            class="flex h-7 w-7 shrink-0 items-center justify-center rounded-[8px]"
            :style="
              ev.type === 'action'
                ? 'background: var(--sage-soft, #eef3ec); color: var(--sage-deep)'
                : 'background: var(--honey-soft); color: var(--honey-deep)'
            "
          >
            <UIcon
              :name="ev.type === 'action' ? 'i-lucide-zap' : 'i-lucide-navigation'"
              class="h-3.5 w-3.5"
            />
          </span>
          <div class="min-w-0 flex-1">
            <p class="truncate text-[13px]" style="color: var(--text-primary)">
              <span class="font-medium">{{ feedUser(ev) }}</span>
              <span style="color: var(--text-tertiary)"> · </span>
              <span style="color: var(--text-secondary)">
                {{ ev.type === 'action' ? actionLabel(ev.nom) : pageLabel(ev.nom) }}
              </span>
            </p>
          </div>
          <span class="shrink-0 text-[11px] tabular-nums" style="color: var(--text-quaternary)">
            {{ ilYA(ev.createdAt) }}
          </span>
        </div>
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
  userNom: string | null;
  userPrenom: string | null;
  userEmail: string;
}
interface AnalyticsPayload {
  enLigne: OnlineUser[];
  kpis: Kpis;
  inscriptionsParJour: { jour: string; count: number }[];
  activiteParJour: JourActivite[];
  topPages: Compte[];
  topActions: Compte[];
  feed: FeedItem[];
  schemaReady?: boolean;
}

const { data, pending, refresh } = useFetch<{ data: AnalyticsPayload }>('/api/admin/analytics', {
  key: 'admin-analytics',
  lazy: true,
});

const payload = computed(() => data.value?.data);
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
let timer: ReturnType<typeof setInterval> | null = null;
onMounted(() => {
  timer = setInterval(() => refresh(), 20_000);
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
