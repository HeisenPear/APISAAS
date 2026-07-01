<template>
  <Teleport to="body">
    <Transition name="qa">
      <div
        v-if="open"
        class="fixed inset-0 z-[70] flex flex-col justify-end bg-black/40"
        @click.self="close"
      >
        <div
          class="qa-sheet rounded-t-[22px] bg-white pb-[env(safe-area-inset-bottom,0px)] shadow-2xl"
        >
          <div class="mx-auto mt-2.5 h-1 w-9 rounded-full bg-stone-300" />
          <p class="px-5 pb-1 pt-3 text-[13px] font-semibold text-stone-500">Créer</p>
          <div class="px-3 pb-3">
            <button
              v-for="a in ACTIONS"
              :key="a.to"
              type="button"
              class="flex w-full items-center gap-3.5 rounded-[14px] px-3 py-3 text-left transition-colors active:bg-stone-100"
              @click="go(a.to)"
            >
              <span
                class="flex h-11 w-11 shrink-0 items-center justify-center rounded-[13px]"
                :style="`background:${a.bg};color:${a.color}`"
              >
                <UIcon :name="a.icon" class="h-[22px] w-[22px]" />
              </span>
              <span class="min-w-0 flex-1">
                <span class="block text-[15px] font-semibold text-stone-900">{{ a.label }}</span>
                <span class="block truncate text-[12.5px] text-stone-400">{{ a.desc }}</span>
              </span>
              <UIcon name="i-lucide-chevron-right" class="h-4 w-4 shrink-0 text-stone-300" />
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
defineProps<{ open: boolean }>();
const emit = defineEmits<{ 'update:open': [value: boolean] }>();

// Actions rapides « terrain + commerce » — routes existantes ; le gating par plan
// est géré au niveau de la route (middleware) pour les features payantes.
const ACTIONS = [
  {
    label: 'Intervention',
    desc: 'Visite, traitement, contrôle…',
    icon: 'i-lucide-clipboard-list',
    to: '/interventions/nouvelle',
    bg: 'var(--honey-soft)',
    color: 'var(--honey-deep)',
  },
  {
    label: 'Récolte',
    desc: 'Enregistrer une récolte de miel',
    icon: 'i-lucide-droplets',
    to: '/production',
    bg: 'var(--sage-soft)',
    color: 'var(--sage-deep)',
  },
  {
    label: 'Vente',
    desc: 'Nouvelle vente / facture',
    icon: 'i-lucide-shopping-bag',
    to: '/finances/ventes?new=1',
    bg: 'var(--clay-soft)',
    color: 'var(--clay-deep)',
  },
  {
    label: 'Signalement frelon',
    desc: 'Nid ou individu observé',
    icon: 'i-lucide-bug',
    to: '/frelon',
    bg: '#fdecec',
    color: '#b54545',
  },
];

function go(to: string) {
  emit('update:open', false);
  navigateTo(to);
}
function close() {
  emit('update:open', false);
}
</script>

<style scoped>
.qa-enter-active,
.qa-leave-active {
  transition: opacity 220ms ease;
}
.qa-enter-active .qa-sheet,
.qa-leave-active .qa-sheet {
  transition: transform 260ms cubic-bezier(0.16, 1, 0.3, 1);
}
.qa-enter-from,
.qa-leave-to {
  opacity: 0;
}
.qa-enter-from .qa-sheet,
.qa-leave-to .qa-sheet {
  transform: translateY(100%);
}
</style>
