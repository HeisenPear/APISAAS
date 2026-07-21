<template>
  <div class="flex min-h-dvh items-center justify-center bg-[var(--surface-primary)] px-4 py-8">
    <div class="w-full max-w-2xl">
      <!-- Header -->
      <div class="mb-8 text-center">
        <img src="/logo_apigo.webp" alt="APIGO" class="mx-auto mb-4 h-14 w-auto object-contain" />
        <h1 class="text-2xl font-bold tracking-tight text-stone-900">
          Bienvenue chez APIGO<span class="ml-1">🐝</span>
        </h1>
        <p class="mt-1.5 text-sm text-stone-500">
          En 2 minutes, votre rucher prend vie — et vous découvrez ce qu'APIGO va changer pour vous.
        </p>
      </div>

      <!-- Step indicator -->
      <div class="mb-6 flex flex-col items-center gap-3">
        <div class="flex items-center gap-2">
          <template v-for="s in TOTAL_STEPS" :key="s">
            <div
              class="transition-all duration-300"
              :class="[
                s < step
                  ? 'h-2 w-2 rounded-full bg-[var(--honey)]'
                  : s === step
                    ? 'h-2.5 w-2.5 rounded-full ring-2 ring-[var(--honey)]'
                    : 'h-2 w-2 rounded-full bg-stone-200',
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
        <!-- Activation en cours : retour de Stripe, le temps que le webhook active le plan -->
        <div v-if="activating" class="flex flex-col items-center justify-center py-16 text-center">
          <UIcon name="i-lucide-loader-circle" class="h-8 w-8 animate-spin text-[var(--honey)]" />
          <p class="mt-4 text-sm font-medium text-stone-700">Activation de votre formule…</p>
          <p class="mt-1 text-xs text-stone-400">Encore un instant, on prépare votre espace.</p>
        </div>

        <template v-else>
          <Transition name="slide" mode="out-in">
            <!-- ─── Step 1: Profil apicole ─────────────────────────────────── -->
            <div v-if="step === 1" key="step1">
              <h2 class="text-lg font-semibold text-stone-900">Votre profil d'apiculteur</h2>
              <p class="mt-1 text-sm text-stone-500">
                On adapte APIGO à votre façon de faire de l'apiculture
              </p>

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

            <!-- ─── Step 2: Comment vous démarrez (plan) ───────────────────── -->
            <div v-else-if="step === 2" key="step2">
              <h2 class="text-lg font-semibold text-stone-900">
                Comment souhaitez-vous démarrer ?
              </h2>
              <p class="mt-1 text-sm text-stone-500">
                Choisissez votre formule — vous construisez votre rucher juste après. Modifiable à
                tout moment.
              </p>

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
                    <div
                      class="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--honey)] text-lg"
                    >
                      🎁
                    </div>
                    <div class="flex-1">
                      <p class="font-semibold text-stone-900">Essai Pro — 60 jours gratuits</p>
                      <p class="mt-0.5 text-sm text-stone-500">
                        Toutes les fonctionnalités Pro débloquées, ruches illimitées, carte bancaire
                        requise, résiliable à tout moment.
                      </p>
                      <p class="mt-1 text-[12px] font-medium text-[var(--honey-deep)]">
                        0 € aujourd'hui · email de rappel avant la fin · annulable en 1 clic
                      </p>
                    </div>
                    <div
                      class="h-5 w-5 shrink-0 rounded-full border-2 transition-colors"
                      :class="
                        form.selectedPlan === 'trial'
                          ? 'border-[var(--honey)] bg-[var(--honey)]'
                          : 'border-stone-300'
                      "
                    />
                  </div>
                </button>
              </div>

              <!-- Separator -->
              <div class="my-5 flex items-center gap-3">
                <div class="h-px flex-1 bg-stone-100" />
                <span class="text-xs font-medium text-stone-400">ou choisissez une formule</span>
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
                    {{ plan.prix ? `${plan.prix.mois}€` : 'Gratuit'
                    }}<span v-if="plan.prix" class="text-xs font-normal text-stone-400">/mois</span>
                  </p>
                  <p class="mt-1 text-xs text-stone-500">{{ plan.description }}</p>
                  <p class="mt-1.5 text-[11px] font-medium text-stone-400">
                    {{ planLimitLabel(plan.id) }}
                  </p>
                </button>
              </div>

              <!-- Plan info message -->
              <div v-if="planActif" class="mt-4 rounded-xl bg-amber-50 p-3 text-xs text-amber-700">
                ✓ Votre formule est active — vous pouvez configurer votre rucher.
              </div>
              <div
                v-else-if="form.selectedPlan === 'decouverte'"
                class="mt-4 rounded-xl bg-stone-50 p-3 text-xs text-stone-500"
              >
                Plan gratuit : 1 rucher et 1 ruche, fonctionnalités de base. Pour gérer plusieurs
                ruches, démarrez l'essai Pro 60 j — gratuit, sans engagement.
              </div>
              <div
                v-else-if="form.selectedPlan === 'trial'"
                class="mt-4 rounded-xl bg-[var(--honey-soft)] p-3 text-xs"
                style="color: var(--honey-deep)"
              >
                Étape suivante : on sécurise votre essai Pro (carte bancaire, 0 € aujourd'hui), puis
                vous configurez votre rucher avec tout débloqué.
              </div>
              <div v-else class="mt-4 rounded-xl bg-amber-50 p-3 text-xs text-amber-700">
                Étape suivante : le paiement sécurisé, puis la configuration de votre rucher.
              </div>

              <!-- Acceptation CGV : obligatoire avant le paiement -->
              <div
                v-if="!planActif && form.selectedPlan !== 'decouverte'"
                class="mt-3 flex items-start gap-2 rounded-xl border border-stone-200 p-3 text-xs text-stone-600"
              >
                <UCheckbox v-model="acceptCgv" class="mt-0.5" />
                <span>
                  J'accepte les
                  <NuxtLink
                    to="/cgv"
                    target="_blank"
                    class="font-medium text-[var(--honey-deep)] underline"
                    >CGV</NuxtLink
                  >
                  et demande l'accès immédiat au service (renonciation au droit de rétractation de
                  14 jours).
                </span>
              </div>
            </div>

            <!-- ─── Step 3: Premier rucher + ruches ───────────────────────── -->
            <div v-else-if="step === 3" key="step3">
              <h2 class="text-lg font-semibold text-stone-900">Votre premier rucher</h2>
              <p class="mt-1 text-sm text-stone-500">
                On le crée maintenant — pour que votre tableau de bord soit déjà vivant.
              </p>

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
                    <UInput
                      v-model="rucher.departement"
                      placeholder="Indre-et-Loire"
                      class="w-full"
                    />
                  </UFormField>
                </div>
                <UFormField label="Environnement" name="environnement">
                  <UInput
                    v-model="rucher.environnement"
                    placeholder="Forêt, culture, mixte…"
                    class="w-full"
                  />
                </UFormField>

                <!-- GPS -->
                <div class="rounded-xl bg-stone-50 p-4">
                  <div class="flex items-center justify-between">
                    <div>
                      <p class="text-sm font-medium text-stone-700">Position GPS</p>
                      <p
                        v-if="rucher.latitude && rucher.longitude"
                        class="mt-0.5 text-xs text-stone-500"
                      >
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
                    <p class="text-xs text-stone-400">
                      Vous pourrez les personnaliser individuellement
                    </p>
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
                    <span class="w-8 text-center text-lg font-semibold text-stone-900">{{
                      form.nbRuches
                    }}</span>
                    <button
                      type="button"
                      class="flex h-8 w-8 items-center justify-center rounded-lg border border-stone-200 bg-white text-stone-600 transition-colors hover:bg-stone-50 disabled:opacity-40"
                      :disabled="form.nbRuches >= maxRuches"
                      @click="form.nbRuches = Math.min(maxRuches, form.nbRuches + 1)"
                    >
                      <UIcon name="i-lucide-plus" class="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                <!-- Upsell when the chosen plan caps the number of hives -->
                <div
                  v-if="ruchesLimitReached"
                  class="flex items-start gap-2 rounded-xl bg-[var(--honey-soft)] p-3 text-xs"
                  style="color: var(--honey-deep)"
                >
                  <UIcon name="i-lucide-sparkles" class="mt-0.5 h-4 w-4 shrink-0" />
                  <span>
                    Le plan {{ selectedPlanLabel }} permet jusqu'à {{ maxRuches }} ruche{{
                      maxRuches > 1 ? 's' : ''
                    }}.
                    <button type="button" class="font-semibold underline" @click="upgradeToTrial">
                      Passez à l'essai Pro 60 j (gratuit)
                    </button>
                    pour en ajouter autant que vous voulez.
                  </span>
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
                  Toutes les ruches seront créées avec ce type par défaut. Vous pourrez les
                  personnaliser individuellement.
                </p>
              </div>
            </div>

            <!-- ─── Step 4: Modules prioritaires ─────────────────────────── -->
            <div v-else-if="step === 4" key="step4">
              <h2 class="text-lg font-semibold text-stone-900">Vos priorités</h2>
              <p class="mt-1 text-sm text-stone-500">
                Votre espace s'adapte : on met en avant ce qui compte pour vous
              </p>

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
                  <div
                    v-if="isRecommended(mod.id)"
                    class="absolute right-2 top-2 rounded-full bg-[var(--honey)] px-1.5 py-0.5 text-[9px] font-bold text-white"
                  >
                    Recommandé
                  </div>
                  <div class="mb-2 text-xl">{{ mod.icon }}</div>
                  <p class="text-sm font-semibold text-stone-900">{{ mod.title }}</p>
                  <p class="mt-0.5 text-xs text-stone-500">{{ mod.desc }}</p>
                </button>
              </div>
            </div>

            <!-- ─── Step 5: Votre rucher prend vie ! ────────────────────────── -->
            <div v-else-if="step === 5" key="step5">
              <div class="text-center">
                <div class="mb-3 text-5xl">🐝</div>
                <h2 class="text-2xl font-bold text-stone-900">
                  Votre rucher prend vie<template v-if="form.prenom || authStore.profil?.prenom"
                    >, {{ form.prenom || authStore.profil?.prenom }}</template
                  >&nbsp;!
                </h2>
                <p class="mt-2 text-sm text-stone-500">
                  Voici un avant-goût de votre espace APIGO.
                </p>
              </div>

              <!-- Aperçu « live » du tableau de bord -->
              <div
                class="mx-auto mt-6 max-w-md overflow-hidden rounded-[16px] border border-stone-200/70 shadow-sm"
              >
                <div
                  class="flex items-center gap-3 px-4 py-3"
                  style="background: var(--honey-soft)"
                >
                  <span class="text-xl">🏕️</span>
                  <div class="min-w-0 flex-1">
                    <p class="truncate text-sm font-semibold text-stone-900">
                      {{ rucher.nom || 'Votre rucher' }}
                    </p>
                    <p class="text-xs text-stone-500">
                      {{ form.nbRuches }} ruche{{ form.nbRuches > 1 ? 's' : '' }} ·
                      {{
                        PROFILS_APICOLES.find((p) => p.id === form.profilApicole)?.label ??
                        'Apiculteur'
                      }}
                    </p>
                  </div>
                  <span
                    class="shrink-0 rounded-full bg-white px-2 py-0.5 text-[11px] font-bold"
                    style="color: var(--honey-deep)"
                    >Prêt&nbsp;✓</span
                  >
                </div>
                <div class="flex items-center gap-3 border-t border-stone-100 px-4 py-3">
                  <span class="text-lg">☀️</span>
                  <p class="flex-1 text-xs text-stone-600">
                    <b class="text-stone-900">Bon créneau de visite</b> · 11 h–15 h · butinage
                    82/100
                  </p>
                </div>
                <div class="flex items-center gap-3 border-t border-stone-100 px-4 py-3">
                  <span class="text-lg">💚</span>
                  <p class="flex-1 text-xs text-stone-600">
                    <b class="text-stone-900">Santé des colonies</b> suivie en continu
                  </p>
                  <span class="text-sm font-bold" style="color: var(--sage-deep)"
                    >78<span class="text-xs text-stone-400">/100</span></span
                  >
                </div>
              </div>

              <!-- Ce qui vous attend (teaser) -->
              <div class="mx-auto mt-5 max-w-md">
                <p
                  class="mb-2 text-center text-[11px] font-semibold uppercase tracking-[0.12em]"
                  style="color: var(--honey-deep)"
                >
                  Et ce n'est que le début
                </p>
                <div class="grid grid-cols-2 gap-2">
                  <div
                    v-for="t in TEASERS"
                    :key="t"
                    class="flex items-center gap-2 rounded-[10px] bg-stone-50 px-3 py-2 text-xs text-stone-600"
                  >
                    {{ t }}
                  </div>
                </div>
              </div>

              <!-- Rappel notifications (activées par défaut) -->
              <p class="mx-auto mt-4 max-w-md text-center text-[11px] text-stone-400">
                🔔 Alertes essaimage, météo critique et rappels d'interventions activées —
                ajustables dans vos réglages.
              </p>

              <!-- Note plan -->
              <p class="mx-auto mt-4 max-w-md text-center text-xs text-stone-500">
                <template v-if="form.selectedPlan === 'decouverte' && !planActif">
                  Vous démarrez en Découverte — passez à Pro à tout moment pour tout débloquer.
                </template>
                <template v-else-if="form.selectedPlan === 'trial'">
                  Votre essai Pro 60 jours est actif — sans engagement, résiliable en 1 clic.
                </template>
                <template v-else>
                  Votre abonnement {{ selectedPlanLabel }} est actif. Bienvenue&nbsp;!
                </template>
              </p>

              <!-- CTA button -->
              <div class="mt-6 text-center">
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

          <!-- Navigation (not shown on the last step, it has its own CTA) -->
          <div v-if="step < 5" class="mt-8 flex items-center justify-between">
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
              <!-- Skip button for the rucher step -->
              <UButton
                v-if="step === 3"
                label="Passer"
                variant="ghost"
                color="neutral"
                size="sm"
                @click="skipRucher"
              />
              <UButton
                :label="nextButtonLabel"
                icon="i-lucide-arrow-right"
                trailing
                color="primary"
                :loading="saving"
                :disabled="
                  step === 2 && !planActif && form.selectedPlan !== 'decouverte' && !acceptCgv
                "
                @click="nextStep"
              />
            </div>
          </div>
        </template>
      </div>

      <p class="mt-6 text-center text-xs text-stone-400">
        &copy; {{ new Date().getFullYear() }} APIGO. Tous droits réservés.
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { PLAN_CONFIGS, type Plan } from '~/config/plans';

definePageMeta({ layout: false });

const authStore = useAuthStore();
const router = useRouter();
const route = useRoute();
const notifications = useNotifications();
const analytics = useAnalytics();

const TOTAL_STEPS = 5;
const step = ref(1);
const saving = ref(false);
const geoLoading = ref(false);
const createdRucherId = ref<string | null>(null);
const rucherSkipped = ref(false);
// Pendant le retour de Stripe, le temps que le webhook active le plan.
const activating = ref(false);
// Acceptation CGV (vente d'abonnement) — transitoire, re-demandée à chaque session.
const acceptCgv = ref(false);
// Reprise de l'onboarding après le détour paiement (carte d'abord, avant le build).
const ONBOARDING_KEY = 'apigo_onboarding';

// ── Constants ──────────────────────────────────────────────────────────────

const PROFILS_APICOLES = [
  { id: 'loisir', emoji: '🏡', label: 'Loisir', desc: '1 à 10 ruches, passion personnelle' },
  {
    id: 'pluri_actif',
    emoji: '🔀',
    label: 'Pluri-actif',
    desc: '10 à 50 ruches, complément de revenu',
  },
  {
    id: 'professionnel',
    emoji: '🏢',
    label: 'Professionnel',
    desc: '50+ ruches, activité principale',
  },
  {
    id: 'association',
    emoji: '🤝',
    label: 'Association',
    desc: 'Rucher-école, gestion collective',
  },
] as const;

const MODULES = [
  {
    id: 'interventions',
    icon: '📋',
    title: 'Interventions',
    desc: '14 types de visites saisies en 30 s, même hors-ligne',
  },
  {
    id: 'production',
    icon: '🍯',
    title: 'Production & récoltes',
    desc: 'Pesées, récoltes, traçabilité de vos lots de miel',
  },
  {
    id: 'finances',
    icon: '💰',
    title: 'Clients & facturation',
    desc: 'Factures PDF Factur-X 2026, clients, TVA auto',
  },
  {
    id: 'stocks',
    icon: '📦',
    title: 'Stocks & inventaire',
    desc: 'Cadres, hausses, traitements — jamais à court',
  },
  {
    id: 'analytics',
    icon: '📊',
    title: 'Pilotage & rentabilité',
    desc: 'Rentabilité par ruche, saisons comparées, météo↔miel',
  },
  {
    id: 'transhumance',
    icon: '🚛',
    title: 'Transhumance',
    desc: 'Emplacements, miellées et plans de déplacement',
  },
  {
    id: 'elevage',
    icon: '🧬',
    title: 'Élevage de reines',
    desc: 'Lignées, greffage, tests de performance',
  },
  {
    id: 'conformite',
    icon: '📋',
    title: 'Conformité',
    desc: "Registre d'élevage, NAPI, ordonnances — toujours en règle",
  },
] as const;

// Teaser des features « cool » montré sur l'écran final (donne envie d'aller plus loin).
const TEASERS = [
  '💰 Rentabilité par ruche',
  '📊 Vos saisons comparées',
  '🌍 Réseau communautaire',
  '🤖 IA apicole (bientôt)',
];

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

// ── Form state ────────────────────────────────────────────────────────────

const form = reactive({
  // Step 1
  profilApicole: 'loisir',
  // Step 3 — rucher / ruches
  prenom: authStore.profil?.prenom ?? '',
  nom: authStore.profil?.nom ?? '',
  telephone: '',
  adresse: '',
  codePostal: '',
  ville: '',
  napi: '',
  nbRuches: 3,
  rucheType: 'dadant_10',
  // Step 4 — modules
  modulesActifs: [] as string[],
  // Step 2 — plan
  selectedPlan: 'trial',
  // Notifications (activées par défaut, plus d'écran dédié — réglables ensuite)
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

// Plan effectif pour les limites : l'essai débloque les limites du plan Pro.
const planForLimits = computed<Plan>(() =>
  form.selectedPlan === 'trial' ? 'pro' : (form.selectedPlan as Plan),
);
const ruchesLimit = computed(() => PLAN_CONFIGS[planForLimits.value]?.limites.ruches ?? 1);
const maxRuches = computed(() => (Number.isFinite(ruchesLimit.value) ? ruchesLimit.value : 99));
const ruchesLimitReached = computed(
  () => Number.isFinite(ruchesLimit.value) && form.nbRuches >= maxRuches.value,
);
const selectedPlanLabel = computed(() =>
  form.selectedPlan === 'trial'
    ? 'Essai Pro'
    : (PLAN_CONFIGS[form.selectedPlan as Plan]?.label ?? ''),
);

// Le plan est-il déjà actif en base ? (au retour de Stripe, après activation du webhook)
const planActif = computed(
  () => authStore.profil?.plan !== 'decouverte' || authStore.profil?.trialActive === true,
);

// Libellé du bouton « Suivant » : à l'étape plan, il déclenche le paiement.
const nextButtonLabel = computed(() => {
  if (step.value === 2 && form.selectedPlan !== 'decouverte' && !planActif.value) {
    return form.selectedPlan === 'trial' ? 'Sécuriser mon essai' : 'Vers le paiement';
  }
  return 'Suivant';
});

function planLimitLabel(planId: string): string {
  const limites = PLAN_CONFIGS[planId as Plan]?.limites;
  if (!limites) return '';
  const ruches = Number.isFinite(limites.ruches)
    ? `${limites.ruches} ruche${limites.ruches > 1 ? 's' : ''}`
    : 'Ruches illimitées';
  const ruchers = Number.isFinite(limites.ruchers)
    ? `${limites.ruchers} rucher${limites.ruchers > 1 ? 's' : ''}`
    : 'ruchers illimités';
  return `${ruches} · ${ruchers}`;
}

// ── Watchers ──────────────────────────────────────────────────────────────

// Reclampe le nombre de ruches quand le plan change (ex. choix Découverte → 1)
watch(
  () => form.selectedPlan,
  () => {
    if (form.nbRuches > maxRuches.value) form.nbRuches = maxRuches.value;
  },
);

// Pré-sélectionne les modules recommandés à l'entrée de l'étape modules (step 4),
// seulement si l'utilisateur n'a pas encore fait de choix (préserve ses ajustements).
watch(
  () => step.value,
  (newStep) => {
    if (newStep === 4 && form.modulesActifs.length === 0) {
      form.modulesActifs = [...(RECOMMENDED_BY_PROFIL[form.profilApicole] ?? [])];
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

function upgradeToTrial() {
  form.selectedPlan = 'trial';
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

async function skipRucher() {
  rucherSkipped.value = true;
  step.value++;
  saveProgress();
}

// ── Persistance de l'onboarding (survit au détour paiement Stripe) ──────────

function saveProgress() {
  if (!import.meta.client) return;
  try {
    localStorage.setItem(
      ONBOARDING_KEY,
      JSON.stringify({
        step: step.value,
        form: { ...form },
        rucher: { ...rucher },
        createdRucherId: createdRucherId.value,
        rucherSkipped: rucherSkipped.value,
      }),
    );
  } catch {
    /* quota / mode privé : on ignore, l'onboarding reste fonctionnel sans reprise */
  }
}

function clearProgress() {
  if (import.meta.client) localStorage.removeItem(ONBOARDING_KEY);
}

function restoreProgress(): boolean {
  if (!import.meta.client) return false;
  try {
    const raw = localStorage.getItem(ONBOARDING_KEY);
    if (!raw) return false;
    const snap = JSON.parse(raw) as {
      step?: number;
      form?: Record<string, unknown>;
      rucher?: Record<string, unknown>;
      createdRucherId?: string | null;
      rucherSkipped?: boolean;
    };
    if (snap.form) Object.assign(form, snap.form);
    if (snap.rucher) Object.assign(rucher, snap.rucher);
    if (snap.createdRucherId !== undefined) createdRucherId.value = snap.createdRucherId;
    if (typeof snap.rucherSkipped === 'boolean') rucherSkipped.value = snap.rucherSkipped;
    if (typeof snap.step === 'number') step.value = snap.step;
    return true;
  } catch {
    return false;
  }
}

// Sauvegarde continue tant qu'on configure (avant le détour Stripe et entre les étapes).
watch([form, rucher, step], () => saveProgress(), { deep: true });

// ── Paiement « carte d'abord » à l'étape plan ──────────────────────────────

async function startTrialCheckout() {
  const res = await $fetch<{ data: { url: string } }>('/api/stripe/trial-checkout', {
    method: 'POST',
    body: { context: 'onboarding', acceptCgv: acceptCgv.value },
  });
  analytics.capture('trial_started', { plan: 'pro_trial', trigger: 'onboarding' });
  if (res.data.url) window.location.href = res.data.url;
}

// Au retour de Stripe, le plan est activé par le webhook (asynchrone) : on attend
// brièvement qu'il soit reflété en base avant de laisser construire le rucher.
async function waitForPlanActive(maxTries = 8): Promise<boolean> {
  for (let i = 0; i < maxTries; i++) {
    await authStore.fetchProfil();
    if (planActif.value) return true;
    await new Promise((r) => setTimeout(r, 1500));
  }
  return false;
}

onMounted(async () => {
  const returnedFromStripe =
    route.query.trial === 'activated' || route.query.checkout === 'success';
  const canceled = route.query.canceled != null;

  if (returnedFromStripe) {
    activating.value = true;
    restoreProgress();
    const ok = await waitForPlanActive();
    activating.value = false;
    if (!ok) {
      notifications.warning(
        'Activation un peu plus longue que prévu',
        'Si la création de vos ruches échoue, patientez quelques secondes puis réessayez.',
      );
    }
    // Le plan est actif → on enchaîne sur la construction du rucher.
    step.value = 3;
    saveProgress();
    await router.replace({ path: '/onboarding' });
    return;
  }

  if (canceled) {
    restoreProgress();
    step.value = 2;
    notifications.info('Paiement annulé — vous pouvez choisir une autre formule.');
    await router.replace({ path: '/onboarding' });
    return;
  }

  restoreProgress();
});

async function nextStep() {
  saving.value = true;
  try {
    // Étape 2 (plan) : carte d'abord — on encaisse/active AVANT de construire.
    // Sauf Découverte (gratuit) ou plan déjà actif (retour de Stripe / back-nav).
    if (step.value === 2 && !planActif.value) {
      if (form.selectedPlan === 'trial') {
        saveProgress();
        await startTrialCheckout();
        return; // redirection externe vers Stripe → pas de step++
      }
      if (['starter', 'pro', 'expert'].includes(form.selectedPlan)) {
        saveProgress();
        const { checkout } = useSubscription();
        await checkout(
          form.selectedPlan as 'starter' | 'pro' | 'expert',
          'mois',
          'onboarding',
          acceptCgv.value,
        );
        return; // redirection externe vers Stripe → pas de step++
      }
      // decouverte → on avance simplement vers la construction.
    }

    // Création du rucher + ruches à la sortie de l'étape rucher (step 3).
    // Le plan est désormais actif → le plafond `maxRuches` correspond aux limites réelles.
    if (step.value === 3 && !rucherSkipped.value && !createdRucherId.value && rucher.nom) {
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
      // Tracking activation : le rucher/les ruches créés à l'onboarding doivent
      // alimenter le funnel (sans ça, ruche_created reste à 0 → activation
      // invisible, car la création passe par $fetch direct, pas le DataBus).
      analytics.capture('rucher_created', { source: 'onboarding' });

      // Create batch ruches (borné au plan choisi)
      const nb = Math.min(form.nbRuches, maxRuches.value);
      if (nb > 0) {
        const ruches = Array.from({ length: nb }, (_, i) => ({
          rucherId: res.data.id,
          numero: `Ruche ${i + 1}`,
          type: form.rucheType,
        }));
        await $fetch('/api/ruches', {
          method: 'POST',
          body: { ruches },
        });
        analytics.capture('ruche_created', { source: 'onboarding', count: nb });
      }
    }
    analytics.capture('onboarding_step_completed', { step: step.value, total_steps: TOTAL_STEPS });
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

    // 2. Complete onboarding — le plan/paiement a déjà été réglé à l'étape 2.
    await authStore.completeOnboarding();

    analytics.capture('onboarding_completed', {
      profil_apicole: form.profilApicole,
      plan_selected: form.selectedPlan,
      modules_actifs: form.modulesActifs,
      nb_ruches: form.nbRuches,
    });
    analytics.identify(authStore.profil?.id ?? '', {
      plan: authStore.profil?.plan,
      trial_active: authStore.profil?.trialActive,
      onboarding_complete: true,
      nb_ruches: form.nbRuches,
    });

    // 3. Nettoyage de la reprise + accès à l'espace
    clearProgress();
    if (form.profilApicole === 'loisir' || form.profilApicole === 'pluri_actif') {
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
