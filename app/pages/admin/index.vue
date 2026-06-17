<script setup lang="ts">
// /admin n'a pas de page propre → on renvoie vers la liste des utilisateurs
// (qui applique elle-même la garde admin). Évite un 404 si on tape /admin.
definePageMeta({ middleware: () => navigateTo('/admin/users') });
</script>

<template>
  <div />
</template>
