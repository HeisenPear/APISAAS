<template>
  <div class="wms">
    <div class="wms-bar">
      <button
        v-for="f in filtres"
        :key="f.id"
        class="wms-pill"
        :class="{ active: filtre === f.id }"
        @click="filtre = f.id"
      >
        {{ f.label }}
      </button>
      <span class="wms-hint">Cliquez un lot pour sa traçabilité</span>
    </div>

    <div class="wms-list">
      <template v-for="p in produitsFiltres" :key="p.id">
        <button class="wms-row" :class="{ open: expanded === p.id }" @click="toggle(p.id)">
          <span class="wms-ic">{{ p.icon }}</span>
          <span class="wms-main">
            <b>{{ p.nom }}</b>
            <span>{{ p.detail }}</span>
          </span>
          <span v-if="p.alerte" class="wms-badge alert">Stock bas</span>
          <span v-else-if="p.lot" class="wms-badge lot">Lot {{ p.lot }}</span>
          <span class="wms-qte">{{ p.quantite }}</span>
          <span class="wms-chev" :class="{ down: expanded === p.id }">›</span>
        </button>

        <!-- Traçabilité du lot (drill-down) -->
        <div v-if="expanded === p.id && p.trace" class="wms-trace">
          <p class="wms-trace-t">Traçabilité du lot {{ p.lot }} — CE 178/2002</p>
          <div class="wms-steps">
            <div v-for="(s, i) in p.trace" :key="i" class="wms-step">
              <span class="wms-step-dot" :class="{ done: true }" />
              <span class="wms-step-main">
                <b>{{ s.etape }}</b>
                <span>{{ s.info }}</span>
              </span>
            </div>
          </div>
          <div class="wms-trace-foot">
            <span class="wms-badge dluo">DLUO {{ p.dluo }}</span>
            <span class="wms-trace-note">Relié aux ruches {{ p.ruches }}</span>
          </div>
        </div>
      </template>
    </div>

    <p class="wms-foot">
      Chaque lot est relié à ses ruches d'origine — étiquettes & registre générés automatiquement.
    </p>
  </div>
</template>

<script setup lang="ts">
type Filtre = 'tous' | 'miel' | 'materiel';
const filtre = ref<Filtre>('tous');
const expanded = ref<string | null>('aca');

const filtres: { id: Filtre; label: string }[] = [
  { id: 'tous', label: 'Tous · 6' },
  { id: 'miel', label: 'Miel' },
  { id: 'materiel', label: 'Matériel' },
];

interface Produit {
  id: string;
  type: Filtre;
  icon: string;
  nom: string;
  detail: string;
  quantite: string;
  lot?: string;
  dluo?: string;
  ruches?: string;
  alerte?: boolean;
  trace?: { etape: string; info: string }[];
}

const produits: Produit[] = [
  {
    id: 'aca',
    type: 'miel',
    icon: '🍯',
    nom: 'Miel acacia 2025',
    detail: 'Pots 500 g · récolte de mai',
    quantite: '142 kg',
    lot: 'ACA-25-03',
    dluo: '06/2027',
    ruches: 'R-08 · R-01 · R-03',
    trace: [
      { etape: 'Récolte', info: '20 mai · R-08, R-01, R-03 · 38 kg' },
      { etape: 'Extraction', info: '22 mai · miellerie · humidité 17,2 %' },
      { etape: 'Mise en pot', info: '28 mai · 284 pots de 500 g' },
      { etape: 'Vente', info: '12 juin · GAEC Lefebvre · FA-2025-0041' },
    ],
  },
  {
    id: 'tf',
    type: 'miel',
    icon: '🍯',
    nom: 'Miel toutes fleurs 2025',
    detail: 'Seaux 25 kg · printemps',
    quantite: '87 kg',
    lot: 'TF-25-01',
    dluo: '04/2027',
    ruches: 'R-12 · R-05',
    trace: [
      { etape: 'Récolte', info: '2 mai · R-12, R-05 · 87 kg' },
      { etape: 'Extraction', info: '4 mai · humidité 17,8 %' },
      { etape: 'Stockage', info: 'Seaux 25 kg · cave (14 °C)' },
    ],
  },
  {
    id: 'pots',
    type: 'materiel',
    icon: '🫙',
    nom: 'Pots verre 500 g',
    detail: "Seuil d'alerte : 300",
    quantite: '230',
    alerte: true,
  },
  {
    id: 'cire',
    type: 'materiel',
    icon: '🐝',
    nom: 'Cire gaufrée Dadant',
    detail: 'Feuilles corps',
    quantite: '12 kg',
  },
  {
    id: 'sirop',
    type: 'materiel',
    icon: '🥣',
    nom: 'Sirop de nourrissement',
    detail: 'Bidons 20 L',
    quantite: '45 L',
  },
  {
    id: 'etiq',
    type: 'materiel',
    icon: '🏷️',
    nom: 'Étiquettes lot ACA-25-03',
    detail: 'Imprimées le 28 mai',
    quantite: '290',
  },
];

const produitsFiltres = computed(() =>
  filtre.value === 'tous' ? produits : produits.filter((p) => p.type === filtre.value),
);

function toggle(id: string) {
  const p = produits.find((x) => x.id === id);
  expanded.value = expanded.value === id || !p?.trace ? null : id;
}
</script>

<style scoped>
.wms {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.wms-bar {
  display: flex;
  align-items: center;
  gap: 6px;
}
.wms-pill {
  padding: 5px 11px;
  border-radius: 99px;
  border: 1px solid var(--border-default);
  background: #fff;
  font-size: 11.5px;
  font-weight: 600;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.15s;
}
.wms-pill.active {
  background: #1c1c1e;
  border-color: #1c1c1e;
  color: #fff;
}
.wms-hint {
  margin-left: auto;
  font-size: 10.5px;
  color: var(--text-tertiary);
}
.wms-list {
  background: #fff;
  border: 1px solid var(--border-default);
  border-radius: 12px;
  overflow: hidden;
}
.wms-row {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 9px 12px;
  border: none;
  border-bottom: 1px solid var(--border-default);
  background: none;
  cursor: pointer;
  text-align: left;
  transition: background 0.15s;
}
.wms-row:hover {
  background: var(--surface-muted);
}
.wms-row.open {
  background: color-mix(in srgb, var(--honey) 6%, #fff);
}
.wms-ic {
  font-size: 15px;
}
.wms-main {
  display: flex;
  flex-direction: column;
  min-width: 0;
  flex: 1;
}
.wms-main b {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-primary);
}
.wms-main span {
  font-size: 10.5px;
  color: var(--text-tertiary);
}
.wms-badge {
  font-size: 10px;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 99px;
  white-space: nowrap;
}
.wms-badge.lot {
  background: var(--surface-muted);
  color: var(--text-secondary);
}
.wms-badge.alert {
  background: #fff1f0;
  color: #dc2626;
}
.wms-badge.dluo {
  background: #f9efe3;
  color: #7d5220;
}
.wms-qte {
  font-size: 12.5px;
  font-weight: 700;
  color: var(--text-primary);
  min-width: 48px;
  text-align: right;
}
.wms-chev {
  color: var(--text-tertiary);
  font-size: 14px;
  transition: transform 0.2s;
}
.wms-chev.down {
  transform: rotate(90deg);
}
.wms-trace {
  padding: 10px 14px 12px;
  background: var(--surface-muted);
  border-bottom: 1px solid var(--border-default);
}
.wms-trace-t {
  font-size: 10.5px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--text-tertiary);
  margin: 0 0 8px;
}
.wms-steps {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.wms-step {
  display: flex;
  align-items: center;
  gap: 8px;
}
.wms-step-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--honey);
  flex-shrink: 0;
}
.wms-step-main {
  display: flex;
  gap: 6px;
  align-items: baseline;
}
.wms-step-main b {
  font-size: 11.5px;
  font-weight: 600;
  color: var(--text-primary);
}
.wms-step-main span {
  font-size: 10.5px;
  color: var(--text-tertiary);
}
.wms-trace-foot {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 9px;
}
.wms-trace-note {
  font-size: 10.5px;
  color: var(--text-secondary);
}
.wms-foot {
  font-size: 10.5px;
  color: var(--text-tertiary);
  margin: 0;
  text-align: center;
}
</style>
