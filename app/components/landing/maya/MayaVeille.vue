<!--
  Chapitre 01 — « Elle veille ».

  Le seul chapitre sombre, et ce n'est pas un effet de style : il raconte la nuit.
  Les garde-fous cités ne sont pas des promesses de marketing — ils sont écrits
  dans `server/utils/alertesPush.ts`.

  ⚠️ LE BALAYAGE ANIME `top`, PAS `translateY`. La barre de balayage fait 2 px de
  haut ; un `translateY(100%)` se résoudrait donc sur CES 2 px et la barre ne
  bougerait pratiquement pas. `top` se résout sur le bloc positionné parent —
  le panneau — et donne la course complète. C'est le piège que la maquette
  documente explicitement, et il coûte une animation qui « ne marche pas » sans
  qu'on voie pourquoi.
-->
<template>
  <LandingMayaChapitre numero="01" intitule="Elle veille" ancre="veille" sombre>
    <template #titre>Elle ne dort pas.<br />Elle note.</template>
    <template #chapo>
      Balances, météo, seuils sanitaires, calendrier apicole : Maya repasse sur vos données toute la
      nuit. Le matin, vous ne recevez pas quarante notifications — vous recevez celles qui valaient
      le dérangement.
    </template>

    <div class="grid gap-6 md:grid-cols-[1fr_1.05fr] md:gap-10">
      <!-- Ce qu'elle relit, dépliable -->
      <div>
        <ul v-reveal.cascade class="space-y-2.5">
          <li v-for="(s, i) in sources" :key="s.libelle">
            <button
              type="button"
              class="source"
              :class="{ 'source-ouverte': ouvert === i }"
              :aria-expanded="ouvert === i"
              :aria-controls="`veille-src-${i}`"
              @click="ouvert = ouvert === i ? null : i"
            >
              <UIcon
                :name="s.icone"
                class="mt-0.5 h-[18px] w-[18px] shrink-0"
                style="color: #f0b454"
                aria-hidden="true"
              />
              <span class="min-w-0 flex-1">
                <span class="block text-[14px] font-semibold text-white">{{ s.libelle }}</span>
                <span
                  class="mt-0.5 block text-[12.5px] leading-relaxed"
                  style="color: rgba(255, 255, 255, 0.6)"
                >
                  {{ s.detail }}
                </span>
                <span
                  v-if="ouvert === i"
                  :id="`veille-src-${i}`"
                  class="mt-2.5 block border-t pt-2.5 text-[12px] leading-relaxed"
                  style="border-color: rgba(255, 255, 255, 0.14); color: rgba(255, 255, 255, 0.7)"
                >
                  {{ s.exemple }}
                </span>
              </span>
              <UIcon
                name="i-lucide-chevron-down"
                class="mt-0.5 h-4 w-4 shrink-0 transition-transform"
                :class="ouvert === i ? 'rotate-180' : ''"
                style="color: rgba(255, 255, 255, 0.4)"
                aria-hidden="true"
              />
            </button>
          </li>
        </ul>
      </div>

      <!-- Le panneau de veille, balayé -->
      <div ref="panneau" class="panneau">
        <span v-if="anime" class="balayage" aria-hidden="true" />

        <div class="relative">
          <div class="flex items-center justify-between">
            <p
              class="text-[10.5px] font-semibold uppercase tracking-wider"
              style="color: rgba(255, 255, 255, 0.45)"
            >
              Exemple · nuit du 17 au 18 mai
            </p>
            <span class="pastille">en veille</span>
          </div>

          <!-- L'entonnoir de la nuit -->
          <div class="mt-5 flex items-end gap-4">
            <div>
              <p class="text-[34px] font-bold leading-none tabular-nums text-white">41</p>
              <p class="mt-1 text-[11.5px]" style="color: rgba(255, 255, 255, 0.5)">observations</p>
            </div>
            <UIcon
              name="i-lucide-arrow-right"
              class="mb-2 h-5 w-5"
              style="color: rgba(255, 255, 255, 0.3)"
              aria-hidden="true"
            />
            <div>
              <p class="text-[34px] font-bold leading-none tabular-nums" style="color: #f0b454">
                2
              </p>
              <p class="mt-1 text-[11.5px]" style="color: rgba(255, 255, 255, 0.5)">
                notifications
              </p>
            </div>
            <p
              class="mb-1 ml-auto text-right text-[11.5px] leading-snug"
              style="color: rgba(255, 255, 255, 0.42)"
            >
              un seul envoi,<br />à 7 h
            </p>
          </div>

          <!-- Le journal de la nuit : ce qu'elle a vu, et ce qu'elle en a fait -->
          <ul
            class="mt-5 space-y-2.5 border-t pt-4"
            style="border-color: rgba(255, 255, 255, 0.12)"
          >
            <li v-for="l in nuit" :key="l.h" class="flex gap-3">
              <span
                class="w-[52px] shrink-0 pt-0.5 text-[11.5px] tabular-nums"
                style="color: rgba(255, 255, 255, 0.38)"
                >{{ l.h }}</span
              >
              <span class="min-w-0 flex-1">
                <span class="block text-[12.5px] leading-snug" :style="{ color: l.couleur }">
                  {{ l.texte }}
                </span>
                <span
                  class="mt-0.5 block text-[11.5px] leading-snug"
                  style="color: rgba(255, 255, 255, 0.4)"
                >
                  {{ l.source }}
                </span>
              </span>
              <span class="tag shrink-0" :style="{ color: l.couleur, borderColor: l.couleur }">
                {{ l.tag }}
              </span>
            </li>
          </ul>

          <div
            class="mt-5 space-y-2.5 border-t pt-4"
            style="border-color: rgba(255, 255, 255, 0.12)"
          >
            <div v-for="g in gardes" :key="g.titre" class="flex items-start gap-2.5">
              <UIcon
                name="i-lucide-shield-check"
                class="mt-0.5 h-3.5 w-3.5 shrink-0"
                style="color: rgba(255, 255, 255, 0.4)"
                aria-hidden="true"
              />
              <p class="text-[12.5px] leading-relaxed" style="color: rgba(255, 255, 255, 0.7)">
                <span class="font-semibold text-white">{{ g.titre }}</span> — {{ g.detail }}
              </p>
            </div>
          </div>

          <p class="mt-4 text-[11px]" style="color: rgba(255, 255, 255, 0.38)">
            Les chiffres de cet exemple sont illustratifs. Les garde-fous, eux, sont ceux du
            produit.
          </p>
        </div>
      </div>
    </div>
  </LandingMayaChapitre>
</template>

<script setup lang="ts">
const ouvert = ref<number | null>(null);

/** Sans mouvement demandé, pas de balayage : le panneau reste lisible et fixe. */
const anime = ref(false);
onMounted(() => {
  anime.value = !window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
});

const sources = [
  {
    icone: 'i-lucide-scale',
    libelle: 'Vos balances',
    detail: 'Démarrage de miellée, essaimage probable, chute brutale qui ressemble à un vol.',
    exemple:
      'Une chute de plus de 2 kg en pleine nuit ne s’explique ni par la météo ni par le butinage : c’est le profil d’un vol, et ça passe en priorité haute.',
  },
  {
    icone: 'i-lucide-cloud-sun',
    libelle: 'La météo du rucher',
    detail: 'Fenêtres de visite, coups de froid, épisodes qui menacent une colonie faible.',
    exemple:
      'La prévision est relue par rucher, pas par département : deux ruchers à trente kilomètres n’ont pas la même fenêtre de visite.',
  },
  {
    icone: 'i-lucide-activity',
    libelle: 'Les seuils sanitaires',
    detail: 'Charge varroa, visites en retard, colonies dont le score décroche.',
    exemple:
      'Les paliers varroa suivent les références de l’ITSAP — 1 % bas, 3 % traiter, 5 % critique — et non un seuil maison.',
  },
  {
    icone: 'i-lucide-calendar-days',
    libelle: 'Le calendrier apicole',
    detail: 'Pose et retrait des hausses, traitements, obligations déclaratives.',
    exemple:
      'La cadence de visite attendue change avec la saison : « en retard » en juillet ne veut pas dire la même chose qu’en mars.',
  },
];

/**
 * Le journal d'une nuit, repris de la maquette. Ce qui compte n'est pas la
 * liste : c'est que quatre lignes sur six ne débouchent sur RIEN. Une veille
 * qui alerte sur tout n'est pas une veille, c'est un réveil cassé.
 */
const nuit = [
  {
    h: '02 h 14',
    texte: 'Balance R-12 : −180 g',
    source: 'Refroidissement nocturne, normal pour la saison',
    tag: 'rien',
    couleur: 'rgba(255,255,255,0.55)',
  },
  {
    h: '03 h 40',
    texte: 'Aucun mouvement anormal sur 6 balances',
    source: 'Pas de vol, pas de chute brutale',
    tag: 'rien',
    couleur: 'rgba(255,255,255,0.55)',
  },
  {
    h: '04 h 47',
    texte: 'Gel annoncé à 6 h — 2 °C aux Tilleuls',
    source: 'Météo par rucher · fenêtre de visite repoussée',
    tag: 'noté',
    couleur: '#C87F2A',
  },
  {
    h: '05 h 02',
    texte: 'Ruche 14 : chute varroa à 3,4 %',
    source: 'Seuil de traitement ITSAP dépassé (3 %)',
    tag: 'urgent',
    couleur: '#B54545',
  },
  {
    h: '05 h 03',
    texte: 'Ruche 07 : essaimage probable J+9',
    source: 'Cellules royales du 12 mai · reine 2023',
    tag: 'urgent',
    couleur: '#B54545',
  },
  {
    h: '06 h 58',
    texte: 'Briefing prêt',
    source: '2 priorités · 12 visites · tournée tracée',
    tag: 'prêt',
    couleur: '#F5A623',
  },
];

/** Chacun est implémenté dans `server/utils/alertesPush.ts`. */
const gardes = [
  { titre: 'Heures calmes', detail: 'aucun push de confort entre 21 h et 8 h, heure de Paris.' },
  { titre: 'Anti-rafale', detail: 'les alertes groupées sont différées, pas répétées.' },
  { titre: 'Résumé', detail: 'au-delà de deux alertes, un seul message les rassemble.' },
  { titre: 'Sauf urgence', detail: 'une priorité haute passe toujours, quelle que soit l’heure.' },
];
</script>

<style scoped>
.panneau {
  position: relative;
  overflow: hidden;
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.14);
  background: rgba(255, 255, 255, 0.05);
  padding: 20px;
}

/* La barre fait 2 px de haut. On anime `top`, qui se résout sur le PANNEAU. */
.balayage {
  position: absolute;
  left: 0;
  right: 0;
  height: 2px;
  background: linear-gradient(90deg, transparent, rgba(240, 180, 84, 0.85), transparent);
  animation: veille-balayage 5.2s cubic-bezier(0.4, 0, 0.2, 1) infinite;
  pointer-events: none;
}
@keyframes veille-balayage {
  0% {
    top: 0;
    opacity: 0;
  }
  12% {
    opacity: 1;
  }
  88% {
    opacity: 1;
  }
  100% {
    top: 100%;
    opacity: 0;
  }
}

.tag {
  align-self: flex-start;
  border-radius: 999px;
  border: 1px solid;
  padding: 1px 8px;
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  opacity: 0.9;
}

.pastille {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  border-radius: 999px;
  border: 1px solid rgba(240, 180, 84, 0.4);
  padding: 2px 9px;
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: #f0b454;
}

.source {
  display: flex;
  width: 100%;
  align-items: flex-start;
  gap: 12px;
  border-radius: 13px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(255, 255, 255, 0.04);
  padding: 14px;
  text-align: left;
  cursor: pointer;
  transition: border-color 180ms ease;
}
.source:hover,
.source-ouverte {
  border-color: rgba(240, 180, 84, 0.5);
}
.source:focus-visible {
  outline: 2px solid #f0b454;
  outline-offset: 2px;
}

@media (prefers-reduced-motion: reduce) {
  .balayage {
    animation: none;
  }
}
</style>
