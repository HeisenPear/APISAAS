<template>
  <div class="cine-hello">
    <div class="cine-hello-chips">
      <span v-for="(m, i) in MOTS" :key="m" class="cine-hchip" :style="cascade(i, 0.35, 0.14)">{{
        m
      }}</span>
    </div>
    <p class="cine-hello-stat">Je ne devine pas. Je calcule, et je te dis d’où ça vient.</p>
  </div>
</template>

<script setup lang="ts">
/**
 * Scène « hello » — Maya se présente.
 *
 * Le déterminisme est annoncé dès la première phrase : c'est un argument de
 * CONFIANCE, pas un aveu de limite. Elle ne promet donc jamais de « comprendre
 * tout » — elle promet de savoir expliquer.
 */
const MOTS = ['Je veille', 'Tu décides', 'Toujours à jour'];
</script>
