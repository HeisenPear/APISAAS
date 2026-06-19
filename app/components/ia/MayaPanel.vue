<!--
  MayaPanel — slide-over contextuel de Maya (sur une fiche ruche).
  Présence + actions guidées au tap (handoff §7, MayaSidePanel). Déterministe :
  chaque action ouvre Maya avec une demande pré-remplie (?q=…), pas un champ libre.
  <IaMayaPanel :open="x" numero="5" rucher-nom="Tilleuls" @close="x=false" />
-->
<template>
  <Transition name="maya-panel-fade">
    <div v-if="open" class="maya-panel-overlay" @click.self="emit('close')">
      <aside class="maya-panel" role="dialog" aria-label="Maya — aide contextuelle">
        <header class="maya-panel-head">
          <span class="flex items-center gap-2">
            <IaMayaMark :size="28" glow state="idle" />
            <span class="text-[15px] font-semibold" style="color: var(--text-primary)">Maya</span>
          </span>
          <button
            type="button"
            class="grid h-9 w-9 place-items-center rounded-full hover:bg-[var(--surface-muted)]"
            aria-label="Fermer"
            @click="emit('close')"
          >
            <UIcon name="i-lucide-x" class="h-4 w-4" style="color: var(--text-secondary)" />
          </button>
        </header>

        <p class="text-[12.5px]" style="color: var(--text-secondary)">
          Ruche <strong style="color: var(--text-primary)">{{ numero }}</strong>
          <template v-if="rucherNom"> · {{ rucherNom }}</template> — dis-moi ce qu'on note, je
          m'occupe du reste 🐝
        </p>

        <div class="mt-4 flex flex-col gap-2">
          <NuxtLink
            v-for="a in actions"
            :key="a.label"
            :to="a.to"
            class="maya-panel-action"
            @click="emit('close')"
          >
            <span aria-hidden="true">{{ a.emoji }}</span>
            <span>{{ a.label }}</span>
            <UIcon name="i-lucide-arrow-up-right" class="ml-auto h-4 w-4 opacity-60" />
          </NuxtLink>
        </div>
      </aside>
    </div>
  </Transition>
</template>

<script setup lang="ts">
const props = defineProps<{ open: boolean; numero: string; rucherNom?: string }>();
const emit = defineEmits<{ close: [] }>();

const q = (texte: string) => `/copilote?q=${encodeURIComponent(texte)}`;
const actions = computed(() => [
  { emoji: '📋', label: 'Noter une visite', to: q(`note une visite ruche ${props.numero}`) },
  {
    emoji: '🍯',
    label: 'Noter un nourrissement',
    to: q(`note un nourrissement ruche ${props.numero}`),
  },
  {
    emoji: '🪲',
    label: 'Noter un comptage varroa',
    to: q(`note un comptage varroa ruche ${props.numero}`),
  },
  { emoji: '💬', label: 'Poser une question à Maya', to: '/copilote' },
]);
</script>

<style scoped>
.maya-panel-overlay {
  position: fixed;
  inset: 0;
  z-index: 60;
  display: flex;
  justify-content: flex-end;
  background: rgba(28, 28, 30, 0.32);
  backdrop-filter: blur(2px);
}
.maya-panel {
  width: min(360px, 88vw);
  height: 100%;
  background: var(--surface-primary);
  border-left: 1px solid var(--border-default);
  box-shadow: -8px 0 40px rgba(28, 28, 30, 0.18);
  padding: 18px;
  overflow-y: auto;
  padding-bottom: calc(18px + env(safe-area-inset-bottom, 0px));
}
.maya-panel-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14px;
}
.maya-panel-action {
  display: flex;
  align-items: center;
  gap: 10px;
  min-height: 48px;
  padding: 0 14px;
  border-radius: 12px;
  background: var(--honey-soft);
  color: var(--honey-deep);
  font-size: 13.5px;
  font-weight: 600;
  border: 1px solid color-mix(in srgb, var(--honey) 30%, transparent);
  transition:
    transform 0.15s,
    box-shadow 0.15s;
}
.maya-panel-action:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 14px rgba(245, 166, 35, 0.18);
}
/* Slide-over : le voile fond, le panneau glisse depuis la droite. */
.maya-panel-fade-enter-active,
.maya-panel-fade-leave-active {
  transition: opacity 0.2s ease;
}
.maya-panel-fade-enter-active .maya-panel,
.maya-panel-fade-leave-active .maya-panel {
  transition: transform 0.25s var(--ease-out-expo, ease);
}
.maya-panel-fade-enter-from,
.maya-panel-fade-leave-to {
  opacity: 0;
}
.maya-panel-fade-enter-from .maya-panel,
.maya-panel-fade-leave-to .maya-panel {
  transform: translateX(100%);
}
@media (prefers-reduced-motion: reduce) {
  .maya-panel-fade-enter-active .maya-panel,
  .maya-panel-fade-leave-active .maya-panel {
    transition: none;
  }
}
</style>
