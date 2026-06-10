<template>
  <div class="wmm">
    <!-- Sélecteur de rucher -->
    <div class="wmm-bar">
      <button
        v-for="(r, i) in ruchers"
        :key="r.nom"
        class="wmm-pill"
        :class="{ active: sel === i }"
        @click="sel = i"
      >
        📍 {{ r.nom }}
      </button>
    </div>

    <div class="wmm-grid">
      <!-- Conditions actuelles -->
      <div class="wmm-now">
        <div class="wmm-now-head">
          <div>
            <p class="wmm-now-temp">{{ rucher.temp }}°</p>
            <p class="wmm-now-desc">{{ rucher.ciel }}</p>
          </div>
          <span class="wmm-now-icon">{{ rucher.icon }}</span>
        </div>
        <div class="wmm-now-stats">
          <span>💨 {{ rucher.vent }} km/h</span>
          <span>💧 {{ rucher.humidite }} %</span>
          <span>🌡 ressenti {{ rucher.ressenti }}°</span>
        </div>
        <div class="wmm-vol" :class="rucher.vol.tone">
          <b>Conditions de vol : {{ rucher.vol.label }}</b>
          <span>{{ rucher.vol.detail }}</span>
        </div>
      </div>

      <!-- Prévisions 5 jours -->
      <div class="wmm-side">
        <p class="wmm-side-t">5 prochains jours</p>
        <div class="wmm-days">
          <div v-for="d in rucher.previsions" :key="d.jour" class="wmm-day">
            <span class="wmm-day-n">{{ d.jour }}</span>
            <span class="wmm-day-i">{{ d.icon }}</span>
            <span class="wmm-day-t"
              ><b>{{ d.max }}°</b> {{ d.min }}°</span
            >
          </div>
        </div>
        <div class="wmm-window">
          <span class="wmm-window-ic">🐝</span>
          <span class="wmm-window-main">
            <b>Fenêtre d'intervention idéale</b>
            <span>{{ rucher.fenetre }}</span>
          </span>
        </div>
      </div>
    </div>

    <!-- Alerte météo apicole -->
    <div v-if="rucher.alerte" class="wmm-alerte">
      <span>{{ rucher.alerte.icon }}</span>
      <span class="wmm-alerte-main">
        <b>{{ rucher.alerte.titre }}</b>
        <span>{{ rucher.alerte.conseil }}</span>
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
const sel = ref(0);

const ruchers = [
  {
    nom: 'Rucher du Moulin',
    temp: 22,
    ressenti: 23,
    ciel: 'Ensoleillé',
    icon: '☀️',
    vent: 8,
    humidite: 52,
    vol: {
      tone: 'good',
      label: 'Excellentes',
      detail: 'Butinage actif prévu toute la journée',
    },
    previsions: [
      { jour: 'Mer', icon: '☀️', max: 24, min: 12 },
      { jour: 'Jeu', icon: '🌡', max: 33, min: 18 },
      { jour: 'Ven', icon: '🌤', max: 27, min: 16 },
      { jour: 'Sam', icon: '🌤', max: 25, min: 14 },
      { jour: 'Dim', icon: '🌧', max: 19, min: 11 },
    ],
    fenetre: 'Demain 10 h – 15 h · vent faible, 24°',
    alerte: {
      icon: '🌡',
      titre: 'Canicule prévue jeudi (33°)',
      conseil: 'Prévoir ombrage et abreuvoir — éviter les visites entre 12 h et 17 h',
    },
  },
  {
    nom: 'Rucher des Tilleuls',
    temp: 19,
    ressenti: 18,
    ciel: 'Averses éparses',
    icon: '🌦',
    vent: 22,
    humidite: 74,
    vol: {
      tone: 'mid',
      label: 'Moyennes',
      detail: 'Vent soutenu — activité réduite cet après-midi',
    },
    previsions: [
      { jour: 'Mer', icon: '🌧', max: 18, min: 11 },
      { jour: 'Jeu', icon: '🌤', max: 26, min: 15 },
      { jour: 'Ven', icon: '☀️', max: 28, min: 16 },
      { jour: 'Sam', icon: '☀️', max: 27, min: 15 },
      { jour: 'Dim', icon: '🌤', max: 24, min: 13 },
    ],
    fenetre: 'Vendredi 9 h – 13 h · après le front pluvieux',
    alerte: null,
  },
] as const;

const rucher = computed(() => ruchers[sel.value] ?? ruchers[0]);
</script>

<style scoped>
.wmm {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.wmm-bar {
  display: flex;
  gap: 6px;
}
.wmm-pill {
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
.wmm-pill.active {
  background: #1c1c1e;
  border-color: #1c1c1e;
  color: #fff;
}
.wmm-grid {
  display: grid;
  grid-template-columns: 1.1fr 1fr;
  gap: 10px;
}
.wmm-now {
  background: linear-gradient(135deg, #1c1c1e 0%, #2c2c30 100%);
  border-radius: 14px;
  padding: 14px 16px;
  color: #fff;
}
.wmm-now-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
}
.wmm-now-temp {
  font-size: 34px;
  font-weight: 700;
  letter-spacing: -0.03em;
  margin: 0;
  line-height: 1;
}
.wmm-now-desc {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.65);
  margin: 4px 0 0;
}
.wmm-now-icon {
  font-size: 30px;
}
.wmm-now-stats {
  display: flex;
  gap: 12px;
  margin-top: 12px;
  font-size: 11px;
  color: rgba(255, 255, 255, 0.75);
}
.wmm-vol {
  margin-top: 12px;
  border-radius: 10px;
  padding: 8px 10px;
  display: flex;
  flex-direction: column;
}
.wmm-vol.good {
  background: rgba(122, 150, 118, 0.25);
}
.wmm-vol.mid {
  background: rgba(245, 166, 35, 0.22);
}
.wmm-vol b {
  font-size: 11.5px;
}
.wmm-vol span {
  font-size: 10.5px;
  color: rgba(255, 255, 255, 0.7);
}
.wmm-side {
  background: #fff;
  border: 1px solid var(--border-default);
  border-radius: 14px;
  padding: 12px 14px;
  display: flex;
  flex-direction: column;
}
.wmm-side-t {
  font-size: 10.5px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--text-tertiary);
  margin: 0 0 8px;
}
.wmm-days {
  display: flex;
  justify-content: space-between;
  gap: 4px;
}
.wmm-day {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
  flex: 1;
  padding: 6px 2px;
  border-radius: 9px;
  background: var(--surface-muted);
}
.wmm-day-n {
  font-size: 10px;
  font-weight: 600;
  color: var(--text-tertiary);
}
.wmm-day-i {
  font-size: 14px;
}
.wmm-day-t {
  font-size: 10px;
  color: var(--text-tertiary);
}
.wmm-day-t b {
  font-size: 11px;
  color: var(--text-primary);
}
.wmm-window {
  margin-top: 10px;
  display: flex;
  align-items: center;
  gap: 9px;
  background: color-mix(in srgb, var(--honey) 10%, #fff);
  border: 1px solid color-mix(in srgb, var(--honey) 30%, transparent);
  border-radius: 10px;
  padding: 8px 10px;
}
.wmm-window-ic {
  font-size: 16px;
}
.wmm-window-main {
  display: flex;
  flex-direction: column;
}
.wmm-window-main b {
  font-size: 11.5px;
  color: var(--text-primary);
}
.wmm-window-main span {
  font-size: 10.5px;
  color: var(--text-secondary);
}
.wmm-alerte {
  display: flex;
  align-items: center;
  gap: 10px;
  background: #fff7ed;
  border: 1px solid #fed7aa;
  border-radius: 12px;
  padding: 9px 12px;
}
.wmm-alerte > span:first-child {
  font-size: 17px;
}
.wmm-alerte-main {
  display: flex;
  flex-direction: column;
}
.wmm-alerte-main b {
  font-size: 12px;
  color: #9a3412;
}
.wmm-alerte-main span {
  font-size: 10.5px;
  color: #c2410c;
}
</style>
