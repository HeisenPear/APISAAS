<template>
  <section
    class="relative overflow-hidden py-20 sm:py-28 md:py-36"
    style="background: var(--surface-sidebar)"
  >
    <!-- Subtle grid pattern -->
    <div
      class="pointer-events-none absolute inset-0 opacity-[0.025]"
      style="
        background-image:
          linear-gradient(var(--honey) 1px, transparent 1px),
          linear-gradient(90deg, var(--honey) 1px, transparent 1px);
        background-size: 48px 48px;
      "
    />
    <!-- Honey glow bottom-left — radial gradient sans filter:blur (évite bug rendu Safari overflow-hidden) -->
    <div
      class="pointer-events-none absolute -bottom-20 -left-20 h-[500px] w-[500px] rounded-full"
      style="background: radial-gradient(circle, rgba(245, 166, 35, 0.18) 0%, transparent 65%)"
    />
    <!-- Sage glow top-right -->
    <div
      class="pointer-events-none absolute -top-20 -right-20 h-[400px] w-[400px] rounded-full"
      style="background: radial-gradient(circle, rgba(122, 150, 118, 0.12) 0%, transparent 65%)"
    />

    <div class="relative mx-auto max-w-6xl px-4 sm:px-6">
      <!-- Header -->
      <div class="mx-auto mb-14 max-w-2xl text-center">
        <p
          class="mb-3 text-[11px] font-semibold uppercase tracking-[0.12em]"
          style="color: var(--honey)"
        >
          Application mobile
        </p>
        <h2
          class="text-[30px] font-bold leading-tight tracking-[-0.025em] text-white sm:text-[38px] md:text-[44px]"
        >
          Votre rucher<br class="hidden sm:block" />
          <span style="color: var(--honey)">dans votre poche.</span>
        </h2>
        <p
          class="mt-4 text-[15px] leading-relaxed sm:text-[17px]"
          style="color: rgba(255, 255, 255, 0.55)"
        >
          Bureau ou terrain — APIGO s'adapte. Mode hors-ligne intégré, données synchronisées dès que
          vous retrouvez du réseau.
        </p>
      </div>

      <!-- Main layout -->
      <div class="flex flex-col items-center gap-8 lg:flex-row lg:items-center lg:gap-16">
        <!-- Phone mockup -->
        <div class="flex w-full items-center justify-center lg:w-[45%]">
          <PhoneMockup v-model:active-slide="activeSlide" />
        </div>

        <!-- MOBILE : 4 pills compactes sous le téléphone -->
        <div class="grid w-full grid-cols-4 gap-2 lg:hidden">
          <button
            v-for="(feature, i) in features"
            :key="feature.id"
            type="button"
            class="flex flex-col items-center gap-1.5 rounded-[12px] border py-3 px-1 transition-all duration-200"
            :style="
              activeSlide === i
                ? `border-color:rgba(245,166,35,0.5);background:rgba(245,166,35,0.12)`
                : `border-color:rgba(255,255,255,0.1);background:rgba(255,255,255,0.04)`
            "
            @click="setSlide(i)"
          >
            <UIcon
              :name="feature.icon"
              class="h-5 w-5"
              :style="activeSlide === i ? `color:var(--honey)` : `color:rgba(255,255,255,0.4)`"
            />
            <span
              class="text-center text-[9px] font-semibold leading-tight"
              :style="activeSlide === i ? `color:var(--honey)` : `color:rgba(255,255,255,0.35)`"
              >{{ feature.shortLabel }}</span
            >
          </button>
        </div>

        <!-- DESKTOP : feature tabs détaillées -->
        <div class="hidden w-full space-y-3 lg:block lg:w-[55%]">
          <button
            v-for="(feature, i) in features"
            :key="feature.id"
            type="button"
            class="group w-full rounded-[16px] border p-5 text-left transition-all duration-300"
            :style="
              activeSlide === i
                ? `border-color:rgba(245,166,35,0.4);background:rgba(245,166,35,0.08);box-shadow:0 0 0 1px rgba(245,166,35,0.2)`
                : `border-color:rgba(255,255,255,0.07);background:rgba(255,255,255,0.03)`
            "
            @click="setSlide(i)"
          >
            <div class="flex items-start gap-4">
              <div
                class="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] transition-all duration-300"
                :style="
                  activeSlide === i
                    ? `background:rgba(245,166,35,0.15)`
                    : `background:rgba(255,255,255,0.06)`
                "
              >
                <UIcon
                  :name="feature.icon"
                  class="h-5 w-5 transition-colors duration-300"
                  :style="activeSlide === i ? `color:var(--honey)` : `color:rgba(255,255,255,0.35)`"
                />
              </div>
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2 mb-1">
                  <span
                    class="text-[10px] font-bold tabular-nums"
                    :style="
                      activeSlide === i ? `color:var(--honey)` : `color:rgba(255,255,255,0.2)`
                    "
                  >
                    {{ String(i + 1).padStart(2, '0') }}
                  </span>
                  <h3
                    class="text-[14px] font-semibold tracking-[-0.01em] transition-colors"
                    :style="activeSlide === i ? `color:white` : `color:rgba(255,255,255,0.55)`"
                  >
                    {{ feature.title }}
                  </h3>
                </div>
                <p
                  class="text-[12.5px] leading-relaxed transition-all duration-300"
                  :style="
                    activeSlide === i
                      ? `color:rgba(255,255,255,0.65)`
                      : `color:rgba(255,255,255,0.3)`
                  "
                >
                  {{ feature.description }}
                </p>
              </div>
              <div
                class="mt-1 h-2 w-2 rounded-full shrink-0 transition-all duration-300"
                :style="
                  activeSlide === i
                    ? `background:var(--honey);box-shadow:0 0 6px rgba(245,166,35,0.6)`
                    : `background:rgba(255,255,255,0.12)`
                "
              />
            </div>
            <div
              v-if="activeSlide === i"
              class="mt-4 h-0.5 w-full overflow-hidden rounded-full"
              style="background: rgba(245, 166, 35, 0.15)"
            >
              <div
                class="h-full rounded-full"
                style="background: var(--honey); animation: slide-progress 8s linear forwards"
              />
            </div>
          </button>
        </div>
      </div>

      <!-- Bottom pill row -->
      <div class="mt-14 flex flex-wrap items-center justify-center gap-3">
        <div
          v-for="pill in pills"
          :key="pill.text"
          class="flex items-center gap-2 rounded-full border px-4 py-2"
          style="border-color: rgba(255, 255, 255, 0.1); background: rgba(255, 255, 255, 0.04)"
        >
          <UIcon :name="pill.icon" class="h-3.5 w-3.5" style="color: var(--honey)" />
          <span class="text-[12px] font-medium" style="color: rgba(255, 255, 255, 0.55)">{{
            pill.text
          }}</span>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import PhoneMockup from '../ui/PhoneMockup.vue';

const activeSlide = ref(0);

function setSlide(i: number) {
  activeSlide.value = i;
}

const features = [
  {
    id: 'dashboard',
    icon: 'i-lucide-layout-dashboard',
    shortLabel: 'Dashboard',
    title: 'Tableau de bord',
    description:
      "Ruches, production, alertes, chiffre d'affaires — tout votre pilotage d'exploitation en un coup d'œil.",
  },
  {
    id: 'intervention',
    icon: 'i-lucide-clipboard-check',
    shortLabel: '30 secondes',
    title: 'Interventions en 30 secondes',
    description:
      '14 formulaires adaptés à chaque visite. Saisissez au rucher avec ou sans réseau, synchronisation automatique.',
  },
  {
    id: 'qrscan',
    icon: 'i-lucide-qr-code',
    shortLabel: 'QR ruche',
    title: 'QR code par ruche',
    description:
      'Scannez le QR code collé sur votre ruche pour ouvrir sa fiche complète en 1 seconde — historique, reine, alertes.',
  },
  {
    id: 'finances',
    icon: 'i-lucide-wallet',
    shortLabel: 'Finances',
    title: 'Finance & rentabilité',
    description:
      'Ventes, charges, rentabilité par ruche. Factures PDF + Factur-X 2026 générées en 2 clics.',
  },
];

const pills = [
  { icon: 'i-lucide-wifi-off', text: 'Mode hors-ligne' },
  { icon: 'i-lucide-smartphone', text: 'iOS & Android' },
  { icon: 'i-lucide-refresh-cw', text: 'Sync automatique' },
  { icon: 'i-lucide-lock', text: 'Données chiffrées' },
];
</script>

<style scoped>
@keyframes slide-progress {
  from {
    width: 0%;
  }
  to {
    width: 100%;
  }
}
</style>
