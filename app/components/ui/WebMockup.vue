<template>
  <div class="wm-wrapper">
    <div class="wm-glow" />
    <div class="wm-window">
      <!-- Browser chrome -->
      <div class="wm-chrome">
        <span class="wm-dot" style="background: #ff5f57" />
        <span class="wm-dot" style="background: #febc2e" />
        <span class="wm-dot" style="background: #28c840" />
        <div class="wm-url">
          <svg
            width="9"
            height="9"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#a8a29e"
            stroke-width="2.4"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <rect x="3" y="11" width="18" height="11" rx="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
          app.apigo.fr/{{ current.slug }}
        </div>
        <div class="wm-chrome-spacer" />
      </div>

      <!-- App body -->
      <div class="wm-body">
        <!-- Sidebar -->
        <aside class="wm-sidebar">
          <div class="wm-brand">
            <div class="wm-brand-logo">🐝</div>
            <span class="wm-brand-name">APIGO</span>
          </div>

          <nav class="wm-nav">
            <button
              v-for="(s, i) in screens"
              :key="s.slug"
              class="wm-nav-btn"
              :class="{ active: active === i }"
              @click="active = i"
            >
              <!-- eslint-disable-next-line vue/no-v-html -- icônes SVG statiques de confiance -->
              <span class="wm-nav-ic" v-html="s.icon" />
              {{ s.label }}
            </button>
            <div class="wm-nav-sep" />
            <div v-for="extra in extraNav" :key="extra.label" class="wm-nav-btn wm-nav-ghost">
              <!-- eslint-disable-next-line vue/no-v-html -- icônes SVG statiques de confiance -->
              <span class="wm-nav-ic" v-html="extra.icon" />
              {{ extra.label }}
            </div>
          </nav>

          <div class="wm-user">
            <div class="wm-user-av">AM</div>
            <div class="wm-user-info">
              <span class="wm-user-name">Antoine M.</span>
              <span class="wm-user-plan">Plan Pro</span>
            </div>
          </div>
        </aside>

        <!-- Main -->
        <main class="wm-main">
          <header class="wm-topbar">
            <h3 class="wm-page-title">{{ current.label }}</h3>
            <div class="wm-topbar-right">
              <div class="wm-search">
                <svg
                  width="11"
                  height="11"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#a8a29e"
                  stroke-width="2.2"
                  stroke-linecap="round"
                >
                  <circle cx="11" cy="11" r="7" />
                  <path d="m21 21-4.3-4.3" />
                </svg>
                Rechercher…
              </div>
              <div class="wm-bell">
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#57534e"
                  stroke-width="1.8"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
                  <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
                </svg>
                <span class="wm-bell-dot" />
              </div>
            </div>
          </header>

          <div class="wm-content">
            <!-- ── DASHBOARD ── -->
            <div v-show="active === 0" class="wm-screen">
              <div class="wm-kpis">
                <div class="wm-kpi">
                  <span class="wm-kpi-v">14</span><span class="wm-kpi-l">Ruches actives</span>
                </div>
                <div class="wm-kpi">
                  <span class="wm-kpi-v">247<i>kg</i></span
                  ><span class="wm-kpi-l">Production 2025</span>
                </div>
                <div class="wm-kpi">
                  <span class="wm-kpi-v">3 420<i>€</i></span
                  ><span class="wm-kpi-l">Chiffre d'affaires</span>
                </div>
                <div class="wm-kpi wm-kpi-alert">
                  <span class="wm-kpi-v">2</span><span class="wm-kpi-l">Alertes santé</span>
                </div>
              </div>
              <div class="wm-cols">
                <div class="wm-card">
                  <p class="wm-card-t">Alertes récentes</p>
                  <button class="wm-line" @click="active = 1">
                    <span class="wm-line-dot" style="background: #ef4444" />
                    <span class="wm-line-main"
                      ><b>R-12 — Varroa élevé (3,2 %)</b
                      ><span>Rucher du Moulin · Urgent</span></span
                    >
                    <span class="wm-chev">›</span>
                  </button>
                  <button class="wm-line" @click="active = 1">
                    <span class="wm-line-dot" style="background: #f5a623" />
                    <span class="wm-line-main"
                      ><b>R-07 — Population faible</b
                      ><span>Rucher des Tilleuls · À surveiller</span></span
                    >
                    <span class="wm-chev">›</span>
                  </button>
                  <p class="wm-card-t" style="margin-top: 14px">Prochaine visite</p>
                  <div class="wm-line wm-line-static">
                    <span class="wm-line-cal">📅</span>
                    <span class="wm-line-main"
                      ><b>Traitement Varroa — R-08</b><span>Demain · Rucher du Moulin</span></span
                    >
                  </div>
                </div>
                <div class="wm-card">
                  <p class="wm-card-t">Production mensuelle</p>
                  <div class="wm-chart">
                    <div
                      v-for="(h, i) in chartBars"
                      :key="i"
                      class="wm-bar"
                      :style="`height:${h}%`"
                    />
                  </div>
                  <div class="wm-chart-x">
                    <span>Avr</span><span>Mai</span><span>Juin</span><span>Juil</span
                    ><span>Août</span><span>Sept</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- ── RUCHES ── -->
            <div v-show="active === 1" class="wm-screen">
              <div class="wm-ruches-bar">
                <span class="wm-pill">Toutes · 14</span>
                <span class="wm-pill ghost">Rucher du Moulin</span>
                <span class="wm-pill ghost">Rucher des Tilleuls</span>
              </div>
              <div class="wm-grid">
                <div v-for="r in ruches" :key="r.id" class="wm-hive">
                  <div class="wm-hive-top">
                    <span class="wm-hive-id">{{ r.id }}</span>
                    <span class="wm-hive-badge" :style="`background:${r.bg};color:${r.fg}`">{{
                      r.statut
                    }}</span>
                  </div>
                  <p class="wm-hive-race">{{ r.race }}</p>
                  <div class="wm-hive-stats">
                    <span
                      >Varroa <b :style="`color:${r.varroaColor}`">{{ r.varroa }}</b></span
                    >
                    <span
                      >Reine <b>{{ r.reine }}</b></span
                    >
                  </div>
                </div>
              </div>
            </div>

            <!-- ── CALENDRIER ── -->
            <div v-show="active === 2" class="wm-screen">
              <div class="wm-cal-head">
                <span class="wm-cal-month">Mai 2025</span>
                <span class="wm-cal-legend"
                  ><i style="background: #f5a623" />Interventions
                  <i style="background: #7a9676" />Récoltes</span
                >
              </div>
              <div class="wm-cal-grid">
                <span
                  v-for="d in ['L', 'M', 'M', 'J', 'V', 'S', 'D']"
                  :key="d + Math.random()"
                  class="wm-cal-dow"
                  >{{ d }}</span
                >
                <div
                  v-for="cell in calendar"
                  :key="cell.key"
                  class="wm-cal-cell"
                  :class="{ muted: !cell.in, today: cell.today }"
                >
                  <span class="wm-cal-num">{{ cell.day }}</span>
                  <span class="wm-cal-dots">
                    <i v-for="(c, j) in cell.dots" :key="j" :style="`background:${c}`" />
                  </span>
                </div>
              </div>
            </div>

            <!-- ── FINANCES ── -->
            <div v-show="active === 3" class="wm-screen">
              <div class="wm-fin-top">
                <div class="wm-ca">
                  <div class="wm-ca-row">
                    <div>
                      <p class="wm-ca-l">Chiffre d'affaires 2025</p>
                      <p class="wm-ca-v">3 420 <span>€</span></p>
                    </div>
                    <span class="wm-ca-badge">+12 % vs 2024</span>
                  </div>
                  <div class="wm-chart dark">
                    <div
                      v-for="(h, i) in chartBars"
                      :key="i"
                      class="wm-bar honey"
                      :style="`height:${h}%`"
                    />
                  </div>
                </div>
                <div class="wm-fin-stats">
                  <div class="wm-stat">
                    <span class="wm-stat-v">680 €</span><span class="wm-stat-l">Charges</span>
                  </div>
                  <div class="wm-stat">
                    <span class="wm-stat-v" style="color: #4f6a4c">2 740 €</span
                    ><span class="wm-stat-l">Résultat net</span>
                  </div>
                  <div class="wm-stat">
                    <span class="wm-stat-v" style="color: #a86a13">13,9 €</span
                    ><span class="wm-stat-l">Coût / kg miel</span>
                  </div>
                </div>
              </div>
              <p class="wm-card-t" style="margin-top: 4px">Dernières ventes</p>
              <div class="wm-table">
                <div v-for="v in ventes" :key="v.id" class="wm-trow">
                  <span class="wm-euro">€</span>
                  <span class="wm-line-main"
                    ><b>{{ v.client }}</b
                    ><span>{{ v.date }} · {{ v.produit }}</span></span
                  >
                  <span class="wm-facture">{{ v.facture }}</span>
                  <span class="wm-amount">+{{ v.amount }}</span>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const active = ref(0);

const screens = [
  {
    slug: 'dashboard',
    label: 'Tableau de bord',
    icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="9" rx="1"/><rect x="14" y="3" width="7" height="5" rx="1"/><rect x="14" y="12" width="7" height="9" rx="1"/><rect x="3" y="16" width="7" height="5" rx="1"/></svg>',
  },
  {
    slug: 'ruches',
    label: 'Ruches',
    icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 8h16M4 12h16M4 16h16"/><rect x="4" y="4" width="16" height="16" rx="3"/></svg>',
  },
  {
    slug: 'calendrier',
    label: 'Calendrier',
    icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>',
  },
  {
    slug: 'finances',
    label: 'Finances',
    icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20M6 15h4"/></svg>',
  },
];

const current = computed(() => screens[active.value] ?? screens[0]!);

const extraNav = [
  {
    label: 'Interventions',
    icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/><path d="m9 14 2 2 4-4"/></svg>',
  },
  {
    label: 'Stocks',
    icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 8a2 2 0 0 0-1-1.7l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.7l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5M12 22V12"/></svg>',
  },
];

const chartBars = [34, 52, 44, 68, 80, 100];

const ruches = [
  {
    id: 'R-12',
    race: 'Buckfast',
    statut: 'Alerte',
    bg: '#fff1f0',
    fg: '#dc2626',
    varroa: '3,2 %',
    varroaColor: '#ef4444',
    reine: '2024',
  },
  {
    id: 'R-08',
    race: 'Carnica',
    statut: 'Active',
    bg: '#eef2eb',
    fg: '#4f6a4c',
    varroa: '0,8 %',
    varroaColor: '#4f6a4c',
    reine: '2025',
  },
  {
    id: 'R-07',
    race: 'Buckfast',
    statut: 'Faible',
    bg: '#fef6e4',
    fg: '#a86a13',
    varroa: '1,1 %',
    varroaColor: '#a86a13',
    reine: '2023',
  },
  {
    id: 'R-05',
    race: 'Noire',
    statut: 'Active',
    bg: '#eef2eb',
    fg: '#4f6a4c',
    varroa: '0,5 %',
    varroaColor: '#4f6a4c',
    reine: '2025',
  },
  {
    id: 'R-03',
    race: 'Carnica',
    statut: 'Active',
    bg: '#eef2eb',
    fg: '#4f6a4c',
    varroa: '0,9 %',
    varroaColor: '#4f6a4c',
    reine: '2024',
  },
  {
    id: 'R-01',
    race: 'Buckfast',
    statut: 'Active',
    bg: '#eef2eb',
    fg: '#4f6a4c',
    varroa: '0,6 %',
    varroaColor: '#4f6a4c',
    reine: '2025',
  },
];

const ventes = [
  {
    id: 1,
    client: 'Marché de Caussade',
    date: '18 mai',
    produit: 'Miel toutes fleurs · 15 kg',
    facture: 'FA-2025-0042',
    amount: '180 €',
  },
  {
    id: 2,
    client: 'GAEC Lefebvre',
    date: '12 mai',
    produit: 'Miel acacia · 12 kg',
    facture: 'FA-2025-0041',
    amount: '216 €',
  },
  {
    id: 3,
    client: 'Épicerie Le Rucher',
    date: '4 mai',
    produit: 'Miel de châtaignier · 8 kg',
    facture: 'FA-2025-0040',
    amount: '120 €',
  },
];

// Mini calendrier — mai 2025 commence un jeudi (offset 3), 31 jours
const eventsByDay: Record<number, string[]> = {
  5: ['#f5a623'],
  8: ['#f5a623', '#7a9676'],
  12: ['#7a9676'],
  15: ['#f5a623'],
  18: ['#7a9676'],
  22: ['#f5a623', '#f5a623'],
  27: ['#f5a623'],
};
const calendar = (() => {
  const cells: { key: string; day: number; in: boolean; today: boolean; dots: string[] }[] = [];
  const offset = 3; // jeudi
  for (let i = 0; i < offset; i++)
    cells.push({ key: `p${i}`, day: 27 + i, in: false, today: false, dots: [] });
  for (let d = 1; d <= 31; d++) {
    cells.push({ key: `d${d}`, day: d, in: true, today: d === 22, dots: eventsByDay[d] ?? [] });
  }
  let n = 1;
  while (cells.length < 42)
    cells.push({ key: `n${n}`, day: n++, in: false, today: false, dots: [] });
  return cells;
})();
</script>

<style scoped>
.wm-wrapper {
  position: relative;
  display: flex;
  justify-content: center;
}
.wm-glow {
  position: absolute;
  inset: -10% -6% 30% -6%;
  background: radial-gradient(
    ellipse at 50% 0%,
    color-mix(in srgb, var(--honey) 14%, transparent),
    transparent 70%
  );
  filter: blur(60px);
  pointer-events: none;
}

.wm-window {
  position: relative;
  width: 100%;
  max-width: 1040px;
  border-radius: 16px 16px 0 0;
  overflow: hidden;
  background: #fff;
  border: 1px solid var(--border-default);
  box-shadow:
    0 -8px 40px rgba(0, 0, 0, 0.08),
    0 30px 80px rgba(0, 0, 0, 0.18),
    0 0 0 1px rgba(0, 0, 0, 0.03);
}

/* Chrome */
.wm-chrome {
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 11px 14px;
  background: var(--surface-muted);
  border-bottom: 1px solid var(--border-default);
}
.wm-dot {
  width: 11px;
  height: 11px;
  border-radius: 50%;
  flex-shrink: 0;
}
.wm-url {
  margin: 0 auto;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 5px 14px;
  background: #fff;
  border: 1px solid var(--border-default);
  border-radius: 8px;
  font-size: 12px;
  color: var(--text-tertiary);
  font-weight: 500;
}
.wm-chrome-spacer {
  width: 39px;
  flex-shrink: 0;
}

/* Body */
.wm-body {
  display: flex;
  height: 560px;
}

/* Sidebar */
.wm-sidebar {
  width: 188px;
  flex-shrink: 0;
  background: #1c1c1e;
  display: flex;
  flex-direction: column;
  padding: 16px 12px;
}
.wm-brand {
  display: flex;
  align-items: center;
  gap: 9px;
  padding: 4px 8px 18px;
}
.wm-brand-logo {
  width: 28px;
  height: 28px;
  border-radius: 8px;
  background: var(--honey);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 15px;
}
.wm-brand-name {
  color: #fff;
  font-weight: 800;
  font-size: 16px;
  letter-spacing: -0.02em;
}
.wm-nav {
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex: 1;
}
.wm-nav-btn {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px 11px;
  border-radius: 9px;
  border: none;
  background: none;
  cursor: pointer;
  color: rgba(255, 255, 255, 0.55);
  font-size: 12.5px;
  font-weight: 600;
  text-align: left;
  width: 100%;
  transition:
    background 0.15s,
    color 0.15s;
}
.wm-nav-btn:hover {
  background: rgba(255, 255, 255, 0.05);
  color: rgba(255, 255, 255, 0.8);
}
.wm-nav-btn.active {
  background: var(--honey);
  color: #fff;
}
.wm-nav-ic {
  display: flex;
  width: 16px;
  height: 16px;
  flex-shrink: 0;
}
.wm-nav-ghost {
  color: rgba(255, 255, 255, 0.4);
  cursor: default;
}
.wm-nav-ghost:hover {
  background: none;
  color: rgba(255, 255, 255, 0.4);
}
.wm-nav-sep {
  height: 1px;
  background: rgba(255, 255, 255, 0.08);
  margin: 10px 6px;
}
.wm-user {
  display: flex;
  align-items: center;
  gap: 9px;
  padding: 9px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.05);
}
.wm-user-av {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background: var(--honey);
  color: #fff;
  font-size: 11px;
  font-weight: 800;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.wm-user-info {
  display: flex;
  flex-direction: column;
  min-width: 0;
}
.wm-user-name {
  color: #fff;
  font-size: 12px;
  font-weight: 700;
}
.wm-user-plan {
  color: var(--honey);
  font-size: 10.5px;
  font-weight: 600;
}

/* Main */
.wm-main {
  flex: 1;
  background: var(--surface-primary);
  display: flex;
  flex-direction: column;
  min-width: 0;
}
.wm-topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 22px;
  border-bottom: 1px solid var(--border-default);
}
.wm-page-title {
  font-size: 18px;
  font-weight: 800;
  color: var(--text-primary);
  letter-spacing: -0.02em;
}
.wm-topbar-right {
  display: flex;
  align-items: center;
  gap: 10px;
}
.wm-search {
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 7px 12px;
  background: #fff;
  border: 1px solid var(--border-default);
  border-radius: 9px;
  font-size: 12px;
  color: var(--text-tertiary);
}
.wm-bell {
  position: relative;
  width: 32px;
  height: 32px;
  border-radius: 9px;
  background: #fff;
  border: 1px solid var(--border-default);
  display: flex;
  align-items: center;
  justify-content: center;
}
.wm-bell-dot {
  position: absolute;
  top: 7px;
  right: 8px;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #ef4444;
  border: 1.5px solid #fff;
}
.wm-content {
  flex: 1;
  overflow: hidden;
  padding: 20px 22px;
}
.wm-screen {
  animation: wm-fade 0.35s ease;
}
@keyframes wm-fade {
  from {
    opacity: 0;
    transform: translateY(6px);
  }
  to {
    opacity: 1;
    transform: none;
  }
}

.wm-card-t {
  font-size: 10.5px;
  font-weight: 700;
  color: var(--text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  margin-bottom: 9px;
}

/* KPIs */
.wm-kpis {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  margin-bottom: 16px;
}
.wm-kpi {
  background: #fff;
  border: 1px solid var(--border-default);
  border-radius: 14px;
  padding: 14px 16px;
}
.wm-kpi-v {
  display: block;
  font-size: 26px;
  font-weight: 800;
  color: var(--text-primary);
  letter-spacing: -0.03em;
  line-height: 1;
}
.wm-kpi-v i {
  font-size: 14px;
  font-weight: 700;
  font-style: normal;
  color: var(--text-tertiary);
  margin-left: 1px;
}
.wm-kpi-l {
  display: block;
  font-size: 11.5px;
  font-weight: 600;
  color: var(--text-tertiary);
  margin-top: 6px;
}
.wm-kpi-alert .wm-kpi-v {
  color: #dc2626;
}

/* Two columns */
.wm-cols {
  display: grid;
  grid-template-columns: 1.15fr 1fr;
  gap: 12px;
}
.wm-card {
  background: #fff;
  border: 1px solid var(--border-default);
  border-radius: 14px;
  padding: 16px;
}
.wm-line {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 11px;
  background: var(--surface-primary);
  border: 1px solid var(--border-faint);
  border-radius: 10px;
  margin-bottom: 6px;
  cursor: pointer;
  text-align: left;
  transition: background 0.15s;
}
.wm-line:hover {
  background: var(--honey-soft);
}
.wm-line-static,
.wm-line-static:hover {
  cursor: default;
  background: var(--surface-primary);
}
.wm-line-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}
.wm-line-cal {
  font-size: 14px;
  flex-shrink: 0;
}
.wm-line-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}
.wm-line-main b {
  font-size: 12.5px;
  font-weight: 600;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.wm-line-main span {
  font-size: 11px;
  color: var(--text-tertiary);
}
.wm-chev {
  font-size: 17px;
  color: var(--text-quaternary);
  flex-shrink: 0;
}

/* Chart */
.wm-chart {
  display: flex;
  align-items: flex-end;
  gap: 7px;
  height: 120px;
  margin-top: 6px;
}
.wm-chart.dark {
  height: 56px;
}
.wm-bar {
  flex: 1;
  background: var(--honey);
  border-radius: 4px 4px 0 0;
  min-height: 6px;
  opacity: 0.85;
}
.wm-bar:last-child {
  opacity: 1;
}
.wm-bar.honey {
  background: var(--honey);
}
.wm-chart-x {
  display: flex;
  gap: 7px;
  margin-top: 7px;
}
.wm-chart-x span {
  flex: 1;
  text-align: center;
  font-size: 9.5px;
  color: var(--text-quaternary);
  font-weight: 600;
}

/* Ruches */
.wm-ruches-bar {
  display: flex;
  gap: 7px;
  margin-bottom: 14px;
}
.wm-pill {
  padding: 6px 13px;
  border-radius: 9px;
  font-size: 11.5px;
  font-weight: 700;
  background: var(--honey);
  color: #fff;
}
.wm-pill.ghost {
  background: #fff;
  color: var(--text-secondary);
  border: 1px solid var(--border-default);
  font-weight: 600;
}
.wm-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}
.wm-hive {
  background: #fff;
  border: 1px solid var(--border-default);
  border-radius: 14px;
  padding: 14px;
}
.wm-hive-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 6px;
}
.wm-hive-id {
  font-size: 15px;
  font-weight: 800;
  color: var(--text-primary);
  letter-spacing: -0.02em;
}
.wm-hive-badge {
  font-size: 10px;
  font-weight: 700;
  padding: 3px 9px;
  border-radius: 20px;
}
.wm-hive-race {
  font-size: 11.5px;
  color: var(--text-tertiary);
  margin-bottom: 11px;
}
.wm-hive-stats {
  display: flex;
  justify-content: space-between;
  border-top: 1px solid var(--border-faint);
  padding-top: 9px;
}
.wm-hive-stats span {
  font-size: 11px;
  color: var(--text-tertiary);
}
.wm-hive-stats b {
  font-weight: 800;
  color: var(--text-primary);
  margin-left: 3px;
}

/* Calendrier */
.wm-cal-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14px;
}
.wm-cal-month {
  font-size: 16px;
  font-weight: 800;
  color: var(--text-primary);
  letter-spacing: -0.02em;
}
.wm-cal-legend {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  color: var(--text-tertiary);
}
.wm-cal-legend i {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  display: inline-block;
  margin-left: 8px;
}
.wm-cal-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 5px;
}
.wm-cal-dow {
  text-align: center;
  font-size: 10px;
  font-weight: 700;
  color: var(--text-quaternary);
  text-transform: uppercase;
  padding-bottom: 4px;
}
.wm-cal-cell {
  aspect-ratio: 1.35;
  background: #fff;
  border: 1px solid var(--border-faint);
  border-radius: 9px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
}
.wm-cal-cell.muted {
  background: var(--surface-muted);
}
.wm-cal-cell.muted .wm-cal-num {
  color: var(--text-quaternary);
}
.wm-cal-cell.today {
  background: var(--honey-soft);
  border-color: color-mix(in srgb, var(--honey) 35%, transparent);
}
.wm-cal-num {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-primary);
}
.wm-cal-cell.today .wm-cal-num {
  color: var(--honey-deep);
  font-weight: 800;
}
.wm-cal-dots {
  display: flex;
  gap: 3px;
  height: 6px;
}
.wm-cal-dots i {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  display: inline-block;
}

/* Finances */
.wm-fin-top {
  display: grid;
  grid-template-columns: 1.4fr 1fr;
  gap: 12px;
  margin-bottom: 16px;
}
.wm-ca {
  background: linear-gradient(135deg, #1c1c1e, #2c2c2e);
  border-radius: 14px;
  padding: 16px;
}
.wm-ca-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
}
.wm-ca-l {
  font-size: 10.5px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.5);
  text-transform: uppercase;
  letter-spacing: 0.07em;
}
.wm-ca-v {
  font-size: 30px;
  font-weight: 800;
  color: #fff;
  letter-spacing: -0.04em;
  margin-top: 3px;
}
.wm-ca-v span {
  font-size: 17px;
  color: rgba(255, 255, 255, 0.55);
}
.wm-ca-badge {
  background: rgba(245, 166, 35, 0.2);
  color: var(--honey);
  font-size: 10.5px;
  font-weight: 700;
  padding: 4px 9px;
  border-radius: 20px;
}
.wm-fin-stats {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.wm-stat {
  flex: 1;
  background: #fff;
  border: 1px solid var(--border-default);
  border-radius: 12px;
  padding: 10px 14px;
  display: flex;
  flex-direction: column;
  justify-content: center;
}
.wm-stat-v {
  font-size: 17px;
  font-weight: 800;
  color: var(--text-primary);
  letter-spacing: -0.02em;
}
.wm-stat-l {
  font-size: 10.5px;
  font-weight: 600;
  color: var(--text-tertiary);
  margin-top: 1px;
}
.wm-table {
  background: #fff;
  border: 1px solid var(--border-default);
  border-radius: 14px;
  overflow: hidden;
}
.wm-trow {
  display: flex;
  align-items: center;
  gap: 11px;
  padding: 11px 14px;
  border-bottom: 1px solid var(--border-faint);
}
.wm-trow:last-child {
  border-bottom: none;
}
.wm-euro {
  width: 26px;
  height: 26px;
  border-radius: 50%;
  background: #eef2eb;
  color: #4f6a4c;
  font-size: 12px;
  font-weight: 800;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.wm-facture {
  font-size: 10.5px;
  font-weight: 600;
  color: var(--text-quaternary);
  background: var(--surface-muted);
  padding: 3px 8px;
  border-radius: 6px;
  flex-shrink: 0;
}
.wm-amount {
  font-size: 13px;
  font-weight: 800;
  color: #4f6a4c;
  flex-shrink: 0;
}
</style>
