<template>
  <NuxtLink
    :to="`/interventions/${intervention.id}`"
    class="group block rounded-2xl border border-stone-200/60 bg-white p-5 shadow-sm transition-all duration-200 hover:border-stone-300 hover:shadow-md"
  >
    <!-- Header -->
    <div class="mb-3 flex items-start justify-between">
      <div class="flex items-center gap-3">
        <div class="flex h-10 w-10 items-center justify-center rounded-xl" :class="meta.bgColor">
          <UIcon :name="meta.icon" class="h-5 w-5" :class="meta.textColor" />
        </div>
        <div>
          <p class="text-sm font-semibold text-stone-900">{{ meta.label }}</p>
          <p class="text-xs text-stone-400">{{ formattedDate }}</p>
        </div>
      </div>
    </div>

    <!-- Context -->
    <div class="mb-3 flex flex-wrap items-center gap-2 text-xs text-stone-500">
      <span v-if="intervention.rucheNumero" class="flex items-center gap-1">
        <UIcon name="i-lucide-box" class="h-3 w-3" />
        {{ intervention.rucheNumero }}
      </span>
      <span v-if="intervention.rucherNom" class="flex items-center gap-1">
        <UIcon name="i-lucide-map-pin" class="h-3 w-3" />
        {{ intervention.rucherNom }}
      </span>
      <span v-if="intervention.dureeMinutes" class="flex items-center gap-1">
        <UIcon name="i-lucide-timer" class="h-3 w-3" />
        {{ intervention.dureeMinutes }} min
      </span>
    </div>

    <!-- Summary -->
    <p v-if="summary" class="line-clamp-2 text-xs text-stone-500">
      {{ summary }}
    </p>
  </NuxtLink>
</template>

<script setup lang="ts">
import {
  INTERVENTION_META,
  type InterventionWithContext,
  type TypeIntervention,
  type DonneesControle,
  type DonneesVarroa,
  type DonneesPesee,
  type DonneesNourrissement,
  type DonneesRecolte,
  type DonneesMateriel,
} from '~/types/interventions';

const props = defineProps<{
  intervention: InterventionWithContext;
}>();

// Fallback meta for legacy inspection types
const LEGACY_META: Record<
  string,
  { label: string; icon: string; bgColor: string; textColor: string }
> = {
  visite_printemps: {
    label: 'Visite de printemps',
    icon: 'i-lucide-sun',
    bgColor: 'bg-yellow-50',
    textColor: 'text-yellow-600',
  },
  traitement: {
    label: 'Traitement',
    icon: 'i-lucide-shield',
    bgColor: 'bg-purple-50',
    textColor: 'text-purple-600',
  },
  hivernage: {
    label: 'Mise en hivernage',
    icon: 'i-lucide-snowflake',
    bgColor: 'bg-sky-50',
    textColor: 'text-sky-600',
  },
};

const meta = computed(() => {
  const type = props.intervention.type as TypeIntervention;
  if (INTERVENTION_META[type]) return INTERVENTION_META[type];
  const legacy = LEGACY_META[props.intervention.type ?? ''];
  if (legacy) return { ...INTERVENTION_META.commentaire, ...legacy };
  return INTERVENTION_META.commentaire;
});

const formattedDate = computed(() => {
  return new Date(props.intervention.dateVisite).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
});

const summary = computed(() => {
  const d = props.intervention.donnees;
  if (!d) {
    // Legacy inspection: build summary from dedicated columns
    const i = props.intervention;
    const parts: string[] = [];
    if (i.forceColonie) parts.push(`Force ${i.forceColonie}/4`);
    if (i.comportement) parts.push(String(i.comportement));
    if (i.reineVue) parts.push('Reine vue');
    if (i.reserves) parts.push(`Reserves: ${i.reserves}`);
    if (parts.length > 0) return parts.join(' - ');
    return props.intervention.commentaire;
  }
  const type = props.intervention.type as TypeIntervention;

  switch (type) {
    case 'controle': {
      const c = d as DonneesControle;
      return `Force ${c.force_colonie}/4 - ${c.comportement}`;
    }
    case 'varroa': {
      const v = d as DonneesVarroa;
      if (v.sous_action === 'comptage_plancher' && v.chute_par_jour != null)
        return `${v.chute_par_jour} varroas/jour`;
      if (v.sous_action === 'traitement') return `Traitement: ${v.type_traitement}`;
      return v.sous_action;
    }
    case 'pesee': {
      const p = d as DonneesPesee;
      const delta =
        p.variation_kg != null ? ` (${p.variation_kg > 0 ? '+' : ''}${p.variation_kg} kg)` : '';
      return `${p.poids_kg} kg${delta}`;
    }
    case 'nourrissement': {
      const n = d as DonneesNourrissement;
      return `${n.type_nourriture} - ${n.quantite} ${n.unite}`;
    }
    case 'recolte': {
      const r = d as DonneesRecolte;
      return `${r.quantite} ${r.unite} ${r.type_miel ?? r.type_produit}`;
    }
    case 'materiel': {
      const m = d as DonneesMateriel;
      return `${m.action} - ${m.elements.map((e) => `${e.quantite}x ${e.type}`).join(', ')}`;
    }
    default:
      return props.intervention.commentaire;
  }
});
</script>
