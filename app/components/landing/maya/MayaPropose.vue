<!--
  Chapitre 02 — « Elle propose ».

  Le cœur de l'argument : la différence avec un chatbot n'est pas le ton, c'est
  l'initiative. La chaîne observe → déduit → propose → vous décidez est la
  vraie séquence du produit, et la dernière marche n'est pas décorative :
  `server/api/ia/copilote.post.ts` prévisualise avant d'écrire, toujours.
-->
<template>
  <LandingMayaChapitre numero="02" intitule="Elle propose" ancre="propose">
    <template #titre>Un chatbot répond.<br />Maya propose.</template>
    <template #chapo>
      La différence n’est pas dans le ton, elle est dans l’initiative. Personne n’a rien demandé :
      Maya a vu, elle a déduit, elle propose un geste daté — et elle s’arrête là.
    </template>

    <div class="grid gap-8 md:grid-cols-[0.9fr_1.1fr] md:gap-12">
      <!-- La chaîne -->
      <ol class="space-y-5">
        <li v-for="(e, i) in etapes" :key="e.cle" class="flex gap-4">
          <div class="flex flex-col items-center">
            <span
              class="grid h-8 w-8 shrink-0 place-items-center rounded-[10px] text-[11px] font-bold"
              :style="
                i === etapes.length - 1
                  ? 'background: var(--honey); color: #fff'
                  : 'background: var(--honey-soft); color: var(--honey-deep)'
              "
            >
              {{ i + 1 }}
            </span>
            <span
              v-if="i < etapes.length - 1"
              class="mt-1 w-px flex-1"
              style="background: var(--border-default)"
              aria-hidden="true"
            />
          </div>
          <div class="pb-1">
            <p
              class="text-[11px] font-bold uppercase tracking-[0.1em]"
              style="color: var(--honey-deep)"
            >
              {{ e.cle }}
            </p>
            <p class="mt-1 text-[14px] leading-relaxed" style="color: var(--text-secondary)">
              {{ e.detail }}
            </p>
          </div>
        </li>
      </ol>

      <!-- La proposition, telle qu'elle arrive -->
      <div
        class="overflow-hidden rounded-[16px] border"
        style="border-color: var(--border-default); background: white"
      >
        <div
          class="flex items-center gap-2.5 border-b px-4 py-3"
          style="border-color: var(--border-default); background: var(--surface-muted)"
        >
          <IaMayaMark :size="22" state="idle" />
          <span class="text-[13px] font-semibold" style="color: var(--text-primary)">Maya</span>
          <span class="text-[11.5px]" style="color: var(--text-tertiary)">
            Sans qu’on lui demande · 06 h 58
          </span>
          <span
            class="ml-auto rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider"
            style="background: var(--honey-soft); color: var(--honey-deep)"
          >
            Priorité
          </span>
        </div>

        <div class="px-4 py-4">
          <p class="text-[15px] font-semibold" style="color: var(--text-primary)">
            Ruche 07 · Les Tilleuls
          </p>
          <p class="text-[12.5px]" style="color: var(--text-tertiary)">
            Buckfast · reine 2023 · colonie forte
          </p>

          <dl class="mt-4 space-y-3">
            <div v-for="l in lecture" :key="l.cle">
              <dt
                class="text-[10.5px] font-bold uppercase tracking-[0.1em]"
                style="color: var(--honey-deep)"
              >
                {{ l.cle }}
              </dt>
              <dd class="mt-0.5 text-[13.5px] leading-relaxed" style="color: var(--text-secondary)">
                {{ l.texte }}
              </dd>
            </div>
          </dl>

          <p
            class="mt-4 rounded-[10px] px-3 py-2.5 text-[13px] leading-relaxed"
            style="background: var(--surface-muted); color: var(--text-secondary)"
          >
            Si rien n’est fait : <strong style="color: var(--text-primary)">−1 colonie</strong> et
            environ <strong style="color: var(--text-primary)">18 kg</strong> de miel sur la saison.
          </p>

          <div class="mt-4 flex flex-wrap gap-2">
            <UButton size="sm" color="primary">Planifier demain</UButton>
            <UButton size="sm" color="neutral" variant="ghost">Modifier</UButton>
            <UButton size="sm" color="neutral" variant="ghost">Plus tard</UButton>
          </div>

          <p class="mt-3 text-[11.5px]" style="color: var(--text-tertiary)">
            Exemple. Rien ne part en base tant que vous n’avez pas choisi.
          </p>
        </div>
      </div>
    </div>
  </LandingMayaChapitre>
</template>

<script setup lang="ts">
const etapes = [
  {
    cle: 'J’observe',
    detail: 'Les faits bruts de vos visites et de vos capteurs, sans interprétation.',
  },
  { cle: 'Je déduis', detail: 'Une règle apicole, nommée, avec sa source. Jamais une intuition.' },
  { cle: 'Je propose', detail: 'Un geste concret, une date, une quantité. Prêt à enregistrer.' },
  {
    cle: 'Vous décidez',
    detail: 'Rien ne s’écrit sans votre geste. Elle ne touche pas à vos données seule.',
  },
];

const lecture = [
  { cle: 'J’observe', texte: '3 cellules royales à la visite du 12 mai. Hausse pleine à 82 %.' },
  {
    cle: 'Je déduis',
    texte: 'Essaimage probable entre le 20 et le 24 mai — règle essaimage, J+9.',
  },
  {
    cle: 'Je propose',
    texte: 'Diviser sur 2 cadres de couvain operculé, demain matin, avant 11 h.',
  },
];
</script>
