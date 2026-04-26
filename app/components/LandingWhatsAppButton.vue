<template>
  <a
    :href="whatsappLink"
    target="_blank"
    rel="noopener noreferrer"
    class="fixed bottom-6 right-6 z-40 inline-flex items-center gap-2 rounded-full bg-[#25D366] px-4 py-3 text-white shadow-lg transition-all duration-200 hover:shadow-xl hover:-translate-y-0.5 md:px-6 md:py-4"
  >
    <!-- Icône WhatsApp -->
    <UIcon name="i-lucide-message-circle" class="h-5 w-5 md:h-6 md:w-6" />
    <!-- Texte (masqué sur mobile) -->
    <span class="hidden text-sm font-semibold md:inline"> Conseil & aide </span>
  </a>
</template>

<script setup lang="ts">
const whatsappNumber = 'WA_NUMBER'; // À remplacer par le numéro réel
const whatsappLink = computed(
  () =>
    `https://wa.me/${whatsappNumber}?text=Bonjour%20APIGO%2C%20j%27ai%20une%20question%20sur%20votre%20plateforme.`,
);
</script>
