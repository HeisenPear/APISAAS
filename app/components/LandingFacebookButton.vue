<template>
  <a
    :href="facebookLink"
    target="_blank"
    rel="noopener noreferrer"
    aria-label="Conseil & aide — page Facebook APIGO"
    class="fixed bottom-6 right-6 z-40 inline-flex items-center gap-2 rounded-full bg-[#1877F2] px-4 py-3 text-white shadow-lg transition-all duration-200 hover:shadow-xl hover:-translate-y-0.5 md:px-6 md:py-4"
  >
    <!-- Icône Facebook -->
    <UIcon name="i-lucide-facebook" class="h-5 w-5 md:h-6 md:w-6" />
    <!-- Texte (masqué sur mobile) -->
    <span class="hidden text-sm font-semibold md:inline"> Conseil & aide </span>
  </a>
</template>

<script setup lang="ts">
const facebookLink = 'https://www.facebook.com/profile.php?id=61590641625616';
</script>
