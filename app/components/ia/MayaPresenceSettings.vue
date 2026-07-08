<!--
  MayaPresenceSettings — réglages de présence de Maya (§7bis handoff).
  Ouvert depuis l'entrée sidebar « Maya · Assistant » (et l'icône réglages de la bulle).
  Choix Partout / Discrète / En pause + ce que Maya surveille. Câblé sur le store.
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
        <div class="mps-card">
          <header class="mps-head">
            <IaMayaMark :size="28" glow state="idle" />
            <div class="min-w-0 flex-1">
              <p class="mps-title">Maya · Assistant</p>
              <p class="mps-sub">Choisis à quel point Maya est présente.</p>
            </div>
            <button type="button" class="mps-close" aria-label="Fermer" @click="close">
              <UIcon name="i-lucide-x" class="h-4.5 w-4.5" />
            </button>
          </header>

          <div class="mps-body">
            <button
              v-for="opt in OPTIONS"
              :key="opt.value"
              type="button"
              class="mps-opt"
              :class="{ 'is-active': maya.presence === opt.value }"
              @click="maya.setPresence(opt.value)"
            >
              <span class="mps-opt-ic" :style="{ background: opt.tint }">
                <UIcon :name="opt.icon" class="h-[18px] w-[18px]" :style="{ color: opt.color }" />
              </span>
              <span class="min-w-0 flex-1 text-left">
                <span class="mps-opt-label">{{ opt.label }}</span>
                <span class="mps-opt-desc">{{ opt.desc }}</span>
              </span>
              <UIcon
                v-if="maya.presence === opt.value"
                name="i-lucide-check-circle-2"
                class="h-5 w-5 shrink-0"
                style="color: var(--honey-deep)"
              />
            </button>

            <div v-if="maya.presence !== 'pause'" class="mps-watch">
              <p class="mps-watch-title">Ce que Maya surveille</p>
              <label v-for="w in WATCH" :key="w.key" class="mps-watch-row">
                <span class="min-w-0">
                  <span class="mps-watch-label">{{ w.label }}</span>
                  <span class="mps-watch-desc">{{ w.desc }}</span>
                </span>
                <UiToggle
                  :model-value="maya.surveillance[w.key]"
                  @update:model-value="maya.toggleSurveillance(w.key)"
                />
              </label>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import type { MayaPresence, MayaSurveillance } from '~/stores/maya';

defineProps<{ open: boolean }>();
const emit = defineEmits<{ 'update:open': [value: boolean] }>();

const maya = useMayaStore();

function close(): void {
  emit('update:open', false);
}

const OPTIONS: {
  value: MayaPresence;
  label: string;
  desc: string;
  icon: string;
  tint: string;
  color: string;
}[] = [
  {
    value: 'partout',
    label: 'Partout',
    desc: 'Proactive : briefing du jour, cartes d’aide, alertes.',
    icon: 'i-lucide-sparkles',
    tint: 'var(--honey-soft)',
    color: 'var(--honey-deep)',
  },
  {
    value: 'discrete',
    label: 'Discrète',
    desc: 'Sur demande : juste une bulle en bas à droite, rien d’imposé.',
    icon: 'i-lucide-message-circle',
    tint: 'var(--surface-muted)',
    color: 'var(--text-secondary)',
  },
  {
    value: 'pause',
    label: 'En pause',
    desc: 'Retrait total. Maya n’apparaît nulle part.',
    icon: 'i-lucide-moon',
    tint: 'var(--surface-muted)',
    color: 'var(--text-tertiary)',
  },
];

const WATCH: { key: keyof MayaSurveillance; label: string; desc: string }[] = [
  { key: 'alertes', label: 'Alertes', desc: 'Santé, stock, factures en retard.' },
  { key: 'briefing', label: 'Briefing du jour', desc: 'Les priorités chaque matin.' },
  { key: 'dictee', label: 'Dictée terrain', desc: 'Saisie vocale des interventions.' },
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
  padding: 16px;
  background: rgba(28, 28, 30, 0.4);
}
.mps-card {
  width: 100%;
  max-width: 440px;
  background: var(--surface-primary, #faf8f4);
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 20px 60px rgba(28, 28, 30, 0.3);
}
.mps-head {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 18px 20px;
  background: #fff;
  border-bottom: 1px solid var(--border-faint);
}
.mps-title {
  font-size: 15px;
  font-weight: 700;
  color: var(--text-primary);
}
.mps-sub {
  font-size: 12.5px;
  color: var(--text-tertiary);
}
.mps-close {
  display: flex;
  height: 32px;
  width: 32px;
  align-items: center;
  justify-content: center;
  border-radius: 9px;
  color: var(--text-tertiary);
}
.mps-close:hover {
  background: var(--surface-muted);
}
.mps-body {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 16px 20px 20px;
}
.mps-opt {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  border-radius: 14px;
  border: 1.5px solid var(--border-default);
  background: #fff;
  transition: all 0.15s ease;
}
.mps-opt:hover {
  border-color: var(--border-strong, var(--text-quaternary));
}
.mps-opt.is-active {
  border-color: var(--honey);
  background: var(--honey-soft);
}
.mps-opt-ic {
  display: flex;
  height: 38px;
  width: 38px;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  border-radius: 11px;
}
.mps-opt-label {
  display: block;
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
}
.mps-opt-desc {
  display: block;
  font-size: 12px;
  color: var(--text-tertiary);
  line-height: 1.4;
}
.mps-watch {
  margin-top: 6px;
  padding: 14px;
  border-radius: 14px;
  background: var(--surface-muted);
}
.mps-watch-title {
  font-size: 10.5px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--honey-deep);
  margin-bottom: 10px;
}
.mps-watch-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 8px 0;
  cursor: pointer;
}
.mps-watch-label {
  display: block;
  font-size: 13.5px;
  font-weight: 500;
  color: var(--text-primary);
}
.mps-watch-desc {
  display: block;
  font-size: 11.5px;
  color: var(--text-tertiary);
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
  .mps-fade-leave-active {
    transition: none;
  }
}
</style>
