<script setup lang="ts">
import { NAV_SECTIONS } from '~/config/navigation';

defineProps<{ open: boolean }>();
const emit = defineEmits<{ close: [] }>();

const authStore = useAuthStore();
const gating = useGating();
const route = useRoute();
const { dashboard } = useDashboard();
const feedbackOpen = useState<boolean>('feedback-modal', () => false);
const supabase = useSupabaseClient();

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
    <div v-if="open" class="fixed inset-0 z-[60] bg-black/25 lg:hidden" @click="emit('close')" />
  </Transition>

  <!-- Panneau — slide depuis la gauche, OVERLAY drawer 85vw -->
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
      class="fixed bottom-0 left-0 top-0 z-[61] w-[85vw] max-w-[320px] overflow-y-auto bg-white shadow-2xl lg:hidden"
      style="overscroll-behavior: contain; -webkit-overflow-scrolling: touch; touch-action: pan-y"
    >
      <!-- Safe area iOS notch -->
      <div class="safe-area-top shrink-0" />

      <!-- Header -->
      <div class="flex items-center gap-2 px-4 py-2" style="border-bottom: 0.5px solid #e7e5e0">
        <button
          type="button"
          class="flex h-10 w-10 items-center justify-center rounded-full text-[#000] touch-manipulation"
          style="-webkit-tap-highlight-color: transparent"
          @click="emit('close')"
        >
          <UIcon name="i-lucide-arrow-left" class="h-5 w-5" />
        </button>
        <span class="text-[15px] font-semibold tracking-[-0.005em]">Menu</span>
      </div>

      <!-- Profil -->
      <div class="flex items-center gap-4 px-5 py-5" style="border-bottom: 0.5px solid #e7e5e0">
        <div
          class="flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-[18px] font-semibold text-white"
          style="background: #1c1c1e; letter-spacing: -0.01em"
        >
          {{ authStore.initials || '?' }}
        </div>
        <div class="min-w-0">
          <p class="truncate text-[18px] font-semibold" style="letter-spacing: -0.005em">
            {{ authStore.fullName || authStore.profil?.email || 'Utilisateur' }}
          </p>
          <p class="mt-0.5 truncate text-[13px]" style="color: #6b7280">
            Plan
            {{ authStore.effectivePlan.charAt(0).toUpperCase() + authStore.effectivePlan.slice(1) }}
          </p>
        </div>
      </div>

      <!-- Sections de navigation -->
      <template v-for="section in sections" :key="section.label">
        <!-- Section header -->
        <div class="px-5 pb-2 pt-5">
          <span class="text-[13px] font-semibold text-[#000]">{{ section.label }}</span>
        </div>

        <!-- Rows -->
        <NuxtLink
          v-for="(item, idx) in section.items"
          :key="item.to"
          :to="item.to"
          class="flex min-h-[56px] items-center gap-3 px-5 py-3.5 touch-manipulation"
          :class="{ 'opacity-55': item.locked }"
          style="-webkit-tap-highlight-color: transparent"
          :style="
            idx === 0
              ? 'border-top: 0.5px solid #e7e5e0; border-bottom: 0.5px solid #e7e5e0'
              : 'border-bottom: 0.5px solid #e7e5e0'
          "
          @click="emit('close')"
        >
          <UIcon :name="item.icon" class="h-5 w-5 shrink-0 text-[#000]" />
          <span class="flex-1 text-[15px] font-[500] text-[#000]">{{ item.label }}</span>
          <span
            v-if="item.badge"
            class="rounded-full px-2 py-0.5 text-[11px] font-semibold text-white"
            style="background: #b54545"
            >{{ item.badge }}</span
          >
          <UIcon
            v-if="item.locked"
            name="i-lucide-lock"
            class="h-4 w-4 shrink-0"
            style="color: #9ca3af"
          />
          <UIcon
            v-else
            name="i-lucide-chevron-right"
            class="h-4 w-4 shrink-0"
            style="color: #9ca3af"
          />
        </NuxtLink>
      </template>

      <!-- Compte -->
      <div class="px-5 pb-2 pt-5">
        <span class="text-[13px] font-semibold text-[#000]">Compte</span>
      </div>
      <NuxtLink
        to="/parametres"
        class="flex min-h-[56px] items-center gap-3 px-5 py-3.5"
        style="
          border-top: 0.5px solid #e7e5e0;
          border-bottom: 0.5px solid #e7e5e0;
          -webkit-tap-highlight-color: transparent;
        "
        @click="emit('close')"
      >
        <UIcon name="i-lucide-settings" class="h-5 w-5 shrink-0 text-[#000]" />
        <span class="flex-1 text-[15px] font-[500] text-[#000]">Paramètres</span>
        <UIcon name="i-lucide-chevron-right" class="h-4 w-4 shrink-0" style="color: #9ca3af" />
      </NuxtLink>
      <NuxtLink
        to="/guide"
        class="flex min-h-[56px] items-center gap-3 px-5 py-3.5"
        style="border-bottom: 0.5px solid #e7e5e0; -webkit-tap-highlight-color: transparent"
        @click="emit('close')"
      >
        <UIcon name="i-lucide-help-circle" class="h-5 w-5 shrink-0 text-[#000]" />
        <span class="flex-1 text-[15px] font-[500] text-[#000]">Guide & aide</span>
        <UIcon name="i-lucide-chevron-right" class="h-4 w-4 shrink-0" style="color: #9ca3af" />
      </NuxtLink>
      <button
        type="button"
        class="flex min-h-[56px] w-full items-center gap-3 px-5 py-3.5"
        style="border-bottom: 0.5px solid #e7e5e0; -webkit-tap-highlight-color: transparent"
        @click="openFeedback"
      >
        <UIcon name="i-lucide-message-circle" class="h-5 w-5 shrink-0 text-[#000]" />
        <span class="flex-1 text-left text-[15px] font-[500] text-[#000]">Mon avis</span>
        <UIcon name="i-lucide-chevron-right" class="h-4 w-4 shrink-0" style="color: #9ca3af" />
      </button>
      <NuxtLink
        v-if="isAdmin"
        to="/admin/users"
        class="flex min-h-[56px] items-center gap-3 px-5 py-3.5"
        style="border-bottom: 0.5px solid #e7e5e0; -webkit-tap-highlight-color: transparent"
        @click="emit('close')"
      >
        <UIcon name="i-lucide-shield" class="h-5 w-5 shrink-0" style="color: #a86a13" />
        <span class="flex-1 text-[15px] font-[500]" style="color: #a86a13">Administration</span>
        <UIcon name="i-lucide-chevron-right" class="h-4 w-4 shrink-0" style="color: #9ca3af" />
      </NuxtLink>

      <!-- Déconnexion -->
      <div class="px-5 pt-8 pb-4">
        <button
          type="button"
          class="flex min-h-[50px] w-full items-center justify-center rounded-[12px] text-[15px] font-[500] touch-manipulation"
          style="
            border: 0.5px solid #f5c5c5;
            color: #b54545;
            background: #fff;
            -webkit-tap-highlight-color: transparent;
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
