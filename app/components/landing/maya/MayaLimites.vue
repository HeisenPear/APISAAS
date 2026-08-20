<!--
  Chapitre 06 — « Ses limites ».

  Le chapitre le plus important de la page. Une copilote à qui l'on confie une
  décision qui coûte une colonie doit dire où elle s'arrête — et ces quatre
  limites sont vérifiables dans le dépôt, pas des postures :

    aucun appel LLM      → `server/utils/copilote-local.ts`, règles pures
    aucun seuil inventé  → `server/utils/santeScore.ts:100`, paliers ITSAP
    aucune écriture seule→ `server/api/ia/copilote.post.ts`, prévisualisation
    aucun point sans phrase → chaque composante du score porte sa justification
-->
<template>
  <LandingMayaChapitre numero="06" intitule="Ses limites" ancre="limites">
    <template #titre>Ce qu’elle ne fera<br />jamais.</template>
    <template #chapo>
      Une copilote à qui l’on confie une décision qui coûte une colonie doit dire où elle s’arrête.
      Voici les quatre limites que Maya s’impose — et les trois choses qu’elle sait faire de ses
      propres doutes.
    </template>

    <ul class="grid gap-4 sm:grid-cols-2">
      <li
        v-for="l in limites"
        :key="l.titre"
        class="rounded-[16px] border p-5"
        style="border-color: var(--border-default); background: var(--surface-muted)"
      >
        <div class="flex items-center gap-2">
          <UIcon
            name="i-lucide-circle-slash"
            class="h-4 w-4 shrink-0"
            style="color: var(--honey-deep)"
            aria-hidden="true"
          />
          <p class="text-[14.5px] font-semibold" style="color: var(--text-primary)">
            {{ l.titre }}
          </p>
        </div>
        <p class="mt-2 text-[13.5px] leading-relaxed" style="color: var(--text-secondary)">
          {{ l.detail }}
        </p>
      </li>
    </ul>

    <div class="mt-5 grid gap-4 sm:grid-cols-3">
      <div
        v-for="q in qualites"
        :key="q.titre"
        class="rounded-[16px] border border-dashed p-5"
        style="border-color: var(--border-default)"
      >
        <p class="text-[14px] font-semibold" style="color: var(--text-primary)">{{ q.titre }}</p>
        <p class="mt-1.5 text-[13px] leading-relaxed" style="color: var(--text-secondary)">
          {{ q.detail }}
        </p>
      </div>
    </div>
  </LandingMayaChapitre>
</template>

<script setup lang="ts">
const limites = [
  {
    titre: 'Aucun appel LLM',
    detail:
      'Des règles pures, sans entrée-sortie dans la logique métier. Même rucher, même jour, même réponse — toujours.',
  },
  {
    titre: 'Aucun seuil inventé',
    detail:
      'Les paliers varroa suivent les références de l’ITSAP : 1 % bas, 3 % traiter, 5 % critique. Pas une intuition.',
  },
  {
    titre: 'Aucune écriture seule',
    detail:
      'Elle prépare, vous confirmez. Toujours dans cet ordre — y compris sur une dictée vocale.',
  },
  {
    titre: 'Aucun point sans phrase',
    detail:
      'Chaque point retiré d’un score est justifié, avec son niveau de confiance. Rien n’est opaque.',
  },
];

const qualites = [
  {
    titre: 'Elle sait douter',
    detail:
      'Chaque score porte son niveau de confiance. Une donnée vieille de six semaines ne vaut pas une visite d’hier.',
  },
  {
    titre: 'Elle sait se taire',
    detail:
      'Heures calmes de 21 h à 8 h, anti-rafale, résumé au-delà de deux alertes. Seules les urgences passent toujours.',
  },
  {
    titre: 'Elle est vérifiable',
    detail:
      'Le noyau est couvert cas par cas et le temps est injectable : n’importe quelle journée peut être rejouée à l’identique.',
  },
];
</script>
