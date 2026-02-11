<template>
  <div />
</template>

<script setup lang="ts">
definePageMeta({ layout: false });

const user = useSupabaseUser();
const authStore = useAuthStore();

onMounted(async () => {
  if (!user.value) {
    await navigateTo('/login');
    return;
  }

  if (!authStore.profil) {
    try {
      await authStore.fetchProfil();
    } catch {
      await navigateTo('/login');
      return;
    }
  }

  if (authStore.isOnboarded) {
    await navigateTo('/dashboard');
  } else {
    await navigateTo('/onboarding');
  }
});
</script>
