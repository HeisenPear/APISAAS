<!--
  MayaBubble — la surface UNIQUE de Maya (§7bis handoff). VRAI « morph » : un bouton
  ink en bas à droite dont l'EN-TÊTE EST le bouton, et qui se DÉPLIE en fenêtre de
  conversation (la coquille grandit depuis le coin). Fidèle à la maquette
  design/maya (proto « Maya - Bulle »). Rendu 100 % DÉTERMINISTE : le corps du fil
  est branché sur le vrai moteur local (`useCopilote` → `IaCopiloteMessage` : blocs,
  confirmations, undo). Monté une fois dans layouts/default.vue dès que la présence
  n'est pas « pause » (desktop + mobile). Le mode « partout » vs « discrète » ne change
  PAS la bulle (toujours là) mais les surfaces proactives (DashboardMayaCard).
-->
<template>
  <div class="maya-bubble-root">
    <!-- infobulle de sollicitation quand fermé + proposition en attente (dormant tant
         qu'aucune vraie proposition proactive n'est branchée → pas de badge factice) -->
    <div v-if="!open && hasAlert" class="maya-bubble-tip maya-msg-in">
      Une proposition pour toi 🐝
    </div>

    <!-- LA COQUILLE : bouton (fermé) ⇆ fenêtre (ouvert), un seul élément qui se morphe -->
    <div
      :class="['maya-shell', { 'is-open': open }, !open ? 'maya-launch' : null]"
      :style="shellStyle"
      @click="!open && maya.openBubble()"
    >
      <!-- en-tête = le bouton : noir plein fermé, dégradé chaud + lueur une fois déplié -->
      <div class="maya-head" :class="{ 'is-open': open }">
        <div class="maya-head-glow" :style="{ opacity: open ? 1 : 0 }" />
        <div class="maya-head-orb" :style="{ opacity: open ? 1 : 0 }" />

        <div
          class="maya-head-mark"
          :style="{ top: open ? '14px' : '12px', left: open ? '16px' : '12px' }"
        >
          <IaMayaMark :size="34" :glow="open" :state="headState" />
        </div>
        <span v-if="!open && hasAlert" class="maya-badge">1</span>

        <!-- titre + actions : apparaissent une fois déplié -->
        <div class="maya-head-body" :style="{ opacity: open ? 1 : 0 }">
          <div class="maya-head-title">
            <div class="maya-name">Maya</div>
            <div class="maya-status">
              <span class="maya-dot" :style="{ background: streaming ? '#f5a623' : '#c9873d' }" />
              {{ statusLabel }}
            </div>
          </div>
          <button
            v-if="messages.length"
            type="button"
            class="maya-head-btn"
            title="Nouvelle discussion"
            aria-label="Nouvelle discussion"
            :disabled="streaming"
            @click.stop="reset"
          >
            <UIcon name="i-lucide-square-pen" class="h-4 w-4" />
          </button>
          <button
            type="button"
            class="maya-head-btn"
            title="Réglages de Maya"
            aria-label="Réglages de Maya"
            @click.stop="maya.openSettings()"
          >
            <UIcon name="i-lucide-settings-2" class="h-4 w-4" />
          </button>
          <button
            type="button"
            class="maya-head-btn"
            title="Réduire"
            aria-label="Réduire"
            @click.stop="maya.closeBubble()"
          >
            <UIcon name="i-lucide-chevron-down" class="h-[18px] w-[18px]" />
          </button>
        </div>
      </div>

      <!-- corps : le VRAI fil déterministe (visible seulement ouvert) -->
      <div ref="scrollEl" class="maya-body" :style="{ opacity: open ? 1 : 0 }">
        <!-- accueil + amorces au tap -->
        <div v-if="!messages.length" class="maya-empty">
          <IaMayaMark :size="46" glow state="idle" />
          <p class="maya-empty-title">Bonjour {{ prenom }} 🐝</p>
          <p class="maya-empty-sub">
            J'agis sur tes données et je réponds à tes questions d'apiculture — jamais je n'invente.
          </p>
          <div class="maya-chips">
            <button
              v-for="s in exemples"
              :key="s"
              type="button"
              class="maya-chip"
              @click.stop="envoyer(s)"
            >
              {{ s }}
            </button>
          </div>
        </div>

        <IaCopiloteMessage
          v-for="(m, i) in messages"
          :key="i"
          :message="m"
          :is-last="i === messages.length - 1"
          @confirm="confirmerAction"
          @cancel="annulerAction"
          @undo="annulerEcriture"
          @confirm-plan="confirmerPlan"
          @cancel-plan="annulerPlanProposition"
          @undo-plan="annulerLotExecute"
          @suggest="envoyer"
        />

        <div v-if="streaming && activite" class="maya-typing">
          <span /><span /><span /> {{ activite }}
        </div>

        <div v-if="erreur" class="maya-erreur">
          <UIcon name="i-lucide-lock" class="h-4 w-4 shrink-0" />
          <span>{{ erreur.message }}</span>
        </div>
      </div>

      <!-- pied : saisie (déterministe : surtout pour préciser, l'action reste au tap) -->
      <div class="maya-foot" :style="{ opacity: open ? 1 : 0 }">
        <form class="maya-input-row" @submit.prevent="submit">
          <input
            v-model="brouillon"
            placeholder="Écrire à Maya…"
            :disabled="streaming"
            @keydown.enter.prevent="submit"
            @click.stop
          />
          <button
            type="submit"
            class="maya-send"
            :disabled="streaming || !brouillon.trim()"
            aria-label="Envoyer"
            @click.stop
          >
            <UIcon name="i-lucide-arrow-up" class="h-[17px] w-[17px]" />
          </button>
        </form>
        <div class="maya-disclaimer">
          Maya suit des règles apicoles éprouvées · tu gardes la main sur tout
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const maya = useMayaStore();
const authStore = useAuthStore();
const prenom = computed(() => authStore.profil?.prenom || '');

const {
  messages,
  streaming,
  activite,
  erreur,
  envoyer,
  confirmerAction,
  annulerAction,
  annulerEcriture,
  confirmerPlan,
  annulerPlanProposition,
  annulerLotExecute,
  reset,
} = useCopilote();

const brouillon = ref('');
const scrollEl = ref<HTMLElement | null>(null);

const exemples = [
  'Comment vont mes ruches ?',
  'Quel temps pour visiter ?',
  'Faire une intervention',
];

// `open` = état de la bulle porté par le store (ouvrable aussi par la BottomNav mobile).
const open = computed(() => maya.bubbleOpen);

// hasAlert : DOIT venir d'une vraie proposition proactive (essaimage, gel, retard).
// Tant que le déclencheur proactif n'est pas branché (Volet moteur), on le laisse à
// false → pas de badge « 1 » factice (règle projet : zéro donnée inventée).
const hasAlert = ref(false);

// États du logo câblés sur le vrai statut : fermé+alerte → alert ; ouvert+stream → think.
const headState = computed<'alert' | 'idle' | 'think'>(() => {
  if (!open.value) return hasAlert.value ? 'alert' : 'idle';
  return streaming.value ? 'think' : 'idle';
});

const statusLabel = computed(() =>
  streaming.value ? (activite.value ?? 'réfléchit…') : 'Prête à aider',
);

// Morph : la coquille grandit depuis le bouton. Dimensions responsives (clamp mobile).
const shellStyle = computed(() => ({
  width: open.value ? 'min(392px, calc(100vw - 24px))' : '58px',
  height: open.value ? 'min(580px, calc(100dvh - 120px))' : '58px',
  borderRadius: open.value ? '22px' : '18px',
  background: open.value ? 'linear-gradient(180deg,#fdf8ef,#fbf1de)' : '#111112',
  boxShadow: open.value
    ? '0 28px 70px rgba(40,30,20,0.32), 0 0 0 1px rgba(180,140,80,0.18)'
    : '0 12px 30px rgba(28,28,30,0.34)',
}));

function submit(): void {
  const q = brouillon.value.trim();
  if (!q || streaming.value) return;
  brouillon.value = '';
  envoyer(q);
}

// Suit le flux : auto-scroll en bas quand un message arrive / stream.
watch(
  [messages, streaming, open],
  async () => {
    await nextTick();
    if (scrollEl.value) scrollEl.value.scrollTop = scrollEl.value.scrollHeight;
  },
  { deep: true },
);

// Échap ferme la fenêtre.
function onKey(e: KeyboardEvent): void {
  if (e.key === 'Escape' && maya.bubbleOpen) maya.closeBubble();
}
onMounted(() => window.addEventListener('keydown', onKey));
onUnmounted(() => window.removeEventListener('keydown', onKey));
</script>

<style scoped>
.maya-bubble-root {
  position: fixed;
  right: 24px;
  bottom: 24px;
  z-index: var(--z-fab, 60);
}
@media (max-width: 639px) {
  /* Au-dessus de la BottomNav (58px + safe-area). */
  .maya-bubble-root {
    right: 16px;
    bottom: calc(58px + env(safe-area-inset-bottom, 0px) + 14px);
  }
}
.maya-bubble-tip {
  position: absolute;
  right: 68px;
  bottom: 16px;
  white-space: nowrap;
  background: var(--surface-card, #fff);
  border: 1px solid var(--border-default);
  border-radius: 12px 12px 4px 12px;
  padding: 8px 12px;
  font-size: 12px;
  font-weight: 500;
  color: var(--text-primary);
  box-shadow: var(--shadow-md);
}

/* la coquille qui se morphe */
.maya-shell {
  position: absolute;
  right: 0;
  bottom: 0;
  overflow: hidden;
  transition:
    width 0.5s cubic-bezier(0.32, 1.02, 0.38, 1),
    height 0.54s cubic-bezier(0.32, 1.02, 0.38, 1),
    border-radius 0.5s ease,
    box-shadow 0.5s ease,
    background 0.4s ease;
}

.maya-head {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 62px;
  overflow: hidden;
  background: #111112;
  transition: background 0.45s ease;
}
.maya-head.is-open {
  background: linear-gradient(135deg, #2c2218, #1a1a1c);
}
.maya-head-glow {
  position: absolute;
  inset: 0;
  background: radial-gradient(130% 120% at 20% -20%, rgba(245, 166, 35, 0.42), transparent 60%);
  transition: opacity 0.5s ease 0.1s;
}
.maya-head-orb {
  position: absolute;
  width: 120px;
  height: 120px;
  border-radius: 50%;
  left: -14px;
  top: -50px;
  background: radial-gradient(circle, rgba(245, 166, 35, 0.5), transparent 70%);
  filter: blur(6px);
  animation: maya-float 6.5s ease-in-out infinite;
  transition: opacity 0.5s ease 0.1s;
}
.maya-head-mark {
  position: absolute;
  transition:
    top 0.5s cubic-bezier(0.32, 1.02, 0.38, 1),
    left 0.5s cubic-bezier(0.32, 1.02, 0.38, 1);
}
.maya-badge {
  position: absolute;
  top: 6px;
  right: 6px;
  min-width: 18px;
  height: 18px;
  padding: 0 4px;
  border-radius: 99px;
  background: var(--status-bad, #b54545);
  color: #fff;
  font-size: 11px;
  font-weight: 700;
  display: grid;
  place-items: center;
  border: 2px solid #111112;
}
.maya-head-body {
  position: absolute;
  top: 0;
  left: 60px;
  right: 10px;
  height: 62px;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: opacity 0.25s 0.2s;
}
.maya-head-title {
  flex: 1;
  min-width: 0;
}
.maya-name {
  font-family: var(--font-display);
  font-weight: 600;
  font-size: 15px;
  color: #fff;
}
.maya-status {
  font-size: 11.5px;
  color: rgba(255, 255, 255, 0.62);
  display: flex;
  align-items: center;
  gap: 5px;
}
.maya-dot {
  width: 6px;
  height: 6px;
  border-radius: 99px;
  flex-shrink: 0;
}
.maya-head-btn {
  width: 30px;
  height: 30px;
  border-radius: 8px;
  border: none;
  background: rgba(255, 255, 255, 0.08);
  color: #fff;
  display: grid;
  place-items: center;
  cursor: pointer;
  flex-shrink: 0;
  transition: background 0.15s ease;
}
.maya-head-btn:hover {
  background: rgba(255, 255, 255, 0.16);
}
.maya-head-btn:disabled {
  opacity: 0.4;
  cursor: default;
}

.maya-body {
  position: absolute;
  top: 62px;
  left: 0;
  right: 0;
  bottom: 74px;
  overflow: auto;
  padding: 16px 14px 8px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  transition: opacity 0.3s 0.22s;
}
.maya-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  text-align: center;
  padding: 14px 6px 4px;
}
.maya-empty-title {
  font-size: 14.5px;
  font-weight: 600;
  color: var(--text-primary);
}
.maya-empty-sub {
  font-size: 12px;
  color: var(--text-tertiary);
  line-height: 1.5;
  max-width: 30ch;
}
.maya-chips {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 7px;
  margin-top: 6px;
}
.maya-chip {
  border-radius: 999px;
  border: 1px solid var(--border-default);
  background: #fff;
  padding: 7px 12px;
  font-size: 12px;
  font-weight: 500;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.15s ease;
}
.maya-chip:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(28, 28, 30, 0.08);
}
.maya-typing {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12.5px;
  color: var(--text-tertiary);
}
.maya-typing span {
  width: 6px;
  height: 6px;
  border-radius: 99px;
  background: var(--honey);
  animation: maya-glow-pulse 1.2s ease-in-out infinite;
}
.maya-typing span:nth-child(2) {
  animation-delay: 0.15s;
}
.maya-typing span:nth-child(3) {
  animation-delay: 0.3s;
}
.maya-erreur {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  font-size: 12.5px;
  color: var(--honey-deep);
  background: var(--honey-soft);
  border-radius: 12px;
  padding: 10px 12px;
}

.maya-foot {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 8px 12px 12px;
  transition: opacity 0.3s 0.24s;
}
.maya-input-row {
  display: flex;
  align-items: center;
  gap: 9px;
  background: #fff;
  border: 1.5px solid var(--border-strong);
  border-radius: 14px;
  padding: 7px 8px 7px 14px;
  box-shadow: 0 4px 14px rgba(120, 100, 80, 0.06);
}
.maya-input-row input {
  flex: 1;
  min-width: 0;
  border: none;
  outline: none;
  background: transparent;
  font-size: 14px;
  color: var(--text-primary);
  font-family: inherit;
}
.maya-send {
  width: 34px;
  height: 34px;
  flex-shrink: 0;
  border-radius: 9px;
  border: none;
  background: linear-gradient(135deg, #f5a623, #e6982c);
  color: #fff;
  display: grid;
  place-items: center;
  cursor: pointer;
  transition: opacity 0.15s ease;
}
.maya-send:disabled {
  opacity: 0.45;
  cursor: default;
}
.maya-disclaimer {
  text-align: center;
  font-size: 10.5px;
  color: var(--text-tertiary);
  margin-top: 7px;
}

@media (prefers-reduced-motion: reduce) {
  .maya-shell,
  .maya-head-mark,
  .maya-head-orb {
    transition: none;
    animation: none;
  }
}
</style>
