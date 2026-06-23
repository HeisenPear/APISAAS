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
          tout — terrain, production, comptabilité, conformité.
        </p>
      </div>

      <!-- 3 piliers -->
      <div class="mb-10 grid grid-cols-1 gap-4 sm:grid-cols-3">
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

      <!-- Feature grid 6 items (2×3) -->
      <div class="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
        <div
          v-for="feature in features"
          :key="feature.title"
          class="flex items-start gap-3 sm:gap-4 rounded-[14px] border p-4 sm:p-5 transition-all hover:shadow-sm"
          style="border-color: var(--border-default); background: white"
        >
          <div
            class="mt-0.5 shrink-0 flex h-9 w-9 items-center justify-center rounded-[10px]"
            style="background: var(--honey-soft)"
          >
            <UIcon :name="feature.icon" class="h-4 w-4" style="color: var(--honey-deep)" />
          </div>
          <div>
            <h3
              class="mb-1 text-[14px] font-semibold tracking-[-0.01em]"
              style="color: var(--text-primary)"
            >
              {{ feature.title }}
            </h3>
            <p class="text-[12.5px] leading-relaxed" style="color: var(--text-secondary)">
              {{ feature.description }}
            </p>
          </div>
        </div>
      </div>

      <!-- CTA inline -->
      <div class="mt-12 text-center">
        <NuxtLink
          to="/register"
          class="inline-flex items-center gap-2 rounded-[12px] px-6 py-2.5 text-[14px] font-semibold text-white transition-all hover:-translate-y-0.5"
          style="background: var(--text-primary)"
        >
          Tout découvrir gratuitement
          <UIcon name="i-lucide-arrow-right" class="h-4 w-4" />
        </NuxtLink>
      </div>

      <!-- Section Syndicats / Associations -->
      <div
        class="mt-20 rounded-[20px] border p-8 sm:p-10"
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
      'Coût par kg de miel, rentabilité par ruche et par rucher, comparaison de saisons — des analytics que ni carnet ni tableur ne peuvent vous donner. (IA apicole en développement.)',
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

const features = [
  {
    icon: 'i-lucide-wifi-off',
    title: 'Mode hors-ligne natif',
    description:
      'Travaillez au rucher sans connexion. Synchronisation silencieuse dès que vous retrouvez du réseau.',
  },
  {
    icon: 'i-lucide-qr-code',
    title: 'QR code par ruche',
    description:
      'Scannez une ruche, accédez à sa fiche complète en 1 seconde — historique, interventions, état de la reine.',
  },
  {
    icon: 'i-lucide-crown',
    title: 'Suivi reine avancé',
    description:
      "Naissance, fécondation, marquage, essaimage, remplacement — l'état de chaque colonie en un coup d'œil.",
  },
  {
    icon: 'i-lucide-truck',
    title: 'Bons de livraison',
    description:
      'Créez un bon de livraison en 1 clic depuis votre stock. Traçabilité du lot de miel et numéro de lot inclus — prêt pour la vente directe.',
  },
  {
    icon: 'i-lucide-file-text',
    title: 'Facturation électronique 2026',
    description:
      'Factur-X (XML CII profil BASIC) inclus dans votre abonnement. Économisez 15–30 €/mois vs une solution dédiée.',
  },
  {
    icon: 'i-lucide-package',
    title: 'Stocks & traçabilité miel',
    description:
      'Suivi par lot, par variété, par année de récolte. Conformité CE 178/2002 intégrée — pour vente directe ou grossistes.',
  },
];
</script>
