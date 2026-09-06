<!--
  Chapitre 01 — « Elle veille ».

  Le seul chapitre sombre, et ce n'est pas un effet de style : il raconte la nuit.
  Les garde-fous cités ne sont pas des promesses de marketing — ils sont écrits
  dans `server/utils/alertesPush.ts`.

  ⚠️ PAS DE BALAYAGE ICI, ET C'EST VOULU. Une barre miel traversait ce panneau
  de haut en bas, en boucle toutes les 5,2 secondes. Sur un encadré qui porte
  des CHIFFRES et des EXEMPLES — ce qu'on vient précisément lire — un mouvement
  perpétuel tire l'œil hors du texte à chaque passage. Le chapitre raconte une
  veille silencieuse ; l'illustrer par un radar clignotant disait l'inverse de
  ce qu'il affirme. Supprimée, pas masquée.
-->
<template>
  <LandingMayaChapitre numero="01" intitule="Elle veille" ancre="veille" sombre>
    <template #titre>Elle ne dort pas.{{ ' ' }}<br />Elle note.</template>
    <template #chapo>
      Balances, météo, seuils sanitaires, calendrier apicole : Maya repasse sur vos données toute la
      nuit. Le matin, vous ne recevez pas quarante notifications — vous recevez celles qui valaient
      le dérangement.
    </template>

    <div class="grid gap-6 md:grid-cols-[1fr_1.05fr] md:gap-10">
      <!-- Ce qu'elle relit, dépliable -->
      <div>
        <!-- ⚠️ CETTE COLONNE N'AVAIT AUCUN TITRE. Quatre cartes tombaient là
             sans dire ce qu'elles sont, en face d'un panneau qui, lui, s'annonce
             (« Exemple · nuit du 17 au 18 mai »). L'œil n'avait rien où se poser
             à gauche : c'est la moitié du « on n'est guidé nulle part ». -->
        <p
          class="mb-3 text-[11.5px] font-semibold uppercase tracking-wider"
          style="color: rgba(255, 255, 255, 0.6)"
        >
          Ce qu'elle relit · touchez pour l'exemple
        </p>
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
                <span class="block text-[15px] font-semibold leading-snug text-white">{{
                  s.libelle
                }}</span>
                <span
                  class="mt-1 block text-[13px] leading-relaxed"
                  style="color: rgba(255, 255, 255, 0.78)"
                >
                  {{ s.detail }}
                </span>
                <span
                  v-if="ouvert === i"
                  :id="`veille-src-${i}`"
                  class="mt-2.5 block border-t pt-2.5 text-[13px] leading-relaxed"
                  style="border-color: rgba(255, 255, 255, 0.14); color: rgba(255, 255, 255, 0.78)"
                >
                  {{ s.exemple }}
                </span>
              </span>
              <UIcon
                name="i-lucide-chevron-down"
                class="mt-0.5 h-4 w-4 shrink-0 transition-transform"
                :class="ouvert === i ? 'rotate-180' : ''"
                style="color: rgba(255, 255, 255, 0.6)"
                aria-hidden="true"
              />
            </button>
          </li>
        </ul>
      </div>

      <!-- Le panneau de veille, balayé -->
      <div ref="panneau" class="panneau">
        <div class="relative">
          <div class="flex items-center justify-between">
            <p
              class="text-[11.5px] font-semibold uppercase tracking-wider"
              style="color: rgba(255, 255, 255, 0.6)"
            >
              Exemple · nuit du 17 au 18 mai
            </p>
            <span class="pastille">en veille</span>
          </div>

          <!-- L'entonnoir de la nuit -->
          <div class="mt-5 flex items-end gap-4">
            <div>
              <p class="text-[34px] font-bold leading-none tabular-nums text-white">41</p>
              <p class="mt-1 text-[11.5px]" style="color: rgba(255, 255, 255, 0.6)">observations</p>
            </div>
            <UIcon
              name="i-lucide-arrow-right"
              class="mb-2 h-5 w-5"
              style="color: rgba(255, 255, 255, 0.6)"
              aria-hidden="true"
            />
            <div>
              <p class="text-[34px] font-bold leading-none tabular-nums" style="color: #f0b454">
                2
              </p>
              <p class="mt-1 text-[11.5px]" style="color: rgba(255, 255, 255, 0.6)">
                notifications
              </p>
            </div>
            <p
              class="mb-1 ml-auto text-right text-[11.5px] leading-snug"
              style="color: rgba(255, 255, 255, 0.6)"
            >
              un seul envoi,<br />à 7 h
            </p>
          </div>

          <!-- L'argument du chapitre, écrit. Il était jusqu'ici à DÉDUIRE de
               l'entonnoir et des étiquettes « rien » — c'est-à-dire réservé à
               qui lisait tout. -->
          <p class="mt-4 text-[13px] leading-relaxed" style="color: rgba(255, 255, 255, 0.78)">
            <span class="font-semibold text-white">39 relevés n’ont rien déclenché.</span>
            C’est le travail : décider ce qui ne vaut pas la peine de vous réveiller.
          </p>

          <!-- Le journal de la nuit : ce qu'elle a vu, et ce qu'elle en a fait -->
          <ul
            class="mt-5 space-y-2.5 border-t pt-4"
            style="border-color: rgba(255, 255, 255, 0.12)"
          >
            <li v-for="l in nuit" :key="l.h" class="flex gap-3">
              <span
                class="w-[52px] shrink-0 pt-0.5 text-[11.5px] tabular-nums"
                style="color: rgba(255, 255, 255, 0.6)"
                >{{ l.h }}</span
              >
              <span class="min-w-0 flex-1">
                <!-- Le poids porte le rang : deux lignes réveillent, quatre non.
                     On ne peut pas le dire par la transparence — le plancher de
                     lisibilité est à 0,50 sur ce fond — donc c'est la graisse
                     qui s'en charge. -->
                <span
                  class="block text-[13px] leading-snug"
                  :class="l.tag === 'rien' ? 'font-normal' : 'font-semibold'"
                  :style="{ color: l.couleur }"
                >
                  {{ l.texte }}
                </span>
                <span
                  class="mt-0.5 block text-[11.5px] leading-snug"
                  style="color: rgba(255, 255, 255, 0.6)"
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
                style="color: rgba(255, 255, 255, 0.6)"
                aria-hidden="true"
              />
              <p class="text-[13px] leading-relaxed" style="color: rgba(255, 255, 255, 0.78)">
                <span class="font-semibold text-white">{{ g.titre }}</span> — {{ g.detail }}
              </p>
            </div>
          </div>

          <p class="mt-4 text-[11.5px]" style="color: rgba(255, 255, 255, 0.6)">
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

/**
 * ⚠️ LES CHIFFRES DE CE BLOC VIENNENT DU MOTEUR, PAS DE L'INTUITION.
 *
 * J'avais écrit « une chute de plus de 2 kg en pleine nuit, c'est le profil
 * d'un vol ». Faux, et faux dans le sens qui décrédibilise : le vrai seuil est
 * une chute d'au moins 10 kg AVEC un poids restant sous 5 kg — la ruche n'est
 * physiquement plus sur la balance. Un apiculteur qui perd 2 kg une nuit et ne
 * reçoit rien conclut que le produit ne marche pas.
 *
 * Constantes : SEUIL_VOL_CHUTE_KG=10, SEUIL_VOL_POIDS_KG=5,
 * HEURE_ESSAIMAGE 10-17 h, SEUIL_MIELLEE_KG=2, variationKg défaut 1,5 kg
 * (server/utils/balances/alertes.ts).
 */
const sources = [
  {
    icone: 'i-lucide-scale',
    libelle: 'Vos balances',
    detail: 'Démarrage de miellée, essaimage probable, chute brutale qui ressemble à un vol.',
    exemple:
      'Une ruche qui perd plus de dix kilos et retombe sous cinq n’a pas essaimé : elle n’est plus là. Un essaim, lui, ne part jamais la nuit — on ne le cherche qu’entre 10 h et 17 h.',
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

.tag {
  align-self: flex-start;
  border-radius: 999px;
  border: 1px solid;
  padding: 1px 8px;
  font-size: 11.5px;
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
  font-size: 11.5px;
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
</style>
