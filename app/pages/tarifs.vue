<script setup lang="ts">
import { PLAN_CONFIGS, PLANS, isPlanAtLeast } from '~/config/plans';
import type { Plan } from '~/config/plans';

definePageMeta({ layout: false });

const user = useSupabaseUser();
const gating = useGating();
const billing = ref<'mois' | 'an'>('mois');

const currentPlan = computed(() => gating.plan.value);

const orderedPlans = PLANS;

const yearlyDiscount = 20; // % de réduction en annuel

function prix(plan: Plan): string {
  const config = PLAN_CONFIGS[plan];
  if (!config.prix) return 'Gratuit';
  const p = billing.value === 'an' ? config.prix.an : config.prix.mois;
  return billing.value === 'an' ? `${(p / 12).toFixed(2)}€/mois` : `${p.toFixed(2)}€/mois`;
}

function prixAnnuel(plan: Plan): string | null {
  const config = PLAN_CONFIGS[plan];
  if (!config.prix) return null;
  return billing.value === 'an' ? `${config.prix.an}€/an` : null;
}

function isCurrentPlan(plan: Plan): boolean {
  return plan === currentPlan.value;
}

function isUpgrade(plan: Plan): boolean {
  return (
    !isCurrentPlan(plan) &&
    isPlanAtLeast(plan, currentPlan.value) &&
    !isPlanAtLeast(currentPlan.value, plan)
  );
}

function isDowngrade(plan: Plan): boolean {
  return (
    !isCurrentPlan(plan) &&
    isPlanAtLeast(currentPlan.value, plan) &&
    !isPlanAtLeast(plan, currentPlan.value)
  );
}

const subscription = useSubscription();
const activatingTrial = ref(false);

async function handleActivateTrial() {
  activatingTrial.value = true;
  try {
    await gating.activateTrial();
    useToast().add({
      title: 'Essai Pro activé !',
      description: '2 mois pour explorer toutes les fonctionnalités Pro.',
      color: 'success',
    });
  } catch (e) {
    useToast().add({ title: getApiErrorMessage(e, 'Erreur activation trial'), color: 'error' });
  } finally {
    activatingTrial.value = false;
  }
}

// Features à afficher dans la liste
const featureLabels: Record<string, string> = {
  interventionsGroupees: 'Interventions groupées',
  templatesIntervention: "Templates d'intervention",
  moduleReine: 'Module Reine',
  chartsEcharts: 'Graphiques avancés',
  photos: 'Photos (ruches, récoltes, stocks)',
  scorePredictif: 'Score prédictif santé',
  analyticsRentabilite: 'Analytics rentabilité',
  comparaisonAnnuelle: 'Comparaison entre saisons',
  correlationMeteoProd: 'Corrélation météo-production',
  production: 'Module Production',
  tracabiliteLots: 'Traçabilité des lots (CE 178/2002)',
  stocksBasique: 'Gestion des stocks',
  clients: 'Gestion clients',
  facturationPdf: 'Facturation PDF',
  bonsLivraison: 'Bons de livraison',
  comptabiliteAchats: 'Comptabilité achats',
  exportFec: 'Export FEC',
  exportXlsx: 'Export XLSX',
  bilanAnnuelPdf: 'Bilan annuel PDF',
  registreElevagePdf: "Registre d'élevage PDF",
  syncIcal: 'Sync iCal',
  qrCodesRuches: 'QR codes ruches',
  modeOffline: 'Mode offline',
  multiUsers: 'Multi-utilisateurs',
  transhumance: 'Transhumance & emplacements',
  ordonnancesVeto: 'Ordonnances vétérinaires',
  elevageReines: 'Élevage de reines',
  copiloteIa: 'Copilote IA (vos données + savoir apicole)',
  analyseMellifere: 'Analyse mellifère des emplacements (RPG)',
  communauteBase: 'Réseau communautaire apicole',
  campagnesGroupees: 'Campagnes groupées (commandes, traitements)',
  gestionSyndicat: 'Gestion syndicale & associative',
  supportPrioritaire: 'Support prioritaire & interlocuteur dédié',
  accesAnticipe: 'Accès anticipé aux nouveautés',
};

const displayFeatures = Object.keys(featureLabels) as (keyof typeof featureLabels)[];

function formatStorage(mb: number): string {
  return mb >= 1024 ? `${mb / 1024} Go` : `${mb} Mo`;
}

function formatEquipe(membres: number): string {
  if (membres === Infinity) return 'Équipe illimitée';
  if (membres > 0) return `Équipe : ${membres} membres invités`;
  return 'Utilisateur unique';
}

const badgeColors: Record<string, string> = {
  neutral: 'bg-stone-100 text-stone-600',
  primary: 'bg-amber-100 text-amber-700',
  warning: 'bg-orange-100 text-orange-700',
  info: 'bg-blue-100 text-blue-700',
};
</script>

<template>
  <div class="min-h-screen bg-[#FAFAF8]">
    <LandingHeader />

    <div class="mx-auto max-w-6xl px-4 pt-28 pb-20 sm:px-6">
      <!-- Back link si connecté -->
      <NuxtLink
        v-if="user"
        to="/dashboard"
        class="mb-8 inline-flex items-center gap-1.5 text-sm font-medium text-amber-600 hover:text-amber-700"
      >
        <UIcon name="i-lucide-arrow-left" class="h-4 w-4" />
        Retour au tableau de bord
      </NuxtLink>

      <div class="mb-10 text-center">
        <h1 class="text-3xl font-bold tracking-tight text-stone-900 sm:text-4xl">
          Choisissez votre plan
        </h1>
        <p class="mt-3 text-lg text-stone-500">
          Gérez votre exploitation avec les outils adaptés à votre taille
        </p>
      </div>

      <!-- Bandeau Factur-X -->
      <div
        class="mb-8 flex items-center gap-4 rounded-[14px] border px-5 py-4"
        style="background: var(--sage-soft); border-color: rgba(122, 150, 118, 0.2)"
      >
        <div
          class="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px]"
          style="background: var(--sage-deep)"
        >
          <UIcon name="i-lucide-file-check" class="h-5 w-5 text-white" />
        </div>
        <div class="flex-1">
          <p class="text-[14px] font-semibold" style="color: var(--text-primary)">
            Facturation électronique 2026 incluse dans tous les plans Starter+
          </p>
          <p class="text-[12.5px]" style="color: var(--text-secondary)">
            Format Factur-X (norme EN 16931) — économisez 15–30 €/mois par rapport à une solution de
            facturation dédiée.
          </p>
        </div>
      </div>

      <!-- Toggle annuel / mensuel -->
      <div class="flex items-center justify-center gap-3 mb-10">
        <span
          class="text-sm text-stone-600"
          :class="billing === 'mois' ? 'font-semibold text-stone-900' : ''"
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
          class="text-sm text-stone-600"
          :class="billing === 'an' ? 'font-semibold text-stone-900' : ''"
        >
          Annuel
          <span
            class="ml-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-700"
          >
            jusqu'à -{{ yearlyDiscount }}%
          </span>
        </span>
      </div>

      <!-- Plans grid -->
      <div class="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4 mb-16">
        <div
          v-for="plan in orderedPlans"
          :key="plan"
          class="relative rounded-2xl border bg-white p-6 flex flex-col transition-shadow hover:shadow-lg"
          :class="[
            isCurrentPlan(plan) ? 'border-amber-400 ring-2 ring-amber-400/30' : 'border-stone-200',
            plan === 'pro' ? 'shadow-md' : '',
          ]"
        >
          <!-- Badge plan actuel -->
          <div
            v-if="isCurrentPlan(plan)"
            class="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-amber-500 px-3 py-0.5 text-xs font-semibold text-white whitespace-nowrap"
          >
            Plan actuel
          </div>

          <!-- Badge "Le plus populaire" sur Pro (si pas plan actuel) -->
          <div
            v-else-if="plan === 'pro'"
            class="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-amber-500 px-3 py-0.5 text-xs font-bold text-white whitespace-nowrap"
          >
            Le plus populaire
          </div>

          <!-- Header plan -->
          <div class="mb-4">
            <span
              v-if="PLAN_CONFIGS[plan].badge"
              class="inline-block rounded-full px-2 py-0.5 text-xs font-semibold mb-2"
              :class="badgeColors[PLAN_CONFIGS[plan].badge!.color] ?? 'bg-stone-100 text-stone-600'"
            >
              {{ PLAN_CONFIGS[plan].badge!.label }}
            </span>
            <h3 class="text-xl font-bold text-stone-900">{{ PLAN_CONFIGS[plan].label }}</h3>
            <p class="text-sm text-stone-500 mt-1">{{ PLAN_CONFIGS[plan].description }}</p>
          </div>

          <!-- Prix -->
          <div class="mb-6">
            <div class="text-3xl font-bold text-stone-900">{{ prix(plan) }}</div>
            <div v-if="prixAnnuel(plan)" class="text-xs text-stone-400 mt-0.5">
              {{ prixAnnuel(plan) }}
            </div>
            <div v-else-if="!PLAN_CONFIGS[plan].prix" class="text-xs text-stone-400 mt-0.5">
              Pour toujours
            </div>
          </div>

          <!-- Features -->
          <ul class="flex-1 space-y-2 mb-6">
            <!-- Limites numériques -->
            <li class="flex items-center gap-2 text-sm">
              <UIcon name="i-lucide-hexagon" class="text-amber-500 shrink-0 h-4 w-4" />
              <span class="text-stone-700">
                {{
                  PLAN_CONFIGS[plan].limites.ruches === Infinity
                    ? 'Ruches illimitées'
                    : `${PLAN_CONFIGS[plan].limites.ruches} ruche${PLAN_CONFIGS[plan].limites.ruches > 1 ? 's' : ''}`
                }}
              </span>
            </li>
            <li class="flex items-center gap-2 text-sm">
              <UIcon name="i-lucide-map-pin" class="text-amber-500 shrink-0 h-4 w-4" />
              <span class="text-stone-700">
                {{
                  PLAN_CONFIGS[plan].limites.ruchers === Infinity
                    ? 'Ruchers illimités'
                    : `${PLAN_CONFIGS[plan].limites.ruchers} rucher${PLAN_CONFIGS[plan].limites.ruchers > 1 ? 's' : ''}`
                }}
              </span>
            </li>
            <li class="flex items-center gap-2 text-sm">
              <UIcon name="i-lucide-image" class="text-amber-500 shrink-0 h-4 w-4" />
              <span class="text-stone-700">
                Stockage photos : {{ formatStorage(PLAN_CONFIGS[plan].limites.photosStorageMb) }}
              </span>
            </li>
            <li class="flex items-center gap-2 text-sm">
              <UIcon name="i-lucide-users" class="text-amber-500 shrink-0 h-4 w-4" />
              <span class="text-stone-700">
                {{ formatEquipe(PLAN_CONFIGS[plan].limites.membresEquipe) }}
              </span>
            </li>
            <!-- Features booléennes (check vert = inclus, croix grise = restreint) -->
            <li
              v-for="feature in displayFeatures"
              :key="feature"
              class="flex items-center gap-2 text-sm"
              :class="
                PLAN_CONFIGS[plan].features[
                  feature as keyof (typeof PLAN_CONFIGS)[typeof plan]['features']
                ]
                  ? 'text-stone-700'
                  : 'text-stone-300'
              "
            >
              <UIcon
                :name="
                  PLAN_CONFIGS[plan].features[
                    feature as keyof (typeof PLAN_CONFIGS)[typeof plan]['features']
                  ]
                    ? 'i-lucide-check'
                    : 'i-lucide-x'
                "
                class="shrink-0 h-4 w-4"
                :class="
                  PLAN_CONFIGS[plan].features[
                    feature as keyof (typeof PLAN_CONFIGS)[typeof plan]['features']
                  ]
                    ? 'text-green-500'
                    : 'text-stone-200'
                "
              />
              {{ featureLabels[feature] }}
            </li>
          </ul>

          <!-- CTA -->
          <div class="flex flex-col gap-2">
            <!-- Plan actuel -->
            <UButton v-if="isCurrentPlan(plan)" disabled color="neutral" variant="soft" block>
              Plan actuel
            </UButton>

            <!-- Upgrade -->
            <UButton
              v-else-if="isUpgrade(plan) && PLAN_CONFIGS[plan].prix"
              color="primary"
              block
              @click="subscription.checkout(plan as 'starter' | 'pro' | 'expert')"
            >
              Passer au plan {{ PLAN_CONFIGS[plan].label }}
            </UButton>

            <!-- Downgrade -->
            <UButton
              v-else-if="isDowngrade(plan)"
              color="neutral"
              variant="outline"
              block
              @click="subscription.checkout(plan as 'starter' | 'pro' | 'expert')"
            >
              Rétrograder vers {{ PLAN_CONFIGS[plan].label }}
            </UButton>

            <!-- Plan Découverte : passer au premier plan payant -->
            <UButton
              v-else-if="plan !== 'decouverte' && !isCurrentPlan(plan)"
              color="primary"
              block
              @click="subscription.checkout(plan as 'starter' | 'pro' | 'expert')"
            >
              Choisir {{ PLAN_CONFIGS[plan].label }}
            </UButton>

            <!-- Essai Pro pour plan Découverte sans trial utilisé -->
            <UButton
              v-if="
                plan === 'pro' &&
                currentPlan === 'decouverte' &&
                !gating.trial.value?.active &&
                !gating.usageData.value?.trial?.active
              "
              color="neutral"
              variant="soft"
              block
              :loading="activatingTrial"
              @click="handleActivateTrial"
            >
              Essayer Pro 2 mois gratuitement
            </UButton>
          </div>
        </div>
      </div>

      <!-- FAQ -->
      <div class="max-w-2xl mx-auto mb-16">
        <h2 class="text-2xl font-bold text-stone-900 mb-6 text-center">Questions fréquentes</h2>
        <div class="space-y-4">
          <UCollapsible
            v-for="faq in faqs"
            :key="faq.q"
            class="rounded-xl border border-stone-200 overflow-hidden"
          >
            <template #trigger>
              <div class="flex items-center justify-between p-4 cursor-pointer hover:bg-stone-50">
                <span class="font-medium text-stone-800">{{ faq.q }}</span>
                <UIcon name="i-lucide-chevron-down" class="text-stone-400 transition-transform" />
              </div>
            </template>
            <div class="px-4 pb-4 text-sm text-stone-600">{{ faq.a }}</div>
          </UCollapsible>
        </div>
      </div>
    </div>

    <LandingFooter />
  </div>
</template>

<script lang="ts">
const faqs = [
  {
    q: 'Que se passe-t-il si je rétrograde ?',
    a: 'Vos données sont toujours préservées. En cas de rétrogradation, les ressources excédentaires (ruches, clients, etc.) passent en lecture seule — vous pouvez les consulter mais plus en créer de nouvelles.',
  },
  {
    q: "Mes données sont-elles supprimées si j'annule ?",
    a: 'Non, jamais. Vos données restent dans votre compte. Vous pouvez les consulter et les exporter. Seules les fonctionnalités premium sont désactivées.',
  },
  {
    q: "L'essai gratuit nécessite-t-il une carte bancaire ?",
    a: "Non. L'essai Pro 2 mois est entièrement gratuit, sans carte bancaire requise. À la fin de l'essai, vous repassez automatiquement au plan Découverte.",
  },
  {
    q: 'Puis-je changer de plan à tout moment ?',
    a: 'Oui. Vous pouvez upgrader ou downgrader à tout moment. Les changements sont effectifs immédiatement. La facturation est proratisée.',
  },
  {
    q: 'Le plan Découverte est-il vraiment gratuit ?',
    a: "Oui, le plan Découverte est gratuit à vie et inclut 1 ruche, les interventions de base et le registre d'élevage réglementaire.",
  },
];
</script>
