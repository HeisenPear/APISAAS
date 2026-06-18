<!--
  Icône abeille — style « trait » cohérent avec les icônes Lucide (stroke
  currentColor, 2px, bouts arrondis). Lucide n'a pas d'icône abeille ; celle-ci
  reprend exactement le même langage visuel que i-lucide-zap & co.
  Taille via les classes (ex : <UiBeeIcon class="h-5 w-5" />).
-->
<template>
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="1em"
    height="1em"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
  >
    <!-- antennes -->
    <path d="M10.5 7 9 4.5" />
    <path d="M13.5 7 15 4.5" />
    <!-- ailes -->
    <ellipse cx="7.5" cy="9" rx="2.5" ry="1.8" transform="rotate(-30 7.5 9)" />
    <ellipse cx="16.5" cy="9" rx="2.5" ry="1.8" transform="rotate(30 16.5 9)" />
    <!-- corps -->
    <path d="M12 7a3.5 3.5 0 0 1 3.5 3.5v4a3.5 3.5 0 0 1-7 0v-4A3.5 3.5 0 0 1 12 7Z" />
    <!-- rayures -->
    <path d="M8.6 11.5h6.8" />
    <path d="M8.6 14.5h6.8" />
  </svg>
</template>
