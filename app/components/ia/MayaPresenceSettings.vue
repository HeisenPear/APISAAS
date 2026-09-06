<!--
  MayaPresenceSettings — réglages de présence de Maya (§7bis handoff). Visuel aligné
  sur la maquette design/maya (en-tête sombre chaud cohérent avec la bulle) ; câblé
  sur le store Pinia. Ouvert depuis l'entrée sidebar « Maya · Assistant » et l'icône
  réglages de la bulle. Choix Partout / Discrète / En pause + ce que Maya surveille.
  Garde-fou §11 : aucun i-lucide-sparkles associé à Maya (identité = rayon de miel).
-->
<template>
  <Teleport to="body">
    <Transition name="mps-fade">
      <div
        v-if="open"
        class="mps-overlay"
        role="dialog"
        aria-modal="true"
        aria-label="Réglages de Maya"
        @click.self="close"
        @keydown.esc="close"
      >
        <div class="mps-card maya-msg-in">
          <!-- en-tête vivant, cohérent avec la bulle morph -->
          <header class="mps-head">
            <div class="mps-head-glow" />
            <div class="mps-head-orb" />
            <div class="mps-head-row">
              <IaMayaMark
                :size="40"
                :glow="maya.presence !== 'pause'"
                :state="maya.presence === 'pause' ? 'static' : 'idle'"
              />
              <div class="min-w-0 flex-1">
                <div class="mps-title-row">
                  <span class="mps-title">Maya</span>
                  <span class="mps-chip">Assistant</span>
                </div>
                <p class="mps-sub">Règle sa présence et ce qu'elle surveille pour toi.</p>
              </div>
              <button type="button" class="mps-close" aria-label="Fermer" @click="close">
                <UIcon name="i-lucide-x" class="h-[17px] w-[17px]" />
              </button>
            </div>
          </header>

          <div class="mps-body">
            <p class="mps-label">Présence</p>
            <div class="mps-modes">
              <button
                v-for="opt in OPTIONS"
                :key="opt.value"
                type="button"
                class="mps-mode"
                :class="{ 'is-active': maya.presence === opt.value }"
                @click="maya.setPresence(opt.value)"
              >
                <span class="mps-mode-ic" :class="{ 'is-active': maya.presence === opt.value }">
                  <UIcon :name="opt.icon" class="h-[19px] w-[19px]" />
                </span>
                <span class="min-w-0 flex-1 text-left">
                  <span class="mps-mode-title-row">
                    <span class="mps-mode-name">{{ opt.label }}</span>
                    <UIcon
                      v-if="maya.presence === opt.value"
                      name="i-lucide-check"
                      class="mps-check h-4 w-4"
                    />
                  </span>
                  <span class="mps-mode-desc">{{ opt.desc }}</span>
                </span>
              </button>
            </div>

            <div v-if="maya.presence !== 'pause'">
              <p class="mps-label mt">Ce que Maya surveille</p>
              <div class="mps-watch">
                <label v-for="w in WATCH" :key="w.key" class="mps-watch-row">
                  <span class="mps-watch-ic"
                    ><UIcon :name="w.icon" class="h-[17px] w-[17px]"
                  /></span>
                  <span class="min-w-0 flex-1">
                    <span class="mps-watch-name">{{ w.label }}</span>
                    <span class="mps-watch-desc">{{ w.desc }}</span>
                  </span>
                  <UiToggle
                    :model-value="maya.surveillance[w.key]"
                    :label="w.label"
                    @update:model-value="maya.toggleSurveillance(w.key)"
                  />
                </label>
              </div>

              <template v-if="reveilSupporte">
                <p class="mps-label mt">Réveil vocal</p>
                <label class="mps-watch mps-watch-row">
                  <span class="mps-watch-ic"
                    ><UIcon name="i-lucide-ear" class="h-[17px] w-[17px]"
                  /></span>
                  <span class="min-w-0 flex-1">
                    <span class="mps-watch-name">« Salut Maya »</span>
                    <!-- ⚠️ CE TEXTE DIT CE QUE L'OPTION FAIT VRAIMENT, ET IL A
                         DÛ ÊTRE RÉÉCRIT. Il annonçait « ouvre Maya à la voix » ;
                         depuis, elle ouvre AUSSI la dictée toute seule, envoie
                         la phrase quand on se tait, et RÉPOND À VOIX HAUTE. Le
                         dernier point n'est pas un détail : une application qui
                         se met à parler dans une salle d'attente, un bureau ou
                         un train surprend, et on ne l'active pas à l'aveugle.
                         Une description qui décrit l'ancienne version ment par
                         omission — surtout sur un interrupteur qui ouvre un
                         microphone. -->
                    <!-- ⚠️ « vous répond à voix haute » N'EST PAS TOUJOURS VRAI.
                         Maya ne parle qu'avec une voix française EMBARQUÉE — jamais
                         avec une voix servie à distance, qui enverrait ses réponses
                         chez l'éditeur du navigateur. Sur un appareil qui n'en a
                         aucune, elle écoute et répond PAR ÉCRIT. Promettre la parole
                         là où elle ne viendra pas, sur un interrupteur qui ouvre un
                         microphone, c'est le pire endroit pour mentir. -->
                    <span class="mps-watch-desc">
                      Dites « Salut Maya » : elle s'ouvre, vous écoute, part dès que vous marquez
                      une pause<template v-if="voixSupporte"
                        >, et vous répond à voix haute</template
                      >
                      — vous n'avez rien à toucher.
                      <template v-if="!voixSupporte"
                        >Votre appareil n'a pas de voix française installée : sa réponse
                        s'écrira.</template
                      >
                      Fonctionne quand l'app est ouverte à l'écran, jamais en arrière-plan ni
                      téléphone verrouillé.
                    </span>
                  </span>
                  <UiToggle
                    :model-value="maya.reveilVocal"
                    label="Réveil vocal « Salut Maya »"
                    @update:model-value="maya.setReveilVocal(!maya.reveilVocal)"
                  />
                </label>
              </template>
            </div>

            <p class="mps-foot">
              <UIcon name="i-lucide-shield-check" class="mps-shield h-[15px] w-[15px]" />
              Maya suit des règles apicoles éprouvées et te propose — tu gardes la main sur chaque
              action.
            </p>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import type { MayaPresence, MayaSurveillance } from '~/stores/maya';
import { speechSupporte } from '~/utils/webSpeech';

defineProps<{ open: boolean }>();
const emit = defineEmits<{ 'update:open': [value: boolean] }>();

const maya = useMayaStore();

// Réveil vocal proposé seulement si le navigateur sait reconnaître la parole
// (résolu au montage, côté client, pour éviter tout écart d'hydratation).
const reveilSupporte = ref(false);
onMounted(() => {
  reveilSupporte.value = speechSupporte();
});

/**
 * ⚠️ DEUX CAPACITÉS DISTINCTES, ET L'ÉCRAN N'EN CONNAISSAIT QU'UNE.
 * `speechSupporte()` répond de la RECONNAISSANCE ; la description, elle,
 * promettait aussi la SYNTHÈSE — « et vous répond à voix haute ». Les deux ne
 * vont pas ensemble : Chrome reconnaît partout, mais ne parle en français que
 * si le système porte une voix embarquée. On lit donc la vraie source, celle
 * qui décide si Maya parlera : `useVoixMaya`.
 */
const { supporte: voixSupporte } = useVoixMaya();

function close(): void {
  emit('update:open', false);
}

const OPTIONS: { value: MayaPresence; label: string; desc: string; icon: string }[] = [
  {
    value: 'partout',
    label: 'Présente partout',
    desc: 'Maya glisse des propositions là où c’est utile — tableau de bord, ruches, agenda, alertes, stocks, météo. Le maximum d’accompagnement.',
    icon: 'i-lucide-layout-grid',
  },
  {
    value: 'discrete',
    label: 'Bulle discrète',
    desc: 'Maya reste dans sa bulle en bas à droite. Elle attend que tu l’appelles — toujours là, jamais envahissante.',
    icon: 'i-lucide-message-circle',
  },
  {
    value: 'pause',
    label: 'En pause',
    desc: 'Maya se fait silencieuse. Aucune proposition (sauf alertes critiques si activées).',
    icon: 'i-lucide-moon',
  },
];

const WATCH: { key: keyof MayaSurveillance; label: string; desc: string; icon: string }[] = [
  {
    key: 'alertes',
    label: 'Alertes critiques',
    desc: 'Essaimage, gel, sanitaire — Maya te prévient même en pause.',
    icon: 'i-lucide-alert-triangle',
  },
  {
    key: 'briefing',
    label: 'Briefing du matin',
    desc: 'Un point chaque matin : priorités, météo, ruches à voir.',
    icon: 'i-lucide-sun',
  },
  {
    key: 'dictee',
    label: 'Dictée vocale',
    desc: 'Noter une visite à la voix ; Maya remplit la fiche.',
    icon: 'i-lucide-mic',
  },
];
</script>

<style scoped>
.mps-overlay {
  position: fixed;
  inset: 0;
  z-index: var(--z-modal, 61);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  background: rgba(28, 22, 16, 0.42);
  backdrop-filter: blur(3px);
}
.mps-card {
  width: 100%;
  max-width: 540px;
  max-height: calc(100dvh - 40px);
  overflow: auto;
  background: linear-gradient(180deg, #fdf8ef, #fbf3e4);
  border: 1px solid rgba(180, 140, 80, 0.2);
  border-radius: 22px;
  box-shadow: 0 30px 80px rgba(40, 30, 20, 0.34);
}
.mps-head {
  position: relative;
  overflow: hidden;
  padding: 20px 22px;
  background: linear-gradient(135deg, #2c2218, #1a1a1c);
}
.mps-head-glow {
  position: absolute;
  inset: 0;
  background: radial-gradient(120% 100% at 12% -10%, rgba(245, 166, 35, 0.4), transparent 56%);
}
.mps-head-orb {
  position: absolute;
  width: 150px;
  height: 150px;
  border-radius: 50%;
  left: -20px;
  top: -64px;
  background: radial-gradient(circle, rgba(245, 166, 35, 0.5), transparent 70%);
  filter: blur(7px);
  animation: maya-float 6.5s ease-in-out infinite;
}
.mps-head-row {
  position: relative;
  display: flex;
  align-items: center;
  gap: 13px;
}
.mps-title-row {
  display: flex;
  align-items: center;
  gap: 9px;
}
.mps-title {
  font-family: var(--font-display);
  font-weight: 600;
  font-size: 18px;
  color: #fff;
}
.mps-chip {
  font-size: 9.5px;
  font-weight: 700;
  letter-spacing: 0.06em;
  color: #f0b454;
  text-transform: uppercase;
  border: 1px solid rgba(240, 180, 84, 0.4);
  padding: 2px 7px;
  border-radius: 99px;
}
.mps-sub {
  font-size: 12.5px;
  color: rgba(255, 255, 255, 0.6);
  margin-top: 2px;
}
.mps-close {
  width: 32px;
  height: 32px;
  flex-shrink: 0;
  border-radius: 9px;
  border: none;
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
  display: grid;
  place-items: center;
  cursor: pointer;
  transition: background 0.15s ease;
}
.mps-close:hover {
  background: rgba(255, 255, 255, 0.2);
}
.mps-body {
  padding: 20px 22px 22px;
}
.mps-label {
  font-size: 11px;
  font-weight: 700;
  color: var(--honey-deep);
  text-transform: uppercase;
  letter-spacing: 0.1em;
  margin-bottom: 12px;
}
.mps-label.mt {
  margin-top: 22px;
}
.mps-modes {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.mps-mode {
  display: flex;
  gap: 13px;
  align-items: flex-start;
  text-align: left;
  padding: 14px 16px;
  border-radius: 14px;
  cursor: pointer;
  background: rgba(255, 255, 255, 0.55);
  border: 1.5px solid var(--border-default);
  transition: all 0.15s;
}
.mps-mode.is-active {
  background: #fff;
  border-color: var(--honey);
  box-shadow: 0 4px 16px rgba(230, 152, 44, 0.14);
}
.mps-mode-ic {
  width: 38px;
  height: 38px;
  border-radius: 11px;
  flex-shrink: 0;
  display: grid;
  place-items: center;
  background: var(--surface-muted);
  color: var(--text-tertiary);
}
.mps-mode-ic.is-active {
  background: var(--honey-soft);
  color: var(--honey-deep);
}
.mps-mode-title-row {
  display: flex;
  align-items: center;
  gap: 8px;
}
.mps-mode-name {
  font-family: var(--font-display);
  font-weight: 600;
  font-size: 14.5px;
  color: var(--text-primary);
}
.mps-check {
  color: var(--honey-deep);
  margin-left: auto;
}
.mps-mode-desc {
  display: block;
  font-size: 12.5px;
  color: var(--text-secondary);
  margin-top: 4px;
  line-height: 1.5;
}
.mps-watch {
  background: rgba(255, 255, 255, 0.6);
  border: 1px solid var(--border-default);
  border-radius: 14px;
  overflow: hidden;
}
.mps-watch-row {
  display: flex;
  align-items: center;
  gap: 13px;
  padding: 13px 16px;
  cursor: pointer;
}
.mps-watch-row + .mps-watch-row {
  border-top: 1px solid var(--border-faint);
}
.mps-watch-ic {
  width: 34px;
  height: 34px;
  border-radius: 10px;
  flex-shrink: 0;
  display: grid;
  place-items: center;
  background: var(--surface-muted);
  color: var(--text-secondary);
}
.mps-watch-name {
  display: block;
  font-size: 13.5px;
  font-weight: 600;
  color: var(--text-primary);
}
.mps-watch-desc {
  display: block;
  font-size: 12px;
  color: var(--text-tertiary);
  margin-top: 2px;
  line-height: 1.45;
}
.mps-foot {
  display: flex;
  align-items: center;
  gap: 9px;
  margin-top: 18px;
  font-size: 12px;
  color: var(--text-tertiary);
  line-height: 1.5;
}
.mps-shield {
  color: var(--sage);
  flex-shrink: 0;
}
.mps-fade-enter-active,
.mps-fade-leave-active {
  transition: opacity 0.2s ease;
}
.mps-fade-enter-from,
.mps-fade-leave-to {
  opacity: 0;
}
@media (prefers-reduced-motion: reduce) {
  .mps-fade-enter-active,
  .mps-fade-leave-active,
  .mps-head-orb {
    transition: none;
    animation: none;
  }
}
</style>
