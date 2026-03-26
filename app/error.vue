<script setup lang="ts">
const props = defineProps<{ error: { statusCode: number; message: string } }>();
const is404 = computed(() => props.error.statusCode === 404);
</script>

<template>
  <div class="flex min-h-screen items-center justify-center bg-[#FAFAF8] px-4">
    <div class="max-w-md text-center">
      <!-- Icône -->
      <div class="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-amber-50">
        <UIcon
          :name="is404 ? 'i-lucide-map-pin-off' : 'i-lucide-alert-triangle'"
          class="h-8 w-8 text-amber-500"
        />
      </div>

      <!-- Code -->
      <p class="mb-2 text-6xl font-bold text-stone-200">{{ error.statusCode }}</p>

      <!-- Message -->
      <h1 class="mb-3 text-2xl font-bold text-stone-800">
        {{ is404 ? 'Page introuvable' : 'Une erreur est survenue' }}
      </h1>
      <p class="mb-8 text-stone-500">
        {{
          is404
            ? "Cette page n'existe pas ou a été déplacée."
            : "Quelque chose s'est mal passé. Réessayez dans quelques instants."
        }}
      </p>

      <!-- Actions -->
      <div class="flex justify-center gap-3">
        <UButton color="primary" to="/dashboard" icon="i-lucide-home">
          Retour au dashboard
        </UButton>
        <UButton
          v-if="!is404"
          variant="outline"
          color="neutral"
          @click="clearError({ redirect: '/' })"
        >
          Réessayer
        </UButton>
      </div>
    </div>
  </div>
</template>
