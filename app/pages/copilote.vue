<template>
  <div class="mx-auto flex h-full max-w-3xl flex-col" style="min-height: calc(100dvh - 140px)">
    <!-- Header -->
    <div class="mb-4 flex items-center justify-between">
      <div>
        <h1
          class="flex items-center gap-2.5 text-[26px] font-semibold tracking-[-0.02em]"
          style="color: var(--text-primary)"
        >
          <!-- glow uniquement en conversation active : à l'état vide, seul le héros (size 64) rayonne -->
          <IaMayaMark
            :size="34"
            :glow="messages.length > 0"
            :state="streaming ? 'think' : 'idle'"
          />
          Maya
        </h1>
        <p class="mt-0.5 text-sm" style="color: var(--text-secondary)">
          Votre compagne apicole — vos données + tout le savoir, en réponse immédiate
        </p>
      </div>
      <div class="flex shrink-0 items-center gap-2">
        <UButton
          to="/copilote/fenetres"
          icon="i-lucide-calendar-clock"
          variant="ghost"
          color="neutral"
          size="sm"
        >
          <span class="hidden sm:inline">Fenêtres</span>
        </UButton>
        <UButton
          icon="i-lucide-plus"
          variant="soft"
          color="primary"
          size="sm"
          :disabled="streaming || !messages.length"
          @click="reset"
        >
          <span class="hidden sm:inline">Nouvelle discussion</span>
        </UButton>
      </div>
    </div>

    <!-- Erreur plan / quota -->
    <div
      v-if="erreur"
      class="mb-4 flex items-start gap-3 rounded-[14px] border px-4 py-3.5"
      style="
        border-color: color-mix(in srgb, var(--honey) 40%, transparent);
        background: var(--honey-soft);
      "
    >
      <UIcon
        name="i-lucide-lock"
        class="mt-0.5 h-4 w-4 shrink-0"
        style="color: var(--honey-deep)"
      />
      <div class="flex-1">
        <p class="text-[13.5px] font-semibold" style="color: var(--text-primary)">
          {{
            erreur.code === 'QUOTA_IA_ATTEINT'
              ? 'Quota mensuel atteint'
              : erreur.code === 'PLAN_REQUIRED'
                ? 'Fonctionnalité du plan supérieur'
                : 'Copilote indisponible'
          }}
        </p>
        <p class="text-[12.5px]" style="color: var(--text-secondary)">{{ erreur.message }}</p>
      </div>
      <UButton
        v-if="erreur.code === 'QUOTA_IA_ATTEINT' || erreur.code === 'PLAN_REQUIRED'"
        to="/tarifs"
        size="xs"
        color="primary"
      >
        Voir les plans
      </UButton>
    </div>

    <!-- Conversation -->
    <div ref="scrollEl" class="flex-1 space-y-3 overflow-y-auto pb-4">
      <!-- État vide : suggestions -->
      <div
        v-if="!messages.length"
        class="flex h-full flex-col items-center justify-center gap-5 py-14 text-center"
      >
        <IaMayaMark :size="64" glow state="idle" />
        <div>
          <p class="text-[15px] font-semibold" style="color: var(--text-primary)">
            Bonjour, je suis Maya 🐝 — comment puis-je vous aider ?
          </p>
          <p class="mt-1 text-[12.5px]" style="color: var(--text-tertiary)">
            J'agis sur vos données (ruches, stocks, finances, météo) et je réponds à vos questions
            d'apiculture — jamais je n'invente.
          </p>
        </div>
        <!-- Action principale : Maya guide ensuite la saisie pas à pas. -->
        <button
          type="button"
          class="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-[14px] font-semibold text-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
          style="background: var(--honey)"
          @click="envoyer('Faire une intervention')"
        >
          <UIcon name="i-lucide-clipboard-pen" class="h-4 w-4" />
          Faire une intervention
        </button>
        <div class="flex max-w-md flex-wrap justify-center gap-2">
          <button
            v-for="s in exemples"
            :key="s"
            type="button"
            class="rounded-full border bg-white px-3.5 py-2 text-[12.5px] font-medium transition-all hover:-translate-y-0.5 hover:shadow-sm"
            style="border-color: var(--border-default); color: var(--text-secondary)"
            @click="envoyer(s)"
          >
            {{ s }}
          </button>
        </div>
      </div>

      <IaCopiloteMessage
        v-for="(m, i) in messages"
        :key="i"
        :message="m"
        :is-last="i === messages.length - 1"
        @confirm="confirmerAction"
        @cancel="annulerAction"
        @undo="annulerEcriture"
        @confirm-plan="confirmerPlan"
        @cancel-plan="annulerPlanProposition"
        @undo-plan="annulerLotExecute"
        @suggest="envoyer"
      />

      <!-- Indicateur d'activité -->
      <div v-if="streaming && activite" class="flex items-center gap-2 pl-1">
        <span class="relative flex h-2 w-2">
          <span
            class="absolute inline-flex h-full w-full animate-ping rounded-full opacity-75"
            style="background: var(--honey)"
          />
          <span
            class="relative inline-flex h-2 w-2 rounded-full"
            style="background: var(--honey)"
          />
        </span>
        <span class="text-[12px] italic" style="color: var(--text-tertiary)">{{ activite }}</span>
      </div>
    </div>

    <!-- Zone de saisie -->
    <div class="sticky bottom-0 pb-1 pt-3" style="background: var(--surface-primary)">
      <div
        class="rounded-[18px] border bg-white p-2 shadow-sm transition-shadow focus-within:shadow-md"
        style="border-color: var(--border-default)"
      >
        <form class="flex items-end gap-2" @submit.prevent="submit">
          <!-- Nouvelle discussion accessible DEPUIS LE BAS (sans remonter en haut) -->
          <UButton
            v-if="messages.length"
            type="button"
            icon="i-lucide-square-pen"
            variant="ghost"
            color="neutral"
            size="lg"
            class="shrink-0"
            :disabled="streaming"
            title="Nouvelle discussion"
            aria-label="Nouvelle discussion"
            @click="reset"
          />
          <textarea
            ref="inputEl"
            v-model="brouillon"
            rows="1"
            :placeholder="placeholderSaisie"
            class="max-h-32 min-w-0 flex-1 resize-none border-0 bg-transparent px-2.5 py-2 text-[13.5px] outline-none focus-visible:ring-2 focus-visible:ring-[var(--honey)]/40 focus-visible:rounded-[6px]"
            style="color: var(--text-primary)"
            :disabled="streaming"
            @keydown.enter.exact.prevent="submit"
            @input="autosize"
          />
          <!-- Dictée vocale (même useDictee que la bulle) — masquée si le navigateur
               ne reconnaît pas la parole (Firefox), pour ne jamais montrer un bouton mort. -->
          <UButton
            v-if="dicteeSupportee"
            type="button"
            icon="i-lucide-mic"
            :variant="dicteeActive ? 'solid' : 'ghost'"
            :color="dicteeActive ? 'primary' : 'neutral'"
            size="lg"
            class="shrink-0"
            :class="dicteeActive ? 'animate-pulse' : ''"
            :disabled="streaming"
            :aria-label="dicteeActive ? 'Arrêter la dictée' : 'Dicter à la voix'"
            @click="basculerDictee"
          />
          <UButton
            type="submit"
            icon="i-lucide-send"
            color="primary"
            size="lg"
            :loading="streaming"
            :disabled="!brouillon.trim()"
            aria-label="Envoyer"
          />
        </form>
        <p
          v-if="dicteeErreur"
          class="px-2.5 pt-1 text-[11.5px]"
          style="color: var(--clay, #b87959)"
        >
          {{ dicteeErreur }}
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'default' });
useHead({ title: 'Maya — votre compagne apicole · APIGO' });

const {
  messages,
  streaming,
  activite,
  erreur,
  envoyer,
  confirmerAction,
  annulerAction,
  annulerEcriture,
  confirmerPlan,
  annulerPlanProposition,
  annulerLotExecute,
  reset,
} = useCopilote();

const brouillon = ref('');
const scrollEl = ref<HTMLElement | null>(null);
const inputEl = ref<HTMLTextAreaElement | null>(null);

// Dictée vocale — même composable que la bulle : on appuie, on parle, Maya écrit.
const {
  supporte: dicteeSupportee,
  actif: dicteeActive,
  erreur: dicteeErreur,
  basculer: basculerDicteeReco,
} = useDictee();
function basculerDictee(): void {
  basculerDicteeReco((texte) => {
    brouillon.value = texte;
    autosize();
  });
}

// Placeholder court sur mobile : la version longue (avec l'exemple) débordait de
// la zone de saisie sur petit écran. L'exemple reste visible sur desktop.
const { isMobile } = useSidebar();
const placeholderSaisie = computed(() =>
  isMobile.value ? 'Écrire à Maya…' : 'Écrire à Maya…  (ex : « Faire une intervention »)',
);

// Deep-link depuis ⌘K / launcher : /copilote?q=… → Maya répond directement.
const route = useRoute();
const router = useRouter();
onMounted(() => {
  const q = route.query.q;
  if (typeof q === 'string' && q.trim()) {
    router.replace({ query: {} });
    envoyer(q);
  }
});

// Exemples de l'état vide — un mix « action sur les données » + « savoir apicole ».
// Volontairement sans numéro de ruche en dur : Maya proposera vos vraies ruches.
const exemples = [
  'Quelles ruches visiter en priorité ?',
  'Comment traiter contre le varroa ?',
  'Ouvre une nouvelle vente',
  'Résumé de mes finances cette année',
  'Quand récolter le miel ?',
];

/**
 * Ramène la conversation tout en bas pour toujours suivre ce que Maya écrit.
 * Le conteneur réellement scrollable n'est PAS `scrollEl` mais le `<main>` du
 * layout (`overflow-y-auto`) : on remonte au premier ancêtre vraiment scrollable
 * et on le défile (repli sur la fenêtre). Indispensable pour suivre le streaming.
 */
function scrollEnBas(smooth = false): void {
  nextTick(() => {
    const behavior: ScrollBehavior = smooth ? 'smooth' : 'auto';
    let node: HTMLElement | null = scrollEl.value;
    while (node) {
      const oy = getComputedStyle(node).overflowY;
      if ((oy === 'auto' || oy === 'scroll') && node.scrollHeight > node.clientHeight + 1) {
        node.scrollTo({ top: node.scrollHeight, behavior });
        return;
      }
      node = node.parentElement;
    }
    window.scrollTo({ top: document.documentElement.scrollHeight, behavior });
  });
}

async function submit() {
  const q = brouillon.value;
  brouillon.value = '';
  if (inputEl.value) inputEl.value.style.height = 'auto';
  scrollEnBas(true); // on colle en bas dès l'envoi
  await envoyer(q);
}

function autosize() {
  const el = inputEl.value;
  if (!el) return;
  el.style.height = 'auto';
  el.style.height = `${Math.min(el.scrollHeight, 128)}px`;
}

// Suivi au scroll : on reste collé en bas à CHAQUE évolution — nouveau message,
// texte qui se complète, propositions qui apparaissent — pour que le dernier
// message soit toujours visible. Deep + flush 'post' = DOM à jour avant la mesure.
watch(messages, () => scrollEnBas(false), { deep: true, flush: 'post' });
</script>

<style scoped>
/* Identité Maya = <IaMayaMark/> (rayon de miel vivant). Plus de .maya-avatar
   dégradé honey→sage : voir app/components/ia/MayaMark.vue + main.css. */
</style>
