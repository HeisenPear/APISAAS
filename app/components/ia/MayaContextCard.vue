<template>
  <section v-if="afficher" class="maya-ctx">
    <IaMayaMark :size="26" state="idle" />
    <div class="min-w-0 flex-1">
      <p class="text-[12.5px] font-medium leading-snug" style="color: var(--text-secondary)">
        {{ brief?.intro }}
      </p>

      <!--
        UN CONSTAT, PUIS CE QU'ON EN FAIT.

        Le constat n'est plus un lien : il se lit. Ce qui se clique, ce sont les
        deux suites — la fiche qui l'EXPLIQUE, et l'écran où l'on AGIT. La
        version précédente faisait du constat entier un lien vers la page où
        l'apiculteur se trouvait déjà : un paragraphe cliquable qui ne menait
        nulle part.
      -->
      <div class="mt-2 flex flex-col gap-2">
        <div v-for="(it, i) in brief?.items" :key="i">
          <p class="text-[12.5px] leading-snug" style="color: var(--text-primary)">
            {{ it.texte }}
          </p>
          <div v-if="it.pourquoi || it.ecran" class="mt-1.5 flex flex-wrap items-center gap-1.5">
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
      </div>

      <!-- LA PERCHE — ce qui distingue une assistante d'un panneau d'affichage.
           Elle porte TOUJOURS une intention de lecture, là où les « pourquoi »
           ci-dessus portent des questions de savoir : deux boutons d'une même
           carte ne peuvent donc plus rendre le même paragraphe. -->
      <div v-if="brief?.relance" class="mt-2.5 flex flex-wrap items-center gap-2">
        <span class="text-[12px] italic" style="color: var(--text-tertiary)">
          {{ brief.relance.amorce }}
        </span>
        <button
          type="button"
          class="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[12px] font-medium transition-all hover:-translate-y-0.5"
          style="
            border-color: var(--honey);
            background: var(--honey-soft);
            color: var(--honey-deep);
          "
          @click="demander(brief.relance.question)"
        >
          <IaMayaMark :size="13" state="idle" />
          {{ brief.relance.question }}
        </button>
      </div>
    </div>
    <NuxtLink
      to="/copilote"
      class="inline-flex shrink-0 items-center gap-1 rounded-[8px] px-2 py-1 text-[11.5px] font-semibold transition-all hover:-translate-y-0.5"
      style="background: var(--honey-soft); color: var(--honey-deep)"
    >
      Maya
      <UIcon name="i-lucide-arrow-up-right" class="h-3 w-3" />
    </NuxtLink>
  </section>
</template>

<script setup lang="ts">
/**
 * Types IMPORTÉS du serveur, plus recopiés.
 *
 * Ils étaient redéclarés ici à l'identique. Le jour où le serveur a gagné un
 * champ (`offre`), le gabarit ne pouvait plus le lire : TypeScript refusait une
 * propriété qui existait pourtant dans la réponse. Une copie de type ne
 * prévient pas d'une divergence — elle l'installe, et c'est le compilateur qui
 * finit par accuser le code juste.
 *
 * ⚠️ LA LISTE DES CONTEXTES AUSSI. Elle était écrite en toutes lettres dans la
 * prop (`'ruches' | 'meteo' | …`) — une quatrième copie de la même énumération.
 * Elle dérive maintenant de `CONTEXTES_BRIEF`, sa source unique.
 */
import type { Brief, ContexteBrief } from '~~/server/utils/maya-brief';

const props = defineProps<{ contexte: ContexteBrief }>();

// Deux gardes réunis DANS la carte, pour que chaque page qui la monte hérite du
// bon comportement sans rien importer :
//   · `aAcces('copiloteIa')` — sans lui l'appel part quand même, le serveur
//     répond 402 et l'intercepteur global ouvre le modal d'abonnement tout seul.
//   · `maya.proactif` — une carte PROACTIVE ne doit apparaître qu'en présence
//     « partout ». En discret ou en pause, Maya ne parle que sur demande. La
//     page météo l'ignorait auparavant : Maya s'y invitait même réglée discrète.
const { aAcces } = useSubscription();
const maya = useMayaStore();
const mayaDisponible = computed(() => maya.proactif && aAcces('copiloteIa'));

/**
 * ⚠️ `useAsyncData` + `appelApi`, ET PAS `useFetch` — cf. `app/utils/appelApi.ts`.
 * Le chemin n'est plus résolu contre l'union des 213 routes (9,3 M
 * d'instanciations pour une limite de 5). La `query` — absente de
 * `useAsyncData` — est sérialisée dans l'URL, comme `useFetch` le faisait.
 */
const { data, error, execute } = useAsyncData<{ data: Brief }>(
  `maya-brief-${props.contexte}`,
  () => appelApi<{ data: Brief }>(`/api/ia/brief?contexte=${encodeURIComponent(props.contexte)}`),
  {
    lazy: true,
    immediate: mayaDisponible.value,
    // Type annoncé : sans contexte, `items: []` s'infère en `never[]` et `data`
    // devient une union de deux formes — dont l'une sans `relance`.
    default: (): { data: Brief } => ({ data: { salutation: '', intro: '', items: [] } }),
  },
);

// Bascule EN PAGE. Masquer en discret/pause est réactif (l'`afficher` ci-dessous
// se recalcule). L'inverse ne l'est pas : `immediate` n'est lu qu'au montage,
// donc passer de « discret » à « partout » sans quitter la page ne
// déclencherait aucune requête et la carte resterait vide. On la charge à la
// volée, une seule fois, quand l'accès s'ouvre.
watch(mayaDisponible, (ok) => {
  if (ok && !data.value?.data?.items?.length) void execute();
});

const brief = computed(() => data.value?.data);

/**
 * Ouvre Maya avec la question déjà posée. Le libellé du bouton EST la question
 * envoyée pour la perche ; pour un « pourquoi », le libellé est plus court mais
 * la question part telle qu'elle est écrite côté serveur, où un banc vérifie
 * qu'elle atteint bien la fiche visée.
 */
function demander(question: string): void {
  maya.poserQuestion(question);
}

/**
 * AUCUN CONSTAT ⟹ AUCUNE CARTE. C'est le comportement voulu sur une page : au
 * calme, Maya se tait. Le serveur ne renvoie d'ailleurs plus de relance dans ce
 * cas — les deux vont ensemble, sans quoi il faudrait maintenir une branche
 * « rien à signaler » que cet écran ne rendrait jamais.
 */
const afficher = computed(
  () => mayaDisponible.value && !error.value && (brief.value?.items?.length ?? 0) > 0,
);
</script>

<style scoped>
.maya-ctx {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  border-radius: 14px;
  border: 1px solid var(--border-default);
  background: var(--surface-card);
  padding: 12px 14px;
  position: relative;
  overflow: hidden;
}
.maya-ctx::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  bottom: 0;
  width: 3px;
  background: var(--honey);
}
</style>
