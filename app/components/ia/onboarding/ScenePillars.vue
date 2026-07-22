<template>
  <div class="cine-pillars">
    <div
      v-for="(p, i) in PILIERS"
      :key="p.titre"
      class="cine-pillar"
      :style="cascade(i, 0.25, 0.5)"
    >
      <UIcon :name="p.icone" class="cine-pillar-ico" />
      <p class="cine-pillar-t">{{ p.titre }}</p>
      <p class="cine-pillar-d">{{ p.detail }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
/** Scène « watch » — ce que Maya surveille pendant que l'apiculteur vit sa vie. */
const PILIERS = [
  {
    icone: 'i-lucide-heart-pulse',
    titre: 'La santé',
    detail: 'Une colonie qui faiblit, je te le dis avant que ça tourne mal.',
  },
  {
    icone: 'i-lucide-cloud-sun',
    titre: 'La météo',
    detail: 'La fenêtre pour ouvrir, et celle où il vaut mieux s’abstenir.',
  },
  {
    icone: 'i-lucide-scale',
    titre: 'Le poids',
    detail: 'Une miellée qui démarre, un essaim qui part — la balance parle.',
  },
];
</script>
