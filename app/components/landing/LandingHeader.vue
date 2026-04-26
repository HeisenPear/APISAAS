<template>
  <header
    class="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
    :class="
      scrolled
        ? 'bg-white/95 backdrop-blur-sm shadow-sm border-b border-stone-200/60'
        : 'bg-transparent'
    "
  >
    <div class="mx-auto max-w-6xl px-4 sm:px-6">
      <div class="flex h-16 items-center justify-between">
        <!-- Logo -->
        <NuxtLink to="/" class="flex items-center gap-2.5">
          <img
            src="/logo_apigo.webp"
            alt="APIGO"
            class="h-8 w-8 rounded-xl shadow-sm object-cover"
          />
          <span class="text-base font-bold tracking-tight text-stone-900">APIGO</span>
        </NuxtLink>

        <!-- Nav desktop -->
        <nav class="hidden items-center gap-6 md:flex">
          <a
            href="#fonctionnalites"
            class="text-sm font-medium text-stone-600 transition-colors hover:text-stone-900"
          >
            Fonctionnalités
          </a>
          <a
            href="#tarifs"
            class="text-sm font-medium text-stone-600 transition-colors hover:text-stone-900"
          >
            Tarifs
          </a>
          <a
            href="#conformite"
            class="text-sm font-medium text-stone-600 transition-colors hover:text-stone-900"
          >
            Conformité
          </a>
        </nav>

        <!-- CTA -->
        <div class="flex items-center gap-3">
          <NuxtLink
            to="/login"
            class="hidden text-sm font-medium text-stone-600 transition-colors hover:text-stone-900 md:block"
          >
            Connexion
          </NuxtLink>
          <NuxtLink
            to="/register"
            class="inline-flex items-center gap-1.5 rounded-xl bg-amber-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:bg-amber-600 hover:shadow-md"
          >
            <UIcon name="i-lucide-zap" class="h-4 w-4" />
            Essai gratuit
          </NuxtLink>
        </div>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
const scrolled = ref(false);

onMounted(() => {
  const handler = () => {
    scrolled.value = window.scrollY > 20;
  };
  window.addEventListener('scroll', handler, { passive: true });
  onUnmounted(() => window.removeEventListener('scroll', handler));
});
</script>
