<template>
  <article
    class="rounded-[12px] border px-4 py-3 transition-colors duration-200"
    :class="
      message.masque
        ? 'border-dashed border-[var(--border-default)] bg-[var(--surface-subtle)]'
        : 'border-[var(--border-default)] bg-white'
    "
  >
    <div class="flex items-start justify-between gap-3">
      <p class="text-xs text-[var(--text-tertiary)]">
        {{ message.auteur }} · {{ dateLisible(message.createdAt) }}
      </p>

      <div v-if="peutAgir && !message.masque" class="flex shrink-0 gap-1">
        <UButton
          size="xs"
          variant="ghost"
          color="neutral"
          icon="i-lucide-flag"
          aria-label="Signaler ce message"
          @click="emit('signaler')"
        />
        <UButton
          size="xs"
          variant="ghost"
          color="neutral"
          icon="i-lucide-trash-2"
          aria-label="Supprimer mon message"
          @click="emit('supprimer')"
        />
      </div>
    </div>

    <!--
      ⚠️ `whitespace-pre-wrap` ET RIEN D'AUTRE. On n'interprète NI markdown NI
      HTML : un forum public où le texte d'un inconnu devient du balisage est
      une porte ouverte, et `v-html` sur du contenu d'utilisateur est
      exactement la faille qu'on n'ouvre pas pour du gras. Les retours à la
      ligne suffisent à rendre un message lisible.
    -->
    <p
      class="mt-2 whitespace-pre-wrap text-[15px] leading-relaxed"
      :class="message.masque ? 'italic text-[var(--text-tertiary)]' : 'text-[var(--text-primary)]'"
    >
      {{ message.contenu }}
    </p>
  </article>
</template>

<script setup lang="ts">
import type { MessageForum } from '~/composables/useForum';

defineProps<{ message: MessageForum; peutAgir: boolean }>();
const emit = defineEmits<{ signaler: []; supprimer: [] }>();

function dateLisible(iso: string): string {
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
</script>
