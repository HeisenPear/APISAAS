<template>
  <div class="phone-wrapper">
    <div class="phone-glow" />
    <div class="phone-frame" @touchstart.passive="onTouchStart" @touchend.passive="onTouchEnd">
      <div class="phone-btn-mute" />
      <div class="phone-btn-vol-up" />
      <div class="phone-btn-vol-down" />
      <div class="phone-btn-power" />

      <div class="phone-screen">
        <!-- Status bar — heure | Dynamic Island | icônes -->
        <div class="phone-status">
          <span class="phone-time">9:41</span>
          <div class="phone-island"><div class="phone-island-camera" /></div>
          <div class="phone-status-icons">
            <!-- Signal bars -->
            <svg width="17" height="11" viewBox="0 0 17 11">
              <rect
                x="0"
                y="7.5"
                width="3"
                height="3.5"
                rx="0.7"
                fill="#1c1c1e"
                fill-opacity="0.35"
              />
              <rect x="4.7" y="5" width="3" height="6" rx="0.7" fill="#1c1c1e" fill-opacity="0.6" />
              <rect
                x="9.3"
                y="2.5"
                width="3"
                height="8.5"
                rx="0.7"
                fill="#1c1c1e"
                fill-opacity="0.85"
              />
              <rect x="14" y="0" width="3" height="11" rx="0.7" fill="#1c1c1e" />
            </svg>
            <!-- WiFi -->
            <svg width="16" height="12" viewBox="0 0 16 12" fill="none">
              <circle cx="8" cy="11.2" r="1.3" fill="#1c1c1e" />
              <path
                d="M5.4 8.1a3.7 3.7 0 015.2 0"
                stroke="#1c1c1e"
                stroke-width="1.4"
                stroke-linecap="round"
              />
              <path
                d="M2.6 5.3a7.5 7.5 0 0110.8 0"
                stroke="#1c1c1e"
                stroke-width="1.4"
                stroke-linecap="round"
                stroke-opacity="0.5"
              />
            </svg>
            <!-- Battery -->
            <svg width="25" height="12" viewBox="0 0 25 12" fill="none">
              <rect
                x="0.6"
                y="0.6"
                width="21"
                height="10.8"
                rx="2.5"
                stroke="#1c1c1e"
                stroke-opacity="0.35"
                stroke-width="1.2"
              />
              <rect
                x="22.2"
                y="3.5"
                width="2.2"
                height="5"
                rx="1"
                fill="#1c1c1e"
                fill-opacity="0.4"
              />
              <rect x="2.2" y="2.2" width="15.5" height="7.6" rx="1.5" fill="#1c1c1e" />
            </svg>
          </div>
        </div>

        <!-- Slides -->
        <div class="phone-slides">
          <!-- SLIDE 0 : DASHBOARD -->
          <div class="phone-slide" :class="slideClass(0)">
            <div class="s-scroll">
              <div class="s-row mb3">
                <div>
                  <p class="s-eyebrow">BONJOUR 👋</p>
                  <p class="s-title">Antoine</p>
                </div>
                <div class="s-avatar">AM</div>
              </div>
              <!-- Carte Maya : comme dans la vraie app, l'assistante ouvre le
                   tableau de bord (salutation + ce qui compte aujourd'hui). -->
              <div class="s-maya mb3">
                <div class="s-maya-head">
                  <span class="s-maya-mark">✦</span>
                  <span class="s-maya-name">Maya</span>
                  <span class="s-maya-open">Ouvrir ↗</span>
                </div>
                <p class="s-maya-intro">
                  Te revoilà 👋 <b>2 ruches</b> demandent ton attention aujourd'hui.
                </p>
                <div class="s-maya-item">
                  <span class="s-maya-chip" style="background: #fef6e4">☀️</span>
                  <span class="s-maya-txt">Bon créneau de visite · <b>11 h–15 h</b></span>
                </div>
                <div class="s-maya-item">
                  <span class="s-maya-chip" style="background: #fff1f0">🐝</span>
                  <span class="s-maya-txt">R-12 · Varroa élevé à traiter</span>
                </div>
              </div>
              <div class="s-kpis mb3">
                <div class="s-kpi" style="background: #fef6e4">
                  <p class="s-kv">14</p>
                  <p class="s-kl" style="color: #925b0f">ruches</p>
                </div>
                <div class="s-kpi" style="background: #f9efe3">
                  <p class="s-kv">247<span class="s-ku">kg</span></p>
                  <p class="s-kl" style="color: #7d5220">prod.</p>
                </div>
                <div class="s-kpi" style="background: #f0f4fb">
                  <p class="s-kv">3,4<span class="s-ku">k€</span></p>
                  <p class="s-kl" style="color: #2a5298">CA</p>
                </div>
                <div class="s-kpi" style="background: #fff1f0">
                  <p class="s-kv" style="color: #dc2626">2</p>
                  <p class="s-kl" style="color: #9b1b1b">alertes</p>
                </div>
              </div>
              <p class="s-lbl">ALERTES RÉCENTES</p>
              <button class="s-item" @click="goTo(2)">
                <span class="s-dot" style="background: var(--status-bad)" />
                <span class="s-ic"
                  ><span class="s-it">R-12 — Varroa élevé</span
                  ><span class="s-is">Rucher des Acacias · Urgent</span></span
                >
                <span class="s-chev">›</span>
              </button>
              <button class="s-item" @click="goTo(2)">
                <span class="s-dot" style="background: var(--honey)" />
                <span class="s-ic"
                  ><span class="s-it">R-07 — Faible population</span
                  ><span class="s-is">Rucher des Tilleuls · À surveiller</span></span
                >
                <span class="s-chev">›</span>
              </button>
            </div>
            <button aria-label="Aperçu : ouvrir l’assistant" class="s-fab" @click="goTo(1)">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="white"
                stroke-width="2.8"
                stroke-linecap="round"
              >
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </button>
          </div>

          <!-- SLIDE 1 : NOUVELLE INTERVENTION -->
          <div class="phone-slide" :class="slideClass(1)">
            <div v-if="!saveSuccess" class="s-scroll">
              <div class="s-row mb3">
                <button
                  aria-label="Aperçu : revenir au tableau de bord"
                  class="s-back"
                  @click="goTo(0)"
                >
                  <svg
                    width="7"
                    height="12"
                    viewBox="0 0 7 12"
                    fill="none"
                    stroke="#1c1c1e"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  >
                    <polyline points="6 1 1 6 6 11" />
                  </svg>
                </button>
                <p class="s-title" style="margin-left: 6px">Nouvelle visite</p>
              </div>
              <p class="s-flbl">Rucher</p>
              <div class="s-pill-input mb3">Rucher des Acacias ▾</div>
              <p class="s-flbl">Type d'intervention</p>
              <div class="s-chips mb3">
                <button
                  v-for="t in types"
                  :key="t"
                  class="s-chip"
                  :class="{ active: selectedType === t }"
                  @click="selectedType = t"
                >
                  {{ t }}
                </button>
              </div>
              <div class="s-row-f mb3">
                <div class="s-fb">
                  <p class="s-flbl">Ruche</p>
                  <div class="s-input">R-12 ▾</div>
                </div>
                <div class="s-fb">
                  <p class="s-flbl">Date</p>
                  <div class="s-input">22 mai</div>
                </div>
              </div>
              <p class="s-flbl">Note</p>
              <div class="s-textarea mb4">ApiLifeVar — 1 bandelette</div>
              <button
                class="s-save"
                :class="{ loading: saving }"
                :disabled="saving"
                @click="handleSave"
              >
                <svg
                  v-if="saving"
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="white"
                  stroke-width="2.5"
                  stroke-linecap="round"
                  class="s-spin"
                >
                  <path d="M12 2a10 10 0 1 0 10 10" />
                </svg>
                <span v-else>Enregistrer</span>
              </button>
            </div>
            <div v-else class="s-success">
              <div class="s-success-ring">
                <div class="s-success-check">
                  <svg
                    width="26"
                    height="26"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="white"
                    stroke-width="2.5"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
              </div>
              <p class="s-success-t">Enregistrée !</p>
              <p class="s-success-s">
                R-12 · Traitement Varroa{{ ' ' }}<br />Synchronisée · 22 mai 2025
              </p>
            </div>
          </div>

          <!-- SLIDE 2 : FICHE RUCHE R-12 -->
          <div class="phone-slide" :class="slideClass(2)">
            <div class="s-scroll">
              <div class="s-row mb2">
                <button
                  aria-label="Aperçu : revenir au tableau de bord"
                  class="s-back"
                  @click="goTo(0)"
                >
                  <svg
                    width="7"
                    height="12"
                    viewBox="0 0 7 12"
                    fill="none"
                    stroke="#1c1c1e"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  >
                    <polyline points="6 1 1 6 6 11" />
                  </svg>
                </button>
                <div style="margin-left: 6px">
                  <p class="s-title">R-12 Alsacienne</p>
                  <span class="s-badge-red">⚠ Alerte varroa</span>
                </div>
              </div>
              <div class="s-stats mb3">
                <div class="s-sc">
                  <p class="s-sv" style="color: #ef4444">3,2%</p>
                  <p class="s-sl">Varroa</p>
                </div>
                <div class="s-sep" />
                <div class="s-sc">
                  <p class="s-sv" style="color: #7d5220">Fort</p>
                  <p class="s-sl">Population</p>
                </div>
                <div class="s-sep" />
                <div class="s-sc">
                  <p class="s-sv" style="color: #925b0f">2024</p>
                  <p class="s-sl">Reine</p>
                </div>
              </div>
              <p class="s-lbl">DERNIÈRES INTERVENTIONS</p>
              <div
                v-for="inter in interventions"
                :key="inter.date"
                class="s-item"
                style="cursor: default"
              >
                <span style="font-size: 13px; flex-shrink: 0">{{ inter.icon }}</span>
                <span class="s-ic"
                  ><span class="s-it">{{ inter.type }}</span
                  ><span class="s-is">{{ inter.date }}</span></span
                >
                <span class="s-chev">›</span>
              </div>
              <button class="s-btn-outline mt3" @click="goTo(1)">+ Nouvelle intervention</button>
            </div>
          </div>

          <!-- SLIDE 3 : FINANCES -->
          <div class="phone-slide" :class="slideClass(3)">
            <div class="s-scroll">
              <p class="s-eyebrow">ANNÉE 2025</p>
              <p class="s-title mb3">Finances</p>
              <div class="s-ca-card mb3">
                <div class="s-row">
                  <div>
                    <p class="s-ca-lbl">Chiffre d'affaires</p>
                    <p class="s-ca-val">3 420 <span>€</span></p>
                  </div>
                  <div class="s-ca-badge">+12% vs N-1</div>
                </div>
                <div class="s-chart">
                  <div v-for="(h, i) in chartBars" :key="i" class="s-bar" :style="`height:${h}%`" />
                </div>
              </div>
              <div class="s-stats mb3">
                <div class="s-sc">
                  <p class="s-sv">680€</p>
                  <p class="s-sl">Charges</p>
                </div>
                <div class="s-sep" />
                <div class="s-sc">
                  <p class="s-sv" style="color: #7d5220">2 740€</p>
                  <p class="s-sl">Résultat</p>
                </div>
                <div class="s-sep" />
                <div class="s-sc">
                  <p class="s-sv" style="color: #925b0f">13,9€</p>
                  <p class="s-sl">/kg miel</p>
                </div>
              </div>
              <p class="s-lbl">VENTES RÉCENTES</p>
              <div v-for="v in ventes" :key="v.id" class="s-item" style="cursor: default">
                <div class="s-euro">€</div>
                <span class="s-ic"
                  ><span class="s-it">{{ v.client }}</span
                  ><span class="s-is">{{ v.date }} · {{ v.produit }}</span></span
                >
                <span class="s-amount">+{{ v.amount }}</span>
              </div>
            </div>
          </div>

          <!-- SLIDE 4 : ÉLEVAGE — reines, marquage, greffage
               Tout ce qui est montré ici existe dans /elevage :
                 · couleur de marquage = convention internationale (blanc 2021/2026,
                   jaune 2022/2027, rouge 2023/2028, vert 2024/2029, bleu 2025/2030)
                 · lignée par race (Buckfast, Carnica, Abeille noire, Italienne…)
                 · session de greffage : greffées / acceptées, taux coloré
                   (vert ≥ 70 %, miel ≥ 40 %, rouge en dessous)
                 · arbre généalogique : Mère → Cette reine → Filles
               ⚠️ NE PAS y ajouter d'insémination sans vérifier : le champ station
               de fécondation n'apparaît qu'après activation d'un interrupteur, et
               l'index de sélection est réservé au plan Expert. -->
          <div class="phone-slide" :class="slideClass(4)">
            <div class="s-scroll">
              <div class="s-row mb3">
                <div>
                  <p class="s-eyebrow">ÉLEVAGE</p>
                  <p class="s-title">Reines</p>
                </div>
                <span class="s-badge-amber">3 lignées</span>
              </div>

              <p class="s-lbl">REINE SÉLECTIONNÉE</p>
              <div class="s-reine mb3">
                <span class="s-marque" style="background: #4a90d9" title="Marquage bleu — 2025" />
                <div class="s-ic">
                  <span class="s-it">F-24 · Buckfast</span>
                  <span class="s-is">Née 2025 · Élevage propre</span>
                </div>
                <!-- ⚠️ L'INDEX DE SÉLECTION EST RÉSERVÉ AU PLAN EXPERT
                     (`selectionAvancee`, seul le 4ᵉ plan l'a dans
                     `app/config/plans.ts`, et `GET /api/elevage/selection-avancee`
                     est gaté). Le montrer nu, sur une maquette commerciale,
                     promet à un visiteur Découverte un écran qu'il n'aura pas.
                     Le badge est celui des sections gatées du produit.
                     L'échelle est /100 — `unite="/100"` dans SelectionAvancee.vue. -->
                <div class="s-index">
                  <span class="s-index-plan">Expert</span>
                  <span class="s-index-v">82</span>
                  <span class="s-index-l">index /100</span>
                </div>
              </div>

              <p class="s-lbl">ARBRE GÉNÉALOGIQUE</p>
              <div class="s-arbre mb3">
                <span class="s-noeud">
                  <span class="s-marque s-marque-s" style="background: #d94a4a" />
                  Mère · F-19
                </span>
                <span class="s-lien">↓</span>
                <span class="s-noeud s-noeud-actif">
                  <span class="s-marque s-marque-s" style="background: #4a90d9" />
                  F-24
                </span>
                <span class="s-lien">↓</span>
                <span class="s-noeud s-noeud-mult">6 filles</span>
              </div>

              <p class="s-lbl">SESSION DE GREFFAGE · 12 MAI</p>
              <div class="s-greffe">
                <div class="s-greffe-h">
                  <span class="s-greffe-t">Cupularve · 24 cellules</span>
                  <span class="s-greffe-taux">79 %</span>
                </div>
                <div class="s-greffe-barre">
                  <span class="s-greffe-plein" style="width: 79%" />
                </div>
                <p class="s-greffe-d">19 acceptées sur 24 greffées</p>
              </div>
            </div>
          </div>

          <!-- Le premier écran déborde de 144 px et son ascenseur est masqué :
               sans ce fondu, le dernier libellé est tranché en plein milieu et
               la coupure passe pour un défaut d'affichage. Dégradé vers le fond
               de l'écran, donc invisible sur les diapos qui ne débordent pas. -->
          <div class="phone-fondu" aria-hidden="true" />
        </div>

        <!-- Bottom Navigation -->
        <nav class="phone-nav">
          <button class="phone-nav-btn" :class="{ active: currentSlide === 0 }" @click="goTo(0)">
            <svg
              width="21"
              height="21"
              viewBox="0 0 24 24"
              fill="none"
              :stroke="currentSlide === 0 ? '#f5a623' : '#706963'"
              stroke-width="1.8"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
            <span>Accueil</span>
          </button>
          <button class="phone-nav-btn" :class="{ active: currentSlide === 1 }" @click="goTo(1)">
            <svg
              width="21"
              height="21"
              viewBox="0 0 24 24"
              fill="none"
              :stroke="currentSlide === 1 ? '#f5a623' : '#706963'"
              stroke-width="1.8"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" />
              <rect x="9" y="3" width="6" height="4" rx="2" />
              <line x1="9" y1="12" x2="15" y2="12" />
              <line x1="9" y1="16" x2="13" y2="16" />
            </svg>
            <span>Visites</span>
          </button>
          <button class="phone-nav-btn" :class="{ active: currentSlide === 2 }" @click="goTo(2)">
            <svg
              width="21"
              height="21"
              viewBox="0 0 24 24"
              fill="none"
              :stroke="currentSlide === 2 ? '#f5a623' : '#706963'"
              stroke-width="1.8"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
            <span>Ruchers</span>
          </button>
          <button class="phone-nav-btn" :class="{ active: currentSlide === 4 }" @click="goTo(4)">
            <svg
              width="21"
              height="21"
              viewBox="0 0 24 24"
              fill="none"
              :stroke="currentSlide === 4 ? '#f5a623' : '#706963'"
              stroke-width="1.8"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M12 3l2.5 4.5L19 9l-3.5 3.5L16 17l-4-2-4 2 .5-4.5L5 9l4.5-1.5z" />
            </svg>
            <span>Élevage</span>
          </button>
          <button class="phone-nav-btn" :class="{ active: currentSlide === 3 }" @click="goTo(3)">
            <svg
              width="21"
              height="21"
              viewBox="0 0 24 24"
              fill="none"
              :stroke="currentSlide === 3 ? '#f5a623' : '#706963'"
              stroke-width="1.8"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <rect x="2" y="7" width="20" height="14" rx="2" />
              <path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2" />
            </svg>
            <span>Finances</span>
          </button>
        </nav>

        <div class="phone-home-bar" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';

const props = defineProps<{ activeSlide?: number }>();
const emit = defineEmits<{ 'update:activeSlide': [value: number] }>();

/**
 * Nombre d'écrans du simulateur.
 *
 * ⚠️ CE NOMBRE ÉTAIT ÉCRIT EN DUR DANS LE GLISSEMENT AU DOIGT (« < 3 »), et
 * ajouter un cinquième écran l'a rendu inatteignable au toucher : la barre du
 * bas y menait, le doigt non. Un écran qu'on ne peut atteindre que d'une seule
 * façon est un écran qu'on ne verra pas sur téléphone — c'est-à-dire là où ce
 * simulateur sert. La constante est donc partagée.
 */
const NB_ECRANS = 5;

const currentSlide = ref(0);
const saving = ref(false);
const saveSuccess = ref(false);
const selectedType = ref('Traitement');

const types = ['Contrôle', 'Traitement', 'Pesée', 'Récolte', 'Nourrissement'];
const chartBars = [30, 48, 38, 62, 72, 100];
const interventions = [
  { icon: '🔬', type: 'Traitement Varroa', date: '15 mai 2025' },
  { icon: '📋', type: 'Contrôle sanitaire', date: '8 mai 2025' },
  { icon: '🍯', type: 'Pesée ruche', date: '1 mai 2025' },
];
const ventes = [
  {
    id: 1,
    client: 'Marché de Caussade',
    date: '18 mai',
    produit: 'Miel toutes fleurs',
    amount: '75€',
  },
  { id: 2, client: 'GAEC Lefebvre', date: '12 mai', produit: 'Miel acacia 12kg', amount: '216€' },
];

function slideClass(i: number) {
  if (i === currentSlide.value) return 'phone-slide--active';
  return i < currentSlide.value ? 'phone-slide--left' : 'phone-slide--right';
}

let touchStartX = 0;

function goTo(i: number) {
  if (i !== 1) {
    saving.value = false;
    saveSuccess.value = false;
  }
  currentSlide.value = i;
  emit('update:activeSlide', i);
}

async function handleSave() {
  saving.value = true;
  await new Promise((r) => setTimeout(r, 1200));
  saving.value = false;
  saveSuccess.value = true;
  await new Promise((r) => setTimeout(r, 2000));
  goTo(0);
  await new Promise((r) => setTimeout(r, 400));
  saveSuccess.value = false;
}

function onTouchStart(e: TouchEvent) {
  touchStartX = e.touches[0]?.clientX ?? 0;
}
function onTouchEnd(e: TouchEvent) {
  const diff = touchStartX - (e.changedTouches[0]?.clientX ?? touchStartX);
  if (Math.abs(diff) > 50) {
    if (diff > 0 && currentSlide.value < NB_ECRANS - 1) goTo(currentSlide.value + 1);
    else if (diff < 0 && currentSlide.value > 0) goTo(currentSlide.value - 1);
  }
}

watch(
  () => props.activeSlide,
  (val) => {
    if (val !== undefined && val !== currentSlide.value) currentSlide.value = val;
  },
);
</script>

<style scoped>
/* ─── WRAPPER ─── */
.phone-wrapper {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.phone-glow {
  position: absolute;
  bottom: -40px;
  left: 50%;
  transform: translateX(-50%);
  width: 240px;
  height: 80px;
  background: radial-gradient(ellipse, rgba(245, 166, 35, 0.22) 0%, transparent 65%);
  pointer-events: none;
}

/* ─── FRAME ─── */
.phone-frame {
  position: relative;
  width: 264px;
  height: 556px;
  background: linear-gradient(160deg, #3a3a3c 0%, #1c1c1e 40%, #2c2c2e 100%);
  border-radius: 50px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow:
    0 0 0 1px rgba(0, 0, 0, 0.6),
    inset 0 1px 0 rgba(255, 255, 255, 0.07),
    0 50px 120px rgba(0, 0, 0, 0.55),
    0 15px 40px rgba(0, 0, 0, 0.35);
  user-select: none;
}
@media (min-width: 768px) {
  .phone-frame {
    transition:
      transform 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94),
      box-shadow 0.5s ease;
  }
  .phone-frame:hover {
    transform: translateY(-4px);
    box-shadow:
      0 0 0 1px rgba(0, 0, 0, 0.6),
      inset 0 1px 0 rgba(255, 255, 255, 0.07),
      0 60px 140px rgba(0, 0, 0, 0.65),
      0 20px 50px rgba(0, 0, 0, 0.4);
  }
}
.phone-btn-mute,
.phone-btn-vol-up,
.phone-btn-vol-down {
  position: absolute;
  left: -3px;
  width: 3px;
  border-radius: 2px 0 0 2px;
  background: linear-gradient(180deg, #4a4a4c, #3a3a3c);
}
.phone-btn-mute {
  top: 100px;
  height: 30px;
}
.phone-btn-vol-up {
  top: 148px;
  height: 48px;
}
.phone-btn-vol-down {
  top: 208px;
  height: 48px;
}
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
  position: absolute;
  top: 12px;
  left: 8px;
  right: 8px;
  bottom: 10px;
  border-radius: 42px;
  background: #fafaf8;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}
/* ─── STATUS BAR ─── */
.phone-status {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px 6px;
  flex-shrink: 0;
}
.phone-time {
  font-size: 11px;
  font-weight: 700;
  color: #1c1c1e;
  letter-spacing: -0.02em;
  font-variant-numeric: tabular-nums;
  flex-shrink: 0;
}
.phone-island {
  width: 96px;
  height: 30px;
  background: #1c1c1e;
  border-radius: 18px;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding-right: 10px;
  flex-shrink: 0;
}
.phone-island-camera {
  width: 9px;
  height: 9px;
  border-radius: 50%;
  background: radial-gradient(circle at 35% 35%, #2d2d2e, #0a0a0a);
  border: 1px solid rgba(255, 255, 255, 0.06);
}
.phone-status-icons {
  display: flex;
  align-items: center;
  gap: 5px;
  flex-shrink: 0;
}

/* ─── SLIDES ─── */
.phone-slides {
  position: relative;
  flex: 1;
  overflow: hidden;
  min-height: 0;
}
.s-badge-amber {
  border-radius: 999px;
  background: var(--honey-soft);
  padding: 3px 9px;
  font-size: 9.5px;
  font-weight: 700;
  color: var(--honey-deep);
}
/* Pastille de marquage : la couleur EST l'information (convention
   internationale de l'année de naissance), d'où le title au survol. */
.s-marque {
  height: 12px;
  width: 12px;
  flex-shrink: 0;
  border-radius: 50%;
  border: 1.5px solid rgba(0, 0, 0, 0.12);
}
.s-marque-s {
  height: 8px;
  width: 8px;
  border-width: 1px;
}
.s-reine {
  display: flex;
  align-items: center;
  gap: 9px;
  border-radius: 11px;
  border: 1px solid var(--border-default);
  background: #fff;
  padding: 9px 10px;
}
.s-index {
  margin-left: auto;
  text-align: right;
  line-height: 1.1;
  flex-shrink: 0;
}
/* Le badge de plan des sections gatées (cf. « 04 — Analyse pluriannuelle »). */
.s-index-plan {
  display: inline-block;
  margin-bottom: 2px;
  border-radius: 999px;
  background: var(--sage-soft);
  color: var(--sage-deep);
  font-size: 7px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: 1px 5px;
}
.s-index-v {
  display: block;
  font-size: 15px;
  font-weight: 800;
  color: var(--honey-deep);
}
.s-index-l {
  font-size: 9px;
  color: var(--text-secondary);
}
.s-arbre {
  display: flex;
  align-items: center;
  gap: 5px;
  overflow: hidden;
}
.s-noeud {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  border-radius: 8px;
  border: 1px solid var(--border-default);
  background: #fff;
  padding: 4px 7px;
  font-size: 9.5px;
  font-weight: 600;
  color: var(--text-secondary);
  white-space: nowrap;
}
.s-noeud-actif {
  border-color: var(--honey);
  background: var(--honey-soft);
  color: var(--honey-deep);
}
.s-noeud-mult {
  border-style: dashed;
}
.s-lien {
  font-size: 10px;
  color: var(--text-secondary);
}
.s-greffe {
  border-radius: 11px;
  border: 1px solid var(--border-default);
  background: #fff;
  padding: 9px 10px;
}
.s-greffe-h {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
}
.s-greffe-t {
  font-size: 11px;
  font-weight: 600;
  color: var(--text-primary);
}
/* 79 % ≥ 70 % : le palier « vert » du produit, ici l'olive doré de la charte. */
.s-greffe-taux {
  font-size: 13px;
  font-weight: 800;
  color: var(--status-good);
}
.s-greffe-barre {
  margin-top: 6px;
  height: 5px;
  overflow: hidden;
  border-radius: 3px;
  background: var(--surface-sunk);
}
.s-greffe-plein {
  display: block;
  height: 100%;
  border-radius: 3px;
  background: var(--status-good);
}
.s-greffe-d {
  margin-top: 5px;
  font-size: 9.5px;
  color: var(--text-secondary);
}

.phone-fondu {
  position: absolute;
  right: 0;
  bottom: 0;
  left: 0;
  height: 26px;
  pointer-events: none;
  background: linear-gradient(to bottom, rgba(250, 250, 248, 0), #fafaf8 88%);
}
.phone-slide {
  position: absolute;
  inset: 0;
  background: #fafaf8;
  transition:
    transform 0.55s cubic-bezier(0.4, 0, 0.2, 1),
    opacity 0.45s ease;
  pointer-events: none;
  overflow: hidden;
}
.phone-slide--left {
  transform: translateX(-100%);
  opacity: 0;
}
.phone-slide--active {
  transform: translateX(0);
  opacity: 1;
  pointer-events: auto;
}
.phone-slide--right {
  transform: translateX(100%);
  opacity: 0;
}
.s-scroll {
  height: 100%;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 10px 12px 8px;
  scrollbar-width: none;
  position: relative;
}
.s-scroll::-webkit-scrollbar {
  display: none;
}

/* ─── BOTTOM NAV ─── */
.phone-nav {
  display: flex;
  border-top: 1px solid rgba(0, 0, 0, 0.08);
  background: rgba(250, 250, 248, 0.98);
  flex-shrink: 0;
  padding: 4px 2px 0;
}
.phone-nav-btn {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: 6px 2px;
  border: none;
  background: none;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}
.phone-nav-btn span {
  font-size: 8.5px;
  font-weight: 500;
  color: #706963;
  transition: color 0.2s;
}
.phone-nav-btn.active span {
  /* Le miel pur donnait 2,03:1 à 8,5 px. C'est une barre d'onglets cliquable,
     pas un décor : #925b0f (--honey-deep) monte à 5,64 sans changer la teinte. */
  color: #925b0f;
  font-weight: 700;
}
.phone-home-bar {
  width: 90px;
  height: 4px;
  background: rgba(0, 0, 0, 0.18);
  border-radius: 2px;
  margin: 4px auto 8px;
  flex-shrink: 0;
}

/* ─── UTILITAIRES COMMUNS ─── */
.s-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.s-eyebrow {
  font-size: 8.5px;
  font-weight: 700;
  color: #706963;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}
.s-title {
  font-size: 17px;
  font-weight: 800;
  color: #1c1c1e;
  letter-spacing: -0.025em;
  line-height: 1.15;
}
.s-avatar {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background: #fef6e4;
  color: #925b0f;
  font-size: 9px;
  font-weight: 800;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.s-lbl {
  font-size: 8px;
  font-weight: 700;
  color: #706963;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  margin-bottom: 4px;
}
.mb2 {
  margin-bottom: 6px;
}
.mb3 {
  margin-bottom: 10px;
}
.mb4 {
  margin-bottom: 14px;
}
.mt2 {
  margin-top: 6px;
}
.mt3 {
  margin-top: 10px;
}
.s-back {
  width: 26px;
  height: 26px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.06);
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  flex-shrink: 0;
  -webkit-tap-highlight-color: transparent;
}

/* ─── CARTE MAYA (dashboard) ─── */
.s-maya {
  border-radius: 12px;
  padding: 9px 10px;
  background: linear-gradient(180deg, var(--honey-soft), #fffdf8);
  border: 1px solid rgba(245, 166, 35, 0.28);
}
.s-maya-head {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 5px;
}
.s-maya-mark {
  width: 18px;
  height: 18px;
  border-radius: 6px;
  background: linear-gradient(135deg, var(--honey), var(--honey-deep));
  color: #fff;
  font-size: 11px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 1px 4px rgba(245, 166, 35, 0.5);
  flex-shrink: 0;
}
.s-maya-name {
  font-size: 11px;
  font-weight: 800;
  color: #1c1c1e;
  flex: 1;
}
.s-maya-open {
  font-size: 9px;
  font-weight: 700;
  color: var(--honey-deep);
  background: rgba(245, 166, 35, 0.14);
  padding: 2px 7px;
  border-radius: 20px;
}
.s-maya-intro {
  font-size: 10.5px;
  color: var(--text-secondary);
  line-height: 1.35;
  margin-bottom: 6px;
}
.s-maya-intro b {
  color: #1c1c1e;
  font-weight: 700;
}
.s-maya-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 3px 0;
}
.s-maya-chip {
  width: 18px;
  height: 18px;
  border-radius: 6px;
  font-size: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.s-maya-txt {
  font-size: 10px;
  color: #1c1c1e;
  line-height: 1.2;
}
.s-maya-txt b {
  color: var(--honey-deep);
  font-weight: 700;
}

/* ─── KPIs DASHBOARD ─── */
.s-kpis {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 4px;
}
.s-kpi {
  padding: 7px 8px;
  border-radius: 9px;
}
.s-kv {
  font-size: 16px;
  font-weight: 800;
  color: #1c1c1e;
  letter-spacing: -0.03em;
  line-height: 1;
}
.s-ku {
  font-size: 8px;
  font-weight: 700;
}
.s-kl {
  font-size: 8px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin-top: 2px;
}

/* ─── ITEMS LISTE ─── */
.s-item {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 7px 8px;
  background: white;
  border-radius: 9px;
  margin-bottom: 4px;
  border: 1px solid rgba(0, 0, 0, 0.06);
  cursor: pointer;
  text-align: left;
  -webkit-tap-highlight-color: transparent;
}
.s-item:active {
  background: #f5f4f1;
}
.s-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  flex-shrink: 0;
}
.s-ic {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 1px;
  min-width: 0;
}
.s-it {
  font-size: 11px;
  font-weight: 600;
  color: #1c1c1e;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.s-is {
  font-size: 9.5px;
  color: #706963;
}
.s-chev {
  font-size: 15px;
  color: #d6d3d1;
  flex-shrink: 0;
  line-height: 1;
}
.s-next {
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 7px 8px;
  background: white;
  border-radius: 9px;
  border: 1px solid rgba(0, 0, 0, 0.06);
}

/* ─── FAB ─── */
.s-fab {
  position: absolute;
  bottom: 10px;
  right: 12px;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: #f5a623;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 3px 12px rgba(245, 166, 35, 0.45);
  transition:
    transform 0.15s,
    box-shadow 0.15s;
  -webkit-tap-highlight-color: transparent;
}
.s-fab:active {
  transform: scale(0.9);
  box-shadow: 0 1px 6px rgba(245, 166, 35, 0.3);
}

/* ─── FORMULAIRE INTERVENTION ─── */
.s-flbl {
  font-size: 9px;
  font-weight: 700;
  color: #57534e;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  margin-bottom: 3px;
}
.s-pill-input {
  background: white;
  border: 1px solid rgba(0, 0, 0, 0.12);
  border-radius: 8px;
  padding: 7px 10px;
  font-size: 11px;
  font-weight: 600;
  color: #1c1c1e;
}
.s-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}
.s-chip {
  padding: 4px 8px;
  border-radius: 20px;
  border: 1px solid rgba(0, 0, 0, 0.12);
  background: white;
  font-size: 9.5px;
  font-weight: 600;
  color: #57534e;
  cursor: pointer;
  transition: all 0.15s;
  -webkit-tap-highlight-color: transparent;
}
.s-chip.active {
  background: #f5a623;
  border-color: #f5a623;
  color: white;
}
.s-row-f {
  display: flex;
  gap: 8px;
}
.s-fb {
  flex: 1;
}
.s-input {
  background: white;
  border: 1px solid rgba(0, 0, 0, 0.12);
  border-radius: 8px;
  padding: 6px 9px;
  font-size: 11px;
  font-weight: 600;
  color: #1c1c1e;
}
.s-textarea {
  background: white;
  border: 1px solid rgba(0, 0, 0, 0.12);
  border-radius: 8px;
  padding: 7px 10px;
  font-size: 10.5px;
  color: #57534e;
  min-height: 32px;
}
.s-save {
  width: 100%;
  padding: 10px;
  border-radius: 10px;
  background: #f5a623;
  border: none;
  font-size: 12px;
  font-weight: 700;
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  transition: opacity 0.2s;
}
.s-save.loading {
  opacity: 0.7;
  cursor: not-allowed;
}
.s-save:not(.loading):active {
  opacity: 0.85;
}
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
.s-spin {
  animation: spin 0.7s linear infinite;
}

/* ─── SUCCÈS ─── */
.s-success {
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 20px;
}
.s-success-ring {
  padding: 8px;
  border-radius: 50%;
  background: rgba(245, 166, 35, 0.12);
}
.s-success-check {
  width: 52px;
  height: 52px;
  border-radius: 50%;
  background: #f5a623;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 16px rgba(245, 166, 35, 0.35);
}
.s-success-t {
  font-size: 16px;
  font-weight: 800;
  color: #1c1c1e;
}
.s-success-s {
  font-size: 11px;
  color: #706963;
  text-align: center;
  line-height: 1.6;
}

/* ─── FICHE RUCHE ─── */
.s-badge-red {
  display: inline-block;
  margin-top: 2px;
  padding: 2px 7px;
  background: #fff1f0;
  border-radius: 5px;
  font-size: 8.5px;
  font-weight: 700;
  color: #ef4444;
}
.s-stats {
  display: flex;
  background: white;
  border: 1px solid rgba(0, 0, 0, 0.06);
  border-radius: 10px;
  overflow: hidden;
}
.s-sc {
  flex: 1;
  padding: 8px 0;
  text-align: center;
}
.s-sv {
  font-size: 13px;
  font-weight: 800;
  color: #1c1c1e;
  letter-spacing: -0.02em;
}
.s-sl {
  font-size: 8px;
  font-weight: 600;
  color: #706963;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin-top: 1px;
}
.s-sep {
  width: 1px;
  background: rgba(0, 0, 0, 0.06);
}
.s-btn-outline {
  width: 100%;
  padding: 8px;
  border-radius: 8px;
  border: 1.5px solid #f5a623;
  background: transparent;
  font-size: 11px;
  font-weight: 700;
  color: #f5a623;
  cursor: pointer;
  text-align: center;
  -webkit-tap-highlight-color: transparent;
}
.s-btn-outline:active {
  background: rgba(245, 166, 35, 0.06);
}

/* ─── FINANCES ─── */
.s-ca-card {
  background: linear-gradient(135deg, #1c1c1e 0%, #2c2c2e 100%);
  border-radius: 12px;
  padding: 12px;
}
.s-ca-lbl {
  font-size: 8.5px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.5);
  text-transform: uppercase;
  letter-spacing: 0.07em;
}
.s-ca-val {
  font-size: 22px;
  font-weight: 800;
  color: white;
  letter-spacing: -0.04em;
  line-height: 1.1;
  margin-top: 2px;
}
.s-ca-val span {
  font-size: 14px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.55);
}
.s-ca-badge {
  background: rgba(245, 166, 35, 0.2);
  color: #f5a623;
  font-size: 9px;
  font-weight: 700;
  padding: 3px 7px;
  border-radius: 20px;
  align-self: flex-start;
  white-space: nowrap;
}
.s-chart {
  display: flex;
  align-items: flex-end;
  gap: 3px;
  height: 36px;
  margin-top: 10px;
}
.s-bar {
  flex: 1;
  background: #f5a623;
  border-radius: 2px;
  min-height: 4px;
  opacity: 0.85;
}
.s-bar:last-child {
  opacity: 1;
}
.s-euro {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: #f9efe3;
  font-size: 10px;
  font-weight: 800;
  color: #7d5220;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.s-amount {
  font-size: 11px;
  font-weight: 700;
  color: #7d5220;
  flex-shrink: 0;
}
</style>
