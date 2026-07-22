<template>
  <div>
    <p
      class="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--text-tertiary)]"
    >
      {{ label }}
    </p>
    <div
      class="flex items-center gap-2 rounded-[10px] border border-[var(--border-default)] bg-[var(--surface-muted)] py-2 pl-3 pr-1.5"
    >
      <code
        class="min-w-0 flex-1 select-all truncate font-mono text-[12px] text-[var(--text-secondary)]"
      >
        {{ affichage }}
      </code>
      <button
        v-if="masquable"
        type="button"
        class="shrink-0 rounded-[7px] p-1.5 text-[var(--text-tertiary)] transition-colors hover:bg-white hover:text-[var(--text-secondary)]"
        :title="visible ? 'Masquer' : 'Afficher'"
        @click="visible = !visible"
      >
        <UIcon :name="visible ? 'i-lucide-eye-off' : 'i-lucide-eye'" class="h-4 w-4" />
      </button>
      <button
        type="button"
        class="shrink-0 rounded-[7px] p-1.5 transition-colors hover:bg-white"
        :class="copie ? 'text-[var(--honey-deep)]' : 'text-[var(--text-tertiary)]'"
        title="Copier"
        @click="copier"
      >
        <UIcon :name="copie ? 'i-lucide-check' : 'i-lucide-copy'" class="h-4 w-4" />
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
/** Champ technique en lecture seule (URL, jeton) avec copie en un clic. */
const props = defineProps<{
  label: string;
  valeur: string;
  /** Secret : masqué par défaut, révélable à la demande. */
  masquable?: boolean;
}>();

const notifications = useNotifications();
const visible = ref(!props.masquable);
const copie = ref(false);

const affichage = computed(() =>
  visible.value ? props.valeur : '•'.repeat(Math.min(props.valeur.length, 32)),
);

async function copier() {
  try {
    await navigator.clipboard.writeText(props.valeur);
    copie.value = true;
    notifications.success(`${props.label} copié`);
    setTimeout(() => {
      copie.value = false;
    }, 2000);
  } catch {
    notifications.error('Copie impossible', 'Sélectionnez le texte à la main.');
  }
}
</script>
