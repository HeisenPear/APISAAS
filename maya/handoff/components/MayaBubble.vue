<!--
  MayaBubble — la BULLE COMPAGNON discrète (mode "Discrète" de la présence).
  Un bouton noir en bas à droite qui SE DÉPLIE en fenêtre de conversation (vrai morph :
  le bouton EST l'en-tête sombre, la fenêtre grandit depuis lui). Style "chatbot" chaleureux.

  Cible : app/components/ia/MayaBubble.vue → monté une fois dans le layout par défaut
  (app/layouts/default.vue), affiché seulement quand la présence = 'discrete'.

  Dépend de :
    - <IaMayaMark/>            (design/maya/components/MayaMark.vue)
    - maya.css                 (keyframes .maya-launch, maya-float, maya-msg-in, maya-glow-pulse)
    - un store de présence     (voir §Présence du handoff ; ex. useMayaStore / Pinia)
    - le composable métier      (ex. useCopilote existant sur v2) pour les vraies réponses

  ⚠️ DÉTERMINISTE : les réponses viennent de règles/données, pas d'un LLM. La saisie libre
  existe mais les réponses proposent surtout des ACTIONS au tap (chips/boutons).
  Contenu riche exact (stats, mini-courbe, tableau ruches, cartes d'action, ton des copies) :
  voir la maquette design/maya/mockup/proto/MayaBubbleProto.jsx — reporte les valeurs.

  États du logo à câbler sur le vrai statut :
    fermé + alerte → 'alert' | ouvert au repos → 'idle' | pendant une réponse → 'think'
    capture vocale → 'listen' | après une action réussie → 'success'

  Sous-composants à créer (petits, présentiels — voir StatChips / MiniList dans le proto) :
    - <MayaStatChips :items="[[valeur, label, tint], …]" />  (chips de stats colorées)
    - <MayaHiveList :rows="[[id, lieu, sev], …]" />          (mini-tableau de ruches)
    <UiSparkline/> est fourni (design/maya/components/Sparkline.vue).
-->
<template>
  <!-- rien si Maya est "partout" (cartes inline) ou "en pause" -->
  <div v-if="presence === 'discrete'" class="maya-bubble-root">
    <!-- infobulle de sollicitation quand fermé + proposition en attente -->
    <div v-if="!open && hasAlert" class="maya-bubble-tip maya-msg-in">
      Une proposition pour toi 🐝
    </div>

    <!-- LA COQUILLE : bouton (fermé) ⇆ fenêtre (ouvert), un seul élément qui se morphe -->
    <div
      :class="['maya-shell', { 'is-open': open }, !open ? 'maya-launch' : null]"
      :style="shellStyle"
      @click="!open && openBubble()"
    >
      <!-- en-tête = le bouton : noir plein fermé, dégradé chaud + lueur une fois déplié -->
      <div class="maya-head" :class="{ 'is-open': open }">
        <div class="maya-head-glow" :style="{ opacity: open ? 1 : 0 }" />
        <div class="maya-head-orb" :style="{ opacity: open ? 1 : 0 }" />

        <!-- logo : reste dans l'en-tête, monte avec le dépliage -->
        <div class="maya-head-mark" :style="{ top: open ? '14px' : '12px', left: open ? '16px' : '12px' }">
          <IaMayaMark :size="34" :glow="open" :state="open ? headState : (hasAlert ? 'alert' : 'idle')" />
        </div>
        <span v-if="!open && hasAlert" class="maya-badge">1</span>

        <!-- titre + actions : apparaissent une fois déplié -->
        <div class="maya-head-body" :style="{ opacity: open ? 1 : 0 }">
          <div class="maya-head-title">
            <div class="maya-name">Maya</div>
            <div class="maya-status">
              <span class="maya-dot" :style="{ background: thinking ? '#f5a623' : '#9fd0a0' }" />
              {{ thinking ? 'réfléchit…' : justDid ? "c'est fait ✓" : 'Prête à aider' }}
            </div>
          </div>
          <button class="maya-head-btn" title="Réglages de Maya" @click.stop="$emit('open-settings')">
            <UIcon name="i-lucide-settings-2" class="h-4 w-4" />
          </button>
          <button class="maya-head-btn" @click.stop="open = false">
            <UIcon name="i-lucide-chevron-down" class="h-[18px] w-[18px]" />
          </button>
        </div>
      </div>

      <!-- corps : fil de conversation (visible seulement ouvert) -->
      <div ref="scroll" class="maya-body" :style="{ opacity: open ? 1 : 0 }">
        <template v-for="(m, i) in messages" :key="i">
          <!-- message utilisateur (bulle honey) -->
          <div v-if="m.role === 'user'" class="maya-msg-in maya-row-user">
            <div class="maya-user-bubble">{{ m.text }}</div>
          </div>

          <!-- message Maya (carte blanche sur le crème) -->
          <div v-else class="maya-msg-in maya-row-maya">
            <div class="maya-msg-head">
              <IaMayaMark :size="20" :state="m.alert ? 'alert' : m.success ? 'success' : 'static'" />
              <span>Maya</span>
            </div>
            <div class="maya-card" :class="{ 'is-alert': m.alert, 'is-success': m.success }">
              <div v-if="m.alert" class="maya-prio">
                <UIcon name="i-lucide-alert-triangle" class="h-3.5 w-3.5" /> Priorité
              </div>
              <p class="maya-text">{{ m.text }}</p>

              <!-- blocs riches : reporte le rendu exact depuis la maquette -->
              <MayaStatChips v-if="m.stats" :items="m.stats" />
              <UiSparkline v-if="m.spark" :data="m.spark" class="mt-3" />
              <MayaHiveList v-if="m.list" :rows="m.list" />
            </div>
            <!-- propositions d'action au tap (déterministe) -->
            <div v-if="m.proposals && i === lastMaya" class="maya-proposals">
              <button
                v-for="(p, pi) in m.proposals"
                :key="pi"
                class="maya-prop"
                :class="{ 'is-primary': p.primary }"
                @click="pick(p)"
              >
                <UIcon v-if="p.icon" :name="p.icon" class="h-4 w-4" />
                {{ p.label }}
              </button>
            </div>
          </div>
        </template>

        <div v-if="thinking" class="maya-row-maya maya-typing">
          <span /><span /><span /> Maya prépare des pistes…
        </div>
      </div>

      <!-- pied : saisie (déterministe : surtout pour préciser, l'action reste au tap) -->
      <div class="maya-foot" :style="{ opacity: open ? 1 : 0 }">
        <div class="maya-input-row">
          <input
            v-model="draft"
            placeholder="Écrire à Maya…"
            @keydown.enter="send"
            @click.stop
          />
          <button class="maya-ico-btn" @click.stop><UIcon name="i-lucide-mic" class="h-4 w-4" /></button>
          <button class="maya-send" @click.stop="send"><UIcon name="i-lucide-arrow-up" class="h-[17px] w-[17px]" /></button>
        </div>
        <div class="maya-disclaimer">Maya suit des règles apicoles éprouvées · tu gardes la main sur tout</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * Props / events — branche `presence` sur ton store (useMayaStore).
 * Émet `open-settings` pour ouvrir l'écran de réglages (MayaPresenceSettings.vue).
 */
withDefaults(defineProps<{ presence?: 'partout' | 'discrete' | 'pause' }>(), {
  presence: 'discrete',
});
defineEmits<{ 'open-settings': [] }>();

type Msg = {
  role: 'user' | 'maya';
  text: string;
  alert?: boolean;
  success?: boolean;
  stats?: [string, string, string][];
  spark?: number[];
  list?: [string, string, string][];
  proposals?: { label: string; icon?: string; primary?: boolean; to?: string }[];
};

const open = ref(false);
const thinking = ref(false);
const justDid = ref(false);
const draft = ref('');
const scroll = ref<HTMLElement | null>(null);

// TODO: remplace ce mock par le vrai composable déterministe (ex. useCopilote()).
const messages = ref<Msg[]>([
  { role: 'maya', text: 'Salut Marc 👋 Je veille sur tes 248 ruches. On regarde quoi ?' },
]);

// hasAlert : vient d'une vraie règle (essaimage, gel, retard). Mock ici.
const hasAlert = ref(true);
const headState = computed(() => (thinking.value ? 'think' : justDid.value ? 'success' : 'idle'));
const lastMaya = computed(() => {
  for (let i = messages.value.length - 1; i >= 0; i--) if (messages.value[i].role === 'maya') return i;
  return -1;
});

const shellStyle = computed(() => ({
  width: open.value ? '392px' : '58px',
  height: open.value ? '580px' : '58px',
  borderRadius: open.value ? '22px' : '18px',
  background: open.value ? 'linear-gradient(180deg,#fdf8ef,#fbf1de)' : '#111112',
  boxShadow: open.value
    ? '0 28px 70px rgba(40,30,20,0.32), 0 0 0 1px rgba(180,140,80,0.18)'
    : '0 12px 30px rgba(28,28,30,0.34)',
}));

async function scrollDown() {
  await nextTick();
  scroll.value?.scrollTo({ top: scroll.value.scrollHeight, behavior: 'smooth' });
}

function openBubble() {
  open.value = true;
  // à l'ouverture : si une alerte est en attente, Maya la présente d'abord (déterministe)
  if (hasAlert.value) {
    hasAlert.value = false;
    setTimeout(() => {
      messages.value.push({
        role: 'maya',
        alert: true,
        text: "Avant tout : risque d'essaimage au Ventoux Sud (4 cellules royales + chaleur). 3 ruches. Je propose d'agir vite — je m'en occupe ?",
        list: [['V-014', 'Ventoux Sud', 'bad'], ['V-018', 'Ventoux Sud', 'bad'], ['V-021', 'Ventoux Sud', 'warn']],
        proposals: [
          { label: 'Planifie une pose de hausse', icon: 'i-lucide-calendar', primary: true, to: 'plan' },
          { label: "Montre-moi d'abord", icon: 'i-lucide-eye', to: 'list' },
        ],
      });
      scrollDown();
    }, 640);
  }
}

// pick / send : câbler sur les actions réelles (créer intervention, naviguer, etc.)
function pick(p: { to?: string }) {
  thinking.value = true;
  setTimeout(() => {
    thinking.value = false;
    justDid.value = true;
    messages.value.push({
      role: 'maya',
      success: true,
      text: "C'est planifié pour demain 7h. Je t'ai préparé la fiche des 3 ruches. 🐝",
    });
    scrollDown();
    setTimeout(() => (justDid.value = false), 2400);
  }, 1100);
}

function send() {
  const t = draft.value.trim();
  if (!t) return;
  messages.value.push({ role: 'user', text: t });
  draft.value = '';
  thinking.value = true;
  scrollDown();
  setTimeout(() => {
    thinking.value = false;
    messages.value.push({ role: 'maya', text: 'Bien reçu — je regarde ça dans tes données.' });
    scrollDown();
  }, 1000);
}
</script>

<style scoped>
.maya-bubble-root {
  position: fixed;
  right: 24px;
  bottom: 24px;
  z-index: 60;
}
.maya-bubble-tip {
  position: absolute;
  right: 68px;
  bottom: 16px;
  white-space: nowrap;
  background: var(--surface-card);
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
  background: var(--status-bad);
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
  right: 12px;
  height: 62px;
  display: flex;
  align-items: center;
  gap: 8px;
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
}

.maya-body {
  position: absolute;
  top: 62px;
  left: 0;
  right: 0;
  bottom: 74px;
  overflow: auto;
  padding: 18px 16px 8px;
  transition: opacity 0.3s 0.22s;
}
.maya-row-user {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 16px;
}
.maya-user-bubble {
  max-width: 82%;
  background: linear-gradient(135deg, #f5a623, #e6982c);
  color: #fff;
  padding: 10px 14px;
  border-radius: 16px 16px 4px 16px;
  font-size: 13.5px;
  line-height: 1.5;
  box-shadow: 0 4px 12px rgba(230, 152, 44, 0.28);
}
.maya-row-maya {
  margin-bottom: 18px;
}
.maya-msg-head {
  display: flex;
  gap: 8px;
  align-items: center;
  margin-bottom: 7px;
  font-family: var(--font-display);
  font-weight: 600;
  font-size: 13px;
}
.maya-card {
  margin-left: 28px;
  background: #fff;
  border: 1px solid var(--border-faint);
  border-radius: 5px 15px 15px 15px;
  padding: 12px 14px;
  box-shadow: 0 3px 12px rgba(120, 100, 80, 0.07);
}
.maya-card.is-alert {
  border-color: rgba(181, 69, 69, 0.3);
}
.maya-card.is-success {
  animation: maya-glow-pulse 2.2s ease-out;
}
.maya-prio {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 10.5px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--status-bad);
  margin-bottom: 7px;
}
.maya-text {
  margin: 0;
  font-size: 13.5px;
  line-height: 1.55;
  color: var(--text-primary);
}
.maya-proposals {
  margin-left: 28px;
  margin-top: 10px;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.maya-prop {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  min-height: 38px;
  padding: 0 14px;
  border-radius: 10px;
  border: 1.5px solid var(--border-strong);
  background: var(--surface-card);
  font-size: 13px;
  font-weight: 600;
  color: var(--text-secondary);
  cursor: pointer;
}
.maya-prop.is-primary {
  background: #1c1c1e;
  color: #fff;
  border-color: #1c1c1e;
}
.maya-typing {
  margin-left: 28px;
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
  border: none;
  outline: none;
  background: transparent;
  font-size: 14px;
  color: var(--text-primary);
  font-family: inherit;
}
.maya-ico-btn {
  width: 32px;
  height: 32px;
  border-radius: 9px;
  border: none;
  background: var(--surface-muted);
  color: var(--text-secondary);
  display: grid;
  place-items: center;
  cursor: pointer;
}
.maya-send {
  width: 34px;
  height: 34px;
  border-radius: 9px;
  border: none;
  background: linear-gradient(135deg, #f5a623, #e6982c);
  color: #fff;
  display: grid;
  place-items: center;
  cursor: pointer;
}
.maya-disclaimer {
  text-align: center;
  font-size: 10.5px;
  color: var(--text-tertiary);
  margin-top: 7px;
}
</style>
