<template>
  <div class="cine-stage" @click="tap">
    <div class="cine-motes" aria-hidden="true">
      <span v-for="i in 14" :key="i" class="cine-mote" :style="mote(i)" />
    </div>

    <!-- ── LA NAISSANCE — une seule fois, jamais au retour de Stripe ── -->
    <div v-if="phase === 'birth'" class="cine-naissance">
      <IaOnboardingMayaBirth :size="isWide ? 260 : 210" play :born="born" />
      <!-- La hauteur est réservée AVANT l'apparition du titre : sinon le rayon
           se fait pousser vers le haut à 1,1 s et la naissance sursaute. -->
      <div class="cine-titre">
        <template v-if="titreVisible">
          <p class="cine-eyebrow cine-fade">APIGO</p>
          <h1 class="cine-h1 cine-fade cine-fade-2">Maya s’éveille</h1>
        </template>
      </div>
    </div>

    <!-- ── LE RÉCIT ── -->
    <div v-else class="cine-play">
      <div class="cine-flow">
        <div class="cine-anchor cine-anchor-in">
          <IaMayaMark :size="isWide ? 88 : 72" :state="etatMark" />
        </div>

        <Transition name="cine-scene" mode="out-in">
          <div :key="scene.id" class="cine-scene">
            <div class="cine-voice">
              <IaOnboardingCineCaption :text="scene.caption" :size="isWide ? 40 : 30" />
              <p v-if="scene.sub" class="cine-sub cine-subfade">{{ scene.sub }}</p>
            </div>

            <div class="cine-vis-in">
              <IaOnboardingSceneHello v-if="scene.visual === 'hello'" />
              <IaOnboardingSceneApigo v-else-if="scene.visual === 'apigo'" />
              <IaOnboardingScenePillars v-else-if="scene.visual === 'pillars'" />
              <IaOnboardingSceneProposal v-else-if="scene.visual === 'proposal'" />
              <IaOnboardingSceneProfil
                v-else-if="scene.visual === 'profil'"
                v-model="form.profilApicole"
              />
              <IaOnboardingScenePresence
                v-else-if="scene.visual === 'presence'"
                v-model="presence"
              />
              <IaOnboardingScenePlan
                v-else-if="scene.visual === 'plan'"
                v-model="form.selectedPlan"
                v-model:cgv="acceptCgv"
              />
              <IaOnboardingSceneRucher
                v-else-if="scene.visual === 'rucher'"
                v-model="rucher"
                :geo-loading="geoLoading"
                @geo="detectLocation"
              />
              <IaOnboardingSceneRuches
                v-else-if="scene.visual === 'ruches'"
                v-model:nb="form.nbRuches"
                v-model:type="form.rucheType"
                :cap="maxRuches"
              />
              <IaOnboardingSceneModules
                v-else-if="scene.visual === 'modules'"
                v-model="form.modulesActifs"
                :profil="form.profilApicole"
              />
              <IaOnboardingSceneReady
                v-else-if="scene.visual === 'ready'"
                :rucher="rucher"
                :nb-ruches="form.nbRuches"
                :presence="presence"
                :modules="form.modulesActifs"
              />
            </div>

            <button
              v-if="scene.wait"
              class="cine-cta"
              type="button"
              :disabled="saving || !peutAvancer"
              @click.stop="avancer"
            >
              {{ saving ? 'Un instant…' : libelleCta }}
            </button>
            <button
              v-else-if="scene.cta"
              class="cine-cta"
              type="button"
              :disabled="saving"
              @click.stop="terminer"
            >
              {{ saving ? 'J’installe tout…' : 'Entrer dans APIGO' }}
            </button>
          </div>
        </Transition>
      </div>

      <!-- Pied FIXE : la progression et la sortie ne bougent jamais d'une scène
           à l'autre, quelle que soit la hauteur du contenu au-dessus. -->
      <div class="cine-foot">
        <div class="cine-dots">
          <span
            v-for="(s, k) in SCENES"
            :key="s.id"
            class="cine-dot"
            :class="{ now: k === index, past: k < index }"
          />
        </div>

        <button v-if="peutPasser" class="cine-skip" type="button" @click.stop="passer">
          Passer l’intro
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { PLAN_CONFIGS, type Plan } from '~/config/plans';
import type { RucherSaisi } from '~/components/ia/onboarding/SceneRucher.vue';

/**
 * ONBOARDING CINÉMATIQUE MAYA.
 *
 * RÈGLE D'OR de cette refonte : on garde le CERVEAU de l'ancien onboarding
 * (Stripe, reprise après paiement, création rucher/ruches, préférences,
 * complétion) et on remplace la PEAU. Rien de la logique métier éprouvée en
 * production n'a été réinventé — seulement re-présenté.
 *
 * Réf. : `design/maya/ONBOARDING_INTEGRATION.md` et
 * `design/maya/mockup/onboarding/` (ordre des scènes, durées, transitions).
 */
definePageMeta({ layout: false });

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const mayaStore = useMayaStore();
const notifications = useNotifications();
const { createRucher } = useRuchers();
const { createRuchesBatch } = useRuches();
const { checkout } = useSubscription();

type Visual =
  | 'hello'
  | 'apigo'
  | 'pillars'
  | 'proposal'
  | 'profil'
  | 'presence'
  | 'plan'
  | 'rucher'
  | 'ruches'
  | 'modules'
  | 'ready';

interface Scene {
  id: string;
  visual: Visual;
  caption: string;
  sub?: string;
  /** Durée avant enchaînement automatique (ms). Absente = la scène attend. */
  dur?: number;
  wait?: boolean;
  cta?: boolean;
}

/** Ordre, durées et copie : reportés de `cinematic.jsx`, qui fait foi. */
const SCENES: Scene[] = [
  {
    id: 'hello',
    visual: 'hello',
    caption: 'Bonjour. Moi, c’est Maya.',
    sub: 'Ta binôme au rucher — je veille, tu décides.',
    dur: 4200,
  },
  {
    id: 'apigo',
    visual: 'apigo',
    caption: 'Bienvenue dans APIGO.',
    sub: 'Ton rucher connecté : le cheptel, les visites, la récolte — réunis, clairs, à jour.',
    dur: 5400,
  },
  {
    id: 'watch',
    visual: 'pillars',
    caption: 'Je veille sur ton cheptel, jour et nuit.',
    sub: 'Tu n’as plus à tout porter seul.',
    dur: 4800,
  },
  {
    id: 'propose',
    visual: 'proposal',
    caption: 'Et quand quelque chose compte, j’agis.',
    sub: 'Je repère, je te propose, et je m’en occupe — sous tes yeux.',
    dur: 7400,
  },
  {
    id: 'profil',
    visual: 'profil',
    caption: 'Tu es plutôt…',
    sub: 'Ça me sert à adapter APIGO à ta pratique.',
    wait: true,
  },
  {
    id: 'presence',
    visual: 'presence',
    caption: 'Comment veux-tu que je t’accompagne ?',
    sub: 'Tu pourras changer d’avis quand tu veux.',
    wait: true,
  },
  {
    id: 'plan',
    visual: 'plan',
    caption: 'On choisit ta formule ?',
    sub: 'Elle fixe le nombre de ruches — modifiable à tout moment.',
    wait: true,
  },
  {
    id: 'rucher',
    visual: 'rucher',
    caption: 'Créons ton premier rucher.',
    sub: 'Un nom, un emplacement — je m’occupe du reste.',
    wait: true,
  },
  {
    id: 'ruches',
    visual: 'ruches',
    caption: 'Combien de ruches y installe-t-on ?',
    sub: 'Je les prépare toutes d’un coup.',
    wait: true,
  },
  {
    id: 'modules',
    visual: 'modules',
    caption: 'Ce dont tu as besoin, maintenant.',
    sub: 'Pré-réglé selon ta pratique — ajuste si tu veux.',
    wait: true,
  },
  {
    id: 'ready',
    visual: 'ready',
    caption: 'Ton rucher prend vie.',
    sub: 'Tout est prêt — entrons ensemble.',
    cta: true,
  },
];
const indexDe = (id: string) => SCENES.findIndex((s) => s.id === id);

/**
 * Retour de Stripe : on ne fait pas RENAÎTRE Maya parce que l'apiculteur est
 * allé payer. Résolu ici, au setup — si on attendait `onMounted`, la naissance
 * s'afficherait le temps d'une image avant d'être remplacée.
 */
const retourStripe =
  route.query.checkout === 'success' ||
  route.query.trial === 'activated' ||
  route.query.success != null;

const phase = ref<'birth' | 'play'>(retourStripe ? 'play' : 'birth');
const titreVisible = ref(false);
const born = ref(retourStripe);
const index = ref(0);
const saving = ref(false);
const geoLoading = ref(false);
const acceptCgv = ref(false);
const createdRucherId = ref<string | null>(null);
const presence = ref<'partout' | 'discrete' | 'pause'>('partout');
const isWide = ref(false);

const form = reactive({
  profilApicole: 'loisir' as 'loisir' | 'professionnel' | 'pluri_actif',
  selectedPlan: 'trial' as 'decouverte' | 'trial' | 'starter' | 'pro' | 'expert',
  nbRuches: 3,
  rucheType: 'dadant_10',
  modulesActifs: [] as string[],
});
const rucher = reactive<RucherSaisi>({
  nom: '',
  commune: '',
  departement: '',
  environnement: '',
  latitude: undefined,
  longitude: undefined,
});

const scene = computed(() => SCENES[index.value]!);

/** États du logo vivant — chacun a un sens, on ne les tire pas au hasard. */
type EtatMark = 'idle' | 'think' | 'success';
const etatMark = computed<EtatMark>(() => {
  const m: Record<string, EtatMark> = { propose: 'think', ruches: 'think', ready: 'success' };
  return m[scene.value.id] ?? 'idle';
});

/** Plafond RÉEL du plan — jamais un chiffre écrit à la main. */
const maxRuches = computed(() => {
  const n = PLAN_CONFIGS[form.selectedPlan as Plan]?.limites?.ruches ?? 1;
  return n === Infinity ? 9999 : n;
});

const planDejaActif = computed(
  () => authStore.effectivePlan !== 'decouverte' || authStore.profil?.trialActive === true,
);

const peutAvancer = computed(() => {
  if (scene.value.id === 'rucher') return rucher.nom.trim().length > 0;
  // CGV obligatoires dès qu'un paiement est engagé.
  if (scene.value.id === 'plan') return form.selectedPlan === 'decouverte' || acceptCgv.value;
  return true;
});

const libelleCta = computed(() => {
  switch (scene.value.id) {
    case 'plan':
      return form.selectedPlan === 'decouverte' ? 'Continuer en Découverte' : 'Valider ma formule';
    case 'rucher':
      return 'Créer mon rucher';
    case 'ruches':
      return 'Préparer mes ruches';
    default:
      return 'Continuer';
  }
});

/** « Passer l'intro » n'a de sens que pendant la narration. */
const peutPasser = computed(() => !scene.value.wait && !scene.value.cta);

/**
 * Poussière de miel qui monte en fond. Le tirage est VOLONTAIREMENT déterministe :
 * un `Math.random()` donnerait au serveur et au navigateur deux résultats
 * différents, et Vue réécrirait toute la couche à l'hydratation.
 *
 * Les quatre dimensions sont indispensables : sans `width`/`height` le span reste
 * à zéro pixel et la couche entière est invisible — c'était le cas.
 */
function mote(i: number): Record<string, string> {
  const taille = 3 + ((i * 13) % 8);
  return {
    left: `${(i * 37) % 100}%`,
    bottom: `${(i * 17) % 40}%`,
    width: `${taille}px`,
    height: `${taille}px`,
    animationDelay: `${((i * 5.7) % 8).toFixed(1)}s`,
    animationDuration: `${7 + ((i * 3) % 8)}s`,
  };
}

// ── Enchaînement automatique ───────────────────────────────────────────────
/** Minuteries de la naissance : purgées si l'apiculteur quitte avant la fin. */
const naissance: Array<ReturnType<typeof setTimeout>> = [];
let minuteur: ReturnType<typeof setTimeout> | null = null;
function stop() {
  if (minuteur) {
    clearTimeout(minuteur);
    minuteur = null;
  }
}
function armer() {
  stop();
  const s = scene.value;
  if (s.dur && !s.wait && !s.cta) minuteur = setTimeout(suivant, s.dur);
}
function suivant() {
  stop();
  index.value = Math.min(SCENES.length - 1, index.value + 1);
}
/** Tapoter accélère la narration — jamais un écran qui attend un choix. */
function tap() {
  if (phase.value === 'play' && peutPasser.value) suivant();
}
/**
 * Passer l'intro mène droit à la CONSTRUCTION (décision produit du 22/07).
 * Garde-fou : si la formule n'est pas encore active, on s'arrête d'abord
 * dessus — elle fixe le plafond de ruches et déclenche Stripe. On saute la
 * narration, jamais les choix qui engagent.
 */
function passer() {
  stop();
  index.value = indexDe(planDejaActif.value ? 'rucher' : 'plan');
}

watch([phase, index], () => {
  if (phase.value === 'play') armer();
  sauver();
});
onBeforeUnmount(() => {
  stop();
  naissance.forEach(clearTimeout);
});

// ── Effets métier, repris tels quels de l'ancien onboarding ────────────────
async function avancer() {
  if (!peutAvancer.value) return;
  saving.value = true;
  try {
    // FORMULE → Stripe, sauf Découverte : on QUITTE la page ici.
    if (scene.value.id === 'plan' && form.selectedPlan !== 'decouverte') {
      sauver();
      if (form.selectedPlan === 'trial') {
        const r = await $fetch<{ data: { url: string } }>('/api/stripe/trial-checkout', {
          method: 'POST',
        });
        await navigateTo(r.data.url, { external: true });
      } else {
        await checkout(
          form.selectedPlan as 'starter' | 'pro' | 'expert',
          'mois',
          'onboarding',
          acceptCgv.value,
        );
      }
      return;
    }

    if (scene.value.id === 'rucher' && !createdRucherId.value && rucher.nom.trim()) {
      const cree = await createRucher({
        nom: rucher.nom.trim(),
        commune: rucher.commune || undefined,
        departement: rucher.departement || undefined,
        environnement: rucher.environnement || undefined,
        latitude: rucher.latitude,
        longitude: rucher.longitude,
      });
      createdRucherId.value = cree.id;
    }

    if (scene.value.id === 'ruches' && createdRucherId.value) {
      const n = Math.min(form.nbRuches, maxRuches.value);
      if (n > 0) {
        await createRuchesBatch(
          Array.from({ length: n }, (_, k) => ({
            rucherId: createdRucherId.value!,
            numero: `Ruche ${k + 1}`,
            type: form.rucheType,
          })),
        );
      }
    }

    suivant();
  } catch (e) {
    notifications.error(getApiErrorMessage(e, 'Une erreur est survenue'));
  } finally {
    saving.value = false;
  }
}

async function terminer() {
  saving.value = true;
  try {
    await authStore.updateProfil({
      preferences: {
        ...(authStore.profil?.preferences ?? {}),
        profilApicole: form.profilApicole,
        mayaPresence: presence.value,
        modulesActifs: form.modulesActifs,
        onboardingCompletedAt: new Date().toISOString(),
        tutorialsCompleted: [],
        tutorialsDismissed: false,
      },
    });
    mayaStore.setPresence(presence.value);
    await authStore.completeOnboarding();
    oublier();
    // Un profil loisir arrive sur sa première visite, pas sur un tableau de bord.
    await router.push(
      form.profilApicole === 'professionnel' ? '/dashboard' : '/interventions/nouvelle',
    );
  } catch (e) {
    notifications.error(getApiErrorMessage(e, 'Erreur lors de la finalisation'));
  } finally {
    saving.value = false;
  }
}

/** Géolocalisation — reprise à l'identique de l'ancien onboarding. */
function detectLocation() {
  if (!import.meta.client || !navigator.geolocation) return;
  geoLoading.value = true;
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      rucher.latitude = Math.round(pos.coords.latitude * 1e7) / 1e7;
      rucher.longitude = Math.round(pos.coords.longitude * 1e7) / 1e7;
      geoLoading.value = false;
    },
    () => {
      geoLoading.value = false;
      notifications.warning('Impossible de détecter ta position');
    },
  );
}

// ── Persistance : survit au détour par Stripe et à un rafraîchissement ─────
const CLE = 'apigo:onboarding:cine';
function sauver() {
  if (!import.meta.client) return;
  localStorage.setItem(
    CLE,
    JSON.stringify({ scene: scene.value.id, form, rucher, presence: presence.value }),
  );
}
function oublier() {
  if (import.meta.client) localStorage.removeItem(CLE);
}

/** Le webhook Stripe peut tarder : on laisse au plan le temps de s'activer. */
async function attendrePlanActif(essais = 8): Promise<void> {
  for (let i = 0; i < essais; i++) {
    await authStore.fetchProfil();
    if (planDejaActif.value) return;
    await new Promise((r) => setTimeout(r, 1200));
  }
}

onMounted(async () => {
  isWide.value = window.innerWidth >= 900;

  const prefs = authStore.profil?.preferences as Record<string, unknown> | undefined;
  if (prefs?.mayaPresence) presence.value = prefs.mayaPresence as typeof presence.value;

  const brut = localStorage.getItem(CLE);
  if (brut) {
    try {
      const snap = JSON.parse(brut);
      Object.assign(form, snap.form ?? {});
      Object.assign(rucher, snap.rucher ?? {});
      if (snap.presence) presence.value = snap.presence;
    } catch {
      oublier();
    }
  }

  if (retourStripe) {
    await attendrePlanActif();
    index.value = indexDe('rucher');
    return;
  }

  // Le tempo de la naissance, reporté au millième de `cinematic.jsx`. Les trois
  // temps se recouvrent volontairement : les alvéoles finissent d'arriver
  // pendant que le titre monte, et la respiration démarre avant la fin du
  // fondu. C'est ce chevauchement qui donne l'impression d'un être qui s'éveille
  // plutôt que d'une suite d'étapes.
  naissance.push(setTimeout(() => (titreVisible.value = true), 1100));
  naissance.push(setTimeout(() => (born.value = true), 1600));
  naissance.push(
    setTimeout(() => {
      phase.value = 'play';
      index.value = 0;
    }, 2600),
  );
});
</script>

<style src="~/assets/css/maya-onboarding.css"></style>
