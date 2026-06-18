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
      <UButton
        v-if="messages.length"
        icon="i-lucide-rotate-ccw"
        variant="outline"
        color="neutral"
        size="sm"
        :disabled="streaming"
        @click="reset"
      >
        Nouvelle conversation
      </UButton>
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
        @confirm="confirmerAction"
        @cancel="annulerAction"
        @undo="annulerEcriture"
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
    <div
      class="sticky bottom-0 border-t pb-1 pt-3"
      style="border-color: var(--border-default); background: var(--surface-primary)"
    >
      <!-- Réponses rapides (rebond) -->
      <div v-if="suggestions.length && !streaming" class="mb-2 flex flex-wrap gap-1.5">
        <button
          v-for="s in suggestions"
          :key="s"
          type="button"
          class="rounded-full border bg-white px-3 py-1.5 text-[12px] font-medium transition-all hover:-translate-y-0.5 hover:shadow-sm"
          style="border-color: var(--border-default); color: var(--honey-deep)"
          @click="envoyer(s)"
        >
          {{ s }}
        </button>
      </div>

      <form class="flex items-end gap-2" @submit.prevent="submit">
        <textarea
          ref="inputEl"
          v-model="brouillon"
          rows="1"
          placeholder="Posez votre question…"
          class="max-h-32 flex-1 resize-none rounded-[13px] border bg-white px-4 py-3 text-[13.5px] outline-none transition-shadow focus:shadow-md"
          style="border-color: var(--border-default); color: var(--text-primary)"
          :disabled="streaming"
          @keydown.enter.exact.prevent="submit"
          @input="autosize"
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
        v-if="quota?.max"
        class="mt-1.5 text-right text-[11px]"
        style="color: var(--text-quaternary)"
      >
        {{ quota.utilise }}/{{ quota.max }} questions ce mois-ci
      </p>
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
  quota,
  suggestions,
  erreur,
  envoyer,
  confirmerAction,
  annulerAction,
  annulerEcriture,
  reset,
} = useCopilote();

const brouillon = ref('');
const scrollEl = ref<HTMLElement | null>(null);
const inputEl = ref<HTMLTextAreaElement | null>(null);

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
  'Note une visite : reine vue, couvain, pas de varroa',
  'Comment traiter contre le varroa ?',
  'Ouvre une nouvelle vente',
  'Résumé de mes finances cette année',
  'Quand récolter le miel ?',
];

/** Ramène la conversation tout en bas pour toujours voir ce qui s'écrit. */
function scrollEnBas(smooth = false): void {
  nextTick(() => {
    const el = scrollEl.value;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: smooth ? 'smooth' : 'auto' });
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

// Reste collé en bas : nouveau message (longueur) ET texte qui se complète
// (contenu). Scroll instantané pour suivre le flux sans à-coups.
watch(
  () => `${messages.value.length}:${messages.value.map((m) => m.content.length).join(',')}`,
  () => scrollEnBas(false),
);
</script>

<style scoped>
/* Identité Maya = <IaMayaMark/> (rayon de miel vivant). Plus de .maya-avatar
   dégradé honey→sage : voir app/components/ia/MayaMark.vue + main.css. */
</style>
