<template>
  <div class="cine-prop">
    <div class="cine-prop-head">
      <IaMayaMark :size="28" :state="etat" />
      <div>
        <span class="cine-prop-tag">Un exemple</span>
        <p class="cine-prop-text">
          La ruche 7 n’a pas été visitée depuis 19 jours et la météo s’ouvre demain matin. Je te la
          mets en tête de tournée.
        </p>
      </div>
    </div>

    <div class="cine-prop-actions">
      <span v-if="temps === 'fait'" class="cine-prop-yes is-fait">
        <UIcon name="i-lucide-check" />
        Planifié
      </span>
      <span v-else class="cine-prop-yes">
        <span v-if="temps === 'reflechit'" class="cine-busy"><span /><span /><span /></span>
        <template v-else>Je planifie…</template>
      </span>
      <span v-if="temps !== 'fait'" class="cine-prop-no">Annuler</span>
    </div>

    <div v-if="temps === 'fait'" class="cine-plan">
      <div class="cine-plan-head">
        <div class="cine-plan-check"><UIcon name="i-lucide-check" /></div>
        <div>
          <p class="cine-plan-title">C’est fait — je m’en suis occupée</p>
          <p class="cine-plan-sub">Voilà ce que j’ai préparé pour toi.</p>
        </div>
      </div>
      <div v-for="l in PLAN" :key="l.quoi" class="cine-plan-row">
        <div class="cine-plan-ico"><UIcon :name="l.icone" /></div>
        <div style="flex: 1">{{ l.quoi }}</div>
        <b>{{ l.valeur }}</b>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * Scène « propose » — LA démonstration de la promesse, et le sommet du récit.
 *
 * Elle se joue en trois temps, sans le moindre clic : Maya repère, elle
 * réfléchit, puis elle agit et montre ce qu'elle a fait. C'est tout l'argument
 * du produit — « automatisme VISIBLE et corrigeable » — donné à voir plutôt
 * qu'écrit. Une carte figée ne raconte rien ; c'est ce qu'elle était avant.
 *
 * Le tempo (1,5 s puis 2,7 s) est reporté de `cinematic.jsx`. La scène dure
 * 7,4 s dans la narration : les trois temps ont le temps de se poser, et le
 * résultat reste affiché assez longtemps pour être lu.
 *
 * HONNÊTETÉ : l'étiquette dit « Un exemple ». Le compte est vide à cet instant
 * — laisser croire que Maya a déjà inspecté un vrai rucher serait un mensonge
 * d'interface, même joli.
 */
const PLAN = [
  { icone: 'i-lucide-calendar', quoi: 'Visite de contrôle', valeur: 'Demain · 7h00' },
  { icone: 'i-lucide-map-pin', quoi: 'Rucher du verger', valeur: 'Ruche 7' },
  { icone: 'i-lucide-sun', quoi: 'Fenêtre météo', valeur: '19 °C · vent faible' },
];

type Temps = 'propose' | 'reflechit' | 'fait';
const temps = ref<Temps>('propose');

/** L'état du rayon suit le récit : il alerte, il réfléchit, il a fini. */
const etat = computed(() =>
  temps.value === 'reflechit' ? 'think' : temps.value === 'fait' ? 'success' : 'alert',
);

const minuteries: Array<ReturnType<typeof setTimeout>> = [];

onMounted(() => {
  // Mouvement réduit : on montre directement le résultat. Une démonstration
  // qui se déroule toute seule n'a aucun sens pour qui a désactivé les
  // animations — et la scène défilerait avant qu'il ait lu quoi que ce soit.
  if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
    temps.value = 'fait';
    return;
  }
  minuteries.push(setTimeout(() => (temps.value = 'reflechit'), 1500));
  minuteries.push(setTimeout(() => (temps.value = 'fait'), 2700));
});

onBeforeUnmount(() => minuteries.forEach(clearTimeout));
</script>
