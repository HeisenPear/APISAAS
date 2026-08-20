<!--
  Chapitre 04 — « Elle anticipe ».

  Le score de santé n'a d'intérêt que s'il dit où va la colonie. Les composantes
  et leur pondération viennent de `server/utils/santeScore.ts` ; la projection à
  30 jours de `server/utils/santePredictive.ts`.
-->
<template>
  <LandingMayaChapitre numero="04" intitule="Elle anticipe" ancre="anticipe">
    <template #titre>Elle ne raconte pas hier.<br />Elle prépare demain.</template>
    <template #chapo>
      Le score d’aujourd’hui ne sert à rien s’il ne dit pas où va la colonie. Maya projette à 30
      jours, règle la cadence sur la saison, et vous donne l’ordre de la tournée.
    </template>

    <div class="grid gap-5 md:grid-cols-3">
      <div
        v-for="c in cartes"
        :key="c.titre"
        class="rounded-[16px] border p-5"
        style="border-color: var(--border-default); background: white"
      >
        <UIcon
          :name="c.icone"
          class="h-5 w-5"
          style="color: var(--honey-deep)"
          aria-hidden="true"
        />
        <p class="mt-3 text-[15px] font-semibold" style="color: var(--text-primary)">
          {{ c.titre }}
        </p>
        <p class="mt-1.5 text-[13.5px] leading-relaxed" style="color: var(--text-secondary)">
          {{ c.detail }}
        </p>
        <p
          class="mt-3 border-t pt-3 text-[12px] leading-relaxed"
          style="border-color: var(--border-default); color: var(--text-tertiary)"
        >
          {{ c.regle }}
        </p>
      </div>
    </div>
  </LandingMayaChapitre>
</template>

<script setup lang="ts">
const cartes = [
  {
    icone: 'i-lucide-trending-down',
    titre: 'Score prédictif à 30 jours',
    detail:
      'La pente compte autant que le niveau. Une colonie à 68 qui descend inquiète plus qu’une à 60 qui remonte.',
    regle: 'Charge varroa non traitée et visites manquées pèsent le plus lourd dans la pente.',
  },
  {
    icone: 'i-lucide-calendar-clock',
    titre: 'Cadence saisonnière',
    detail:
      'L’intervalle entre deux visites n’est pas le même en mars et en juillet. Maya cale le rythme sur la saison apicole.',
    regle: 'Une visite « en retard » se juge sur la cadence de la saison, pas sur un délai fixe.',
  },
  {
    icone: 'i-lucide-route',
    titre: 'Tournée du jour',
    detail:
      'Les ruchers sont classés par urgence : ce qui est critique passe devant ce qui est simplement en retard.',
    regle: 'urgence = critiques × 10 + retards',
  },
];
</script>
