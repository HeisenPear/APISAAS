<script setup lang="ts">
import type { MouvementBancaire } from '~/composables/useBanque';

defineProps<{ mouvements: MouvementBancaire[] }>();
const emit = defineEmits<{
  action: [id: string, act: 'ignorer' | 'restaurer'];
  match: [mouvement: MouvementBancaire];
}>();

function eur(v: number): string {
  return `${v.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`;
}
function dateFr(iso: string): string {
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}
const statutBadge: Record<MouvementBancaire['statut'], { label: string; color: string }> = {
  a_rapprocher: { label: 'À rapprocher', color: 'var(--honey-deep)' },
  rapproche: { label: 'Pointé', color: 'var(--sage-deep)' },
  ignore: { label: 'Ignoré', color: 'var(--text-tertiary)' },
};
</script>

<template>
  <div
    v-if="!mouvements.length"
    class="rounded-[14px] border border-dashed border-[var(--border-default)] px-6 py-10 text-center text-sm text-[var(--text-tertiary)]"
  >
    Aucun mouvement. Importez un relevé pour commencer.
  </div>
  <div v-else class="overflow-hidden rounded-[14px] border border-[var(--border-default)] bg-white">
    <div
      v-for="m in mouvements"
      :key="m.id"
      class="flex items-center gap-4 border-b border-[var(--border-default)] px-4 py-3 last:border-0"
    >
      <span class="w-20 shrink-0 text-xs text-[var(--text-tertiary)]">{{
        dateFr(m.dateOperation)
      }}</span>
      <span class="min-w-0 flex-1 truncate text-sm text-[var(--text-primary)]">{{
        m.libelle || '—'
      }}</span>
      <span
        class="w-24 shrink-0 text-right text-sm font-medium tabular-nums"
        :style="{ color: Number(m.montant) >= 0 ? 'var(--sage-deep)' : 'var(--text-primary)' }"
      >
        {{ Number(m.montant) >= 0 ? '+' : '' }}{{ eur(Number(m.montant)) }}
      </span>
      <span
        class="w-24 shrink-0 text-right text-[11px] font-medium"
        :style="{ color: statutBadge[m.statut].color }"
      >
        {{ m.factureNumero ? `→ ${m.factureNumero}` : statutBadge[m.statut].label }}
      </span>
      <template v-if="m.statut === 'a_rapprocher'">
        <UButton
          v-if="Number(m.montant) > 0"
          size="xs"
          color="neutral"
          variant="ghost"
          title="Rapprocher à une facture"
          icon="i-lucide-link"
          @click="emit('match', m)"
        />
        <UButton
          size="xs"
          color="neutral"
          variant="ghost"
          title="Ignorer ce mouvement"
          icon="i-lucide-eye-off"
          @click="emit('action', m.id, 'ignorer')"
        />
      </template>
      <UButton
        v-else
        size="xs"
        color="neutral"
        variant="ghost"
        :title="m.statut === 'rapproche' ? 'Annuler le rapprochement' : 'Restaurer'"
        icon="i-lucide-undo-2"
        @click="emit('action', m.id, 'restaurer')"
      />
    </div>
  </div>
</template>
