<script setup lang="ts">
import { NAV_SECTIONS } from '~/config/navigation';

defineProps<{ open: boolean }>();
const emit = defineEmits<{ close: [] }>();

const authStore = useAuthStore();
const gating = useGating();
const route = useRoute();
const maya = useMayaStore();
const { dashboard } = useDashboard();
const feedbackOpen = useState<boolean>('feedback-modal', () => false);
const supabase = useSupabaseClient();

const presenceLabel = computed(() => {
  switch (maya.presence) {
    case 'discrete':
      return 'Assistant · discrète';
    case 'pause':
      return 'Assistant · en pause';
    default:
      return 'Assistant · active';
  }
});

/** Maya (nom/logo) → la PAGE Maya plein écran, comme la sidebar web. */
function ouvrirMaya() {
  emit('close');
  void navigateTo('/copilote');
}
function gererMaya() {
  maya.openSettings();
  emit('close');
}

// Ferme automatiquement sur changement de route
watch(
  () => route.path,
  () => emit('close'),
);

const alertCount = computed(() => dashboard.value?.kpis.alertesActives ?? 0);
const isAdmin = computed(() => !!(authStore.profil as Record<string, unknown>)?.isAdmin);

async function handleLogout() {
  emit('close');
  await supabase.auth.signOut();
  navigateTo('/login');
}

function openFeedback() {
  feedbackOpen.value = true;
  emit('close');
}

// Même SOURCE UNIQUE que la sidebar desktop (app/config/navigation.ts). On dérive
// juste le badge d'alertes et l'état « verrouillé » (feature hors plan) par item.
const sections = computed(() =>
  NAV_SECTIONS.map((section) => ({
    label: section.label,
    items: section.items.map((item) => ({
      icon: item.icon,
      label: item.label,
      to: item.to,
      badge: item.alertDot && alertCount.value > 0 ? String(alertCount.value) : undefined,
      locked: !!item.feature && !gating.can(item.feature),
    })),
  })),
);
</script>

<template>
  <!-- Backdrop -->
  <Transition
    enter-active-class="transition-opacity duration-300"
    leave-active-class="transition-opacity duration-200"
    enter-from-class="opacity-0"
    leave-to-class="opacity-0"
  >
    <div v-if="open" class="fixed inset-0 z-[60] bg-black/45 lg:hidden" @click="emit('close')" />
  </Transition>

  <!-- Panneau SOMBRE (noir Apple, texte blanc) — slide depuis la gauche, drawer 85vw -->
  <Transition
    enter-active-class="transition-transform duration-300 ease-[cubic-bezier(.16,1,.3,1)]"
    leave-active-class="transition-transform duration-200 ease-in"
    enter-from-class="-translate-x-full"
    leave-to-class="-translate-x-full"
  >
    <div
      v-if="open"
      role="dialog"
      aria-modal="true"
      aria-label="Menu principal"
      class="mnav-panel fixed bottom-0 left-0 top-0 z-[61] w-[85vw] max-w-[320px] overflow-y-auto shadow-2xl lg:hidden"
      style="overscroll-behavior: contain; -webkit-overflow-scrolling: touch; touch-action: pan-y"
    >
      <!-- Safe area iOS notch -->
      <div class="safe-area-top shrink-0" />

      <!-- Header -->
      <div class="mnav-sep flex items-center gap-2 px-4 py-2">
        <button
          aria-label="Fermer le menu"
          type="button"
          class="mnav-tap flex h-10 w-10 items-center justify-center rounded-full text-white"
          @click="emit('close')"
        >
          <UIcon name="i-lucide-arrow-left" class="h-5 w-5" />
        </button>
        <span class="text-[15px] font-semibold tracking-[-0.005em] text-white">Menu</span>
      </div>

      <!-- Profil -->
      <div class="mnav-sep flex items-center gap-4 px-5 py-5">
        <div
          class="flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-[18px] font-bold"
          style="background: var(--honey, #f5a623); color: #1c1c1e; letter-spacing: -0.01em"
        >
          {{ authStore.initials || '?' }}
        </div>
        <div class="min-w-0">
          <p class="truncate text-[18px] font-semibold text-white" style="letter-spacing: -0.005em">
            {{ authStore.fullName || authStore.profil?.email || 'Utilisateur' }}
          </p>
          <p class="mt-0.5 truncate text-[13px]" style="color: rgba(255, 255, 255, 0.45)">
            Plan
            {{ authStore.effectivePlan.charAt(0).toUpperCase() + authStore.effectivePlan.slice(1) }}
          </p>
        </div>
      </div>

      <!-- Maya · Assistant — SURFACE PHARE, tout en haut (comme la sidebar web) :
           carte mise en avant, le nom ouvre la page Maya, l'engrenage la gestion. -->
      <div class="px-4 pb-1 pt-4">
        <div
          class="flex items-center gap-3 rounded-[14px] px-3 py-2.5"
          style="
            background: linear-gradient(135deg, rgba(245, 166, 35, 0.2), rgba(245, 166, 35, 0.06));
            border: 1px solid rgba(245, 166, 35, 0.24);
          "
        >
          <button
            type="button"
            class="mnav-tap flex min-w-0 flex-1 items-center gap-3 text-left"
            @click="ouvrirMaya"
          >
            <IaMayaMark
              :size="34"
              glow
              :state="maya.presence === 'pause' ? 'static' : 'idle'"
              class="shrink-0"
            />
            <span class="min-w-0 flex-1">
              <span class="block text-[15.5px] font-semibold leading-tight text-white">Maya</span>
              <span class="block text-[12px]" style="color: rgba(255, 255, 255, 0.55)">{{
                presenceLabel
              }}</span>
            </span>
          </button>
          <button
            type="button"
            class="mnav-tap flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px]"
            style="background: rgba(255, 255, 255, 0.1); color: rgba(255, 255, 255, 0.75)"
            aria-label="Gérer Maya"
            @click="gererMaya"
          >
            <UIcon name="i-lucide-sliders-horizontal" class="h-[18px] w-[18px]" />
          </button>
        </div>
      </div>

      <!-- Sections de navigation -->
      <template v-for="section in sections" :key="section.label">
        <div class="mnav-section">{{ section.label }}</div>
        <NuxtLink
          v-for="(item, idx) in section.items"
          :key="item.to"
          :to="item.to"
          class="mnav-row mnav-tap"
          :class="[
            { 'mnav-locked': item.locked },
            idx === 0 ? 'mnav-sep-top mnav-sep' : 'mnav-sep',
          ]"
          @click="emit('close')"
        >
          <UIcon :name="item.icon" class="mnav-icon h-5 w-5 shrink-0" />
          <span class="mnav-label">{{ item.label }}</span>
          <span
            v-if="item.badge"
            class="rounded-full px-2 py-0.5 text-[11px] font-semibold text-white"
            style="background: #b54545"
            >{{ item.badge }}</span
          >
          <UIcon v-if="item.locked" name="i-lucide-lock" class="mnav-chevron h-4 w-4 shrink-0" />
          <UIcon v-else name="i-lucide-chevron-right" class="mnav-chevron h-4 w-4 shrink-0" />
        </NuxtLink>
      </template>

      <!-- Compte -->
      <div class="mnav-section">Compte</div>
      <NuxtLink
        to="/parametres"
        class="mnav-row mnav-tap mnav-sep mnav-sep-top"
        @click="emit('close')"
      >
        <UIcon name="i-lucide-settings" class="mnav-icon h-5 w-5 shrink-0" />
        <span class="mnav-label">Paramètres</span>
        <UIcon name="i-lucide-chevron-right" class="mnav-chevron h-4 w-4 shrink-0" />
      </NuxtLink>
      <NuxtLink to="/outils" class="mnav-row mnav-tap mnav-sep" @click="emit('close')">
        <UIcon name="i-lucide-calculator" class="mnav-icon h-5 w-5 shrink-0" />
        <span class="mnav-label">Outils pratiques</span>
        <UIcon name="i-lucide-chevron-right" class="mnav-chevron h-4 w-4 shrink-0" />
      </NuxtLink>
      <NuxtLink to="/guide" class="mnav-row mnav-tap mnav-sep" @click="emit('close')">
        <UIcon name="i-lucide-help-circle" class="mnav-icon h-5 w-5 shrink-0" />
        <span class="mnav-label">Guide & aide</span>
        <UIcon name="i-lucide-chevron-right" class="mnav-chevron h-4 w-4 shrink-0" />
      </NuxtLink>
      <button type="button" class="mnav-row mnav-tap mnav-sep w-full" @click="openFeedback">
        <UIcon name="i-lucide-message-circle" class="mnav-icon h-5 w-5 shrink-0" />
        <span class="mnav-label text-left">Mon avis</span>
        <UIcon name="i-lucide-chevron-right" class="mnav-chevron h-4 w-4 shrink-0" />
      </button>
      <NuxtLink
        v-if="isAdmin"
        to="/admin/users"
        class="mnav-row mnav-tap mnav-sep"
        @click="emit('close')"
      >
        <UIcon
          name="i-lucide-shield"
          class="h-5 w-5 shrink-0"
          style="color: var(--honey, #f5a623)"
        />
        <span class="mnav-label" style="color: var(--honey, #f5a623)">Administration</span>
        <UIcon name="i-lucide-chevron-right" class="mnav-chevron h-4 w-4 shrink-0" />
      </NuxtLink>

      <!-- Déconnexion -->
      <div class="px-5 pb-4 pt-8">
        <button
          type="button"
          class="mnav-tap flex min-h-[50px] w-full items-center justify-center rounded-[12px] text-[15px] font-medium"
          style="
            border: 1px solid rgba(224, 122, 122, 0.4);
            color: #ef9a9a;
            background: rgba(224, 122, 122, 0.08);
          "
          @click="handleLogout"
        >
          Se déconnecter
        </button>
      </div>

      <!-- Spacer bottom nav -->
      <div class="h-[calc(env(safe-area-inset-bottom,0px)+80px)]" />
    </div>
  </Transition>
</template>

<style scoped>
.mnav-panel {
  background: #1c1c1e;
}
.mnav-tap {
  -webkit-tap-highlight-color: transparent;
  touch-action: manipulation;
}
.mnav-sep {
  border-bottom: 0.5px solid rgba(255, 255, 255, 0.08);
}
.mnav-sep-top {
  border-top: 0.5px solid rgba(255, 255, 255, 0.08);
}
.mnav-section {
  padding: 20px 20px 8px;
  font-size: 12.5px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.42);
}
.mnav-row {
  display: flex;
  align-items: center;
  gap: 12px;
  min-height: 56px;
  padding: 14px 20px;
}
.mnav-row:active {
  background: rgba(255, 255, 255, 0.05);
}
.mnav-icon {
  color: rgba(255, 255, 255, 0.78);
}
.mnav-label {
  flex: 1;
  font-size: 15px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.92);
}
.mnav-chevron {
  color: rgba(255, 255, 255, 0.28);
}
.mnav-locked {
  opacity: 0.5;
}
</style>
