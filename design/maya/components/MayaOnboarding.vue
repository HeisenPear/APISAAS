<!--
  MayaOnboarding.vue — REMPLACE app/pages/onboarding.vue
  ────────────────────────────────────────────────────────────────────────
  Coquille cinématique de l'onboarding Maya. Porte la MÊME machine à états que
  l'ancien onboarding.vue (Stripe, création rucher/ruches, préférences,
  complétion) sous une nouvelle peau.

  À LIRE AVANT : design/maya/handoff/ONBOARDING_INTEGRATION.md (contrats d'API,
  reprise Stripe, persistance présence, plafonds plan).
  Réf. visuel/rythme EXACT : design/maya/mockup/onboarding/ (cinematic.jsx +
  "Maya - La naissance.html"). Reporte les durées, transitions et copie de là.

  Ce fichier est un SCAFFOLD : la structure et la logique sont justes ; les
  <Scene*/> sont à extraire du .jsx (un composant par scène sous
  app/components/ia/onboarding/). Styles : app/assets/css/main.css (bloc maya.css).
-->
<template>
  <div class="cine-stage" @click="tap">
    <!-- Particules / fond : cf. mockup. Décoratif, pointer-events:none. -->
    <div class="cine-bg" aria-hidden="true" />

    <!-- ── NAISSANCE (une seule fois, jamais en reprise Stripe) ── -->
    <MayaBirth v-if="phase === 'birth'" :play="birthPlay" :born="born" />

    <!-- ── RÉCIT AUTO ── -->
    <div v-else class="cine-play">
      <!-- Ancre-logo FIXE : rendue une fois, hors de la zone qui change.
           Ne se recharge jamais entre les scènes (cf. exigence produit). -->
      <div class="cine-anchor-wrap">
        <div class="cine-anchor cine-anchor-in">
          <IaMayaMark :size="isWide ? 88 : 72" :state="anchorState" />
        </div>

        <!-- Seul le texte + le visuel changent (sortie douce → entrée douce). -->
        <Transition name="cine-scene" mode="out-in">
          <div :key="current.id" class="cine-scene-body">
            <div class="cine-voice">
              <!-- Typo cinétique : révélation mot à mot (cf. WordCap du .jsx). -->
              <CineCaption :text="current.caption" :size="isWide ? 40 : 30" />
              <p v-if="current.sub" class="cine-sub cine-subfade">{{ current.sub }}</p>
            </div>

            <div class="cine-vis-in">
              <SceneHello    v-if="current.visual === 'hello'" />
              <SceneApigo    v-else-if="current.visual === 'apigo'" />
              <SceneProfil   v-else-if="current.visual === 'profil'"   v-model="form.profilApicole" />
              <ScenePresence v-else-if="current.visual === 'presence'" v-model="presence" />
              <ScenePlan     v-else-if="current.visual === 'plan'"     v-model="form.selectedPlan" v-model:cgv="acceptCgv" />
              <SceneRucher   v-else-if="current.visual === 'rucher'"   v-model="rucher" @geo="useGeo" :geo-loading="geoLoading" />
              <SceneRuches   v-else-if="current.visual === 'ruches'"   v-model:nb="form.nbRuches" v-model:type="form.rucheType" :cap="maxRuches" />
              <SceneModules  v-else-if="current.visual === 'modules'"  v-model="form.modulesActifs" :profil="form.profilApicole" />
              <SceneReady    v-else-if="current.visual === 'ready'"    :form="form" :rucher="rucher" :presence="presence" />
            </div>

            <!-- Boutons : TEXTE SEUL, aucun symbole (cf. exigence produit). -->
            <button v-if="current.wait" class="cine-cta" :disabled="saving || !canAdvance" @click.stop="advance">
              {{ ctaLabel }}
            </button>
            <button v-else-if="current.cta" class="cine-cta" :disabled="saving" @click.stop="finish">
              {{ presence === 'partout' ? 'Voir mon premier point du jour' : 'Entrer dans APIGO' }}
            </button>
          </div>
        </Transition>
      </div>

      <!-- Passer l'intro : uniquement pendant les scènes de pure présentation. -->
      <div class="cine-foot">
        <button v-if="!current.wait && !current.cta" class="cine-skip" @click.stop="skip">
          Passer l'intro
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { PLAN_CONFIGS } from '~/config/plans';

definePageMeta({ layout: false }); // plein écran, hors chrome de l'app

// ── Dépendances métier (reprises telles quelles de l'ancien onboarding.vue) ──
const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const mayaStore = useMayaStore();            // app/stores/maya.ts (créé en P1)
const analytics = useAnalytics();
const notifications = useNotifications();
const { createRucher } = useRuchers();
const { createRuchesBatch } = useRuches();
const { checkout } = useSubscription();

// ── Scènes : ordre + durées = source de vérité dans cinematic.jsx ──
type Visual =
  | 'hello' | 'apigo' | 'profil' | 'presence'
  | 'plan' | 'rucher' | 'ruches' | 'modules' | 'ready';
interface Scene { id: string; caption: string; sub?: string; visual: Visual; dur?: number; wait?: boolean; cta?: boolean }

const SCENES: Scene[] = [
  { id: 'hello',    visual: 'hello',    caption: "Bonjour. Moi, c'est Maya.",          sub: 'Ta binôme au rucher — je veille, tu décides.', dur: 4200 },
  { id: 'apigo',    visual: 'apigo',    caption: 'Bienvenue dans APIGO.',              sub: 'Ton rucher connecté : cheptel, visites, récolte — réunis, clairs, à jour.', dur: 5400 },
  { id: 'profil',   visual: 'profil',   caption: 'Tu es plutôt…',                      sub: 'Ça me sert à adapter APIGO à ta pratique.', wait: true },
  { id: 'watch',    visual: 'hello',    caption: 'Je veille sur ton cheptel, jour et nuit.', sub: "Tu n'as plus à tout porter seul.", dur: 4800 },
  { id: 'propose',  visual: 'apigo',    caption: "Et quand quelque chose compte, j'agis.", sub: 'Je repère, je te propose, et je m’en occupe — sous tes yeux.', dur: 7400 },
  { id: 'presence', visual: 'presence', caption: "Comment veux-tu que je t'accompagne ?", sub: "Tu pourras changer d'avis quand tu veux.", wait: true },
  { id: 'plan',     visual: 'plan',     caption: 'On choisit ta formule ?',            sub: 'Elle fixe le nombre de ruches — modifiable à tout moment.', wait: true },
  { id: 'rucher',   visual: 'rucher',   caption: 'Créons ton premier rucher.',         sub: "Un nom, un emplacement — je m'occupe du reste.", wait: true },
  { id: 'ruches',   visual: 'ruches',   caption: 'Combien de ruches y installe-t-on ?', sub: 'Je les prépare toutes d’un coup.', wait: true },
  { id: 'modules',  visual: 'modules',  caption: 'Ce dont tu as besoin, maintenant.',  sub: 'Pré-réglé selon ta pratique — ajuste si tu veux.', wait: true },
  { id: 'ready',    visual: 'ready',    caption: 'Ton rucher prend vie.',              sub: 'Tout est prêt — entrons ensemble.', cta: true },
];
const idxOf = (id: string) => SCENES.findIndex((s) => s.id === id);

// ── État ──
const phase = ref<'birth' | 'play'>('birth');
const birthPlay = ref(false);
const born = ref(false);
const i = ref(0);
const saving = ref(false);
const geoLoading = ref(false);
const acceptCgv = ref(false);
const createdRucherId = ref<string | null>(null);
const presence = ref<'partout' | 'discrete' | 'pause'>('discrete');

const form = reactive({
  profilApicole: 'loisir' as 'loisir' | 'professionnel' | 'pluri_actif',
  selectedPlan: 'trial' as 'decouverte' | 'trial' | 'starter' | 'pro' | 'expert',
  nbRuches: 3,
  rucheType: 'dadant_10',
  modulesActifs: [] as string[],
  alertesEssaim: true,
  alertesMeteo: true,
  rappelsInterventions: true,
});
const rucher = reactive({
  nom: '', commune: '', departement: '', environnement: '',
  latitude: undefined as number | undefined, longitude: undefined as number | undefined,
});

const current = computed(() => SCENES[i.value]);
const isWide = computed(() => import.meta.client && window.innerWidth >= 900);

// Plafond ruches = vraies limites du plan (jamais en dur — cf. §6 du doc)
const maxRuches = computed(() => {
  const lim = PLAN_CONFIGS[form.selectedPlan]?.limites?.ruches ?? 1;
  return lim === Infinity ? 9999 : lim;
});
watch(maxRuches, (cap) => { if (form.nbRuches > cap) form.nbRuches = cap; });

const anchorState = computed(() => {
  const map: Record<string, string> = { propose: 'think', ruches: 'think', ready: 'success' };
  return map[current.value.id] ?? 'idle';
});
const canAdvance = computed(() => {
  if (current.value.id === 'rucher') return rucher.nom.trim().length > 0;
  if (current.value.id === 'plan')
    return form.selectedPlan === 'decouverte' || acceptCgv.value; // CGV requises pour les plans payants
  return true;
});
const ctaLabel = computed(() => {
  switch (current.value.id) {
    case 'ruches': return 'Créer mon rucher';
    case 'presence': return 'Valider mon choix';
    case 'plan': return form.selectedPlan === 'decouverte' ? 'Continuer en Découverte' : 'Valider ma formule';
    default: return 'Continuer';
  }
});

// ── Moteur auto : les scènes de présentation s'enchaînent seules ──
let timer: ReturnType<typeof setTimeout> | null = null;
const clear = () => { if (timer) { clearTimeout(timer); timer = null; } };
function arm() {
  clear();
  const s = current.value;
  if (s.dur && !s.wait && !s.cta) timer = setTimeout(next, s.dur);
}
function next() { clear(); i.value = Math.min(SCENES.length - 1, i.value + 1); }
function tap() { const s = current.value; if (phase.value === 'play' && !s.wait && !s.cta) next(); }
function skip() { clear(); i.value = idxOf('profil'); } // saute la présentation, garde les vrais choix
watch([phase, i], () => { if (phase.value === 'play') arm(); saveProgress(); });
onBeforeUnmount(clear);

// ── advance() : porte les effets de bord métier de l'ancien nextStep() ──
async function advance() {
  if (!canAdvance.value) return;
  saving.value = true;
  try {
    // Étape PLAN → Stripe (sauf Découverte). Cf. §1 du doc : redirection externe.
    if (current.value.id === 'plan' && form.selectedPlan !== 'decouverte') {
      saveProgress();
      if (form.selectedPlan === 'trial') {
        await $fetch<{ data: { url: string } }>('/api/stripe/trial-checkout', { method: 'POST' })
          .then((r) => navigateTo(r.data.url, { external: true }));
      } else {
        await checkout(form.selectedPlan as 'starter' | 'pro' | 'expert', 'mois', 'onboarding', acceptCgv.value);
      }
      return; // on quitte la page ; reprise au retour de Stripe (voir onMounted)
    }

    // Sortie de la scène RUCHER → crée le rucher
    if (current.value.id === 'rucher' && !createdRucherId.value && rucher.nom) {
      const created = await createRucher({
        nom: rucher.nom,
        commune: rucher.commune || undefined,
        departement: rucher.departement || undefined,
        environnement: rucher.environnement || undefined,
        latitude: rucher.latitude,
        longitude: rucher.longitude,
      });
      createdRucherId.value = created.id;
      analytics.capture('rucher_created', { source: 'onboarding' });
    }

    // Sortie de la scène RUCHES → crée les ruches en batch (borné au plan)
    if (current.value.id === 'ruches' && createdRucherId.value) {
      const nb = Math.min(form.nbRuches, maxRuches.value);
      if (nb > 0) {
        await createRuchesBatch(
          Array.from({ length: nb }, (_, k) => ({
            rucherId: createdRucherId.value!, numero: `Ruche ${k + 1}`, type: form.rucheType,
          })),
        );
        analytics.capture('ruche_created', { source: 'onboarding', count: nb });
      }
    }

    analytics.capture('onboarding_step_completed', { scene: current.value.id });
    next();
  } catch (e) {
    notifications.error(getApiErrorMessage(e, 'Erreur lors de la sauvegarde'));
  } finally {
    saving.value = false;
  }
}

// ── finish() : reprend finishOnboarding() à l'identique + persiste la présence ──
async function finish() {
  saving.value = true;
  try {
    await authStore.updateProfil({
      preferences: {
        ...(authStore.profil?.preferences ?? {}),
        profilApicole: form.profilApicole,
        mayaPresence: presence.value,            // ← pilote le store Maya dans toute l'app
        modulesActifs: form.modulesActifs,
        alertesEssaim: form.alertesEssaim,
        alertesMeteo: form.alertesMeteo,
        rappelsInterventions: form.rappelsInterventions,
        onboardingCompletedAt: new Date().toISOString(),
        tutorialsCompleted: [],
        tutorialsDismissed: false,
      },
    });
    mayaStore.setPresence(presence.value);
    await authStore.completeOnboarding();
    analytics.capture('onboarding_completed', {
      profil_apicole: form.profilApicole, plan_selected: form.selectedPlan,
      modules_actifs: form.modulesActifs, nb_ruches: form.nbRuches, maya_presence: presence.value,
    });
    clearProgress();
    await router.push(
      form.profilApicole === 'loisir' || form.profilApicole === 'pluri_actif'
        ? '/interventions/nouvelle' : '/dashboard',
    );
  } catch (e) {
    notifications.error(getApiErrorMessage(e, 'Erreur lors de la finalisation'));
  } finally {
    saving.value = false;
  }
}

// ── Géoloc (repris de l'ancien onboarding) : remplit latitude/longitude/commune ──
async function useGeo() {
  geoLoading.value = true;
  try { /* navigator.geolocation → reverse-geocode → rucher.commune/departement/lat/lng */ }
  finally { geoLoading.value = false; }
}

// ── Persistance de progression (reprise après Stripe / refresh) ──
const KEY = 'apigo:onboarding:cine';
function saveProgress() {
  if (!import.meta.client) return;
  localStorage.setItem(KEY, JSON.stringify({ scene: current.value.id, form, rucher, presence: presence.value }));
}
function clearProgress() { if (import.meta.client) localStorage.removeItem(KEY); }
function restore() {
  const raw = import.meta.client && localStorage.getItem(KEY);
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}

// ── Reprise au retour de Stripe : NE PAS rejouer la naissance ni l'intro ──
async function waitForPlanActive(maxTries = 8): Promise<boolean> {
  for (let t = 0; t < maxTries; t++) {
    await authStore.fetchProfil();
    if (authStore.effectivePlan !== 'decouverte' || authStore.profil?.trialActive) return true;
    await new Promise((r) => setTimeout(r, 1200));
  }
  return false;
}

onMounted(async () => {
  // hydrate le choix de présence par défaut depuis le compte
  const pref = authStore.profil?.preferences as Record<string, unknown> | undefined;
  if (pref?.mayaPresence) presence.value = pref.mayaPresence as typeof presence.value;

  const snap = restore();
  if (snap) { Object.assign(form, snap.form); Object.assign(rucher, snap.rucher); if (snap.presence) presence.value = snap.presence; }

  const backFromStripe =
    route.query.checkout === 'success' || route.query.trial === 'activated' || route.query.success != null;

  if (backFromStripe) {
    // reprise directe : plan payé → on saute la présentation, on va construire le rucher
    phase.value = 'play';
    born.value = true;
    await waitForPlanActive();
    i.value = idxOf('rucher');
    return;
  }

  // Parcours normal : naissance → récit auto
  birthPlay.value = true;
  setTimeout(() => { born.value = true; }, 2600);           // durée naissance : cf. .jsx
  setTimeout(() => { phase.value = 'play'; i.value = 0; }, 3200);
});
</script>
