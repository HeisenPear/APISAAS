<template>
  <div class="phone-wrapper" :class="{ 'phone-wrapper--visible': isVisible }">
    <!-- Frame téléphone CSS pure -->
    <div class="phone-frame">
      <!-- Notch -->
      <div class="phone-notch">
        <div class="phone-notch-camera" />
      </div>

      <!-- Écran -->
      <div class="phone-screen">
        <!-- CAS 1 : GIF ou image fournie -->
        <template v-if="hasAsset">
          <img
            :src="assetPath"
            alt="Interface APIGO sur mobile"
            class="phone-screen-img"
            loading="lazy"
          />
        </template>

        <!-- CAS 2 : Placeholder animé (aucun asset) -->
        <template v-else>
          <div class="phone-placeholder">
            <div class="phone-placeholder-slides">
              <!-- Slide 1 — Tableau de bord -->
              <div class="phone-slide phone-slide--active">
                <div class="mock-statusbar" />
                <div class="mock-header">
                  <div class="mock-avatar" />
                  <div class="mock-title-block">
                    <div class="mock-bar mock-bar--title" />
                    <div class="mock-bar mock-bar--sub" />
                  </div>
                </div>
                <div class="mock-cards">
                  <div class="mock-card mock-card--amber">
                    <div class="mock-bar mock-bar--sm" />
                    <div class="mock-number">12</div>
                  </div>
                  <div class="mock-card mock-card--teal">
                    <div class="mock-bar mock-bar--sm" />
                    <div class="mock-number">247</div>
                  </div>
                  <div class="mock-card mock-card--blue">
                    <div class="mock-bar mock-bar--sm" />
                    <div class="mock-number">98%</div>
                  </div>
                </div>
                <div class="mock-list">
                  <div v-for="i in 4" :key="`slide1-${i}`" class="mock-list-item">
                    <div class="mock-dot" />
                    <div class="mock-bar mock-bar--line" />
                  </div>
                </div>
              </div>

              <!-- Slide 2 — QR scan / fiche ruche -->
              <div class="phone-slide">
                <div class="mock-statusbar" />
                <div class="mock-qr-zone">
                  <div class="mock-qr-frame">
                    <div class="mock-qr-corner mock-qr-corner--tl" />
                    <div class="mock-qr-corner mock-qr-corner--tr" />
                    <div class="mock-qr-corner mock-qr-corner--bl" />
                    <div class="mock-qr-corner mock-qr-corner--br" />
                    <div class="mock-qr-scan-line" />
                  </div>
                  <div class="mock-bar mock-bar--center mt-4" />
                </div>
                <div class="mock-list">
                  <div v-for="i in 5" :key="`slide2-${i}`" class="mock-list-item">
                    <div class="mock-dot mock-dot--green" />
                    <div class="mock-bar mock-bar--line" />
                  </div>
                </div>
              </div>

              <!-- Slide 3 — Intervention terrain -->
              <div class="phone-slide">
                <div class="mock-statusbar" />
                <div class="mock-header">
                  <div class="mock-back-btn" />
                  <div class="mock-bar mock-bar--title flex-1 mx-2" />
                </div>
                <div class="mock-form">
                  <div v-for="i in 4" :key="`slide3-${i}`" class="mock-form-field">
                    <div class="mock-bar mock-bar--label" />
                    <div class="mock-input" />
                  </div>
                  <div class="mock-btn-submit" />
                </div>
              </div>
            </div>

            <!-- Indicateurs de slides -->
            <div class="phone-dots">
              <div
                v-for="i in 3"
                :key="i"
                class="phone-dot"
                :class="{ 'phone-dot--active': currentSlide === i - 1 }"
              />
            </div>
          </div>
        </template>
      </div>

      <!-- Bouton home -->
      <div class="phone-home-btn" />
    </div>

    <!-- Reflet/ombre décorative -->
    <div class="phone-shadow" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue';

const props = defineProps<{
  hasAsset?: boolean;
  assetPath?: string;
}>();

const hasAsset = props.hasAsset ?? false;
const assetPath = props.assetPath ?? '/images/apigo-mobile-preview.gif';
const currentSlide = ref(0);
const isVisible = ref(false);

let interval: ReturnType<typeof setInterval> | null = null;

onMounted(() => {
  // Animation d'entrée au scroll
  const wrapper = document.querySelector('.phone-wrapper');
  if (wrapper) {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry && entry.isIntersecting) {
          isVisible.value = true;
        }
      },
      { threshold: 0.2 },
    );
    observer.observe(wrapper);
  }

  // Rotation automatique des slides (placeholder uniquement)
  if (!hasAsset) {
    interval = setInterval(() => {
      currentSlide.value = (currentSlide.value + 1) % 3;
      const slides = document.querySelectorAll('.phone-slide');
      slides.forEach((s, i) => {
        if (i === currentSlide.value) {
          s.classList.add('phone-slide--active');
        } else {
          s.classList.remove('phone-slide--active');
        }
      });
    }, 3000);
  }
});

onBeforeUnmount(() => {
  if (interval) clearInterval(interval);
});
</script>

<style scoped>
/* ────────────────────────────────────────────────
   FRAME TÉLÉPHONE
──────────────────────────────────────────────── */
.phone-wrapper {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  opacity: 0;
  transform: translateY(30px);
  transition:
    opacity 0.7s ease,
    transform 0.7s ease;
}

.phone-wrapper--visible {
  opacity: 1;
  transform: translateY(0);
}

.phone-frame {
  position: relative;
  width: 230px;
  height: 470px;
  background: #1a1a2e;
  border-radius: 40px;
  border: 2px solid #2d2d4e;
  box-shadow:
    0 0 0 1px rgba(255, 255, 255, 0.06),
    0 30px 80px rgba(0, 0, 0, 0.45),
    inset 0 0 0 1px rgba(255, 255, 255, 0.04);
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 14px 6px 20px;
  overflow: hidden;
}

@media (min-width: 768px) {
  .phone-frame {
    transform: perspective(1000px) rotateY(-6deg) rotateX(2deg);
    transition: transform 0.4s ease;
  }

  .phone-frame:hover {
    transform: perspective(1000px) rotateY(0deg) rotateX(0deg);
  }
}

/* Notch */
.phone-notch {
  width: 90px;
  height: 22px;
  background: #1a1a2e;
  border-radius: 0 0 16px 16px;
  position: absolute;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: center;
}

.phone-notch-camera {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #2d2d4e;
  border: 1px solid #3a3a5e;
}

/* Écran */
.phone-screen {
  width: 100%;
  flex: 1;
  border-radius: 30px;
  overflow: hidden;
  background: #f8f9fa;
  margin-top: 18px;
  position: relative;
}

.phone-screen-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: top;
}

/* Bouton home */
.phone-home-btn {
  width: 36px;
  height: 4px;
  background: rgba(255, 255, 255, 0.15);
  border-radius: 2px;
  margin-top: 8px;
}

/* Ombre décorative */
.phone-shadow {
  width: 160px;
  height: 16px;
  background: rgba(0, 0, 0, 0.18);
  border-radius: 50%;
  filter: blur(10px);
  margin-top: 8px;
}

/* ────────────────────────────────────────────────
   PLACEHOLDER ANIMÉ — SLIDES
──────────────────────────────────────────────── */
.phone-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.phone-placeholder-slides {
  position: relative;
  flex: 1;
  overflow: hidden;
}

.phone-slide {
  position: absolute;
  inset: 0;
  padding: 10px 10px 0;
  background: #f8f9fa;
  opacity: 0;
  transform: translateX(24px);
  transition:
    opacity 0.5s ease,
    transform 0.5s ease;
  pointer-events: none;
}

.phone-slide--active {
  opacity: 1;
  transform: translateX(0);
  pointer-events: auto;
}

/* Indicateurs dots */
.phone-dots {
  display: flex;
  gap: 5px;
  justify-content: center;
  padding: 8px 0 6px;
  background: #f8f9fa;
}

.phone-dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: #d0d5dd;
  transition: background 0.3s;
}

.phone-dot--active {
  background: #1d9e75;
}

/* ────────────────────────────────────────────────
   ÉLÉMENTS SKELETON (faux UI)
──────────────────────────────────────────────── */
.mock-statusbar {
  height: 6px;
  background: #e4e7ec;
  border-radius: 3px;
  margin-bottom: 10px;
}

.mock-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
}

.mock-avatar {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: #d0d5dd;
  flex-shrink: 0;
}

.mock-title-block {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
}

.mock-back-btn {
  width: 20px;
  height: 20px;
  border-radius: 4px;
  background: #e4e7ec;
  flex-shrink: 0;
}

/* Barres skeleton */
.mock-bar {
  height: 8px;
  border-radius: 4px;
  background: #e4e7ec;
}

.mock-bar--title {
  width: 70%;
  height: 10px;
}

.mock-bar--sub {
  width: 50%;
  height: 7px;
  background: #eef0f3;
}

.mock-bar--sm {
  width: 60%;
  height: 6px;
  margin-bottom: 4px;
}

.mock-bar--line {
  flex: 1;
  height: 7px;
}

.mock-bar--label {
  width: 45%;
  height: 6px;
  margin-bottom: 4px;
}

.mock-bar--center {
  width: 55%;
  height: 8px;
  margin: 0 auto;
}

/* Cards métriques */
.mock-cards {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 5px;
  margin-bottom: 10px;
}

.mock-card {
  border-radius: 8px;
  padding: 6px 5px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.mock-card--amber {
  background: #faeeda;
}

.mock-card--teal {
  background: #e1f5ee;
}

.mock-card--blue {
  background: #e6f1fb;
}

.mock-number {
  font-size: 13px;
  font-weight: 600;
  color: #374151;
  margin-top: 2px;
}

/* Liste items */
.mock-list {
  display: flex;
  flex-direction: column;
  gap: 7px;
}

.mock-list-item {
  display: flex;
  align-items: center;
  gap: 7px;
}

.mock-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #d0d5dd;
  flex-shrink: 0;
}

.mock-dot--green {
  background: #1d9e75;
}

/* Zone QR scan */
.mock-qr-zone {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 16px 8px;
}

.mock-qr-frame {
  width: 100px;
  height: 100px;
  position: relative;
  margin-bottom: 10px;
}

.mock-qr-corner {
  position: absolute;
  width: 18px;
  height: 18px;
  border-color: #1d9e75;
  border-style: solid;
  border-width: 0;
}

.mock-qr-corner--tl {
  top: 0;
  left: 0;
  border-top-width: 3px;
  border-left-width: 3px;
  border-radius: 3px 0 0 0;
}

.mock-qr-corner--tr {
  top: 0;
  right: 0;
  border-top-width: 3px;
  border-right-width: 3px;
  border-radius: 0 3px 0 0;
}

.mock-qr-corner--bl {
  bottom: 0;
  left: 0;
  border-bottom-width: 3px;
  border-left-width: 3px;
  border-radius: 0 0 0 3px;
}

.mock-qr-corner--br {
  bottom: 0;
  right: 0;
  border-bottom-width: 3px;
  border-right-width: 3px;
  border-radius: 0 0 3px 0;
}

.mock-qr-scan-line {
  position: absolute;
  left: 8px;
  right: 8px;
  height: 2px;
  background: linear-gradient(90deg, transparent, #1d9e75, transparent);
  top: 30%;
  animation: qr-scan 2s ease-in-out infinite;
}

@keyframes qr-scan {
  0%,
  100% {
    top: 10%;
    opacity: 0.6;
  }
  50% {
    top: 80%;
    opacity: 1;
  }
}

/* Formulaire mock */
.mock-form {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 0 8px;
}

.mock-form-field {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.mock-input {
  height: 24px;
  border-radius: 6px;
  background: #ffffff;
  border: 1px solid #e4e7ec;
}

.mock-btn-submit {
  height: 32px;
  border-radius: 8px;
  background: #1d9e75;
  margin-top: 8px;
}

/* Util classes */
.flex-1 {
  flex: 1;
}

.mx-2 {
  margin-left: 0.5rem;
  margin-right: 0.5rem;
}

.mt-4 {
  margin-top: 1rem;
}
</style>
