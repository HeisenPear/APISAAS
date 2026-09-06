<template>
  <div class="space-y-8">
    <!-- Header -->
    <div>
      <h1
        class="text-[26px] font-semibold tracking-[-0.02em] text-[var(--text-primary)]"
        style="
          font-family:
            'SF Pro Display',
            -apple-system,
            BlinkMacSystemFont,
            sans-serif;
        "
      >
        Exports & Documents
      </h1>
      <p class="mt-1 text-[13.5px] text-[var(--text-secondary)]">
        Générez et téléchargez vos documents réglementaires
      </p>
    </div>

    <!-- Cards grid -->
    <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <NuxtLink
        v-for="doc in DOCS"
        :key="doc.to"
        :to="doc.to"
        class="group flex flex-col gap-4 rounded-[14px] border border-[var(--border-default)] bg-white p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
      >
        <div class="flex items-start justify-between">
          <div
            class="flex h-10 w-10 items-center justify-center rounded-[10px]"
            :class="doc.iconBg"
          >
            <UIcon :name="doc.icon" class="h-5 w-5" :class="doc.iconColor" />
          </div>
          <span
            v-if="doc.badge"
            class="rounded-full px-2 py-0.5 text-[10px] font-semibold"
            :class="doc.badgeClass"
          >
            {{ doc.badge }}
          </span>
        </div>

        <div class="flex-1">
          <p class="text-[15px] font-semibold text-[var(--text-primary)]">{{ doc.title }}</p>
          <p class="mt-1 text-[13px] text-[var(--text-secondary)]">{{ doc.desc }}</p>
        </div>

        <div class="flex items-center gap-1 text-[12px] font-medium text-[var(--honey-deep)]">
          Ouvrir
          <UIcon
            name="i-lucide-arrow-right"
            class="h-3.5 w-3.5 transition-transform duration-150 group-hover:translate-x-0.5"
          />
        </div>
      </NuxtLink>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'default' });

const DOCS = [
  {
    to: '/exports/registre',
    icon: 'i-lucide-book-open',
    iconBg: 'bg-[var(--sage-soft)]',
    iconColor: 'text-[var(--sage-deep)]',
    title: "Registre d'élevage",
    desc: 'Document réglementaire obligatoire — interventions, traitements, mouvements de ruches.',
    badge: 'Obligatoire',
    // red-600 sur red-50 : 4,36:1 en 10 px — sous le minimum de 4,5. red-700
    // tient 5,87 sans changer la lecture « rouge = obligatoire ».
    badgeClass: 'bg-red-50 text-red-700',
  },
  {
    to: '/exports/bilan',
    icon: 'i-lucide-bar-chart-2',
    iconBg: 'bg-[var(--honey-soft)]',
    iconColor: 'text-[var(--honey-deep)]',
    title: 'Bilan annuel',
    desc: 'Synthèse de votre activité apicole : production, interventions, cheptel.',
    badge: null,
    badgeClass: '',
  },
] as const;
</script>
