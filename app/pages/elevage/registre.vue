<script setup lang="ts">
definePageMeta({ layout: 'default' });

// Redirect to the correct registre page
await navigateTo('/exports/registre', { replace: true });
</script>

<template>
  <div>Redirection en cours...</div>
</template>