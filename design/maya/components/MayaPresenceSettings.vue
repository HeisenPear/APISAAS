<!--
  MayaPresenceSettings — la modale de réglages de Maya (présence + surveillance).
  C'est ICI que l'utilisateur choisit comment Maya l'accompagne. Ouverte depuis :
    - l'entrée sidebar « Maya · Assistant »
    - l'icône réglages de la bulle (MayaBubble.vue → @open-settings)

  Cible : app/components/ia/MayaPresenceSettings.vue
  Dépend de : <IaMayaMark/>, maya.css, le store de présence (useMayaStore / useMayaPresence).
  Réf. maquette : MayaSettings dans design/maya/mockup/proto/MayaBubbleProto.jsx.

  Branche v-model / store : ici en props+emits pour rester découplé ; remplace par
  des accès directs au store Pinia si tu préfères.
-->
<template>
  <div class="maya-settings-scrim" @click="$emit('close')">
    <div class="maya-settings maya-msg-in" @click.stop>
      <!-- en-tête vivant, cohérent avec la bulle -->
      <div class="mset-head">
        <div class="mset-glow" />
        <div class="mset-orb" />
        <div class="mset-head-row">
          <IaMayaMark :size="40" :glow="presence !== 'pause'" :state="presence === 'pause' ? 'static' : 'idle'" />
          <div class="mset-head-txt">
            <div class="mset-title-row">
              <span class="mset-title">Maya</span>
              <span class="mset-chip">Assistant</span>
            </div>
            <div class="mset-sub">Règle sa présence et ce qu’elle surveille pour toi.</div>
          </div>
          <button class="mset-close" @click="$emit('close')"><UIcon name="i-lucide-x" class="h-[17px] w-[17px]" /></button>
        </div>
      </div>

      <div class="mset-body">
        <div class="mset-label">Présence</div>
        <div class="mset-modes">
          <button
            v-for="o in modes"
            :key="o.k"
            class="mset-mode"
            :class="{ 'is-sel': presence === o.k }"
            @click="$emit('update:presence', o.k)"
          >
            <div class="mset-mode-ico" :class="{ 'is-sel': presence === o.k }">
              <UIcon :name="o.icon" class="h-[19px] w-[19px]" />
            </div>
            <div class="mset-mode-txt">
              <div class="mset-mode-title-row">
                <span class="mset-mode-name">{{ o.name }}</span>
                <UIcon v-if="presence === o.k" name="i-lucide-check" class="mset-check h-4 w-4" />
              </div>
              <div class="mset-mode-desc">{{ o.desc }}</div>
            </div>
          </button>
        </div>

        <div class="mset-label mt">Ce que Maya surveille</div>
        <div class="mset-watch">
          <div v-for="w in watches" :key="w.key" class="mset-watch-row">
            <div class="mset-watch-ico"><UIcon :name="w.icon" class="h-[17px] w-[17px]" /></div>
            <div class="mset-watch-txt">
              <div class="mset-watch-name">{{ w.name }}</div>
              <div class="mset-watch-desc">{{ w.desc }}</div>
            </div>
            <UiToggle :model-value="w.value" @update:model-value="$emit('toggle', w.key)" />
          </div>
        </div>

        <div class="mset-foot">
          <UIcon name="i-lucide-shield-check" class="h-[15px] w-[15px] mset-shield" />
          Maya suit des règles apicoles éprouvées et te propose — tu gardes la main sur chaque action.
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  presence: 'partout' | 'discrete' | 'pause';
  critical: boolean;
  briefing: boolean;
  voice: boolean;
}>();
defineEmits<{
  close: [];
  'update:presence': [v: 'partout' | 'discrete' | 'pause'];
  toggle: [key: 'critical' | 'briefing' | 'voice'];
}>();

const modes = [
  { k: 'partout', icon: 'i-lucide-layout-grid', name: 'Présente partout',
    desc: 'Maya glisse des propositions sur tes pages (dashboard, ruches, météo). Le maximum d’accompagnement.' },
  { k: 'discrete', icon: 'i-lucide-message-circle', name: 'Bulle discrète',
    desc: 'Maya reste dans sa bulle en bas à droite. Elle attend que tu l’appelles — toujours là, jamais envahissante.' },
  { k: 'pause', icon: 'i-lucide-moon', name: 'En pause',
    desc: 'Maya se fait silencieuse. Aucune proposition (sauf alertes critiques si activées).' },
] as const;

const watches = computed(() => [
  { key: 'critical', icon: 'i-lucide-alert-triangle', name: 'Alertes critiques',
    desc: 'Essaimage, gel, sanitaire — Maya te prévient même en pause.', value: props.critical },
  { key: 'briefing', icon: 'i-lucide-sun', name: 'Briefing du matin',
    desc: 'Un point chaque matin : priorités, météo, ruches à voir.', value: props.briefing },
  { key: 'voice', icon: 'i-lucide-mic', name: 'Dictée vocale',
    desc: 'Noter une visite à la voix ; Maya remplit la fiche.', value: props.voice },
]);
</script>

<style scoped>
.maya-settings-scrim {
  position: absolute;
  inset: 0;
  z-index: 70;
  background: rgba(28, 22, 16, 0.4);
  backdrop-filter: blur(3px);
  display: grid;
  place-items: center;
  padding: 24px;
}
.maya-settings {
  width: 560px;
  max-height: 100%;
  overflow: auto;
  background: linear-gradient(180deg, #fdf8ef, #fbf3e4);
  border-radius: 22px;
  box-shadow: 0 30px 80px rgba(40, 30, 20, 0.34);
  border: 1px solid rgba(180, 140, 80, 0.2);
}
.mset-head {
  position: relative;
  overflow: hidden;
  padding: 20px 22px;
  background: linear-gradient(135deg, #2c2218, #1a1a1c);
}
.mset-glow {
  position: absolute;
  inset: 0;
  background: radial-gradient(120% 100% at 12% -10%, rgba(245, 166, 35, 0.4), transparent 56%);
}
.mset-orb {
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
.mset-head-row {
  position: relative;
  display: flex;
  align-items: center;
  gap: 13px;
}
.mset-head-txt {
  flex: 1;
}
.mset-title-row {
  display: flex;
  align-items: center;
  gap: 9px;
}
.mset-title {
  font-family: var(--font-display);
  font-weight: 600;
  font-size: 18px;
  color: #fff;
}
.mset-chip {
  font-size: 9.5px;
  font-weight: 700;
  letter-spacing: 0.06em;
  color: #f0b454;
  text-transform: uppercase;
  border: 1px solid rgba(240, 180, 84, 0.4);
  padding: 2px 7px;
  border-radius: 99px;
}
.mset-sub {
  font-size: 12.5px;
  color: rgba(255, 255, 255, 0.6);
  margin-top: 2px;
}
.mset-close {
  width: 32px;
  height: 32px;
  border-radius: 9px;
  border: none;
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
  display: grid;
  place-items: center;
  cursor: pointer;
}
.mset-body {
  padding: 20px 22px 22px;
}
.mset-label {
  font-size: 11px;
  font-weight: 700;
  color: var(--honey-deep);
  text-transform: uppercase;
  letter-spacing: 0.1em;
  margin-bottom: 12px;
}
.mset-label.mt {
  margin-top: 22px;
}
.mset-modes {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.mset-mode {
  display: flex;
  gap: 13px;
  text-align: left;
  padding: 14px 16px;
  border-radius: 14px;
  cursor: pointer;
  background: rgba(255, 255, 255, 0.55);
  border: 1.5px solid var(--border-default);
  transition: all 0.15s;
}
.mset-mode.is-sel {
  background: #fff;
  border-color: var(--honey);
  box-shadow: 0 4px 16px rgba(230, 152, 44, 0.14);
}
.mset-mode-ico {
  width: 38px;
  height: 38px;
  border-radius: 11px;
  flex-shrink: 0;
  display: grid;
  place-items: center;
  background: var(--surface-muted);
  color: var(--text-tertiary);
}
.mset-mode-ico.is-sel {
  background: var(--honey-soft);
  color: var(--honey-deep);
}
.mset-mode-txt {
  flex: 1;
}
.mset-mode-title-row {
  display: flex;
  align-items: center;
  gap: 8px;
}
.mset-mode-name {
  font-family: var(--font-display);
  font-weight: 600;
  font-size: 14.5px;
  color: var(--text-primary);
}
.mset-check {
  color: var(--honey-deep);
  margin-left: auto;
}
.mset-mode-desc {
  font-size: 12.5px;
  color: var(--text-secondary);
  margin-top: 4px;
  line-height: 1.5;
}
.mset-watch {
  background: rgba(255, 255, 255, 0.6);
  border: 1px solid var(--border-default);
  border-radius: 14px;
  overflow: hidden;
}
.mset-watch-row {
  display: flex;
  align-items: center;
  gap: 13px;
  padding: 13px 16px;
}
.mset-watch-row + .mset-watch-row {
  border-top: 1px solid var(--border-faint);
}
.mset-watch-ico {
  width: 34px;
  height: 34px;
  border-radius: 10px;
  flex-shrink: 0;
  display: grid;
  place-items: center;
  background: var(--surface-muted);
  color: var(--text-secondary);
}
.mset-watch-txt {
  flex: 1;
}
.mset-watch-name {
  font-size: 13.5px;
  font-weight: 600;
  color: var(--text-primary);
}
.mset-watch-desc {
  font-size: 12px;
  color: var(--text-tertiary);
  margin-top: 2px;
  line-height: 1.45;
}
.mset-foot {
  display: flex;
  align-items: center;
  gap: 9px;
  margin-top: 18px;
  font-size: 12px;
  color: var(--text-tertiary);
  line-height: 1.5;
}
.mset-shield {
  color: var(--sage);
  flex-shrink: 0;
}
</style>
