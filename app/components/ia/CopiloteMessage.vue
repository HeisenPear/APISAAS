<template>
  <div class="flex gap-2.5" :class="message.role === 'user' ? 'justify-end' : 'justify-start'">
    <!-- Avatar Maya toujours visible à gauche de chaque réponse (façon Claude). -->
    <IaMayaMark
      v-if="message.role === 'assistant'"
      :size="28"
      glow
      state="idle"
      class="mt-0.5 shrink-0"
    />
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

      <!-- Blocs riches (stats / tableau / graphe) -->
      <div v-if="message.blocs?.length" class="mt-3 space-y-2.5">
        <template v-for="(bloc, bi) in message.blocs" :key="bi">
          <!-- Stats -->
          <div v-if="bloc.type === 'stats'" class="flex flex-wrap gap-2">
            <div
              v-for="(it, k) in bloc.items"
              :key="k"
              class="min-w-[88px] flex-1 rounded-[10px] px-3 py-2"
              :style="tonStyle(it.ton)"
            >
              <p class="text-[10px] font-medium uppercase tracking-wide opacity-75">
                {{ it.label }}
              </p>
              <p class="mt-0.5 text-[15px] font-bold leading-tight">{{ it.valeur }}</p>
            </div>
          </div>

          <!-- Tableau -->
          <div
            v-else-if="bloc.type === 'tableau'"
            class="overflow-hidden rounded-[10px] border"
            style="border-color: var(--border-default)"
          >
            <p
              v-if="bloc.titre"
              class="px-3 py-1.5 text-[11px] font-semibold"
              style="background: var(--surface-muted); color: var(--text-secondary)"
            >
              {{ bloc.titre }}
            </p>
            <table class="w-full text-[12px]">
              <thead>
                <tr style="background: var(--surface-muted)">
                  <th
                    v-for="(c, ci) in bloc.colonnes"
                    :key="ci"
                    class="px-3 py-1.5 text-left font-semibold"
                    style="color: var(--text-tertiary)"
                  >
                    {{ c }}
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="(row, ri) in bloc.lignes"
                  :key="ri"
                  class="border-t"
                  style="border-color: var(--border-default)"
                >
                  <td
                    v-for="(cell, cellI) in row"
                    :key="cellI"
                    class="px-3 py-1.5"
                    style="color: var(--text-primary)"
                  >
                    {{ cell }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Graphe -->
          <IaMayaChart
            v-else-if="bloc.type === 'graphe'"
            :titre="bloc.titre"
            :forme="bloc.forme"
            :serie="bloc.serie"
          />

          <!-- Carte d'action -->
          <div
            v-else-if="bloc.type === 'carte'"
            class="rounded-[10px] border p-3"
            style="border-color: var(--border-default); background: var(--surface-muted)"
          >
            <p
              v-if="bloc.titre"
              class="text-[12.5px] font-semibold"
              style="color: var(--text-primary)"
            >
              {{ bloc.titre }}
            </p>
            <p v-if="bloc.texte" class="mt-0.5 text-[12px]" style="color: var(--text-secondary)">
              {{ bloc.texte }}
            </p>
            <div class="mt-2 flex flex-wrap gap-2">
              <NuxtLink
                v-for="(a, ai) in bloc.actions"
                :key="ai"
                :to="a.to"
                class="inline-flex items-center gap-1.5 rounded-[9px] bg-white px-3 py-1.5 text-[12px] font-semibold transition-all hover:-translate-y-0.5 hover:shadow-sm"
                style="border: 1px solid var(--border-default); color: var(--honey-deep)"
              >
                <UIcon v-if="a.icone" :name="a.icone" class="h-3.5 w-3.5" />
                {{ a.label }}
              </NuxtLink>
            </div>
          </div>

          <!-- Plan en lot : aperçu consolidé (titre + récap + liste des ruches) -->
          <div
            v-else-if="bloc.type === 'plan'"
            class="rounded-[10px] border p-3"
            style="border-color: var(--honey); background: var(--honey-soft)"
          >
            <p
              class="flex items-center gap-1.5 text-[12.5px] font-semibold"
              style="color: var(--honey-deep)"
            >
              <UIcon name="i-lucide-list-checks" class="h-4 w-4" />
              {{ bloc.titre }}
            </p>
            <ul class="mt-1.5 space-y-0.5">
              <li
                v-for="(l, ri2) in bloc.resume"
                :key="ri2"
                class="text-[12px]"
                style="color: var(--text-secondary)"
              >
                {{ l }}
              </li>
            </ul>
            <details v-if="bloc.etapes.length" class="mt-2">
              <summary
                class="cursor-pointer text-[11.5px] font-medium"
                style="color: var(--honey-deep)"
              >
                Voir les {{ bloc.etapes.length }} ruches
              </summary>
              <div class="mt-1.5 max-h-40 space-y-1 overflow-y-auto pr-1">
                <div
                  v-for="(e, ei) in bloc.etapes"
                  :key="ei"
                  class="flex items-center gap-1.5 text-[12px]"
                  style="color: var(--text-secondary)"
                >
                  <UIcon
                    name="i-lucide-check"
                    class="h-3 w-3 shrink-0"
                    style="color: var(--sage)"
                  />
                  {{ e.libelle }}
                </div>
              </div>
            </details>
          </div>
        </template>
      </div>

      <!-- Propositions cliquables DANS la bulle de Maya (réponses du flux guidé).
           Seulement sur le dernier message → l'historique reste épuré. -->
      <div
        v-if="message.role === 'assistant' && isLast && message.suggestions?.length"
        class="mt-3 flex flex-wrap gap-1.5"
      >
        <button
          v-for="s in message.suggestions"
          :key="s"
          type="button"
          class="rounded-full border px-3 py-1.5 text-[12px] font-semibold transition-all hover:-translate-y-0.5 hover:shadow-sm"
          style="
            border-color: color-mix(in srgb, var(--honey) 45%, transparent);
            background: var(--honey-soft);
            color: var(--honey-deep);
          "
          @click="emit('suggest', s)"
        >
          {{ s }}
        </button>
      </div>

      <!-- Action d'écriture à confirmer (jamais d'écriture sans accord) -->
      <div
        v-if="message.pending"
        class="mt-3 flex items-center gap-2 border-t pt-3"
        style="border-color: var(--border-default)"
      >
        <button
          type="button"
          class="inline-flex items-center gap-1.5 rounded-[11px] px-3.5 py-2 text-[12.5px] font-semibold text-white transition-all hover:-translate-y-0.5 hover:shadow-sm"
          style="background: #1c1c1e"
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

      <!-- PLAN en lot à confirmer (une seule confirmation pour tout le lot) -->
      <div
        v-if="message.pendingPlan"
        class="mt-3 flex items-center gap-2 border-t pt-3"
        style="border-color: var(--border-default)"
      >
        <button
          type="button"
          class="inline-flex items-center gap-1.5 rounded-[11px] px-3.5 py-2 text-[12.5px] font-semibold text-white transition-all hover:-translate-y-0.5 hover:shadow-sm"
          style="background: #1c1c1e"
          @click="emit('confirm-plan', message)"
        >
          <UIcon name="i-lucide-check-check" class="h-3.5 w-3.5" />
          Confirmer tout
        </button>
        <button
          type="button"
          class="inline-flex items-center gap-1.5 rounded-[10px] border px-3.5 py-2 text-[12.5px] font-medium transition-all hover:-translate-y-0.5"
          style="border-color: var(--border-default); color: var(--text-secondary)"
          @click="emit('cancel-plan', message)"
        >
          Annuler
        </button>
      </div>

      <!-- Lot exécuté : annulable EN CASCADE en un clic -->
      <div
        v-if="message.undoPlan"
        class="mt-3 flex flex-wrap items-center gap-2 border-t pt-3"
        style="border-color: var(--border-default)"
      >
        <button
          type="button"
          class="inline-flex items-center gap-1.5 rounded-[10px] border px-3.5 py-2 text-[12.5px] font-medium transition-all hover:-translate-y-0.5"
          style="border-color: var(--border-default); color: var(--text-secondary)"
          @click="emit('undo-plan', message)"
        >
          <UIcon name="i-lucide-undo-2" class="h-3.5 w-3.5" />
          Tout annuler
        </button>
      </div>

      <!-- Écriture faite en autonomie : annulable en un clic -->
      <div
        v-if="message.undo"
        class="mt-3 flex flex-wrap items-center gap-2 border-t pt-3"
        style="border-color: var(--border-default)"
      >
        <NuxtLink
          v-if="message.nav"
          :to="message.nav.to"
          class="inline-flex items-center gap-1.5 rounded-[10px] px-3.5 py-2 text-[12.5px] font-semibold transition-all hover:-translate-y-0.5 hover:shadow-sm"
          style="background: var(--honey-soft); color: var(--honey-deep)"
        >
          <UIcon name="i-lucide-arrow-up-right" class="h-3.5 w-3.5" />
          {{ message.nav.label }}
        </NuxtLink>
        <button
          type="button"
          class="inline-flex items-center gap-1.5 rounded-[10px] border px-3.5 py-2 text-[12.5px] font-medium transition-all hover:-translate-y-0.5"
          style="border-color: var(--border-default); color: var(--text-secondary)"
          @click="emit('undo', message)"
        >
          <UIcon name="i-lucide-undo-2" class="h-3.5 w-3.5" />
          Annuler
        </button>
      </div>

      <!-- Raccourci (deep-link) vers la bonne page du SaaS -->
      <NuxtLink
        v-else-if="message.nav"
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

const { message, isLast = false } = defineProps<{ message: CopiloteMessage; isLast?: boolean }>();
const emit = defineEmits<{
  confirm: [msg: CopiloteMessage];
  cancel: [msg: CopiloteMessage];
  undo: [msg: CopiloteMessage];
  'confirm-plan': [msg: CopiloteMessage];
  'cancel-plan': [msg: CopiloteMessage];
  'undo-plan': [msg: CopiloteMessage];
  suggest: [value: string];
}>();

/** Couleur de fond/texte d'un chip de stat selon son « ton ». */
function tonStyle(ton?: 'honey' | 'sage' | 'clay' | 'neutre'): string {
  switch (ton) {
    case 'honey':
      return 'background: var(--honey-soft); color: var(--honey-deep)';
    case 'sage':
      return 'background: var(--sage-soft); color: var(--sage-deep)';
    case 'clay':
      return 'background: var(--clay-soft); color: var(--clay-deep)';
    default:
      return 'background: var(--surface-muted); color: var(--text-secondary)';
  }
}

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
