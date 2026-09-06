<template>
  <ForumChrome>
    <div class="space-y-4">
      <div class="flex flex-wrap items-end justify-between gap-3">
        <UiPageHeader
          title="Forum"
          description="L’entraide entre apiculteurs — une question, des réponses."
        />
        <UButton v-if="connecte" color="primary" @click="ouvrirFormulaire = !ouvrirFormulaire">
          {{ ouvrirFormulaire ? 'Annuler' : 'Poser une question' }}
        </UButton>
        <UButton v-else to="/login" variant="outline" color="neutral">
          Connectez-vous pour participer
        </UButton>
      </div>

      <ForumNouveauSujet v-if="ouvrirFormulaire" @cree="apresCreation" />

      <!-- Squelette : la liste met un instant à arriver, l'écran ne doit pas sauter. -->
      <div v-if="chargement && !sujets.length" class="space-y-2">
        <div
          v-for="n in 5"
          :key="n"
          class="h-[74px] animate-pulse rounded-[12px] border border-[var(--border-default)] bg-[var(--surface-subtle)]"
        />
      </div>

      <!--
        ⚠️ « JE N'AI PAS PU CHARGER » AVANT « IL N'Y A RIEN », ET DANS CET ORDRE.
        Le premier jet n'avait que l'état vide : une panne d'API aurait affiché
        « personne n'a encore ouvert de sujet » — un forum plein qui se déclare
        désert. C'est le défaut que `etatsDErreur.test.ts` existe pour attraper,
        et il l'a attrapé ici.
      -->
      <UiErrorState v-else-if="erreur" :error="erreur" :retry="() => refresh()" />

      <!--
        ⚠️ L'ÉTAT VIDE D'UN FORUM NE DIT PAS « AUCUN RÉSULTAT ». Un forum neuf est
        vide par construction, et « aucun sujet » se lit comme une panne. Il faut
        dire que la place est libre, et inviter à la prendre.
      -->
      <UiEmptyState
        v-else-if="!sujets.length"
        icon="i-lucide-messages-square"
        title="Personne n’a encore ouvert de sujet"
        description="Une question sur le varroa, une récolte qui vous étonne, un doute sur un traitement — c’est le bon endroit."
        :action-label="connecte ? 'Poser la première question' : undefined"
        @action="ouvrirFormulaire = true"
      />

      <ul v-else class="space-y-2">
        <li v-for="s in sujets" :key="s.id">
          <NuxtLink
            :to="`/forum/${s.slug}`"
            class="block rounded-[12px] border border-[var(--border-default)] bg-white px-4 py-3 transition-colors duration-200 hover:border-[var(--honey)]"
          >
            <div class="flex items-start justify-between gap-3">
              <!-- minw-0 : sans lui, `truncate` n'a aucun effet dans un flex. -->
              <div class="min-w-0">
                <h2 class="truncate text-[15px] font-medium text-[var(--text-primary)]">
                  {{ s.titre }}
                </h2>
                <p class="mt-0.5 text-xs text-[var(--text-tertiary)]">
                  {{ s.auteur }} · {{ dateLisible(s.dernierMessageLe ?? s.createdAt) }}
                </p>
              </div>
              <span
                class="shrink-0 rounded-full bg-[var(--surface-subtle)] px-2 py-0.5 text-xs tabular-nums text-[var(--text-secondary)]"
              >
                {{ s.messages }} {{ s.messages > 1 ? 'réponses' : 'réponse' }}
              </span>
            </div>
          </NuxtLink>
        </li>
      </ul>

      <div v-if="total > sujets.length" class="flex justify-center pt-2">
        <UButton variant="outline" color="neutral" :loading="chargement" @click="chargerPlus">
          Voir plus de sujets
        </UButton>
      </div>
    </div>
  </ForumChrome>
</template>

<script setup lang="ts">
import type { SujetForum } from '~/composables/useForum';

/**
 * ⚠️ `layout: false` — L'ENVELOPPE SE CHOISIT DANS `ForumChrome`. Le forum est
 * public ET applicatif : ni le layout de l'espace connecté ni le chrome
 * marketing ne conviennent seuls. Voir la note de `ForumChrome.vue`.
 */
definePageMeta({ layout: false, title: 'Forum' });

const { listerSujets } = useForum();
const user = useSupabaseUser();
const connecte = computed(() => Boolean(user.value));

const ouvrirFormulaire = ref(false);

/**
 * ⚠️ LA PREMIÈRE PAGE SE CHARGE EN RENDU SERVEUR, PAS AU MONTAGE. Le forum est
 * public pour être INDEXABLE : un moteur lit le HTML du serveur et n'exécute
 * pas `onMounted`. Charger au montage aurait servi un squelette vide au robot
 * — et au premier affichage — pendant que le navigateur du développeur, lui,
 * montre la liste pleine. C'est un défaut qu'on ne voit qu'en lisant la source.
 *
 * `appelApi` (via `listerSujets`) et non `useFetch` : cf. `app/utils/appelApi.ts`.
 */
const {
  data: premiere,
  pending: chargementInitial,
  error: erreur,
  refresh,
} = useAsyncData<{
  data: SujetForum[];
  total: number;
}>('forum-sujets-0', () => listerSujets({ page: 0 }));

/**
 * Les pages SUIVANTES, elles, s'accumulent côté client : « voir plus » est un
 * geste, pas un chargement de page. On garde la première rendue par le serveur
 * en tête pour ne pas la refaire — et pour que l'hydratation ne la fasse pas
 * clignoter.
 */
const suite = ref<SujetForum[]>([]);
const page = ref(0);
const chargementSuite = ref(false);

const sujets = computed(() => [...(premiere.value?.data ?? []), ...suite.value]);
const total = computed(() => premiere.value?.total ?? 0);
const chargement = computed(() => chargementInitial.value || chargementSuite.value);

async function chargerPlus() {
  chargementSuite.value = true;
  try {
    const res = await listerSujets({ page: page.value + 1 });
    page.value += 1;
    suite.value = [...suite.value, ...res.data];
  } finally {
    chargementSuite.value = false;
  }
}

async function apresCreation(slug: string) {
  ouvrirFormulaire.value = false;
  await navigateTo(`/forum/${slug}`);
}

/**
 * ⚠️ `toLocaleDateString` SANS FUSEAU LIT CELUI DU NAVIGATEUR, et c'est voulu
 * ici : la date s'affiche chez le lecteur. La règle `horloge.ts` vise `server/`,
 * où le fuseau est UTC et où lire l'heure de la machine est un défaut.
 */
function dateLisible(iso: string): string {
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

useSeoMeta({
  title: 'Forum des apiculteurs — APIGO',
  description:
    'Questions et réponses entre apiculteurs : varroa, essaimage, récolte, matériel. ' +
    'Lecture libre, participation avec un compte APIGO.',
});
</script>
