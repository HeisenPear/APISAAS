<template>
  <div class="space-y-7">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-[26px] font-semibold tracking-[-0.02em]" style="color: var(--text-primary)">
          Vue d'ensemble
        </h1>
        <p class="text-sm" style="color: var(--text-secondary)">
          Cockpit business — croissance, revenus, acquisition & santé produit
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
      Données analytics indisponibles (tables non migrées). Lancez la migration pour activer le
      cockpit.
    </div>

    <!-- ── KPI principaux ──────────────────────────────────────────── -->
    <div class="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
      <div
        v-for="k in kpis"
        :key="k.label"
        class="rounded-[14px] border bg-white p-4"
        style="border-color: var(--border-default)"
      >
        <p
          class="mb-1 text-[11px] font-semibold uppercase tracking-[0.12em]"
          style="color: var(--honey-deep)"
        >
          {{ k.label }}
        </p>
        <p
          class="text-[22px] font-bold tracking-[-0.02em]"
          :style="`color:${k.color ?? 'var(--text-primary)'}`"
        >
          {{ k.value }}
        </p>
        <p v-if="k.sub" class="text-[11.5px]" style="color: var(--text-tertiary)">{{ k.sub }}</p>
      </div>
    </div>

    <!-- ── Croissance + Répartition plans ──────────────────────────── -->
    <div class="grid grid-cols-1 gap-5 lg:grid-cols-[1.4fr_1fr]">
      <!-- Inscriptions / jour -->
      <div class="rounded-[14px] border bg-white p-5" style="border-color: var(--border-default)">
        <div class="mb-4 flex items-center justify-between">
          <p
            class="text-[11px] font-semibold uppercase tracking-[0.12em]"
            style="color: var(--honey-deep)"
          >
            Inscriptions — 30 jours
          </p>
          <span class="text-[13px] font-semibold" style="color: var(--text-secondary)"
            >{{ totalInscriptions30 }} sur la période</span
          >
        </div>
        <div class="flex items-end gap-1" style="height: 140px">
          <div
            v-for="(d, i) in ov.inscriptionsParJour"
            :key="i"
            class="group relative flex flex-1 flex-col items-center justify-end"
            style="height: 100%"
          >
            <div
              class="w-full rounded-t bg-[var(--honey)]/80 transition-colors group-hover:bg-[var(--honey)]"
              :style="{
                height: `${barH(d.count, maxInscription)}%`,
                minHeight: d.count > 0 ? '3px' : '0',
              }"
            />
            <div
              class="absolute -top-7 hidden whitespace-nowrap rounded bg-stone-800 px-1.5 py-0.5 text-[10px] text-white group-hover:block"
            >
              {{ d.count }} · {{ jourCourt(d.jour) }}
            </div>
          </div>
        </div>
      </div>

      <!-- Répartition par plan -->
      <div class="rounded-[14px] border bg-white p-5" style="border-color: var(--border-default)">
        <p
          class="mb-4 text-[11px] font-semibold uppercase tracking-[0.12em]"
          style="color: var(--honey-deep)"
        >
          Répartition par plan
        </p>
        <div class="space-y-2.5">
          <div v-for="p in plansOrdonnes" :key="p.plan" class="flex items-center gap-3">
            <span
              class="w-20 shrink-0 text-[12.5px] capitalize"
              style="color: var(--text-secondary)"
              >{{ p.plan }}</span
            >
            <div
              class="h-2 flex-1 overflow-hidden rounded-full"
              style="background: var(--surface-muted)"
            >
              <div
                class="h-full rounded-full"
                :style="{
                  width: `${pct(p.total, ov.core.totalUsers)}%`,
                  background: planColor(p.plan),
                }"
              />
            </div>
            <span
              class="w-12 shrink-0 text-right text-[12.5px] font-semibold tabular-nums"
              style="color: var(--text-primary)"
              >{{ p.total }}</span
            >
            <span
              v-if="p.enTrial > 0"
              class="w-16 shrink-0 text-right text-[10.5px]"
              style="color: var(--honey-deep)"
              >{{ p.enTrial }} trial</span
            >
            <span v-else class="w-16 shrink-0" />
          </div>
        </div>
      </div>
    </div>

    <!-- ── Entonnoir d'acquisition ─────────────────────────────────── -->
    <div class="rounded-[14px] border bg-white p-5" style="border-color: var(--border-default)">
      <p
        class="mb-4 text-[11px] font-semibold uppercase tracking-[0.12em]"
        style="color: var(--honey-deep)"
      >
        Entonnoir d'acquisition
      </p>
      <div class="flex flex-wrap items-stretch gap-2">
        <template v-for="(step, i) in funnel" :key="step.label">
          <div
            class="flex-1 rounded-[12px] px-4 py-3"
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
          </div>
          <div
            v-if="i < funnel.length - 1"
            class="flex items-center"
            style="color: var(--text-quaternary)"
          >
            <UIcon name="i-lucide-chevron-right" class="h-5 w-5" />
          </div>
        </template>
      </div>
    </div>

    <!-- ── Santé produit + Sponsoring ──────────────────────────────── -->
    <div class="grid grid-cols-1 gap-5 lg:grid-cols-3">
      <!-- Engagement -->
      <div class="rounded-[14px] border bg-white p-5" style="border-color: var(--border-default)">
        <p
          class="mb-4 text-[11px] font-semibold uppercase tracking-[0.12em]"
          style="color: var(--honey-deep)"
        >
          Engagement produit
        </p>
        <div class="grid grid-cols-3 gap-2 text-center">
          <div>
            <p class="text-[20px] font-bold" style="color: var(--sage-deep)">
              {{ ov.produit.dau ?? 0 }}
            </p>
            <p class="text-[11px]" style="color: var(--text-tertiary)">DAU</p>
          </div>
          <div>
            <p class="text-[20px] font-bold" style="color: var(--sage-deep)">
              {{ ov.produit.wau ?? 0 }}
            </p>
            <p class="text-[11px]" style="color: var(--text-tertiary)">WAU</p>
          </div>
          <div>
            <p class="text-[20px] font-bold" style="color: var(--sage-deep)">
              {{ ov.produit.mau ?? 0 }}
            </p>
            <p class="text-[11px]" style="color: var(--text-tertiary)">MAU</p>
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
      </div>

      <!-- Top pages -->
      <div class="rounded-[14px] border bg-white p-5" style="border-color: var(--border-default)">
        <p
          class="mb-4 text-[11px] font-semibold uppercase tracking-[0.12em]"
          style="color: var(--honey-deep)"
        >
          Pages les plus vues — 7j
        </p>
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
      </div>

      <!-- Sponsoring -->
      <div class="rounded-[14px] border bg-white p-5" style="border-color: var(--border-default)">
        <div class="mb-4 flex items-center justify-between">
          <p
            class="text-[11px] font-semibold uppercase tracking-[0.12em]"
            style="color: var(--honey-deep)"
          >
            Sponsoring
          </p>
          <NuxtLink
            to="/admin/codes-promo"
            class="text-[12px] hover:underline"
            style="color: var(--text-tertiary)"
            >Détail →</NuxtLink
          >
        </div>
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
      </div>
    </div>

    <!-- ── PostHog : conversion landing ────────────────────────────── -->
    <div class="rounded-[14px] border bg-white p-5" style="border-color: var(--border-default)">
      <div class="mb-4 flex items-center justify-between">
        <p
          class="text-[11px] font-semibold uppercase tracking-[0.12em]"
          style="color: var(--honey-deep)"
        >
          Conversion landing & trafic (PostHog · 30j)
        </p>
        <a
          href="https://eu.posthog.com"
          target="_blank"
          rel="noopener"
          class="text-[12px] hover:underline"
          style="color: var(--text-tertiary)"
          >Ouvrir PostHog ↗</a
        >
      </div>

      <!-- Non configuré -->
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
            PostHog → Settings → <strong>Personal API keys</strong> → créer une clé (scope
            <em>Query Read</em>).
          </li>
          <li>
            Ajouter dans Vercel : <code>NUXT_POSTHOG_PERSONAL_API_KEY</code> = la clé
            <code>phx_…</code> et <code>NUXT_POSTHOG_PROJECT_ID</code> = l'ID du projet.
          </li>
          <li>Redéployer — cette section s'allume automatiquement.</li>
        </ol>
      </div>
      <div v-else-if="ph?.error" class="text-[13px]" style="color: var(--status-bad)">
        {{ ph.error }}
      </div>
      <div v-else-if="ph?.funnel" class="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_1fr]">
        <!-- Funnel landing -->
        <div class="flex flex-wrap items-stretch gap-2">
          <div
            class="flex-1 rounded-[12px] px-4 py-3"
            style="background: var(--surface-muted); min-width: 100px"
          >
            <p class="text-[22px] font-bold" style="color: var(--text-primary)">
              {{ ph.funnel.visiteurs }}
            </p>
            <p class="text-[12px]" style="color: var(--text-secondary)">Visiteurs</p>
          </div>
          <div class="flex items-center" style="color: var(--text-quaternary)">
            <UIcon name="i-lucide-chevron-right" class="h-5 w-5" />
          </div>
          <div
            class="flex-1 rounded-[12px] px-4 py-3"
            style="background: var(--surface-muted); min-width: 100px"
          >
            <p class="text-[22px] font-bold" style="color: var(--text-primary)">
              {{ ph.funnel.inscriptions }}
            </p>
            <p class="text-[12px]" style="color: var(--text-secondary)">Inscriptions</p>
            <p class="mt-0.5 text-[11px] font-medium" style="color: var(--sage-deep)">
              {{ ph.funnel.tauxInscription }}%
            </p>
          </div>
          <div class="flex items-center" style="color: var(--text-quaternary)">
            <UIcon name="i-lucide-chevron-right" class="h-5 w-5" />
          </div>
          <div
            class="flex-1 rounded-[12px] px-4 py-3"
            style="background: var(--surface-muted); min-width: 100px"
          >
            <p class="text-[22px] font-bold" style="color: var(--text-primary)">
              {{ ph.funnel.trials }}
            </p>
            <p class="text-[12px]" style="color: var(--text-secondary)">Essais</p>
            <p class="mt-0.5 text-[11px] font-medium" style="color: var(--sage-deep)">
              {{ ph.funnel.tauxTrial }}%
            </p>
          </div>
        </div>
        <!-- Top landing pages -->
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
    </div>

    <!-- ── À surveiller : trials expirants + derniers inscrits ─────── -->
    <div class="grid grid-cols-1 gap-5 lg:grid-cols-2">
      <div class="rounded-[14px] border bg-white p-5" style="border-color: var(--border-default)">
        <p
          class="mb-4 text-[11px] font-semibold uppercase tracking-[0.12em]"
          style="color: var(--honey-deep)"
        >
          Essais qui expirent (≤ 7j)
        </p>
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
      </div>

      <div class="rounded-[14px] border bg-white p-5" style="border-color: var(--border-default)">
        <div class="mb-4 flex items-center justify-between">
          <p
            class="text-[11px] font-semibold uppercase tracking-[0.12em]"
            style="color: var(--honey-deep)"
          >
            Derniers inscrits
          </p>
          <NuxtLink
            to="/admin/users"
            class="text-[12px] hover:underline"
            style="color: var(--text-tertiary)"
            >Tous →</NuxtLink
          >
        </div>
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
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
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
  default: () => ({ data: EMPTY }),
});
const { data: phData } = await useFetch<{ data: PostHogData }>('/api/admin/posthog', {
  default: () => ({ data: { configured: false } }),
  lazy: true,
});

const ov = computed(() => ovData.value?.data ?? EMPTY);
const ph = computed(() => phData.value?.data);

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
  },
  {
    label: 'MRR',
    value: euros(ov.value.revenus.mrr),
    color: 'var(--sage-deep)',
    sub: `${euros(ov.value.revenus.arr)} ARR`,
  },
  { label: 'Payants', value: ov.value.revenus.payants, color: 'var(--sage-deep)', sub: undefined },
  {
    label: 'Essais actifs',
    value: ov.value.core.trialsActifs ?? 0,
    color: 'var(--honey-deep)',
    sub: undefined,
  },
  { label: 'Actifs 7j', value: ov.value.core.actifs7j ?? 0, color: undefined, sub: undefined },
  {
    label: 'Nouveaux 30j',
    value: ov.value.core.inscriptions30j ?? 0,
    color: undefined,
    sub: undefined,
  },
]);

const totalInscriptions30 = computed(() =>
  ov.value.inscriptionsParJour.reduce((s, d) => s + d.count, 0),
);
const maxInscription = computed(() =>
  Math.max(1, ...ov.value.inscriptionsParJour.map((d) => d.count)),
);

const PLAN_ORDER = ['decouverte', 'starter', 'pro', 'expert'];
const plansOrdonnes = computed(() =>
  [...ov.value.parPlan].sort((a, b) => PLAN_ORDER.indexOf(a.plan) - PLAN_ORDER.indexOf(b.plan)),
);

const acquisitionsTotal = computed(() =>
  ov.value.sponsoring.reduce((s, x) => s + x.acquisitions, 0),
);
const onboardingRate = computed(() =>
  pct(ov.value.core.onboardingComplete, ov.value.core.totalUsers),
);

const funnel = computed(() => {
  const demosTotal = ov.value.demos.reduce((s, d) => s + d.count, 0);
  const demosRealisees = ov.value.demos.find((d) => d.statut === 'realise')?.count ?? 0;
  const inscrits = ov.value.core.totalUsers ?? 0;
  const trials = ov.value.core.trialsTotal ?? 0;
  const payants = ov.value.revenus.payants;
  const steps = [
    { label: 'Démos demandées', value: demosTotal, base: 0 },
    { label: 'Démos réalisées', value: demosRealisees, base: demosTotal },
    { label: 'Inscrits', value: inscrits, base: 0 },
    { label: 'Ont essayé (trial)', value: trials, base: inscrits },
    { label: 'Payants', value: payants, base: trials },
  ];
  return steps.map((s) => ({
    label: s.label,
    value: s.value,
    rate: s.base > 0 ? Math.round((s.value / s.base) * 100) : null,
  }));
});

function pct(a?: number, b?: number): number {
  if (!a || !b) return 0;
  return Math.min(100, Math.round((a / b) * 100));
}
function barH(v: number, max: number): number {
  return max > 0 ? Math.round((v / max) * 100) : 0;
}
function jourCourt(iso: string): string {
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}
function joursRestants(iso: string): string {
  const j = Math.ceil((new Date(iso).getTime() - Date.now()) / 86_400_000);
  return j <= 0 ? "aujourd'hui" : `${j}j`;
}
function planColor(plan: string): string {
  return (
    {
      decouverte: 'var(--text-quaternary)',
      starter: '#5e7ba8',
      pro: 'var(--honey)',
      expert: '#8e7cc3',
    }[plan] ?? 'var(--text-tertiary)'
  );
}
function planBadge(plan: string): string {
  return (
    {
      decouverte: 'bg-stone-100 text-stone-600',
      starter: 'bg-blue-50 text-blue-700',
      pro: 'bg-emerald-50 text-emerald-700',
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
