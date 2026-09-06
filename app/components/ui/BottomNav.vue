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

    <!-- Centre : une bulle qui DÉPLOIE deux mini-bulles (Parler à Maya · Créer),
         grandes cibles faciles à viser. Remplace la bulle Maya flottante sur mobile. -->
    <div class="bottom-nav-tab bottom-nav-action">
      <button
        type="button"
        class="bottom-nav-add"
        :class="{ 'is-open': menuOpen }"
        :aria-label="menuOpen ? 'Fermer' : 'Maya ou créer'"
        @click="menuOpen = !menuOpen"
      >
        <!-- Fermé : le logo Maya ET le + partagent l'espace (Maya visible, pas
             cachée). Ouvert : une croix pour fermer. -->
        <UIcon v-if="menuOpen" name="i-lucide-x" class="h-6 w-6" style="color: #fff" />
        <template v-else>
          <IaMayaMark :size="22" glow :state="maya.presence === 'pause' ? 'static' : 'idle'" />
          <span class="bottom-nav-add-div" />
          <UIcon name="i-lucide-plus" class="h-[20px] w-[20px]" style="color: #fff" />
        </template>
      </button>
      <span class="bottom-nav-label">{{ menuOpen ? 'Fermer' : 'Maya · Créer' }}</span>
    </div>

    <!-- Feuille des deux mini-bulles (teleport body pour un empilement propre) -->
    <Teleport to="body">
      <Transition name="sd">
        <div v-if="menuOpen" class="sd-overlay" @click="menuOpen = false">
          <div class="sd-actions" @click.stop>
            <button type="button" class="sd-mini" @click="onMaya">
              <span class="sd-mini-ic sd-mini-maya">
                <IaMayaMark
                  :size="30"
                  glow
                  :state="maya.presence === 'pause' ? 'static' : 'idle'"
                />
              </span>
              <span class="sd-mini-label">Parler à Maya</span>
            </button>
            <button type="button" class="sd-mini" @click="onCreer">
              <span class="sd-mini-ic sd-mini-add">
                <UIcon name="i-lucide-plus" class="h-6 w-6" style="color: #fff" />
              </span>
              <span class="sd-mini-label">Créer</span>
            </button>
          </div>
        </div>
      </Transition>
    </Teleport>

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
    <button type="button" class="bottom-nav-tab" @click="$emit('open-drawer')">
      <div class="bottom-nav-icon"><UIcon name="i-lucide-menu" class="h-[22px] w-[22px]" /></div>
      <span class="bottom-nav-label">Plus</span>
    </button>

    <UiQuickAddSheet v-model:open="addOpen" />
  </nav>
</template>

<script setup lang="ts">
const route = useRoute();
const gating = useGating();
const maya = useMayaStore();
const addOpen = ref(false);
const menuOpen = ref(false);

defineEmits<{ 'open-drawer': [] }>();

/** Mini-bulle Maya : ouvre la discussion (ou la gestion si en pause). */
function onMaya(): void {
  menuOpen.value = false;
  if (maya.presence === 'pause') maya.openSettings();
  else maya.openBubble();
}
/** Mini-bulle Créer : ouvre la feuille d'actions rapides. */
function onCreer(): void {
  menuOpen.value = false;
  addOpen.value = true;
}

// Referme le speed-dial au changement de page.
watch(
  () => route.path,
  () => {
    menuOpen.value = false;
  },
);

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
  height: 46px;
  padding: 0 14px;
  border-radius: 15px;
  background: #1c1c1e;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  /* Légèrement plus haut que la barre → il déborde vers le haut et ressort. */
  margin-top: -6px;
  margin-bottom: 6px;
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.3);
}
.bottom-nav-add.is-open {
  padding: 0;
  width: 48px;
}
.bottom-nav-add-div {
  width: 1px;
  height: 22px;
  border-radius: 1px;
  background: rgba(255, 255, 255, 0.2);
}

/* ─── Speed-dial : deux mini-bulles déployées (Maya · Créer) ─── */
.sd-overlay {
  position: fixed;
  inset: 0;
  z-index: 55;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-end;
  padding-bottom: calc(74px + env(safe-area-inset-bottom, 0px));
  background: rgba(0, 0, 0, 0.18);
}
.sd-actions {
  display: flex;
  flex-direction: column;
  gap: 12px;
  align-items: stretch;
}
.sd-mini {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 200px;
  background: #fff;
  border: none;
  border-radius: 999px;
  padding: 6px 20px 6px 6px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  touch-action: manipulation;
}
.sd-mini:active {
  transform: scale(0.97);
}
.sd-mini-ic {
  width: 44px;
  height: 44px;
  border-radius: 999px;
  display: grid;
  place-items: center;
  flex-shrink: 0;
}
.sd-mini-maya {
  background: #1c1c1e;
}
.sd-mini-add {
  background: #000;
}
.sd-mini-label {
  flex: 1;
  text-align: left;
  font-size: 15px;
  font-weight: 600;
  color: #1c1c1e;
}

/* Transition : voile en fondu + les mini-bulles montent. */
.sd-enter-active,
.sd-leave-active {
  transition: opacity 0.18s ease;
}
.sd-enter-from,
.sd-leave-to {
  opacity: 0;
}
.sd-enter-active .sd-actions,
.sd-leave-active .sd-actions {
  transition: transform 0.24s cubic-bezier(0.16, 1, 0.3, 1);
}
.sd-enter-from .sd-actions,
.sd-leave-to .sd-actions {
  transform: translateY(20px);
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
