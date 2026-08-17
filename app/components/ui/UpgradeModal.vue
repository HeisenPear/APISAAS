<!--
  UpgradeModal — la porte de sortie d'un refus de plan.

  Règle : on ne bloque jamais sec. Quand une fonctionnalité n'est pas dans la
  formule de l'apiculteur, on lui dit LAQUELLE, on lui montre les formules qui
  la contiennent, et on l'emmène au paiement s'il le souhaite.

  Le modal était auparavant générique : il annonçait « limite de X ruches
  atteinte » quel que soit le refus, y compris quand il portait sur la
  transhumance ou l'élevage de reines. Il lit désormais la charge utile du 402
  conservée par `upgrade-interceptor.client.ts`.
-->
<template>
  <UModal v-model:open="isOpen">
    <template #content>
      <div class="p-6">
        <div class="mb-6 text-center">
          <div
            class="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-amber-100"
          >
            <UIcon :name="icone" class="h-6 w-6 text-amber-600" />
          </div>
          <h2 class="text-lg font-semibold text-stone-900">{{ titre }}</h2>
          <p class="mt-1 text-sm text-stone-500">{{ sousTitre }}</p>
          <p v-if="descriptionFeature" class="mx-auto mt-3 max-w-md text-sm text-stone-600">
            {{ descriptionFeature }}
          </p>
        </div>

        <div class="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div
            v-for="offre in offres"
            :key="offre.cle"
            class="flex flex-col rounded-xl border-2 p-4 transition-all"
            :class="
              offre.cle === recommande
                ? 'border-amber-500 bg-amber-50 shadow-sm'
                : 'border-stone-200'
            "
          >
            <div class="mb-2 text-sm font-semibold text-stone-900">{{ offre.label }}</div>
            <div class="mb-1 text-lg font-bold text-amber-600">{{ offre.prix }}</div>
            <div class="text-xs text-stone-500">{{ offre.detail }}</div>

            <!-- Le point qui compte : cette formule règle-t-elle CE blocage ? -->
            <div
              v-if="offre.resout"
              class="mt-2 flex items-center gap-1 text-xs font-medium text-amber-700"
            >
              <UIcon name="i-lucide-check" class="h-3.5 w-3.5 shrink-0" />
              <span>{{ mentionResolution }}</span>
            </div>

            <UButton
              v-if="offre.cle !== currentPlan"
              :label="offre.cle === recommande ? 'Passer à ' + offre.label : 'Choisir'"
              :color="offre.cle === recommande ? 'primary' : 'neutral'"
              :variant="offre.cle === recommande ? 'solid' : 'outline'"
              size="sm"
              class="mt-3 w-full"
              :loading="loading"
              @click="handleUpgrade(offre.cle)"
            />
            <div v-else class="mt-3 text-center text-xs font-medium text-stone-400">
              Plan actuel
            </div>
          </div>
        </div>

        <div class="flex items-center justify-between">
          <NuxtLink
            to="/tarifs"
            class="text-xs text-stone-500 underline-offset-2 hover:underline"
            @click="isOpen = false"
          >
            Comparer toutes les formules
          </NuxtLink>
          <UButton label="Plus tard" variant="ghost" color="neutral" @click="isOpen = false" />
        </div>
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import { FEATURE_CATALOG, PLAN_CONFIGS, getLimit, hasFeature, type Plan } from '~/config/plans';
import type { RefusDePlan } from '~/plugins/upgrade-interceptor.client';

const { currentPlan, loading, checkout } = useSubscription();

const isOpen = defineModel<boolean>({ default: false });

/** Contexte du refus, posé par l'intercepteur de 402. Nul = ouverture manuelle. */
const refus = useState<RefusDePlan | null>('upgrade-modal-refus', () => null);

type PlanPayant = 'starter' | 'pro' | 'expert';
const PAYANTS: PlanPayant[] = ['starter', 'pro', 'expert'];

const ficheFeature = computed(() =>
  refus.value?.feature ? FEATURE_CATALOG.find((f) => f.key === refus.value?.feature) : undefined,
);

const descriptionFeature = computed(() => ficheFeature.value?.description);

const icone = computed(() =>
  refus.value?.code === 'LIMIT_REACHED' ? 'i-lucide-gauge' : 'i-lucide-crown',
);

const titre = computed(() => {
  if (ficheFeature.value) return `${ficheFeature.value.label} n’est pas dans votre formule`;
  if (refus.value?.code === 'LIMIT_REACHED') return 'Limite de votre formule atteinte';
  return 'Cette fonctionnalité demande une autre formule';
});

const sousTitre = computed(() => {
  const actuel = PLAN_CONFIGS[currentPlan.value as Plan]?.label ?? 'Découverte';
  // On ne dit jamais « supprimez-en » : rien n'est perdu, seule la CRÉATION est
  // bornée, et un abonnement rend tout accessible à l'endroit exact où
  // l'apiculteur s'était arrêté. C'est la promesse du verrou de cheptel.
  if (refus.value?.code === 'LIMIT_REACHED' && refus.value.max != null) {
    const quoi = refus.value.limit ?? 'éléments';
    return `Votre formule ${actuel} en autorise ${refus.value.max} (${quoi}) — vos données restent intactes.`;
  }
  return `Voici les formules qui l’incluent, à partir de votre plan ${actuel}.`;
});

const mentionResolution = computed(() =>
  refus.value?.code === 'LIMIT_REACHED' ? 'Lève cette limite' : 'Inclut cette fonctionnalité',
);

/** Une formule règle-t-elle le blocage en cours ? */
function resout(plan: PlanPayant): boolean {
  const r = refus.value;
  if (!r) return false;
  if (r.feature) return hasFeature(plan, r.feature);
  if (r.limit) {
    const max = getLimit(plan, r.limit);
    return max === Infinity || max > (r.current ?? r.max ?? 0);
  }
  return false;
}

const offres = computed(() =>
  PAYANTS.map((cle) => {
    const cfg = PLAN_CONFIGS[cle];
    const ruches = getLimit(cle, 'ruches');
    return {
      cle,
      label: cfg.label,
      prix: cfg.prix ? `${cfg.prix.mois.toFixed(2).replace('.', ',')} €/mois` : 'Gratuit',
      detail: ruches === Infinity ? 'Ruches illimitées' : `Jusqu’à ${ruches} ruches`,
      resout: resout(cle),
    };
  }),
);

/**
 * La formule recommandée est la MOINS CHÈRE qui règle réellement le blocage —
 * pas simplement la suivante dans la grille. Proposer Expert à quelqu'un que
 * Starter débloquerait est une vente forcée, et ça se voit.
 */
const recommande = computed<PlanPayant>(() => {
  const premiere = PAYANTS.find((p) => resout(p));
  if (premiere) return premiere;
  const suivante = PAYANTS.find(
    (p) => PAYANTS.indexOf(p) > PAYANTS.indexOf(currentPlan.value as PlanPayant),
  );
  return suivante ?? 'expert';
});

async function handleUpgrade(plan: PlanPayant) {
  // Redirige vers Stripe Checkout (useSubscription → POST /api/stripe/checkout).
  await checkout(plan);
}

// Un refus consommé ne doit pas colorer la prochaine ouverture du modal.
watch(isOpen, (ouvert) => {
  if (!ouvert) refus.value = null;
});
</script>
