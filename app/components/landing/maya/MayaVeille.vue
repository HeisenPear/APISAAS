<!--
  Chapitre 01 — « Elle veille ».

  Le seul chapitre sombre de la page, et ce n'est pas un effet : il raconte la
  nuit. Les garde-fous cités (heures calmes, anti-rafale, résumé) ne sont pas des
  promesses de marketing — ils sont écrits dans `server/utils/alertesPush.ts`.
-->
<template>
  <LandingMayaChapitre numero="01" intitule="Elle veille" ancre="veille" sombre>
    <template #titre>Elle ne dort pas.<br />Elle note.</template>
    <template #chapo>
      Balances, météo, seuils sanitaires, calendrier apicole : Maya repasse sur vos données toute la
      nuit. Le matin, vous ne recevez pas quarante notifications — vous en recevez celles qui
      valaient le dérangement.
    </template>

    <div class="grid gap-6 md:grid-cols-[1fr_1.1fr] md:gap-10">
      <!-- Ce qu'elle relit -->
      <ul class="space-y-3">
        <li
          v-for="s in sources"
          :key="s.libelle"
          class="flex items-start gap-3 rounded-[13px] border p-3.5"
          style="border-color: rgba(255, 255, 255, 0.12); background: rgba(255, 255, 255, 0.04)"
        >
          <UIcon
            :name="s.icone"
            class="mt-0.5 h-[18px] w-[18px] shrink-0"
            style="color: #f0b454"
            aria-hidden="true"
          />
          <div>
            <p class="text-[14px] font-semibold text-white">{{ s.libelle }}</p>
            <p class="mt-0.5 text-[12.5px] leading-relaxed" style="color: rgba(255, 255, 255, 0.6)">
              {{ s.detail }}
            </p>
          </div>
        </li>
      </ul>

      <!-- Le filtre, chiffré -->
      <div
        class="rounded-[16px] border p-5"
        style="border-color: rgba(255, 255, 255, 0.14); background: rgba(255, 255, 255, 0.05)"
      >
        <p
          class="text-[10.5px] font-semibold uppercase tracking-wider"
          style="color: rgba(255, 255, 255, 0.45)"
        >
          Exemple · nuit du 17 au 18 mai
        </p>

        <p class="mt-4 text-[22px] font-bold leading-snug text-white sm:text-[26px]">
          Sur 41 observations de la nuit,<br />
          <span style="color: #f0b454">2 méritaient de vous réveiller.</span>
        </p>

        <div class="mt-6 space-y-3 border-t pt-5" style="border-color: rgba(255, 255, 255, 0.12)">
          <div v-for="g in gardes" :key="g.titre" class="flex items-start gap-3">
            <UIcon
              name="i-lucide-shield-check"
              class="mt-0.5 h-4 w-4 shrink-0"
              style="color: rgba(255, 255, 255, 0.45)"
              aria-hidden="true"
            />
            <p class="text-[13px] leading-relaxed" style="color: rgba(255, 255, 255, 0.72)">
              <span class="font-semibold text-white">{{ g.titre }}</span> — {{ g.detail }}
            </p>
          </div>
        </div>

        <p class="mt-5 text-[11.5px]" style="color: rgba(255, 255, 255, 0.42)">
          Les chiffres de cet exemple sont illustratifs. Les garde-fous, eux, sont ceux du produit.
        </p>
      </div>
    </div>
  </LandingMayaChapitre>
</template>

<script setup lang="ts">
const sources = [
  {
    icone: 'i-lucide-scale',
    libelle: 'Vos balances',
    detail: 'Démarrage de miellée, essaimage probable, chute brutale qui ressemble à un vol.',
  },
  {
    icone: 'i-lucide-cloud-sun',
    libelle: 'La météo du rucher',
    detail: 'Fenêtres de visite, coups de froid, épisodes qui menacent une colonie faible.',
  },
  {
    icone: 'i-lucide-activity',
    libelle: 'Les seuils sanitaires',
    detail: 'Charge varroa, visites en retard, colonies dont le score décroche.',
  },
  {
    icone: 'i-lucide-calendar-days',
    libelle: 'Le calendrier apicole',
    detail: 'Pose et retrait des hausses, traitements, obligations déclaratives.',
  },
];

/** Chacun est implémenté dans `server/utils/alertesPush.ts` — cf. les tests associés. */
const gardes = [
  { titre: 'Heures calmes', detail: 'aucun push de confort entre 21 h et 8 h, heure de Paris.' },
  {
    titre: 'Anti-rafale',
    detail: 'les alertes qui arrivent groupées sont différées, pas répétées.',
  },
  { titre: 'Résumé', detail: 'au-delà de deux alertes, un seul message les rassemble.' },
  { titre: 'Sauf urgence', detail: 'une priorité haute passe toujours, quelle que soit l’heure.' },
];
</script>
