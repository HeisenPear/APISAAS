<template>
  <section class="bg-white py-20 sm:py-28 overflow-hidden">
    <div class="mx-auto max-w-6xl px-4 sm:px-6">
      <!-- Section header -->
      <div class="mx-auto mb-14 max-w-2xl text-center">
        <p class="mb-3 text-sm font-semibold uppercase tracking-widest text-amber-500">Aperçu</p>
        <h2 class="text-3xl font-bold tracking-tight text-stone-900 sm:text-4xl">
          Bureau ou terrain — APIGO s'adapte
        </h2>
        <p class="mt-4 text-lg text-stone-500">
          Gérez vos ruchers depuis votre ordinateur, ou scannez directement depuis le terrain.
        </p>
      </div>

      <!-- Tab bar -->
      <div class="flex items-center justify-center mb-8">
        <div class="inline-flex items-center gap-1 rounded-2xl bg-stone-100 p-1.5">
          <button
            v-for="tab in tabs"
            :key="tab.id"
            type="button"
            class="flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-all duration-200"
            :class="
              active === tab.id
                ? 'bg-white text-stone-900 shadow-sm'
                : 'text-stone-500 hover:text-stone-700'
            "
            @click="setTab(tab.id)"
          >
            <UIcon
              :name="tab.icon"
              class="h-4 w-4"
              :class="active === tab.id ? 'text-amber-500' : ''"
            />
            <span class="hidden sm:inline">{{ tab.label }}</span>
          </button>
        </div>
      </div>

      <!-- Layout principal : Disposition responsive -->
      <div class="flex flex-col-reverse md:flex-row items-center gap-10 md:gap-16">
        <!-- GAUCHE : Screenshots desktop (60% sur md+) -->
        <div class="w-full md:w-[60%]">
          <div class="relative">
            <!-- Glow ambiance -->
            <div
              class="pointer-events-none absolute inset-0 rounded-3xl bg-gradient-to-b from-amber-100/40 via-transparent to-transparent blur-3xl"
            />

            <!-- macOS window frame -->
            <div
              class="relative overflow-hidden rounded-2xl border border-stone-200/80 shadow-2xl shadow-stone-300/40 bg-white"
            >
              <!-- Window chrome -->
              <div
                class="flex items-center gap-2 border-b border-stone-100 bg-stone-50/80 backdrop-blur-sm px-4 py-3"
              >
                <span class="h-3 w-3 rounded-full bg-red-400" />
                <span class="h-3 w-3 rounded-full bg-amber-400" />
                <span class="h-3 w-3 rounded-full bg-green-400" />
                <div
                  class="mx-auto flex items-center gap-2 rounded-lg bg-white border border-stone-200 px-3 py-1 text-xs text-stone-400"
                >
                  <UIcon name="i-lucide-lock" class="h-3 w-3 text-stone-300" />
                  app.apigo.fr
                </div>
                <div class="w-16" />
              </div>

              <!-- Screenshot with transition -->
              <div class="relative overflow-hidden" style="aspect-ratio: 5088/3498">
                <Transition
                  enter-active-class="transition-opacity duration-300 ease-out"
                  enter-from-class="opacity-0"
                  enter-to-class="opacity-100"
                  leave-active-class="transition-opacity duration-200 ease-in absolute inset-0"
                  leave-from-class="opacity-100"
                  leave-to-class="opacity-0"
                >
                  <img
                    :key="active"
                    :src="currentTab.src"
                    :alt="currentTab.label"
                    class="w-full h-full object-cover object-top"
                    loading="lazy"
                  />
                </Transition>
              </div>
            </div>
          </div>
        </div>

        <!-- DROITE : Mockup téléphone (40% sur md+) -->
        <div class="w-full md:w-[40%] flex flex-col items-center justify-center">
          <PhoneMockup :has-asset="false" />
          <p class="mt-6 text-sm text-center text-stone-500 max-w-xs">
            Accédez à vos ruchers depuis le terrain, en mobilité.
          </p>
        </div>
      </div>

      <!-- Caption pill below -->
      <div class="mt-8 flex justify-center">
        <span
          class="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-medium text-amber-700"
        >
          <UIcon :name="currentTab.icon" class="h-4 w-4" />
          {{ currentTab.caption }}
        </span>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import PhoneMockup from '../ui/PhoneMockup.vue';

const tabs = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: 'i-lucide-layout-dashboard',
    src: '/screen%20pour%20saas/dashboard.jpeg',
    caption: "Vue d'ensemble — KPIs, production, santé des colonies, activité récente",
  },
  {
    id: 'interventions',
    label: 'Interventions',
    icon: 'i-lucide-clipboard-check',
    src: '/screen%20pour%20saas/interventions.jpeg',
    caption: "14 types d'interventions — filtres, groupées, timeline chronologique",
  },
  {
    id: 'finances',
    label: 'Finances',
    icon: 'i-lucide-wallet',
    src: '/screen%20pour%20saas/finances.jpeg',
    caption: "Comptabilité — chiffre d'affaires, charges, rentabilité par ruche, export FEC",
  },
  {
    id: 'production',
    label: 'Production',
    icon: 'i-lucide-package',
    src: '/screen%20pour%20saas/production.jpeg',
    caption: 'Suivi de production — répartition par type de miel, traçabilité des lots',
  },
];

const active = ref('dashboard');

const currentTab = computed(() => tabs.find((t) => t.id === active.value) ?? tabs[0]!);

function setTab(id: string) {
  active.value = id;
}
</script>
