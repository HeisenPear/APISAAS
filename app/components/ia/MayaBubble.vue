<!--
  MayaBubble — présence DISCRÈTE de Maya (§7bis handoff). Bouton ink en bas à
  droite qui se déplie en fenêtre de conversation (morph). Réponses déterministes
  au tap/voix, moteur local via useCopilote, rendu réutilisant IaCopiloteMessage.
  Monté globalement dans layouts/default.vue. Le FAB est desktop-only ; sur mobile
  la BottomNav ouvre la même fenêtre (maya.openBubble).
  NB : version alignée sur la spec du handoff — visuels/copies à affiner contre le
  prototype exact (maya/proto « Maya - Bulle ») dès qu'il est accessible.
-->
<template>
  <div class="maya-bubble-root">
    <!-- Fenêtre dépliée -->
    <Transition name="mb-morph">
      <section
        v-if="maya.bubbleOpen"
        class="mb-window"
        role="dialog"
        aria-label="Maya — assistant"
      >
        <header class="mb-head">
          <IaMayaMark :size="26" glow :state="streaming ? 'think' : 'idle'" />
          <div class="min-w-0 flex-1">
            <p class="mb-head-title">Maya</p>
            <p class="mb-head-sub">{{ streaming ? (activite ?? 'Je réfléchis…') : 'Au tap ou à la voix' }}</p>
          </div>
          <button
            v-if="messages.length"
            type="button"
            class="mb-icon-btn"
            title="Nouvelle discussion"
            aria-label="Nouvelle discussion"
            :disabled="streaming"
            @click="reset"
          >
            <UIcon name="i-lucide-square-pen" class="h-4 w-4" />
          </button>
          <button
            type="button"
            class="mb-icon-btn"
            title="Réglages de Maya"
            aria-label="Réglages de Maya"
            @click="maya.openSettings()"
          >
            <UIcon name="i-lucide-settings-2" class="h-4 w-4" />
          </button>
          <button
            type="button"
            class="mb-icon-btn"
            title="Fermer"
            aria-label="Fermer"
            @click="maya.closeBubble()"
          >
            <UIcon name="i-lucide-x" class="h-4 w-4" />
          </button>
        </header>

        <div ref="scrollEl" class="mb-body">
          <!-- État vide : accueil + amorces au tap -->
          <div v-if="!messages.length" class="mb-empty">
            <IaMayaMark :size="48" glow state="idle" />
            <p class="mb-empty-title">Bonjour {{ prenom }} 🐝</p>
            <p class="mb-empty-sub">
              J'agis sur vos données et je réponds à vos questions d'apiculture — jamais je n'invente.
            </p>
            <div class="mb-chips">
              <button
                v-for="s in exemples"
                :key="s"
                type="button"
                class="mb-chip"
                @click="envoyer(s)"
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
            @suggest="envoyer"
          />

          <div v-if="streaming && activite" class="mb-activite">
            <span class="mb-ping"><span /><span /></span>
            <span>{{ activite }}</span>
          </div>

          <div v-if="erreur" class="mb-erreur">
            <UIcon name="i-lucide-lock" class="h-4 w-4 shrink-0" />
            <span>{{ erreur.message }}</span>
          </div>
        </div>

        <form class="mb-input" @submit.prevent="submit">
          <textarea
            v-model="brouillon"
            rows="1"
            placeholder="Écrire à Maya…"
            class="mb-textarea"
            :disabled="streaming"
            @keydown.enter.exact.prevent="submit"
          />
          <UButton
            type="submit"
            icon="i-lucide-send"
            color="primary"
            size="sm"
            :loading="streaming"
            :disabled="!brouillon.trim()"
            aria-label="Envoyer"
          />
        </form>
      </section>
    </Transition>

    <!-- FAB desktop, SEULEMENT en mode discret (en « partout » c'est le MayaLauncher
         qui porte Maya sur desktop). Sur mobile, la BottomNav ouvre la fenêtre. -->
    <button
      v-if="!maya.bubbleOpen && maya.modeDiscret"
      type="button"
      class="mb-fab"
      aria-label="Ouvrir Maya"
      @click="maya.openBubble()"
    >
      <IaMayaMark :size="30" glow state="idle" />
    </button>
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
  reset,
} = useCopilote();

const brouillon = ref('');
const scrollEl = ref<HTMLElement | null>(null);

const exemples = ['Comment vont mes ruches ?', 'Quel temps pour visiter ?', 'Faire une intervention'];

function submit(): void {
  const q = brouillon.value.trim();
  if (!q || streaming.value) return;
  brouillon.value = '';
  envoyer(q);
}

// Suit le flux : auto-scroll en bas quand un message arrive / stream.
watch(
  [messages, streaming, () => maya.bubbleOpen],
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
  right: 20px;
  bottom: 20px;
  z-index: var(--z-fab, 60);
}
.mb-fab {
  display: flex;
  height: 56px;
  width: 56px;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: var(--surface-sidebar, #1c1c1e);
  box-shadow: 0 8px 24px rgba(28, 28, 30, 0.28);
  transition: transform 0.2s ease;
  margin-left: auto;
}
.mb-fab:hover {
  transform: translateY(-2px);
}
.mb-window {
  display: flex;
  flex-direction: column;
  width: min(392px, calc(100vw - 32px));
  height: min(580px, calc(100dvh - 120px));
  background: var(--surface-primary, #faf8f4);
  border: 1px solid var(--border-default);
  border-radius: 20px;
  box-shadow: 0 16px 48px rgba(28, 28, 30, 0.24);
  overflow: hidden;
  transform-origin: bottom right;
}
@media (max-width: 639px) {
  /* Au-dessus de la BottomNav (58px + safe-area). */
  .maya-bubble-root {
    right: 12px;
    bottom: calc(58px + env(safe-area-inset-bottom, 0px) + 12px);
  }
  .mb-window {
    width: calc(100vw - 24px);
    height: min(66dvh, 560px);
  }
}
.mb-head {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 14px;
  border-bottom: 1px solid var(--border-faint);
  background: #fff;
}
.mb-head-title {
  font-size: 14px;
  font-weight: 700;
  color: var(--text-primary);
  line-height: 1.1;
}
.mb-head-sub {
  font-size: 11.5px;
  color: var(--text-tertiary);
  line-height: 1.2;
}
.mb-icon-btn {
  display: flex;
  height: 30px;
  width: 30px;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  border-radius: 9px;
  color: var(--text-tertiary);
  transition: all 0.15s ease;
}
.mb-icon-btn:hover {
  background: var(--surface-muted);
  color: var(--text-secondary);
}
.mb-icon-btn:disabled {
  opacity: 0.4;
}
.mb-body {
  flex: 1;
  overflow-y: auto;
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.mb-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  text-align: center;
  padding: 18px 6px 6px;
}
.mb-empty-title {
  font-size: 14.5px;
  font-weight: 600;
  color: var(--text-primary);
}
.mb-empty-sub {
  font-size: 12px;
  color: var(--text-tertiary);
  line-height: 1.5;
  max-width: 30ch;
}
.mb-chips {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 7px;
  margin-top: 6px;
}
.mb-chip {
  border-radius: 999px;
  border: 1px solid var(--border-default);
  background: #fff;
  padding: 7px 12px;
  font-size: 12px;
  font-weight: 500;
  color: var(--text-secondary);
  transition: all 0.15s ease;
}
.mb-chip:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(28, 28, 30, 0.08);
}
.mb-activite {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  font-style: italic;
  color: var(--text-tertiary);
}
.mb-ping {
  position: relative;
  display: inline-flex;
  height: 8px;
  width: 8px;
}
.mb-ping span:first-child {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background: var(--honey);
  opacity: 0.75;
  animation: ping 1s cubic-bezier(0, 0, 0.2, 1) infinite;
}
.mb-ping span:last-child {
  position: relative;
  height: 8px;
  width: 8px;
  border-radius: 50%;
  background: var(--honey);
}
@keyframes ping {
  75%,
  100% {
    transform: scale(2);
    opacity: 0;
  }
}
.mb-erreur {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  font-size: 12.5px;
  color: var(--honey-deep);
  background: var(--honey-soft);
  border-radius: 12px;
  padding: 10px 12px;
}
.mb-input {
  display: flex;
  align-items: flex-end;
  gap: 8px;
  padding: 10px 12px;
  border-top: 1px solid var(--border-faint);
  background: #fff;
}
.mb-textarea {
  flex: 1;
  max-height: 96px;
  resize: none;
  border: 0;
  background: transparent;
  padding: 8px 4px;
  font-size: 13.5px;
  color: var(--text-primary);
  outline: none;
}
/* Morph : la fenêtre émerge du coin bas-droit (approx. handoff, à affiner sur proto) */
.mb-morph-enter-active,
.mb-morph-leave-active {
  transition:
    opacity 0.22s ease,
    transform 0.24s cubic-bezier(0.16, 1, 0.3, 1);
}
.mb-morph-enter-from,
.mb-morph-leave-to {
  opacity: 0;
  transform: translateY(16px) scale(0.9);
}
@media (prefers-reduced-motion: reduce) {
  .mb-morph-enter-active,
  .mb-morph-leave-active,
  .mb-fab {
    transition: none;
  }
}
</style>
