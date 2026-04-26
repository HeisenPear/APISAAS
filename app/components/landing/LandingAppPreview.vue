<template>
  <section class="bg-white py-20 sm:py-28 overflow-hidden">
    <div class="mx-auto max-w-6xl px-4 sm:px-6">
      <!-- Section header -->
      <div class="mx-auto mb-12 max-w-2xl text-center">
        <p class="mb-3 text-sm font-semibold uppercase tracking-widest text-amber-500">Aperçu</p>
        <h2 class="text-3xl font-bold tracking-tight text-stone-900 sm:text-4xl">
          Conçu pour le terrain et le bureau
        </h2>
        <p class="mt-4 text-lg text-stone-500">
          Une interface claire, rapide, adaptée aux vrais besoins de l'apiculteur.
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

      <!-- Screenshot mockup -->
      <div class="relative mx-auto max-w-5xl">
        <!-- Glow ambiance -->
        <div
          class="pointer-events-none absolute -inset-4 rounded-3xl bg-gradient-to-b from-amber-100/40 via-transparent to-transparent blur-2xl"
        />

        <!-- Grid: Desktop + Mobile -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8 items-center">
          <!-- Desktop screenshot (60%) -->
          <div class="lg:col-span-2">
            <!-- macOS window frame -->
            <div
              class="relative overflow-hidden rounded-2xl border border-stone-200/80 shadow-2xl shadow-stone-300/40 bg-white"
            >
              <!-- Window chrome -->
              <div class="flex items-center gap-2 border-b border-stone-100 bg-stone-50 px-4 py-3">
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

              <!-- Screenshot -->
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

          <!-- Mobile mockup (40%) -->
          <div class="lg:col-span-1 flex justify-center">
            <!-- iPhone frame -->
            <div class="relative w-40 h-auto">
              <!-- Phone body -->
              <div
                class="relative rounded-3xl border-8 border-black bg-black shadow-2xl"
                style="aspect-ratio: 375/812"
              >
                <!-- Notch -->
                <div
                  class="absolute top-0 left-1/2 -translate-x-1/2 z-10 w-40 h-7 bg-black rounded-b-3xl"
                />

                <!-- Screen -->
                <div class="absolute inset-0 rounded-3xl overflow-hidden bg-stone-50 m-1">
                  <!-- Placeholder content -->
                  <img
                    src="/logo_apigo.webp"
                    alt="APIGO Mobile"
                    class="w-full h-full object-cover"
                  />
                  <!-- Overlay with text -->
                  <div
                    class="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-amber-50 to-transparent"
                  >
                    <div class="text-center">
                      <p class="text-xs font-medium text-stone-600">Interface mobile</p>
                      <p class="text-xs text-stone-500">bientôt disponible</p>
                    </div>
                  </div>
                </div>
              </div>
              <!-- Caption -->
              <p class="mt-4 text-center text-sm font-medium text-stone-600">
                Accédez à vos ruchers<br />depuis le terrain
              </p>
            </div>
          </div>
        </div>

        <!-- Caption pill -->
        <div class="mt-4 flex justify-center">
          <span
            class="inline-flex items-center gap-1.5 rounded-full border border-stone-200 bg-white px-4 py-1.5 text-xs font-medium text-stone-500 shadow-sm"
          >
            <UIcon :name="currentTab.icon" class="h-3.5 w-3.5 text-amber-500" />
            {{ currentTab.caption }}
          </span>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
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
