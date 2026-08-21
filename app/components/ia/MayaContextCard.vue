<template>
  <section v-if="afficher" class="maya-ctx">
    <IaMayaMark :size="26" state="idle" />
    <div class="min-w-0 flex-1">
      <p class="text-[12.5px] font-medium leading-snug" style="color: var(--text-secondary)">
        {{ brief?.intro }}
      </p>
      <div class="mt-1.5 flex flex-col gap-1.5">
        <div v-for="(it, i) in brief?.items" :key="i" class="flex flex-wrap items-center gap-x-2">
          <NuxtLink
            :to="it.to ?? '/copilote'"
            class="inline-flex items-center gap-2 text-[12.5px] transition-colors hover:underline"
            style="color: var(--text-primary)"
          >
            <span v-if="it.icone">{{ it.icone }}</span>
            <span>{{ it.texte }}</span>
          </NuxtLink>
          <!--
            L'AIDE PROPOSÉE SUR CE CONSTAT.

            Le lien mène à une page ; l'offre engage MAYA. « 3 colonies me
            semblent fragiles » + un lien vers /ruches laisse tout le travail
            d'interprétation à l'apiculteur — « qu'est-ce qui peut leur
            arriver ? » le fait à sa place, et c'est précisément ce qu'elle sait
            faire depuis qu'elle projette à 30 jours.
          -->
          <button
            v-if="it.offre"
            type="button"
            class="inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[11.5px] font-medium transition-all hover:-translate-y-0.5"
            style="background: var(--honey-soft); color: var(--honey-deep)"
            @click="demander(it.offre.question)"
          >
            <IaMayaMark :size="11" state="idle" />
            {{ it.offre.libelle }}
          </button>
        </div>
      </div>

      <!-- LA PERCHE — ce qui distingue une assistante d'un panneau d'affichage.
           La carte ne se contente plus de constater : elle propose la suite, et
           le clic ouvre Maya avec la question déjà posée. -->
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
 */
import type { Brief } from '~~/server/utils/maya-brief';

const props = defineProps<{
  contexte: 'ruches' | 'meteo' | 'alertes' | 'stocks' | 'calendrier';
}>();

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

const { data, error, execute } = useFetch<{ data: Brief }>('/api/ia/brief', {
  key: `maya-brief-${props.contexte}`,
  query: { contexte: props.contexte },
  lazy: true,
  immediate: mayaDisponible.value,
  default: () => ({ data: { salutation: '', intro: '', items: [] } }),
});

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
 * envoyée : l'apiculteur voit exactement ce qui va être demandé en son nom.
 */
function demander(question: string): void {
  maya.poserQuestion(question);
}
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
