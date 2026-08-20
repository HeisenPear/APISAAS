<!--
  LandingMaya — la section « 01 · Maya » de la page d'accueil.

  Elle ne raconte PAS tout Maya : c'est une accroche qui mène à `/maya`, où les
  six chapitres tiennent le discours. La landing garde son rôle — présenter
  APIGO — et Maya y prend la place d'un cœur, pas d'un chapitre de plus.

  La mark est en mode `interactif` : les sept alvéoles réagissent à la distance
  du curseur. C'est le seul endroit du produit où le logo se laisse toucher,
  et c'est voulu : on présente un copilote, on donne envie de le solliciter.
-->
<template>
  <section id="maya" class="py-16 sm:py-24 md:py-32" style="background: var(--surface-muted)">
    <div class="mx-auto max-w-6xl px-4 sm:px-6">
      <div class="grid items-center gap-10 md:grid-cols-[1.15fr_1fr] md:gap-16">
        <!-- Colonne texte -->
        <div>
          <div class="mb-4 flex items-center gap-3">
            <span
              class="text-[11px] font-semibold tabular-nums"
              style="color: var(--text-tertiary)"
            >
              01
            </span>
            <span class="h-px w-6" style="background: var(--border-default)" aria-hidden="true" />
            <span
              class="text-[11px] font-semibold uppercase tracking-[0.12em]"
              style="color: var(--honey-deep)"
            >
              Maya
            </span>
            <span
              class="rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider"
              style="background: var(--honey-soft); color: var(--honey-deep)"
            >
              Nouveau
            </span>
          </div>

          <h2
            class="text-[30px] font-bold leading-tight tracking-[-0.025em] sm:text-[38px] md:text-[44px]"
            style="color: var(--text-primary)"
          >
            Le nouveau cœur d’APIGO<br class="hidden sm:block" />
            s’appelle Maya.
          </h2>

          <p
            class="mt-5 max-w-xl text-[15px] leading-relaxed sm:text-[17px]"
            style="color: var(--text-secondary)"
          >
            Elle ne range pas vos données, elle les lit. Toute la nuit, elle repère ce qui menace
            une colonie — et au réveil, elle vous dit par où commencer.
          </p>

          <!-- Trois preuves courtes, chacune vérifiable sur la page dédiée. -->
          <ul class="mt-7 space-y-3">
            <li v-for="p in preuves" :key="p" class="flex items-start gap-2.5">
              <UIcon
                name="i-lucide-check"
                class="mt-0.5 h-4 w-4 shrink-0"
                style="color: var(--honey-deep)"
                aria-hidden="true"
              />
              <span class="text-[14px] leading-relaxed" style="color: var(--text-secondary)">
                {{ p }}
              </span>
            </li>
          </ul>

          <div class="mt-8 flex flex-wrap items-center gap-3">
            <UButton to="/maya" size="lg" color="primary" trailing-icon="i-lucide-arrow-right">
              Découvrir Maya
            </UButton>
            <p class="text-[12.5px]" style="color: var(--text-tertiary)">
              Ce qu’elle surveille, ce qu’elle propose, ce qu’elle ne fera jamais.
            </p>
          </div>
        </div>

        <!-- Colonne mark -->
        <div class="flex flex-col items-center gap-4">
          <div class="maya-scene">
            <IaMayaMark :size="220" glow interactif state="idle" />
          </div>
          <p class="text-center text-[12px]" style="color: var(--text-tertiary)" aria-hidden="true">
            Passez la souris sur les alvéoles
          </p>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
/**
 * Trois promesses, et pas une de plus que ce que le produit tient. Chacune est
 * développée — avec ses limites — dans un chapitre de `/maya` :
 *   veille  → heures calmes 21 h–8 h, anti-rafale, résumé (server/utils/alertesPush.ts)
 *   règles  → seuils ITSAP, aucun appel LLM  (server/utils/santeScore.ts)
 *   accord  → rien ne s'écrit sans confirmation (server/api/ia/copilote.post.ts)
 */
const preuves = [
  'Elle veille la nuit et ne vous réveille que pour ce qui compte.',
  'Elle suit des règles apicoles nommées — jamais une intuition.',
  'Elle prépare, vous confirmez. Rien ne s’écrit sans votre geste.',
];
</script>

<style scoped>
/* Un halo posé derrière la mark, qui ne bouge pas : le mouvement, c'est elle. */
.maya-scene {
  position: relative;
  display: grid;
  place-items: center;
  padding: 28px;
}
.maya-scene::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background: radial-gradient(
    circle,
    rgba(230, 152, 44, 0.16),
    rgba(230, 152, 44, 0.05) 55%,
    transparent 72%
  );
  pointer-events: none;
}
</style>
