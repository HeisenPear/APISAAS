<!--
  Carte mellifère — ce que voient les apiculteurs avant de transhumer.

  DEUX CHOSES RÉELLES SONT MONTRÉES ICI, et il faut savoir les distinguer :

   · les OBSERVATIONS DE FLORAISON (/floraisons) sont communautaires : chaque
     apiculteur signale ce qu'il voit fleurir, tout le monde en profite, et la
     fenêtre est glissante sur 90 jours. Les couleurs de stade ci-dessous sont
     celles du produit (app/config/floraisons.ts) ;
   · le SCORE D'EMPLACEMENT (/transhumance) pondère butinage 0,45, floraisons
     0,35 et météo 0,20 — les trois poids réels de app/utils/scoreEmplacement.ts.

  ⚠️ CE QU'IL NE FAUT PAS AJOUTER ICI, vérifié dans le code :
   · aucun calendrier ni frise de floraison — ça n'existe pas dans l'app ;
   · aucune PRÉVISION de date de floraison : pas de degrés-jours, pas de modèle
     phénologique, nulle part ;
   · aucune alerte déclenchée par une observation ;
   · aucun itinéraire ni calcul de distance/carburant : ces champs sont SAISIS
     à la main dans un plan de transhumance, jamais calculés.
-->
<template>
  <div class="wmc">
    <div class="wmc-bar">
      <span class="wmc-titre">Carte mellifère</span>
      <span class="wmc-sous">Ressources autour de vos emplacements · 90 derniers jours</span>
    </div>

    <div class="wmc-grid">
      <!-- La carte : fond de département + points d'observation -->
      <div class="wmc-carte">
        <span v-for="o in observations" :key="o.nom" class="wmc-pt" :style="posPoint(o)">
          <span class="wmc-halo" :style="{ background: STADES[o.stade].couleur }" />
          <span class="wmc-pastille" :style="{ background: STADES[o.stade].couleur }" />
        </span>
        <span class="wmc-rucher" title="Votre rucher">🐝</span>
        <span class="wmc-rayon" />
      </div>

      <!-- Le panneau : légende des stades + score d'un emplacement -->
      <div class="wmc-side">
        <p class="wmc-side-t">Floraisons signalées</p>
        <div v-for="o in observations" :key="o.nom" class="wmc-obs">
          <span class="wmc-pastille" :style="{ background: STADES[o.stade].couleur }" />
          <span class="wmc-obs-n">{{ o.emoji }} {{ o.nom }}</span>
          <span class="wmc-obs-s">{{ STADES[o.stade].libelle }}</span>
        </div>

        <p class="wmc-side-t wmc-mt">Score d’emplacement</p>
        <div class="wmc-score">
          <span class="wmc-score-v">78</span>
          <div class="wmc-poids">
            <span v-for="p in POIDS" :key="p.nom" class="wmc-poids-l">
              <span class="wmc-poids-n">{{ p.nom }}</span>
              <span class="wmc-poids-b"
                ><span class="wmc-poids-f" :style="{ width: p.part * 100 + '%' }"
              /></span>
            </span>
          </div>
        </div>
        <p class="wmc-note">Signalé par les apiculteurs de la région, pas par un modèle.</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
/** Couleurs et libellés exacts de app/config/floraisons.ts. */
const STADES = {
  demarrage: { couleur: '#e0b34a', libelle: 'Démarrage' },
  pleine: { couleur: '#f5a623', libelle: 'Pleine floraison' },
  fin: { couleur: '#b87959', libelle: 'Fin de floraison' },
} as const;

type Stade = keyof typeof STADES;

/** Espèces du référentiel réel (18 seedées), avec leur stade du moment. */
const observations: Array<{ nom: string; emoji: string; stade: Stade; x: number; y: number }> = [
  { nom: 'Colza', emoji: '🌼', stade: 'fin', x: 24, y: 30 },
  { nom: 'Acacia', emoji: '🌳', stade: 'pleine', x: 58, y: 44 },
  { nom: 'Châtaignier', emoji: '🌰', stade: 'demarrage', x: 72, y: 66 },
  { nom: 'Tilleul', emoji: '🍃', stade: 'demarrage', x: 38, y: 72 },
];

/** Pondération réelle du score (app/utils/scoreEmplacement.ts). */
const POIDS = [
  { nom: 'Butinage', part: 0.45 },
  { nom: 'Floraisons', part: 0.35 },
  { nom: 'Météo', part: 0.2 },
];

function posPoint(o: { x: number; y: number }) {
  return { left: `${o.x}%`, top: `${o.y}%` };
}
</script>

<style scoped>
.wmc {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.wmc-bar {
  display: flex;
  align-items: baseline;
  gap: 8px;
}
.wmc-titre {
  font-size: 13px;
  font-weight: 800;
  color: var(--text-primary);
}
.wmc-sous {
  font-size: 10px;
  color: var(--text-secondary);
}
.wmc-grid {
  display: grid;
  grid-template-columns: 1.5fr 1fr;
  gap: 10px;
}
/* Fond de carte suggéré : un lavis vert-de-gris chaud, pas une vraie tuile —
   le simulateur ne charge aucune ressource externe. */
.wmc-carte {
  position: relative;
  height: 208px;
  overflow: hidden;
  border-radius: 11px;
  border: 1px solid var(--border-default);
  background:
    radial-gradient(circle at 30% 35%, rgba(201, 135, 61, 0.13), transparent 55%),
    radial-gradient(circle at 70% 65%, rgba(184, 121, 89, 0.11), transparent 55%),
    var(--surface-sunk);
}
.wmc-pt {
  position: absolute;
  transform: translate(-50%, -50%);
}
.wmc-pastille {
  display: block;
  height: 9px;
  width: 9px;
  border-radius: 50%;
  border: 1.5px solid #fff;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.18);
}
/* Le halo respire : une floraison est un phénomène vivant, pas une épingle. */
.wmc-halo {
  position: absolute;
  inset: -7px;
  border-radius: 50%;
  opacity: 0.25;
  animation: wmc-respire 3.2s ease-in-out infinite;
}
@keyframes wmc-respire {
  0%,
  100% {
    transform: scale(1);
    opacity: 0.25;
  }
  50% {
    transform: scale(1.45);
    opacity: 0.08;
  }
}
.wmc-rucher {
  position: absolute;
  left: 46%;
  top: 52%;
  transform: translate(-50%, -50%);
  font-size: 15px;
}
.wmc-rayon {
  position: absolute;
  left: 46%;
  top: 52%;
  height: 108px;
  width: 108px;
  transform: translate(-50%, -50%);
  border-radius: 50%;
  border: 1px dashed color-mix(in srgb, var(--honey) 55%, transparent);
}
.wmc-side {
  border-radius: 11px;
  border: 1px solid var(--border-default);
  background: #fff;
  padding: 9px 10px;
}
.wmc-side-t {
  font-size: 9.5px;
  font-weight: 800;
  letter-spacing: 0.07em;
  text-transform: uppercase;
  color: var(--text-secondary);
  margin-bottom: 6px;
}
.wmc-mt {
  margin-top: 11px;
}
.wmc-obs {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 3px 0;
}
.wmc-obs-n {
  flex: 1;
  font-size: 10.5px;
  font-weight: 600;
  color: var(--text-primary);
}
.wmc-obs-s {
  font-size: 9px;
  color: var(--text-secondary);
}
.wmc-score {
  display: flex;
  align-items: center;
  gap: 10px;
}
.wmc-score-v {
  font-size: 26px;
  font-weight: 800;
  line-height: 1;
  color: var(--honey-deep);
}
.wmc-poids {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 3px;
}
.wmc-poids-l {
  display: flex;
  align-items: center;
  gap: 5px;
}
.wmc-poids-n {
  width: 52px;
  font-size: 8.5px;
  color: var(--text-secondary);
}
.wmc-poids-b {
  flex: 1;
  height: 4px;
  border-radius: 2px;
  background: var(--surface-sunk);
  overflow: hidden;
}
.wmc-poids-f {
  display: block;
  height: 100%;
  border-radius: 2px;
  background: var(--honey);
}
.wmc-note {
  margin-top: 9px;
  font-size: 9px;
  line-height: 1.4;
  color: var(--text-secondary);
}

@media (prefers-reduced-motion: reduce) {
  .wmc-halo {
    animation: none;
  }
}
</style>
