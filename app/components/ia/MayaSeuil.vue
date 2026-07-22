<template>
  <div v-if="visible" class="seuil" :class="phase === 'gestes' ? 'is-open is-acts' : 'is-open'">
    <div class="seuil-voile" />
    <div class="seuil-wash" />
    <div class="seuil-ring" style="--rd: 0s" />
    <div class="seuil-ring" style="--rd: 0.22s" />

    <div class="seuil-mark" :class="coin">
      <IaMayaMark :size="large ? 120 : 100" :state="phase === 'gestes' ? 'idle' : 'success'" />
    </div>

    <div class="seuil-scrim" />

    <div class="seuil-acts">
      <div class="seuil-card">
        <span class="seuil-eyebrow"><IaMayaMark :size="16" state="idle" /> Maya te guide</span>
        <h2 class="seuil-h">Par quoi on commence ?</h2>
        <p class="seuil-say">{{ phrase }}</p>

        <div class="seuil-liste">
          <NuxtLink
            v-for="(g, i) in gestes"
            :key="g.to"
            :to="g.to"
            class="seuil-act"
            :class="{ 'is-reco': i === 0 }"
            @click="fermer"
          >
            <span class="seuil-act-ico"><UIcon :name="g.icone" /></span>
            <span class="seuil-act-corps">
              <span class="seuil-act-t">
                {{ g.titre }}<span v-if="i === 0" class="seuil-badge">Conseillé</span>
              </span>
              <span class="seuil-act-d">{{ g.detail }}</span>
            </span>
            <UIcon name="i-lucide-chevron-right" class="seuil-act-chev" />
          </NuxtLink>
        </div>

        <button class="seuil-later" type="button" @click="fermer">
          Plus tard — explorer mon tableau de bord
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { hasFeature, type Plan, type PlanFeatures } from '~/config/plans';

/**
 * LE SEUIL — le passage de l'onboarding au tableau de bord.
 *
 * Monté dans le layout par défaut, il ne se déclenche que sur `?welcome=1`,
 * posé par la fin de l'onboarding. Il recouvre le VRAI tableau de bord pendant
 * qu'il se charge, puis s'efface et propose le premier geste.
 *
 * Pourquoi un premier geste plutôt qu'un tableau de bord vide : à cet instant
 * le compte ne contient qu'un rucher et des ruches. Un tableau de bord sans
 * données ne dit rien à personne — et surtout pas à un débutant, qui referme
 * l'application sans savoir par où entrer.
 *
 * RÈGLE ABSOLUE : on ne propose JAMAIS un geste que la formule verrouille.
 * Chaque entrée passe par `hasFeature()` — proposer « Ton premier client » à un
 * compte Découverte, c'est l'envoyer sur un mur payant deux minutes après son
 * inscription.
 *
 * Animations et géométrie : `app/assets/css/maya-seuil.css`.
 */
const route = useRoute();
const router = useRouter();
const maya = useMayaStore();
const authStore = useAuthStore();
const { currentPlan, trialActive } = useSubscription();

const large = useMediaQuery('(min-width: 900px)');
const mouvementReduit = useMediaQuery('(prefers-reduced-motion: reduce)');

/**
 * Signalé à toute l'application : tant que le Seuil joue, rien d'autre ne doit
 * s'inviter par-dessus. La bannière de consentement, en z-index 9999, masquait
 * la moitié basse du panneau.
 */
const visible = useState('maya-seuil-actif', () => false);
const phase = ref<'ouverture' | 'gestes'>('ouverture');
let bascule: ReturnType<typeof setTimeout> | null = null;

/** Maya rejoint le coin où elle vivra ensuite — la présence choisie a un effet visible tout de suite. */
const coin = computed(() => (maya.presence === 'partout' ? 'to-tl' : 'to-br'));

// ── Le catalogue des premiers gestes ────────────────────────────────────────
type Geste = {
  to: string;
  icone: string;
  titre: string;
  detail: string;
  /** Verrou de formule. Absent = accessible à tous. */
  feature?: keyof PlanFeatures;
};

const GESTES: Record<string, Geste> = {
  visite: {
    to: '/interventions/nouvelle',
    icone: 'i-lucide-clipboard-check',
    titre: 'Ta première visite',
    detail: 'Ouvre une ruche, note ce que tu vois. Je m’occupe du reste.',
  },
  calendrier: {
    to: '/calendrier',
    icone: 'i-lucide-calendar',
    titre: 'Planifie ta semaine',
    detail: 'Je te propose une cadence, tu la corriges si elle ne te va pas.',
  },
  ruches: {
    to: '/ruches',
    icone: 'i-lucide-grid-2x2',
    titre: 'Repère tes ruches',
    detail: 'Une couleur, un nom — pour les retrouver d’un coup d’œil.',
    feature: 'couleursRuches',
  },
  production: {
    to: '/production',
    icone: 'i-lucide-droplet',
    titre: 'Prépare la récolte',
    detail: 'Miellées, lots, traçabilité — la chaîne complète.',
    feature: 'production',
  },
  clients: {
    to: '/clients',
    icone: 'i-lucide-users',
    titre: 'Ton premier client',
    detail: 'Fiche, ventes, factures — tout part de là.',
    feature: 'clients',
  },
  equipe: {
    to: '/parametres/equipe',
    icone: 'i-lucide-user-plus',
    titre: 'Invite ton équipe',
    detail: 'Chacun son rôle, chacun ses accès.',
    feature: 'rolesEquipe',
  },
  transhumance: {
    to: '/transhumance',
    icone: 'i-lucide-truck',
    titre: 'Prépare la transhumance',
    detail: 'Emplacements, floraisons, plans de déplacement.',
    feature: 'transhumance',
  },
};

/**
 * Ordre par formule — le premier est la recommandation de Maya (§9.3 de la spec).
 *
 * Il n'y a PAS d'entrée « essai » : un compte à l'essai porte `plan: 'pro'` avec
 * `trialActive: true`, donc `effectivePlan` vaut déjà `pro`. Une clé `trial`
 * ici n'aurait jamais été atteinte — elle aurait juste laissé croire que le cas
 * était traité.
 */
const ORDRE: Record<Plan, string[]> = {
  decouverte: ['visite', 'ruches'],
  starter: ['visite', 'calendrier', 'ruches'],
  pro: ['production', 'clients', 'visite'],
  expert: ['equipe', 'transhumance', 'clients'],
};

const PHRASE: Record<Plan, string> = {
  decouverte: 'Tu as tout ce qu’il faut pour commencer. Le plus simple, c’est d’ouvrir une ruche.',
  starter: 'Ton rucher est prêt. On commence par une visite — je note tout au fur et à mesure.',
  pro: 'Tout est en place. Autant démarrer par ce qui te rapporte.',
  expert: 'Ton exploitation est prête. Commence par ceux qui vont travailler avec toi.',
};

/** L'essai se dit, lui : c'est une information utile, pas un plan à part. */
const PHRASE_ESSAI =
  'Tu as l’essai Pro en main, offert 60 jours. Autant en profiter tout de suite.';

const plan = computed(() => currentPlan.value);
const phrase = computed(() => (trialActive.value ? PHRASE_ESSAI : PHRASE[plan.value]));

const gestes = computed<Geste[]>(() => {
  const ouverts = ORDRE[plan.value]
    .map((c) => GESTES[c])
    .filter((g): g is Geste => !!g && (!g.feature || hasFeature(plan.value, g.feature)));

  // Un apiculteur de loisir en Pro n'a pas de client à créer ce matin : la
  // première visite passe devant. Le plan dit ce qui est POSSIBLE, la pratique
  // dit ce qui est UTILE.
  const profil = (authStore.profil?.preferences as Record<string, unknown> | undefined)
    ?.profilApicole;
  if (profil === 'loisir') {
    const i = ouverts.findIndex((g) => g.to === GESTES.visite!.to);
    if (i > 0) ouverts.unshift(...ouverts.splice(i, 1));
  }

  // Filet : si une formule verrouillait tout, la visite reste toujours ouverte.
  return ouverts.length ? ouverts : [GESTES.visite!];
});

// ── Déclenchement ───────────────────────────────────────────────────────────
function fermer() {
  visible.value = false;
  if (bascule) clearTimeout(bascule);
}

function jouer() {
  visible.value = true;
  phase.value = 'ouverture';

  // Le drapeau est retiré de l'URL DÈS le départ, pas à la fermeture : sinon un
  // retour arrière depuis la page où l'apiculteur vient d'aller le ramène sur
  // `?welcome=1` et rejoue toute la séquence.
  //
  // Après `nextTick` : le veilleur s'exécute une première fois pendant le setup
  // du layout, et toucher au routeur à ce moment-là revient à naviguer avant que
  // la navigation en cours soit terminée.
  void nextTick(() => {
    const q = { ...route.query };
    delete q.welcome;
    void router.replace({ path: route.path, query: q });
  });

  if (mouvementReduit.value) {
    phase.value = 'gestes';
    return;
  }
  bascule = setTimeout(() => (phase.value = 'gestes'), 1450);
}

// `watch` immédiat plutôt qu'`onMounted` : le layout peut déjà être monté quand
// l'onboarding pousse vers `/dashboard?welcome=1`, auquel cas `onMounted` ne
// serait jamais rappelé et le Seuil ne se jouerait pas.
watch(
  () => route.query.welcome,
  (v) => {
    if (v === '1' && !visible.value) jouer();
  },
  { immediate: true },
);

onBeforeUnmount(() => {
  if (bascule) clearTimeout(bascule);
});
</script>

<style src="~/assets/css/maya-seuil.css"></style>
