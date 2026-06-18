<!--
  MayaLauncher — bouton flottant (FAB) qui rend Maya accessible partout (desktop).
  Ink #1c1c1e + rayon de miel vivant ; ouvre un menu d'actions DÉTERMINISTES
  (pas de champ de texte libre « magique »). Réf. maquette : contextual.jsx (MayaLauncherFull).
  Monté dans le layout par défaut, masqué sur mobile (la BottomNav porte Maya là-bas).
-->
<template>
  <div ref="root" class="maya-launcher">
    <!-- Menu rapide -->
    <Transition name="maya-launcher-pop">
      <div v-if="open" class="ml-menu" role="menu">
        <div class="ml-head">
          <IaMayaMark :size="28" glow state="idle" />
          <div class="min-w-0">
            <p class="ml-head-title">Bonjour {{ prenom }} 👋</p>
            <p class="ml-head-sub">Comment puis-je aider ?</p>
          </div>
        </div>
        <div class="ml-items">
          <NuxtLink
            v-for="a in actions"
            :key="a.label"
            :to="a.to"
            class="ml-item"
            role="menuitem"
            @click="open = false"
          >
            <span class="ml-item-ic" :class="a.tint">
              <UIcon :name="a.icon" class="h-[15px] w-[15px]" />
            </span>
            <span class="ml-item-label">{{ a.label }}</span>
          </NuxtLink>
        </div>
        <NuxtLink to="/copilote" class="ml-cta" @click="open = false">
          <IaMayaMark :size="18" state="static" />
          Ouvrir Maya
        </NuxtLink>
      </div>
    </Transition>

    <!-- FAB -->
    <button
      type="button"
      class="ml-fab"
      :aria-expanded="open"
      aria-label="Ouvrir Maya"
      @click="open = !open"
    >
      <IaMayaMark :size="30" glow :state="open ? 'think' : 'idle'" />
    </button>
  </div>
</template>

<script setup lang="ts">
const authStore = useAuthStore();
const route = useRoute();

const open = ref(false);
const root = ref<HTMLElement | null>(null);

const prenom = computed(() => authStore.profil?.prenom || 'apiculteur');

const actions = [
  {
    label: 'Voir le point du jour',
    icon: 'i-lucide-alert-triangle',
    tint: 'honey',
    to: '/copilote',
  },
  { label: 'Dicter une visite', icon: 'i-lucide-mic', tint: 'clay', to: '/copilote' },
  {
    label: 'Nouvelle intervention',
    icon: 'i-lucide-plus',
    tint: 'sage',
    to: '/interventions/nouvelle',
  },
];

// Ferme au clic extérieur (auto-import @vueuse/nuxt) et au changement de route.
onClickOutside(root, () => (open.value = false));
watch(
  () => route.path,
  () => (open.value = false),
);
onMounted(() => {
  const onEsc = (e: KeyboardEvent) => {
    if (e.key === 'Escape') open.value = false;
  };
  window.addEventListener('keydown', onEsc);
  onUnmounted(() => window.removeEventListener('keydown', onEsc));
});
</script>

<style scoped>
.maya-launcher {
  position: fixed;
  right: 24px;
  bottom: 24px;
  z-index: 50;
}
.ml-fab {
  width: 56px;
  height: 56px;
  border-radius: 18px;
  border: none;
  background: #1c1c1e;
  box-shadow: 0 12px 30px rgba(28, 28, 30, 0.3);
  display: grid;
  place-items: center;
  cursor: pointer;
  transition:
    transform 0.18s var(--ease-out-expo, ease),
    box-shadow 0.18s;
}
.ml-fab:hover {
  transform: translateY(-2px);
  box-shadow: 0 16px 38px rgba(28, 28, 30, 0.36);
}
.ml-menu {
  position: absolute;
  right: 0;
  bottom: 72px;
  width: 300px;
  background: var(--surface-card);
  border-radius: 18px;
  border: 1px solid var(--border-default);
  box-shadow: 0 24px 60px rgba(40, 30, 20, 0.22);
  overflow: hidden;
}
.ml-head {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 16px 18px;
  border-bottom: 1px solid var(--border-faint);
}
.ml-head-title {
  font-family: var(--font-display, inherit);
  font-weight: 600;
  font-size: 14px;
  color: var(--text-primary);
}
.ml-head-sub {
  font-size: 11.5px;
  color: var(--text-tertiary);
}
.ml-items {
  padding: 8px;
}
.ml-item {
  display: flex;
  align-items: center;
  gap: 11px;
  padding: 10px 11px;
  border-radius: 10px;
  transition: background 0.15s;
}
.ml-item:hover {
  background: var(--surface-muted);
}
.ml-item-ic {
  width: 30px;
  height: 30px;
  border-radius: 8px;
  display: grid;
  place-items: center;
  flex-shrink: 0;
}
.ml-item-ic.honey {
  background: var(--honey-soft);
  color: var(--honey-deep);
}
.ml-item-ic.sage {
  background: var(--sage-soft);
  color: var(--sage-deep);
}
.ml-item-ic.clay {
  background: var(--clay-soft);
  color: var(--clay-deep);
}
.ml-item-label {
  font-size: 13.5px;
  color: var(--text-primary);
}
.ml-cta {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin: 0 8px 10px;
  height: 42px;
  border-radius: 12px;
  background: #1c1c1e;
  color: #fff;
  font-size: 13.5px;
  font-weight: 600;
}
.ml-cta:hover {
  background: #2c2c30;
}

.maya-launcher-pop-enter-active,
.maya-launcher-pop-leave-active {
  transition:
    opacity 0.18s ease,
    transform 0.18s var(--ease-out-expo, ease);
}
.maya-launcher-pop-enter-from,
.maya-launcher-pop-leave-to {
  opacity: 0;
  transform: translateY(8px) scale(0.97);
}
</style>
