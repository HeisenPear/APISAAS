<template>
  <div ref="wrapperRef" class="phone-wrapper" :class="{ 'phone-wrapper--visible': isVisible }">
    <div class="phone-glow" />

    <div class="phone-frame">
      <!-- Physical buttons -->
      <div class="phone-btn-mute" />
      <div class="phone-btn-vol-up" />
      <div class="phone-btn-vol-down" />
      <div class="phone-btn-power" />

      <div class="phone-screen">
        <!-- Dynamic Island -->
        <div class="phone-island">
          <div class="phone-island-camera" />
        </div>

        <!-- Status bar -->
        <div class="phone-status">
          <span class="phone-time">9:41</span>
          <div class="phone-status-icons">
            <div class="status-signal">
              <span /><span /><span /><span />
            </div>
            <div class="status-wifi">
              <span /><span /><span />
            </div>
            <div class="status-battery">
              <div class="status-battery-fill" />
              <div class="status-battery-tip" />
            </div>
          </div>
        </div>

        <!-- Slides -->
        <div ref="slidesRef" class="phone-slides">

          <!-- ── SLIDE 1 : TABLEAU DE BORD ── -->
          <div class="phone-slide phone-slide--active">
            <div class="s-pad">
              <div class="s-row-between mb-2">
                <div>
                  <p class="s-eyebrow">BONJOUR 👋</p>
                  <p class="s-h1">Antoine</p>
                </div>
                <div class="s-avatar">AM</div>
              </div>

              <div class="s-kpi-grid mb-2">
                <div class="s-kpi" style="background:#fef6e4">
                  <p class="s-kpi-lbl" style="color:#a86a13">RUCHES</p>
                  <p class="s-kpi-val">12</p>
                  <p class="s-kpi-sub" style="color:#d4891a">/ 14 total</p>
                </div>
                <div class="s-kpi" style="background:#eef2eb">
                  <p class="s-kpi-lbl" style="color:#4f6a4c">PROD.</p>
                  <p class="s-kpi-val">247<span class="s-kpi-u">kg</span></p>
                  <p class="s-kpi-sub" style="color:#7a9676">Saison</p>
                </div>
                <div class="s-kpi" style="background:#f0f4fb">
                  <p class="s-kpi-lbl" style="color:#2a5298">CA</p>
                  <p class="s-kpi-val">3,4<span class="s-kpi-u">k€</span></p>
                  <p class="s-kpi-sub" style="color:#4a7cc7">Année</p>
                </div>
                <div class="s-kpi" style="background:#fff1f0">
                  <p class="s-kpi-lbl" style="color:#9b1b1b">ALERTES</p>
                  <p class="s-kpi-val" style="color:#dc2626">2</p>
                  <p class="s-kpi-sub" style="color:#ef4444">Urgent</p>
                </div>
              </div>

              <p class="s-section-lbl">ALERTES RÉCENTES</p>
              <div class="s-card-item">
                <div class="s-dot" style="background:#ef4444" />
                <div class="s-item-body">
                  <p class="s-item-title">R-12 — Varroa élevé</p>
                  <p class="s-item-sub">Rucher du Moulin · Urgent</p>
                </div>
                <span class="s-chev">›</span>
              </div>
              <div class="s-card-item">
                <div class="s-dot" style="background:#f5a623" />
                <div class="s-item-body">
                  <p class="s-item-title">R-07 — Faible pop.</p>
                  <p class="s-item-sub">Rucher des Chênes · Info</p>
                </div>
                <span class="s-chev">›</span>
              </div>

              <!-- Bottom nav -->
              <div class="s-bottom-nav">
                <div class="s-nav-item s-nav-item--active">
                  <svg viewBox="0 0 20 20" fill="currentColor" class="s-nav-icon"><path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" /></svg>
                  <p>Accueil</p>
                </div>
                <div class="s-nav-item">
                  <svg viewBox="0 0 20 20" fill="currentColor" class="s-nav-icon"><path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"/><path fill-rule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clip-rule="evenodd"/></svg>
                  <p>Visites</p>
                </div>
                <div class="s-nav-item">
                  <svg viewBox="0 0 20 20" fill="currentColor" class="s-nav-icon"><path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z"/><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clip-rule="evenodd"/></svg>
                  <p>Finances</p>
                </div>
                <div class="s-nav-item">
                  <svg viewBox="0 0 20 20" fill="currentColor" class="s-nav-icon"><path fill-rule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clip-rule="evenodd"/></svg>
                  <p>Réglages</p>
                </div>
              </div>
            </div>
          </div>

          <!-- ── SLIDE 2 : NOUVELLE INTERVENTION ── -->
          <div class="phone-slide">
            <div class="s-pad">
              <div class="s-nav-header mb-3">
                <div class="s-back">‹</div>
                <p class="s-nav-title">Nouvelle intervention</p>
              </div>

              <div class="s-rucher-pill mb-3">
                <div class="s-rucher-dot" />
                <span>Rucher du Moulin</span>
                <span class="s-rucher-caret">▾</span>
              </div>

              <p class="s-field-lbl">Type d'intervention</p>
              <div class="s-select s-select--active mb-2">
                <span style="color:#f5a623;font-weight:700;font-size:10px">Traitement Varroa</span>
                <span style="color:#a8a29e">▾</span>
              </div>

              <div class="s-row-2col mb-2">
                <div class="s-col">
                  <p class="s-field-lbl">Ruche</p>
                  <div class="s-select">
                    <span style="font-size:9.5px">R-12 Alsacienne</span>
                    <span style="color:#a8a29e">▾</span>
                  </div>
                </div>
                <div class="s-col">
                  <p class="s-field-lbl">Date</p>
                  <div class="s-select">
                    <span style="font-size:9.5px">22 mai 2025</span>
                  </div>
                </div>
              </div>

              <p class="s-field-lbl">Produit utilisé</p>
              <div class="s-select mb-2">
                <span style="font-size:9.5px">ApiLifeVar (thymol)</span>
                <span style="color:#a8a29e">▾</span>
              </div>

              <p class="s-field-lbl">Dose / remarques</p>
              <div class="s-textarea mb-3">
                <span style="font-size:9.5px;color:#57534e">2 plaquettes · ré-application J+7</span>
              </div>

              <div class="s-btn-honey">Enregistrer l'intervention</div>
            </div>
          </div>

          <!-- ── SLIDE 3 : FICHE RUCHE (QR scan résultat) ── -->
          <div class="phone-slide">
            <div class="s-pad">
              <div class="s-nav-header mb-2">
                <div class="s-back">‹</div>
                <p class="s-nav-title">Rucher du Moulin</p>
                <div class="s-qr-icon">
                  <svg viewBox="0 0 20 20" fill="currentColor" width="14" height="14" style="color:#f5a623"><path fill-rule="evenodd" d="M3 4a1 1 0 011-1h3a1 1 0 011 1v3a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm2 2V5h1v1H5zM3 13a1 1 0 011-1h3a1 1 0 011 1v3a1 1 0 01-1 1H4a1 1 0 01-1-1v-3zm2 2v-1h1v1H5zM13 3a1 1 0 00-1 1v3a1 1 0 001 1h3a1 1 0 001-1V4a1 1 0 00-1-1h-3zm1 2v1h1V5h-1z" clip-rule="evenodd"/><path d="M11 4a1 1 0 10-2 0v1a1 1 0 002 0V4zM10 7a1 1 0 011 1v1h2a1 1 0 110 2h-3a1 1 0 01-1-1V8a1 1 0 011-1zM16 9a1 1 0 100 2 1 1 0 000-2zM9 13a1 1 0 011-1h1a1 1 0 110 2v2a1 1 0 11-2 0v-3zM7 11a1 1 0 100-2H4a1 1 0 100 2h3zM17 13a1 1 0 01-1 1h-2a1 1 0 110-2h2a1 1 0 011 1zM16 17a1 1 0 100-2h-3a1 1 0 100 2h3z"/></svg>
                </div>
              </div>

              <!-- Ruche card R-12 -->
              <div class="s-ruche-card mb-2">
                <div class="s-ruche-card-header">
                  <div class="s-ruche-dot-alert" />
                  <div class="s-ruche-card-title">
                    <p class="s-ruche-id">R-12 — Ruche alsacienne</p>
                    <p class="s-ruche-meta">Intro. mars 2023 · Reine 2024</p>
                  </div>
                  <div class="s-badge-alert">⚠ Alerte</div>
                </div>
                <div class="s-ruche-stats">
                  <div class="s-ruche-stat"><p class="s-rs-val" style="color:#dc2626">3,2%</p><p class="s-rs-lbl">Varroa</p></div>
                  <div class="s-ruche-stat-div" />
                  <div class="s-ruche-stat"><p class="s-rs-val">Fort</p><p class="s-rs-lbl">Population</p></div>
                  <div class="s-ruche-stat-div" />
                  <div class="s-ruche-stat"><p class="s-rs-val" style="color:#f5a623">Présente</p><p class="s-rs-lbl">Reine</p></div>
                </div>
              </div>

              <!-- Liste ruches -->
              <p class="s-section-lbl">TOUTES LES RUCHES (4)</p>
              <div v-for="ruche in ruches" :key="ruche.id" class="s-ruche-row">
                <div class="s-dot" :style="`background:${ruche.color}`" />
                <div class="s-item-body">
                  <p class="s-item-title">{{ ruche.id }} — {{ ruche.type }}</p>
                  <p class="s-item-sub">{{ ruche.note }}</p>
                </div>
                <span class="s-chev">›</span>
              </div>
            </div>
          </div>

          <!-- ── SLIDE 4 : FINANCES ── -->
          <div class="phone-slide">
            <div class="s-pad">
              <div class="s-row-between mb-3">
                <p class="s-h1">Finances</p>
                <span class="s-year-badge">2025</span>
              </div>

              <!-- CA card avec chart -->
              <div class="s-ca-card mb-2">
                <p class="s-ca-lbl">Chiffre d'affaires</p>
                <p class="s-ca-val">3 420 €</p>
                <div class="s-chart">
                  <div v-for="(bar, i) in chartBars" :key="i" class="s-chart-bar" :style="`height:${bar}%;opacity:${i===5?1:0.5};background:${i===5?'#f5a623':'#f5a623'}`" />
                </div>
                <div class="s-chart-labels">
                  <span v-for="m in ['Jan','Fév','Mar','Avr','Mai','Jui']" :key="m">{{ m }}</span>
                </div>
              </div>

              <!-- Stats row -->
              <div class="s-stats-row mb-2">
                <div class="s-stat-item">
                  <p class="s-stat-v">680 €</p>
                  <p class="s-stat-l">Charges</p>
                </div>
                <div class="s-stat-sep" />
                <div class="s-stat-item">
                  <p class="s-stat-v" style="color:#4f6a4c">2 740 €</p>
                  <p class="s-stat-l">Résultat net</p>
                </div>
                <div class="s-stat-sep" />
                <div class="s-stat-item">
                  <p class="s-stat-v">13,9€</p>
                  <p class="s-stat-l">/ kg miel</p>
                </div>
              </div>

              <!-- Transactions récentes -->
              <p class="s-section-lbl">DERNIÈRES VENTES</p>
              <div v-for="vente in ventes" :key="vente.id" class="s-card-item">
                <div class="s-vente-icon">€</div>
                <div class="s-item-body">
                  <p class="s-item-title">{{ vente.client }}</p>
                  <p class="s-item-sub">{{ vente.date }} · {{ vente.produit }}</p>
                </div>
                <span class="s-vente-amount">+{{ vente.amount }}</span>
              </div>

              <div class="s-btn-outline mt-2">+ Nouvelle vente</div>
            </div>
          </div>

        </div>

        <!-- Dots -->
        <div class="phone-dots">
          <div v-for="i in 4" :key="i" class="phone-dot" :class="{ 'phone-dot--active': currentSlide === i - 1 }" @click="jumpTo(i - 1)" />
        </div>

        <div class="phone-home-bar" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onBeforeUnmount } from 'vue';

const props = defineProps<{ activeSlide?: number }>();
const emit = defineEmits<{ 'update:activeSlide': [value: number] }>();

const currentSlide = ref(0);
const isVisible = ref(false);
const wrapperRef = ref<HTMLElement | null>(null);
const slidesRef = ref<HTMLElement | null>(null);

const chartBars = [30, 48, 38, 62, 72, 100];

const ruches = [
  { id: 'R-12', type: 'Ruche alsacienne', note: 'Alerte varroa · Reine 2024', color: '#ef4444' },
  { id: 'R-07', type: 'Dadant 10c', note: 'Faible pop. · Intro fév 2023', color: '#f5a623' },
  { id: 'R-01', type: 'Dadant 12c', note: 'Bonne santé · Reine 2025', color: '#4f6a4c' },
  { id: 'R-15', type: 'Warré', note: 'Essaim 2024 · Actif', color: '#4f6a4c' },
];

const ventes = [
  { id: 1, client: 'Marché de Caussade', date: '18 mai', produit: 'Miel toutes fleurs 5kg', amount: '75€' },
  { id: 2, client: 'GAEC Lefebvre', date: '12 mai', produit: 'Miel acacia 12kg', amount: '216€' },
];

function applySlide(index: number) {
  const slides = slidesRef.value?.querySelectorAll('.phone-slide');
  slides?.forEach((s, i) => s.classList.toggle('phone-slide--active', i === index));
}

function jumpTo(index: number) {
  currentSlide.value = index;
  applySlide(index);
  emit('update:activeSlide', index);
}

watch(() => props.activeSlide, (val) => {
  if (val !== undefined && val !== currentSlide.value) {
    currentSlide.value = val;
    applySlide(val);
  }
});

let interval: ReturnType<typeof setInterval> | null = null;
let observer: IntersectionObserver | null = null;

onMounted(() => {
  const showPhone = () => { isVisible.value = true; observer?.disconnect(); };

  if (wrapperRef.value && typeof IntersectionObserver !== 'undefined') {
    observer = new IntersectionObserver(
      ([entry]) => { if (entry?.isIntersecting) showPhone(); },
      { threshold: 0, rootMargin: '0px 0px -50px 0px' },
    );
    observer.observe(wrapperRef.value);
    setTimeout(() => { if (!isVisible.value) showPhone(); }, 600);
  } else {
    showPhone();
  }

  interval = setInterval(() => {
    if (props.activeSlide !== undefined) return;
    const next = (currentSlide.value + 1) % 4;
    currentSlide.value = next;
    applySlide(next);
    emit('update:activeSlide', next);
  }, 3500);
});

onBeforeUnmount(() => {
  if (interval) clearInterval(interval);
  observer?.disconnect();
});
</script>

<style scoped>
/* ─── WRAPPER ─── */
.phone-wrapper {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  opacity: 0;
  transform: translateY(24px) scale(0.97);
  transition: opacity 0.7s ease, transform 0.7s ease;
}
.phone-wrapper--visible { opacity: 1; transform: translateY(0) scale(1); }

.phone-glow {
  position: absolute;
  bottom: -40px;
  left: 50%;
  transform: translateX(-50%);
  width: 200px;
  height: 60px;
  background: radial-gradient(ellipse, rgba(245,166,35,0.25) 0%, transparent 70%);
  filter: blur(20px);
  pointer-events: none;
}

/* ─── FRAME ─── */
.phone-frame {
  position: relative;
  width: 264px;
  height: 556px;
  background: linear-gradient(160deg, #3a3a3c 0%, #1c1c1e 40%, #2c2c2e 100%);
  border-radius: 50px;
  border: 1px solid rgba(255,255,255,0.1);
  box-shadow:
    0 0 0 1px rgba(0,0,0,0.6),
    inset 0 1px 0 rgba(255,255,255,0.07),
    inset 0 -1px 0 rgba(0,0,0,0.3),
    0 50px 120px rgba(0,0,0,0.55),
    0 15px 40px rgba(0,0,0,0.35);
  padding: 12px 8px 10px;
}
@media (min-width: 768px) {
  .phone-frame {
    transform: perspective(900px) rotateY(-5deg) rotateX(1.5deg);
    transition: transform 0.5s cubic-bezier(0.25,0.46,0.45,0.94);
  }
  .phone-frame:hover { transform: perspective(900px) rotateY(0deg) rotateX(0deg); }
}

.phone-btn-mute, .phone-btn-vol-up, .phone-btn-vol-down {
  position: absolute; left: -3px; width: 3px;
  border-radius: 2px 0 0 2px;
  background: linear-gradient(180deg,#4a4a4c,#3a3a3c);
}
.phone-btn-mute { top: 100px; height: 30px; }
.phone-btn-vol-up { top: 148px; height: 48px; }
.phone-btn-vol-down { top: 208px; height: 48px; }
.phone-btn-power {
  position: absolute; right: -3px; top: 160px; width: 3px; height: 64px;
  border-radius: 0 2px 2px 0; background: linear-gradient(180deg,#4a4a4c,#3a3a3c);
}

/* ─── SCREEN ─── */
.phone-screen {
  width: 100%; height: 100%; border-radius: 42px;
  background: #fafaf8; overflow: hidden;
  position: relative; display: flex; flex-direction: column;
}

/* ─── DYNAMIC ISLAND ─── */
.phone-island {
  position: absolute; top: 10px; left: 50%; transform: translateX(-50%);
  width: 100px; height: 32px; background: #1c1c1e; border-radius: 20px;
  z-index: 20; display: flex; align-items: center; justify-content: flex-end; padding-right: 12px;
}
.phone-island-camera {
  width: 10px; height: 10px; border-radius: 50%;
  background: radial-gradient(circle at 35% 35%,#2d2d2e,#0a0a0a);
  border: 1px solid rgba(255,255,255,0.06);
}

/* ─── STATUS BAR ─── */
.phone-status {
  position: relative; z-index: 15;
  display: flex; align-items: center; justify-content: space-between;
  padding: 14px 18px 4px; flex-shrink: 0;
}
.phone-time { font-size: 11px; font-weight: 700; color: #1c1c1e; letter-spacing: -0.02em; font-variant-numeric: tabular-nums; }

.phone-status-icons { display: flex; align-items: center; gap: 5px; }

/* Signal bars */
.status-signal { display: flex; align-items: flex-end; gap: 2px; height: 11px; }
.status-signal span { width: 3px; border-radius: 1px; background: #1c1c1e; }
.status-signal span:nth-child(1) { height: 30%; opacity: 0.3; }
.status-signal span:nth-child(2) { height: 55%; opacity: 0.6; }
.status-signal span:nth-child(3) { height: 78%; opacity: 0.8; }
.status-signal span:nth-child(4) { height: 100%; }

/* WiFi arcs */
.status-wifi { position: relative; width: 14px; height: 11px; display: flex; flex-direction: column; align-items: center; justify-content: flex-end; gap: 1px; }
.status-wifi span {
  display: block; border-radius: 50%;
  border: 1.5px solid #1c1c1e;
  border-bottom-color: transparent; border-left-color: transparent;
  transform: rotate(45deg);
}
.status-wifi span:nth-child(1) { width: 5px; height: 5px; opacity: 1; }
.status-wifi span:nth-child(2) { width: 9px; height: 9px; opacity: 0.6; position: absolute; bottom: 1px; }
.status-wifi span:nth-child(3) { width: 13px; height: 13px; opacity: 0.3; position: absolute; bottom: 0px; }

/* Battery */
.status-battery { position: relative; display: flex; align-items: center; width: 22px; height: 11px; }
.status-battery::before {
  content: ''; flex: 1; height: 100%;
  border: 1.5px solid #1c1c1e; border-radius: 2.5px;
  display: block;
}
.status-battery-fill {
  position: absolute; left: 2px; top: 2px;
  width: 75%; height: calc(100% - 4px);
  background: #1c1c1e; border-radius: 1px;
}
.status-battery-tip {
  width: 2px; height: 5px; background: #1c1c1e; border-radius: 0 1px 1px 0; margin-left: 1px; flex-shrink: 0;
}

/* ─── SLIDES ─── */
.phone-slides { position: relative; flex: 1; overflow: hidden; }
.phone-slide {
  position: absolute; inset: 0; background: #fafaf8;
  opacity: 0; transform: translateX(20px);
  transition: opacity 0.45s ease, transform 0.45s ease;
  pointer-events: none; overflow: hidden;
}
.phone-slide--active { opacity: 1; transform: translateX(0); pointer-events: auto; }

/* ─── DOTS ─── */
.phone-dots { display: flex; gap: 5px; justify-content: center; padding: 6px 0 4px; background: #fafaf8; flex-shrink: 0; }
.phone-dot { width: 5px; height: 5px; border-radius: 50%; background: rgba(0,0,0,0.15); cursor: pointer; transition: all 0.3s; }
.phone-dot--active { width: 14px; border-radius: 3px; background: #f5a623; }
.phone-home-bar { width: 90px; height: 4px; background: rgba(0,0,0,0.18); border-radius: 2px; margin: 4px auto 8px; flex-shrink: 0; }

/* ─── COMMUN SLIDES ─── */
.s-pad { padding: 8px 12px 0; height: 100%; display: flex; flex-direction: column; }
.s-eyebrow { font-size: 8.5px; font-weight: 700; color: #a8a29e; text-transform: uppercase; letter-spacing: 0.08em; }
.s-h1 { font-size: 16px; font-weight: 800; color: #1c1c1e; letter-spacing: -0.025em; line-height: 1.1; }
.s-section-lbl { font-size: 8px; font-weight: 700; color: #a8a29e; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 4px; margin-top: 2px; }
.s-row-between { display: flex; align-items: center; justify-content: space-between; }
.s-avatar { width: 30px; height: 30px; border-radius: 50%; background: #fef6e4; color: #a86a13; font-size: 9px; font-weight: 800; display: flex; align-items: center; justify-content: center; }

/* KPI grid */
.s-kpi-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 4px; }
.s-kpi { border-radius: 10px; padding: 6px 7px; }
.s-kpi-lbl { font-size: 7.5px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.07em; margin-bottom: 1px; }
.s-kpi-val { font-size: 18px; font-weight: 800; color: #1c1c1e; line-height: 1.1; }
.s-kpi-u { font-size: 9px; font-weight: 600; color: #a8a29e; margin-left: 1px; }
.s-kpi-sub { font-size: 8px; margin-top: 1px; }

/* List cards */
.s-card-item { display: flex; align-items: center; gap: 7px; background: white; border: 1px solid rgba(214,211,209,0.5); border-radius: 9px; padding: 6px 8px; margin-bottom: 4px; }
.s-dot { width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0; }
.s-item-body { flex: 1; min-width: 0; }
.s-item-title { font-size: 10px; font-weight: 600; color: #1c1c1e; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.s-item-sub { font-size: 8.5px; color: #a8a29e; }
.s-chev { font-size: 13px; color: #d6d3d1; line-height: 1; }

/* Bottom nav */
.s-bottom-nav { display: flex; border-top: 1px solid rgba(214,211,209,0.5); padding: 6px 0 2px; margin-top: auto; }
.s-nav-item { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 2px; }
.s-nav-item p { font-size: 7px; font-weight: 500; color: #a8a29e; }
.s-nav-icon { width: 14px; height: 14px; color: #a8a29e; }
.s-nav-item--active .s-nav-icon { color: #f5a623; }
.s-nav-item--active p { color: #f5a623; font-weight: 700; }

/* Intervention form */
.s-nav-header { display: flex; align-items: center; gap: 8px; }
.s-back { width: 22px; height: 22px; border-radius: 6px; background: #f5f4f1; display: flex; align-items: center; justify-content: center; font-size: 14px; color: #57534e; line-height: 1; flex-shrink: 0; }
.s-nav-title { font-size: 12.5px; font-weight: 700; color: #1c1c1e; flex: 1; }
.s-qr-icon { width: 22px; height: 22px; border-radius: 6px; background: #fef6e4; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }

.s-rucher-pill { display: inline-flex; align-items: center; gap: 5px; background: #fef6e4; border: 1px solid rgba(245,166,35,0.3); border-radius: 8px; padding: 4px 9px; font-size: 10px; font-weight: 700; color: #a86a13; }
.s-rucher-dot { width: 6px; height: 6px; border-radius: 50%; background: #f5a623; }
.s-rucher-caret { font-size: 8px; opacity: 0.6; }

.s-field-lbl { font-size: 8px; font-weight: 700; color: #a8a29e; text-transform: uppercase; letter-spacing: 0.07em; margin-bottom: 3px; }
.s-select { display: flex; align-items: center; justify-content: space-between; background: white; border: 1px solid rgba(214,211,209,0.6); border-radius: 9px; padding: 6px 9px; font-size: 10px; color: #57534e; }
.s-select--active { border-color: rgba(245,166,35,0.5); box-shadow: 0 0 0 2px rgba(245,166,35,0.1); }
.s-row-2col { display: flex; gap: 6px; }
.s-col { flex: 1; }
.s-textarea { background: white; border: 1px solid rgba(214,211,209,0.6); border-radius: 9px; padding: 6px 9px; min-height: 36px; }
.s-btn-honey { background: #f5a623; color: white; font-size: 11px; font-weight: 800; text-align: center; padding: 9px 0; border-radius: 11px; box-shadow: 0 4px 12px rgba(245,166,35,0.35); }
.s-btn-outline { border: 1.5px solid #f5a623; color: #a86a13; font-size: 11px; font-weight: 700; text-align: center; padding: 8px 0; border-radius: 11px; background: #fef6e4; }

/* Ruche card */
.s-ruche-card { background: white; border: 1px solid rgba(214,211,209,0.6); border-radius: 12px; padding: 8px 10px; }
.s-ruche-card-header { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; }
.s-ruche-dot-alert { width: 8px; height: 8px; border-radius: 50%; background: #ef4444; flex-shrink: 0; box-shadow: 0 0 4px rgba(239,68,68,0.5); }
.s-ruche-card-title { flex: 1; }
.s-ruche-id { font-size: 10.5px; font-weight: 700; color: #1c1c1e; }
.s-ruche-meta { font-size: 8.5px; color: #a8a29e; }
.s-badge-alert { font-size: 8.5px; font-weight: 700; color: #dc2626; background: #fff1f0; border-radius: 6px; padding: 2px 6px; }

.s-ruche-stats { display: flex; align-items: center; gap: 0; background: #fafaf8; border-radius: 8px; padding: 5px 0; }
.s-ruche-stat { flex: 1; text-align: center; }
.s-rs-val { font-size: 11px; font-weight: 700; color: #1c1c1e; }
.s-rs-lbl { font-size: 7.5px; color: #a8a29e; text-transform: uppercase; letter-spacing: 0.05em; }
.s-ruche-stat-div { width: 1px; height: 22px; background: rgba(214,211,209,0.5); }

.s-ruche-row { display: flex; align-items: center; gap: 7px; padding: 5px 6px; border-radius: 8px; background: white; border: 1px solid rgba(214,211,209,0.4); margin-bottom: 3px; }

/* Finances */
.s-year-badge { background: #f5f4f1; color: #57534e; font-size: 9px; font-weight: 700; padding: 2px 7px; border-radius: 6px; }
.s-ca-card { background: white; border: 1px solid rgba(214,211,209,0.6); border-radius: 12px; padding: 8px 10px 6px; }
.s-ca-lbl { font-size: 8px; font-weight: 700; color: #a8a29e; text-transform: uppercase; letter-spacing: 0.07em; margin-bottom: 2px; }
.s-ca-val { font-size: 20px; font-weight: 800; color: #1c1c1e; letter-spacing: -0.03em; margin-bottom: 6px; }
.s-chart { display: flex; align-items: flex-end; gap: 3px; height: 30px; }
.s-chart-bar { flex: 1; border-radius: 3px 3px 0 0; min-height: 3px; background: #f5a623; }
.s-chart-labels { display: flex; justify-content: space-between; margin-top: 2px; }
.s-chart-labels span { font-size: 7px; color: #a8a29e; text-align: center; flex: 1; }
.s-stats-row { display: flex; align-items: center; background: #f5f4f1; border-radius: 10px; padding: 6px 8px; }
.s-stat-item { flex: 1; text-align: center; }
.s-stat-v { font-size: 10px; font-weight: 700; color: #1c1c1e; }
.s-stat-l { font-size: 7px; color: #a8a29e; text-transform: uppercase; letter-spacing: 0.04em; margin-top: 1px; }
.s-stat-sep { width: 1px; height: 22px; background: rgba(214,211,209,0.6); }

.s-vente-icon { width: 22px; height: 22px; border-radius: 6px; background: #eef2eb; color: #4f6a4c; font-size: 10px; font-weight: 700; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.s-vente-amount { font-size: 10px; font-weight: 700; color: #4f6a4c; flex-shrink: 0; }
</style>
