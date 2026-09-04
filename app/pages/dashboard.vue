<template>
  <div class="space-y-4 sm:space-y-8">
    <!-- Pull-to-refresh indicator -->
    <div
      v-if="pullDistance > 0"
      class="fixed top-0 left-0 right-0 z-50 flex items-center justify-center py-4 bg-[var(--surface-card)] border-b border-[var(--border-default)]"
      :style="{ transform: `translateY(${Math.max(-100 + pullDistance, -100)}%)` }"
    >
      <div class="flex items-center gap-2 text-[var(--text-secondary)]">
        <UIcon name="i-lucide-refresh-ccw" :class="{ 'animate-spin': pulling }" />
        <span>{{ pulling ? 'Actualisation...' : 'Tirer pour actualiser' }}</span>
      </div>
    </div>

    <!--
      ORDRE DE LA PAGE — il répond aux questions de l'apiculteur dans l'ordre où
      il se les pose, et non dans l'ordre où les blocs ont été écrits :

        1. Ce qui presse aujourd'hui  (réglementaire, tournée, Maya)
        2. Où j'en suis               (chiffres)
        3. Le détail                  (production, agenda, alertes, budget…)
        4. Ce qui peut attendre       (activation, découverte du produit)

      La liste d'activation « Bienvenue sur APIGO » ouvrait la page pendant
      30 jours. Elle passe APRÈS le contenu utile : un apiculteur qui ouvre son
      tableau de bord veut voir ses ruches, pas une liste de devoirs.
    -->
    <DeclarationsNapiReminderBanner />

    <!--
      Le salut est porté par UN SEUL bloc.

      Quand Maya est proactive, c'est ELLE qui salue (sa carte ouvre sur une
      salutation) : garder le titre « Bonjour Antoine » juste au-dessus faisait
      deux bonjours empilés. Quand Maya se tait — présence discrète, en pause,
      ou formule sans copilote — le titre reprend son rôle.
    -->
    <div v-if="!mayaSalue">
      <h1
        class="text-[22px] sm:text-[28px] font-semibold tracking-[-0.025em] leading-tight"
        style="
          font-family:
            'SF Pro Display',
            -apple-system,
            system-ui,
            sans-serif;
        "
      >
        {{ greeting }}
      </h1>
      <p class="mt-2 text-[14.5px] text-[var(--text-secondary)] max-w-[580px] leading-[1.55]">
        {{ todayDate
        }}<template v-if="kpiStats[0]?.value">
          · {{ kpiStats[0].value }} ruches surveillées</template
        >
      </p>
    </div>

    <!-- Brief du jour de Maya — surface PROACTIVE : seulement en présence « partout ».
         Le SOIR (≥ 18 h), c'est le bilan du soir qui prend le relais (ci-dessous) :
         on masque le brief du matin « Bonjour, j'ai surveillé… » pour ne pas empiler
         deux messages Maya (web comme mobile/PWA). -->
    <DashboardMayaCard v-if="maya.briefingActif && !estSoir" />

    <!-- Bilan du soir (moment humain) — Maya célèbre la journée et veille la nuit.
         PROACTIF au même titre que le point du jour : Maya prend la parole
         d'elle-même. Donc masqué hors présence « partout » — en discret elle ne
         parle que sur demande, en pause elle se tait complètement. -->
    <IaMayaRecap
      v-if="maya.briefingActif && estSoir && dashboard"
      :interventions="activiteJour"
      :prenom="authStore.profil?.prenom ?? ''"
    />

    <!-- Loading skeleton -->
    <div v-if="pending && !dashboard" class="space-y-6">
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div
          v-for="i in 4"
          :key="i"
          class="h-28 animate-pulse rounded-[14px] bg-[var(--surface-muted)]"
        />
      </div>
      <div class="grid grid-cols-1 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] gap-7">
        <div class="h-80 animate-pulse rounded-[14px] bg-[var(--surface-muted)]" />
        <div class="h-80 animate-pulse rounded-[14px] bg-[var(--surface-muted)]" />
      </div>
    </div>

    <!-- Dashboard content -->
    <template v-else-if="dashboard">
      <!-- TOUT le tableau de bord est ici, en widgets déplaçables (KPIs, tournée,
           cartes). Seule la bannière Maya au-dessus reste fixe. -->
      <DashboardWidgetGrid :dashboard="dashboard" @dismiss-alert="handleDismissAlert" />
    </template>

    <!-- Empty state -->
    <UiEmptyState
      v-else
      icon="i-lucide-layout-dashboard"
      title="Aucune donnée"
      description="Commencez par ajouter votre premier rucher et vos ruches"
      benefit="Suivez la santé de vos colonies en continu"
      action-label="Ajouter un rucher"
      @action="navigateTo('/ruchers/nouveau')"
    />

    <!--
      Prise en main — EN BAS, et c'est le point de la réorganisation.

      Ce bloc s'affiche pendant 30 jours après l'inscription. Placé en tête, il
      reléguait les ruches, la production et les alertes sous une liste de
      devoirs, chaque jour pendant un mois. Il reste utile : on le garde, à sa
      juste place. Il se ferme toujours d'un geste.
    -->
    <DashboardWelcomeBanner />
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'default' });

const authStore = useAuthStore();
const maya = useMayaStore();
const { dashboard, pending, refresh } = useDashboard();
const pullToRefresh = usePullToRefresh(refresh);
const { pulling = ref(false), pullDistance = ref(0) } = pullToRefresh || {};

/**
 * Maya prend-elle la parole en haut de page ?
 *
 * Sa carte s'ouvre sur une salutation. Si elle s'affiche, le titre « Bonjour
 * Antoine » juste au-dessus fait doublon — deux bonjours l'un sur l'autre. On
 * n'en garde qu'un, et c'est Maya qui l'emporte : elle salue ET donne le point
 * du jour, là où le titre ne fait que saluer.
 *
 * `aAcces` et non `hasFeature` : sinon le titre disparaîtrait pour les comptes
 * de l'équipe, chez qui la carte s'affiche par contournement admin.
 */
const { aAcces } = useSubscription();
const mayaSalue = computed(() => maya.proactif && aAcces('copiloteIa'));

const greeting = computed(() => {
  const prenom = authStore.profil?.prenom;
  const hour = new Date().getHours();
  let salutation = 'Bonjour';
  if (hour >= 18) salutation = 'Bonsoir';
  return prenom ? `${salutation}, ${prenom}` : salutation;
});

const todayDate = computed(() => {
  return new Date().toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
});

const productionSparkline = computed(() => {
  if (!dashboard.value?.productionMensuelle) return undefined;
  const values = dashboard.value.productionMensuelle.map((d) => d.total);
  return values.some((v) => v > 0) ? values : undefined;
});

// Bilan du soir : à partir de 18 h, on compte l'activité du jour.
const estSoir = computed(() => new Date().getHours() >= 18);
const activiteJour = computed(() => {
  const items = (dashboard.value?.activiteRecente ?? []) as Array<{ date: string | Date }>;
  const auj = new Date().toDateString();
  return items.filter((a) => new Date(a.date).toDateString() === auj).length;
});

interface KpiItem {
  icon: string;
  value: number;
  label: string;
  trend?: number;
  prefix?: string;
  suffix?: string;
  sparkline?: number[];
}

const kpiStats = computed<KpiItem[]>(() => {
  if (!dashboard.value) return [];
  const k = dashboard.value.kpis;
  return [
    {
      icon: 'i-lucide-box',
      value: k.ruchesActives,
      label: 'Ruches',
      suffix: ` / ${k.totalRuches}`,
    },
    {
      icon: 'i-lucide-droplets',
      value: Math.round(k.productionSaison * 10) / 10,
      label: 'Production',
      suffix: ' kg',
      sparkline: productionSparkline.value,
    },
    {
      icon: 'i-lucide-wallet',
      value: Math.round(k.caTotal),
      label: "Chiffre d'affaires",
      suffix: ' €',
    },
    {
      icon: 'i-lucide-bell-ring',
      value: k.alertesActives,
      label: 'Alertes',
    },
  ];
});

async function handleDismissAlert(id: string) {
  try {
    await $fetch(`/api/alertes/${id}`, {
      method: 'PUT',
      body: { lue: true },
    });
    await refresh();
  } catch {
    // Silently fail
  }
}
</script>
