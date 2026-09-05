<template>
  <!-- Skeleton — Maya « prépare » le briefing (state loading : lueur qui tourne) -->
  <section v-if="pending" class="maya-card">
    <div class="flex items-center gap-2.5">
      <IaMayaMark :size="32" state="loading" />
      <div class="h-4 w-44 animate-pulse rounded bg-[var(--surface-muted)]" />
    </div>
    <div class="mt-3 space-y-2">
      <div
        v-for="i in 3"
        :key="i"
        class="h-9 animate-pulse rounded-[10px] bg-[var(--surface-muted)]"
      />
    </div>
  </section>

  <!-- Carte Maya -->
  <section v-else-if="afficher" class="maya-card">
    <div class="flex items-center gap-2.5">
      <IaMayaMark :size="32" :state="aUnePriorite ? 'alert' : 'idle'" />
      <p
        class="min-w-0 flex-1 text-[13.5px] font-semibold leading-tight"
        style="color: var(--text-primary)"
      >
        Maya
      </p>
      <NuxtLink
        to="/copilote"
        class="inline-flex items-center gap-1 rounded-[9px] px-2.5 py-1.5 text-[12px] font-semibold transition-all hover:-translate-y-0.5"
        style="background: var(--honey-soft); color: var(--honey-deep)"
      >
        Ouvrir
        <UIcon name="i-lucide-arrow-up-right" class="h-3.5 w-3.5" />
      </NuxtLink>
    </div>

    <!-- Salutation conversationnelle -->
    <div class="mt-2.5">
      <p class="text-[15px] font-semibold leading-tight" style="color: var(--text-primary)">
        {{ brief?.salutation }}
      </p>
      <p class="mt-1 text-[12.5px] leading-snug" style="color: var(--text-secondary)">
        {{ brief?.intro }}
      </p>
    </div>

    <!--
      UN CONSTAT, PUIS CE QU'ON EN FAIT.

      Le constat se lit ; ce qui se clique, ce sont ses deux suites — la fiche
      qui l'EXPLIQUE (Maya répond dans sa bulle) et l'écran où l'on AGIT.
      Auparavant le constat entier était un lien, et rien n'expliquait rien.
    -->
    <ul class="mt-3 space-y-2">
      <li v-for="(it, i) in brief?.items" :key="i" class="flex items-start gap-2.5 px-2.5">
        <span class="maya-chip mt-1.5" :style="tonBg(it.ton)" />
        <div class="min-w-0 flex-1">
          <p class="text-[12.5px] leading-snug" style="color: var(--text-primary)">
            {{ it.texte }}
          </p>
          <div
            v-if="it.pourquoi || it.geste || it.ecran"
            class="mt-1.5 flex flex-wrap items-center gap-1.5"
          >
            <button
              v-if="it.pourquoi"
              type="button"
              class="inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[11.5px] font-medium transition-all hover:-translate-y-0.5"
              style="background: var(--honey-soft); color: var(--honey-deep)"
              @click="demander(it.pourquoi.question)"
            >
              <IaMayaMark :size="11" state="idle" />
              {{ it.pourquoi.libelle }}
            </button>
            <!--
              LE GESTE — Maya le PRÉPARE, on le valide.

              Volontairement plus affirmatif que « pourquoi » : celui-ci
              explique, celui-là AGIT. Deux boutons de même poids visuel
              laisseraient croire qu'on choisit entre deux lectures.

              La phrase part par le même canal que la dictée, donc elle hérite
              de l'aperçu, de la confirmation et de l'annulation — la carte
              n'écrit rien toute seule.
            -->
            <button
              v-if="it.geste"
              type="button"
              class="inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-0.5 text-[11.5px] font-semibold text-white transition-all hover:-translate-y-0.5"
              style="background: var(--honey)"
              @click="demander(it.geste.phrase)"
            >
              <IaMayaMark :size="11" state="idle" />
              {{ it.geste.libelle }}
            </button>
            <NuxtLink
              v-if="it.ecran"
              :to="it.ecran.to"
              class="inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 text-[11.5px] font-medium transition-all hover:-translate-y-0.5"
              style="border-color: var(--border-default); color: var(--text-secondary)"
            >
              {{ it.ecran.libelle }}
              <UIcon name="i-lucide-arrow-up-right" class="h-3 w-3" />
            </NuxtLink>
          </div>
        </div>
      </li>
    </ul>
  </section>
</template>

<script setup lang="ts">
/**
 * Types IMPORTÉS du serveur, plus recopiés — même correction que sur la carte
 * contextuelle. La copie locale avait déjà pris du retard : elle ignorait
 * `offre`, donc le gabarit ne pouvait pas afficher les boutons que le serveur
 * envoyait déjà.
 */
import type { Brief, PropositionMaya } from '~~/server/utils/maya-brief';

/**
 * On ne DEMANDE pas ce à quoi la formule ne donne pas droit.
 *
 * Sans ce garde, la carte partait chercher le brief en Découverte, le serveur
 * répondait 402, et l'intercepteur global ouvrait le modal « Limite du plan
 * atteinte » — tout seul, sans le moindre geste de l'apiculteur. Un nouvel
 * inscrit était donc accueilli par un mur payant en arrivant sur son tableau
 * de bord. Constaté en pilotant un vrai navigateur, juste après l'onboarding.
 *
 * La carte se masquait bien en cas d'erreur ; c'est l'APPEL lui-même qu'il
 * fallait éviter.
 */
const { aAcces } = useSubscription();
const mayaDisponible = aAcces('copiloteIa');

/**
 * ⚠️ `useAsyncData` + `appelApi`, ET PAS `useFetch` — cf. `app/utils/appelApi.ts`.
 * Résoudre ce chemin contre l'union des 213 routes fait déplier à TypeScript le
 * type de retour réel de chaque handler. Le type est donné ici, donc vérifié.
 * `lazy`, `immediate` et `default` sont des options d'`useAsyncData` : intactes.
 */
const { data, pending, error } = useAsyncData<{ data: Brief }>(
  'maya-brief',
  () => appelApi<{ data: Brief }>('/api/ia/brief'),
  {
    lazy: true,
    immediate: mayaDisponible,
    // Annoté : sans contexte de type, `items: []` s'inférerait en `never[]`.
    default: (): { data: Brief } => ({ data: { salutation: '', intro: '', items: [] } }),
  },
);

const brief = computed(() => data.value?.data);
// Masquée si non disponible (plan sans Maya, erreur) ou si aucun item utile.
const afficher = computed(
  () => mayaDisponible && !error.value && (brief.value?.items?.length ?? 0) > 0,
);

// Une priorité à regarder (ton honey/clay) → la mark héros s'embrase (state alert).
const aUnePriorite = computed(() =>
  (brief.value?.items ?? []).some((i) => i.ton === 'honey' || i.ton === 'clay'),
);

/** Ouvre Maya avec la question déjà posée — même canal que les cartes de page. */
function demander(question: string): void {
  useMayaStore().poserQuestion(question);
}

function tonBg(ton: PropositionMaya['ton']): string {
  switch (ton) {
    case 'honey':
      return 'background: var(--honey-soft); color: var(--honey-deep)';
    case 'sage':
      return 'background: var(--sage-soft); color: var(--sage-deep)';
    case 'clay':
      return 'background: var(--clay-soft); color: var(--clay-deep)';
    default:
      return 'background: var(--surface-muted); color: var(--text-secondary)';
  }
}
</script>

<style scoped>
.maya-card {
  border-radius: 16px;
  border: 1px solid var(--border-default);
  background: var(--surface-card);
  padding: 16px;
  position: relative;
  overflow: hidden;
}
.maya-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: var(--honey);
}
/*
 * LA PASTILLE DE TON — une PUCE, pas un carré vide.
 *
 * Elle mesurait 1,6 rem et devait contenir une icône : `icone` valait la chaîne
 * vide depuis que Maya a cessé de parler en emojis, si bien qu'elle affichait un
 * bloc de couleur de la taille d'une case à cocher, sans rien dedans — ce qui
 * se lit comme un chargement en cours, pas comme un marqueur. Réduite à une
 * puce de 7 px, elle redevient ce qu'elle est : la couleur du ton (miel, sauge,
 * argile) posée en tête de constat.
 */
.maya-chip {
  display: block;
  height: 7px;
  width: 7px;
  border-radius: 999px;
  flex-shrink: 0;
}
</style>
