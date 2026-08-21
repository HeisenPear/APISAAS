<!--
  Une miniature de widget, pour le simulateur de la page d'accueil.

  POURQUOI CE COMPOSANT EXISTE. La grille montrait neuf rectangles portant un
  nom. « Santé du cheptel » écrit dans une boîte ne dit rien de ce que fait la
  carte ; la vraie affiche une jauge annulaire, un score sur 100 et le détail
  par rucher. Le visiteur voyait donc un plan de tableau de bord, pas un tableau
  de bord — et jugeait le produit sur ce plan.

  Chaque miniature reprend ici la STRUCTURE de son widget réel : mêmes formes,
  mêmes couleurs, même hiérarchie typographique, à l'échelle du simulateur.
  Les valeurs sont des exemples cohérents entre eux (48 ruches, 3 ruchers, une
  saison à 214 kg), pas des chiffres tirés au hasard : un visiteur qui compare
  deux cartes ne doit pas tomber sur une incohérence.

  ⚠️ CE N'EST PAS LE VRAI WIDGET. Monter les vrais composants ici déclencherait
  leurs `useFetch` — une rafale de requêtes authentifiées depuis une page
  publique, exactement le défaut relevé sur l'aperçu « Ajouter un widget ».
-->
<template>
  <div class="wm-mini">
    <!-- ══ Indicateur chiffré (KpiWidget) ══ -->
    <template v-if="w.genre === 'kpi'">
      <p class="mini-sur-titre">{{ w.nom }}</p>
      <p class="mini-chiffre">
        {{ w.valeur }}<span v-if="w.suffixe" class="mini-suffixe">{{ w.suffixe }}</span>
      </p>
      <p class="mini-sous">{{ w.sous }}</p>
    </template>

    <!-- ══ Santé du cheptel (SanteScore) : jauge annulaire + score par rucher ══ -->
    <template v-else-if="w.genre === 'sante'">
      <p class="mini-titre">{{ w.nom }}</p>
      <div class="mini-sante">
        <svg viewBox="0 0 44 44" class="mini-jauge" aria-hidden="true">
          <circle
            cx="22"
            cy="22"
            r="18"
            fill="none"
            stroke="var(--surface-muted)"
            stroke-width="5"
          />
          <circle
            cx="22"
            cy="22"
            r="18"
            fill="none"
            :stroke="couleurScore(w.score)"
            stroke-width="5"
            stroke-linecap="round"
            :stroke-dasharray="`${(w.score / 100) * PERIMETRE} ${PERIMETRE}`"
            transform="rotate(-90 22 22)"
          />
          <text x="22" y="25.5" text-anchor="middle" class="mini-jauge-val">{{ w.score }}</text>
        </svg>
        <div class="mini-ruchers">
          <div v-for="r in w.ruchers" :key="r.nom" class="mini-rucher">
            <span class="mini-rucher-nom">{{ r.nom }}</span>
            <span class="mini-barre">
              <span
                class="mini-barre-plein"
                :style="{ width: `${r.score}%`, background: couleurScore(r.score) }"
              />
            </span>
            <!--
              Le CHIFFRE reste neutre, la COULEUR vit sur la barre.

              Teinté au barème de santé, il tombait à 3,48:1 (bon) et 3,08:1
              (moyen) sur le crème, à 8,5 px — sous le seuil, et détecté par
              `npm run audit:mise-en-page`. Or les couleurs de statut sont
              calibrées pour des surfaces, pas pour du texte minuscule : la
              barre les porte à 3:1, seuil des éléments non textuels, et garde
              tout le signal. Le nombre n'avait qu'à être lisible.
            -->
            <span class="mini-rucher-val">{{ r.score }}</span>
          </div>
        </div>
      </div>
    </template>

    <!-- ══ Alertes à traiter (AlertsWidget) : pastille de compte + lignes ══ -->
    <template v-else-if="w.genre === 'alertes'">
      <p class="mini-titre">
        {{ w.nom }}
        <span class="mini-pastille">{{ w.lignes.length }}</span>
      </p>
      <div v-for="a in w.lignes" :key="a.texte" class="mini-alerte">
        <span class="mini-alerte-tuile" :style="{ background: fondPriorite(a.priorite) }">
          <span class="mini-alerte-point" :style="{ background: couleurPriorite(a.priorite) }" />
        </span>
        <span class="mini-alerte-texte">{{ a.texte }}</span>
      </div>
    </template>

    <!-- ══ Production (ProductionChart) : barres mensuelles + total ══ -->
    <template v-else-if="w.genre === 'barres'">
      <p class="mini-titre">
        {{ w.nom }}
        <span class="mini-total">{{ w.total }}</span>
      </p>
      <div class="mini-barres">
        <span
          v-for="(h, i) in w.valeurs"
          :key="i"
          class="mini-barre-v"
          :style="{ height: `${h}%` }"
        />
      </div>
      <div class="mini-axe">
        <span v-for="m in w.mois" :key="m">{{ m }}</span>
      </div>
    </template>

    <!-- ══ Balances connectées (BalancesWidget) : poids en direct + courbe ══ -->
    <template v-else-if="w.genre === 'balance'">
      <p class="mini-titre">{{ w.nom }}</p>
      <div class="mini-poids-ligne">
        <span class="mini-poids">{{ w.poids }}<span class="mini-suffixe"> kg</span></span>
        <span class="mini-delta">{{ w.delta }}</span>
      </div>
      <svg viewBox="0 0 100 26" preserveAspectRatio="none" class="mini-courbe" aria-hidden="true">
        <polyline :points="w.courbe" fill="none" stroke="var(--honey)" stroke-width="2.2" />
      </svg>
    </template>

    <!-- ══ Trésorerie (BudgetWidget) : recettes, dépenses, solde ══ -->
    <template v-else-if="w.genre === 'finance'">
      <p class="mini-titre">{{ w.nom }}</p>
      <div v-for="l in w.lignes" :key="l.libelle" class="mini-fin-ligne">
        <span class="mini-fin-point" :style="{ background: l.couleur }" />
        <span class="mini-fin-lib">{{ l.libelle }}</span>
        <span class="mini-fin-val" :style="{ color: l.couleur }">{{ l.montant }}</span>
      </div>
    </template>

    <!--
      ══ Activité récente (ActiviteWidget) : fil des dernières actions ══

      `v-else-if` et non `v-else` : un `v-else` attrape tout genre non prévu et
      le rend en fil d'activité, ce qui donne une carte plausible et fausse.
      Avec un test explicite, un genre oublié ne rend RIEN — un trou se voit,
      un mensonge non.
    -->
    <template v-else-if="w.genre === 'activite'">
      <p class="mini-titre">{{ w.nom }}</p>
      <div v-for="e in w.evenements" :key="e.texte" class="mini-fil">
        <span class="mini-fil-point" />
        <span class="mini-fil-texte">{{ e.texte }}</span>
        <span class="mini-fil-quand">{{ e.quand }}</span>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import type { WidgetMini } from './widgets-mini';

defineProps<{ w: WidgetMini }>();

/** r = 18 → 2πr. Sert à convertir un score sur 100 en longueur d'arc. */
const PERIMETRE = 2 * Math.PI * 18;

/** Le barème exact de SanteScore.vue — pas une approximation « qui fait joli ». */
function couleurScore(score: number): string {
  if (score >= 70) return 'var(--status-good)';
  if (score >= 40) return 'var(--status-warn)';
  return 'var(--status-bad)';
}

function couleurPriorite(p: 'haute' | 'moyenne'): string {
  return p === 'haute' ? 'var(--status-bad)' : 'var(--status-warn)';
}

function fondPriorite(p: 'haute' | 'moyenne'): string {
  return p === 'haute' ? 'var(--clay-soft)' : 'var(--honey-soft)';
}
</script>

<style scoped>
.wm-mini {
  display: flex;
  flex-direction: column;
  gap: 3px;
  min-width: 0;
}

/* ── Indicateur chiffré ─────────────────────────────────────────────── */
.mini-sur-titre {
  font-size: 8px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--text-tertiary);
}
.mini-chiffre {
  font-size: 21px;
  font-weight: 600;
  line-height: 1.05;
  font-variant-numeric: tabular-nums;
  color: var(--text-primary);
}
.mini-suffixe {
  font-size: 11px;
  font-weight: 500;
  color: var(--text-tertiary);
}
.mini-sous {
  font-size: 9px;
  color: var(--text-tertiary);
}

/* ── Titre commun aux cartes de contenu ─────────────────────────────── */
.mini-titre {
  display: flex;
  align-items: center;
  gap: 5px;
  margin-bottom: 3px;
  font-size: 10px;
  font-weight: 700;
  color: var(--text-primary);
}

/* ── Santé ──────────────────────────────────────────────────────────── */
.mini-sante {
  display: flex;
  align-items: center;
  gap: 8px;
}
.mini-jauge {
  width: 54px;
  height: 42px;
  flex-shrink: 0;
}
.mini-jauge-val {
  font-size: 12px;
  font-weight: 700;
  fill: var(--text-primary);
}
.mini-ruchers {
  display: flex;
  flex: 1;
  min-width: 0;
  flex-direction: column;
  gap: 4px;
}
.mini-rucher {
  display: flex;
  align-items: center;
  gap: 4px;
}
.mini-rucher-nom {
  width: 54px;
  flex-shrink: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 8.5px;
  color: var(--text-secondary);
}
.mini-barre {
  position: relative;
  height: 4px;
  flex: 1;
  overflow: hidden;
  border-radius: 999px;
  background: var(--surface-muted);
}
.mini-barre-plein {
  position: absolute;
  inset: 0 auto 0 0;
  border-radius: 999px;
}
.mini-rucher-val {
  width: 15px;
  flex-shrink: 0;
  text-align: right;
  font-size: 8.5px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  color: var(--text-secondary);
}

/* ── Alertes ────────────────────────────────────────────────────────── */
.mini-pastille {
  display: inline-flex;
  height: 13px;
  min-width: 13px;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  background: var(--status-bad);
  padding: 0 4px;
  font-size: 8px;
  font-weight: 800;
  color: #fff;
}
.mini-alerte {
  display: flex;
  align-items: center;
  gap: 5px;
  border-radius: 6px;
  background: var(--surface-muted);
  padding: 4px 5px;
}
.mini-alerte-tuile {
  display: flex;
  height: 13px;
  width: 13px;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
}
.mini-alerte-point {
  height: 5px;
  width: 5px;
  border-radius: 999px;
}
.mini-alerte-texte {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 9px;
  font-weight: 500;
  color: var(--text-primary);
}

/* ── Production ─────────────────────────────────────────────────────── */
.mini-total {
  margin-left: auto;
  font-size: 9.5px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  color: var(--honey-deep);
}
.mini-barres {
  display: flex;
  height: 34px;
  align-items: flex-end;
  gap: 3px;
}
.mini-barre-v {
  flex: 1;
  border-radius: 2px 2px 0 0;
  background: linear-gradient(180deg, var(--honey), color-mix(in srgb, var(--honey) 55%, #fff));
}
.mini-axe {
  display: flex;
  gap: 3px;
}
.mini-axe span {
  flex: 1;
  text-align: center;
  font-size: 7px;
  color: var(--text-tertiary);
}

/* ── Balances ───────────────────────────────────────────────────────── */
.mini-poids-ligne {
  display: flex;
  align-items: baseline;
  gap: 5px;
}
.mini-poids {
  font-size: 18px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  color: var(--text-primary);
}
.mini-delta {
  font-size: 9px;
  font-weight: 700;
  color: var(--honey-deep);
}
.mini-courbe {
  height: 24px;
  width: 100%;
}

/* ── Trésorerie ─────────────────────────────────────────────────────── */
.mini-fin-ligne {
  display: flex;
  align-items: center;
  gap: 5px;
}
.mini-fin-point {
  height: 5px;
  width: 5px;
  flex-shrink: 0;
  border-radius: 999px;
}
.mini-fin-lib {
  flex: 1;
  font-size: 9px;
  color: var(--text-secondary);
}
.mini-fin-val {
  font-size: 9.5px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}

/* ── Activité récente ───────────────────────────────────────────────── */
.mini-fil {
  display: flex;
  align-items: center;
  gap: 5px;
}
.mini-fil-point {
  height: 4px;
  width: 4px;
  flex-shrink: 0;
  border-radius: 999px;
  background: var(--honey);
}
.mini-fil-texte {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 9px;
  color: var(--text-primary);
}
.mini-fil-quand {
  flex-shrink: 0;
  font-size: 8px;
  color: var(--text-tertiary);
}
</style>
