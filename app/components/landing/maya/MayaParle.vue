<!--
  Chapitre 05 — « Elle vous parle ».

  L'autre sens de la conversation : ce n'est plus elle qui ouvre, c'est vous.
  La dictée passe par `app/composables/useDictee.ts`, le réveil vocal par
  `app/utils/reveilVocal.ts`, et la saisie hors réseau par le cache d'écriture.
-->
<template>
  <LandingMayaChapitre numero="05" intitule="Elle vous parle" ancre="parle">
    <template #titre>Comme un collègue,<br />les mains dans la ruche.</template>
    <template #chapo>
      Vous pouvez aussi lui parler le premier. À l’écrit ou à la voix, sans formuler de requête :
      dites la visite, elle remplit le formulaire et vous le montre avant d’enregistrer.
    </template>

    <div class="grid gap-5 sm:grid-cols-3">
      <div
        v-for="m in moyens"
        :key="m.titre"
        class="rounded-[16px] border p-5"
        style="border-color: var(--border-default); background: white"
      >
        <UIcon
          :name="m.icone"
          class="h-5 w-5"
          style="color: var(--honey-deep)"
          aria-hidden="true"
        />
        <p class="mt-3 text-[15px] font-semibold" style="color: var(--text-primary)">
          {{ m.titre }}
        </p>
        <p class="mt-1.5 text-[13.5px] leading-relaxed" style="color: var(--text-secondary)">
          {{ m.detail }}
        </p>
      </div>
    </div>

    <p
      class="mt-6 flex items-center justify-center gap-2 text-center text-[12.5px]"
      style="color: var(--text-tertiary)"
    >
      <UIcon name="i-lucide-shield-check" class="h-4 w-4" aria-hidden="true" />
      Maya suit des règles apicoles éprouvées — vous gardez la main sur tout.
    </p>
  </LandingMayaChapitre>
</template>

<script setup lang="ts">
const moyens = [
  {
    icone: 'i-lucide-mic',
    titre: '« Salut Maya »',
    detail: 'Le réveil vocal. Gants aux mains, cadre dans l’autre — vous n’avez rien à toucher.',
  },
  {
    icone: 'i-lucide-pen-line',
    titre: 'Elle écrit vos interventions',
    detail:
      'Dictez, elle structure. Vous relisez, vous validez. Même si vous donnez les informations dans le désordre.',
  },
  {
    icone: 'i-lucide-wifi-off',
    titre: 'Même sans réseau',
    detail: 'La saisie part au rucher, la synchronisation suit toute seule quand ça revient.',
  },
];
</script>
