<template>
  <nav class="bottom-nav">
    <!-- Aujourd'hui -->
    <NuxtLink to="/dashboard" class="bottom-nav-tab" :class="{ active: isActive('/dashboard') }">
      <span v-if="isActive('/dashboard')" class="bottom-nav-indicator" />
      <div class="bottom-nav-icon"><UIcon name="i-lucide-home" class="h-[22px] w-[22px]" /></div>
      <span class="bottom-nav-label">Aujourd'hui</span>
    </NuxtLink>

    <!-- Ruchers -->
    <NuxtLink to="/ruchers" class="bottom-nav-tab" :class="{ active: isActive('/ruchers') }">
      <span v-if="isActive('/ruchers')" class="bottom-nav-indicator" />
      <div class="bottom-nav-icon"><UIcon name="i-lucide-map-pin" class="h-[22px] w-[22px]" /></div>
      <span class="bottom-nav-label">Ruchers</span>
    </NuxtLink>

    <!-- Créer — ouvre la feuille d'actions rapides -->
    <button
      type="button"
      class="bottom-nav-tab bottom-nav-action"
      aria-label="Créer"
      @click="addOpen = true"
    >
      <div class="bottom-nav-add">
        <UIcon name="i-lucide-plus" class="h-6 w-6" style="color: #fff" />
      </div>
      <span class="bottom-nav-label">Créer</span>
    </button>

    <!-- Ma tournée (Pro+ : cadenas si le plan ne l'inclut pas) -->
    <NuxtLink to="/tournee" class="bottom-nav-tab" :class="{ active: isActive('/tournee') }">
      <span v-if="isActive('/tournee')" class="bottom-nav-indicator" />
      <div class="bottom-nav-icon">
        <UIcon name="i-lucide-route" class="h-[22px] w-[22px]" />
        <span v-if="tourneeLocked" class="bottom-nav-lock">
          <UIcon name="i-lucide-lock" class="h-2.5 w-2.5" />
        </span>
      </div>
      <span class="bottom-nav-label">Tournée</span>
    </NuxtLink>

    <!-- Plus — ouvre le menu complet -->
    <button type="button" class="bottom-nav-tab" aria-label="Menu" @click="$emit('open-drawer')">
      <div class="bottom-nav-icon"><UIcon name="i-lucide-menu" class="h-[22px] w-[22px]" /></div>
      <span class="bottom-nav-label">Plus</span>
    </button>

    <UiQuickAddSheet v-model:open="addOpen" />
  </nav>
</template>

<script setup lang="ts">
const route = useRoute();
const gating = useGating();
const addOpen = ref(false);

defineEmits<{ 'open-drawer': [] }>();

// Tournée optimisée = Pro+. On marque l'onglet d'un cadenas pour les plans qui ne
// l'ont pas ; le tap mène quand même à /tournee (page = teaser flou + « Voir les plans »).
const tourneeLocked = computed(() => !gating.can('tourneeOptimisee'));

function isActive(match: string): boolean {
  return route.path === match || route.path.startsWith(`${match}/`);
}
</script>

<style scoped>
/* BottomNav épinglée au bas du viewport — position:fixed garantit qu'elle reste
   collée en bas quel que soit le calcul de hauteur de colonne (le mode in-flow
   "flottait" au lancement PWA iOS quand le fallback 100dvh dépassait l'écran
   visible avant que --app-height ne soit calculé en JS).
   Le padding-bottom du <main> (layout) compense la hauteur de la barre. */
.bottom-nav {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 30;
  width: 100%;
  display: flex;
  align-items: stretch;
  background: #fff;
  border-top: 0.5px solid #e7e5e0;
  height: calc(50px + env(safe-area-inset-bottom, 0px));
  padding-bottom: env(safe-area-inset-bottom, 0px);
}

.bottom-nav-tab {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  position: relative;
  padding-top: 8px;
  color: #9ca3af;
  background: none;
  border: none;
  cursor: pointer;
  text-decoration: none;
  -webkit-tap-highlight-color: transparent;
  touch-action: manipulation;
}

.bottom-nav-tab.active {
  color: #000;
}

.bottom-nav-indicator {
  position: absolute;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 24px;
  height: 2px;
  border-radius: 99px;
  background: #f5a623;
}

.bottom-nav-icon {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.bottom-nav-badge {
  position: absolute;
  top: -4px;
  right: -8px;
  min-width: 16px;
  height: 16px;
  border-radius: 999px;
  background: #b54545;
  color: white;
  font-size: 10px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 4px;
}

.bottom-nav-lock {
  position: absolute;
  bottom: -3px;
  right: -7px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 14px;
  height: 14px;
  border-radius: 999px;
  background: #9ca3af;
  color: #fff;
}

.bottom-nav-label {
  font-size: 10px;
  font-weight: 500;
  line-height: 1;
}

.bottom-nav-action .bottom-nav-label {
  color: #9ca3af;
}

.bottom-nav-add {
  width: 48px;
  height: 48px;
  border-radius: 14px;
  background: #000;
  color: #fff;
  display: grid;
  place-items: center;
  margin-bottom: 6px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.25);
}

@media (min-width: 1024px) {
  .bottom-nav {
    display: none;
  }
}

@media (max-width: 1023px) {
  :root {
    --bottom-nav-height: calc(50px + constant(safe-area-inset-bottom, 0px));
    --bottom-nav-height: calc(50px + env(safe-area-inset-bottom, 0px));
  }
}
</style>
