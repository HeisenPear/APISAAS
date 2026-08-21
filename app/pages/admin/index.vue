<template>
  <div class="space-y-7">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-[26px] font-semibold tracking-[-0.02em]" style="color: var(--text-primary)">
          Vue d'ensemble
        </h1>
        <p class="text-sm" style="color: var(--text-secondary)">
          Cockpit business — cliquez sur un graphique pour entrer dans le détail
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

    <div
      v-if="!ov.schemaReady && !pending"
      class="rounded-[12px] border p-4 text-[13px]"
      style="
        border-color: var(--status-warn);
        background: rgba(200, 127, 42, 0.06);
        color: var(--status-warn);
      "
    >
      Données analytics indisponibles (tables non migrées).
    </div>

    <!-- ── KPI principaux (cliquables) ─────────────────────────────── -->
    <div class="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
      <NuxtLink
        v-for="k in kpis"
        :key="k.label"
        :to="k.to"
        class="rounded-[14px] border bg-white p-4 transition-all hover:-translate-y-0.5 hover:shadow-md"
        style="border-color: var(--border-default)"
      >
        <p
          class="mb-1 text-[11px] font-semibold uppercase tracking-[0.12em]"
          style="color: var(--honey-deep)"
        >
          {{ k.label }}
        </p>
        <div
          v-if="loadingFirst"
          class="h-[26px] w-16 animate-pulse rounded-md"
          style="background: var(--surface-muted)"
        />
        <p
          v-else
          class="text-[22px] font-bold tracking-[-0.02em]"
          :style="`color:${k.color ?? 'var(--text-primary)'}`"
        >
          {{ k.value }}
        </p>
        <p v-if="k.sub && !loadingFirst" class="text-[11.5px]" style="color: var(--text-tertiary)">
          {{ k.sub }}
        </p>
      </NuxtLink>
    </div>

    <!-- ── Inscriptions (bar) + Répartition plans (donut) ──────────── -->
    <div class="grid grid-cols-1 gap-5 lg:grid-cols-[1.4fr_1fr]">
      <AdminCard
        title="Inscriptions — 30 jours"
        :badge="`${totalInscriptions30} sur la période`"
        detail-to="/admin/analytics"
      >
        <AdminChart
          :option="inscriptionsOption"
          :height="180"
          clickable
          @click="go('/admin/analytics')"
        />
      </AdminCard>

      <AdminCard title="Répartition par plan" hint="cliquez une part">
        <AdminChart :option="planOption" :height="180" clickable @click="onPlanClick" />
      </AdminCard>
    </div>

    <!-- ── Entonnoir d'acquisition (étapes cliquables) ─────────────── -->
    <AdminCard title="Entonnoir d'acquisition">
      <div class="flex flex-wrap items-stretch gap-2">
        <template v-for="(step, i) in funnel" :key="step.label">
          <NuxtLink
            :to="step.to"
            class="flex-1 rounded-[12px] px-4 py-3 transition-colors hover:brightness-95"
            style="background: var(--surface-muted); min-width: 120px"
          >
            <p class="text-[22px] font-bold tracking-[-0.02em]" style="color: var(--text-primary)">
              {{ step.value }}
            </p>
            <p class="text-[12px]" style="color: var(--text-secondary)">{{ step.label }}</p>
            <p
              v-if="step.rate !== null"
              class="mt-0.5 text-[11px] font-medium"
              style="color: var(--sage-deep)"
            >
              {{ step.rate }}% de l'étape préc.
            </p>
          </NuxtLink>
          <div
            v-if="i < funnel.length - 1"
            class="flex items-center"
            style="color: var(--text-quaternary)"
          >
            <UIcon name="i-lucide-chevron-right" class="h-5 w-5" />
          </div>
        </template>
      </div>
    </AdminCard>

    <!-- ── Activité produit 14j (chart cliquable) ──────────────────── -->
    <AdminCard
      title="Activité produit — 14 jours"
      badge="événements & utilisateurs actifs"
      detail-to="/admin/analytics"
    >
      <AdminChart
        :option="activiteOption"
        :height="200"
        clickable
        @click="go('/admin/analytics')"
      />
    </AdminCard>

    <!-- ── Engagement · Top pages · Sponsoring ─────────────────────── -->
    <div class="grid grid-cols-1 gap-5 lg:grid-cols-3">
      <AdminCard title="Engagement produit">
        <div class="grid grid-cols-3 gap-2 text-center">
          <div v-for="m in dauWauMau" :key="m.k">
            <p class="text-[20px] font-bold" style="color: var(--sage-deep)">{{ m.v }}</p>
            <p class="text-[11px]" style="color: var(--text-tertiary)">{{ m.k }}</p>
          </div>
        </div>
        <div class="mt-4 space-y-2 border-t pt-3" style="border-color: var(--border-default)">
          <div class="flex items-center justify-between text-[12.5px]">
            <span style="color: var(--text-secondary)">Onboarding complété</span>
            <span class="font-semibold" style="color: var(--text-primary)"
              >{{ onboardingRate }}%</span
            >
          </div>
          <div class="flex items-center justify-between text-[12.5px]">
            <span style="color: var(--text-secondary)">Ont créé ≥1 ruche</span>
            <span class="font-semibold" style="color: var(--text-primary)">{{
              ov.activation.avecRuche ?? 0
            }}</span>
          </div>
          <div class="flex items-center justify-between text-[12.5px]">
            <span style="color: var(--text-secondary)">Ont saisi ≥1 intervention</span>
            <span class="font-semibold" style="color: var(--text-primary)">{{
              ov.activation.avecIntervention ?? 0
            }}</span>
          </div>
        </div>
      </AdminCard>

      <AdminCard title="Pages les plus vues — 7j" detail-to="/admin/analytics">
        <div v-if="ov.topPages.length" class="space-y-2">
          <div v-for="p in ov.topPages.slice(0, 7)" :key="p.nom" class="flex items-center gap-2">
            <span class="flex-1 truncate text-[12.5px]" style="color: var(--text-secondary)">{{
              p.nom
            }}</span>
            <div
              class="h-1.5 w-20 overflow-hidden rounded-full"
              style="background: var(--surface-muted)"
            >
              <div
                class="h-full rounded-full"
                :style="{
                  width: `${pct(p.count, ov.topPages[0]?.count)}%`,
                  background: 'var(--honey)',
                }"
              />
            </div>
            <span
              class="w-8 text-right text-[12px] font-semibold tabular-nums"
              style="color: var(--text-primary)"
              >{{ p.count }}</span
            >
          </div>
        </div>
        <p v-else class="text-[12.5px]" style="color: var(--text-tertiary)">
          Aucune donnée d'activité.
        </p>
      </AdminCard>

      <AdminCard title="Sponsoring" detail-to="/admin/codes-promo">
        <p class="text-[22px] font-bold tracking-[-0.02em]" style="color: var(--text-primary)">
          {{ acquisitionsTotal
          }}<span class="text-[13px] font-medium" style="color: var(--text-tertiary)">
            acquisitions</span
          >
        </p>
        <div class="mt-3 space-y-2">
          <div
            v-for="s in ov.sponsoring"
            :key="s.typeSponsoring"
            class="flex items-center justify-between text-[12.5px]"
          >
            <span class="capitalize" style="color: var(--text-secondary)">{{
              sponsorLabel(s.typeSponsoring)
            }}</span>
            <span class="font-semibold tabular-nums" style="color: var(--text-primary)">{{
              s.acquisitions
            }}</span>
          </div>
          <p v-if="!ov.sponsoring.length" class="text-[12.5px]" style="color: var(--text-tertiary)">
            Aucun code créé.
          </p>
        </div>
      </AdminCard>
    </div>

    <!-- ── PostHog : conversion landing ────────────────────────────── -->
    <AdminCard
      title="Conversion landing & trafic (PostHog · 30j)"
      external="https://eu.posthog.com"
    >
      <div
        v-if="ph && !ph.configured"
        class="rounded-[12px] border border-dashed p-4 text-[13px]"
        style="border-color: var(--border-hover); color: var(--text-secondary)"
      >
        <p class="font-medium" style="color: var(--text-primary)">
          Connecter PostHog pour voir le trafic anonyme & la conversion landing
        </p>
        <ol class="mt-2 list-decimal space-y-1 pl-5 text-[12.5px]">
          <li>
            PostHog → Settings → <strong>Personal API keys</strong> (scope <em>Query Read</em>).
          </li>
          <li>
            Vercel : <code>NUXT_POSTHOG_PERSONAL_API_KEY</code> = <code>phx_…</code> +
            <code>NUXT_POSTHOG_PROJECT_ID</code>.
          </li>
          <li>Redéployer — la section s'allume.</li>
        </ol>
      </div>
      <div v-else-if="ph?.error" class="text-[13px]" style="color: var(--status-bad)">
        {{ ph.error }}
      </div>
      <div v-else-if="ph?.funnel" class="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_1fr]">
        <div class="flex flex-wrap items-stretch gap-2">
          <div
            v-for="(s, i) in phFunnel"
            :key="s.label"
            class="flex items-stretch"
            :class="i < phFunnel.length - 1 ? '' : 'flex-1'"
            style="min-width: 0"
          >
            <div
              class="flex-1 rounded-[12px] px-4 py-3"
              style="background: var(--surface-muted); min-width: 96px"
            >
              <p class="text-[22px] font-bold" style="color: var(--text-primary)">{{ s.value }}</p>
              <p class="text-[12px]" style="color: var(--text-secondary)">{{ s.label }}</p>
              <p
                v-if="s.rate !== null"
                class="mt-0.5 text-[11px] font-medium"
                style="color: var(--sage-deep)"
              >
                {{ s.rate }}%
              </p>
            </div>
            <div
              v-if="i < phFunnel.length - 1"
              class="flex items-center px-1"
              style="color: var(--text-quaternary)"
            >
              <UIcon name="i-lucide-chevron-right" class="h-5 w-5" />
            </div>
          </div>
        </div>
        <div>
          <p
            class="mb-2 text-[11.5px] font-semibold uppercase tracking-[0.08em]"
            style="color: var(--text-tertiary)"
          >
            Pages publiques les plus vues
          </p>
          <div class="space-y-1.5">
            <div
              v-for="p in (ph.topPages ?? []).slice(0, 6)"
              :key="p.url"
              class="flex items-center gap-2 text-[12.5px]"
            >
              <span class="flex-1 truncate" style="color: var(--text-secondary)">{{ p.url }}</span>
              <span class="font-semibold tabular-nums" style="color: var(--text-primary)">{{
                p.vues
              }}</span>
            </div>
          </div>
        </div>
      </div>
      <div v-else class="text-[12.5px]" style="color: var(--text-tertiary)">Chargement…</div>
    </AdminCard>

    <!-- ── À surveiller ────────────────────────────────────────────── -->
    <div class="grid grid-cols-1 gap-5 lg:grid-cols-2">
      <AdminCard title="Essais qui expirent (≤ 7j)">
        <div v-if="ov.trialsExpirants.length" class="space-y-2">
          <NuxtLink
            v-for="u in ov.trialsExpirants"
            :key="u.id"
            :to="`/admin/analytics?userId=${u.id}`"
            class="flex items-center justify-between rounded-[10px] px-3 py-2 transition-colors hover:bg-[var(--surface-muted)]"
          >
            <span class="truncate text-[13px]" style="color: var(--text-primary)"
              >{{ u.prenom }} {{ u.nom }}
              <span style="color: var(--text-tertiary)">· {{ u.email }}</span></span
            >
            <span class="shrink-0 text-[11.5px] font-medium" style="color: var(--status-warn)">{{
              joursRestants(u.trialEndsAt)
            }}</span>
          </NuxtLink>
        </div>
        <p v-else class="text-[12.5px]" style="color: var(--text-tertiary)">
          Aucun essai n'expire dans les 7 jours.
        </p>
      </AdminCard>

      <AdminCard title="Derniers inscrits" detail-to="/admin/users">
        <div v-if="ov.derniersInscrits.length" class="space-y-2">
          <div
            v-for="u in ov.derniersInscrits"
            :key="u.id"
            class="flex items-center justify-between"
          >
            <span class="truncate text-[13px]" style="color: var(--text-primary)"
              >{{ u.prenom }} {{ u.nom }}
              <span style="color: var(--text-tertiary)">· {{ u.email }}</span></span
            >
            <span
              class="shrink-0 rounded-full px-2 py-0.5 text-[10.5px] font-semibold capitalize"
              :class="planBadge(u.plan)"
              >{{ u.plan }}</span
            >
          </div>
        </div>
        <p v-else class="text-[12.5px]" style="color: var(--text-tertiary)">Aucun inscrit.</p>
      </AdminCard>
    </div>
  </div>
</template>

<script setup lang="ts">
import { barHoney } from '~/utils/echarts';

definePageMeta({ layout: 'default', middleware: 'admin' });

interface Overview {
  core: Record<string, number>;
  parPlan: { plan: string; total: number; enTrial: number }[];
  inscriptionsParJour: { jour: string; count: number }[];
  produit: Record<string, number>;
  topPages: { nom: string; count: number }[];
  topActions: { nom: string; count: number }[];
  activiteParJour: { jour: string; evenements: number; utilisateurs: number }[];
  demos: { statut: string; count: number }[];
  sponsoring: { typeSponsoring: string; acquisitions: number; remiseCents: number }[];
  activation: Record<string, number>;
  trialsExpirants: {
    id: string;
    prenom: string;
    nom: string;
    email: string;
    plan: string;
    trialEndsAt: string;
  }[];
  derniersInscrits: {
    id: string;
    prenom: string;
    nom: string;
    email: string;
    plan: string;
    createdAt: string;
  }[];
  revenus: { mrr: number; arr: number; payants: number };
  schemaReady: boolean;
}

interface PostHogData {
  configured: boolean;
  error?: string;
  funnel?: {
    visiteurs: number;
    inscriptions: number;
    trials: number;
    tauxInscription: number;
    tauxTrial: number;
  };
  topPages?: { url: string; vues: number }[];
}

const EMPTY: Overview = {
  core: {},
  parPlan: [],
  inscriptionsParJour: [],
  produit: {},
  topPages: [],
  topActions: [],
  activiteParJour: [],
  demos: [],
  sponsoring: [],
  activation: {},
  trialsExpirants: [],
  derniersInscrits: [],
  revenus: { mrr: 0, arr: 0, payants: 0 },
  schemaReady: false,
};

const {
  data: ovData,
  pending,
  refresh,
} = await useFetch<{ data: Overview }>('/api/admin/overview', {
  // lazy : le cockpit ne BLOQUE plus le rendu en attendant l'agrégat serveur.
  // Sans ça, un pool DB lent (récupération à froid) figeait la page en écran
  // blanc pendant ~8-14 s (« charge à l'infini »). Ici la coquille s'affiche
  // immédiatement avec des skeletons, les chiffres arrivent ensuite.
  lazy: true,
  // Filet réseau : le serveur est déjà borné (warmup + watchdogs), ceci garantit
  // qu'aucun aléa réseau ne laisse la page « tourner » indéfiniment.
  timeout: 20_000,
  default: () => ({ data: EMPTY }),
});
const { data: phData } = await useFetch<{ data: PostHogData }>('/api/admin/posthog', {
  default: () => ({ data: { configured: false } }),
  lazy: true,
});

const ov = computed(() => ovData.value?.data ?? EMPTY);
const ph = computed(() => phData.value?.data);

// Premier chargement en cours : pending ET données pas encore arrivées
// (schemaReady passe à true dès que l'agrégat serveur a répondu). Sert à
// afficher des skeletons plutôt que des « 0 » trompeurs. Un refresh manuel
// (données déjà présentes) ne re-skeletonne pas — seul le spinner du header.
const loadingFirst = computed(() => pending.value && !ov.value.schemaReady);

function go(path: string) {
  navigateTo(path);
}
function onPlanClick(p: { name?: string }) {
  if (p.name) navigateTo(`/admin/users?plan=${p.name}`);
}

const euros = (n: number) =>
  new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(n ?? 0);

const kpis = computed(() => [
  {
    label: 'Utilisateurs',
    value: ov.value.core.totalUsers ?? 0,
    sub: `+${ov.value.core.inscriptions7j ?? 0} cette semaine`,
    color: undefined as string | undefined,
    to: '/admin/users',
  },
  {
    label: 'MRR',
    value: euros(ov.value.revenus.mrr),
    color: 'var(--sage-deep)',
    sub: `${euros(ov.value.revenus.arr)} ARR`,
    to: '/admin/users',
  },
  {
    label: 'Payants',
    value: ov.value.revenus.payants,
    color: 'var(--sage-deep)',
    sub: undefined,
    to: '/admin/users',
  },
  {
    label: 'Essais actifs',
    value: ov.value.core.trialsActifs ?? 0,
    color: 'var(--honey-deep)',
    sub: undefined,
    to: '/admin/users?plan=trial',
  },
  {
    label: 'Actifs 7j',
    value: ov.value.core.actifs7j ?? 0,
    color: undefined,
    sub: undefined,
    to: '/admin/analytics',
  },
  {
    label: 'Nouveaux 30j',
    value: ov.value.core.inscriptions30j ?? 0,
    color: undefined,
    sub: undefined,
    to: '/admin/analytics',
  },
]);

const dauWauMau = computed(() => [
  { k: 'DAU', v: ov.value.produit.dau ?? 0 },
  { k: 'WAU', v: ov.value.produit.wau ?? 0 },
  { k: 'MAU', v: ov.value.produit.mau ?? 0 },
]);

const totalInscriptions30 = computed(() =>
  ov.value.inscriptionsParJour.reduce((s, d) => s + d.count, 0),
);
const acquisitionsTotal = computed(() =>
  ov.value.sponsoring.reduce((s, x) => s + x.acquisitions, 0),
);
const onboardingRate = computed(() =>
  pct(ov.value.core.onboardingComplete, ov.value.core.totalUsers),
);

const PLAN_ORDER = ['decouverte', 'starter', 'pro', 'expert'];
const PLAN_HEX: Record<string, string> = {
  decouverte: '#d6d3d1',
  starter: '#5e7ba8',
  pro: '#f5a623',
  expert: '#8e7cc3',
};

// ── Options ECharts ──────────────────────────────────────────────
const inscriptionsOption = computed(() => ({
  grid: { left: 6, right: 10, top: 12, bottom: 4, containLabel: true },
  tooltip: { trigger: 'axis' },
  xAxis: {
    type: 'category',
    data: ov.value.inscriptionsParJour.map((d) => jourCourt(d.jour)),
    axisLabel: { interval: 4, fontSize: 10 },
  },
  yAxis: { type: 'value', minInterval: 1 },
  series: [
    {
      type: 'bar',
      data: ov.value.inscriptionsParJour.map((d) => d.count),
      itemStyle: { color: barHoney(), borderRadius: [4, 4, 0, 0] },
      barMaxWidth: 18,
    },
  ],
}));

const planOption = computed(() => ({
  tooltip: { trigger: 'item', formatter: '{b} : {c} ({d}%)' },
  legend: { bottom: 0, itemWidth: 10, itemHeight: 10, textStyle: { fontSize: 11 } },
  series: [
    {
      type: 'pie',
      radius: ['46%', '70%'],
      center: ['50%', '44%'],
      avoidLabelOverlap: false,
      label: { show: false },
      labelLine: { show: false },
      data: [...ov.value.parPlan]
        .sort((a, b) => PLAN_ORDER.indexOf(a.plan) - PLAN_ORDER.indexOf(b.plan))
        .map((p) => ({
          name: p.plan,
          value: p.total,
          itemStyle: { color: PLAN_HEX[p.plan] ?? '#706963' },
        })),
    },
  ],
}));

const activiteOption = computed(() => ({
  grid: { left: 6, right: 10, top: 14, bottom: 24, containLabel: true },
  tooltip: { trigger: 'axis' },
  legend: { bottom: 0, data: ['Événements', 'Utilisateurs'], textStyle: { fontSize: 11 } },
  xAxis: {
    type: 'category',
    data: ov.value.activiteParJour.map((d) => jourCourt(d.jour)),
    axisLabel: { fontSize: 10 },
  },
  yAxis: { type: 'value', minInterval: 1 },
  series: [
    {
      name: 'Événements',
      type: 'bar',
      data: ov.value.activiteParJour.map((d) => d.evenements),
      itemStyle: { color: barHoney(), borderRadius: [4, 4, 0, 0] },
      barMaxWidth: 16,
    },
    {
      name: 'Utilisateurs',
      type: 'line',
      data: ov.value.activiteParJour.map((d) => d.utilisateurs),
      smooth: true,
      symbol: 'circle',
      symbolSize: 5,
      lineStyle: { color: '#c9873d', width: 2.5 },
      itemStyle: { color: '#c9873d' },
    },
  ],
}));

const funnel = computed(() => {
  const demosTotal = ov.value.demos.reduce((s, d) => s + d.count, 0);
  const demosRealisees = ov.value.demos.find((d) => d.statut === 'realise')?.count ?? 0;
  const inscrits = ov.value.core.totalUsers ?? 0;
  const trials = ov.value.core.trialsTotal ?? 0;
  const payants = ov.value.revenus.payants;
  const steps = [
    { label: 'Démos demandées', value: demosTotal, base: 0, to: '/admin/demos' },
    { label: 'Démos réalisées', value: demosRealisees, base: demosTotal, to: '/admin/demos' },
    { label: 'Inscrits', value: inscrits, base: 0, to: '/admin/users' },
    { label: 'Ont essayé (trial)', value: trials, base: inscrits, to: '/admin/users?plan=trial' },
    { label: 'Payants', value: payants, base: trials, to: '/admin/users' },
  ];
  return steps.map((s) => ({
    label: s.label,
    value: s.value,
    to: s.to,
    rate: s.base > 0 ? Math.round((s.value / s.base) * 100) : null,
  }));
});

const phFunnel = computed(() => {
  const f = ph.value?.funnel;
  if (!f) return [];
  return [
    { label: 'Visiteurs', value: f.visiteurs, rate: null as number | null },
    { label: 'Inscriptions', value: f.inscriptions, rate: f.tauxInscription },
    { label: 'Essais', value: f.trials, rate: f.tauxTrial },
  ];
});

function pct(a?: number, b?: number): number {
  if (!a || !b) return 0;
  return Math.min(100, Math.round((a / b) * 100));
}
function jourCourt(iso: string): string {
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}
function joursRestants(iso: string): string {
  const j = Math.ceil((new Date(iso).getTime() - Date.now()) / 86_400_000);
  return j <= 0 ? "aujourd'hui" : `${j}j`;
}
function planBadge(plan: string): string {
  return (
    {
      decouverte: 'bg-stone-100 text-stone-600',
      starter: 'bg-blue-50 text-blue-700',
      pro: 'bg-amber-50 text-amber-700',
      expert: 'bg-violet-50 text-violet-700',
    }[plan] ?? 'bg-stone-100 text-stone-600'
  );
}
function sponsorLabel(t: string): string {
  return (
    { ambassadeur: 'Ambassadeur', syndicat: 'Syndicat / asso', magasin: 'Magasin / fournisseur' }[
      t
    ] ?? t
  );
}
</script>
