<template>
  <div class="wma">
    <!-- Onglets -->
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

    <!-- Score prédictif IA -->
    <div v-if="tab === 'ia'" class="wma-pane">
      <div class="wma-ia">
        <div class="wma-ring">
          <svg viewBox="0 0 80 80" width="74" height="74">
            <circle cx="40" cy="40" r="33" fill="none" stroke="#eee9df" stroke-width="8" />
            <circle
              cx="40"
              cy="40"
              r="33"
              fill="none"
              stroke="var(--honey)"
              stroke-width="8"
              stroke-linecap="round"
              stroke-dasharray="207"
              stroke-dashoffset="37"
              transform="rotate(-90 40 40)"
            />
          </svg>
          <span class="wma-ring-v">8,2<i>/10</i></span>
        </div>
        <div class="wma-ia-info">
          <p class="wma-ia-t">Score santé global du cheptel</p>
          <p class="wma-ia-s">
            Calculé sur vos 38 dernières visites : varroa, force des colonies, couvain, réserves.
          </p>
        </div>
      </div>
      <div class="wma-list">
        <button v-for="r in predictions" :key="r.id" class="wma-row" @click="focusRuche = r.id">
          <span class="wma-row-dot" :style="`background:${r.color}`" />
          <span class="wma-row-main">
            <b>{{ r.id }} — {{ r.label }}</b>
            <span>{{ r.detail }}</span>
          </span>
          <span class="wma-row-score" :style="`color:${r.color}`">{{ r.score }}</span>
        </button>
      </div>
      <div class="wma-sugg">
        <span>💡</span>
        <span
          ><b>Suggestion IA :</b> planifier un traitement varroa sur R-12 sous 7 jours — risque
          d'infestation à 78 % d'ici fin mai.</span
        >
      </div>
    </div>

    <!-- Rentabilité -->
    <div v-else-if="tab === 'renta'" class="wma-pane">
      <div class="wma-kpis">
        <div class="wma-kpi">
          <span class="wma-kpi-v">2 740 €</span><span class="wma-kpi-l">Résultat net 2025</span>
        </div>
        <div class="wma-kpi">
          <span class="wma-kpi-v">13,9 €</span><span class="wma-kpi-l">Coût / kg produit</span>
        </div>
        <div class="wma-kpi">
          <span class="wma-kpi-v" style="color: #4f6a4c">80 %</span
          ><span class="wma-kpi-l">Marge brute</span>
        </div>
      </div>
      <p class="wma-sub">Rentabilité par rucher · cliquez une barre</p>
      <div class="wma-bars">
        <button
          v-for="b in rentabilite"
          :key="b.nom"
          class="wma-bar-row"
          :class="{ sel: focusBar === b.nom }"
          @click="focusBar = b.nom"
        >
          <span class="wma-bar-label">{{ b.nom }}</span>
          <span class="wma-bar-track">
            <span class="wma-bar-fill" :style="`width:${b.pct}%`" />
          </span>
          <span class="wma-bar-val">{{ b.valeur }}</span>
        </button>
      </div>
      <div v-if="barDetail" class="wma-sugg neutral">
        <span>📊</span>
        <span
          ><b>{{ barDetail.nom }} :</b> {{ barDetail.note }}</span
        >
      </div>
    </div>

    <!-- Comparaison saisons -->
    <div v-else class="wma-pane">
      <div class="wma-saisons-head">
        <p class="wma-sub" style="margin: 0">Production mensuelle — 2024 vs 2025</p>
        <span class="wma-badge-up">+12 % vs N-1</span>
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
        <span><i class="prev" /> 2024</span>
        <span><i class="curr" /> 2025</span>
      </div>
      <div class="wma-sugg neutral">
        <span>🌦</span>
        <span
          ><b>Corrélation météo :</b> les 9 jours de pluie de mai 2024 avaient coûté ≈ 18 % de
          récolte en juin. 2025 confirme la tendance inverse.</span
        >
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
type Tab = 'ia' | 'renta' | 'saisons';
const tab = ref<Tab>('ia');
const focusRuche = ref<string | null>(null);
const focusBar = ref<string>('Rucher du Moulin');

const tabs: { id: Tab; label: string }[] = [
  { id: 'ia', label: 'Score prédictif IA' },
  { id: 'renta', label: 'Rentabilité' },
  { id: 'saisons', label: 'Saisons' },
];

const predictions = [
  {
    id: 'R-12',
    label: 'Risque varroa',
    detail: 'Infestation probable à 78 % sous 15 jours',
    score: '4,1',
    color: '#dc2626',
  },
  {
    id: 'R-07',
    label: 'Population en baisse',
    detail: 'Tendance −12 % sur 3 visites — surveiller la reine (2023)',
    score: '6,3',
    color: '#a86a13',
  },
  {
    id: 'R-08',
    label: 'Excellente dynamique',
    detail: 'Forte miellée attendue · reine 2025 très active',
    score: '9,4',
    color: '#4f6a4c',
  },
];

const rentabilite = [
  { nom: 'Rucher du Moulin', valeur: '1 840 €', pct: 100, note: '8 ruches · 162 kg · 11,3 €/kg' },
  { nom: 'Rucher des Tilleuls', valeur: '900 €', pct: 49, note: '6 ruches · 85 kg · 16,2 €/kg' },
];

const barDetail = computed(() => rentabilite.find((b) => b.nom === focusBar.value));

const saisons = [
  { mois: 'Avr', prev: 28, curr: 34 },
  { mois: 'Mai', prev: 38, curr: 52 },
  { mois: 'Juin', prev: 52, curr: 44 },
  { mois: 'Juil', prev: 58, curr: 68 },
  { mois: 'Août', prev: 70, curr: 80 },
  { mois: 'Sept', prev: 88, curr: 100 },
];
</script>

<style scoped>
.wma {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.wma-tabs {
  display: flex;
  gap: 4px;
  background: var(--surface-muted);
  border-radius: 10px;
  padding: 3px;
  width: fit-content;
}
.wma-tab {
  padding: 5px 12px;
  border-radius: 8px;
  border: none;
  background: none;
  font-size: 11.5px;
  font-weight: 600;
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
  gap: 10px;
}
.wma-ia {
  display: flex;
  align-items: center;
  gap: 14px;
  background: #fff;
  border: 1px solid var(--border-default);
  border-radius: 14px;
  padding: 12px 14px;
}
.wma-ring {
  position: relative;
  width: 74px;
  height: 74px;
  flex-shrink: 0;
}
.wma-ring-v {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 17px;
  font-weight: 700;
  color: var(--text-primary);
}
.wma-ring-v i {
  font-style: normal;
  font-size: 10px;
  color: var(--text-tertiary);
  margin-left: 1px;
}
.wma-ia-t {
  font-size: 13px;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
}
.wma-ia-s {
  font-size: 11px;
  color: var(--text-tertiary);
  margin: 3px 0 0;
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
  border: none;
  border-bottom: 1px solid var(--border-default);
  background: none;
  cursor: pointer;
  text-align: left;
  transition: background 0.15s;
}
.wma-row:hover {
  background: var(--surface-muted);
}
.wma-row:last-child {
  border-bottom: none;
}
.wma-row-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
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
.wma-row-score {
  font-size: 13px;
  font-weight: 700;
}
.wma-sugg {
  display: flex;
  gap: 9px;
  align-items: flex-start;
  background: color-mix(in srgb, var(--honey) 10%, #fff);
  border: 1px solid color-mix(in srgb, var(--honey) 30%, transparent);
  border-radius: 11px;
  padding: 9px 11px;
  font-size: 11px;
  color: var(--text-secondary);
  line-height: 1.45;
}
.wma-sugg.neutral {
  background: var(--surface-muted);
  border-color: var(--border-default);
}
.wma-sugg b {
  color: var(--text-primary);
}
.wma-kpis {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}
.wma-kpi {
  background: #fff;
  border: 1px solid var(--border-default);
  border-radius: 12px;
  padding: 10px 12px;
  display: flex;
  flex-direction: column;
}
.wma-kpi-v {
  font-size: 17px;
  font-weight: 700;
  letter-spacing: -0.02em;
  color: var(--text-primary);
}
.wma-kpi-l {
  font-size: 10px;
  color: var(--text-tertiary);
  margin-top: 2px;
}
.wma-sub {
  font-size: 10.5px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--text-tertiary);
  margin: 0;
}
.wma-bars {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.wma-bar-row {
  display: grid;
  grid-template-columns: 120px 1fr 56px;
  align-items: center;
  gap: 10px;
  padding: 7px 10px;
  border: 1px solid var(--border-default);
  border-radius: 10px;
  background: #fff;
  cursor: pointer;
  transition: all 0.15s;
}
.wma-bar-row.sel {
  border-color: var(--honey);
  background: color-mix(in srgb, var(--honey) 6%, #fff);
}
.wma-bar-label {
  font-size: 11.5px;
  font-weight: 600;
  color: var(--text-primary);
  text-align: left;
}
.wma-bar-track {
  height: 8px;
  border-radius: 99px;
  background: var(--surface-muted);
  overflow: hidden;
}
.wma-bar-fill {
  display: block;
  height: 100%;
  border-radius: 99px;
  background: linear-gradient(90deg, var(--honey), #e8930c);
}
.wma-bar-val {
  font-size: 12px;
  font-weight: 700;
  color: var(--text-primary);
  text-align: right;
}
.wma-saisons-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.wma-badge-up {
  font-size: 10.5px;
  font-weight: 700;
  background: #eef2eb;
  color: #4f6a4c;
  border-radius: 99px;
  padding: 3px 9px;
}
.wma-chart {
  display: flex;
  align-items: flex-end;
  gap: 10px;
  height: 110px;
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
.wma-chart-x {
  font-size: 9.5px;
  color: var(--text-tertiary);
  margin-top: 4px;
}
.wma-legend {
  display: flex;
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
</style>
