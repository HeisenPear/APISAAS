<!--
  « Comment elle arrive là » — la scène épinglée.

  C'est le chapitre qui manquait. Les autres montrent CE QUE Maya fait ; aucun
  ne montre COMMENT elle y arrive. Or c'est la seule question qui décide de la
  confiance : un apiculteur qui ne sait pas d'où sort une alerte ne la suivra
  pas, et il aura raison.

  La forme sert le fond. La mark reste ÉPINGLÉE au centre pendant que les quatre
  temps défilent autour d'elle, et elle change d'état à chaque temps —
  idle → think → alert → success. Le lecteur ne regarde pas une explication du
  raisonnement : il le regarde se dérouler, sur le composant même qui le tient
  dans le produit.

  ⚠️ LES QUATRE TEMPS SONT VRAIS, et chacun est vérifiable :
    lecture   → server/utils/copilote-data.ts
    règles    → server/utils/santeScore.ts (paliers varroa ITSAP 1/3/5 %),
                server/utils/cadence.ts (l'intervalle de visite est SAISONNIER :
                10 j printemps · 14 j été · 21 j automne · 60 j hiver — ne jamais
                réécrire ça en un délai fixe, c'est tout le propos du module),
                server/utils/alertesExtra.ts (reine au-delà de 2 ans)
    alerte    → server/utils/alertesCategories.ts (26 types, 6 catégories)

                ⚠️ CE QUI PASSE LA NUIT, exactement (alertesPush.ts:244) :
                pendant les heures calmes 21 h-8 h, on retient les priorités
                « critique » ET « haute » ; seules « basse » et « moyenne » sont
                différées au balayage du matin. J'avais d'abord écrit « deux
                seulement vous réveillent » en ne comptant que les critiques —
                faux : il y a 2 critiques (balance_vol, maladie_loque) et
                9 hautes (essaimage, colonie orpheline, varroa, mortalité,
                météo dangereuse…), soit onze types qui peuvent sonner la nuit.
                Ne pas annoncer de NOMBRE ici : il bouge à chaque type ajouté.
                « Seules les urgences passent » est vrai et le reste stable.
    accord    → server/api/ia/copilote.post.ts — rien ne s'écrit sans confirmation
  Ne pas enjoliver un temps sans changer le code qui le tient.
-->
<template>
  <section id="raisonne" ref="scene" class="scene-raisonne">
    <div class="collant">
      <div
        class="mx-auto grid h-full max-w-6xl items-center gap-10 px-5 sm:px-6 md:grid-cols-[1fr_0.95fr] md:gap-16"
      >
        <!-- Colonne récit : un seul temps visible à la fois. -->
        <div class="colonne-recit">
          <!-- ⚠️ IL MANQUAIT ICI. La colonne montrait un compteur « 1 / 4 » puis
               un temps, sans jamais dire de quoi on compte les temps. La colonne
               de droite, elle, s'annonce par sa mark et son état. Un seul point
               d'entrée pour deux colonnes — c'est l'autre moitié de « on n'est
               guidé nulle part ». -->
          <p class="surtitre-recit">Ce qui se passe entre deux visites</p>

          <div class="compteur" aria-hidden="true">
            <span class="compteur-actif">{{ etape + 1 }}</span>
            <span class="compteur-total">/ {{ TEMPS.length }}</span>
          </div>

          <div class="pile">
            <div
              v-for="(t, i) in TEMPS"
              :key="t.titre"
              class="temps"
              :class="{ 'temps-actif': i === etape, 'temps-passe': i < etape }"
              :aria-hidden="!empile && i !== etape"
            >
              <p class="temps-eyebrow">{{ t.eyebrow }}</p>
              <h3 class="temps-titre">{{ t.titre }}</h3>
              <p class="temps-texte">{{ t.texte }}</p>
              <p class="temps-preuve">
                <UIcon name="i-lucide-check" class="h-3.5 w-3.5" aria-hidden="true" />
                {{ t.garantie }}
              </p>
            </div>
          </div>

          <!-- Jauge : elle dit où l'on en est sans qu'on ait à y penser. -->
          <div class="jauge" aria-hidden="true">
            <span
              v-for="(t, i) in TEMPS"
              :key="t.titre"
              class="jauge-part"
              :class="{ 'jauge-faite': i < etape }"
            >
              <span
                v-if="i === etape"
                class="jauge-remplissage"
                :style="{ transform: `scaleX(${dansEtape})` }"
              />
            </span>
          </div>
        </div>

        <!-- Colonne mark : épinglée, elle traverse ses propres états. -->
        <div class="colonne-mark">
          <span class="halo" :class="`halo-${TEMPS[etape]?.etat}`" aria-hidden="true" />
          <span class="onde" aria-hidden="true" />
          <IaMayaMark :size="240" glow :state="TEMPS[etape]?.etat ?? 'idle'" />
          <p class="mark-etat">{{ TEMPS[etape]?.legende }}</p>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
/**
 * Quatre temps, quatre états de la mark. L'ordre n'est pas décoratif : c'est
 * l'ordre réel d'exécution côté serveur, de la lecture à l'écriture.
 */
/**
 * ⚠️ `source` NE S'AFFICHE PAS, et ce n'est pas un oubli.
 *
 * Elle a été visible un temps : chaque temps portait le chemin du fichier qui
 * le tient, en police à chasse fixe. L'intention était bonne — une promesse
 * qu'on peut aller vérifier — mais le résultat était du débris de développeur
 * sur la page qui vend le produit. « server/utils/copilote-data.ts » ne dit
 * rien à un apiculteur ; au mieux ça l'intrigue, au pire ça fait brouillon.
 *
 * Le chemin reste ICI, pour qui doute d'une affirmation et veut la vérifier
 * dans le code — et il est tenu par un banc qui refuse un fichier disparu. Le
 * visiteur, lui, lit une garantie en français.
 */
const TEMPS = [
  {
    eyebrow: 'Temps 1 — elle lit',
    titre: 'Vos données, pas les nôtres.',
    texte:
      'Vos visites, vos pesées, vos traitements, vos dates de naissance de reines, la météo de votre commune. Rien d’autre n’entre dans le calcul, et rien n’en sort.',
    garantie: 'Vos données, et rien d’autre',
    source: 'server/utils/copilote-data.ts',
    etat: 'idle' as const,
    legende: 'Elle lit',
  },
  {
    eyebrow: 'Temps 2 — elle compare',
    titre: 'À des seuils qui ont un nom.',
    texte:
      'Trois varroas pour cent abeilles. Une reine de plus de deux ans. Et un retard de visite qui se compte en saison, pas en jours fixes : dix jours au printemps quand ça essaime, vingt et un à l’automne. Des repères apicoles publiés, pas une intuition de machine.',
    garantie: 'Des seuils publiés, pas une opinion',
    source: 'server/utils/santeScore.ts',
    etat: 'think' as const,
    legende: 'Elle compare',
  },
  {
    eyebrow: 'Temps 3 — elle signale',
    titre: 'Seulement ce qui a franchi un seuil.',
    texte:
      'Vingt-six situations surveillées, réparties en six familles. La nuit, seules les urgences passent — un vol, une loque, un essaimage, une colonie orpheline. Tout le reste attend le résumé du matin.',
    garantie: 'Le reste attend le matin',
    source: 'server/utils/alertesCategories.ts',
    etat: 'alert' as const,
    legende: 'Elle signale',
  },
  {
    eyebrow: 'Temps 4 — vous tranchez',
    titre: 'Elle prépare. Vous signez.',
    texte:
      'Elle rédige l’intervention, le traitement, le déplacement — et s’arrête là. Aucune écriture ne part sans votre geste, et chacune reste annulable.',
    garantie: 'Rien ne s’écrit sans vous',
    source: 'server/api/ia/copilote.post.ts',
    etat: 'success' as const,
    legende: 'Vous tranchez',
  },
];

const scene = ref<HTMLElement>();
/**
 * 768 : la même valeur que le `@media (max-width: 767px)` de ce fichier. Sans
 * ce seuil, les trois temps inactifs restaient `aria-hidden` alors que le CSS
 * les affiche tous — un lecteur d'écran n'en annonçait qu'un sur quatre, sur
 * téléphone et sous « réduire les animations ».
 */
const { etape, dansEtape, empile } = useSceneEpinglee(scene, TEMPS.length, 768);
</script>

<style scoped>
/**
 * La hauteur fait la durée. Un écran par temps, plus un pour l'entrée : au
 * dessous, la scène défile trop vite pour qu'on lise ; au dessus, on a
 * l'impression que la page a planté. Cinq écrans pour quatre temps est le
 * réglage qui laisse chaque temps lisible sans donner envie de sauter.
 */
.scene-raisonne {
  position: relative;
  height: 500vh;
  background: #121214;
}

.collant {
  position: sticky;
  top: 0;
  display: flex;
  height: 100vh;
  align-items: center;
  overflow: hidden;
}

/* ── Colonne récit ─────────────────────────────────────────────────────── */

.surtitre-recit {
  margin-bottom: 18px;
  font-size: 11.5px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: #f0b454;
}
.compteur {
  display: flex;
  align-items: baseline;
  gap: 6px;
  font-variant-numeric: tabular-nums;
  margin-bottom: 26px;
}
.compteur-actif {
  font-size: 34px;
  font-weight: 700;
  line-height: 1;
  letter-spacing: -0.04em;
  color: #f0b454;
}
.compteur-total {
  font-size: 13.5px;
  color: rgba(255, 255, 255, 0.6);
}

/**
 * Les quatre temps sont EMPILÉS, pas montés/démontés. Un `v-if` ferait sauter
 * la hauteur du bloc à chaque bascule, et la colonne entière tressauterait —
 * exactement ce qu'on ne veut pas dans une scène épinglée. Ils occupent donc
 * tous la même place, et seul l'actif est opaque.
 */
.pile {
  /**
   * ⚠️ GRILLE, PAS POSITION ABSOLUE, et surtout PAS de hauteur minimale fixe.
   *
   * Les quatre temps sont empilés dans LA MÊME cellule de grille : le conteneur
   * prend donc la hauteur du plus grand d'entre eux, automatiquement. Avec une
   * `min-height` et des enfants en `position: absolute`, tout texte plus haut
   * que la valeur devinée débordait sur la jauge — ce qui est arrivé dès que
   * j'ai allongé deux temps en corrigeant leur contenu. Une hauteur devinée est
   * une hauteur qui sera fausse à la prochaine phrase.
   */
  display: grid;
}
.temps {
  grid-area: 1 / 1;
  opacity: 0;
  transform: translate3d(0, 16px, 0);
  transition:
    opacity 520ms var(--ease-out-expo, ease-out),
    transform 520ms var(--ease-out-expo, ease-out);
  pointer-events: none;
}
.temps-actif {
  opacity: 1;
  transform: none;
  pointer-events: auto;
}
/* Un temps déjà passé sort par le HAUT : le récit garde un sens de lecture. */
.temps-passe {
  transform: translate3d(0, -16px, 0);
}

.temps-eyebrow {
  font-size: 11.5px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.14em;
  color: #f0b454;
}
.temps-titre {
  margin-top: 14px;
  font-size: clamp(26px, 3.6vw, 40px);
  font-weight: 700;
  line-height: 1.08;
  letter-spacing: -0.035em;
  color: #fff;
}
.temps-texte {
  margin-top: 16px;
  max-width: 460px;
  font-size: clamp(15px, 1.4vw, 16.5px);
  line-height: 1.62;
  color: rgba(255, 255, 255, 0.78);
}
.temps-preuve {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  margin-top: 20px;
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.05);
  padding: 5px 10px;
  font-size: 13.5px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.6);
}

/* ── Jauge ─────────────────────────────────────────────────────────────── */

.jauge {
  display: flex;
  gap: 6px;
  margin-top: 40px;
  max-width: 320px;
}
.jauge-part {
  position: relative;
  height: 2px;
  flex: 1;
  overflow: hidden;
  border-radius: 2px;
  background: rgba(255, 255, 255, 0.12);
}
.jauge-faite {
  background: rgba(240, 180, 84, 0.55);
}
.jauge-remplissage {
  position: absolute;
  inset: 0;
  transform-origin: left;
  background: #f0b454;
}

/* ── Colonne mark ──────────────────────────────────────────────────────── */

.colonne-mark {
  position: relative;
  display: grid;
  place-items: center;
}
.mark-etat {
  position: absolute;
  bottom: -46px;
  font-size: 11.5px;
  letter-spacing: 0.02em;
  color: rgba(255, 255, 255, 0.6);
}

/**
 * Le halo prend la couleur du temps. C'est le seul endroit de la page où la
 * couleur porte une information : ambre quand elle travaille, rouge quand elle
 * signale, vert quand la main vous revient.
 */
.halo {
  position: absolute;
  width: 420px;
  height: 420px;
  border-radius: 50%;
  filter: blur(12px);
  pointer-events: none;
  transition: background 900ms var(--ease-out-expo, ease-out);
}
.halo-idle,
.halo-think {
  background: radial-gradient(circle, rgba(230, 152, 44, 0.17), transparent 62%);
}
.halo-alert {
  background: radial-gradient(circle, rgba(181, 69, 69, 0.2), transparent 62%);
}
.halo-success {
  background: radial-gradient(circle, rgba(90, 150, 100, 0.18), transparent 62%);
}

.onde {
  position: absolute;
  width: 330px;
  height: 330px;
  border-radius: 50%;
  border: 1px solid rgba(255, 255, 255, 0.06);
  pointer-events: none;
}

/* ── Mobile ────────────────────────────────────────────────────────────── */

@media (max-width: 767px) {
  .colonne-mark {
    display: none; /* 240 px de mark mangeraient le texte sur un téléphone. */
  }
  .scene-raisonne {
    height: 420vh;
  }
  .pile {
    /* Rien à forcer : la grille s'occupe de la hauteur, ici comme ailleurs. */
  }
}

/**
 * Mouvement réduit : la scène ne s'épingle plus. Le composable ne branche
 * aucun écouteur, `etape` reste à 0 — sans ce bloc, on n'afficherait que le
 * premier temps sur cinq écrans de vide. Ici tout redevient un empilement
 * ordinaire, les quatre temps lisibles à la suite.
 */
@media (prefers-reduced-motion: reduce) {
  .scene-raisonne {
    height: auto;
    padding: 80px 0;
  }
  .collant {
    position: static;
    height: auto;
  }
  .temps {
    grid-area: auto;
  }
  .temps {
    position: static;
    opacity: 1;
    transform: none;
    transition: none;
    padding: 28px 0;
    border-top: 1px solid rgba(255, 255, 255, 0.08);
  }
  .compteur,
  .jauge,
  .colonne-mark {
    display: none;
  }
}
</style>
