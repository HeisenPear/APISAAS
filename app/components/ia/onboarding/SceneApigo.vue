<template>
  <div class="cine-apigo">
    <div class="cine-chips">
      <span v-for="(m, i) in MODULES" :key="m" class="cine-chipm" :style="cascade(i, 0.2, 0.11)">{{
        m
      }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
/** Scène « apigo » — ce que le produit réunit, en un coup d'œil. */
const MODULES = ['Cheptel', 'Visites', 'Récolte', 'Stocks', 'Finances', 'Météo'];
</script>
