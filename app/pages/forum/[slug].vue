<template>
  <ForumChrome>
    <div class="mx-auto max-w-3xl space-y-4">
      <NuxtLink
        to="/forum"
        class="inline-flex items-center gap-1 text-sm text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)]"
      >
        <UIcon name="i-lucide-arrow-left" class="h-4 w-4" />
        Tous les sujets
      </NuxtLink>

      <div v-if="chargement" class="space-y-3">
        <div
          class="h-9 w-2/3 animate-pulse rounded-[10px] bg-[var(--surface-subtle)]"
          aria-hidden="true"
        />
        <div
          v-for="n in 3"
          :key="n"
          class="h-24 animate-pulse rounded-[12px] border border-[var(--border-default)] bg-[var(--surface-subtle)]"
        />
      </div>

      <!--
        ⚠️ « CE FIL N'EXISTE PAS » ET « JE N'AI PAS PU LE CHARGER » SONT DEUX
        PHRASES DIFFÉRENTES, et les confondre envoie l'apiculteur au mauvais
        endroit. Le premier jet attrapait TOUTE erreur et rendait `null` : une
        panne d'API, une coupure réseau, un 500, tout devenait « ce sujet n'existe
        pas ou plus ». Quelqu'un qui suit un lien reçu par message se serait
        entendu dire que le fil a disparu, alors qu'il suffisait de réessayer.

        Seul un 404 vaut « il n'existe pas ». Le reste remonte, et se dit.
      -->
      <UiErrorState v-else-if="erreur" :error="erreur" :retry="() => recharger()" />

      <UiEmptyState
        v-else-if="!fil"
        icon="i-lucide-file-question"
        title="Ce sujet n’existe pas ou plus"
        description="Il a peut-être été retiré par son auteur, ou son adresse a changé."
        action-label="Retour au forum"
        @action="navigateTo('/forum')"
      />

      <template v-else>
        <header>
          <h1 class="text-[24px] font-semibold tracking-[-0.02em] text-[var(--text-primary)]">
            {{ fil.titre }}
          </h1>
          <p class="mt-1 text-sm text-[var(--text-tertiary)]">
            Ouvert par {{ fil.auteur }} le {{ dateLisible(fil.createdAt) }}
          </p>
        </header>

        <ul class="space-y-3">
          <li v-for="m in fil.messages" :key="m.id">
            <ForumMessage
              :message="m"
              :peut-agir="connecte"
              @signaler="messageASignaler = m.id"
              @supprimer="supprimer(m.id)"
            />
          </li>
        </ul>

        <ForumRepondre v-if="connecte" :sujet-id="fil.id" @envoye="recharger" />
        <div
          v-else
          class="rounded-[12px] border border-dashed border-[var(--border-default)] px-4 py-6 text-center"
        >
          <!--
            ⚠️ `{{ ' ' }}` ENTRE LE TEXTE ET LE LIEN. `whitespace: 'condense'`
            SUPPRIME (ne condense pas) un nœud purement blanc contenant un saut de
            ligne entre deux éléments : sans lui, on lirait « libre.Connectez-vous
            pour répondre ». Le défaut a déjà été livré une fois dans ce dépôt.
          -->
          <p class="text-sm text-[var(--text-secondary)]">
            La lecture est libre.{{ ' ' }}
            <NuxtLink to="/login" class="font-medium text-[var(--honey-deep)] underline">
              Connectez-vous
            </NuxtLink>
            {{ ' ' }}pour répondre.
          </p>
        </div>
      </template>

      <ForumSignalerModale
        v-if="messageASignaler"
        :message-id="messageASignaler"
        @ferme="messageASignaler = null"
        @signale="apresSignalement"
      />
    </div>
  </ForumChrome>
</template>

<script setup lang="ts">
import type { FilForum } from '~/composables/useForum';

/**
 * ⚠️ `layout: false` — L'ENVELOPPE SE CHOISIT DANS `ForumChrome`. Le forum est
 * public ET applicatif : ni le layout de l'espace connecté ni le chrome
 * marketing ne conviennent seuls. Voir la note de `ForumChrome.vue`.
 */
definePageMeta({ layout: false, title: 'Forum' });

const route = useRoute();
const { lireFil, supprimerMessage } = useForum();
const user = useSupabaseUser();
const connecte = computed(() => Boolean(user.value));

const messageASignaler = ref<string | null>(null);
const slug = computed(() => String(route.params.slug ?? ''));

/**
 * ⚠️ `useAsyncData`, ET SURTOUT PAS `onMounted`. Toute la raison d'être de ce
 * fil est d'être INDEXABLE : un moteur de recherche lit le HTML rendu par le
 * serveur, et n'exécute pas `onMounted`. Un chargement au montage aurait donc
 * livré au robot — et au premier affichage — un squelette vide, pendant que le
 * développeur, lui, voit la page pleine dans son navigateur. Le défaut ne se
 * voit qu'en regardant la source, ou six mois plus tard dans les statistiques.
 *
 * `appelApi` et non `useFetch` : cf. `app/utils/appelApi.ts` (plafond
 * d'instanciation). Il porte `useRequestFetch()`, donc les en-têtes de la
 * requête entrante suivent en rendu serveur.
 *
 * PAS de `lazy` : on VEUT que le serveur attende la réponse avant de rendre.
 */
const {
  data: filRaw,
  pending: chargement,
  error: erreur,
  refresh: recharger,
} = useAsyncData<{ data: FilForum } | null>(
  () => `forum-fil-${slug.value}`,
  async () => {
    try {
      return await lireFil(slug.value);
    } catch (e) {
      /**
       * ⚠️ SEUL UN 404 VAUT « CE FIL N'EXISTE PAS ». Attraper tout et rendre
       * `null` — ce que faisait le premier jet — transformait n'importe quelle
       * panne en disparition : réseau coupé, API en 500, base indisponible, et
       * l'écran affirmait que le sujet n'existe plus. C'est une phrase qu'on ne
       * dit pas à la légère : elle fait renoncer, là où « réessayez » suffisait.
       */
      if ((e as { statusCode?: number }).statusCode === 404) return null;
      throw e;
    }
  },
  { watch: [slug] },
);

const fil = computed<FilForum | null>(() => filRaw.value?.data ?? null);

async function supprimer(id: string) {
  await supprimerMessage(id);
  await recharger();
}

async function apresSignalement() {
  messageASignaler.value = null;
  await recharger();
}

function dateLisible(iso: string): string {
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

/**
 * ⚠️ LE TITRE DU FIL EST LE TITRE DE LA PAGE, ET C'EST TOUT L'INTÉRÊT D'UN
 * FORUM INDEXABLE. Une page « Forum — APIGO » pour les cent fils du site ne
 * remonte sur aucune recherche : c'est la question elle-même que quelqu'un tape.
 */
watchEffect(() => {
  if (!fil.value) return;
  useSeoMeta({
    title: `${fil.value.titre} — Forum APIGO`,
    description: fil.value.messages[0]?.contenu.slice(0, 160),
  });
});
</script>
