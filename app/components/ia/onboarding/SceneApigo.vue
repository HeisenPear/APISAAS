<template>
  <div class="cine-apigo">
    <div class="cine-chips">
      <span v-for="m in MODULES" :key="m" class="cine-chipm">{{ m }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
/** Scène « apigo » — ce que le produit réunit, en un coup d'œil. */
const MODULES = ['Cheptel', 'Visites', 'Récolte', 'Stocks', 'Finances', 'Météo'];
</script>
