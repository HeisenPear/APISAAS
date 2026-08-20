<!--
  MayaChapitre — la coquille commune aux six chapitres de /maya.

  Elle porte le numéro, l'intitulé, le titre et le chapô ; le contenu propre à
  chaque chapitre passe par le slot. Sans elle, le même en-tête serait recopié
  six fois et aurait dérivé six fois.
-->
<template>
  <section :id="ancre" class="py-16 sm:py-24 md:py-28" :style="{ background: fond }">
    <div class="mx-auto max-w-5xl px-4 sm:px-6">
      <div class="mb-3 flex items-center gap-3">
        <span class="text-[11px] font-semibold tabular-nums" :style="{ color: teinteFaible }">
          {{ numero }}
        </span>
        <span class="h-px w-6" :style="{ background: teinteTrait }" aria-hidden="true" />
        <span
          class="text-[11px] font-semibold uppercase tracking-[0.12em]"
          :style="{ color: teinteAccent }"
        >
          {{ intitule }}
        </span>
      </div>

      <h2
        class="max-w-3xl text-[27px] font-bold leading-tight tracking-[-0.025em] sm:text-[34px] md:text-[40px]"
        :style="{ color: teinteTitre }"
      >
        <slot name="titre" />
      </h2>

      <p
        v-if="$slots.chapo"
        class="mt-5 max-w-2xl text-[15px] leading-relaxed sm:text-[16.5px]"
        :style="{ color: teinteTexte }"
      >
        <slot name="chapo" />
      </p>

      <div class="mt-10">
        <slot />
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
/**
 * `sombre` inverse la palette pour les chapitres qui doivent trancher (la veille
 * de nuit, le moteur). Les teintes sont calculées ici plutôt que par des classes
 * conditionnelles disséminées dans chaque chapitre.
 */
const props = withDefaults(
  defineProps<{
    numero: string;
    intitule: string;
    ancre: string;
    sombre?: boolean;
  }>(),
  { sombre: false },
);

const fond = computed(() => (props.sombre ? '#1a1a1c' : 'var(--surface-primary)'));
const teinteTitre = computed(() => (props.sombre ? '#ffffff' : 'var(--text-primary)'));
const teinteTexte = computed(() =>
  props.sombre ? 'rgba(255,255,255,0.66)' : 'var(--text-secondary)',
);
const teinteFaible = computed(() =>
  props.sombre ? 'rgba(255,255,255,0.38)' : 'var(--text-tertiary)',
);
const teinteTrait = computed(() =>
  props.sombre ? 'rgba(255,255,255,0.22)' : 'var(--border-default)',
);
const teinteAccent = computed(() => (props.sombre ? '#f0b454' : 'var(--honey-deep)'));
</script>
