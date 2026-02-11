<template>
  <div class="flex flex-col items-center py-8 text-center">
    <div
      class="mb-4 h-8 w-8 animate-spin rounded-full border-2 border-amber-500 border-t-transparent"
    />
    <p class="text-sm text-stone-500">Verification en cours...</p>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'auth' });

const user = useSupabaseUser();
const authStore = useAuthStore();
const router = useRouter();

watch(
  user,
  async (u) => {
    if (u) {
      await authStore.fetchProfil();
      if (authStore.isOnboarded) {
        await router.push('/dashboard');
      } else {
        await router.push('/onboarding');
      }
    }
  },
  { immediate: true },
);
</script>
