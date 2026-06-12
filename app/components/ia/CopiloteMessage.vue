<template>
  <div class="flex" :class="message.role === 'user' ? 'justify-end' : 'justify-start'">
    <div
      class="max-w-[85%] rounded-[14px] px-4 py-3 text-[13.5px] leading-relaxed sm:max-w-[75%]"
      :class="
        message.role === 'user' ? 'rounded-br-[4px] text-white' : 'rounded-bl-[4px] border bg-white'
      "
      :style="
        message.role === 'user'
          ? 'background: var(--honey)'
          : 'border-color: var(--border-default); color: var(--text-primary)'
      "
    >
      <!-- Outils consultés pendant la génération -->
      <div v-if="message.tools?.length" class="mb-2 flex flex-wrap gap-1.5">
        <span
          v-for="t in message.tools"
          :key="t"
          class="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10.5px] font-medium"
          style="background: var(--honey-soft); color: var(--honey-deep)"
        >
          <UIcon name="i-lucide-search-check" class="h-3 w-3" />
          {{ t.replace('…', '') }}
        </span>
      </div>

      <!-- eslint-disable-next-line vue/no-v-html — contenu échappé par renderMd (XSS-safe) -->
      <div v-if="message.role === 'assistant'" class="copilote-md" v-html="rendered" />
      <p v-else class="whitespace-pre-wrap">{{ message.content }}</p>

      <!-- Action d'écriture à confirmer (jamais d'écriture sans accord) -->
      <div
        v-if="message.pending"
        class="mt-3 flex items-center gap-2 border-t pt-3"
        style="border-color: var(--border-default)"
      >
        <button
          type="button"
          class="inline-flex items-center gap-1.5 rounded-[10px] px-3.5 py-2 text-[12.5px] font-semibold text-white transition-all hover:-translate-y-0.5 hover:shadow-sm"
          style="background: var(--sage-deep)"
          @click="emit('confirm', message)"
        >
          <UIcon name="i-lucide-check" class="h-3.5 w-3.5" />
          Confirmer
        </button>
        <button
          type="button"
          class="inline-flex items-center gap-1.5 rounded-[10px] border px-3.5 py-2 text-[12.5px] font-medium transition-all hover:-translate-y-0.5"
          style="border-color: var(--border-default); color: var(--text-secondary)"
          @click="emit('cancel', message)"
        >
          Annuler
        </button>
      </div>

      <!-- Raccourci (deep-link) vers la bonne page du SaaS -->
      <NuxtLink
        v-if="message.nav"
        :to="message.nav.to"
        class="mt-3 inline-flex items-center gap-1.5 rounded-[10px] px-3.5 py-2 text-[12.5px] font-semibold transition-all hover:-translate-y-0.5 hover:shadow-sm"
        style="background: var(--honey-soft); color: var(--honey-deep)"
      >
        <UIcon name="i-lucide-arrow-up-right" class="h-3.5 w-3.5" />
        {{ message.nav.label }}
      </NuxtLink>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { CopiloteMessage } from '~/composables/useCopilote';

const { message } = defineProps<{ message: CopiloteMessage }>();
const emit = defineEmits<{ confirm: [msg: CopiloteMessage]; cancel: [msg: CopiloteMessage] }>();

/**
 * Mini-rendu markdown volontairement restreint (gras, italique, code, listes).
 * Tout le HTML source est échappé AVANT transformation — aucune injection
 * possible via la réponse du modèle.
 */
const rendered = computed(() => renderMd(message.content));

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function inline(s: string): string {
  return s
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/(^|[^*])\*([^*\n]+)\*/g, '$1<em>$2</em>')
    .replace(/`([^`]+)`/g, '<code>$1</code>');
}

function renderMd(src: string): string {
  const lines = escapeHtml(src).split('\n');
  const out: string[] = [];
  let inList = false;
  for (const raw of lines) {
    const line = raw.trimEnd();
    const li = /^[-•] (.*)/.exec(line.trim());
    const heading = /^#{1,3} (.*)/.exec(line);
    if (li) {
      if (!inList) {
        out.push('<ul>');
        inList = true;
      }
      out.push(`<li>${inline(li[1] ?? '')}</li>`);
      continue;
    }
    if (inList) {
      out.push('</ul>');
      inList = false;
    }
    if (heading) out.push(`<p class="md-h">${inline(heading[1] ?? '')}</p>`);
    else if (line.trim() === '') out.push('<br>');
    else out.push(`<p>${inline(line)}</p>`);
  }
  if (inList) out.push('</ul>');
  return out.join('');
}
</script>

<style scoped>
.copilote-md :deep(p) {
  margin: 0 0 2px;
}
.copilote-md :deep(.md-h) {
  font-weight: 700;
  margin-top: 6px;
}
.copilote-md :deep(ul) {
  margin: 4px 0;
  padding-left: 18px;
  list-style: disc;
}
.copilote-md :deep(li) {
  margin: 2px 0;
}
.copilote-md :deep(code) {
  background: var(--surface-muted);
  border-radius: 4px;
  padding: 1px 4px;
  font-size: 12px;
}
.copilote-md :deep(strong) {
  font-weight: 650;
}
</style>
