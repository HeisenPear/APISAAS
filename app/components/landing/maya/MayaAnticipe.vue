<!--
  Chapitre 04 — « Elle anticipe ».

  Le second chapitre sombre : c'est le moteur qu'on regarde, pas le produit.
  Deux pièces interactives, reprises de la maquette :

   · la courbe — douze relevés, dont les quatre derniers virent au rouge. Ce
     n'est pas décoratif : la PENTE est l'argument. Un score de 68 qui descend
     inquiète plus qu'un 60 qui remonte, et c'est tout ce que la figure dit ;
   · le sélecteur de cadence — quatre saisons, une seule active. Sans lui, on
     affirme « la cadence s'adapte » ; avec lui, on le montre en un clic.

  Les valeurs viennent de `server/utils/santeScore.ts` (composantes et poids) et
  de `server/utils/santePredictive.ts` (projection).
-->
<template>
  <LandingMayaChapitre numero="04" intitule="Elle anticipe" ancre="anticipe" sombre>
    <template #titre>Elle ne raconte pas hier.{{ ' ' }}<br />Elle prépare demain.</template>
    <template #chapo>
      Le score d’aujourd’hui ne sert à rien s’il ne dit pas où va la colonie. Maya projette à 30
      jours, règle la cadence sur la saison, et vous donne l’ordre de la tournée.
    </template>

    <div v-reveal.cascade class="grid gap-6 lg:grid-cols-[1.15fr_1fr]">
      <!-- La projection -->
      <div class="bloc">
        <div class="flex items-baseline justify-between">
          <p class="text-[13px] font-semibold text-white">Score prédictif · Ruche 14</p>
          <span class="text-[11.5px]" style="color: rgba(255, 255, 255, 0.6)">à 30 jours</span>
        </div>

        <div class="mt-5 flex h-[132px] items-end gap-[5px]" role="img" :aria-label="resumeCourbe">
          <span
            v-for="(b, i) in courbe"
            :key="i"
            class="barre"
            :style="{ height: b.h, background: b.couleur }"
          />
        </div>

        <div
          class="mt-2 flex justify-between text-[11px] tabular-nums"
          style="color: rgba(255, 255, 255, 0.6)"
        >
          <span>il y a 60 j</span>
          <span>aujourd’hui</span>
          <span>dans 30 j</span>
        </div>

        <p
          class="mt-4 border-t pt-4 text-[12.5px] leading-relaxed"
          style="border-color: rgba(255, 255, 255, 0.12); color: rgba(255, 255, 255, 0.72)"
        >
          La pente vient de la charge varroa non traitée et de deux visites manquées. Traitez cette
          semaine, et la projection remonte.
        </p>
      </div>

      <div class="flex flex-col gap-6">
        <!-- Le sélecteur de cadence -->
        <div class="bloc">
          <p class="text-[13px] font-semibold text-white">Cadence · {{ saison.nom }}</p>

          <div class="mt-4 grid grid-cols-4 gap-2">
            <button
              v-for="(s, i) in SAISONS"
              :key="s.nom"
              type="button"
              class="saison"
              :aria-pressed="i === iSaison"
              :style="
                i === iSaison
                  ? 'border-color: rgba(245,166,35,0.55); background: rgba(245,166,35,0.12); color: #F5A623'
                  : 'border-color: rgba(255,255,255,0.12); background: rgba(255,255,255,0.03); color: rgba(255,255,255,0.6)'
              "
              @click="iSaison = i"
            >
              <span class="block text-[12px] font-semibold">{{ s.nom }}</span>
              <span class="mt-0.5 block text-[15px] font-bold tabular-nums">{{ s.jours }}</span>
            </button>
          </div>

          <p
            :key="iSaison"
            class="cadence-detail mt-4 text-[12.5px] leading-relaxed"
            style="color: rgba(255, 255, 255, 0.72)"
          >
            {{ saison.detail }}
          </p>
        </div>

        <!-- La tournée -->
        <div class="bloc">
          <p class="text-[13px] font-semibold text-white">Tournée du jour</p>
          <ul class="mt-3 space-y-2">
            <li
              v-for="(r, i) in tournee"
              :key="r.nom"
              class="flex items-center gap-3 rounded-[10px] px-3 py-2"
              style="background: rgba(255, 255, 255, 0.04)"
            >
              <span
                class="grid h-5 w-5 shrink-0 place-items-center rounded-full text-[10px] font-bold"
                style="background: rgba(245, 166, 35, 0.16); color: #f0b454"
                >{{ i + 1 }}</span
              >
              <span class="flex-1 text-[12.5px] text-white">{{ r.nom }}</span>
              <span class="text-[11.5px]" style="color: rgba(255, 255, 255, 0.6)">{{
                r.motif
              }}</span>
            </li>
          </ul>
          <p
            class="mt-3 text-center text-[11px] tabular-nums"
            style="color: rgba(255, 255, 255, 0.6)"
          >
            urgence = critiques × 10 + retards
          </p>
        </div>
      </div>
    </div>
  </LandingMayaChapitre>
</template>

<script setup lang="ts">
/** Douze relevés. La hauteur ramène 50→80 sur 0→100 % : la pente doit se voir. */
const HISTO = [62, 64, 66, 70, 72, 71, 69, 68, 66, 65, 63, 62];
const courbe = HISTO.map((v, k) => ({
  h: `${Math.round(((v - 50) / 30) * 100)}%`,
  // Les quatre derniers relevés sont la PROJECTION : ils virent au rouge.
  couleur: k >= 8 ? 'rgba(181,69,69,0.75)' : 'rgba(245,166,35,0.8)',
}));

const resumeCourbe = `Score de ${HISTO[0]} il y a 60 jours, ${HISTO[7]} aujourd’hui, projeté à ${HISTO[HISTO.length - 1]} dans 30 jours.`;

const SAISONS = [
  {
    nom: 'Printemps',
    jours: '10 j',
    detail:
      'On rouvre tous les 10 jours : c’est la fenêtre où une colonie décide de partir, et où l’on peut encore l’en empêcher.',
  },
  {
    nom: 'Été',
    jours: '14 j',
    detail:
      'Le rythme se détend : on suit les hausses, les réserves et le poids plutôt que le couvain.',
  },
  {
    nom: 'Automne',
    jours: '21 j',
    detail:
      'Trois semaines entre deux passages : varroa post-récolte, réserves d’hiver, réduction des entrées.',
  },
  {
    nom: 'Hiver',
    jours: '60 j',
    detail:
      'Elle passe en veille et ne réclame plus de visite : ouvrir coûterait plus que ça ne rapporte.',
  },
];

const iSaison = ref(0);
const saison = computed(() => SAISONS[iSaison.value]!);

const tournee = [
  { nom: 'Les Tilleuls', motif: '2 critiques' },
  { nom: 'Le Coteau', motif: '4 en retard' },
  { nom: 'Bord de Loire', motif: '1 en retard' },
];
</script>

<style scoped>
.bloc {
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.14);
  background: rgba(255, 255, 255, 0.05);
  padding: 20px;
}

.barre {
  flex: 1;
  min-width: 0;
  border-radius: 3px 3px 0 0;
}

/* Pas de transition sur le bouton : le retour au clic doit être immédiat. */
.saison {
  border-radius: 12px;
  border: 1px solid;
  padding: 9px 4px;
  text-align: center;
  cursor: pointer;
}
.saison:focus-visible {
  outline: 2px solid #f0b454;
  outline-offset: 2px;
}

/* Le détail, lui, peut se permettre un fondu : c'est du texte qu'on relit. */
.cadence-detail {
  animation: cadence-apparait 220ms ease-out;
}
@keyframes cadence-apparait {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}
@media (prefers-reduced-motion: reduce) {
  .cadence-detail {
    animation: none;
  }
}
</style>
