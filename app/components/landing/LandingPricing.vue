<template>
  <section id="tarifs" class="bg-white py-12 sm:py-20 md:py-28">
    <div class="mx-auto max-w-6xl px-4 sm:px-6">
      <!-- Section header -->
      <div class="mx-auto mb-10 max-w-2xl text-center">
        <p class="mb-3 text-xs font-semibold uppercase tracking-widest text-amber-500">Tarifs</p>
        <h2 class="text-xl font-bold tracking-tight text-stone-900 sm:text-3xl md:text-4xl">
          Un plan pour chaque exploitation
        </h2>
        <p class="mt-4 text-sm sm:text-lg text-stone-500">
          Commencez gratuitement. Évoluez selon vos besoins.
        </p>
      </div>

      <!-- Toggle -->
      <div class="mb-10 flex items-center justify-center gap-3">
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
            >−20 %</span
          >
        </span>
      </div>

      <!-- Plans grid -->
      <div class="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
        <div
          v-for="plan in plans"
          :key="plan.id"
          class="relative flex flex-col rounded-2xl border p-6 transition-all duration-200 hover:shadow-lg"
          :class="
            plan.id === 'pro'
              ? 'border-amber-400 ring-2 ring-amber-400/20 shadow-md'
              : 'border-stone-200 bg-white'
          "
        >
          <!-- Popular badge -->
          <div
            v-if="plan.id === 'pro'"
            class="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-amber-500 px-3 py-0.5 text-xs font-bold text-white whitespace-nowrap"
          >
            Le plus populaire
          </div>

          <!-- Plan badge -->
          <div v-if="plan.badge" class="mb-3">
            <span class="rounded-full px-2.5 py-0.5 text-xs font-semibold" :class="plan.badgeClass">
              {{ plan.badge }}
            </span>
          </div>

          <!-- Name & desc -->
          <h3 class="text-xl font-bold text-stone-900">{{ plan.name }}</h3>
          <p class="mt-1 text-sm text-stone-500">{{ plan.description }}</p>

          <!-- Price -->
          <div class="mt-5 mb-6">
            <div class="text-3xl font-bold text-stone-900">{{ price(plan) }}</div>
            <div v-if="billing === 'an' && plan.prix" class="mt-0.5 text-xs text-stone-400">
              {{ plan.prix.an }}€/an
            </div>
            <div v-else-if="!plan.prix" class="mt-0.5 text-xs text-stone-400">Pour toujours</div>
          </div>

          <!-- Features -->
          <ul class="flex-1 space-y-2.5 mb-6">
            <li
              v-for="f in plan.features"
              :key="f"
              class="flex items-start gap-2 text-sm text-stone-600"
            >
              <UIcon name="i-lucide-check" class="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
              {{ f }}
            </li>
          </ul>

          <!-- CTA -->
          <NuxtLink
            to="/register"
            class="block w-full rounded-xl py-2.5 text-center text-sm font-semibold transition-all duration-200"
            :class="
              plan.id === 'pro'
                ? 'bg-amber-500 text-white shadow-sm hover:bg-amber-600 hover:shadow-md'
                : 'border border-stone-200 text-stone-700 hover:bg-stone-50'
            "
          >
            {{ plan.cta }}
          </NuxtLink>
        </div>
      </div>

      <!-- Engagement guarantee -->
      <div class="mt-12 rounded-lg border border-stone-200/60 bg-stone-50/50 px-6 py-4 text-center">
        <div class="flex flex-col items-center justify-center gap-4 sm:flex-row sm:gap-8">
          <div class="flex items-center gap-2">
            <UIcon name="i-lucide-check-circle" class="h-5 w-5 text-green-600" />
            <span class="text-sm font-medium text-stone-700">Sans engagement</span>
          </div>
          <div class="flex items-center gap-2">
            <UIcon name="i-lucide-check-circle" class="h-5 w-5 text-green-600" />
            <span class="text-sm font-medium text-stone-700">Annulation à tout moment</span>
          </div>
          <div class="flex items-center gap-2">
            <UIcon name="i-lucide-check-circle" class="h-5 w-5 text-green-600" />
            <span class="text-sm font-medium text-stone-700">Pas de frais cachés</span>
          </div>
        </div>
      </div>

      <!-- CTA tarifs complet -->
      <div class="mt-10 text-center">
        <NuxtLink to="/tarifs" class="text-sm font-medium text-amber-600 hover:text-amber-700">
          Voir le détail complet des fonctionnalités →
        </NuxtLink>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
const billing = ref<'mois' | 'an'>('mois');

const plans = [
  {
    id: 'decouverte',
    name: 'Découverte',
    description: 'Pour démarrer sans engagement',
    badge: null,
    badgeClass: '',
    prix: null,
    features: [
      '1 ruche, 1 rucher',
      'Interventions de base',
      "Registre d'élevage PDF",
      'Mode hors-ligne',
    ],
    cta: 'Commencer gratuitement',
  },
  {
    id: 'starter',
    name: 'Starter',
    description: "Pour l'apiculteur passionné",
    badge: 'Débutant',
    badgeClass: 'bg-stone-100 text-stone-600',
    prix: { mois: 4.99, an: 47.9 },
    features: [
      '30 ruches, 3 ruchers',
      'Toutes les interventions',
      'Analytics de base',
      'Stocks & production',
    ],
    cta: 'Choisir Starter',
  },
  {
    id: 'pro',
    name: 'Pro',
    description: "Pour l'exploitation professionnelle",
    badge: 'Recommandé',
    badgeClass: 'bg-amber-100 text-amber-700',
    prix: { mois: 14.99, an: 143.9 },
    features: [
      '100 ruches, 10 ruchers',
      'Analytics rentabilité',
      'Facturation PDF conforme',
      'QR code par ruche — accès fiche en 1 scan',
    ],
    cta: 'Choisir Pro',
  },
  {
    id: 'expert',
    name: 'Expert',
    description: 'Pour la grande exploitation',
    badge: 'Illimité',
    badgeClass: 'bg-blue-100 text-blue-700',
    prix: { mois: 39.99, an: 383.9 },
    features: [
      'Ruches & ruchers illimités',
      'Multi-utilisateurs',
      'QR code par ruche — accès fiche en 1 scan',
      'Support prioritaire',
    ],
    cta: 'Choisir Expert',
  },
];

function price(plan: (typeof plans)[0]): string {
  if (!plan.prix) return 'Gratuit';
  const p = billing.value === 'an' ? plan.prix.an / 12 : plan.prix.mois;
  return `${p.toFixed(2)}€/mois`;
}
</script>
