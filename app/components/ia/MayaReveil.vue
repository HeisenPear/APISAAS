<!--
  MayaReveil — composant SANS rendu qui pilote le réveil vocal « Salut Maya »
  (cf. useReveilMaya). Monté une fois dans le layout par défaut, à l'intérieur du
  bloc ClientOnly. Il n'affiche rien : il écoute (quand l'option opt-in est
  active et l'app au premier plan) et ouvre la bulle Maya sur la phrase de réveil.
-->
<template>
  <span class="hidden" aria-hidden="true" />
</template>

<script setup lang="ts">
useReveilMaya();
</script>
