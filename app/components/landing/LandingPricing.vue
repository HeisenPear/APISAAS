<template>
  <section id="tarifs" class="py-16 sm:py-24 md:py-32 bg-white">
    <div class="mx-auto max-w-6xl px-4 sm:px-6">
      <!-- Header -->
      <div class="mx-auto mb-10 max-w-2xl text-center">
        <p
          class="mb-3 text-[11px] font-semibold uppercase tracking-[0.12em]"
          style="color: var(--honey-deep)"
        >
          Tarifs
        </p>
        <h2
          class="text-[30px] font-bold leading-tight tracking-[-0.025em] sm:text-[38px] md:text-[44px]"
          style="color: var(--text-primary)"
        >
          Un plan pour chaque exploitation
        </h2>
        <p class="mt-4 text-[15px] sm:text-[17px]" style="color: var(--text-secondary)">
          Commencez gratuitement. Passez à
          <b style="color: var(--text-primary)">Pro</b> pour tout débloquer, sans limite — 2 mois
          offerts pour l'essayer.
        </p>
      </div>

      <!-- Billing toggle -->
      <div class="mb-10 flex items-center justify-center gap-3">
        <span
          class="text-[13px] font-medium"
          :style="
            billing === 'mois'
              ? `color:var(--text-primary);font-weight:600`
              : `color:var(--text-secondary)`
          "
        >
          Mensuel
        </span>
        <button
          type="button"
          class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200"
          :style="billing === 'an' ? `background:var(--honey)` : `background:var(--surface-muted)`"
          @click="billing = billing === 'an' ? 'mois' : 'an'"
        >
          <span
            class="inline-block h-4 w-4 rounded-full bg-white shadow transition-transform duration-200"
            :class="billing === 'an' ? 'translate-x-6' : 'translate-x-1'"
          />
        </button>
        <span
          class="flex items-center gap-1.5 text-[13px]"
          :style="
            billing === 'an'
              ? `color:var(--text-primary);font-weight:600`
              : `color:var(--text-secondary)`
          "
        >
          Annuel
          <span
            class="rounded-full px-2 py-0.5 text-[11px] font-semibold"
            style="background: var(--sage-soft); color: var(--sage-deep)"
            >−20% sur tous les plans</span
          >
        </span>
      </div>

      <!-- Plans grid -->
      <div class="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <div
          v-for="plan in plans"
          :key="plan.id"
          class="relative flex flex-col rounded-[18px] border p-6 transition-all duration-200"
          :class="plan.highlighted ? 'shadow-xl' : 'hover:shadow-md'"
          :style="
            plan.highlighted
              ? `border-color:var(--honey);box-shadow:0 0 0 3px color-mix(in srgb,var(--honey) 15%,transparent),0 20px 40px rgba(0,0,0,0.08)`
              : `border-color:var(--border-default);background:white`
          "
        >
          <!-- "Le plus populaire" badge -->
          <div
            v-if="plan.highlighted"
            class="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full px-3 py-0.5 text-[11px] font-bold text-white whitespace-nowrap"
            style="background: var(--honey)"
          >
            Le plus populaire
          </div>

          <!-- Trial offer badge -->
          <div
            v-else-if="plan.trialOffer"
            class="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full px-3 py-0.5 text-[11px] font-bold whitespace-nowrap"
            style="
              background: var(--sage-soft);
              color: var(--sage-deep);
              border: 1px solid color-mix(in srgb, var(--sage) 30%, transparent);
            "
          >
            🎁 {{ plan.trialOffer }}
          </div>

          <!-- Plan badge + name -->
          <div class="mb-4">
            <span
              class="mb-2 inline-block rounded-full px-2.5 py-0.5 text-[11px] font-semibold"
              :style="`background:${plan.badgeBg};color:${plan.badgeColor}`"
            >
              {{ plan.badge }}
            </span>
            <h3 class="text-[20px] font-bold tracking-[-0.02em]" style="color: var(--text-primary)">
              {{ plan.name }}
            </h3>
            <p class="mt-0.5 text-[12.5px]" style="color: var(--text-secondary)">
              {{ plan.idealFor }}
            </p>
          </div>

          <!-- Price -->
          <div class="mb-5">
            <div class="flex items-baseline gap-1">
              <span
                class="text-[32px] font-bold tracking-[-0.03em]"
                style="color: var(--text-primary)"
                >{{ displayPrice(plan) }}</span
              >
              <span v-if="plan.prix" class="text-[13px]" style="color: var(--text-tertiary)"
                >/mois</span
              >
            </div>
            <p
              v-if="billing === 'an' && plan.prix"
              class="mt-0.5 text-[12px]"
              style="color: var(--text-tertiary)"
            >
              Soit {{ plan.prix.an }}€/an
              <span class="font-semibold" style="color: var(--sage-deep)"
                >· économisez {{ annualSaving(plan) }}€</span
              >
            </p>
            <p
              v-else-if="!plan.prix"
              class="mt-0.5 text-[12px]"
              style="color: var(--text-tertiary)"
            >
              Gratuit pour toujours
            </p>
            <p
              v-if="plan.id === 'pro'"
              class="mt-0.5 text-[12px] font-semibold"
              style="color: var(--sage-deep)"
            >
              soit moins de 0,50 €/jour
            </p>
            <p
              v-if="billing === 'mois' && (plan.id === 'pro' || plan.id === 'expert')"
              class="mt-1.5 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold"
              style="background: var(--sage-soft); color: var(--sage-deep)"
            >
              🎁 2 premiers mois offerts
            </p>
          </div>

          <!-- Features list -->
          <ul class="mb-6 flex-1 space-y-2">
            <li
              v-for="f in plan.features"
              :key="f.text"
              class="flex items-start gap-2 text-[12.5px]"
              :style="
                f.highlight
                  ? `color:var(--text-primary);font-weight:600`
                  : `color:var(--text-secondary)`
              "
            >
              <UIcon
                name="i-lucide-check"
                class="mt-0.5 h-3.5 w-3.5 shrink-0"
                :style="plan.highlighted ? `color:var(--honey)` : `color:var(--sage)`"
              />
              {{ f.text }}
            </li>
          </ul>

          <!-- CTA -->
          <NuxtLink
            :to="ctaTo(plan)"
            class="block w-full rounded-[11px] py-2.5 text-center text-[13px] font-bold transition-all duration-200"
            :style="
              plan.highlighted
                ? `background:var(--honey);color:white`
                : `border:1.5px solid var(--border-default);color:var(--text-primary);background:var(--surface-muted)`
            "
          >
            {{ plan.cta }}
          </NuxtLink>

          <!-- Incitation à monter d'un cran -->
          <p
            v-if="plan.incitation"
            class="mt-2.5 text-center text-[11px] leading-snug"
            style="color: var(--text-tertiary)"
          >
            {{ plan.incitation }}
          </p>
        </div>
      </div>

      <!-- Guarantees -->
      <div class="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-8">
        <div v-for="g in guarantees" :key="g" class="flex items-center gap-2">
          <UIcon name="i-lucide-shield-check" class="h-4 w-4 shrink-0" style="color: var(--sage)" />
          <span class="text-[12.5px] font-medium" style="color: var(--text-secondary)">{{
            g
          }}</span>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { PLAN_CONFIGS, PLAN_MARKETING, PLANS } from '~/config/plans';

const billing = ref<'mois' | 'an'>('mois');

const guarantees = [
  'Sans engagement',
  'Annulation à tout moment',
  'Données exportables à vie',
  "2 mois offerts sur Pro & Expert · −20% à l'année",
];

function displayPrice(plan: { prix: { mois: number; an: number } | null }): string {
  if (!plan.prix) return 'Gratuit';
  const p = billing.value === 'an' ? plan.prix.an / 12 : plan.prix.mois;
  return `${p.toFixed(2)}€`;
}

const user = useSupabaseUser();

// Plan gratuit → création de compte. Plan payant → on enclenche directement
// le paiement : connecté → /tarifs déclenche le checkout ; déconnecté → on
// crée d'abord le compte, puis retour auto au checkout (créer → payer → onboarding).
function ctaTo(plan: { id: string; prix: { mois: number; an: number } | null }): string {
  if (!plan.prix) return '/register';
  const target = `/tarifs?plan=${plan.id}&billing=${billing.value}&checkout=1`;
  return user.value ? target : `/register?redirect=${encodeURIComponent(target)}`;
}

// Économie annuelle (−20 %) mise en avant quand la bascule est sur « Annuel ».
function annualSaving(plan: { prix: { mois: number; an: number } | null }): number | null {
  if (!plan.prix) return null;
  return Math.round(plan.prix.mois * 12 - plan.prix.an);
}

// Styles de badge par plan (le contenu — accroche, arguments, incitation,
// plan populaire — vient de PLAN_MARKETING, source unique partagée).
const BADGE: Record<string, { label: string; bg: string; color: string }> = {
  decouverte: { label: 'Gratuit', bg: 'var(--surface-muted)', color: 'var(--text-secondary)' },
  starter: { label: 'Amateur', bg: 'var(--surface-muted)', color: 'var(--text-secondary)' },
  pro: { label: 'Recommandé', bg: 'var(--honey-soft)', color: 'var(--honey-deep)' },
  expert: { label: 'Illimité', bg: 'var(--sage-soft)', color: 'var(--sage-deep)' },
};

const plans = PLANS.map((id) => ({
  id,
  name: PLAN_CONFIGS[id].label,
  badge: BADGE[id]!.label,
  badgeBg: BADGE[id]!.bg,
  badgeColor: BADGE[id]!.color,
  idealFor: PLAN_MARKETING[id].cible,
  prix: PLAN_CONFIGS[id].prix,
  highlighted: PLAN_MARKETING[id].populaire,
  trialOffer: null as string | null,
  cta:
    id === 'decouverte'
      ? 'Commencer gratuitement'
      : id === 'pro'
        ? 'Essayer Pro gratuitement'
        : `Choisir ${PLAN_CONFIGS[id].label}`,
  incitation: PLAN_MARKETING[id].incitation,
  features: PLAN_MARKETING[id].bullets.map((b) => ({ text: b.text, highlight: b.fort ?? false })),
}));
</script>
