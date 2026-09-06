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
              @modifie="recharger()"
            />
          </li>
        </ul>

        <!--
          ⚠️ CE BLOC EST LA MOITIÉ VISIBLE DE LA PAGINATION, ET SANS LUI LA
          TRONCATURE REDEVIENT SILENCIEUSE. Le serveur peut bien rendre
          `total` : si l'écran ne l'affiche jamais, un fil de 300 messages en
          montre 100 et se termine, l'air complet. On dit ce qui manque, et on
          donne le geste pour l'atteindre.
        -->
        <div v-if="resteDesMessages" class="flex flex-col items-center gap-1.5 pt-1">
          <UButton variant="outline" color="neutral" :loading="chargement" @click="pageSuivante">
            Voir les messages suivants
          </UButton>
          <p class="text-xs text-[var(--text-tertiary)]">
            {{ fil.messages.length }} sur {{ fil.total }} messages
          </p>
        </div>

        <ForumRepondre v-if="connecte" :sujet-id="fil.id" @envoye="apresReponse" />
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
import type { FilForum, MessageForum } from '~/composables/useForum';

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
 * ⚠️ UNE CONVERSATION NE SE PAGINE PAS COMME UNE LISTE. Une liste de sujets se
 * lit du plus récent au plus ancien : s'arrêter à la page 1 ne perd rien
 * d'important. Un FIL se lit du premier au dernier, et ce qu'on cherche —
 * les réponses — est à la FIN.
 *
 * D'où deux morceaux : la page de DÉPART, rendue par le serveur (donc
 * indexable), et les suivantes empilées côté client. Après avoir répondu, on
 * repart de la DERNIÈRE page : c'est là qu'est le message qu'on vient
 * d'écrire, et ne pas l'y voir donne l'impression que l'envoi a échoué.
 */
const pageDebut = ref(0);
const suite = ref<MessageForum[]>([]);
const derniereChargee = ref(0);

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
  () => `forum-fil-${slug.value}-${pageDebut.value}`,
  async () => {
    try {
      return await lireFil(slug.value, pageDebut.value);
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
  { watch: [slug, pageDebut] },
);

/**
 * Le fil TEL QU'IL S'AFFICHE : la page rendue par le serveur, plus celles que
 * le lecteur a demandées. `messages` est donc la concaténation, et `total`
 * reste celui du serveur — c'est lui qui dit s'il en reste.
 */
const fil = computed<FilForum | null>(() => {
  const base = filRaw.value?.data;
  if (!base) return null;
  return { ...base, messages: [...base.messages, ...suite.value] };
});

const resteDesMessages = computed(
  () => Boolean(fil.value) && fil.value!.messages.length < fil.value!.total,
);

async function pageSuivante() {
  const res = await lireFil(slug.value, derniereChargee.value + 1);
  derniereChargee.value += 1;
  suite.value = [...suite.value, ...res.data.messages];
}

/** Repartir proprement d'une page donnée : la suite accumulée n'a plus cours. */
async function repartirDe(page: number) {
  suite.value = [];
  derniereChargee.value = page;
  if (pageDebut.value === page) await recharger();
  else pageDebut.value = page;
}

async function supprimer(id: string) {
  await supprimerMessage(id);
  await repartirDe(pageDebut.value);
}

async function apresSignalement() {
  messageASignaler.value = null;
  await repartirDe(pageDebut.value);
}

/**
 * Après avoir répondu, on saute à la DERNIÈRE page. Le message qu'on vient
 * d'écrire y est ; rester sur la première le rendrait invisible, et l'envoi
 * paraîtrait avoir échoué. Sur un fil court — la quasi-totalité — la dernière
 * page EST la première, et rien ne bouge.
 */
async function apresReponse() {
  const total = (fil.value?.total ?? 0) + 1;
  const parPage = fil.value?.parPage ?? 100;
  await repartirDe(Math.max(0, Math.ceil(total / parPage) - 1));
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
