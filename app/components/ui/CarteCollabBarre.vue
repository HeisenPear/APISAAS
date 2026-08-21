<template>
  <div class="space-y-2.5">
    <!-- Ligne 1 — bascule Carte / Liste.
         Mobile uniquement : en desktop les cartes collaboratives affichent
         déjà carte ET liste côte à côte, la bascule n'aurait aucun sens. -->
    <div class="grid grid-cols-2 gap-2 lg:hidden">
      <button
        v-for="v in VUES"
        :key="v.key"
        type="button"
        class="flex items-center justify-center gap-1.5 rounded-[11px] px-3 py-2.5 text-[13px] font-semibold transition-all duration-200 active:scale-[0.98]"
        :class="
          vue === v.key
            ? 'text-white shadow-sm'
            : 'border border-[var(--border-default)] bg-white text-[var(--text-secondary)] hover:border-[var(--honey)]'
        "
        :style="vue === v.key ? 'background: var(--text-primary)' : ''"
        :aria-pressed="vue === v.key"
        @click="$emit('update:vue', v.key)"
      >
        <UIcon :name="v.icon" class="h-4 w-4" />
        {{ v.label }}
      </button>
    </div>

    <!-- Ligne 2 — autour de quoi ? -->
    <div class="grid grid-cols-2 gap-2">
      <button
        type="button"
        class="flex items-center justify-center gap-1.5 rounded-[11px] px-3 py-2.5 text-[13px] font-semibold transition-all duration-200 active:scale-[0.98] disabled:opacity-60"
        :class="
          estMaPosition
            ? 'text-[var(--text-primary)] shadow-sm'
            : 'border border-[var(--border-default)] bg-white text-[var(--text-secondary)] hover:border-[var(--honey)]'
        "
        :style="estMaPosition ? 'background: var(--honey)' : ''"
        :disabled="etatLocalisation === 'chargement'"
        @click="$emit('localiser')"
      >
        <UIcon
          :name="
            etatLocalisation === 'chargement' ? 'i-lucide-loader-circle' : 'i-lucide-locate-fixed'
          "
          class="h-4 w-4"
          :class="etatLocalisation === 'chargement' ? 'animate-spin' : ''"
        />
        Ma position
      </button>

      <button
        type="button"
        class="flex items-center justify-center gap-1.5 rounded-[11px] px-3 py-2.5 text-[13px] font-semibold transition-all duration-200 active:scale-[0.98]"
        :class="
          rechercheOuverte || (centreLabel && !estMaPosition)
            ? 'text-[var(--text-primary)] shadow-sm'
            : 'border border-[var(--border-default)] bg-white text-[var(--text-secondary)] hover:border-[var(--honey)]'
        "
        :style="
          rechercheOuverte || (centreLabel && !estMaPosition) ? 'background: var(--honey)' : ''
        "
        @click="basculerRecherche"
      >
        <UIcon name="i-lucide-search" class="h-4 w-4" />
        {{ centreLabel && !estMaPosition ? tronquer(centreLabel) : 'Autre ville' }}
      </button>
    </div>

    <!-- Recherche de commune (dépliée à la demande) -->
    <div v-if="rechercheOuverte" class="relative">
      <UInput
        ref="champRecherche"
        v-model="requete"
        placeholder="Nom de commune ou code postal…"
        icon="i-lucide-map-pin"
        size="lg"
        autofocus
        :loading="rechercheEnCours"
        @keydown.escape="fermerRecherche"
      />
      <ul
        v-if="suggestions.length"
        class="absolute z-[1100] mt-1 w-full overflow-hidden rounded-[12px] border border-[var(--border-default)] bg-white shadow-lg"
      >
        <li v-for="c in suggestions" :key="c.id">
          <button
            type="button"
            class="flex w-full items-center gap-2 px-3 py-2.5 text-left text-[13px] transition-colors hover:bg-[var(--honey-soft)]"
            @click="choisir(c)"
          >
            <UIcon name="i-lucide-map-pin" class="h-3.5 w-3.5 text-[var(--text-tertiary)]" />
            <span class="font-medium text-[var(--text-primary)]">{{ c.nom }}</span>
            <span v-if="c.codePostal" class="text-[var(--text-tertiary)]">{{ c.codePostal }}</span>
          </button>
        </li>
      </ul>
      <p
        v-else-if="requete.trim().length >= 2 && !rechercheEnCours"
        class="mt-1.5 text-[12px] text-[var(--text-tertiary)]"
      >
        Aucune commune trouvée.
      </p>
    </div>

    <!-- Ligne 3 — rayon -->
    <div class="flex items-center gap-2">
      <span
        class="shrink-0 text-[11.5px] font-semibold uppercase tracking-[0.08em] text-[var(--text-tertiary)]"
      >
        Rayon
      </span>
      <div class="flex flex-1 gap-1.5 overflow-x-auto pb-0.5 [scrollbar-width:none]">
        <button
          v-for="r in RAYONS_KM"
          :key="r ?? 'tous'"
          type="button"
          class="shrink-0 rounded-full px-3 py-1.5 text-[12.5px] font-semibold transition-all duration-200 active:scale-95"
          :class="
            rayonKm === r
              ? 'text-[var(--text-primary)] shadow-sm'
              : 'border border-[var(--border-default)] bg-white text-[var(--text-secondary)] hover:border-[var(--honey)]'
          "
          :style="rayonKm === r ? 'background: var(--honey)' : ''"
          @click="$emit('update:rayonKm', r)"
        >
          {{ r === null ? 'Tous' : `${r} km` }}
        </button>
      </div>
    </div>

    <!-- Ligne 4 — récapitulatif chiffré (« 2026 · 17 observations · 11 communes ») -->
    <p v-if="resume" class="text-[12px] text-[var(--text-tertiary)]">
      {{ resume }}
    </p>
    <p
      v-if="etatLocalisation === 'refuse'"
      class="flex items-center gap-1.5 text-[12px] text-[var(--status-warn)]"
    >
      <UIcon name="i-lucide-triangle-alert" class="h-3.5 w-3.5 shrink-0" />
      Localisation refusée — cherchez une commune à la place.
    </p>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import {
  RAYONS_KM,
  type VueCarte,
  type EtatLocalisation,
  type CommuneSuggestion,
} from '~/composables/useCarteCollab';

/**
 * Barre de contrôle commune aux cartes collaboratives : Carte/Liste, centrage
 * (ma position ou une commune), rayon, et une ligne de récap chiffrée.
 * Purement présentationnelle — toute la logique vit dans useCarteCollab().
 */
const props = defineProps<{
  vue: VueCarte;
  rayonKm: number | null;
  centreLabel: string | null;
  etatLocalisation: EtatLocalisation;
  /** Ligne de récap fournie par la page (elle seule sait compter ses points). */
  resume?: string | null;
  /** Injecté par la page depuis le composable (recherche BAN). */
  chercherCommunes: (q: string) => Promise<CommuneSuggestion[]>;
}>();

const emit = defineEmits<{
  'update:vue': [VueCarte];
  'update:rayonKm': [number | null];
  localiser: [];
  commune: [CommuneSuggestion];
}>();

const VUES = [
  { key: 'carte' as const, label: 'Carte', icon: 'i-lucide-map' },
  { key: 'liste' as const, label: 'Liste', icon: 'i-lucide-list' },
];

const estMaPosition = computed(() => props.centreLabel === 'Ma position');

const rechercheOuverte = ref(false);
const requete = ref('');
const suggestions = ref<CommuneSuggestion[]>([]);
const rechercheEnCours = ref(false);

function basculerRecherche() {
  rechercheOuverte.value = !rechercheOuverte.value;
  if (!rechercheOuverte.value) fermerRecherche();
}

function fermerRecherche() {
  rechercheOuverte.value = false;
  requete.value = '';
  suggestions.value = [];
}

function choisir(c: CommuneSuggestion) {
  emit('commune', c);
  fermerRecherche();
}

function tronquer(s: string): string {
  return s.length > 16 ? `${s.slice(0, 15)}…` : s;
}

// Recherche débouncée : la BAN est gratuite, on évite quand même de la marteler.
let minuteur: ReturnType<typeof setTimeout> | null = null;
watch(requete, (q) => {
  if (minuteur) clearTimeout(minuteur);
  if (q.trim().length < 2) {
    suggestions.value = [];
    rechercheEnCours.value = false;
    return;
  }
  rechercheEnCours.value = true;
  minuteur = setTimeout(async () => {
    suggestions.value = await props.chercherCommunes(q);
    rechercheEnCours.value = false;
  }, 300);
});
</script>
