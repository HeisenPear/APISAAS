<template>
  <section
    id="fonctionnalites"
    class="py-16 sm:py-24 md:py-32"
    style="background: var(--surface-primary)"
  >
    <div class="mx-auto max-w-6xl px-4 sm:px-6">
      <!-- Section header -->
      <div class="mx-auto mb-14 max-w-2xl text-center">
        <p
          class="mb-3 text-[11px] font-semibold uppercase tracking-[0.12em]"
          style="color: var(--honey-deep)"
        >
          Fonctionnalités
        </p>
        <h2
          v-reveal
          class="text-[30px] font-bold leading-tight tracking-[-0.025em] sm:text-[38px] md:text-[44px]"
          style="color: var(--text-primary)"
        >
          Un seul outil.<br class="hidden sm:block" />
          Toute votre exploitation.
        </h2>
        <p
          class="mt-4 text-[15px] sm:text-[17px] leading-relaxed"
          style="color: var(--text-secondary)"
        >
          63 000 apiculteurs en France utilisent encore carnets papier et tableurs. APIGO centralise
          tout — terrain, production, finances, conformité.
        </p>
      </div>

      <!-- 3 piliers -->
      <div v-reveal.cascade="140" class="mb-10 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div
          v-for="highlight in highlights"
          :key="highlight.title"
          class="group relative overflow-hidden rounded-[16px] border p-4 sm:p-6 transition-all duration-250 hover:-translate-y-0.5 hover:shadow-lg"
          style="border-color: var(--border-default); background: white"
        >
          <div
            class="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-[12px]"
            :style="`background:${highlight.bgColor}`"
          >
            <UIcon :name="highlight.icon" class="h-5 w-5" :style="`color:${highlight.iconColor}`" />
          </div>
          <div
            class="mb-1 text-[11px] font-semibold uppercase tracking-[0.1em]"
            :style="`color:${highlight.labelColor}`"
          >
            {{ highlight.label }}
          </div>
          <h3
            class="mb-2 text-[17px] font-bold tracking-[-0.02em]"
            style="color: var(--text-primary)"
          >
            {{ highlight.title }}
          </h3>
          <p class="text-[13.5px] leading-relaxed" style="color: var(--text-secondary)">
            {{ highlight.description }}
          </p>
          <div
            class="absolute right-0 top-0 h-24 w-24 translate-x-10 -translate-y-10 rounded-full opacity-[0.06] transition-all group-hover:opacity-[0.1]"
            :style="`background:${highlight.iconColor}`"
          />
        </div>
      </div>

      <!-- Maya, le copilote — le différenciateur mis en avant -->
      <div
        class="relative mb-4 overflow-hidden rounded-[18px] p-6 sm:p-8"
        style="background: linear-gradient(135deg, #2c2218, #1a1a1c)"
      >
        <div
          class="pointer-events-none absolute -right-8 -top-12 h-44 w-44 rounded-full opacity-50"
          style="background: radial-gradient(circle, rgba(245, 166, 35, 0.4), transparent 70%)"
        />
        <div class="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:gap-8">
          <div class="flex-1">
            <p
              class="mb-2 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.12em]"
              style="color: #f0b454"
            >
              <!-- Le logo de Maya ouvre le bloc qui parle d'elle : sur ce fond
                   sombre, l'alvéole avec son halo est sa signature. -->
              <IaMayaMark :size="26" glow state="idle" />
              Nouveau · Assistant apicole
            </p>
            <h3 class="text-[21px] font-bold tracking-[-0.02em] text-white sm:text-[24px]">
              Maya, votre copilote au rucher
            </h3>
            <p
              class="mt-2 max-w-2xl text-[13.5px] leading-relaxed"
              style="color: rgba(255, 255, 255, 0.68)"
            >
              Elle comprend vos questions, vous propose le bon geste au bon moment et enregistre vos
              interventions à votre place — désormais
              <strong style="color: #fff">à la voix</strong>. « Salut Maya, comment vont mes ruches
              &#63; »
            </p>
          </div>
          <div class="flex shrink-0 flex-wrap gap-2">
            <span
              v-for="cap in mayaCaps"
              :key="cap"
              class="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-medium text-white"
              style="
                background: rgba(255, 255, 255, 0.1);
                border: 1px solid rgba(240, 180, 84, 0.3);
              "
            >
              <UIcon name="i-lucide-check" class="h-3 w-3" style="color: #f0b454" />
              {{ cap }}
            </span>
          </div>
        </div>
      </div>

      <!-- Catalogue COMPLET, organisé par domaine -->
      <div v-reveal.cascade="140" class="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
        <div
          v-for="cat in categories"
          :key="cat.category"
          class="rounded-[14px] border p-5 transition-all hover:shadow-sm"
          style="border-color: var(--border-default); background: white"
        >
          <div class="mb-3.5 flex items-center gap-2.5">
            <div
              class="flex h-8 w-8 shrink-0 items-center justify-center rounded-[9px]"
              style="background: var(--honey-soft)"
            >
              <UIcon
                :name="iconePour(cat.category)"
                class="h-4 w-4"
                style="color: var(--honey-deep)"
              />
            </div>
            <h3
              class="text-[13.5px] font-bold tracking-[-0.01em]"
              style="color: var(--text-primary)"
            >
              {{ cat.category }}
            </h3>
          </div>
          <ul class="space-y-2">
            <li
              v-for="f in cat.features"
              :key="f.key"
              class="flex items-start gap-2 text-[12.5px] leading-snug"
              style="color: var(--text-secondary)"
            >
              <UIcon
                name="i-lucide-check"
                class="mt-0.5 h-3 w-3 shrink-0"
                style="color: var(--honey)"
              />
              <span>{{ f.label }}</span>
            </li>
          </ul>
        </div>
      </div>

      <!-- CTA inline -->
      <div class="mt-12 text-center">
        <NuxtLink
          to="/fonctionnalites"
          class="inline-flex items-center gap-2 rounded-[12px] px-6 py-2.5 text-[14px] font-semibold text-white transition-all hover:-translate-y-0.5"
          style="background: var(--text-primary)"
        >
          Explorer toutes les fonctionnalités
          <UIcon name="i-lucide-arrow-right" class="h-4 w-4" />
        </NuxtLink>
      </div>

      <!-- Section Outils pratiques -->
      <div
        class="mt-20 rounded-[20px] border p-8 sm:p-10"
        style="background: var(--honey-soft); border-color: rgba(245, 166, 35, 0.25)"
      >
        <div class="flex flex-col gap-6 sm:flex-row sm:items-center sm:gap-10">
          <div
            class="flex h-14 w-14 shrink-0 items-center justify-center rounded-[16px]"
            style="background: var(--honey)"
          >
            <UIcon name="i-lucide-calculator" class="h-7 w-7 text-white" />
          </div>
          <div class="flex-1">
            <p
              class="mb-1 text-[11px] font-semibold uppercase tracking-[0.12em]"
              style="color: var(--honey-deep)"
            >
              Outils pratiques
            </p>
            <h3
              class="mb-2 text-[20px] font-bold tracking-[-0.02em]"
              style="color: var(--text-primary)"
            >
              Des calculateurs gratuits, même sans compte
            </h3>
            <p class="text-[14px] leading-relaxed" style="color: var(--text-secondary)">
              Dosage sirop/candi, rayon de butinage (3 km), calibration de réfractomètre — des
              outils concrets, accessibles gratuitement sur tous les plans, y compris Découverte.
            </p>
          </div>
          <div class="flex shrink-0 flex-col gap-2 sm:items-end">
            <NuxtLink
              to="/outils"
              class="inline-flex items-center gap-2 rounded-[12px] px-5 py-2.5 text-[13px] font-semibold text-white transition-all hover:-translate-y-0.5"
              style="background: var(--honey)"
            >
              Découvrir les outils
              <UIcon name="i-lucide-arrow-right" class="h-3.5 w-3.5" />
            </NuxtLink>
          </div>
        </div>
      </div>

      <!-- Section Syndicats / Associations -->
      <div
        class="mt-8 rounded-[20px] border p-8 sm:p-10"
        style="background: var(--honey-soft); border-color: rgba(245, 166, 35, 0.2)"
      >
        <div class="flex flex-col gap-6 sm:flex-row sm:items-center sm:gap-10">
          <div
            class="flex h-14 w-14 shrink-0 items-center justify-center rounded-[16px]"
            style="background: var(--honey)"
          >
            <UIcon name="i-lucide-users-round" class="h-7 w-7 text-white" />
          </div>
          <div class="flex-1">
            <p
              class="mb-1 text-[11px] font-semibold uppercase tracking-[0.12em]"
              style="color: var(--honey-deep)"
            >
              Pour les organisations
            </p>
            <h3
              class="mb-2 text-[20px] font-bold tracking-[-0.02em]"
              style="color: var(--text-primary)"
            >
              Vous êtes un syndicat ou une association ?
            </h3>
            <p class="text-[14px] leading-relaxed" style="color: var(--text-secondary)">
              Proposez APIGO à vos adhérents. Campagnes de vente groupée, suivi collectif, tarifs
              préférentiels — nous organisons volontiers une visio de présentation.
            </p>
          </div>
          <div class="flex shrink-0 flex-col gap-2 sm:items-end">
            <NuxtLink
              to="/register"
              class="inline-flex items-center gap-2 rounded-[12px] px-5 py-2.5 text-[13px] font-semibold text-white transition-all hover:-translate-y-0.5"
              style="background: var(--honey)"
            >
              Créer un compte association
            </NuxtLink>
            <a
              href="mailto:apigo360.apiculture@gmail.com"
              class="inline-flex items-center gap-1.5 text-[13px] font-medium transition-colors hover:underline"
              style="color: var(--honey-deep)"
            >
              <UIcon name="i-lucide-mail" class="h-3.5 w-3.5" />
              Nous contacter
            </a>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { getFeatureCatalogByCategory, type FeatureCategory } from '~/config/plans';

// Catalogue COMPLET, groupé par domaine — source unique (partagée avec
// /tarifs et /fonctionnalites). Le détail exhaustif des ~45 fonctionnalités
// apparaît ici, organisé, sans rien coder en dur : ajouter une feature au
// catalogue la fait remonter partout.
const categories = getFeatureCatalogByCategory().filter((c) => c.features.length > 0);

const ICONES_CATEGORIE: Record<FeatureCategory, string> = {
  'Terrain & interventions': 'i-lucide-map-pin',
  'Pilotage & analytics': 'i-lucide-trending-up',
  'Production & commerce': 'i-lucide-package',
  'Élevage & génétique': 'i-lucide-dna',
  Conformité: 'i-lucide-file-check',
  'Équipe & communauté': 'i-lucide-users',
  Services: 'i-lucide-life-buoy',
};
function iconePour(c: FeatureCategory): string {
  return ICONES_CATEGORIE[c] ?? 'i-lucide-check';
}

const mayaCaps = ['Comprend vos questions', 'Dictée vocale', 'Écrit vos interventions'];

const highlights = [
  {
    icon: 'i-lucide-map-pin',
    label: 'Terrain',
    title: 'Intervenir en 30 secondes',
    description:
      '14 formulaires adaptés — contrôle, varroa, pesée, reine, récolte, transhumance… Saisissez au rucher, même hors connexion. Tout se synchronise dès que vous retrouvez du réseau.',
    bgColor: 'var(--honey-soft)',
    iconColor: 'var(--honey)',
    labelColor: 'var(--honey-deep)',
  },
  {
    icon: 'i-lucide-trending-up',
    label: 'Rentabilité',
    title: "Pilotez comme un chef d'entreprise",
    description:
      'Rentabilité par ruche et par rucher, comparaison entre saisons, corrélation météo ↔ production — des analytics que ni carnet ni tableur ne peuvent vous donner.',
    bgColor: 'var(--clay-soft)',
    iconColor: 'var(--clay)',
    labelColor: 'var(--clay-deep)',
  },
  {
    icon: 'i-lucide-file-check',
    label: 'Conformité',
    title: 'Toutes vos obligations, zéro oubli',
    description:
      "Registre d'élevage PDF (arrêté 2000), déclaration NAPI, Factur-X 2026 (norme EN 16931) — chaque exigence légale intégrée dès la création de compte.",
    bgColor: 'var(--sage-soft)',
    iconColor: 'var(--sage)',
    labelColor: 'var(--sage-deep)',
  },
];
</script>
