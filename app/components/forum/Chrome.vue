<template>
  <!--
    ⚠️ LE FORUM EST LA PREMIÈRE PAGE DE CE PRODUIT À ÊTRE À LA FOIS PUBLIQUE ET
    APPLICATIVE, et aucune des deux enveloppes existantes ne convenait seule.

    · Avec le layout `default` seul, un visiteur venu de Google reçoit la barre
      latérale de l'espace connecté : « Tableau de bord », « Finances »,
      « Stocks »… une dizaine de liens qui le renverront tous vers /login. On
      lui montre les meubles d'une maison où il n'est pas entré.
    · Avec le chrome marketing seul, un apiculteur connecté qui clique
      « Forum » dans sa barre latérale la voit disparaître — il croit avoir
      quitté son espace, et rien ne lui dit comment y revenir.

    D'où l'enveloppe qui se choisit. `useSupabaseUser` est hydraté CÔTÉ SERVEUR
    depuis le cookie — c'est déjà ce sur quoi `LandingHeader` s'appuie pour
    afficher « Tableau de bord » plutôt que « Connexion », avec la même note —
    donc le rendu serveur et le client s'accordent, et il n'y a pas de
    bascule visible à l'hydratation.
  -->
  <NuxtLayout v-if="user" name="default">
    <slot />
  </NuxtLayout>

  <div v-else class="min-h-screen bg-[var(--surface-page)]">
    <LandingHeader />
    <main class="mx-auto max-w-5xl px-4 pb-24 pt-28 sm:px-6">
      <slot />
    </main>
    <LandingFooter />
  </div>
</template>

<script setup lang="ts">
// Hydraté côté serveur depuis le cookie → pas de mismatch (cf. LandingHeader).
const user = useSupabaseUser();
</script>
