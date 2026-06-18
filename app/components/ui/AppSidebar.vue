<template>
  <aside
    data-tutorial="sidebar"
    class="fixed left-0 top-0 flex h-dvh flex-col bg-[var(--surface-sidebar)]"
    :class="[
      isMobile
        ? 'z-50 w-[var(--sidebar-width)] transition-transform duration-[var(--duration-base)]'
        : 'z-50 transition-[width] duration-[var(--duration-base)]',
      isMobile
        ? mobileOpen
          ? 'translate-x-0'
          : '-translate-x-full'
        : collapsed
          ? 'w-[var(--sidebar-collapsed-width)]'
          : 'w-[var(--sidebar-width)]',
    ]"
  >
    <!-- Safe-area spacer (notch iOS PWA standalone) -->
    <div class="safe-area-top shrink-0" />

    <!-- Brand header -->
    <div class="flex h-16 items-center gap-2.5 px-3.5">
      <img src="/logo_apigo.webp" alt="APIGO" class="h-7 w-auto shrink-0 object-contain" />
      <span
        v-if="!collapsed || isMobile"
        class="text-[15px] font-semibold tracking-tight text-white"
      >
        APIGO
      </span>
    </div>

    <!-- Exploit card -->
    <div
      v-if="!collapsed || isMobile"
      class="mx-3.5 my-2 rounded-[10px] p-2.5 pb-2"
      style="background: rgba(255, 255, 255, 0.05)"
    >
      <p class="truncate text-[12px] font-semibold text-white leading-tight">
        {{
          authStore.profil?.prenom
            ? `${authStore.profil.prenom}${authStore.profil.nom ? ' ' + authStore.profil.nom : ''}`
            : 'Mon exploitation'
        }}
      </p>
      <p class="mt-0.5 text-[11px]" style="color: rgba(255, 255, 255, 0.45)">
        {{ totalRuches }} ruches
      </p>
    </div>

    <!-- Navigation -->
    <nav class="sidebar-scroll flex-1 overflow-y-auto px-3.5 py-2">
      <!-- Group: Pilotage -->
      <div v-if="!collapsed || isMobile" class="mt-3 mb-1.5 px-[10px]">
        <span
          class="text-[10px] font-semibold uppercase tracking-[0.1em]"
          style="color: rgba(255, 255, 255, 0.35)"
          >Pilotage</span
        >
      </div>
      <ul class="flex flex-col gap-0.5">
        <li v-for="item in pilotageNavItems" :key="item.to">
          <NuxtLink
            :to="item.to"
            class="group flex min-h-[44px] items-center gap-3 rounded-[10px] px-[10px] py-[9px] transition-all duration-[var(--duration-fast)] hover:bg-[rgba(255,255,255,0.08)]"
            active-class="!bg-[rgba(255,255,255,0.10)] sidebar-active-item"
            @click="isMobile && $emit('toggle-collapse')"
          >
            <!-- L'item Maya porte son rayon de miel (identité), pas une icône trait -->
            <IaMayaMark v-if="item.to === '/copilote'" :size="18" state="static" class="shrink-0" />
            <UIcon
              v-else
              :name="item.icon"
              class="h-4 w-4 shrink-0"
              style="color: rgba(255, 255, 255, 0.65)"
            />
            <span
              v-if="!collapsed || isMobile"
              class="flex-1 truncate text-[13px] font-medium"
              style="color: rgba(255, 255, 255, 0.65)"
            >
              {{ item.label }}
            </span>
            <!-- Orange dot for alerts -->
            <span
              v-if="item.alertDot && (!collapsed || isMobile) && alertCount > 0"
              class="ml-auto h-1.5 w-1.5 rounded-full"
              style="background-color: var(--status-warn)"
            />
            <!-- Badge -->
            <span
              v-if="item.badge !== undefined && (!collapsed || isMobile)"
              class="ml-auto rounded-full px-1.5 py-[1px] text-[10.5px] font-semibold"
              style="background: rgba(245, 166, 35, 0.18); color: #f5a623"
              >{{ item.badge }}</span
            >
          </NuxtLink>
        </li>
      </ul>

      <!-- Group: Cheptel -->
      <div v-if="!collapsed || isMobile" class="mt-4 mb-1.5 px-[10px]">
        <span
          class="text-[10px] font-semibold uppercase tracking-[0.1em]"
          style="color: rgba(255, 255, 255, 0.35)"
          >Cheptel</span
        >
      </div>
      <ul class="flex flex-col gap-0.5">
        <li v-for="item in cheptelNavItems" :key="item.to">
          <NuxtLink
            :to="item.to"
            class="group flex min-h-[44px] items-center gap-3 rounded-[10px] px-[10px] py-[9px] transition-all duration-[var(--duration-fast)] hover:bg-[rgba(255,255,255,0.08)]"
            :class="{ 'opacity-60': item.feature && !gating.can(item.feature) }"
            active-class="!bg-[rgba(255,255,255,0.10)] sidebar-active-item"
            @click="isMobile && $emit('toggle-collapse')"
          >
            <UIcon
              :name="item.icon"
              class="h-4 w-4 shrink-0"
              style="color: rgba(255, 255, 255, 0.65)"
            />
            <span
              v-if="!collapsed || isMobile"
              class="flex-1 truncate text-[13px] font-medium"
              style="color: rgba(255, 255, 255, 0.65)"
            >
              {{ item.label }}
            </span>
            <UIcon
              v-if="(!collapsed || isMobile) && item.feature && !gating.can(item.feature)"
              name="i-lucide-lock"
              class="ml-auto h-3 w-3 shrink-0"
              style="color: rgba(255, 255, 255, 0.3)"
            />
            <span
              v-else-if="item.badge !== undefined && (!collapsed || isMobile)"
              class="ml-auto rounded-full px-1.5 py-[1px] text-[10.5px] font-semibold"
              style="background: rgba(245, 166, 35, 0.18); color: #f5a623"
              >{{ item.badge }}</span
            >
          </NuxtLink>
        </li>
      </ul>

      <!-- Group: Affaires -->
      <div v-if="!collapsed || isMobile" class="mt-4 mb-1.5 px-[10px]">
        <span
          class="text-[10px] font-semibold uppercase tracking-[0.1em]"
          style="color: rgba(255, 255, 255, 0.35)"
          >Affaires</span
        >
      </div>
      <ul class="flex flex-col gap-0.5">
        <li v-for="item in affairesNavItems" :key="item.to">
          <NuxtLink
            :to="item.to"
            class="group flex min-h-[44px] items-center gap-3 rounded-[10px] px-[10px] py-[9px] transition-all duration-[var(--duration-fast)] hover:bg-[rgba(255,255,255,0.08)]"
            :class="{ 'opacity-60': item.feature && !gating.can(item.feature) }"
            active-class="!bg-[rgba(255,255,255,0.10)] sidebar-active-item"
            @click="isMobile && $emit('toggle-collapse')"
          >
            <UIcon
              :name="item.icon"
              class="h-4 w-4 shrink-0"
              style="color: rgba(255, 255, 255, 0.65)"
            />
            <span
              v-if="!collapsed || isMobile"
              class="flex-1 truncate text-[13px] font-medium"
              style="color: rgba(255, 255, 255, 0.65)"
            >
              {{ item.label }}
            </span>
            <UIcon
              v-if="(!collapsed || isMobile) && item.feature && !gating.can(item.feature)"
              name="i-lucide-lock"
              class="ml-auto h-3 w-3 shrink-0"
              style="color: rgba(255, 255, 255, 0.3)"
            />
          </NuxtLink>
        </li>
      </ul>

      <!-- Group: Conformité -->
      <div v-if="!collapsed || isMobile" class="mt-4 mb-1.5 px-[10px]">
        <span
          class="text-[10px] font-semibold uppercase tracking-[0.1em]"
          style="color: rgba(255, 255, 255, 0.35)"
          >Conformité</span
        >
      </div>
      <ul class="flex flex-col gap-0.5">
        <li v-for="item in conformiteNavItems" :key="item.to">
          <NuxtLink
            :to="item.to"
            class="group flex min-h-[44px] items-center gap-3 rounded-[10px] px-[10px] py-[9px] transition-all duration-[var(--duration-fast)] hover:bg-[rgba(255,255,255,0.08)]"
            active-class="!bg-[rgba(255,255,255,0.10)] sidebar-active-item"
            @click="isMobile && $emit('toggle-collapse')"
          >
            <UIcon
              :name="item.icon"
              class="h-4 w-4 shrink-0"
              style="color: rgba(255, 255, 255, 0.65)"
            />
            <span
              v-if="!collapsed || isMobile"
              class="flex-1 truncate text-[13px] font-medium"
              style="color: rgba(255, 255, 255, 0.65)"
            >
              {{ item.label }}
            </span>
          </NuxtLink>
        </li>
      </ul>

      <!-- Guide + Mon avis -->
      <div class="mt-4 flex flex-col gap-0.5">
        <NuxtLink
          to="/guide"
          class="group flex min-h-[44px] items-center gap-3 rounded-[10px] px-[10px] py-[9px] transition-all duration-[var(--duration-fast)] hover:bg-[rgba(255,255,255,0.08)]"
          active-class="!bg-[rgba(255,255,255,0.10)] sidebar-active-item"
          @click="isMobile && $emit('toggle-collapse')"
        >
          <UIcon
            name="i-lucide-help-circle"
            class="h-4 w-4 shrink-0"
            style="color: rgba(255, 255, 255, 0.65)"
          />
          <span
            v-if="!collapsed || isMobile"
            class="flex-1 truncate text-[13px] font-medium"
            style="color: rgba(255, 255, 255, 0.65)"
          >
            Guide
          </span>
        </NuxtLink>
        <button
          type="button"
          class="flex min-h-[44px] w-full items-center gap-3 rounded-[10px] px-[10px] py-[9px] transition-all duration-[var(--duration-fast)] hover:bg-[rgba(255,255,255,0.08)]"
          @click="openFeedback"
        >
          <UIcon
            name="i-lucide-message-circle"
            class="h-4 w-4 shrink-0"
            style="color: rgba(255, 255, 255, 0.65)"
          />
          <span
            v-if="!collapsed || isMobile"
            class="flex-1 truncate text-left text-[13px] font-medium"
            style="color: rgba(255, 255, 255, 0.65)"
          >
            Mon avis
          </span>
        </button>
      </div>

      <!-- Admin (visible uniquement pour les admins) -->
      <div v-if="isAdmin" class="mt-2">
        <NuxtLink
          to="/admin/users"
          class="group flex min-h-[44px] items-center gap-3 rounded-[10px] px-[10px] py-[9px] transition-all duration-[var(--duration-fast)] hover:bg-[rgba(255,255,255,0.08)]"
          active-class="!bg-[rgba(255,255,255,0.10)] sidebar-active-item"
          @click="isMobile && $emit('toggle-collapse')"
        >
          <UIcon
            name="i-lucide-shield"
            class="h-4 w-4 shrink-0"
            style="color: rgba(245, 166, 35, 0.7)"
          />
          <span
            v-if="!collapsed || isMobile"
            class="flex-1 truncate text-[13px] font-medium"
            style="color: rgba(245, 166, 35, 0.7)"
          >
            Admin
          </span>
        </NuxtLink>
      </div>
    </nav>

    <!-- Usage meter (desktop uniquement — sur mobile le badge Ruches suffit) -->
    <div
      v-if="!isMobile && !collapsed && gating.usageData.value"
      class="border-t border-white/10 px-3.5 py-3"
    >
      <UiUsageMeter
        :current="gating.usageData.value?.usage.ruches?.current ?? 0"
        :max="gating.usageData.value?.usage.ruches?.max ?? 1"
        label="Ruches"
      />
      <UButton
        v-if="gating.isAtLimit('ruches')"
        size="xs"
        color="primary"
        variant="soft"
        to="/tarifs"
        block
        class="mt-2"
      >
        Augmenter la limite →
      </UButton>
    </div>

    <!-- Footer: avatar + user info + settings + chevron -->
    <div class="border-t border-white/10 px-3.5 py-3">
      <div class="flex items-center gap-2.5">
        <!-- Avatar with initials -->
        <div
          class="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11.5px] font-bold"
          style="background-color: #fff3dc; color: #a86a13"
        >
          {{ authStore.initials || '?' }}
        </div>
        <!-- Name + plan -->
        <div v-if="!collapsed || isMobile" class="min-w-0 flex-1">
          <p class="truncate text-[12px] font-semibold text-white leading-tight">
            {{ authStore.fullName || authStore.profil?.email || 'Utilisateur' }}
          </p>
          <p class="text-[10.5px] capitalize" style="color: rgba(255, 255, 255, 0.4)">
            {{ authStore.profil?.plan ?? 'decouverte' }}
          </p>
        </div>
        <!-- Settings icon -->
        <NuxtLink
          v-if="!collapsed || isMobile"
          to="/parametres"
          class="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition-all duration-[var(--duration-fast)] hover:bg-[rgba(255,255,255,0.08)]"
          style="color: rgba(255, 255, 255, 0.4)"
        >
          <UIcon name="i-lucide-settings" class="h-3.5 w-3.5" />
        </NuxtLink>
        <!-- Collapse toggle button in footer (desktop) -->
        <button
          v-if="!isMobile"
          type="button"
          class="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition-all duration-[var(--duration-fast)] hover:bg-[rgba(255,255,255,0.08)]"
          style="color: rgba(255, 255, 255, 0.4)"
          @click="$emit('toggle-collapse')"
        >
          <UIcon
            :name="collapsed ? 'i-lucide-chevron-right' : 'i-lucide-chevron-left'"
            class="h-3.5 w-3.5"
          />
        </button>
      </div>
    </div>
  </aside>
</template>

<script setup lang="ts">
import type { PlanFeatures } from '~/config/plans';

interface NavItem {
  icon: string;
  label: string;
  to: string;
  feature?: keyof PlanFeatures;
  badge?: number | string;
  alertDot?: boolean;
}

const props = defineProps<{
  collapsed: boolean;
  mobileOpen: boolean;
  isMobile: boolean;
}>();

const emit = defineEmits<{
  'toggle-collapse': [];
}>();

const gating = useGating();
const authStore = useAuthStore();
const { dashboard } = useDashboard();
const feedbackOpen = useState<boolean>('feedback-modal', () => false);

function openFeedback() {
  if (props.isMobile) emit('toggle-collapse');
  feedbackOpen.value = true;
}

// Charger l'usage au montage (une fois)
onMounted(() => {
  gating.refreshUsage();
});

const alertCount = computed(() => dashboard.value?.kpis.alertesActives ?? 0);
const totalRuches = computed(() => gating.usageData.value?.usage.ruches?.current ?? 0);
const isAdmin = computed(
  () => !!(authStore.profil as (typeof authStore.profil & { isAdmin?: boolean }) | null)?.isAdmin,
);

const pilotageNavItems = computed<NavItem[]>(() => [
  { icon: 'i-lucide-layout-dashboard', label: 'Tableau de bord', to: '/dashboard' },
  { icon: 'i-lucide-hexagon', label: 'Maya', to: '/copilote', feature: 'copiloteIa' },
  { icon: 'i-lucide-bell', label: 'Alertes', to: '/alertes', alertDot: true },
  { icon: 'i-lucide-calendar', label: 'Calendrier', to: '/calendrier' },
  { icon: 'i-lucide-cloud-sun', label: 'Météo', to: '/meteo' },
]);

const cheptelNavItems = computed<NavItem[]>(() => [
  { icon: 'i-lucide-map-pin', label: 'Ruchers', to: '/ruchers' },
  {
    icon: 'i-lucide-box',
    label: 'Ruches',
    to: '/ruches',
    badge: totalRuches.value > 0 ? totalRuches.value : undefined,
  },
  { icon: 'i-lucide-activity', label: 'Interventions', to: '/interventions' },
  { icon: 'i-lucide-layers-2', label: 'Hausses', to: '/hausses' },
  { icon: 'i-lucide-droplets', label: 'Production', to: '/production', feature: 'production' },
  { icon: 'i-lucide-truck', label: 'Transhumance', to: '/transhumance' },
  { icon: 'i-lucide-map-pin-plus', label: 'Emplacements', to: '/transhumance/emplacements' },
  { icon: 'i-lucide-crown', label: 'Élevage reines', to: '/elevage' },
  { icon: 'i-lucide-circle-dot', label: 'Reines', to: '/elevage/reines' },
  { icon: 'i-lucide-dna', label: 'Lignées', to: '/elevage/lignees' },
  { icon: 'i-lucide-scissors', label: 'Greffage', to: '/elevage/greffage' },
]);

const affairesNavItems: NavItem[] = [
  { icon: 'i-lucide-warehouse', label: 'Stocks', to: '/stocks', feature: 'stocksBasique' },
  { icon: 'i-lucide-wallet', label: 'Finances', to: '/finances', feature: 'facturationPdf' },
  {
    icon: 'i-lucide-truck',
    label: 'Bons de livraison',
    to: '/finances/bons-livraison',
    feature: 'facturationPdf',
  },
  { icon: 'i-lucide-users', label: 'Clients', to: '/clients', feature: 'clients' },
  {
    icon: 'i-lucide-bar-chart-2',
    label: 'Analytics',
    to: '/analytics',
    feature: 'analyticsRentabilite',
  },
];

const conformiteNavItems: NavItem[] = [
  { icon: 'i-lucide-file-text', label: 'Déclaration NAPI', to: '/declarations/napi' },
  { icon: 'i-lucide-book-open', label: "Registre d'élevage", to: '/exports' },
  { icon: 'i-lucide-pill', label: 'Ordonnances véto', to: '/conformite/ordonnances' },
  {
    icon: 'i-lucide-stethoscope',
    label: 'Visites sanitaires',
    to: '/conformite/visites-sanitaires',
  },
  { icon: 'i-lucide-skull', label: 'Mortalités', to: '/conformite/mortalites' },
  { icon: 'i-lucide-syringe', label: 'Vétérinaires', to: '/conformite/veterinaires' },
];
</script>

<style>
.sidebar-active-item span {
  color: white !important;
  font-weight: 600 !important;
}
.sidebar-active-item svg {
  color: white !important;
}
</style>
