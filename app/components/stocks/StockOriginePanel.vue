<template>
  <div class="space-y-4">
    <!-- Traçabilité amont -->
    <section
      v-if="aUneOrigine"
      class="rounded-[14px] border border-[var(--border-default)] bg-white p-4"
    >
      <h3 class="text-[13px] font-semibold text-[var(--text-primary)]">Origine de ce lot</h3>
      <p class="mt-0.5 text-[12px] text-[var(--text-tertiary)]">
        D’où vient ce miel, de la ruche au pot.
      </p>

      <dl class="mt-3 grid gap-x-4 gap-y-2 sm:grid-cols-2">
        <div v-if="origine.recolte">
          <dt class="text-[11px] uppercase tracking-wide text-[var(--text-tertiary)]">Récolte</dt>
          <dd class="text-[13px] font-medium text-[var(--text-primary)]">
            {{ dateCourte(origine.recolte.dateRecolte) }}
            <span v-if="origine.recolte.quantiteKg" class="text-[var(--text-secondary)]">
              · {{ Number(origine.recolte.quantiteKg) }} kg
            </span>
          </dd>
        </div>
        <div v-if="origine.rucher">
          <dt class="text-[11px] uppercase tracking-wide text-[var(--text-tertiary)]">Rucher</dt>
          <dd class="text-[13px] font-medium text-[var(--text-primary)]">
            {{ origine.rucher.nom }}
            <span v-if="origine.rucher.commune" class="text-[var(--text-secondary)]">
              · {{ origine.rucher.commune }}
            </span>
          </dd>
        </div>
        <div v-if="humiditeAffichee !== null">
          <dt class="text-[11px] uppercase tracking-wide text-[var(--text-tertiary)]">Humidité</dt>
          <dd
            class="text-[13px] font-medium"
            :class="
              humiditeAffichee > 18 ? 'text-[var(--status-bad)]' : 'text-[var(--text-primary)]'
            "
          >
            {{ humiditeAffichee.toFixed(1) }} %
            <span v-if="humiditeAffichee > 18" class="text-[11px] font-normal">
              · au-dessus de 18 %, risque de fermentation
            </span>
          </dd>
        </div>
        <div v-if="origine.balance">
          <dt class="text-[11px] uppercase tracking-wide text-[var(--text-tertiary)]">
            Balance témoin
          </dt>
          <dd class="text-[13px] font-medium text-[var(--text-primary)]">
            <NuxtLink
              :to="`/balances/${origine.balance.id}`"
              class="hover:text-[var(--honey-deep)] hover:underline"
            >
              {{ origine.balance.nom }} →
            </NuxtLink>
          </dd>
        </div>
      </dl>
    </section>

    <!-- Historique des mouvements -->
    <section class="rounded-[14px] border border-[var(--border-default)] bg-white p-4">
      <div class="flex items-baseline justify-between gap-2">
        <h3 class="text-[13px] font-semibold text-[var(--text-primary)]">Historique</h3>
        <span v-if="mouvements.length" class="text-[11px] text-[var(--text-tertiary)]">
          {{ mouvements.length }} mouvement{{ mouvements.length > 1 ? 's' : '' }}
        </span>
      </div>

      <div
        v-if="!mouvements.length"
        class="mt-3 rounded-[10px] border border-dashed border-[var(--border-default)] px-3 py-6 text-center"
      >
        <p class="text-[12.5px] text-[var(--text-secondary)]">Aucun mouvement enregistré.</p>
        <p class="mt-0.5 text-[11.5px] text-[var(--text-tertiary)]">
          L’historique démarre avec les entrées et sorties à venir.
        </p>
      </div>

      <ul v-else class="mt-3 space-y-1.5">
        <li
          v-for="m in mouvements"
          :key="m.id"
          class="flex items-center gap-2.5 rounded-[10px] bg-[var(--surface-muted)] px-2.5 py-2"
        >
          <span
            class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full"
            :style="`background:${couleurType(m.type)}1f;color:${couleurType(m.type)}`"
          >
            <UIcon :name="iconeType(m.type)" class="h-3.5 w-3.5" />
          </span>
          <div class="min-w-0 flex-1">
            <p class="truncate text-[12.5px] font-medium text-[var(--text-primary)]">
              {{ m.motif || libelleType(m.type) }}
            </p>
            <p class="text-[11px] text-[var(--text-tertiary)]">
              {{ dateCourte(m.dateMouvement ?? m.createdAt) }}
            </p>
          </div>
          <span
            class="shrink-0 text-[12.5px] font-semibold tabular-nums"
            :style="`color:${couleurType(m.type)}`"
          >
            {{ signeType(m.type) }}{{ Number(m.quantite) }}
            <span class="font-normal text-[var(--text-tertiary)]">{{ m.unite || '' }}</span>
          </span>
        </li>
      </ul>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

interface Mouvement {
  id: string;
  type: string;
  quantite: string | number;
  motif: string | null;
  unite?: string | null;
  dateMouvement?: string | null;
  createdAt: string;
}

interface Origine {
  recolte: {
    id: string;
    dateRecolte: string;
    typeMiel: string | null;
    quantiteKg: string | null;
    humidite: string | null;
  } | null;
  rucher: { id: string; nom: string; commune: string | null } | null;
  balance: { id: string; nom: string } | null;
}

const props = withDefaults(
  defineProps<{
    mouvements?: Mouvement[];
    origine?: Origine;
    /** Humidité portée par le lot lui-même, prioritaire sur celle de la récolte. */
    humidite?: string | number | null;
  }>(),
  {
    mouvements: () => [],
    origine: () => ({ recolte: null, rucher: null, balance: null }),
    humidite: null,
  },
);

const aUneOrigine = computed(
  () =>
    Boolean(props.origine.recolte || props.origine.rucher || props.origine.balance) ||
    humiditeAffichee.value !== null,
);

const humiditeAffichee = computed<number | null>(() => {
  const brut = props.humidite ?? props.origine.recolte?.humidite ?? null;
  if (brut === null || brut === '') return null;
  const n = Number(brut);
  return Number.isFinite(n) ? n : null;
});

// Palette 100 % chaude : honey pour ce qui entre, clay pour ce qui sort.
function couleurType(type: string): string {
  if (type === 'entree') return 'var(--honey-deep)';
  if (type === 'sortie') return 'var(--clay-deep)';
  return 'var(--text-tertiary)';
}

function iconeType(type: string): string {
  if (type === 'entree') return 'i-lucide-arrow-down';
  if (type === 'sortie') return 'i-lucide-arrow-up';
  return 'i-lucide-equal';
}

function libelleType(type: string): string {
  if (type === 'entree') return 'Entrée';
  if (type === 'sortie') return 'Sortie';
  return 'Ajustement';
}

function signeType(type: string): string {
  if (type === 'entree') return '+';
  if (type === 'sortie') return '−';
  return '=';
}

function dateCourte(iso: string | null | undefined): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}
</script>
