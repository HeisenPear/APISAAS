<template>
  <div>
    <NuxtLink
      to="/parametres"
      class="mb-4 inline-flex items-center gap-1 text-sm text-stone-500 transition-colors hover:text-stone-700"
    >
      <UIcon name="i-lucide-arrow-left" class="h-4 w-4" />
      Retour aux paramètres
    </NuxtLink>

    <div class="mb-8">
      <h1 class="text-2xl font-bold tracking-tight text-stone-900">Abonnement</h1>
      <p class="mt-1 text-sm text-stone-500">Choisissez le plan adapté à votre exploitation</p>
    </div>

    <!-- Success/cancel banners -->
    <div
      v-if="route.query.success"
      class="mb-6 flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4"
    >
      <UIcon name="i-lucide-check-circle" class="h-5 w-5 text-emerald-600" />
      <p class="text-sm font-medium text-emerald-800">
        Abonnement activé avec succès ! Votre plan a été mis à jour.
      </p>
    </div>
    <div
      v-if="route.query.canceled"
      class="mb-6 flex items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4"
    >
      <UIcon name="i-lucide-info" class="h-5 w-5 text-amber-600" />
      <p class="text-sm font-medium text-amber-800">Le paiement a été annulé. Aucun changement.</p>
    </div>

    <!-- Current plan banner -->
    <div
      v-if="hasSubscription"
      class="mb-8 flex items-center justify-between rounded-2xl border border-stone-200/60 bg-white p-5 shadow-sm"
    >
      <div class="flex items-center gap-4">
        <div
          class="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br shadow-sm"
          :class="currentPlanGradient"
        >
          <UIcon :name="currentPlanIcon" class="h-6 w-6 text-white" />
        </div>
        <div>
          <p class="font-semibold text-stone-900">Plan {{ currentLimits?.label ?? '' }}</p>
          <p
            v-if="trialActive && !hasStripePortalAccess"
            class="text-sm text-amber-600 font-medium"
          >
            Essai gratuit
            <span v-if="trialDaysLeft !== null">
              — {{ trialDaysLeft }} jour{{ trialDaysLeft !== 1 ? 's' : '' }} restant{{
                trialDaysLeft !== 1 ? 's' : ''
              }}</span
            >
          </p>
          <p v-else class="text-sm text-stone-500">
            Jusqu'à
            {{ currentLimits?.ruches === Infinity ? 'illimité' : (currentLimits?.ruches ?? 10) }}
            ruches
          </p>
        </div>
      </div>
      <UButton
        v-if="hasStripePortalAccess"
        label="Gérer l'abonnement"
        icon="i-lucide-external-link"
        variant="outline"
        color="neutral"
        :loading="loading"
        @click="handleOpenPortal"
      />
      <span
        v-else-if="trialActive"
        class="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700"
      >
        Essai en cours
      </span>
    </div>

    <!-- Bascule mensuel / annuel -->
    <div class="mb-6 flex flex-wrap items-center justify-center gap-3">
      <span
        class="text-sm"
        :class="billing === 'mois' ? 'font-semibold text-stone-900' : 'text-stone-500'"
      >
        Mensuel
      </span>
      <button
        type="button"
        class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors"
        :class="billing === 'an' ? 'bg-amber-500' : 'bg-stone-200'"
        @click="billing = billing === 'an' ? 'mois' : 'an'"
      >
        <span
          class="inline-block h-4 w-4 rounded-full bg-white shadow transition-transform"
          :class="billing === 'an' ? 'translate-x-6' : 'translate-x-1'"
        />
      </button>
      <span
        class="flex items-center gap-1.5 text-sm"
        :class="billing === 'an' ? 'font-semibold text-stone-900' : 'text-stone-500'"
      >
        Annuel
        <span
          class="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700"
        >
          −20% sur tous les plans
        </span>
      </span>
    </div>

    <!-- Plans grid -->
    <div class="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
      <div
        v-for="plan in plans"
        :key="plan.id"
        class="relative flex flex-col rounded-2xl border-2 bg-white p-6 shadow-sm transition-all duration-200 hover:shadow-md"
        :class="
          plan.id === currentPlan
            ? 'border-amber-400 ring-2 ring-amber-400/20'
            : plan.popular
              ? 'border-amber-200'
              : 'border-stone-200/60'
        "
      >
        <!-- Popular badge -->
        <div
          v-if="plan.popular"
          class="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-amber-500 px-3 py-0.5 text-xs font-semibold text-white"
        >
          Populaire
        </div>

        <!-- Current badge -->
        <div
          v-if="plan.id === currentPlan"
          class="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-emerald-500 px-3 py-0.5 text-xs font-semibold text-white"
        >
          Plan actuel
        </div>

        <!-- Plan header -->
        <div class="mb-4 text-center">
          <div
            class="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl"
            :class="plan.iconBg"
          >
            <UIcon :name="plan.icon" class="h-6 w-6" :class="plan.iconColor" />
          </div>
          <h3 class="text-lg font-bold text-stone-900">{{ plan.name }}</h3>
          <p class="mt-0.5 text-xs text-stone-400">{{ plan.subtitle }}</p>
        </div>

        <!-- Price -->
        <div class="mb-4 text-center">
          <div class="flex items-baseline justify-center gap-1">
            <span class="text-3xl font-bold text-stone-900">{{ priceLabel(plan.id) }}</span>
            <span v-if="plan.id !== 'decouverte'" class="text-sm text-stone-400">/mois</span>
          </div>
          <p
            v-if="priceSub(plan.id)"
            class="mt-0.5 text-xs"
            :class="billing === 'an' ? 'font-medium text-emerald-600' : 'text-stone-400'"
          >
            {{ priceSub(plan.id) }}
          </p>
        </div>

        <!-- Features -->
        <ul class="mb-6 flex-1 space-y-2">
          <li
            v-for="feature in plan.features"
            :key="feature"
            class="flex items-start gap-2 text-sm text-stone-600"
          >
            <UIcon name="i-lucide-check" class="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
            <span>{{ feature }}</span>
          </li>
        </ul>

        <!-- CTA -->
        <UButton
          v-if="plan.id === 'decouverte'"
          label="Plan actuel"
          variant="outline"
          color="neutral"
          block
          disabled
        />
        <UButton
          v-else-if="plan.id === currentPlan"
          label="Plan actif"
          variant="outline"
          color="primary"
          block
          disabled
        />
        <UButton
          v-else
          :label="isUpgrade(plan.id) ? 'Passer au ' + plan.name : 'Choisir ' + plan.name"
          :color="plan.popular ? 'primary' : 'neutral'"
          :variant="plan.popular ? 'solid' : 'outline'"
          block
          :loading="loading"
          @click="handleCheckout(plan.id as 'starter' | 'pro' | 'expert')"
        />
      </div>
    </div>

    <!-- FAQ -->
    <div class="mt-10 rounded-2xl border border-stone-200/60 bg-white p-6 shadow-sm">
      <h2 class="mb-4 text-sm font-semibold uppercase tracking-wider text-stone-400">
        Questions fréquentes
      </h2>
      <div class="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div>
          <p class="text-sm font-medium text-stone-900">Puis-je changer de plan à tout moment ?</p>
          <p class="mt-1 text-sm text-stone-500">
            Oui, vous pouvez upgrader ou downgrader à tout moment. Le prorata est calculé
            automatiquement.
          </p>
        </div>
        <div>
          <p class="text-sm font-medium text-stone-900">Comment annuler mon abonnement ?</p>
          <p class="mt-1 text-sm text-stone-500">
            Via le portail de gestion Stripe. Vous conservez l'accès jusqu'à la fin de la période
            payée.
          </p>
        </div>
        <div>
          <p class="text-sm font-medium text-stone-900">Mes données sont-elles conservées ?</p>
          <p class="mt-1 text-sm text-stone-500">
            Oui, même en plan Découverte vos données restent accessibles. Seules les fonctionnalités
            premium sont limitées.
          </p>
        </div>
        <div>
          <p class="text-sm font-medium text-stone-900">Quels moyens de paiement ?</p>
          <p class="mt-1 text-sm text-stone-500">
            Carte bancaire (Visa, Mastercard, Amex) et SEPA. Paiement sécurisé par Stripe.
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { PLAN_CONFIGS } from '~/config/plans';
import type { Plan } from '~/config/plans';

definePageMeta({ layout: 'default' });

const route = useRoute();
const billing = ref<'mois' | 'an'>(route.query.billing === 'an' ? 'an' : 'mois');

// Prix dérivés de PLAN_CONFIGS (source de vérité) pour suivre la bascule.
function priceLabel(planId: string): string {
  const cfg = PLAN_CONFIGS[planId as Plan];
  if (!cfg?.prix) return 'Gratuit';
  const p = billing.value === 'an' ? cfg.prix.an / 12 : cfg.prix.mois;
  return `${p.toFixed(2).replace('.', ',')}€`;
}

function priceSub(planId: string): string | null {
  const cfg = PLAN_CONFIGS[planId as Plan];
  if (!cfg?.prix) return null;
  if (billing.value === 'an') {
    return `${cfg.prix.an.toFixed(2).replace('.', ',')}€ facturés/an · −20%`;
  }
  return planId === 'pro' || planId === 'expert' ? '🎁 2 premiers mois offerts' : null;
}
const notifications = useNotifications();
const {
  currentPlan,
  hasSubscription,
  currentLimits,
  loading,
  checkout,
  openPortal,
  trialActive,
  trialEndsAt,
  hasStripePortalAccess,
} = useSubscription();

const trialDaysLeft = computed(() => {
  if (!trialEndsAt.value) return null;
  const diff = new Date(trialEndsAt.value).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
});

async function handleOpenPortal() {
  try {
    await openPortal();
  } catch (e: unknown) {
    notifications.error(getApiErrorMessage(e, "Erreur lors de l'accès au portail de gestion"));
  }
}

const planOrder = ['decouverte', 'starter', 'pro', 'expert'];

function isUpgrade(planId: string) {
  return planOrder.indexOf(planId) > planOrder.indexOf(currentPlan.value);
}

const currentPlanGradient = computed(() => {
  const map: Record<string, string> = {
    starter: 'from-blue-500 to-blue-600',
    pro: 'from-amber-500 to-amber-600',
    expert: 'from-violet-500 to-violet-600',
  };
  return map[currentPlan.value] ?? 'from-stone-400 to-stone-500';
});

const currentPlanIcon = computed(() => {
  const map: Record<string, string> = {
    starter: 'i-lucide-zap',
    pro: 'i-lucide-crown',
    expert: 'i-lucide-gem',
  };
  return map[currentPlan.value] ?? 'i-lucide-sparkles';
});

const plans = [
  {
    id: 'decouverte',
    name: 'Découverte',
    subtitle: 'Pour débuter',
    price: 'Gratuit',
    priceYear: null,
    icon: 'i-lucide-sparkles',
    iconBg: 'bg-stone-100',
    iconColor: 'text-stone-600',
    popular: false,
    features: [
      '1 ruche · 1 rucher',
      'Interventions de base',
      "Registre d'élevage PDF",
      'Tableau de bord',
      'Mode hors-ligne',
    ],
  },
  {
    id: 'starter',
    name: 'Starter',
    subtitle: 'Apiculteur amateur',
    price: '4,99€',
    priceYear: '47,90€',
    icon: 'i-lucide-zap',
    iconBg: 'bg-blue-50',
    iconColor: 'text-blue-600',
    popular: false,
    features: [
      '10 ruches · 2 ruchers',
      'Tout Découverte +',
      'Production et traçabilité des lots',
      'Gestion des stocks',
      'Facturation PDF (10/mois)',
      'Alertes illimitées',
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    subtitle: 'Apiculteur pro',
    price: '14,99€',
    priceYear: '143,90€',
    icon: 'i-lucide-crown',
    iconBg: 'bg-amber-50',
    iconColor: 'text-amber-600',
    popular: true,
    features: [
      'Ruches & ruchers illimités',
      'Tout Starter +',
      'Score prédictif santé (IA)',
      'Facturation illimitée + TVA auto',
      'Transhumance & ordonnances',
      'Export FEC · Bilan annuel PDF',
      'Équipe (3 membres)',
    ],
  },
  {
    id: 'expert',
    name: 'Expert',
    subtitle: 'Exploitation & syndicats',
    price: '29,99€',
    priceYear: '287,90€',
    icon: 'i-lucide-gem',
    iconBg: 'bg-violet-50',
    iconColor: 'text-violet-600',
    popular: false,
    features: [
      'Tout Pro +',
      'Élevage de reines',
      'Campagnes groupées',
      'Gestion syndicale & associative',
      'Équipe illimitée',
      'Support prioritaire',
      'Accès anticipé aux nouveautés',
    ],
  },
];

async function handleCheckout(plan: 'starter' | 'pro' | 'expert') {
  try {
    await checkout(plan, billing.value);
  } catch (e: unknown) {
    notifications.error(getApiErrorMessage(e, 'Erreur lors de la redirection vers Stripe'));
  }
}

// Refresh profil on mount (in case returning from Stripe)
const authStore = useAuthStore();
const gating = useGating();
const { emit } = useDataBus();
onMounted(async () => {
  if (route.query.success) {
    await authStore.fetchProfil();
    // Le plan a changé → rafraîchir la jauge d'usage (compteurs + limites)
    await gating.refreshUsage();
    emit('subscription:changed');
  }
});
</script>
