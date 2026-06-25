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
      <!-- Admin (admins uniquement) — outil principal, tout en haut pour un accès direct -->
      <div v-if="isAdmin" class="mt-1 mb-2">
        <NuxtLink
          to="/admin"
          :title="collapsed && !isMobile ? 'Espace admin' : undefined"
          class="group flex min-h-[46px] items-center gap-3 rounded-[12px] px-[11px] py-[10px] font-semibold shadow-sm transition-all duration-[var(--duration-fast)] hover:opacity-90"
          style="background: var(--honey); color: #1c1c1e"
          active-class="ring-2 ring-white/40"
          @click="isMobile && $emit('toggle-collapse')"
        >
          <UIcon name="i-lucide-layout-dashboard" class="h-[18px] w-[18px] shrink-0" />
          <span v-if="!collapsed || isMobile" class="flex-1 truncate text-[13.5px]">
            Espace admin
          </span>
          <UIcon
            v-if="!collapsed || isMobile"
            name="i-lucide-arrow-up-right"
            class="h-3.5 w-3.5 shrink-0 opacity-60"
          />
        </NuxtLink>
      </div>

      <!-- Groupes de navigation (data-driven ; sections secondaires repliables) -->
      <template v-for="section in navSections" :key="section.key">
        <!-- En-tête de section -->
        <component
          :is="section.collapsible ? 'button' : 'div'"
          v-if="!collapsed || isMobile"
          :type="section.collapsible ? 'button' : undefined"
          class="mt-4 mb-1.5 flex w-full items-center gap-1 px-[10px]"
          @click="section.collapsible ? toggleSection(section.key) : undefined"
        >
          <span
            class="text-[10px] font-semibold uppercase tracking-[0.1em]"
            style="color: rgba(255, 255, 255, 0.35)"
            >{{ section.label }}</span
          >
          <UIcon
            v-if="section.collapsible"
            :name="isSectionOpen(section) ? 'i-lucide-chevron-down' : 'i-lucide-chevron-right'"
            class="ml-0.5 h-3 w-3 shrink-0"
            style="color: rgba(255, 255, 255, 0.3)"
          />
        </component>
        <!-- Items de la section -->
        <ul
          v-show="(collapsed && !isMobile) || isSectionOpen(section)"
          class="flex flex-col gap-0.5"
        >
          <li v-for="item in section.items" :key="item.to">
            <UiSidebarLink
              :item="item"
              :collapsed="collapsed"
              :is-mobile="isMobile"
              :locked="!!item.feature && !gating.can(item.feature)"
              :alert-count="alertCount"
              @navigate="isMobile && $emit('toggle-collapse')"
            />
          </li>
        </ul>
      </template>

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
    </nav>

    <!-- Usage meter (desktop uniquement — sur mobile le badge Ruches suffit) -->
    <div
      v-if="!isMobile && !collapsed && gating.usageData.value"
      class="border-t border-white/10 px-3.5 py-3"
    >
      <UiUsageMeter
        :current="gating.usageData.value?.usage.ruches?.current ?? 0"
        :max="gating.usageData.value?.usage.ruches?.max ?? null"
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

interface NavSection {
  key: string;
  label: string;
  /** Si vrai, la section est un accordéon (repliée par défaut, ouverte si route active). */
  collapsible?: boolean;
  items: NavItem[];
}

const props = defineProps<{
  collapsed: boolean;
  mobileOpen: boolean;
  isMobile: boolean;
}>();

const emit = defineEmits<{
  'toggle-collapse': [];
}>();

const route = useRoute();
const gating = useGating();
const authStore = useAuthStore();
const { dashboard } = useDashboard();
const { on } = useDataBus();
const feedbackOpen = useState<boolean>('feedback-modal', () => false);

function openFeedback() {
  if (props.isMobile) emit('toggle-collapse');
  feedbackOpen.value = true;
}

// Charger l'usage au montage, puis le rafraîchir à chaque mutation qui change
// un compteur (ruches/ruchers) ou à chaque changement de plan — sinon la jauge
// d'usage reste figée.
onMounted(() => {
  gating.refreshUsage();
});
on(
  [
    'ruche:created',
    'ruche:updated',
    'ruche:deleted',
    'rucher:created',
    'rucher:deleted',
    'subscription:changed',
  ],
  () => gating.refreshUsage(),
);

const alertCount = computed(() => dashboard.value?.kpis.alertesActives ?? 0);
const totalRuches = computed(() => gating.usageData.value?.usage.ruches?.current ?? 0);
const isAdmin = computed(
  () => !!(authStore.profil as (typeof authStore.profil & { isAdmin?: boolean }) | null)?.isAdmin,
);

// ── Sections de navigation ────────────────────────────────────────────────────
// Les groupes secondaires (élevage, transhumance, conformité) sont repliables
// pour alléger le visuel ; ils s'ouvrent automatiquement quand la route est
// dedans. Le cœur quotidien (Pilotage, Rucher, Affaires) reste déplié.
const navSections = computed<NavSection[]>(() => [
  {
    key: 'pilotage',
    label: 'Pilotage',
    items: [
      { icon: 'i-lucide-layout-dashboard', label: 'Tableau de bord', to: '/dashboard' },
      { icon: 'i-lucide-bell', label: 'Alertes', to: '/alertes', alertDot: true },
      { icon: 'i-lucide-calendar', label: 'Calendrier', to: '/calendrier' },
      { icon: 'i-lucide-cloud-sun', label: 'Météo', to: '/meteo' },
    ],
  },
  {
    key: 'rucher',
    label: 'Rucher',
    items: [
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
    ],
  },
  {
    key: 'elevage',
    label: 'Élevage de reines',
    collapsible: true,
    items: [
      { icon: 'i-lucide-crown', label: 'Élevage', to: '/elevage' },
      { icon: 'i-lucide-circle-dot', label: 'Reines', to: '/elevage/reines' },
      { icon: 'i-lucide-dna', label: 'Lignées', to: '/elevage/lignees' },
      { icon: 'i-lucide-scissors', label: 'Greffage', to: '/elevage/greffage' },
    ],
  },
  {
    key: 'transhumance',
    label: 'Transhumance',
    collapsible: true,
    items: [
      { icon: 'i-lucide-truck', label: 'Transhumance', to: '/transhumance' },
      { icon: 'i-lucide-map-pin-plus', label: 'Emplacements', to: '/transhumance/emplacements' },
    ],
  },
  {
    key: 'affaires',
    label: 'Affaires',
    items: [
      { icon: 'i-lucide-wallet', label: 'Finances', to: '/finances', feature: 'facturationPdf' },
      {
        icon: 'i-lucide-truck',
        label: 'Bons de livraison',
        to: '/finances/bons-livraison',
        feature: 'facturationPdf',
      },
      { icon: 'i-lucide-users', label: 'Clients', to: '/clients', feature: 'clients' },
      { icon: 'i-lucide-warehouse', label: 'Stocks', to: '/stocks', feature: 'stocksBasique' },
      {
        icon: 'i-lucide-bar-chart-2',
        label: 'Analytics',
        to: '/analytics',
        feature: 'analyticsRentabilite',
      },
      {
        icon: 'i-lucide-trending-up',
        label: 'Prévisionnel',
        to: '/finances/tresorerie',
        feature: 'previsionnelTresorerie',
      },
      {
        icon: 'i-lucide-users-round',
        label: 'Communauté',
        to: '/communaute',
        feature: 'communauteBase',
      },
    ],
  },
  {
    key: 'conformite',
    label: 'Conformité',
    collapsible: true,
    items: [
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
    ],
  },
]);

const expandedSections = ref<Set<string>>(new Set());

function toggleSection(key: string) {
  const next = new Set(expandedSections.value);
  if (next.has(key)) next.delete(key);
  else next.add(key);
  expandedSections.value = next;
}

function sectionHasActiveRoute(section: NavSection): boolean {
  return section.items.some((it) => route.path === it.to || route.path.startsWith(`${it.to}/`));
}

function isSectionOpen(section: NavSection): boolean {
  if (!section.collapsible) return true;
  return expandedSections.value.has(section.key) || sectionHasActiveRoute(section);
}
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
