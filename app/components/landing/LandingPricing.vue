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
          Commencez gratuitement. Évoluez sans engagement.
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
            >jusqu'à −20%</span
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
              Soit {{ plan.prix.an }}€ facturés par an
            </p>
            <p
              v-else-if="!plan.prix"
              class="mt-0.5 text-[12px]"
              style="color: var(--text-tertiary)"
            >
              Gratuit pour toujours
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
            to="/register"
            class="block w-full rounded-[11px] py-2.5 text-center text-[13px] font-bold transition-all duration-200"
            :style="
              plan.highlighted
                ? `background:var(--honey);color:white`
                : `border:1.5px solid var(--border-default);color:var(--text-primary);background:var(--surface-muted)`
            "
          >
            {{ plan.cta }}
          </NuxtLink>
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
const billing = ref<'mois' | 'an'>('mois');

const guarantees = [
  'Sans engagement',
  'Annulation à tout moment',
  'Données exportables à vie',
  '1 mois offert Starter · 2 mois offerts Expert',
];

function displayPrice(plan: { prix: { mois: number; an: number } | null }): string {
  if (!plan.prix) return 'Gratuit';
  const p = billing.value === 'an' ? plan.prix.an / 12 : plan.prix.mois;
  return `${p.toFixed(2)}€`;
}

const plans = [
  {
    id: 'decouverte',
    name: 'Découverte',
    badge: 'Gratuit',
    badgeBg: 'var(--surface-muted)',
    badgeColor: 'var(--text-secondary)',
    idealFor: 'Pour démarrer sans risque',
    prix: null,
    highlighted: false,
    trialOffer: null,
    cta: 'Commencer gratuitement',
    features: [
      { text: '1 ruche · 1 rucher', highlight: true },
      { text: 'Interventions de base', highlight: false },
      { text: "Registre d'élevage PDF officiel", highlight: false },
      { text: 'Déclaration NAPI annuelle', highlight: false },
      { text: 'Graphiques de suivi & recherche globale', highlight: false },
      { text: 'Photos (50 Mo) · couleurs de ruches', highlight: false },
      { text: 'Mode hors-ligne intégré', highlight: false },
      { text: '3 alertes de suivi actives', highlight: false },
    ],
  },
  {
    id: 'starter',
    name: 'Starter',
    badge: 'Amateur',
    badgeBg: 'var(--surface-muted)',
    badgeColor: 'var(--text-secondary)',
    idealFor: "L'apiculteur passionné",
    prix: { mois: 4.99, an: 47.9 },
    highlighted: false,
    trialOffer: '1 mois offert',
    cta: 'Choisir Starter',
    features: [
      { text: '10 ruches · 2 ruchers', highlight: true },
      { text: "14 types d'interventions + groupées", highlight: false },
      { text: 'Suivi reine (naissance, fécondation, perte)', highlight: false },
      { text: 'Stocks & suivi de production', highlight: false },
      { text: 'Traçabilité des lots de miel (CE 178/2002)', highlight: false },
      { text: "Facturation PDF — jusqu'à 10/mois", highlight: false },
      { text: 'QR code par ruche — fiche en 1 scan', highlight: false },
      { text: 'Sync calendrier (iCal)', highlight: false },
      { text: 'Photos (250 Mo) · Export CSV', highlight: false },
      { text: 'Alertes illimitées', highlight: false },
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    badge: 'Recommandé',
    badgeBg: 'var(--honey-soft)',
    badgeColor: 'var(--honey-deep)',
    idealFor: "L'exploitation professionnelle",
    prix: { mois: 14.99, an: 143.9 },
    highlighted: true,
    trialOffer: null,
    cta: 'Choisir Pro',
    features: [
      { text: 'Ruches & ruchers illimités', highlight: true },
      { text: 'Score prédictif santé colonie (IA)', highlight: true },
      { text: 'Rentabilité par ruche et par rucher', highlight: false },
      { text: 'Comparaison de saisons · corrélation météo', highlight: false },
      { text: 'Facturation illimitée + TVA automatique', highlight: false },
      { text: 'Bons de livraison · comptabilité achats', highlight: false },
      { text: 'Export FEC · XLSX · Bilan annuel PDF', highlight: false },
      { text: 'Transhumance & emplacements', highlight: false },
      { text: 'Ordonnances vétérinaires', highlight: false },
      { text: 'Accès réseau communautaire apicole', highlight: false },
      { text: "Équipe jusqu'à 3 membres · 5 Go photos", highlight: false },
    ],
  },
  {
    id: 'expert',
    name: 'Expert',
    badge: 'Illimité',
    badgeBg: 'var(--sage-soft)',
    badgeColor: 'var(--sage-deep)',
    idealFor: 'La grande exploitation & les syndicats',
    prix: { mois: 29.99, an: 299.88 },
    highlighted: false,
    trialOffer: '2 mois offerts',
    cta: 'Choisir Expert',
    features: [
      { text: 'Tout Pro, en totalement illimité', highlight: true },
      { text: 'Élevage de reines (lignées, greffage, tests)', highlight: true },
      { text: 'Campagnes groupées (commandes, traitements)', highlight: true },
      { text: 'Gestion syndicale & associative complète', highlight: true },
      { text: 'Équipe & utilisateurs illimités', highlight: false },
      { text: "Export comptable pour l'expert-comptable (FEC, bilan)", highlight: false },
      { text: 'Support prioritaire & interlocuteur dédié', highlight: false },
      { text: 'Bons de livraison groupés par organisation', highlight: false },
      { text: '20 Go de stockage photos', highlight: false },
      { text: 'Gestion multi-sites & multi-établissements (bientôt)', highlight: false },
      { text: 'Accès anticipé aux nouveautés', highlight: false },
    ],
  },
];
</script>
