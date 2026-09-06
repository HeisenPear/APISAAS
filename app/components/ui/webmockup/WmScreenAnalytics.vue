<!--
  ÉCRAN ANALYTICS SIMULÉ — il doit montrer /analytics, pas une idée de /analytics.

  ⚠️ CETTE MAQUETTE ÉTAIT LA PLUS INVENTÉE DU DÉPÔT. Elle affichait :
    · un onglet « Score prédictif IA » — le prédictif vit sur la FICHE RUCHE
      (`app/components/ruches/PredictionSante.vue`), pas dans Analytics ;
    · des notes sur 10 — `server/utils/santeScore.ts` borne à `clamp(n, 0, 100)`,
      le produit note sur CENT partout ;
    · « infestation probable à 78 % sous 15 jours » — `santePredictive.ts` ne
      calcule AUCUNE probabilité : il rend un `scorePrediction30j` (0–100), une
      `tendance`, des `risques` et une `urgence`. Ce pourcentage n'existe nulle
      part et ne pourra jamais être tenu ;
    · « Marge brute 80 % » — la vraie carte s'appelle « Marge estimée » et
      s'exprime en euros (valorisation − coûts).

  CE QUE MONTRE VRAIMENT `app/pages/analytics/index.vue` :
    bandeau Production miel (kg) · Chiffre d'affaires (€) · Prix moyen (€/kg) ·
    Marge estimée (€), puis cinq sections numérotées —
      01 Rentabilité par rucher      (`AnalyticsRentabiliteRuchers`)
      02 Comparaison entre saisons   (`AnalyticsComparaisonSaisons`)
      03 Météo & production          (`AnalyticsMeteoCorrelation`)
      04 Analyse pluriannuelle       (badge Expert, `UiFeatureGate`)
      05 Activité & actions          (+ Suggestions d'actions)

  Les onglets compriment les sections 01/02/03 dans le cadre de la maquette ;
  leurs libellés sont ceux de la vraie page. Les chiffres restent des exemples,
  mais des exemples COHÉRENTS : prix moyen = CA ÷ production, valorisation =
  production × prix moyen, marge = valorisation − coûts.

  Gardé par `tests/unit/app/components/maquettesFideles.test.ts`.
-->
<template>
  <div class="wma">
    <!-- Bandeau KPI — les quatre cartes du haut de /analytics -->
    <div class="wma-kpis">
      <div v-for="k in kpis" :key="k.libelle" class="wma-kpi">
        <span class="wma-kpi-l">{{ k.libelle }}</span>
        <span class="wma-kpi-v"
          >{{ k.valeur }}<i>{{ k.unite }}</i></span
        >
        <span class="wma-kpi-d" :class="k.ton">{{ k.note }}</span>
      </div>
    </div>

    <!-- Onglets = les sections 01 · 02 · 03 de la vraie page -->
    <div class="wma-tabs">
      <button
        v-for="t in tabs"
        :key="t.id"
        class="wma-tab"
        :class="{ active: tab === t.id }"
        @click="tab = t.id"
      >
        {{ t.label }}
      </button>
    </div>

    <!-- 01 — Rentabilité par rucher -->
    <div v-if="tab === 'renta'" class="wma-pane">
      <div v-for="(r, i) in ruchers" :key="r.nom" class="wma-rucher" :class="{ top: i === 0 }">
        <div class="wma-rucher-hd">
          <div class="wma-rucher-id">
            <span v-if="i === 0" class="wma-top">Top</span>
            <span class="wma-rucher-nom">{{ r.nom }}</span>
            <span class="wma-rucher-sub">{{ r.nbRuches }} ruches</span>
          </div>
          <div class="wma-rucher-kg">
            <span class="wma-rucher-kgv">{{ r.kgParRuche }}<i>kg/ruche</i></span>
            <span class="wma-rucher-sub">{{ r.productionKg }} kg au total</span>
          </div>
        </div>
        <span class="wma-bar-track">
          <span
            class="wma-bar-fill"
            :class="{ sage: i > 0 }"
            :style="`width:${Math.max(3, (r.kgParRuche / maxKgParRuche) * 100)}%`"
          />
        </span>
        <div class="wma-rucher-eco">
          <span
            >Valorisation <b>{{ r.valorisation }} €</b></span
          >
          <span
            >Marge estimée <b class="pos">{{ r.marge }} €</b></span
          >
        </div>
      </div>
      <p class="wma-note">
        kg/ruche = donnée réelle issue de vos récoltes. Valorisation & marge sont estimées
        (production × {{ prixMoyenKg }} €/kg, coûts répartis au prorata).
      </p>
    </div>

    <!-- 02 — Comparaison entre saisons -->
    <div v-else-if="tab === 'saisons'" class="wma-pane">
      <div class="wma-saisons-head">
        <p class="wma-sub">Production mensuelle — {{ anneeN1 }} vs {{ anneeN }}</p>
        <span class="wma-badge-up">▲ +{{ deltaProductionPct }}% vs {{ anneeN1 }}</span>
      </div>
      <div class="wma-chart">
        <div v-for="m in saisons" :key="m.mois" class="wma-chart-g">
          <div class="wma-chart-bars">
            <span class="wma-cbar prev" :style="`height:${m.prev}%`" />
            <span class="wma-cbar curr" :style="`height:${m.curr}%`" />
          </div>
          <span class="wma-chart-x">{{ m.mois }}</span>
        </div>
      </div>
      <div class="wma-legend">
        <span><i class="prev" /> {{ anneeN1 }}</span>
        <span><i class="curr" /> {{ anneeN }}</span>
      </div>
      <div class="wma-totaux">
        <div>
          <p class="wma-totaux-a">{{ anneeN }}</p>
          <p class="wma-totaux-v">{{ productionN }} kg</p>
        </div>
        <div>
          <p class="wma-totaux-a">{{ anneeN1 }}</p>
          <p class="wma-totaux-v prev">{{ productionN1 }} kg</p>
        </div>
      </div>
    </div>

    <!-- 03 — Météo & production -->
    <div v-else class="wma-pane">
      <div class="wma-correl">
        <div class="wma-coef">
          <span class="wma-coef-v">+0,72</span>
          <span class="wma-coef-l">r</span>
        </div>
        <div>
          <p class="wma-correl-t">Corrélation forte</p>
          <p class="wma-correl-s">
            Vos meilleures récoltes tombent sur les mois les plus chauds et ensoleillés (corrélation
            forte +0,72). La météo explique largement vos écarts de production.
          </p>
        </div>
      </div>
      <div class="wma-chart">
        <div v-for="m in saisons" :key="m.mois" class="wma-chart-g">
          <div class="wma-chart-bars">
            <span class="wma-cbar curr large" :style="`height:${m.curr}%`" />
            <span class="wma-cbar favo" :style="`height:${m.favo}%`" />
          </div>
          <span class="wma-chart-x">{{ m.mois }}</span>
        </div>
      </div>
      <div class="wma-legend">
        <span><i class="curr" /> Production (kg)</span>
        <span><i class="favo" /> Favorabilité météo (/100)</span>
      </div>
    </div>

    <!-- 05 — Suggestions d'actions (toujours visible, comme sur la page) -->
    <div class="wma-sugg-bloc">
      <div class="wma-sugg-hd">
        <p class="wma-sub">Suggestions d'actions</p>
        <div class="wma-pills">
          <span class="wma-pill urgente">1 urgente</span>
          <span class="wma-pill attention">2 attention</span>
        </div>
      </div>
      <div class="wma-list">
        <div v-for="s in suggestions" :key="s.titre" class="wma-row" :class="s.type">
          <span class="wma-row-dot" />
          <span class="wma-row-main">
            <b>{{ s.titre }}</b>
            <span>{{ s.detail }}</span>
          </span>
          <span class="wma-row-lien">Ruche {{ s.ruche }} →</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
type Tab = 'renta' | 'saisons' | 'meteo';
const tab = ref<Tab>('renta');

/** Les onglets portent le nom des sections 01 · 02 · 03 de `/analytics`. */
const tabs: { id: Tab; label: string }[] = [
  { id: 'renta', label: 'Rentabilité' },
  { id: 'saisons', label: 'Saisons' },
  { id: 'meteo', label: 'Météo & production' },
];

// ─── Un jeu de chiffres COHÉRENT entre eux ────────────────────────────────
// production 247 kg · CA 2 740 € → prix moyen 11,1 €/kg (CA ÷ production)
// valorisation = production × 11,1 · coûts 980 € répartis au prorata des ruches
const anneeN = 2025;
const anneeN1 = 2024;
const productionN = 247;
const productionN1 = 220;
const prixMoyenKg = '11,1';
const deltaProductionPct = Math.round(((productionN - productionN1) / productionN1) * 100);

/** Format exact de `deltaInfo()` dans `app/pages/analytics/index.vue`. */
const delta = (pct: number): string => `▲ +${pct}% vs ${anneeN1}`;

const kpis = [
  {
    libelle: 'Production miel',
    valeur: String(productionN),
    unite: 'kg',
    note: delta(deltaProductionPct),
    ton: 'pos',
  },
  { libelle: "Chiffre d'affaires", valeur: '2 740', unite: '€', note: delta(9), ton: 'pos' },
  {
    libelle: 'Prix moyen',
    valeur: prixMoyenKg,
    unite: '€/kg',
    note: 'réalisé (CA ÷ prod.)',
    ton: '',
  },
  {
    libelle: 'Marge estimée',
    valeur: '1 762',
    unite: '€',
    note: 'valorisation − coûts',
    ton: 'pos',
  },
];

const ruchers = [
  {
    nom: 'Rucher des Acacias',
    nbRuches: 8,
    productionKg: 162,
    kgParRuche: 20.3,
    valorisation: '1 798',
    marge: '1 238',
  },
  {
    nom: 'Rucher des Tilleuls',
    nbRuches: 6,
    productionKg: 85,
    kgParRuche: 14.2,
    valorisation: '944',
    marge: '524',
  },
];
const maxKgParRuche = computed(() => Math.max(...ruchers.map((r) => r.kgParRuche)));

/**
 * `prev`/`curr` : production mensuelle N-1 / N (section 02).
 * `favo` : favorabilité météo du mois, /100 — c'est l'échelle réelle du
 * tooltip de `AnalyticsMeteoCorrelation` (« Favorabilité : X/100 »).
 */
const saisons = [
  { mois: 'Avr', prev: 28, curr: 34, favo: 41 },
  { mois: 'Mai', prev: 38, curr: 52, favo: 58 },
  { mois: 'Juin', prev: 52, curr: 44, favo: 49 },
  { mois: 'Juil', prev: 58, curr: 68, favo: 72 },
  { mois: 'Août', prev: 70, curr: 80, favo: 84 },
  { mois: 'Sept', prev: 88, curr: 100, favo: 91 },
];

/**
 * Trois suggestions telles que `server/api/analytics/suggestions.get.ts` les
 * produit — titres et détails repris mot pour mot du générateur.
 */
const suggestions = [
  {
    type: 'urgente',
    titre: 'Varroa critique',
    detail: 'Taux varroa : 7 — traitement urgent',
    ruche: '12',
  },
  {
    type: 'attention',
    titre: 'Visite en retard',
    detail: 'Pas de visite depuis 34 jours',
    ruche: '07',
  },
  {
    type: 'attention',
    titre: 'Reine non observée',
    detail: 'Vérifier la présence de la reine',
    ruche: '21',
  },
];
</script>

<style scoped>
.wma {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

/* ─── Bandeau KPI ─── */
.wma-kpis {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 8px;
}
.wma-kpi {
  background: #fff;
  border: 1px solid var(--border-default);
  border-radius: 12px;
  padding: 10px 12px;
  display: flex;
  flex-direction: column;
  min-width: 0;
}
.wma-kpi-l {
  font-size: 9px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--text-tertiary);
}
.wma-kpi-v {
  margin-top: 4px;
  font-size: 17px;
  font-weight: 700;
  letter-spacing: -0.02em;
  color: var(--text-primary);
  font-variant-numeric: tabular-nums;
}
.wma-kpi-v i {
  font-style: normal;
  font-size: 11px;
  font-weight: 400;
  color: var(--text-tertiary);
  margin-left: 2px;
}
.wma-kpi-d {
  margin-top: 2px;
  font-size: 9.5px;
  font-weight: 500;
  color: var(--text-tertiary);
}
.wma-kpi-d.pos {
  color: var(--sage-deep);
}

/* ─── Onglets ─── */
.wma-tabs {
  display: flex;
  gap: 4px;
  background: var(--surface-muted);
  border-radius: 10px;
  padding: 3px;
  width: fit-content;
  max-width: 100%;
  overflow: hidden;
}
.wma-tab {
  padding: 5px 12px;
  border-radius: 8px;
  border: none;
  background: none;
  font-size: 11.5px;
  font-weight: 600;
  white-space: nowrap;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.15s;
}
.wma-tab.active {
  background: #fff;
  color: var(--text-primary);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}
.wma-pane {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

/* ─── 01 Rentabilité par rucher ─── */
.wma-rucher {
  background: #fff;
  border: 1px solid var(--border-default);
  border-radius: 13px;
  padding: 10px 12px;
}
.wma-rucher.top {
  border-color: color-mix(in srgb, var(--honey) 50%, transparent);
  box-shadow: 0 0 0 1px color-mix(in srgb, var(--honey) 20%, transparent);
}
.wma-rucher-hd {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
}
.wma-rucher-id {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
  min-width: 0;
}
.wma-top {
  border-radius: 99px;
  background: var(--honey-soft);
  color: var(--honey-deep);
  font-size: 8.5px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: 2px 6px;
}
.wma-rucher-nom {
  font-size: 12.5px;
  font-weight: 600;
  color: var(--text-primary);
}
.wma-rucher-sub {
  font-size: 10.5px;
  color: var(--text-tertiary);
}
.wma-rucher-kg {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  flex-shrink: 0;
}
.wma-rucher-kgv {
  font-size: 15px;
  font-weight: 700;
  color: var(--text-primary);
  font-variant-numeric: tabular-nums;
}
.wma-rucher-kgv i {
  font-style: normal;
  font-size: 10px;
  font-weight: 400;
  color: var(--text-tertiary);
  margin-left: 3px;
}
.wma-bar-track {
  display: block;
  height: 6px;
  margin-top: 8px;
  border-radius: 99px;
  background: var(--surface-muted);
  overflow: hidden;
}
.wma-bar-fill {
  display: block;
  height: 100%;
  border-radius: 99px;
  background: linear-gradient(90deg, #f8bd54, #ec9914);
}
.wma-bar-fill.sage {
  background: var(--sage);
}
.wma-rucher-eco {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  margin-top: 8px;
  font-size: 10.5px;
  color: var(--text-tertiary);
}
.wma-rucher-eco b {
  font-weight: 600;
  color: var(--text-secondary);
}
.wma-rucher-eco b.pos {
  color: var(--sage-deep);
}
.wma-note {
  font-size: 9.5px;
  line-height: 1.5;
  color: var(--text-quaternary);
  margin: 0;
  padding: 0 2px;
}

/* ─── 02 Saisons ─── */
.wma-sub {
  font-size: 10.5px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--text-tertiary);
  margin: 0;
}
.wma-saisons-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  flex-wrap: wrap;
}
.wma-badge-up {
  font-size: 10.5px;
  font-weight: 700;
  background: #f9efe3;
  color: #7d5220;
  border-radius: 99px;
  padding: 3px 9px;
  white-space: nowrap;
}
.wma-chart {
  display: flex;
  align-items: flex-end;
  gap: 10px;
  height: 106px;
  background: #fff;
  border: 1px solid var(--border-default);
  border-radius: 12px;
  padding: 12px 14px 8px;
}
.wma-chart-g {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  height: 100%;
  min-width: 0;
}
.wma-chart-bars {
  flex: 1;
  width: 100%;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  gap: 3px;
}
.wma-cbar {
  width: 9px;
  border-radius: 3px 3px 0 0;
  transition: height 0.4s;
}
.wma-cbar.prev {
  background: #e3ded2;
}
.wma-cbar.curr {
  background: var(--honey);
}
.wma-cbar.large {
  width: 12px;
}
.wma-cbar.favo {
  width: 6px;
  background: var(--sage);
}
.wma-chart-x {
  font-size: 9.5px;
  color: var(--text-tertiary);
  margin-top: 4px;
}
.wma-legend {
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
  font-size: 10.5px;
  color: var(--text-tertiary);
}
.wma-legend i {
  display: inline-block;
  width: 9px;
  height: 9px;
  border-radius: 3px;
  margin-right: 4px;
}
.wma-legend i.prev {
  background: #e3ded2;
}
.wma-legend i.curr {
  background: var(--honey);
}
.wma-legend i.favo {
  background: var(--sage);
}
.wma-totaux {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
}
.wma-totaux > div {
  background: var(--surface-muted);
  border-radius: 10px;
  padding: 8px 10px;
}
.wma-totaux-a {
  font-size: 10.5px;
  color: var(--text-tertiary);
  margin: 0;
}
.wma-totaux-v {
  font-size: 15px;
  font-weight: 700;
  color: var(--text-primary);
  margin: 2px 0 0;
  font-variant-numeric: tabular-nums;
}
.wma-totaux-v.prev {
  color: var(--text-secondary);
}

/* ─── 03 Météo & production ─── */
.wma-correl {
  display: flex;
  gap: 11px;
  align-items: flex-start;
  background: var(--surface-muted);
  border-radius: 12px;
  padding: 11px 12px;
}
.wma-coef {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 46px;
  height: 46px;
  flex-shrink: 0;
  border-radius: 10px;
  background: var(--sage-deep);
  color: #fff;
}
.wma-coef-v {
  font-size: 12.5px;
  font-weight: 700;
  line-height: 1;
  font-variant-numeric: tabular-nums;
}
.wma-coef-l {
  margin-top: 2px;
  font-size: 8px;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  opacity: 0.9;
}
.wma-correl-t {
  font-size: 10.5px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--sage-deep);
  margin: 0;
}
.wma-correl-s {
  font-size: 11px;
  line-height: 1.45;
  color: var(--text-secondary);
  margin: 4px 0 0;
}

/* ─── 05 Suggestions d'actions ─── */
.wma-sugg-bloc {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.wma-sugg-hd {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  flex-wrap: wrap;
}
.wma-pills {
  display: flex;
  gap: 6px;
}
.wma-pill {
  border-radius: 99px;
  font-size: 10px;
  font-weight: 700;
  padding: 2px 8px;
  white-space: nowrap;
}
.wma-pill.urgente {
  background: var(--status-bad);
  color: #fff;
}
.wma-pill.attention {
  background: var(--honey-soft);
  color: var(--honey-deep);
}
.wma-list {
  background: #fff;
  border: 1px solid var(--border-default);
  border-radius: 12px;
  overflow: hidden;
}
.wma-row {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 8px 12px;
  border-bottom: 1px solid var(--border-default);
}
.wma-row:last-child {
  border-bottom: none;
}
.wma-row-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
  background: var(--honey);
}
.wma-row.urgente .wma-row-dot {
  background: var(--status-bad);
}
.wma-row-main {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0;
}
.wma-row-main b {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-primary);
}
.wma-row-main span {
  font-size: 10.5px;
  color: var(--text-tertiary);
}
.wma-row-lien {
  font-size: 11px;
  font-weight: 600;
  color: var(--honey-deep);
  white-space: nowrap;
  flex-shrink: 0;
}

@media (max-width: 720px) {
  .wma-kpis {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
