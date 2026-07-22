<template>
  <div class="cine-presence">
    <button
      v-for="p in PROFILS"
      :key="p.value"
      class="cine-pres"
      :class="{ 'is-sel': modele === p.value }"
      type="button"
      @click.stop="modele = p.value"
    >
      <UIcon :name="p.icone" class="cine-pres-ico" />
      <p class="cine-pres-t">{{ p.titre }}</p>
      <p class="cine-pres-d">{{ p.detail }}</p>
    </button>
  </div>
</template>

<script setup lang="ts">
/**
 * Scène « profil » — ABSENTE de la maquette, ajoutée parce qu'elle porte deux
 * effets réels : les modules pré-cochés et la redirection finale (un profil
 * loisir arrive sur sa première visite, pas sur un tableau de bord).
 * Sans elle, on perdait toute la personnalisation.
 */
const modele = defineModel<'loisir' | 'professionnel' | 'pluri_actif'>({ required: true });

const PROFILS = [
  {
    value: 'loisir' as const,
    icone: 'i-lucide-flower',
    titre: 'Loisir',
    detail: 'Quelques ruches, pour le plaisir et le miel de la famille.',
  },
  {
    value: 'pluri_actif' as const,
    icone: 'i-lucide-sun',
    titre: 'Pluri-actif',
    detail: 'L’apiculture en complément, avec un vrai suivi.',
  },
  {
    value: 'professionnel' as const,
    icone: 'i-lucide-briefcase',
    titre: 'Professionnel',
    detail: 'C’est ton métier : cheptel, ventes, obligations.',
  },
];
</script>
