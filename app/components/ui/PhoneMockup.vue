<template>
  <div ref="wrapperRef" class="phone-wrapper" :class="{ 'phone-wrapper--visible': isVisible }">
    <!-- Ambient glow -->
    <div class="phone-glow" />

    <!-- iPhone frame -->
    <div class="phone-frame">
      <!-- Side buttons left -->
      <div class="phone-btn-mute" />
      <div class="phone-btn-vol-up" />
      <div class="phone-btn-vol-down" />
      <!-- Side button right -->
      <div class="phone-btn-power" />

      <!-- Screen -->
      <div class="phone-screen">
        <!-- Dynamic Island -->
        <div class="phone-island">
          <div class="phone-island-camera" />
        </div>

        <!-- Status bar -->
        <div class="phone-status">
          <span class="phone-time">9:41</span>
          <div class="phone-status-icons">
            <svg width="16" height="10" viewBox="0 0 16 10" fill="none">
              <rect x="0" y="3" width="3" height="7" rx="1" fill="currentColor" opacity="0.4"/>
              <rect x="4.5" y="2" width="3" height="8" rx="1" fill="currentColor" opacity="0.6"/>
              <rect x="9" y="0.5" width="3" height="9.5" rx="1" fill="currentColor"/>
            </svg>
            <svg width="15" height="11" viewBox="0 0 15 11" fill="none">
              <path d="M7.5 2.5C9.3 2.5 10.9 3.2 12.1 4.3L13.5 2.9C11.9 1.4 9.8 0.5 7.5 0.5C5.2 0.5 3.1 1.4 1.5 2.9L2.9 4.3C4.1 3.2 5.7 2.5 7.5 2.5Z" fill="currentColor" opacity="0.4"/>
              <path d="M7.5 5C8.7 5 9.8 5.5 10.6 6.2L12 4.8C10.8 3.7 9.2 3 7.5 3C5.8 3 4.2 3.7 3 4.8L4.4 6.2C5.2 5.5 6.3 5 7.5 5Z" fill="currentColor" opacity="0.7"/>
              <circle cx="7.5" cy="9" r="1.5" fill="currentColor"/>
            </svg>
            <!-- Battery -->
            <div class="phone-battery">
              <div class="phone-battery-fill" />
            </div>
          </div>
        </div>

        <!-- Slides -->
        <div ref="slidesRef" class="phone-slides">

          <!-- SLIDE 1 — Dashboard -->
          <div class="phone-slide phone-slide--active">
            <div class="slide-pad">
              <!-- Greeting -->
              <div class="slide-row-between mb-2">
                <div>
                  <p class="slide-label">Bonjour 👋</p>
                  <p class="slide-title">Antoine</p>
                </div>
                <div class="slide-avatar">AM</div>
              </div>
              <!-- KPIs 2x2 -->
              <div class="slide-kpi-grid mb-2">
                <div class="slide-kpi" style="background:#fef6e4">
                  <p class="slide-kpi-label" style="color:#a86a13">Ruches</p>
                  <p class="slide-kpi-value">12</p>
                  <p class="slide-kpi-sub" style="color:#d4891a">/ 14 total</p>
                </div>
                <div class="slide-kpi" style="background:#eef2eb">
                  <p class="slide-kpi-label" style="color:#4f6a4c">Prod.</p>
                  <p class="slide-kpi-value">247<span class="slide-kpi-unit">kg</span></p>
                  <p class="slide-kpi-sub" style="color:#7a9676">Saison</p>
                </div>
                <div class="slide-kpi" style="background:#f0f4fb">
                  <p class="slide-kpi-label" style="color:#1e4a8a">CA</p>
                  <p class="slide-kpi-value">3,4<span class="slide-kpi-unit">k€</span></p>
                  <p class="slide-kpi-sub" style="color:#4a7cc7">Année</p>
                </div>
                <div class="slide-kpi" style="background:#fff1f0">
                  <p class="slide-kpi-label" style="color:#9b1b1b">Alertes</p>
                  <p class="slide-kpi-value" style="color:#dc2626">2</p>
                  <p class="slide-kpi-sub" style="color:#ef4444">Urgent</p>
                </div>
              </div>
              <!-- Section label -->
              <p class="slide-section-label">ALERTES RÉCENTES</p>
              <!-- Alert items -->
              <div class="slide-list-item">
                <div class="slide-dot" style="background:#ef4444"></div>
                <div class="slide-item-content">
                  <p class="slide-item-title">R-12 — Varroa élevé</p>
                  <p class="slide-item-sub">Rucher du Moulin</p>
                </div>
                <div class="slide-chevron">›</div>
              </div>
              <div class="slide-list-item">
                <div class="slide-dot" style="background:#f5a623"></div>
                <div class="slide-item-content">
                  <p class="slide-item-title">R-07 — Faible pop.</p>
                  <p class="slide-item-sub">Rucher des Chênes</p>
                </div>
                <div class="slide-chevron">›</div>
              </div>
            </div>
          </div>

          <!-- SLIDE 2 — Nouvelle intervention -->
          <div class="phone-slide">
            <div class="slide-pad">
              <!-- Header -->
              <div class="slide-nav-header mb-3">
                <div class="slide-back-btn">‹</div>
                <p class="slide-nav-title">Nouvelle visite</p>
              </div>
              <!-- Rucher badge -->
              <div class="slide-rucher-badge mb-3">
                <div class="slide-rucher-dot"></div>
                <span>Rucher du Moulin</span>
                <span class="slide-rucher-arrow">▾</span>
              </div>
              <!-- Form fields -->
              <div class="slide-form-group mb-2">
                <p class="slide-form-label">Type d'intervention</p>
                <div class="slide-select">
                  <span style="color:#f5a623;font-weight:600">Contrôle sanitaire</span>
                  <span>▾</span>
                </div>
              </div>
              <div class="slide-form-group mb-2">
                <p class="slide-form-label">Ruche</p>
                <div class="slide-select">
                  <span>R-12 — Ruche alsacienne</span>
                  <span>▾</span>
                </div>
              </div>
              <div class="slide-form-group mb-3">
                <p class="slide-form-label">Varroa (pour 100 abeilles)</p>
                <div class="slide-input">
                  <span style="color:#1c1c1e;font-weight:600">3</span>
                </div>
              </div>
              <!-- Submit -->
              <div class="slide-btn-primary">Enregistrer la visite</div>
            </div>
          </div>

          <!-- SLIDE 3 — QR Scan -->
          <div class="phone-slide slide-qr">
            <div class="slide-qr-bg">
              <p class="slide-qr-title">Scanner une ruche</p>
              <p class="slide-qr-sub">Pointez vers le QR code</p>
              <!-- QR frame -->
              <div class="slide-qr-frame">
                <div class="slide-qr-corner slide-qr-corner--tl"></div>
                <div class="slide-qr-corner slide-qr-corner--tr"></div>
                <div class="slide-qr-corner slide-qr-corner--bl"></div>
                <div class="slide-qr-corner slide-qr-corner--br"></div>
                <div class="slide-qr-scanline"></div>
                <!-- Mock QR dots -->
                <div class="slide-qr-dots">
                  <div v-for="i in 25" :key="i" class="slide-qr-dot" :style="qrDotStyle(i)" />
                </div>
              </div>
              <p class="slide-qr-hint">Fiche ruche en 1 seconde</p>
            </div>
          </div>

          <!-- SLIDE 4 — Finances -->
          <div class="phone-slide">
            <div class="slide-pad">
              <!-- Header -->
              <div class="slide-row-between mb-3">
                <p class="slide-title">Finances</p>
                <span class="slide-year-badge">2025</span>
              </div>
              <!-- CA card -->
              <div class="slide-ca-card mb-2">
                <p class="slide-ca-label">Chiffre d'affaires</p>
                <p class="slide-ca-value">3 420 €</p>
                <div class="slide-ca-bar">
                  <div v-for="(h, i) in chartBars" :key="i" class="slide-bar-col" :style="`height:${h}%;opacity:${i === chartBars.length - 1 ? 1 : 0.45}`"></div>
                </div>
                <div class="slide-ca-months">
                  <span v-for="m in ['J','F','M','A','M','J']" :key="m">{{ m }}</span>
                </div>
              </div>
              <!-- Stats row -->
              <div class="slide-stats-row mb-3">
                <div class="slide-stat">
                  <p class="slide-stat-val" style="color:#4f6a4c">−680€</p>
                  <p class="slide-stat-label">Charges</p>
                </div>
                <div class="slide-stat-divider"></div>
                <div class="slide-stat">
                  <p class="slide-stat-val" style="color:#4f6a4c">+2 740€</p>
                  <p class="slide-stat-label">Résultat</p>
                </div>
                <div class="slide-stat-divider"></div>
                <div class="slide-stat">
                  <p class="slide-stat-val">13,9€</p>
                  <p class="slide-stat-label">/kg</p>
                </div>
              </div>
              <!-- CTA -->
              <div class="slide-btn-outline">+ Nouvelle vente</div>
            </div>
          </div>

        </div>

        <!-- Slide indicators -->
        <div class="phone-dots">
          <div v-for="i in 4" :key="i" class="phone-dot" :class="{ 'phone-dot--active': currentSlide === i - 1 }" @click="jumpTo(i - 1)" />
        </div>

        <!-- Home bar -->
        <div class="phone-home-bar" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onBeforeUnmount } from 'vue';

const props = defineProps<{
  activeSlide?: number;
}>();

const emit = defineEmits<{
  'update:activeSlide': [value: number]
}>();

const currentSlide = ref(0);
const isVisible = ref(false);
const wrapperRef = ref<HTMLElement | null>(null);
const slidesRef = ref<HTMLElement | null>(null);

const chartBars = [35, 52, 40, 68, 75, 100];

function qrDotStyle(i: number): string {
  const on = [1,2,3,5,7,9,11,13,15,17,19,21,22,23,25].includes(i);
  return `background:${on ? 'rgba(255,255,255,0.7)' : 'transparent'}`;
}

function applySlide(index: number) {
  const slides = slidesRef.value?.querySelectorAll('.phone-slide');
  slides?.forEach((s, i) => {
    s.classList.toggle('phone-slide--active', i === index);
  });
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
  // Ensure the phone is always visible — use intersection observer for the fade-up animation,
  // but fall back to immediate show so it's never stuck invisible
  const showPhone = () => {
    isVisible.value = true;
    observer?.disconnect();
  };

  if (wrapperRef.value && typeof IntersectionObserver !== 'undefined') {
    observer = new IntersectionObserver(
      ([entry]) => { if (entry?.isIntersecting) showPhone(); },
      { threshold: 0, rootMargin: '0px 0px -50px 0px' },
    );
    observer.observe(wrapperRef.value);
    // Fallback: show after 600ms regardless
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
.phone-wrapper--visible {
  opacity: 1;
  transform: translateY(0) scale(1);
}

/* ─── AMBIENT GLOW ─── */
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
  overflow: visible;
}

@media (min-width: 768px) {
  .phone-frame {
    transform: perspective(900px) rotateY(-5deg) rotateX(1.5deg);
    transition: transform 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  }
  .phone-frame:hover {
    transform: perspective(900px) rotateY(0deg) rotateX(0deg);
  }
}

/* ─── PHYSICAL BUTTONS ─── */
.phone-btn-mute,
.phone-btn-vol-up,
.phone-btn-vol-down {
  position: absolute;
  left: -3px;
  width: 3px;
  border-radius: 2px 0 0 2px;
  background: linear-gradient(180deg, #4a4a4c, #3a3a3c);
}
.phone-btn-mute { top: 100px; height: 30px; }
.phone-btn-vol-up { top: 148px; height: 48px; }
.phone-btn-vol-down { top: 208px; height: 48px; }

.phone-btn-power {
  position: absolute;
  right: -3px;
  top: 160px;
  width: 3px;
  height: 64px;
  border-radius: 0 2px 2px 0;
  background: linear-gradient(180deg, #4a4a4c, #3a3a3c);
}

/* ─── SCREEN ─── */
.phone-screen {
  width: 100%;
  height: 100%;
  border-radius: 42px;
  background: #fafaf8;
  overflow: hidden;
  position: relative;
  display: flex;
  flex-direction: column;
}

/* ─── DYNAMIC ISLAND ─── */
.phone-island {
  position: absolute;
  top: 10px;
  left: 50%;
  transform: translateX(-50%);
  width: 100px;
  height: 32px;
  background: #1c1c1e;
  border-radius: 20px;
  z-index: 20;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding-right: 12px;
}
.phone-island-camera {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: radial-gradient(circle at 35% 35%, #2d2d2e, #0a0a0a);
  border: 1px solid rgba(255,255,255,0.06);
}

/* ─── STATUS BAR ─── */
.phone-status {
  position: relative;
  z-index: 15;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 18px 4px;
  flex-shrink: 0;
}
.phone-time {
  font-size: 11px;
  font-weight: 700;
  color: #1c1c1e;
  letter-spacing: -0.02em;
  font-variant-numeric: tabular-nums;
}
.phone-status-icons {
  display: flex;
  align-items: center;
  gap: 4px;
  color: #1c1c1e;
}
.phone-battery {
  width: 20px;
  height: 10px;
  border: 1.5px solid #1c1c1e;
  border-radius: 2px;
  position: relative;
  display: flex;
  align-items: center;
  padding: 1.5px;
}
.phone-battery::after {
  content: '';
  position: absolute;
  right: -4px;
  top: 50%;
  transform: translateY(-50%);
  width: 2px;
  height: 5px;
  background: #1c1c1e;
  border-radius: 0 1px 1px 0;
}
.phone-battery-fill {
  width: 80%;
  height: 100%;
  background: #34c759;
  border-radius: 1px;
}

/* ─── SLIDES ─── */
.phone-slides {
  position: relative;
  flex: 1;
  overflow: hidden;
}

.phone-slide {
  position: absolute;
  inset: 0;
  background: #fafaf8;
  opacity: 0;
  transform: translateX(20px);
  transition: opacity 0.45s ease, transform 0.45s ease;
  pointer-events: none;
  overflow: hidden;
}
.phone-slide--active {
  opacity: 1;
  transform: translateX(0);
  pointer-events: auto;
}

/* ─── SLIDE DOTS ─── */
.phone-dots {
  display: flex;
  gap: 5px;
  justify-content: center;
  padding: 6px 0 4px;
  background: #fafaf8;
  flex-shrink: 0;
}
.phone-dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: rgba(0,0,0,0.15);
  cursor: pointer;
  transition: all 0.3s;
}
.phone-dot--active {
  width: 14px;
  border-radius: 3px;
  background: #f5a623;
}

/* ─── HOME BAR ─── */
.phone-home-bar {
  width: 90px;
  height: 4px;
  background: rgba(0,0,0,0.18);
  border-radius: 2px;
  margin: 4px auto 8px;
  flex-shrink: 0;
}

/* ─── SLIDE COMMON ─── */
.slide-pad { padding: 8px 12px 12px; }
.slide-label { font-size: 9px; font-weight: 600; color: #a8a29e; text-transform: uppercase; letter-spacing: 0.06em; }
.slide-title { font-size: 15px; font-weight: 700; color: #1c1c1e; letter-spacing: -0.02em; }
.slide-section-label { font-size: 8.5px; font-weight: 700; color: #a8a29e; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 5px; }
.slide-row-between { display: flex; align-items: center; justify-content: space-between; }

/* Avatar */
.slide-avatar {
  width: 30px; height: 30px; border-radius: 50%;
  background: #fef6e4; color: #a86a13;
  font-size: 9px; font-weight: 700;
  display: flex; align-items: center; justify-content: center;
}

/* KPI Grid */
.slide-kpi-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 5px; }
.slide-kpi { border-radius: 10px; padding: 6px 7px; }
.slide-kpi-label { font-size: 8px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 2px; }
.slide-kpi-value { font-size: 17px; font-weight: 700; color: #1c1c1e; line-height: 1; }
.slide-kpi-unit { font-size: 9px; font-weight: 500; color: #a8a29e; margin-left: 1px; }
.slide-kpi-sub { font-size: 8px; margin-top: 1px; }

/* Alert list */
.slide-list-item { display: flex; align-items: center; gap: 7px; background: white; border: 1px solid rgba(214,211,209,0.5); border-radius: 9px; padding: 6px 8px; margin-bottom: 4px; }
.slide-dot { width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0; }
.slide-item-content { flex: 1; min-width: 0; }
.slide-item-title { font-size: 10px; font-weight: 600; color: #1c1c1e; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.slide-item-sub { font-size: 8.5px; color: #a8a29e; }
.slide-chevron { font-size: 13px; color: #d6d3d1; line-height: 1; }

/* Intervention slide */
.slide-nav-header { display: flex; align-items: center; gap: 8px; }
.slide-back-btn { width: 22px; height: 22px; border-radius: 6px; background: #f5f4f1; display: flex; align-items: center; justify-content: center; font-size: 14px; color: #57534e; line-height: 1; }
.slide-nav-title { font-size: 13px; font-weight: 700; color: #1c1c1e; }

.slide-rucher-badge { display: inline-flex; align-items: center; gap: 5px; background: #fef6e4; border: 1px solid rgba(245,166,35,0.3); border-radius: 8px; padding: 4px 9px; font-size: 10px; font-weight: 600; color: #a86a13; }
.slide-rucher-dot { width: 6px; height: 6px; border-radius: 50%; background: #f5a623; }
.slide-rucher-arrow { font-size: 8px; opacity: 0.6; }

.slide-form-group {}
.slide-form-label { font-size: 8.5px; font-weight: 600; color: #a8a29e; text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 3px; }
.slide-select { display: flex; align-items: center; justify-content: space-between; background: white; border: 1px solid rgba(214,211,209,0.6); border-radius: 9px; padding: 6px 9px; font-size: 10px; color: #57534e; }
.slide-input { background: white; border: 1.5px solid rgba(245,166,35,0.4); border-radius: 9px; padding: 6px 9px; font-size: 10px; box-shadow: 0 0 0 3px rgba(245,166,35,0.08); }

.slide-btn-primary { background: #f5a623; color: white; font-size: 11px; font-weight: 700; text-align: center; padding: 9px 0; border-radius: 11px; box-shadow: 0 4px 12px rgba(245,166,35,0.35); }
.slide-btn-outline { border: 1.5px solid #f5a623; color: #a86a13; font-size: 11px; font-weight: 700; text-align: center; padding: 8px 0; border-radius: 11px; background: #fef6e4; }

/* QR Slide */
.slide-qr { background: #1c1c1e !important; }
.slide-qr-bg { width: 100%; height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 16px; gap: 10px; }
.slide-qr-title { font-size: 13px; font-weight: 700; color: white; letter-spacing: -0.01em; }
.slide-qr-sub { font-size: 10px; color: rgba(255,255,255,0.5); margin-top: -6px; }

.slide-qr-frame {
  width: 130px; height: 130px;
  position: relative;
  display: flex; align-items: center; justify-content: center;
}
.slide-qr-corner {
  position: absolute;
  width: 22px; height: 22px;
  border-color: #f5a623;
  border-style: solid;
  border-width: 0;
}
.slide-qr-corner--tl { top: 0; left: 0; border-top-width: 3px; border-left-width: 3px; border-radius: 4px 0 0 0; }
.slide-qr-corner--tr { top: 0; right: 0; border-top-width: 3px; border-right-width: 3px; border-radius: 0 4px 0 0; }
.slide-qr-corner--bl { bottom: 0; left: 0; border-bottom-width: 3px; border-left-width: 3px; border-radius: 0 0 0 4px; }
.slide-qr-corner--br { bottom: 0; right: 0; border-bottom-width: 3px; border-right-width: 3px; border-radius: 0 0 4px 0; }

.slide-qr-scanline {
  position: absolute;
  left: 10px; right: 10px; height: 2px;
  background: linear-gradient(90deg, transparent, #f5a623, transparent);
  animation: qr-scan 2s ease-in-out infinite;
  box-shadow: 0 0 8px rgba(245,166,35,0.6);
}
@keyframes qr-scan {
  0%, 100% { top: 15%; opacity: 0.5; }
  50% { top: 80%; opacity: 1; }
}

.slide-qr-dots { position: absolute; inset: 15px; display: grid; grid-template-columns: repeat(5, 1fr); gap: 4px; }
.slide-qr-dot { width: 100%; aspect-ratio: 1; border-radius: 1px; }
.slide-qr-hint { font-size: 9px; font-weight: 600; color: rgba(245,166,35,0.8); text-align: center; letter-spacing: 0.04em; text-transform: uppercase; }

/* Finances slide */
.slide-year-badge { background: #f5f4f1; color: #57534e; font-size: 9px; font-weight: 700; padding: 2px 7px; border-radius: 6px; }

.slide-ca-card { background: white; border: 1px solid rgba(214,211,209,0.6); border-radius: 12px; padding: 10px 10px 6px; }
.slide-ca-label { font-size: 8.5px; font-weight: 600; color: #a8a29e; text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 2px; }
.slide-ca-value { font-size: 20px; font-weight: 700; color: #1c1c1e; letter-spacing: -0.03em; margin-bottom: 8px; }
.slide-ca-bar { display: flex; align-items: flex-end; gap: 3px; height: 36px; margin-bottom: 3px; }
.slide-bar-col { flex: 1; background: #f5a623; border-radius: 3px 3px 0 0; min-height: 3px; }
.slide-ca-months { display: flex; justify-content: space-between; }
.slide-ca-months span { font-size: 7.5px; color: #a8a29e; text-align: center; flex: 1; }

.slide-stats-row { display: flex; align-items: center; background: #f5f4f1; border-radius: 10px; padding: 7px 10px; gap: 0; }
.slide-stat { flex: 1; text-align: center; }
.slide-stat-val { font-size: 10px; font-weight: 700; color: #1c1c1e; }
.slide-stat-label { font-size: 7.5px; color: #a8a29e; text-transform: uppercase; letter-spacing: 0.04em; margin-top: 1px; }
.slide-stat-divider { width: 1px; height: 24px; background: rgba(214,211,209,0.6); }
</style>
