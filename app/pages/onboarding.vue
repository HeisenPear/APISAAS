<template>
  <div class="flex min-h-dvh items-center justify-center bg-[var(--surface-primary)] px-4 py-8">
    <div class="w-full max-w-2xl">
      <!-- Header -->
      <div class="mb-8 text-center">
        <img src="/logo_apigo.webp" alt="APIGO" class="mx-auto mb-4 h-14 w-auto object-contain" />
        <h1 class="text-2xl font-bold tracking-tight text-stone-900">Bienvenue sur APIGO</h1>
        <p class="mt-1 text-sm text-stone-500">Configurons votre espace en quelques étapes</p>
      </div>

      <!-- Step indicator: 7 dots -->
      <div class="mb-6 flex flex-col items-center gap-3">
        <div class="flex items-center gap-2">
          <template v-for="s in TOTAL_STEPS" :key="s">
            <div
              class="transition-all duration-300"
              :class="[
                s < step ? 'h-2 w-2 rounded-full bg-[var(--honey)]' :
                s === step ? 'h-2.5 w-2.5 rounded-full ring-2 ring-[var(--honey)]' :
                'h-2 w-2 rounded-full bg-stone-200',
              ]"
              :style="s === step ? 'background-color: var(--honey)' : ''"
            />
            <div
              v-if="s < TOTAL_STEPS"
              class="h-px w-4 rounded-full transition-colors duration-300"
              :class="s < step ? 'bg-[var(--honey)]' : 'bg-stone-200'"
            />
          </template>
        </div>
        <!-- Progress bar -->
        <div class="h-1 w-full max-w-xs overflow-hidden rounded-full bg-stone-100">
          <div
            class="h-full rounded-full bg-[var(--honey)] transition-all duration-500 ease-out"
            :style="{ width: `${((step - 1) / (TOTAL_STEPS - 1)) * 100}%` }"
          />
        </div>
        <p class="text-xs text-stone-400">Étape {{ step }} sur {{ TOTAL_STEPS }}</p>
      </div>

      <!-- Card -->
      <div class="rounded-2xl border border-stone-200/60 bg-white p-8 shadow-sm">
        <Transition name="slide" mode="out-in">

          <!-- ─── Step 1: Profil apicole ─────────────────────────────────── -->
          <div v-if="step === 1" key="step1">
            <h2 class="text-lg font-semibold text-stone-900">Votre profil d'apiculteur</h2>
            <p class="mt-1 text-sm text-stone-500">Cela nous permet de personnaliser votre expérience</p>

            <div class="mt-6 grid grid-cols-2 gap-3">
              <button
                v-for="profil in PROFILS_APICOLES"
                :key="profil.id"
                type="button"
                class="rounded-[14px] border-2 p-5 text-left transition-all duration-200"
                :class="
                  form.profilApicole === profil.id
                    ? 'border-[var(--honey)] bg-[var(--honey-soft)] shadow-sm'
                    : 'border-stone-200 bg-white hover:border-stone-300 hover:bg-stone-50'
                "
                @click="form.profilApicole = profil.id"
              >
                <div class="mb-2 text-2xl">{{ profil.emoji }}</div>
                <p class="font-semibold text-stone-900">{{ profil.label }}</p>
                <p class="mt-1 text-xs text-stone-500">{{ profil.desc }}</p>
              </button>
            </div>
          </div>

          <!-- ─── Step 2: Identité ───────────────────────────────────────── -->
          <div v-else-if="step === 2" key="step2">
            <h2 class="text-lg font-semibold text-stone-900">Vos informations</h2>
            <p class="mt-1 text-sm text-stone-500">Pour personnaliser vos documents et factures</p>

            <div class="mt-6 space-y-4">
              <div class="grid grid-cols-2 gap-3">
                <UFormField label="Prénom" name="prenom">
                  <UInput v-model="form.prenom" placeholder="Jean" class="w-full" />
                </UFormField>
                <UFormField label="Nom" name="nom">
                  <UInput v-model="form.nom" placeholder="Dupont" class="w-full" />
                </UFormField>
              </div>
              <UFormField label="Téléphone" name="telephone">
                <UInput v-model="form.telephone" type="tel" placeholder="06 12 34 56 78" class="w-full" />
              </UFormField>
              <UFormField label="Adresse" name="adresse">
                <UInput v-model="form.adresse" placeholder="12 rue des Abeilles" class="w-full" />
              </UFormField>
              <div class="grid grid-cols-2 gap-3">
                <UFormField label="Code postal" name="codePostal">
                  <UInput v-model="form.codePostal" placeholder="75001" class="w-full" />
                </UFormField>
                <UFormField label="Ville" name="ville">
                  <UInput v-model="form.ville" placeholder="Paris" class="w-full" />
                </UFormField>
              </div>
              <UFormField label="Numéro NAPI (facultatif)" name="napi">
                <UInput v-model="form.napi" placeholder="Ex : 75A12345" class="w-full" />
                <template #hint>
                  <p class="mt-1 text-xs text-stone-400">
                    Votre numéro apiculteur attribué par la DDPP. Si vous ne l'avez pas encore, vous pourrez le renseigner dans Paramètres.
                  </p>
                </template>
              </UFormField>
            </div>
          </div>

          <!-- ─── Step 3: Premier rucher + ruches ───────────────────────── -->
          <div v-else-if="step === 3" key="step3">
            <h2 class="text-lg font-semibold text-stone-900">Votre premier rucher</h2>
            <p class="mt-1 text-sm text-stone-500">Vous pourrez créer d'autres ruchers plus tard</p>

            <!-- Rucher section -->
            <div class="mt-6 space-y-4">
              <UFormField label="Nom du rucher" name="rucherNom">
                <UInput v-model="rucher.nom" placeholder="Mon rucher principal" class="w-full" />
              </UFormField>
              <div class="grid grid-cols-2 gap-3">
                <UFormField label="Commune" name="commune">
                  <UInput v-model="rucher.commune" placeholder="Amboise" class="w-full" />
                </UFormField>
                <UFormField label="Département" name="departement">
                  <UInput v-model="rucher.departement" placeholder="Indre-et-Loire" class="w-full" />
                </UFormField>
              </div>
              <UFormField label="Environnement" name="environnement">
                <UInput v-model="rucher.environnement" placeholder="Forêt, culture, mixte…" class="w-full" />
              </UFormField>

              <!-- GPS -->
              <div class="rounded-xl bg-stone-50 p-4">
                <div class="flex items-center justify-between">
                  <div>
                    <p class="text-sm font-medium text-stone-700">Position GPS</p>
                    <p v-if="rucher.latitude && rucher.longitude" class="mt-0.5 text-xs text-stone-500">
                      {{ rucher.latitude }}, {{ rucher.longitude }}
                    </p>
                    <p v-else class="mt-0.5 text-xs text-stone-400">Non renseignée</p>
                  </div>
                  <UButton
                    label="Me localiser"
                    icon="i-lucide-locate"
                    variant="outline"
                    size="sm"
                    :loading="geoLoading"
                    @click="detectLocation"
                  />
                </div>
              </div>
            </div>

            <!-- Divider -->
            <div class="my-6 flex items-center gap-3">
              <div class="h-px flex-1 bg-stone-100" />
              <span class="text-xs font-medium text-stone-400">Ruches initiales</span>
              <div class="h-px flex-1 bg-stone-100" />
            </div>

            <!-- Ruches stepper -->
            <div class="space-y-4">
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-sm font-medium text-stone-700">Nombre de ruches</p>
                  <p class="text-xs text-stone-400">Vous pourrez les personnaliser individuellement</p>
                </div>
                <div class="flex items-center gap-3">
                  <button
                    type="button"
                    class="flex h-8 w-8 items-center justify-center rounded-lg border border-stone-200 bg-white text-stone-600 transition-colors hover:bg-stone-50 disabled:opacity-40"
                    :disabled="form.nbRuches <= 1"
                    @click="form.nbRuches = Math.max(1, form.nbRuches - 1)"
                  >
                    <UIcon name="i-lucide-minus" class="h-3.5 w-3.5" />
                  </button>
                  <span class="w-8 text-center text-lg font-semibold text-stone-900">{{ form.nbRuches }}</span>
                  <button
                    type="button"
                    class="flex h-8 w-8 items-center justify-center rounded-lg border border-stone-200 bg-white text-stone-600 transition-colors hover:bg-stone-50 disabled:opacity-40"
                    :disabled="form.nbRuches >= 99"
                    @click="form.nbRuches = Math.min(99, form.nbRuches + 1)"
                  >
                    <UIcon name="i-lucide-plus" class="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              <UFormField label="Type de ruche par défaut" name="rucheType">
                <USelect
                  v-model="form.rucheType"
                  :items="RUCHE_TYPES"
                  value-key="value"
                  label-key="label"
                  class="w-full"
                />
              </UFormField>
              <p class="text-xs text-stone-400">
                Toutes les ruches seront créées avec ce type par défaut. Vous pourrez les personnaliser individuellement.
              </p>
            </div>
          </div>

          <!-- ─── Step 4: Modules prioritaires ─────────────────────────── -->
          <div v-else-if="step === 4" key="step4">
            <h2 class="text-lg font-semibold text-stone-900">Vos priorités</h2>
            <p class="mt-1 text-sm text-stone-500">Sélectionnez les modules qui correspondent à votre activité</p>

            <div class="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-2">
              <button
                v-for="mod in MODULES"
                :key="mod.id"
                type="button"
                class="relative rounded-[14px] border-2 p-4 text-left transition-all duration-200"
                :class="
                  form.modulesActifs.includes(mod.id)
                    ? 'border-[var(--honey)] bg-[var(--honey-soft)]'
                    : 'border-stone-200 bg-white hover:border-stone-300'
                "
                @click="toggleModule(mod.id)"
              >
                <div v-if="isRecommended(mod.id)" class="absolute right-2 top-2 rounded-full bg-[var(--honey)] px-1.5 py-0.5 text-[9px] font-bold text-white">
                  Recommandé
                </div>
                <div class="mb-2 text-xl">{{ mod.icon }}</div>
                <p class="text-sm font-semibold text-stone-900">{{ mod.title }}</p>
                <p class="mt-0.5 text-xs text-stone-500">{{ mod.desc }}</p>
              </button>
            </div>
          </div>

          <!-- ─── Step 5: Choix du plan ──────────────────────────────────── -->
          <div v-else-if="step === 5" key="step5">
            <h2 class="text-lg font-semibold text-stone-900">Choisissez votre plan</h2>
            <p class="mt-1 text-sm text-stone-500">Vous pouvez changer à tout moment</p>

            <!-- Trial card (pre-selected) -->
            <div class="mt-6">
              <button
                type="button"
                class="w-full rounded-[14px] border-2 p-5 text-left transition-all duration-200"
                :class="
                  form.selectedPlan === 'trial'
                    ? 'border-[var(--honey)] bg-[var(--honey-soft)] shadow-sm'
                    : 'border-stone-200 bg-white hover:border-stone-300'
                "
                @click="form.selectedPlan = 'trial'"
              >
                <div class="flex items-center gap-3">
                  <div class="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--honey)] text-lg">🎁</div>
                  <div class="flex-1">
                    <p class="font-semibold text-stone-900">Essai Pro — 60 jours gratuits</p>
                    <p class="mt-0.5 text-sm text-stone-500">Toutes les fonctionnalités Pro débloquées, aucun engagement, sans carte bancaire.</p>
                  </div>
                  <div
                    class="h-5 w-5 shrink-0 rounded-full border-2 transition-colors"
                    :class="form.selectedPlan === 'trial' ? 'border-[var(--honey)] bg-[var(--honey)]' : 'border-stone-300'"
                  />
                </div>
              </button>
            </div>

            <!-- Separator -->
            <div class="my-5 flex items-center gap-3">
              <div class="h-px flex-1 bg-stone-100" />
              <span class="text-xs font-medium text-stone-400">ou abonnez-vous directement</span>
              <div class="h-px flex-1 bg-stone-100" />
            </div>

            <!-- Plan cards -->
            <div class="grid grid-cols-2 gap-3">
              <button
                v-for="plan in PLAN_LIST"
                :key="plan.id"
                type="button"
                class="rounded-[14px] border-2 p-4 text-left transition-all duration-200"
                :class="
                  form.selectedPlan === plan.id
                    ? 'border-[var(--honey)] bg-[var(--honey-soft)] shadow-sm'
                    : 'border-stone-200 bg-white hover:border-stone-300'
                "
                @click="form.selectedPlan = plan.id"
              >
                <div class="flex items-center justify-between">
                  <span class="text-sm font-semibold text-stone-900">{{ plan.label }}</span>
                  <span
                    v-if="plan.id === 'pro'"
                    class="rounded-full bg-[var(--honey)] px-1.5 py-0.5 text-[9px] font-bold text-white"
                  >
                    Recommandé
                  </span>
                </div>
                <p class="mt-2 text-xl font-bold text-stone-900">
                  {{ plan.prix ? `${plan.prix.mois}€` : 'Gratuit' }}<span v-if="plan.prix" class="text-xs font-normal text-stone-400">/mois</span>
                </p>
                <p class="mt-1 text-xs text-stone-500">{{ plan.description }}</p>
              </button>
            </div>

            <!-- Plan info message -->
            <div v-if="form.selectedPlan === 'decouverte'" class="mt-4 rounded-xl bg-stone-50 p-3 text-xs text-stone-500">
              Plan gratuit avec fonctionnalités de base. Vous pouvez upgrader à tout moment.
            </div>
            <div v-else-if="form.selectedPlan !== 'trial'" class="mt-4 rounded-xl bg-amber-50 p-3 text-xs text-amber-700">
              Vous serez redirigé vers le paiement après la configuration.
            </div>
          </div>

          <!-- ─── Step 6: Notifications ──────────────────────────────────── -->
          <div v-else-if="step === 6" key="step6">
            <h2 class="text-lg font-semibold text-stone-900">Notifications</h2>
            <p class="mt-1 text-sm text-stone-500">Choisissez ce que vous souhaitez recevoir</p>

            <div class="mt-6 space-y-4">
              <div
                v-for="notif in NOTIFS"
                :key="notif.key"
                class="flex items-start justify-between rounded-[14px] border border-stone-200 bg-white p-4"
              >
                <div class="flex items-start gap-3">
                  <span class="mt-0.5 text-xl">{{ notif.emoji }}</span>
                  <div>
                    <p class="text-sm font-semibold text-stone-900">{{ notif.label }}</p>
                    <p class="mt-0.5 text-xs text-stone-500">{{ notif.desc }}</p>
                  </div>
                </div>
                <USwitch v-model="(form as Record<string, unknown>)[notif.key] as boolean" />
              </div>
            </div>
          </div>

          <!-- ─── Step 7: Prêt ! ──────────────────────────────────────────── -->
          <div v-else-if="step === 7" key="step7" class="text-center">
            <div class="mb-4 text-6xl">✅</div>
            <h2 class="text-2xl font-bold text-stone-900">Tout est prêt !</h2>
            <p class="mt-2 text-sm text-stone-500">
              <template v-if="form.selectedPlan === 'trial'">
                Votre essai Pro de 60 jours est activé. Profitez de toutes les fonctionnalités !
              </template>
              <template v-else-if="form.selectedPlan === 'decouverte'">
                Vous démarrez avec le plan Découverte. Vous pourrez upgrader à tout moment depuis vos paramètres.
              </template>
              <template v-else>
                Vous serez redirigé vers la page de paiement pour finaliser votre abonnement.
              </template>
            </p>

            <!-- Recap -->
            <div class="mx-auto mt-6 max-w-sm space-y-2 text-left">
              <div v-if="createdRucherId" class="flex items-center gap-3 rounded-[12px] bg-stone-50 px-4 py-3">
                <span class="text-lg">🏕️</span>
                <div>
                  <p class="text-sm font-medium text-stone-900">{{ rucher.nom || 'Rucher créé' }}</p>
                  <p class="text-xs text-stone-500">{{ form.nbRuches }} ruche{{ form.nbRuches > 1 ? 's' : '' }}</p>
                </div>
              </div>
              <div class="flex items-center gap-3 rounded-[12px] bg-stone-50 px-4 py-3">
                <span class="text-lg">👤</span>
                <div>
                  <p class="text-sm font-medium text-stone-900">{{ form.prenom || authStore.profil?.prenom }} {{ form.nom || authStore.profil?.nom }}</p>
                  <p class="text-xs text-stone-500 capitalize">{{ PROFILS_APICOLES.find(p => p.id === form.profilApicole)?.label ?? 'Apiculteur' }}</p>
                </div>
              </div>
              <div class="flex items-center gap-3 rounded-[12px] bg-stone-50 px-4 py-3">
                <span class="text-lg">✨</span>
                <div>
                  <p class="text-sm font-medium text-stone-900">
                    {{ form.selectedPlan === 'trial' ? 'Essai Pro 60j' : PLAN_LIST.find(p => p.id === form.selectedPlan)?.label ?? form.selectedPlan }}
                  </p>
                  <p class="text-xs text-stone-500">Plan sélectionné</p>
                </div>
              </div>
            </div>

            <!-- CTA button -->
            <div class="mt-8">
              <UButton
                :label="firstStepLabel"
                icon="i-lucide-arrow-right"
                trailing
                color="primary"
                size="lg"
                :loading="saving"
                @click="finishOnboarding"
              />
            </div>
          </div>

        </Transition>

        <!-- Navigation (not shown on step 7, it has its own CTA) -->
        <div v-if="step < 7" class="mt-8 flex items-center justify-between">
          <UButton
            v-if="step > 1"
            label="Précédent"
            icon="i-lucide-arrow-left"
            variant="ghost"
            color="neutral"
            @click="step--"
          />
          <div v-else />

          <div class="flex items-center gap-2">
            <!-- Skip button for step 3 -->
            <UButton
              v-if="step === 3"
              label="Passer"
              variant="ghost"
              color="neutral"
              size="sm"
              @click="skipStep3"
            />
            <UButton
              label="Suivant"
              icon="i-lucide-arrow-right"
              trailing
              color="primary"
              :loading="saving"
              @click="nextStep"
            />
          </div>
        </div>
      </div>

      <p class="mt-6 text-center text-xs text-stone-400">
        &copy; {{ new Date().getFullYear() }} APIGO. Tous droits réservés.
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { PLAN_CONFIGS } from '~/config/plans';

definePageMeta({ layout: false });

const authStore = useAuthStore();
const router = useRouter();
const notifications = useNotifications();

const TOTAL_STEPS = 7;
const step = ref(1);
const saving = ref(false);
const geoLoading = ref(false);
const createdRucherId = ref<string | null>(null);
const step3Skipped = ref(false);

// ── Constants ──────────────────────────────────────────────────────────────

const PROFILS_APICOLES = [
  { id: 'loisir', emoji: '🏡', label: 'Loisir', desc: '1 à 10 ruches, passion personnelle' },
  { id: 'pluri_actif', emoji: '🔀', label: 'Pluri-actif', desc: '10 à 50 ruches, complément de revenu' },
  { id: 'professionnel', emoji: '🏢', label: 'Professionnel', desc: '50+ ruches, activité principale' },
  { id: 'association', emoji: '🤝', label: 'Association', desc: 'Rucher-école, gestion collective' },
] as const;

const MODULES = [
  { id: 'interventions', icon: '📋', title: 'Interventions', desc: 'Suivi de vos visites et traitements' },
  { id: 'production', icon: '🍯', title: 'Production & Récoltes', desc: 'Pesées, miels, traçabilité' },
  { id: 'finances', icon: '💰', title: 'Clients & Facturation', desc: 'Ventes, factures PDF, comptabilité' },
  { id: 'stocks', icon: '📦', title: 'Stocks & Inventaire', desc: 'Matériel, médicaments, consommables' },
  { id: 'analytics', icon: '📊', title: 'Analytics', desc: 'Tableaux de bord et prévisions' },
  { id: 'transhumance', icon: '🚛', title: 'Transhumance', desc: 'Plans de déplacement et miellées' },
  { id: 'elevage', icon: '🧬', title: 'Élevage de reines', desc: 'Lignées, greffage, sélection' },
  { id: 'conformite', icon: '📋', title: 'Conformité', desc: 'NAPI, ordonnances vétérinaires' },
] as const;

const RECOMMENDED_BY_PROFIL: Record<string, string[]> = {
  loisir: ['interventions', 'conformite'],
  pluri_actif: ['interventions', 'production', 'finances', 'stocks'],
  professionnel: ['interventions', 'production', 'finances', 'analytics', 'transhumance'],
  association: ['interventions', 'conformite', 'stocks'],
};

const RUCHE_TYPES = [
  { value: 'dadant_10', label: 'Dadant 10' },
  { value: 'dadant_12', label: 'Dadant 12' },
  { value: 'langstroth', label: 'Langstroth' },
  { value: 'warre', label: 'Warré' },
  { value: 'voirnot', label: 'Voirnot' },
  { value: 'kenyane', label: 'Kenyane' },
  { value: 'autre', label: 'Autre' },
];

const PLAN_LIST = Object.values(PLAN_CONFIGS).map((p) => ({
  id: p.id,
  label: p.label,
  prix: p.prix,
  description: p.description,
}));

const NOTIFS = [
  { key: 'alertesEssaim', emoji: '🐝', label: "Risque d'essaimage", desc: 'Quand une colonie montre des signes' },
  { key: 'alertesMeteo', emoji: '🌡️', label: 'Météo critique', desc: 'Gel, canicule, orages sur vos ruchers' },
  { key: 'rappelsInterventions', emoji: '📅', label: "Rappels d'interventions", desc: "La veille d'une visite planifiée" },
];

// ── Form state ────────────────────────────────────────────────────────────

const form = reactive({
  // Step 1
  profilApicole: 'loisir',
  // Step 2
  prenom: authStore.profil?.prenom ?? '',
  nom: authStore.profil?.nom ?? '',
  telephone: '',
  adresse: '',
  codePostal: '',
  ville: '',
  napi: '',
  // Step 3
  nbRuches: 3,
  rucheType: 'dadant_10',
  // Step 4
  modulesActifs: [] as string[],
  // Step 5
  selectedPlan: 'trial',
  // Step 6
  alertesEssaim: true,
  alertesMeteo: true,
  rappelsInterventions: true,
});

const rucher = reactive({
  nom: '',
  commune: '',
  departement: '',
  environnement: '',
  latitude: undefined as number | undefined,
  longitude: undefined as number | undefined,
});

// ── Computed ──────────────────────────────────────────────────────────────

const firstStepLabel = computed(() => {
  switch (form.profilApicole) {
    case 'professionnel':
      return 'Voir votre tableau de bord';
    case 'association':
      return 'Configurer votre organisation';
    default:
      return 'Enregistrer votre première intervention';
  }
});

// ── Watchers ──────────────────────────────────────────────────────────────

// Pre-select recommended modules when entering step 4
watch(
  () => step.value,
  (newStep) => {
    if (newStep === 4) {
      const recommended = RECOMMENDED_BY_PROFIL[form.profilApicole] ?? [];
      form.modulesActifs = [...recommended];
    }
  },
);

// ── Methods ───────────────────────────────────────────────────────────────

function isRecommended(modId: string): boolean {
  const recommended = RECOMMENDED_BY_PROFIL[form.profilApicole] ?? [];
  return recommended.includes(modId);
}

function toggleModule(modId: string) {
  const idx = form.modulesActifs.indexOf(modId);
  if (idx >= 0) {
    form.modulesActifs.splice(idx, 1);
  } else {
    form.modulesActifs.push(modId);
  }
}

function detectLocation() {
  if (!navigator.geolocation) return;
  geoLoading.value = true;
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      rucher.latitude = Math.round(pos.coords.latitude * 1e7) / 1e7;
      rucher.longitude = Math.round(pos.coords.longitude * 1e7) / 1e7;
      geoLoading.value = false;
    },
    () => {
      geoLoading.value = false;
      notifications.warning('Impossible de détecter votre position');
    },
  );
}

async function skipStep3() {
  step3Skipped.value = true;
  step.value++;
}

async function nextStep() {
  saving.value = true;
  try {
    if (step.value === 2) {
      await authStore.updateProfil({
        prenom: form.prenom || undefined,
        nom: form.nom || undefined,
        telephone: form.telephone || undefined,
        adresse: form.adresse || undefined,
        codePostal: form.codePostal || undefined,
        ville: form.ville || undefined,
        napi: form.napi || undefined,
      });
    } else if (step.value === 3 && !step3Skipped.value && rucher.nom) {
      const res = await $fetch<{ data: { id: string } }>('/api/ruchers', {
        method: 'POST',
        body: {
          nom: rucher.nom,
          commune: rucher.commune || undefined,
          departement: rucher.departement || undefined,
          environnement: rucher.environnement || undefined,
          latitude: rucher.latitude,
          longitude: rucher.longitude,
        },
      });
      createdRucherId.value = res.data.id;

      // Create batch ruches
      if (form.nbRuches > 0) {
        const ruches = Array.from({ length: form.nbRuches }, (_, i) => ({
          rucherId: res.data.id,
          numero: `Ruche ${i + 1}`,
          type: form.rucheType,
        }));
        await $fetch('/api/ruches', {
          method: 'POST',
          body: { ruches },
        });
      }
    }
    step.value++;
  } catch (e: unknown) {
    notifications.error(getApiErrorMessage(e, 'Erreur lors de la sauvegarde'));
  } finally {
    saving.value = false;
  }
}

async function finishOnboarding() {
  saving.value = true;
  try {
    // 1. Save preferences
    await authStore.updateProfil({
      preferences: {
        ...(authStore.profil?.preferences ?? {}),
        profilApicole: form.profilApicole,
        modulesActifs: form.modulesActifs,
        alertesEssaim: form.alertesEssaim,
        alertesMeteo: form.alertesMeteo,
        rappelsInterventions: form.rappelsInterventions,
        onboardingCompletedAt: new Date().toISOString(),
        tutorialsCompleted: [],
        tutorialsDismissed: false,
      },
    });

    // 2. If decouverte chosen → downgrade plan
    if (form.selectedPlan === 'decouverte') {
      await $fetch('/api/profils/me', { method: 'PUT', body: { plan: 'decouverte' } });
    }

    // 3. Complete onboarding
    await authStore.completeOnboarding();

    // 4. Redirect
    if (form.selectedPlan !== 'trial' && form.selectedPlan !== 'decouverte') {
      await router.push('/tarifs');
    } else if (form.profilApicole === 'loisir' || form.profilApicole === 'pluri_actif') {
      await router.push('/interventions/nouvelle');
    } else {
      await router.push('/dashboard');
    }
  } catch (e: unknown) {
    notifications.error(getApiErrorMessage(e, 'Erreur lors de la finalisation'));
  } finally {
    saving.value = false;
  }
}
</script>

<style scoped>
.slide-enter-active,
.slide-leave-active {
  transition: all 250ms cubic-bezier(0.16, 1, 0.3, 1);
}
.slide-enter-from {
  opacity: 0;
  transform: translateX(24px);
}
.slide-leave-to {
  opacity: 0;
  transform: translateX(-24px);
}
</style>
