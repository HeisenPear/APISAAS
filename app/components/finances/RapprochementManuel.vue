<script setup lang="ts">
import type { FactureOuverte, MouvementBancaire } from '~/composables/useBanque';

const props = defineProps<{ mouvement: MouvementBancaire; factures: FactureOuverte[] }>();
const emit = defineEmits<{ close: []; confirm: [transactionId: string] }>();

const recherche = ref('');
const facturesFiltrees = computed(() => {
  const q = recherche.value.trim().toLowerCase();
  if (!q) return props.factures;
  return props.factures.filter(
    (f) => (f.numero ?? '').toLowerCase().includes(q) || (f.tiers ?? '').toLowerCase().includes(q),
  );
});

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
</script>

<template>
  <Teleport to="body">
    <div
      class="fixed inset-0 z-[2000] flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4"
      @click.self="emit('close')"
    >
      <div class="flex max-h-[85vh] w-full max-w-md flex-col rounded-t-2xl bg-white sm:rounded-2xl">
        <div class="border-b border-[var(--border-default)] p-4">
          <div class="flex items-center justify-between">
            <h3 class="text-sm font-semibold text-[var(--text-primary)]">
              Rapprocher à une facture
            </h3>
            <UButton
              size="xs"
              color="neutral"
              variant="ghost"
              icon="i-lucide-x"
              @click="emit('close')"
            />
          </div>
          <p class="mt-1 text-xs text-[var(--text-tertiary)]">
            {{ dateFr(mouvement.dateOperation) }} ·
            <span class="font-medium text-[var(--sage-deep)]">{{
              eur(Number(mouvement.montant))
            }}</span>
            · « {{ mouvement.libelle || '—' }} »
          </p>
        </div>

        <div class="p-4 pb-2">
          <UInput
            v-model="recherche"
            placeholder="Rechercher (n° ou client)…"
            icon="i-lucide-search"
          />
        </div>

        <div class="min-h-0 flex-1 overflow-y-auto px-4 pb-4">
          <button
            v-for="f in facturesFiltrees"
            :key="f.id"
            type="button"
            class="flex w-full items-center justify-between gap-3 rounded-[10px] px-3 py-2.5 text-left hover:bg-[var(--surface-muted)]"
            @click="emit('confirm', f.id)"
          >
            <span class="min-w-0">
              <span class="block truncate text-sm text-[var(--text-primary)]">
                {{ f.numero ?? '—' }} · {{ f.tiers || 'Client non précisé' }}
              </span>
              <span class="text-xs text-[var(--text-tertiary)]">{{ dateFr(f.date) }}</span>
            </span>
            <span class="shrink-0 text-sm font-medium text-[var(--text-primary)]">{{
              eur(f.total)
            }}</span>
          </button>
          <p
            v-if="!facturesFiltrees.length"
            class="px-3 py-6 text-center text-xs text-[var(--text-tertiary)]"
          >
            Aucune facture en attente de règlement.
          </p>
        </div>
      </div>
    </div>
  </Teleport>
</template>
