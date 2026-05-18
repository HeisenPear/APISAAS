<template>
  <section class="overflow-hidden bg-white py-16 sm:py-24 md:py-32">
    <div class="mx-auto max-w-6xl px-4 sm:px-6">

      <!-- Header -->
      <div class="mx-auto mb-10 max-w-2xl text-center">
        <p class="mb-3 text-[11px] font-semibold uppercase tracking-[0.12em]" style="color:var(--honey-deep)">Aperçu</p>
        <h2 class="text-[30px] font-bold tracking-[-0.025em] sm:text-[38px]" style="color:var(--text-primary)">
          Bureau ou terrain — APIGO s'adapte
        </h2>
        <p class="mt-4 text-[15px]" style="color:var(--text-secondary)">
          Gérez depuis votre ordinateur, ou scannez directement avec votre téléphone sur le rucher.
        </p>
      </div>

      <!-- Tab bar -->
      <div class="mb-8 flex items-center justify-center">
        <div class="inline-flex items-center gap-1 rounded-[12px] p-1.5" style="background:var(--surface-muted)">
          <button
            v-for="tab in tabs"
            :key="tab.id"
            type="button"
            class="flex items-center gap-2 rounded-[9px] px-4 py-2 text-[13px] font-medium transition-all duration-200"
            :style="active === tab.id
              ? `background:white;color:var(--text-primary);box-shadow:0 1px 4px rgba(0,0,0,0.08)`
              : `color:var(--text-tertiary)`"
            @click="setTab(tab.id)"
          >
            <UIcon
              :name="tab.icon"
              class="h-4 w-4"
              :style="active === tab.id ? `color:var(--honey)` : ''"
            />
            <span class="hidden sm:inline">{{ tab.label }}</span>
          </button>
        </div>
      </div>

      <!-- Layout -->
      <div class="flex flex-col-reverse items-center gap-10 md:flex-row md:gap-16">

        <!-- Left: Desktop screenshot (60%) -->
        <div class="w-full md:w-[60%]">
          <div class="relative">
            <div class="pointer-events-none absolute inset-0 rounded-[20px] blur-3xl opacity-30" style="background:linear-gradient(to bottom,var(--honey-soft),transparent)" />

            <div class="relative overflow-hidden rounded-[18px] border shadow-xl" style="border-color:var(--border-default)">
              <!-- Browser chrome -->
              <div class="flex items-center gap-2 border-b px-4 py-3" style="border-color:var(--border-default);background:var(--surface-muted)">
                <span class="h-3 w-3 rounded-full bg-red-400/80" />
                <span class="h-3 w-3 rounded-full bg-amber-400/80" />
                <span class="h-3 w-3 rounded-full bg-green-400/80" />
                <div class="mx-auto flex items-center gap-1.5 rounded-[6px] border bg-white px-3 py-1 text-[11px]" style="border-color:var(--border-default);color:var(--text-tertiary)">
                  <UIcon name="i-lucide-lock" class="h-2.5 w-2.5" />
                  app.apigo.fr
                </div>
                <div class="w-16" />
              </div>

              <!-- Screenshot -->
              <div class="relative overflow-hidden" style="aspect-ratio:5088/3498">
                <Transition
                  enter-active-class="transition-opacity duration-300 ease-out"
                  enter-from-class="opacity-0"
                  enter-to-class="opacity-100"
                  leave-active-class="transition-opacity duration-200 ease-in absolute inset-0"
                  leave-from-class="opacity-100"
                  leave-to-class="opacity-0"
                >
                  <img :key="active" :src="currentTab.src" :alt="currentTab.label" class="h-full w-full object-cover object-top" loading="lazy">
                </Transition>
              </div>
            </div>
          </div>
        </div>

        <!-- Right: Phone mockup (40%) -->
        <div class="flex w-full flex-col items-center justify-center md:w-[40%]">
          <PhoneMockup :has-asset="false" />
          <p class="mt-5 max-w-xs text-center text-[13px]" style="color:var(--text-secondary)">
            Accédez à vos ruchers depuis le terrain. Mode hors-ligne inclus.
          </p>
        </div>
      </div>

      <!-- Caption pill -->
      <div class="mt-8 flex justify-center">
        <span class="inline-flex items-center gap-2 rounded-full border px-4 py-2 text-[12.5px] font-medium" style="border-color:color-mix(in srgb,var(--honey) 25%,transparent);background:var(--honey-soft);color:var(--honey-deep)">
          <UIcon :name="currentTab.icon" class="h-4 w-4" />
          {{ currentTab.caption }}
        </span>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import PhoneMockup from '../ui/PhoneMockup.vue';

const tabs = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: 'i-lucide-layout-dashboard',
    src: '/screens/dashboard.jpeg',
    caption: 'Vue d\'ensemble — KPIs, production, santé des colonies, activité récente',
  },
  {
    id: 'interventions',
    label: 'Interventions',
    icon: 'i-lucide-clipboard-check',
    src: '/screens/interventions.jpeg',
    caption: '14 types d\'interventions — filtres, groupées, timeline chronologique',
  },
  {
    id: 'finances',
    label: 'Finances',
    icon: 'i-lucide-wallet',
    src: '/screens/finances.jpeg',
    caption: 'Comptabilité — chiffre d\'affaires, charges, rentabilité, export FEC',
  },
  {
    id: 'production',
    label: 'Production',
    icon: 'i-lucide-package',
    src: '/screens/production.jpeg',
    caption: 'Suivi de production — répartition par type de miel, traçabilité des lots',
  },
];

const active = ref('dashboard');
const currentTab = computed(() => tabs.find((t) => t.id === active.value) ?? tabs[0]!);

function setTab(id: string) {
  active.value = id;
}
</script>
