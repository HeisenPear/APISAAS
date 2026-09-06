<!--
  MayaSeuil.vue — L'ENTRÉE DANS APIGO + le premier geste (par formule)
  ────────────────────────────────────────────────────────────────────────
  Overlay joué une fois juste après l'onboarding : onde de miel + deux hexagones
  qui s'ouvrent + cross-dissolve vers le dashboard + le rayon glisse vers son coin,
  puis Maya propose LE bon premier geste selon la formule.

  À LIRE : design/maya/handoff/ONBOARDING_INTEGRATION.md §9.
  Réf. visuel/timings EXACTS : design/maya/mockup/onboarding/ (composant Seuil + CSS .seuil-*).

  Montage recommandé : dans app/layouts/default.vue, affiché si route.query.welcome === '1'
  (finishOnboarding() redirige vers /dashboard?welcome=1). L'anim recouvre le vrai dashboard
  qui s'hydrate dessous ; à la fin, on nettoie le flag pour ne pas rejouer au refresh.

  SOBRE : pas de pavage nid-d'abeille plein écran. Onde + 2 anneaux, easings lents.
-->
<template>
  <Teleport to="body">
    <div class="seuil" :class="phase === 'acts' ? 'is-open is-acts' : 'is-open'">
      <!-- onde de miel unique -->
      <div class="seuil-wash" aria-hidden="true" />
      <!-- deux hexagones qui s'ouvrent depuis le rayon -->
      <div class="seuil-ring" style="--rd: 0s" aria-hidden="true" />
      <div class="seuil-ring" style="--rd: 0.22s" aria-hidden="true" />
      <!-- le rayon voyage vers son coin de présence -->
      <div class="seuil-mark" :class="corner">
        <IaMayaMark :size="isWide ? 120 : 100" :state="phase === 'acts' ? 'idle' : 'success'" />
      </div>

      <div class="seuil-scrim" aria-hidden="true" />

      <!-- panneau premier geste -->
      <div class="seuil-acts" :style="panelStyle">
        <div class="seuil-card">
          <span class="seuil-eyebrow"><IaMayaMark :size="16" state="idle" /> Maya te guide</span>
          <h2 class="seuil-h">Par quoi on commence ?</h2>
          <p class="seuil-say">{{ say }}</p>
          <div class="seuil-list">
            <NuxtLink
              v-for="(a, i) in acts" :key="a.to" :to="a.to"
              class="seuil-act" :class="{ 'is-reco': i === 0 }" @click="dismiss">
              <span class="seuil-act-ico"><UIcon :name="a.icon" /></span>
              <span class="seuil-act-body">
                <span class="seuil-act-t">{{ a.t }}<span v-if="i === 0" class="seuil-badge">Conseillé</span></span>
                <span class="seuil-act-d">{{ a.d }}</span>
              </span>
              <UIcon name="i-lucide-chevron-right" class="seuil-act-chev" />
            </NuxtLink>
          </div>
          <button class="seuil-later" @click="dismiss">Plus tard — explorer mon tableau de bord</button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { hasFeature } from '~/config/plans';

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const mayaStore = useMayaStore();
const { currentPlan } = useSubscription();

const phase = ref<'reveal' | 'acts'>('reveal');
const isWide = computed(() => import.meta.client && window.innerWidth >= 900);

const presence = computed(() => mayaStore.presence ?? 'discrete');
const corner = computed(() => (presence.value === 'partout' ? 'to-tl' : 'to-br'));
const profil = computed(
  () => (authStore.profil?.preferences as any)?.profilApicole ?? 'loisir',
);

// Catalogue des premiers gestes — routes RÉELLES du SaaS. `feat` = feature requise (plans.ts).
type Act = { key: string; icon: string; t: string; d: string; to: string; feat?: string };
const CATALOG: Record<string, Act> = {
  visite:   { key: 'visite',   icon: 'i-lucide-shield-check', t: 'Ta première visite',      d: "On note l'état de la colonie en 30 secondes.",      to: '/interventions/nouvelle' },
  semaine:  { key: 'semaine',  icon: 'i-lucide-calendar',     t: 'Planifie ta semaine',     d: 'Je répartis tes visites sur les prochains jours.',  to: '/calendrier' },
  colorier: { key: 'colorier', icon: 'i-lucide-sparkles',     t: 'Colorie tes ruches',      d: "Un code couleur pour les repérer d'un coup d'œil.", to: '/ruches', feat: 'couleursRuches' },
  recolte:  { key: 'recolte',  icon: 'i-lucide-droplet',      t: 'Prépare la récolte',      d: 'Hausses, miellée et objectifs de la saison.',       to: '/production', feat: 'production' },
  client:   { key: 'client',   icon: 'i-lucide-credit-card',  t: 'Ton premier client',      d: 'Prépare la vente de ta récolte, facture incluse.',  to: '/clients', feat: 'clients' },
  equipe:   { key: 'equipe',   icon: 'i-lucide-users',        t: 'Invite ton équipe',       d: 'Partage le rucher avec tes collaborateurs.',        to: '/parametres', feat: 'multiUsers' },
  transhum: { key: 'transhum', icon: 'i-lucide-map-pin',      t: 'Prépare la transhumance', d: 'Emplacements et carte mellifère de tes ruchers.',   to: '/transhumance', feat: 'transhumance' },
};
const BY_PLAN: Record<string, string[]> = {
  decouverte: ['visite', 'colorier'],
  starter:    ['visite', 'semaine', 'colorier'],
  pro:        ['recolte', 'client', 'visite'],
  expert:     ['equipe', 'transhum', 'client'],
};
const SAY: Record<string, string> = {
  decouverte: "Ta ruche est en place. Le plus beau reste à faire : va la rencontrer.",
  starter:    "Tes emplacements t'attendent. Commençons par une première visite.",
  pro:        "Ton cheptel est prêt. Passons à ce qui fait vivre ton exploitation.",
  expert:     "Belle installation. Mets ton équipe et tes sites dans la boucle.",
};

const planKey = computed(() => (BY_PLAN[currentPlan.value] ? currentPlan.value : 'pro'));
const acts = computed(() => {
  let keys = BY_PLAN[planKey.value] ?? BY_PLAN.pro;
  // nuance profil : un loisir garde la visite en tête même en Pro
  if (profil.value === 'loisir' && keys[0] !== 'visite') keys = ['visite', ...keys.filter((k) => k !== 'visite')];
  return keys
    .map((k) => CATALOG[k])
    .filter((a) => !a.feat || hasFeature(currentPlan.value, a.feat as any)) // jamais un geste verrouillé
    .slice(0, 3);
});
const say = computed(() => SAY[planKey.value] ?? SAY.pro);
const panelStyle = computed(() =>
  isWide.value
    ? { top: '50%', transform: 'translate(-50%,-50%)', width: '540px' }
    : { bottom: '16px', transform: 'translateX(-50%)', width: 'calc(100% - 24px)' },
);

function dismiss() {
  // nettoie le flag pour ne pas rejouer au refresh
  router.replace({ query: { ...route.query, welcome: undefined } });
}

onMounted(() => {
  const t = setTimeout(() => { phase.value = 'acts'; }, 1450);
  onBeforeUnmount(() => clearTimeout(t));
});
</script>

<!-- Styles : réutilise le bloc .seuil-* de app/assets/css/main.css (copié depuis maya.css).
     Ne redéclare rien ici — la géométrie/anim vit dans la feuille globale. -->
