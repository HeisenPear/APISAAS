<template>
  <div class="flex min-h-dvh flex-col items-center justify-center px-6" style="background:var(--surface-primary)">
    <div class="w-full max-w-sm text-center">
      <!-- Logo -->
      <div class="mb-8 flex justify-center">
        <div class="flex items-center gap-2.5">
          <img src="/logo_apigo.webp" alt="APIGO" class="h-10 w-10 rounded-xl object-cover shadow-sm">
          <span class="text-xl font-bold" style="color:var(--text-primary)">APIGO</span>
        </div>
      </div>

      <!-- Icon -->
      <div
        class="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-[24px]"
        style="background:var(--honey-soft)"
      >
        <UIcon name="i-lucide-wifi-off" class="h-9 w-9" style="color:var(--honey-deep)" />
      </div>

      <!-- Title + description -->
      <h1 class="mb-3 text-[22px] font-bold tracking-[-0.02em]" style="color:var(--text-primary)">
        Vous êtes hors-ligne
      </h1>
      <p class="mb-8 text-[15px] leading-relaxed" style="color:var(--text-secondary)">
        Pas de connexion internet. Vos ruchers et interventions restent accessibles depuis le cache.
      </p>

      <!-- Actions -->
      <div class="flex flex-col gap-3">
        <button
          class="flex w-full items-center justify-center gap-2 rounded-[12px] px-6 py-3 text-[14px] font-semibold text-white transition-all hover:-translate-y-0.5 active:scale-95"
          style="background:var(--honey)"
          @click="retry"
        >
          <UIcon name="i-lucide-refresh-cw" class="h-4 w-4" />
          Réessayer
        </button>

        <NuxtLink
          to="/dashboard"
          class="flex w-full items-center justify-center gap-2 rounded-[12px] border px-6 py-3 text-[14px] font-semibold transition-all hover:-translate-y-0.5 active:scale-95"
          style="border-color:var(--border-default);color:var(--text-primary)"
        >
          <UIcon name="i-lucide-layout-dashboard" class="h-4 w-4" />
          Accéder au tableau de bord
        </NuxtLink>
      </div>

      <!-- Status indicator -->
      <div class="mt-10 flex items-center justify-center gap-2">
        <span class="h-2 w-2 rounded-full" :class="isOnline ? 'bg-emerald-400' : 'bg-stone-300'" />
        <span class="text-[12px]" style="color:var(--text-tertiary)">
          {{ isOnline ? 'Connexion rétablie — rechargement…' : 'Hors connexion' }}
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: false });

useHead({ title: 'Hors-ligne — APIGO' });

const isOnline = useOnline();
const router = useRouter();

function retry() {
  if (isOnline.value) {
    router.replace('/dashboard');
  } else {
    window.location.reload();
  }
}

// Si déjà connecté au montage (PWA qui charge la page offline depuis le cache), redirect immédiat
onMounted(() => {
  if (isOnline.value) {
    router.replace('/dashboard');
  }
});

// Redirige vers le dashboard dès que la connexion revient
watch(isOnline, (online) => {
  if (online) {
    setTimeout(() => router.replace('/dashboard'), 600);
  }
});
</script>
