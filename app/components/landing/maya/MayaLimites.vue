<!--
  Chapitre 06 — « Ses limites ».

  Le chapitre le plus important de la page. Une copilote à qui l'on confie une
  décision qui coûte une colonie doit dire où elle s'arrête — et ces quatre
  limites sont vérifiables dans le dépôt, pas des postures :

    aucun appel LLM      → `server/utils/copilote-local.ts`, règles pures
    aucun seuil inventé  → `server/utils/santeScore.ts:100`, paliers ITSAP
    aucune écriture seule→ `server/api/ia/copilote.post.ts`, prévisualisation
    aucun point sans phrase → chaque composante du score porte sa justification
-->
<template>
  <LandingMayaChapitre numero="06" intitule="Ses limites" ancre="limites">
    <template #titre>Ce qu’elle ne fera{{ ' ' }}<br />jamais.</template>
    <template #chapo>
      Une copilote à qui l’on confie une décision qui coûte une colonie doit dire où elle s’arrête.
      Voici les quatre limites que Maya s’impose — et les trois choses qu’elle sait faire de ses
      propres doutes.
    </template>

    <!-- ⚠️ CES DEUX SUR-TITRES MANQUAIENT, ET C'EST LA MÊME OMISSION QUE DANS
         LES CHAPITRES 01, 02 ET 05 : les cartes tombaient sans dire ce
         qu'elles sont. Le chapitre en aligne SEPT d'affilée, en deux grilles
         de nature différente — quatre refus, puis trois qualités. Sans
         annonce, l'œil lit une seule liste de sept et perd la bascule. -->
    <p
      class="mb-3 text-[11.5px] font-bold uppercase tracking-[0.1em]"
      style="color: var(--honey-deep)"
    >
      Les quatre limites qu’elle s’impose
    </p>

    <ul v-reveal.cascade class="grid gap-4 sm:grid-cols-2">
      <li
        v-for="l in limites"
        :key="l.titre"
        class="rounded-[16px] border p-5"
        style="border-color: var(--border-default); background: var(--surface-muted)"
      >
        <div class="flex items-center gap-2">
          <UIcon
            name="i-lucide-circle-slash"
            class="h-4 w-4 shrink-0"
            style="color: var(--honey-deep)"
            aria-hidden="true"
          />
          <p class="text-[15px] font-semibold" style="color: var(--text-primary)">
            {{ l.titre }}
          </p>
        </div>
        <p class="mt-2 text-[13.5px] leading-relaxed" style="color: var(--text-secondary)">
          {{ l.detail }}
        </p>
      </li>
    </ul>

    <!-- Les trois qualités qu'elle tire de ses propres doutes. Chacune porte sa
         PREUVE : sans elle, ce ne sont que trois affirmations de plus. -->
    <p
      class="mb-3 mt-10 text-[11.5px] font-bold uppercase tracking-[0.1em]"
      style="color: var(--honey-deep)"
    >
      Ce qu’elle en tire
    </p>

    <div v-reveal.cascade class="grid gap-4 sm:grid-cols-3">
      <div
        v-for="q in qualites"
        :key="q.titre"
        class="flex flex-col rounded-[16px] border border-dashed p-5"
        style="border-color: var(--border-default)"
      >
        <p class="text-[15px] font-semibold" style="color: var(--text-primary)">{{ q.titre }}</p>
        <p class="mt-1.5 flex-1 text-[13.5px] leading-relaxed" style="color: var(--text-secondary)">
          {{ q.detail }}
        </p>

        <!-- Douter : l'échelle de confiance, telle qu'elle apparaît sur un score -->
        <div v-if="q.cle === 'douter'" class="mt-4 flex gap-1.5">
          <span
            v-for="(n, i) in CONFIANCE"
            :key="n"
            class="niveau"
            :style="{ opacity: 1 - i * 0.3 }"
          >
            {{ n }}
          </span>
        </div>

        <!-- Se taire : le filtre d'une nuit, en un chiffre -->
        <p v-else-if="q.cle === 'taire'" class="preuve mt-4">
          41 observations <span aria-hidden="true">→</span> 2 notifications
        </p>

        <!-- Être vérifiable : les bancs qui couvrent le noyau, cas par cas -->
        <dl v-else class="mt-4 flex flex-wrap gap-x-4 gap-y-1">
          <div v-for="b in BANCS" :key="b.nom" class="flex items-baseline gap-1.5">
            <dt class="text-[15px] font-bold tabular-nums" style="color: var(--honey-deep)">
              {{ b.cas }}
            </dt>
            <dd class="text-[11.5px]" style="color: var(--text-tertiary)">{{ b.nom }}</dd>
          </div>
        </dl>
      </div>
    </div>
  </LandingMayaChapitre>
</template>

<script setup lang="ts">
const limites = [
  {
    titre: 'Aucun appel LLM',
    detail:
      'Des règles pures, sans entrée-sortie dans la logique métier. Même rucher, même jour, même réponse — toujours.',
  },
  {
    titre: 'Aucun seuil inventé',
    detail:
      'Les paliers varroa suivent les références de l’ITSAP : 1 % bas, 3 % traiter, 5 % critique. Pas une intuition.',
  },
  {
    titre: 'Aucune écriture seule',
    detail:
      'Elle prépare, vous confirmez. Toujours dans cet ordre — y compris sur une dictée vocale.',
  },
  {
    titre: 'Aucun point sans phrase',
    detail:
      'Chaque point retiré d’un score est justifié, avec son niveau de confiance. Rien n’est opaque.',
  },
];

const CONFIANCE = ['Haute', 'Moyenne', 'Faible'];

/**
 * Les bancs qui couvrent le noyau de décision, cas par cas.
 *
 * Les chiffres sont ceux des fichiers de test — vérifiés, pas estimés. La
 * maquette annonçait « 16 météo » ; il y en a 22.
 *
 * ⚠️ CE COMMENTAIRE A MENTI PENDANT DES SEMAINES. Il affirmait qu'un banc
 * (`pageMaya.test.ts`) tenait ces trois chiffres à jour. Ce banc ne les
 * regardait pas : ils étaient exacts par hasard, et un commentaire qui affirme
 * une garantie dispense de la vérifier — quelqu'un aurait supprimé un cas de
 * test en toute confiance.
 *
 * La porte annoncée existe maintenant : `tests/unit/app/components/
 * compteursDeBancs.test.ts` compte les cas des trois fichiers et refuse tout
 * écart avec ce qui est montré au visiteur.
 */
const BANCS = [
  { cas: 19, nom: 'score' },
  { cas: 34, nom: 'balances' },
  { cas: 22, nom: 'météo' },
];

const qualites = [
  {
    cle: 'douter',
    titre: 'Elle sait douter',
    detail:
      'Chaque score porte son niveau de confiance. Une donnée vieille de six semaines ne vaut pas une visite d’hier.',
  },
  {
    cle: 'taire',
    titre: 'Elle sait se taire',
    detail:
      'Heures calmes de 21 h à 8 h, anti-rafale, résumé au-delà de deux alertes. Seules les urgences passent toujours.',
  },
  {
    cle: 'verifiable',
    titre: 'Elle est vérifiable',
    detail:
      'Le noyau est couvert cas par cas et le temps est injectable : n’importe quelle journée peut être rejouée à l’identique.',
  },
];
</script>

<style scoped>
.niveau {
  border-radius: 999px;
  border: 1px solid var(--honey);
  padding: 2px 9px;
  font-size: 11.5px;
  font-weight: 600;
  color: var(--honey-deep);
  background: var(--honey-soft);
}
.preuve {
  border-radius: 10px;
  background: var(--surface-muted);
  padding: 8px 11px;
  font-size: 13.5px;
  font-weight: 600;
  text-align: center;
  color: var(--text-secondary);
  font-variant-numeric: tabular-nums;
}
</style>
