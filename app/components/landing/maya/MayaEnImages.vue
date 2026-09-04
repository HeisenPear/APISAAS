<!--
  ACTE II — « En images ». Les quatre écrans d'APIGO, en une seule scène.

  ─── POURQUOI UNE SCÈNE ET NON QUATRE BLOCS ────────────────────────────────
  Ces quatre écrans vivaient sur la page d'accueil, en quatre pavés
  texte/maquette alternés. Déplacés tels quels dans /maya, le premier — « Maya
  répond, et agit » — répétait mot pour mot ce que trois chapitres venaient
  d'expliquer. C'est la redondance qu'on voulait éviter.

  La réponse n'est pas de couper du texte : c'est de changer de forme. Quatre
  pavés qui se suivent sont quatre fois la même chose ; UNE scène qui change
  quatre fois d'état est un seul objet qu'on regarde vivre. Le cadre reste
  collé, l'écran se remplace dedans, le récit avance à côté.

  ⚠️ LE MÉCANISME EST CELUI DE `MayaRaisonne`, IMPORTÉ, PAS RECOPIÉ.
  `useSceneEpinglee` porte déjà la plomberie navigateur (garde rAF, respect du
  mouvement réduit, rien au rendu serveur) et `sceneDefilement` porte
  l'arithmétique, testée à part. Une seconde implémentation aurait divergé — et
  la façon dont une scène épinglée casse est muette : un ancêtre en
  `overflow: hidden` et `position: sticky` cesse de coller, sans une erreur.

  ─── CE QUE LA SCÈNE DIT SANS LE DIRE ──────────────────────────────────────
  L'ordre n'est pas décoratif. Les deux premiers écrans sont ceux où Maya
  travaille — elle parle à la première personne, sa marque est là. Les deux
  derniers sont ceux où elle s'efface, et la page l'écrit noir sur blanc
  (« Ça, je n'y touche pas »). Un visiteur comprend seul où s'arrête le
  copilote. C'est l'inverse exact du réflexe qui a produit neuf affirmations
  fausses sur la page d'accueil : ici, la limite est le sujet.
-->
<template>
  <section id="en-images" ref="scene" class="scene-images">
    <div class="collant">
      <div class="mx-auto grid w-full max-w-6xl gap-10 px-5 sm:px-6 lg:grid-cols-2 lg:gap-16">
        <!-- ── Colonne récit ─────────────────────────────────────────── -->
        <div class="recit">
          <p class="acte">Acte II · En images</p>

          <div class="compteur" aria-hidden="true">
            <span class="compteur-actif">{{ etape + 1 }}</span>
            <span class="compteur-total">/ {{ ORDRE_ECRANS.length }}</span>
          </div>

          <!-- La pile : les quatre récits occupent la MÊME case de grille, un
               seul est visible. Sans la pile, la colonne prendrait la hauteur du
               plus long et les autres flotteraient au milieu du vide. -->
          <div class="pile">
            <article
              v-for="(id, i) in ORDRE_ECRANS"
              :key="id"
              class="temps"
              :class="{ 'temps-actif': i === etape, 'temps-passe': i < etape }"
              :aria-hidden="!empile && i !== etape"
              :inert="!empile && i !== etape"
            >
              <p class="surtitre" :class="{ 'surtitre-retrait': !ECRANS_APIGO[id].maya }">
                <IaMayaMark v-if="ECRANS_APIGO[id].maya" :size="20" state="idle" />
                <UIcon v-else :name="ECRANS_APIGO[id].icone" class="h-4 w-4" aria-hidden="true" />
                {{ ECRANS_APIGO[id].surtitre }}
              </p>

              <h3 class="titre">{{ ECRANS_APIGO[id].titre }}</h3>
              <p class="texte">{{ ECRANS_APIGO[id].texte }}</p>

              <ul class="points">
                <li v-for="pt in ECRANS_APIGO[id].points" :key="pt">
                  <UIcon name="i-lucide-check" class="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                  {{ pt }}
                </li>
              </ul>

              <NuxtLink :to="ECRANS_APIGO[id].lien.to" class="lien">
                {{ ECRANS_APIGO[id].lien.texte }}
                <UIcon name="i-lucide-arrow-right" class="h-3.5 w-3.5" aria-hidden="true" />
              </NuxtLink>
            </article>
          </div>

          <!-- La jauge : quatre traits, celui du temps courant se remplit au
               défilement. C'est le seul repère qui dit « il reste trois écrans »
               sans écrire une phrase pour le dire. -->
          <ol class="jauge" aria-hidden="true">
            <li v-for="(id, i) in ORDRE_ECRANS" :key="id" :class="{ 'jauge-faite': i < etape }">
              <span
                v-if="i === etape"
                class="jauge-remplie"
                :style="{ width: `${dansEtape * 100}%` }"
              />
            </li>
          </ol>
        </div>

        <!-- ── Colonne écran ─────────────────────────────────────────── -->
        <div class="colonne-ecran">
          <span class="lueur" aria-hidden="true" />
          <div class="pile pile-ecran">
            <div
              v-for="(id, i) in ORDRE_ECRANS"
              :key="id"
              class="ecran"
              :class="{ 'ecran-actif': i === etape }"
              :data-ecran="id"
              :aria-hidden="!empile && i !== etape"
              :inert="!empile && i !== etape"
            >
              <LandingMayaEcranApigo :id="id" />
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ECRANS_APIGO, ORDRE_ECRANS } from '~/config/ecrans-apigo';

const scene = ref<HTMLElement>();
/**
 * 1024 : LA MÊME VALEUR QUE LE `@media (max-width: 1023px)` plus bas. Le CSS
 * décide de l'empilement, le composable doit dire la même chose — sans quoi il
 * marquerait `aria-hidden` des contenus que le CSS affiche.
 */
const { etape, dansEtape, empile } = useSceneEpinglee(scene, ORDRE_ECRANS.length, 1024);
</script>

<style scoped>
/* ═══════════════════════════════════════════════════════════════════════════
   L'acte II est SOMBRE, et ce n'est pas une préférence.

   L'acte I se termine sur « Ses limites », en fond clair. Passer au sombre
   marque la bascule sans qu'aucun titre n'ait à l'annoncer — et les quatre
   maquettes, elles, sont claires : sur ce fond elles s'allument comme des
   écrans d'appareil. C'est le seul endroit de la page où le produit se regarde
   au lieu de s'expliquer.
   ═══════════════════════════════════════════════════════════════════════════ */
.scene-images {
  position: relative;
  height: 460vh;
  background: #17150f;
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

.acte {
  margin-bottom: 16px;
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
  margin-bottom: 22px;
  font-variant-numeric: tabular-nums;
}
.compteur-actif {
  font-size: 34px;
  font-weight: 700;
  line-height: 1;
  letter-spacing: -0.04em;
  color: #f0b454;
}
.compteur-total {
  font-size: 15px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.6);
}

/* La pile : tous les enfants dans la même case, donc superposés. */
.pile {
  display: grid;
}
.pile > * {
  grid-area: 1 / 1;
}

.temps {
  opacity: 0;
  transform: translate3d(0, 14px, 0);
  transition:
    opacity 520ms var(--ease-out-expo),
    transform 520ms var(--ease-out-expo);
  pointer-events: none;
}
.temps-actif {
  opacity: 1;
  transform: none;
  pointer-events: auto;
}
/* Un temps déjà passé sort par le HAUT : le sens de lecture reste cohérent
   quand on remonte la page. */
.temps-passe {
  transform: translate3d(0, -14px, 0);
}

.surtitre {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  font-size: 13.5px;
  font-weight: 700;
  color: #f0b454;
}
/* Quand Maya s'efface, le sur-titre s'efface avec elle : il perd le miel et
   passe en gris. La page ne dit pas seulement « je n'y touche pas », elle le
   MONTRE — c'est le seul moment où l'accent du produit disparaît. */
.surtitre-retrait {
  color: rgba(255, 255, 255, 0.6);
}

.titre {
  font-size: 27px;
  font-weight: 700;
  line-height: 1.15;
  letter-spacing: -0.025em;
  color: #fff;
}
.texte {
  margin-top: 14px;
  max-width: 30em;
  font-size: 15px;
  line-height: 1.65;
  color: rgba(255, 255, 255, 0.78);
}

.points {
  margin-top: 18px;
  display: flex;
  flex-direction: column;
  gap: 9px;
}
.points li {
  display: flex;
  align-items: flex-start;
  gap: 9px;
  font-size: 13.5px;
  color: rgba(255, 255, 255, 0.78);
}
.points svg,
.points .iconify {
  margin-top: 3px;
  color: #f0b454;
}

.lien {
  margin-top: 22px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 13.5px;
  font-weight: 600;
  color: #f0b454;
  transition: gap var(--duration-base) var(--ease-out-expo);
}
.lien:hover {
  gap: 11px;
}

.jauge {
  margin-top: 34px;
  display: flex;
  gap: 7px;
}
.jauge li {
  position: relative;
  height: 2px;
  width: 44px;
  overflow: hidden;
  border-radius: 2px;
  background: rgba(255, 255, 255, 0.16);
}
.jauge-faite {
  background: #f0b454;
}
.jauge-remplie {
  position: absolute;
  inset: 0 auto 0 0;
  display: block;
  background: #f0b454;
}

/* ── Colonne écran ─────────────────────────────────────────────────────── */

.colonne-ecran {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}
/* La lueur derrière l'écran : ce qui fait qu'une maquette claire posée sur du
   noir se lit comme un appareil allumé, et non comme un rectangle collé. */
.lueur {
  position: absolute;
  height: 460px;
  width: 460px;
  border-radius: 9999px;
  background: radial-gradient(circle, rgba(245, 166, 35, 0.16), transparent 66%);
  pointer-events: none;
}
.pile-ecran {
  position: relative;
  width: 100%;
}
.ecran {
  opacity: 0;
  transform: translate3d(0, 18px, 0) scale(0.975);
  transition:
    opacity 560ms var(--ease-out-expo),
    transform 560ms var(--ease-out-expo);
  pointer-events: none;
}
.ecran-actif {
  opacity: 1;
  transform: none;
  pointer-events: auto;
}

/* ── Téléphone ─────────────────────────────────────────────────────────── */

@media (max-width: 1023px) {
  /**
   * ⚠️ PAS D'ÉPINGLE SOUS 1024 px, et surtout PAS de colonne masquée.
   *
   * `MayaRaisonne` peut cacher sa colonne d'illustration sur un téléphone : ce
   * qu'elle montre est une marque, un ornement. Ici l'écran EST le propos —
   * l'acte s'appelle « En images ». Le masquer laisserait quatre paragraphes
   * qui décrivent des captures que personne ne voit.
   *
   * La scène redevient donc un empilement : chaque temps sous son écran, à la
   * suite. C'est exactement la mise en page d'origine sur la page d'accueil, et
   * elle était bonne — le grand format n'apporte quelque chose qu'à partir du
   * moment où l'on a deux colonnes à tenir côte à côte.
   */
  .scene-images {
    height: auto;
    padding: 72px 0;
  }
  .collant {
    position: static;
    height: auto;
    overflow: visible;
  }
  .compteur,
  .jauge {
    display: none;
  }
  .pile,
  .pile-ecran {
    display: block;
  }
  .temps,
  .ecran {
    opacity: 1;
    transform: none;
    transition: none;
    pointer-events: auto;
  }
  .temps {
    margin-bottom: 26px;
  }
  .ecran {
    margin-bottom: 64px;
  }
  .lueur {
    display: none;
  }
}

/**
 * Mouvement réduit : le composable ne branche aucun écouteur, `etape` reste à
 * 0. Sans ce bloc on afficherait le PREMIER écran seul sur quatre écrans et
 * demi de vide, et les trois autres resteraient invisibles pour toujours —
 * pas une animation en moins, du contenu en moins.
 */
@media (prefers-reduced-motion: reduce) {
  .scene-images {
    height: auto;
    padding: 72px 0;
  }
  .collant {
    position: static;
    height: auto;
    overflow: visible;
  }
  .compteur,
  .jauge {
    display: none;
  }
  .pile,
  .pile-ecran {
    display: block;
  }
  .temps,
  .ecran {
    opacity: 1;
    transform: none;
    transition: none;
    pointer-events: auto;
  }
  .temps {
    margin-bottom: 26px;
  }
  .ecran {
    margin-bottom: 64px;
  }
}
</style>
