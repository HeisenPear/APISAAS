<!--
  MayaChapitre — la coquille commune aux six chapitres de /maya.

  Elle porte le numéro, l'intitulé, le titre et le chapô ; le contenu propre à
  chaque chapitre passe par le slot. Sans elle, le même en-tête serait recopié
  six fois et aurait dérivé six fois.
-->
<template>
  <section :id="ancre" class="chapitre" :style="{ background: fond }">
    <div class="mx-auto max-w-5xl px-5 sm:px-6">
      <div v-reveal class="mb-5 flex items-center gap-3">
        <span class="text-[11px] font-semibold tabular-nums" :style="{ color: teinteFaible }">
          {{ numero }}
        </span>
        <span class="h-px w-7" :style="{ background: teinteTrait }" aria-hidden="true" />
        <span
          class="text-[11px] font-semibold uppercase tracking-[0.14em]"
          :style="{ color: teinteAccent }"
        >
          {{ intitule }}
        </span>
      </div>

      <h2 v-reveal="70" class="titre-chapitre" :style="{ color: teinteTitre }">
        <slot name="titre" />
      </h2>

      <p v-if="$slots.chapo" v-reveal="140" class="chapo-chapitre" :style="{ color: teinteTexte }">
        <slot name="chapo" />
      </p>

      <div v-reveal="200" class="mt-12">
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

<style scoped>
/* De l'air. Un chapitre qui commence trop près du précédent se lit comme sa
   suite ; ici chacun doit s'ouvrir comme une page qu'on tourne. */
.chapitre {
  padding: 88px 0;
}
@media (min-width: 768px) {
  .chapitre {
    padding: 136px 0;
  }
}

.titre-chapitre {
  max-width: 720px;
  font-size: clamp(27px, 4.4vw, 44px);
  font-weight: 700;
  line-height: 1.08;
  letter-spacing: -0.032em;
}

.chapo-chapitre {
  margin-top: 22px;
  max-width: 620px;
  font-size: clamp(15px, 1.5vw, 17px);
  line-height: 1.65;
}
</style>
