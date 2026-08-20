<!--
  Chapitre 03 — « Elle réagit ».

  Les six états animés viennent du bloc MAYA de `main.css` et sont rendus par
  `IaMayaMark` : ce ne sont pas des illustrations refaites pour la landing, c'est
  le composant du produit, avec les mêmes keyframes.
-->
<template>
  <LandingMayaChapitre numero="03" intitule="Elle réagit" ancre="reagit">
    <template #titre>Vous voyez ce qu’elle fait.</template>
    <template #chapo>
      Sept alvéoles pour tout langage. Son logo bouge selon ce qui l’occupe — vous savez qu’elle
      cherche, qu’elle écoute ou qu’elle a trouvé, sans lire une ligne.
    </template>

    <ul class="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
      <li
        v-for="e in etats"
        :key="e.etat"
        class="flex flex-col items-center gap-3 rounded-[14px] border px-3 py-6 text-center"
        style="border-color: var(--border-default); background: white"
      >
        <IaMayaMark :size="48" :state="e.etat" />
        <div>
          <p class="text-[13px] font-semibold" style="color: var(--text-primary)">{{ e.nom }}</p>
          <p class="mt-1 text-[11.5px] leading-relaxed" style="color: var(--text-tertiary)">
            {{ e.quand }}
          </p>
        </div>
      </li>
    </ul>
  </LandingMayaChapitre>
</template>

<script setup lang="ts">
/** Les six états déclarés par `IaMayaMark`. Aucun autre n'existe. */
const etats = [
  { etat: 'idle' as const, nom: 'Repos', quand: 'Elle est là, elle ne demande rien.' },
  { etat: 'think' as const, nom: 'Réflexion', quand: 'Elle relit vos données.' },
  { etat: 'listen' as const, nom: 'Écoute', quand: 'Le micro est ouvert.' },
  { etat: 'alert' as const, nom: 'Alerte', quand: 'Quelque chose demande votre attention.' },
  { etat: 'loading' as const, nom: 'Travail', quand: 'Elle prépare une écriture.' },
  { etat: 'success' as const, nom: 'Fait', quand: 'C’est enregistré.' },
];
</script>
