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
          app.apigo.fr/{{ urlPath }}
        </div>
        <div class="wm-chrome-spacer" />
      </div>

      <!-- App body -->
      <div class="wm-body">
        <!-- Sidebar -->
        <aside class="wm-sidebar">
          <div class="wm-brand">
            <img src="/logo_apigo.webp" alt="APIGO" class="wm-brand-logo" />
            <span class="wm-brand-name">APIGO</span>
          </div>

          <nav class="wm-nav">
            <button
              v-for="(s, i) in screens"
              :key="s.slug"
              class="wm-nav-btn"
              :class="{ active: active === i && !sub }"
              @click="go(i)"
            >
              <!-- eslint-disable-next-line vue/no-v-html -- icônes SVG statiques de confiance -->
              <span class="wm-nav-ic" v-html="s.icon" />
              {{ s.label }}
            </button>
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
            <div class="wm-topbar-left">
              <button v-if="sub" class="wm-back" aria-label="Retour" @click="back">
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <path d="m15 18-6-6 6-6" />
                </svg>
              </button>
              <h3 class="wm-page-title">{{ pageTitle }}</h3>
            </div>
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
                  stroke-width="1.7"
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
            <!-- ════════ SUB-VUES (drill-down) ════════ -->
            <!-- Fiche ruche -->
            <div v-if="sub === 'hive'" key="hive" class="wm-screen">
              <div class="wm-hd">
                <div class="wm-hd-icon">
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#a86a13"
                    stroke-width="1.8"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  >
                    <rect x="4" y="4" width="16" height="16" rx="3" />
                    <path d="M4 9h16M4 14h16" />
                  </svg>
                </div>
                <div>
                  <p class="wm-hd-title">{{ hive.id }} · {{ hive.race }}</p>
                  <p class="wm-hd-sub">{{ hive.rucher }}</p>
                </div>
                <span class="wm-hive-badge" :style="`background:${hive.bg};color:${hive.fg}`">{{
                  hive.statut
                }}</span>
              </div>
              <div class="wm-statrow">
                <div class="wm-stat">
                  <span class="wm-stat-v" :style="`color:${hive.varroaColor}`">{{
                    hive.varroa
                  }}</span
                  ><span class="wm-stat-l">Varroa</span>
                </div>
                <div class="wm-stat">
                  <span class="wm-stat-v">{{ hive.population }}</span
                  ><span class="wm-stat-l">Population</span>
                </div>
                <div class="wm-stat">
                  <span class="wm-stat-v">{{ hive.reine }}</span
                  ><span class="wm-stat-l">Reine</span>
                </div>
                <div class="wm-stat">
                  <span class="wm-stat-v">{{ hive.cadres }}</span
                  ><span class="wm-stat-l">Cadres</span>
                </div>
              </div>
              <div class="wm-row-between">
                <p class="wm-card-t" style="margin: 0">Dernières interventions</p>
                <button class="wm-mini-btn" @click="openForm">
                  <svg
                    width="11"
                    height="11"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2.4"
                    stroke-linecap="round"
                  >
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                  Nouvelle visite
                </button>
              </div>
              <div class="wm-tl">
                <div v-for="it in hive.historique" :key="it.date" class="wm-tl-item">
                  <span class="wm-tl-ic">{{ it.icon }}</span>
                  <span class="wm-line-main"
                    ><b>{{ it.type }}</b
                    ><span>{{ it.date }} · {{ it.note }}</span></span
                  >
                </div>
              </div>
            </div>

            <!-- Formulaire nouvelle visite -->
            <div v-else-if="sub === 'form'" key="form" class="wm-screen wm-form">
              <p class="wm-flbl">Rucher</p>
              <div class="wm-finput">{{ hive.rucher }} ▾</div>
              <p class="wm-flbl">Type d'intervention</p>
              <div class="wm-chips">
                <button
                  v-for="t in types"
                  :key="t"
                  class="wm-chip"
                  :class="{ active: selectedType === t }"
                  @click="selectedType = t"
                >
                  {{ t }}
                </button>
              </div>
              <div class="wm-form-row">
                <div class="wm-fb">
                  <p class="wm-flbl">Ruche</p>
                  <div class="wm-finput sm">{{ hive.id }} ▾</div>
                </div>
                <div class="wm-fb">
                  <p class="wm-flbl">Date</p>
                  <div class="wm-finput sm">Aujourd'hui</div>
                </div>
              </div>
              <p class="wm-flbl">Note</p>
              <div class="wm-ftextarea">ApiLifeVar — 1 bandelette posée</div>
              <button
                class="wm-save"
                :class="{ loading: saving }"
                :disabled="saving"
                @click="saveForm"
              >
                <svg
                  v-if="saving"
                  class="wm-spin"
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#fff"
                  stroke-width="2.4"
                  stroke-linecap="round"
                >
                  <path d="M12 2a10 10 0 1 0 10 10" />
                </svg>
                <span v-else>Enregistrer la visite</span>
              </button>
            </div>

            <!-- Succès enregistrement -->
            <div v-else-if="sub === 'success'" key="success" class="wm-screen wm-success">
              <div class="wm-success-ring">
                <div class="wm-success-check">
                  <svg
                    width="26"
                    height="26"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#fff"
                    stroke-width="2.4"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  >
                    <path d="m20 6-11 11-5-5" />
                  </svg>
                </div>
              </div>
              <p class="wm-success-t">Visite enregistrée</p>
              <p class="wm-success-s">{{ hive.id }} · {{ selectedType }} — synchronisée</p>
            </div>

            <!-- Facture -->
            <div v-else-if="sub === 'invoice'" key="invoice" class="wm-screen">
              <div class="wm-invoice">
                <div class="wm-inv-head">
                  <div>
                    <p class="wm-inv-num">{{ vente.facture }}</p>
                    <p class="wm-inv-sub">Émise le {{ vente.date }} 2025</p>
                  </div>
                  <span class="wm-inv-badge">Factur-X ✓</span>
                </div>
                <div class="wm-inv-line">
                  <span>{{ vente.produit }}</span
                  ><span>{{ vente.amount }}</span>
                </div>
                <div class="wm-inv-line muted">
                  <span>TVA 5,5 %</span><span>{{ vente.tva }}</span>
                </div>
                <div class="wm-inv-total">
                  <span>Total TTC</span><span>{{ vente.ttc }}</span>
                </div>
                <p class="wm-inv-client">Client · {{ vente.client }}</p>
              </div>
            </div>

            <!-- ════════ ÉCRANS PRINCIPAUX ════════ -->
            <!-- DASHBOARD -->
            <div v-else-if="active === 0" key="dash" class="wm-screen">
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
                  <button class="wm-line wm-clickable" @click="openHive(ruches[0])">
                    <span class="wm-line-dot" style="background: #ef4444" />
                    <span class="wm-line-main"
                      ><b>R-12 — Varroa élevé (3,2 %)</b
                      ><span>Rucher des Acacias · Urgent</span></span
                    >
                    <ClickHint />
                  </button>
                  <button class="wm-line wm-clickable" @click="openHive(ruches[2])">
                    <span class="wm-line-dot" style="background: #f5a623" />
                    <span class="wm-line-main"
                      ><b>R-07 — Population faible</b
                      ><span>Rucher des Tilleuls · À surveiller</span></span
                    >
                    <span class="wm-chev">›</span>
                  </button>
                  <p class="wm-card-t" style="margin-top: 14px">Prochaine visite</p>
                  <div class="wm-line wm-static">
                    <span class="wm-line-cal">📅</span>
                    <span class="wm-line-main"
                      ><b>Traitement Varroa — R-08</b><span>Demain · Rucher des Acacias</span></span
                    >
                  </div>
                </div>
                <div class="wm-card">
                  <p class="wm-card-t">Production mensuelle</p>
                  <div class="wm-chart">
                    <div
                      v-for="(hb, i) in chartBars"
                      :key="i"
                      class="wm-bar"
                      :style="`height:${hb}%`"
                    />
                  </div>
                  <div class="wm-chart-x">
                    <span>Avr</span><span>Mai</span><span>Juin</span><span>Juil</span
                    ><span>Août</span><span>Sept</span>
                  </div>
                  <button class="wm-cta-row" @click="openForm">
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2.4"
                      stroke-linecap="round"
                    >
                      <path d="M12 5v14M5 12h14" />
                    </svg>
                    Saisir une visite
                  </button>
                </div>
              </div>
            </div>

            <!-- RUCHES -->
            <div v-else-if="active === 1" key="ruches" class="wm-screen">
              <div class="wm-ruches-bar">
                <span class="wm-pill">Toutes · 14</span>
                <span class="wm-pill ghost">Rucher des Acacias</span>
                <span class="wm-pill ghost">Rucher des Tilleuls</span>
              </div>
              <div class="wm-grid">
                <button
                  v-for="(r, i) in ruches"
                  :key="r.id"
                  class="wm-hive wm-clickable"
                  @click="openHive(r)"
                >
                  <span class="wm-hive-accent" :style="`background:${r.accent}`" />
                  <div class="wm-hive-top">
                    <span class="wm-hive-id">{{ r.id }}</span>
                    <span class="wm-hive-badge" :style="`background:${r.bg};color:${r.fg}`">{{
                      r.statut
                    }}</span>
                  </div>
                  <p class="wm-hive-race">{{ r.race }} · {{ r.rucher }}</p>
                  <div class="wm-hive-stats">
                    <span
                      >Varroa <b :style="`color:${r.varroaColor}`">{{ r.varroa }}</b></span
                    >
                    <span
                      >Reine <b>{{ r.reine }}</b></span
                    >
                  </div>
                  <ClickHint v-if="i === 0" />
                </button>
              </div>
            </div>

            <!-- INTERVENTIONS -->
            <div v-else-if="active === 2" key="inter" class="wm-screen">
              <div class="wm-row-between">
                <span class="wm-pill">38 cette saison</span>
                <button class="wm-mini-btn" @click="openForm">
                  <svg
                    width="11"
                    height="11"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2.4"
                    stroke-linecap="round"
                  >
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                  Nouvelle visite
                </button>
              </div>
              <div class="wm-card" style="margin-top: 12px">
                <button
                  v-for="it in interventions"
                  :key="it.id"
                  class="wm-line wm-clickable"
                  @click="openHive(ruchesById(it.ruche))"
                >
                  <span class="wm-tl-ic">{{ it.icon }}</span>
                  <span class="wm-line-main"
                    ><b>{{ it.type }} · {{ it.ruche }}</b
                    ><span>{{ it.date }} · {{ it.note }}</span></span
                  >
                  <span class="wm-chev">›</span>
                </button>
              </div>
            </div>

            <!-- CALENDRIER -->
            <div v-else-if="active === 3" key="cal" class="wm-screen">
              <div class="wm-cal-head">
                <span class="wm-cal-month">Mai 2025</span>
                <span class="wm-cal-legend"
                  ><i style="background: #f5a623" />Interventions
                  <i style="background: #7a9676" />Récoltes</span
                >
              </div>
              <div class="wm-cal-layout">
                <div class="wm-cal-grid">
                  <span
                    v-for="(d, k) in ['L', 'M', 'M', 'J', 'V', 'S', 'D']"
                    :key="k"
                    class="wm-cal-dow"
                    >{{ d }}</span
                  >
                  <button
                    v-for="cell in calendar"
                    :key="cell.key"
                    class="wm-cal-cell"
                    :class="{
                      muted: !cell.in,
                      sel: cell.in && cell.day === calDay,
                      clickable: cell.in,
                    }"
                    @click="cell.in && (calDay = cell.day)"
                  >
                    <span class="wm-cal-num">{{ cell.day }}</span>
                    <span class="wm-cal-dots"
                      ><i v-for="(c, j) in cell.dots" :key="j" :style="`background:${c}`"
                    /></span>
                  </button>
                </div>
                <div class="wm-cal-agenda">
                  <p class="wm-card-t">{{ calDay }} mai</p>
                  <template v-if="agenda.length">
                    <div v-for="(e, i) in agenda" :key="i" class="wm-agenda-item">
                      <span class="wm-line-dot" :style="`background:${e.color}`" />
                      <span class="wm-line-main"
                        ><b>{{ e.title }}</b
                        ><span>{{ e.sub }}</span></span
                      >
                    </div>
                  </template>
                  <p v-else class="wm-agenda-empty">Aucun événement ce jour</p>
                </div>
              </div>
            </div>

            <!-- FINANCES -->
            <div v-else-if="active === 4" key="fin" class="wm-screen">
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
                      v-for="(hb, i) in chartBars"
                      :key="i"
                      class="wm-bar honey"
                      :style="`height:${hb}%`"
                    />
                  </div>
                </div>
                <div class="wm-fin-stats">
                  <div class="wm-fstat">
                    <span class="wm-fstat-v">680 €</span><span class="wm-fstat-l">Charges</span>
                  </div>
                  <div class="wm-fstat">
                    <span class="wm-fstat-v" style="color: #4f6a4c">2 740 €</span
                    ><span class="wm-fstat-l">Résultat net</span>
                  </div>
                  <div class="wm-fstat">
                    <span class="wm-fstat-v" style="color: #a86a13">13,9 €</span
                    ><span class="wm-fstat-l">Coût / kg</span>
                  </div>
                </div>
              </div>
              <p class="wm-card-t" style="margin-top: 4px">
                Dernières ventes · cliquez une facture
              </p>
              <div class="wm-table">
                <button
                  v-for="(v, i) in ventes"
                  :key="v.id"
                  class="wm-trow wm-clickable"
                  @click="openInvoice(v)"
                >
                  <span class="wm-euro">€</span>
                  <span class="wm-line-main"
                    ><b>{{ v.client }}</b
                    ><span>{{ v.date }} · {{ v.produit }}</span></span
                  >
                  <span class="wm-facture">{{ v.facture }}</span>
                  <span class="wm-amount">+{{ v.amount }}</span>
                  <ClickHint v-if="i === 0" />
                </button>
              </div>
            </div>

            <!-- STOCKS & TRAÇABILITÉ -->
            <div v-else-if="active === 5" key="stocks" class="wm-screen">
              <WmScreenStocks />
            </div>

            <!-- MÉTÉO -->
            <div v-else-if="active === 6" key="meteo" class="wm-screen">
              <WmScreenMeteo />
            </div>

            <!-- ANALYTICS & SCORE IA -->
            <div v-else key="analytics" class="wm-screen">
              <WmScreenAnalytics />
            </div>
          </div>
        </main>
      </div>

      <!-- Indice : démo interactive -->
      <div class="wm-demo-hint">
        <svg
          width="13"
          height="13"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path d="m9 9 5 12 1.8-5.2L21 14Z" />
          <path d="M7.2 2.2 8 5.1" />
          <path d="m5.1 8-2.9-.8" />
          <path d="M14 4.1 12 6" />
          <path d="m6 12-1.9 2" />
        </svg>
        Démo interactive — cliquez pour explorer
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { defineComponent, h } from 'vue';
import WmScreenStocks from './webmockup/WmScreenStocks.vue';
import WmScreenMeteo from './webmockup/WmScreenMeteo.vue';
import WmScreenAnalytics from './webmockup/WmScreenAnalytics.vue';

// Petit indice « cliquable » réutilisable (icône curseur-clic animée)
const ClickHint = defineComponent({
  name: 'ClickHint',
  render() {
    return h('span', { class: 'wm-clickhint', 'aria-hidden': 'true' }, [
      h(
        'svg',
        {
          width: 14,
          height: 14,
          viewBox: '0 0 24 24',
          fill: 'none',
          stroke: 'currentColor',
          'stroke-width': 2,
          'stroke-linecap': 'round',
          'stroke-linejoin': 'round',
        },
        [
          h('path', { d: 'm9 9 5 12 1.8-5.2L21 14Z' }),
          h('path', { d: 'M7.2 2.2 8 5.1' }),
          h('path', { d: 'm5.1 8-2.9-.8' }),
          h('path', { d: 'M14 4.1 12 6' }),
          h('path', { d: 'm6 12-1.9 2' }),
        ],
      ),
    ]);
  },
});

const active = ref(0);
const sub = ref<null | 'hive' | 'form' | 'success' | 'invoice'>(null);
const selectedType = ref('Traitement');
const saving = ref(false);
const calDay = ref(22);

const screens = [
  {
    slug: 'dashboard',
    label: 'Tableau de bord',
    icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="9" rx="1"/><rect x="14" y="3" width="7" height="5" rx="1"/><rect x="14" y="12" width="7" height="9" rx="1"/><rect x="3" y="16" width="7" height="5" rx="1"/></svg>',
  },
  {
    slug: 'ruches',
    label: 'Ruches',
    icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="4" width="16" height="16" rx="3"/><path d="M4 9h16M4 14h16"/></svg>',
  },
  {
    slug: 'interventions',
    label: 'Interventions',
    icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/><path d="m9 14 2 2 4-4"/></svg>',
  },
  {
    slug: 'calendrier',
    label: 'Calendrier',
    icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>',
  },
  {
    slug: 'finances',
    label: 'Finances',
    icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20M6 15h4"/></svg>',
  },
  {
    slug: 'stocks',
    label: 'Stocks & lots',
    icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg>',
  },
  {
    slug: 'meteo',
    label: 'Météo',
    icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="M20 12h2"/><path d="m19.07 4.93-1.41 1.41"/><path d="M15.947 12.65a4 4 0 0 0-5.925-4.128"/><path d="M13 22H7a5 5 0 1 1 4.9-6H13a3 3 0 0 1 0 6Z"/></svg>',
  },
  {
    slug: 'analytics',
    label: 'Analytics',
    icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3v18h18"/><path d="M18 17V9"/><path d="M13 17V5"/><path d="M8 17v-3"/></svg>',
  },
];

const chartBars = [34, 52, 44, 68, 80, 100];
const types = ['Contrôle', 'Traitement', 'Pesée', 'Récolte', 'Nourrissement'];

const ruches = [
  {
    id: 'R-12',
    race: 'Buckfast',
    rucher: 'Rucher des Acacias',
    statut: 'Alerte',
    bg: '#fff1f0',
    fg: '#dc2626',
    accent: '#ef4444',
    varroa: '3,2 %',
    varroaColor: '#ef4444',
    reine: '2024',
    population: 'Forte',
    cadres: '8',
    historique: [
      { icon: '🔬', type: 'Traitement Varroa', date: '15 mai', note: 'ApiLifeVar' },
      { icon: '📋', type: 'Contrôle sanitaire', date: '8 mai', note: 'RAS' },
      { icon: '⚖️', type: 'Pesée', date: '1 mai', note: '38 kg' },
    ],
  },
  {
    id: 'R-08',
    race: 'Carnica',
    rucher: 'Rucher des Acacias',
    statut: 'Active',
    bg: '#eef2eb',
    fg: '#4f6a4c',
    accent: '#7a9676',
    varroa: '0,8 %',
    varroaColor: '#4f6a4c',
    reine: '2025',
    population: 'Forte',
    cadres: '9',
    historique: [
      { icon: '🍯', type: 'Récolte', date: '20 mai', note: '14 kg acacia' },
      { icon: '📋', type: 'Contrôle', date: '6 mai', note: 'Reine vue' },
    ],
  },
  {
    id: 'R-07',
    race: 'Buckfast',
    rucher: 'Rucher des Tilleuls',
    statut: 'Faible',
    bg: '#fef6e4',
    fg: '#a86a13',
    accent: '#f5a623',
    varroa: '1,1 %',
    varroaColor: '#a86a13',
    reine: '2023',
    population: 'Faible',
    cadres: '6',
    historique: [
      { icon: '🥣', type: 'Nourrissement', date: '18 mai', note: 'Sirop 2 L' },
      { icon: '📋', type: 'Contrôle', date: '4 mai', note: 'À surveiller' },
    ],
  },
  {
    id: 'R-05',
    race: 'Noire',
    rucher: 'Rucher des Tilleuls',
    statut: 'Active',
    bg: '#eef2eb',
    fg: '#4f6a4c',
    accent: '#7a9676',
    varroa: '0,5 %',
    varroaColor: '#4f6a4c',
    reine: '2025',
    population: 'Forte',
    cadres: '8',
    historique: [{ icon: '📋', type: 'Contrôle', date: '12 mai', note: 'RAS' }],
  },
  {
    id: 'R-03',
    race: 'Carnica',
    rucher: 'Rucher des Acacias',
    statut: 'Active',
    bg: '#eef2eb',
    fg: '#4f6a4c',
    accent: '#7a9676',
    varroa: '0,9 %',
    varroaColor: '#4f6a4c',
    reine: '2024',
    population: 'Moyenne',
    cadres: '7',
    historique: [{ icon: '⚖️', type: 'Pesée', date: '10 mai', note: '41 kg' }],
  },
  {
    id: 'R-01',
    race: 'Buckfast',
    rucher: 'Rucher des Acacias',
    statut: 'Active',
    bg: '#eef2eb',
    fg: '#4f6a4c',
    accent: '#7a9676',
    varroa: '0,6 %',
    varroaColor: '#4f6a4c',
    reine: '2025',
    population: 'Forte',
    cadres: '9',
    historique: [{ icon: '🍯', type: 'Récolte', date: '21 mai', note: '11 kg' }],
  },
];

const interventions = [
  {
    id: 1,
    icon: '🍯',
    type: 'Récolte',
    ruche: 'R-01',
    date: '21 mai',
    note: '11 kg toutes fleurs',
  },
  { id: 2, icon: '🍯', type: 'Récolte', ruche: 'R-08', date: '20 mai', note: '14 kg acacia' },
  { id: 3, icon: '🥣', type: 'Nourrissement', ruche: 'R-07', date: '18 mai', note: 'Sirop 2 L' },
  {
    id: 4,
    icon: '🔬',
    type: 'Traitement Varroa',
    ruche: 'R-12',
    date: '15 mai',
    note: 'ApiLifeVar',
  },
  {
    id: 5,
    icon: '📋',
    type: 'Contrôle sanitaire',
    ruche: 'R-05',
    date: '12 mai',
    note: 'Reine vue',
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
    tva: '9,90 €',
    ttc: '189,90 €',
  },
  {
    id: 2,
    client: 'GAEC Lefebvre',
    date: '12 mai',
    produit: 'Miel acacia · 12 kg',
    facture: 'FA-2025-0041',
    amount: '216 €',
    tva: '11,88 €',
    ttc: '227,88 €',
  },
  {
    id: 3,
    client: 'Épicerie Le Rucher',
    date: '4 mai',
    produit: 'Miel de châtaignier · 8 kg',
    facture: 'FA-2025-0040',
    amount: '120 €',
    tva: '6,60 €',
    ttc: '126,60 €',
  },
];

const hive = ref(ruches[0]!);
const vente = ref(ventes[0]!);

function ruchesById(id: string) {
  return ruches.find((r) => r.id === id) ?? ruches[0]!;
}

// Mini calendrier — mai 2025 commence un jeudi (offset 3)
const eventsByDay: Record<number, { color: string; title: string; sub: string }[]> = {
  5: [{ color: '#f5a623', title: 'Contrôle sanitaire', sub: 'R-05 · Rucher des Tilleuls' }],
  8: [
    { color: '#f5a623', title: 'Contrôle sanitaire', sub: 'R-12 · Rucher des Acacias' },
    { color: '#7a9676', title: 'Récolte de printemps', sub: 'R-01 · 11 kg' },
  ],
  12: [{ color: '#7a9676', title: 'Récolte acacia', sub: 'R-03 · 9 kg' }],
  15: [{ color: '#f5a623', title: 'Traitement Varroa', sub: 'R-12 · ApiLifeVar' }],
  18: [{ color: '#7a9676', title: 'Nourrissement', sub: 'R-07 · Sirop 2 L' }],
  22: [
    { color: '#f5a623', title: 'Traitement Varroa', sub: 'R-08 · Demain' },
    { color: '#f5a623', title: 'Contrôle', sub: 'R-03 · Rucher des Acacias' },
  ],
  27: [{ color: '#f5a623', title: 'Visite de printemps', sub: 'R-05' }],
};
const calendar = (() => {
  const cells: { key: string; day: number; in: boolean; dots: string[] }[] = [];
  for (let i = 0; i < 3; i++) cells.push({ key: `p${i}`, day: 28 + i, in: false, dots: [] });
  for (let d = 1; d <= 31; d++)
    cells.push({
      key: `d${d}`,
      day: d,
      in: true,
      dots: (eventsByDay[d] ?? []).map((e) => e.color),
    });
  let n = 1;
  while (cells.length < 42) cells.push({ key: `n${n}`, day: n++, in: false, dots: [] });
  return cells;
})();
const agenda = computed(() => eventsByDay[calDay.value] ?? []);

const urlPath = computed(() => {
  if (sub.value === 'hive') return `ruches/${hive.value.id.toLowerCase()}`;
  if (sub.value === 'form') return 'interventions/nouvelle';
  if (sub.value === 'invoice') return `finances/facture/${vente.value.facture.toLowerCase()}`;
  if (sub.value === 'success') return 'interventions/nouvelle';
  return screens[active.value]?.slug ?? 'dashboard';
});
const pageTitle = computed(() => {
  if (sub.value === 'hive') return `${hive.value.id} · ${hive.value.race}`;
  if (sub.value === 'form' || sub.value === 'success') return 'Nouvelle visite';
  if (sub.value === 'invoice') return 'Facture';
  return screens[active.value]?.label ?? '';
});

function go(i: number) {
  active.value = i;
  sub.value = null;
}
function back() {
  sub.value = sub.value === 'invoice' ? null : sub.value === 'hive' ? null : 'hive';
}
function openHive(r: (typeof ruches)[number] | undefined) {
  if (!r) return;
  hive.value = r;
  sub.value = 'hive';
}
function openInvoice(v: (typeof ventes)[number]) {
  vente.value = v;
  sub.value = 'invoice';
}
function openForm() {
  saving.value = false;
  sub.value = 'form';
}
async function saveForm() {
  saving.value = true;
  await new Promise((r) => setTimeout(r, 1100));
  saving.value = false;
  sub.value = 'success';
  await new Promise((r) => setTimeout(r, 1600));
  sub.value = 'hive';
}
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
  object-fit: cover;
}
.wm-brand-name {
  color: #fff;
  font-weight: 700;
  font-size: 15px;
  letter-spacing: -0.01em;
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
  font-weight: 500;
  text-align: left;
  width: 100%;
  transition:
    background 0.15s,
    color 0.15s;
}
.wm-nav-btn:hover {
  background: rgba(255, 255, 255, 0.05);
  color: rgba(255, 255, 255, 0.85);
}
.wm-nav-btn.active {
  background: var(--honey);
  color: #fff;
  font-weight: 600;
}
.wm-nav-ic {
  display: flex;
  width: 16px;
  height: 16px;
  flex-shrink: 0;
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
  font-weight: 700;
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
  font-weight: 600;
}
.wm-user-plan {
  color: var(--honey);
  font-size: 10.5px;
  font-weight: 500;
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
  padding: 14px 22px;
  border-bottom: 1px solid var(--border-default);
}
.wm-topbar-left {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}
.wm-back {
  width: 30px;
  height: 30px;
  border-radius: 8px;
  border: 1px solid var(--border-default);
  background: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: var(--text-secondary);
  flex-shrink: 0;
  transition: background 0.15s;
}
.wm-back:hover {
  background: var(--surface-muted);
}
.wm-page-title {
  font-size: 17px;
  font-weight: 600;
  color: var(--text-primary);
  letter-spacing: -0.015em;
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
  /* auto : les écrans denses (stocks déplié, analytics) scrollent comme la vraie app */
  overflow-y: auto;
  overflow-x: hidden;
  padding: 18px 22px;
}
.wm-screen {
  animation: wm-fade 0.3s ease;
}
@keyframes wm-fade {
  from {
    opacity: 0;
    transform: translateY(5px);
  }
  to {
    opacity: 1;
    transform: none;
  }
}

.wm-card-t {
  font-size: 10.5px;
  font-weight: 600;
  color: var(--text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.07em;
  margin-bottom: 9px;
}
.wm-row-between {
  display: flex;
  align-items: center;
  justify-content: space-between;
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
  font-size: 25px;
  font-weight: 700;
  color: var(--text-primary);
  letter-spacing: -0.025em;
  line-height: 1;
}
.wm-kpi-v i {
  font-size: 13px;
  font-weight: 600;
  font-style: normal;
  color: var(--text-tertiary);
  margin-left: 1px;
}
.wm-kpi-l {
  display: block;
  font-size: 11.5px;
  font-weight: 500;
  color: var(--text-tertiary);
  margin-top: 6px;
}
.wm-kpi-alert .wm-kpi-v {
  color: #dc2626;
}

/* Cols */
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
  position: relative;
  width: 100%;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 11px;
  background: var(--surface-primary);
  border: 1px solid var(--border-faint);
  border-radius: 10px;
  margin-bottom: 6px;
  text-align: left;
  transition:
    background 0.15s,
    border-color 0.15s;
}
.wm-clickable {
  cursor: pointer;
}
.wm-clickable:hover {
  background: var(--honey-soft);
  border-color: color-mix(in srgb, var(--honey) 30%, transparent);
}
.wm-static {
  cursor: default;
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
  font-weight: 400;
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
  height: 110px;
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
  opacity: 0.82;
}
.wm-bar:last-child {
  opacity: 1;
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
  font-weight: 500;
}
.wm-cta-row {
  width: 100%;
  margin-top: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 9px;
  border-radius: 10px;
  border: 1px dashed color-mix(in srgb, var(--honey) 45%, transparent);
  background: var(--honey-soft);
  color: var(--honey-deep);
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s;
}
.wm-cta-row:hover {
  background: color-mix(in srgb, var(--honey) 16%, transparent);
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
  font-weight: 600;
  background: var(--honey);
  color: #fff;
}
.wm-pill.ghost {
  background: #fff;
  color: var(--text-secondary);
  border: 1px solid var(--border-default);
  font-weight: 500;
}
.wm-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}
.wm-hive {
  position: relative;
  overflow: hidden;
  text-align: left;
  background: #fff;
  border: 1px solid var(--border-default);
  border-radius: 14px;
  padding: 14px;
  transition:
    transform 0.15s,
    box-shadow 0.15s;
}
.wm-hive.wm-clickable:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.08);
}
.wm-hive-accent {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
}
.wm-hive-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 6px;
  margin-top: 3px;
}
.wm-hive-id {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
  letter-spacing: -0.01em;
}
.wm-hive-badge {
  font-size: 10px;
  font-weight: 600;
  padding: 3px 9px;
  border-radius: 20px;
}
.wm-hive-race {
  font-size: 11.5px;
  font-weight: 400;
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
  font-weight: 600;
  color: var(--text-primary);
  margin-left: 3px;
}

/* Fiche ruche (drill-down) */
.wm-hd {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 14px;
}
.wm-hd-icon {
  width: 38px;
  height: 38px;
  border-radius: 11px;
  background: var(--honey-soft);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.wm-hd-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-primary);
  letter-spacing: -0.01em;
}
.wm-hd-sub {
  font-size: 11.5px;
  font-weight: 400;
  color: var(--text-tertiary);
  margin-top: 1px;
}
.wm-hd .wm-hive-badge {
  margin-left: auto;
}
.wm-statrow {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
  margin-bottom: 16px;
}
.wm-stat {
  background: #fff;
  border: 1px solid var(--border-default);
  border-radius: 12px;
  padding: 12px;
  text-align: center;
}
.wm-stat-v {
  display: block;
  font-size: 16px;
  font-weight: 700;
  color: var(--text-primary);
  letter-spacing: -0.02em;
}
.wm-stat-l {
  display: block;
  font-size: 10px;
  font-weight: 500;
  color: var(--text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-top: 3px;
}
.wm-mini-btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 7px 12px;
  border-radius: 9px;
  border: 1px solid color-mix(in srgb, var(--honey) 40%, transparent);
  background: var(--honey-soft);
  color: var(--honey-deep);
  font-size: 11.5px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s;
}
.wm-mini-btn:hover {
  background: color-mix(in srgb, var(--honey) 16%, transparent);
}
.wm-tl {
  margin-top: 10px;
}
.wm-tl-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 11px;
  background: #fff;
  border: 1px solid var(--border-faint);
  border-radius: 10px;
  margin-bottom: 6px;
}
.wm-tl-ic {
  font-size: 14px;
  flex-shrink: 0;
}

/* Formulaire */
.wm-form {
  max-width: 460px;
}
.wm-flbl {
  font-size: 10.5px;
  font-weight: 600;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 5px;
}
.wm-finput {
  background: #fff;
  border: 1px solid var(--border-default);
  border-radius: 9px;
  padding: 9px 12px;
  font-size: 12.5px;
  font-weight: 500;
  color: var(--text-primary);
  margin-bottom: 14px;
}
.wm-finput.sm {
  margin-bottom: 0;
}
.wm-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 14px;
}
.wm-chip {
  padding: 6px 12px;
  border-radius: 20px;
  border: 1px solid var(--border-default);
  background: #fff;
  font-size: 11.5px;
  font-weight: 500;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.15s;
}
.wm-chip.active {
  background: var(--honey);
  border-color: var(--honey);
  color: #fff;
  font-weight: 600;
}
.wm-form-row {
  display: flex;
  gap: 10px;
  margin-bottom: 14px;
}
.wm-fb {
  flex: 1;
}
.wm-ftextarea {
  background: #fff;
  border: 1px solid var(--border-default);
  border-radius: 9px;
  padding: 10px 12px;
  font-size: 12px;
  color: var(--text-secondary);
  min-height: 46px;
  margin-bottom: 16px;
}
.wm-save {
  width: 100%;
  padding: 11px;
  border-radius: 11px;
  background: var(--honey);
  border: none;
  font-size: 13px;
  font-weight: 600;
  color: #fff;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  transition: opacity 0.2s;
}
.wm-save.loading {
  opacity: 0.75;
  cursor: progress;
}
.wm-save:not(.loading):hover {
  background: var(--honey-dark);
}
@keyframes wm-spin {
  to {
    transform: rotate(360deg);
  }
}
.wm-spin {
  animation: wm-spin 0.7s linear infinite;
}

/* Succès */
.wm-success {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 56px 20px;
}
.wm-success-ring {
  padding: 9px;
  border-radius: 50%;
  background: var(--honey-soft);
}
.wm-success-check {
  width: 54px;
  height: 54px;
  border-radius: 50%;
  background: var(--honey);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 16px color-mix(in srgb, var(--honey) 35%, transparent);
}
.wm-success-t {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
}
.wm-success-s {
  font-size: 12px;
  font-weight: 400;
  color: var(--text-tertiary);
}

/* Facture */
.wm-invoice {
  max-width: 440px;
  background: #fff;
  border: 1px solid var(--border-default);
  border-radius: 14px;
  padding: 18px;
}
.wm-inv-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  border-bottom: 1px solid var(--border-faint);
  padding-bottom: 12px;
  margin-bottom: 12px;
}
.wm-inv-num {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-primary);
}
.wm-inv-sub {
  font-size: 11.5px;
  font-weight: 400;
  color: var(--text-tertiary);
  margin-top: 2px;
}
.wm-inv-badge {
  font-size: 10.5px;
  font-weight: 600;
  color: #4f6a4c;
  background: #eef2eb;
  padding: 4px 9px;
  border-radius: 20px;
}
.wm-inv-line {
  display: flex;
  justify-content: space-between;
  font-size: 12.5px;
  font-weight: 500;
  color: var(--text-primary);
  padding: 5px 0;
}
.wm-inv-line.muted {
  color: var(--text-tertiary);
  font-weight: 400;
}
.wm-inv-total {
  display: flex;
  justify-content: space-between;
  font-size: 14px;
  font-weight: 700;
  color: var(--text-primary);
  border-top: 1px solid var(--border-faint);
  margin-top: 8px;
  padding-top: 10px;
}
.wm-inv-client {
  font-size: 11.5px;
  color: var(--text-tertiary);
  margin-top: 12px;
}

/* Calendrier */
.wm-cal-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14px;
}
.wm-cal-month {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-primary);
  letter-spacing: -0.01em;
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
.wm-cal-layout {
  display: grid;
  grid-template-columns: 1.5fr 1fr;
  gap: 14px;
}
.wm-cal-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 4px;
}
.wm-cal-dow {
  text-align: center;
  font-size: 10px;
  font-weight: 600;
  color: var(--text-quaternary);
  text-transform: uppercase;
  padding-bottom: 4px;
}
.wm-cal-cell {
  aspect-ratio: 1.25;
  background: #fff;
  border: 1px solid var(--border-faint);
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 3px;
  cursor: default;
  padding: 0;
}
.wm-cal-cell.clickable {
  cursor: pointer;
  transition:
    border-color 0.15s,
    background 0.15s;
}
.wm-cal-cell.clickable:hover {
  border-color: color-mix(in srgb, var(--honey) 40%, transparent);
}
.wm-cal-cell.muted {
  background: var(--surface-muted);
}
.wm-cal-cell.muted .wm-cal-num {
  color: var(--text-quaternary);
}
.wm-cal-cell.sel {
  background: var(--honey-soft);
  border-color: color-mix(in srgb, var(--honey) 45%, transparent);
}
.wm-cal-num {
  font-size: 12px;
  font-weight: 500;
  color: var(--text-primary);
}
.wm-cal-cell.sel .wm-cal-num {
  color: var(--honey-deep);
  font-weight: 700;
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
.wm-cal-agenda {
  background: #fff;
  border: 1px solid var(--border-default);
  border-radius: 12px;
  padding: 14px;
}
.wm-agenda-item {
  display: flex;
  align-items: center;
  gap: 9px;
  padding: 9px 0;
  border-bottom: 1px solid var(--border-faint);
}
.wm-agenda-item:last-child {
  border-bottom: none;
}
.wm-agenda-empty {
  font-size: 12px;
  color: var(--text-tertiary);
  padding: 12px 0;
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
  font-weight: 500;
  color: rgba(255, 255, 255, 0.5);
  text-transform: uppercase;
  letter-spacing: 0.06em;
}
.wm-ca-v {
  font-size: 29px;
  font-weight: 700;
  color: #fff;
  letter-spacing: -0.03em;
  margin-top: 3px;
}
.wm-ca-v span {
  font-size: 17px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.55);
}
.wm-ca-badge {
  background: rgba(245, 166, 35, 0.2);
  color: var(--honey);
  font-size: 10.5px;
  font-weight: 600;
  padding: 4px 9px;
  border-radius: 20px;
}
.wm-fin-stats {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.wm-fstat {
  flex: 1;
  background: #fff;
  border: 1px solid var(--border-default);
  border-radius: 12px;
  padding: 10px 14px;
  display: flex;
  flex-direction: column;
  justify-content: center;
}
.wm-fstat-v {
  font-size: 16px;
  font-weight: 700;
  color: var(--text-primary);
  letter-spacing: -0.02em;
}
.wm-fstat-l {
  font-size: 10.5px;
  font-weight: 500;
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
  position: relative;
  width: 100%;
  text-align: left;
  display: flex;
  align-items: center;
  gap: 11px;
  padding: 11px 14px;
  border: none;
  border-bottom: 1px solid var(--border-faint);
  background: #fff;
  transition: background 0.15s;
}
.wm-trow:last-child {
  border-bottom: none;
}
.wm-trow.wm-clickable:hover {
  background: var(--honey-soft);
}
.wm-euro {
  width: 26px;
  height: 26px;
  border-radius: 50%;
  background: #eef2eb;
  color: #4f6a4c;
  font-size: 12px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.wm-facture {
  font-size: 10.5px;
  font-weight: 500;
  color: var(--text-quaternary);
  background: var(--surface-muted);
  padding: 3px 8px;
  border-radius: 6px;
  flex-shrink: 0;
}
.wm-amount {
  font-size: 13px;
  font-weight: 700;
  color: #4f6a4c;
  flex-shrink: 0;
}

/* Indice cliquable */
.wm-clickhint {
  position: absolute;
  top: 8px;
  right: 8px;
  color: var(--honey);
  display: flex;
  pointer-events: none;
  animation: wm-pulse 1.7s ease-in-out infinite;
}
@keyframes wm-pulse {
  0%,
  100% {
    transform: scale(1);
    opacity: 0.9;
  }
  50% {
    transform: scale(0.82);
    opacity: 0.5;
  }
}
.wm-demo-hint {
  position: absolute;
  bottom: 14px;
  right: 14px;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 11px;
  background: rgba(28, 28, 30, 0.82);
  color: #fff;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 500;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.25);
  pointer-events: none;
  z-index: 5;
  backdrop-filter: blur(4px);
}
.wm-demo-hint svg {
  color: var(--honey);
  animation: wm-pulse 1.7s ease-in-out infinite;
}

@media (max-width: 860px) {
  .wm-demo-hint {
    display: none;
  }
}
</style>
