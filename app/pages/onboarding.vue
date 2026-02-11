<template>
  <div class="flex min-h-dvh items-center justify-center bg-[var(--surface-primary)] px-4 py-8">
    <div class="w-full max-w-2xl">
      <!-- Header -->
      <div class="mb-8 text-center">
        <div
          class="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50"
        >
          <UIcon name="i-lucide-hexagon" class="h-8 w-8 text-amber-600" />
        </div>
        <h1 class="text-2xl font-bold tracking-tight text-stone-900">
          Bienvenue sur Apiculture 360°
        </h1>
        <p class="mt-1 text-sm text-stone-500">Configurons votre espace en quelques etapes</p>
      </div>

      <!-- Step indicator -->
      <div class="mb-8 flex items-center justify-center gap-2">
        <template v-for="s in 4" :key="s">
          <div
            class="flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium transition-all duration-300"
            :class="
              s < step
                ? 'bg-amber-500 text-white'
                : s === step
                  ? 'bg-amber-100 text-amber-700 ring-2 ring-amber-500'
                  : 'bg-stone-100 text-stone-400'
            "
          >
            <UIcon v-if="s < step" name="i-lucide-check" class="h-4 w-4" />
            <span v-else>{{ s }}</span>
          </div>
          <div
            v-if="s < 4"
            class="h-0.5 w-8 rounded-full transition-colors duration-300"
            :class="s < step ? 'bg-amber-500' : 'bg-stone-200'"
          />
        </template>
      </div>

      <!-- Card -->
      <div class="rounded-2xl border border-stone-200/60 bg-white p-8 shadow-sm">
        <!-- Step 1: Infos personnelles -->
        <Transition name="slide" mode="out-in">
          <div v-if="step === 1" key="step1">
            <h2 class="text-lg font-semibold text-stone-900">Vos informations</h2>
            <p class="mt-1 text-sm text-stone-500">
              Quelques infos pour personnaliser votre experience
            </p>

            <div class="mt-6 space-y-4">
              <div class="grid grid-cols-2 gap-3">
                <UFormField label="Prenom" name="prenom">
                  <UInput v-model="profil.prenom" placeholder="Jean" class="w-full" />
                </UFormField>
                <UFormField label="Nom" name="nom">
                  <UInput v-model="profil.nom" placeholder="Dupont" class="w-full" />
                </UFormField>
              </div>
              <UFormField label="Telephone" name="telephone">
                <UInput
                  v-model="profil.telephone"
                  type="tel"
                  placeholder="06 12 34 56 78"
                  icon="i-lucide-phone"
                  class="w-full"
                />
              </UFormField>
              <UFormField label="Adresse" name="adresse">
                <UInput
                  v-model="profil.adresse"
                  placeholder="12 rue des Abeilles"
                  icon="i-lucide-map-pin"
                  class="w-full"
                />
              </UFormField>
              <div class="grid grid-cols-2 gap-3">
                <UFormField label="Code postal" name="codePostal">
                  <UInput v-model="profil.codePostal" placeholder="75001" class="w-full" />
                </UFormField>
                <UFormField label="Ville" name="ville">
                  <UInput v-model="profil.ville" placeholder="Paris" class="w-full" />
                </UFormField>
              </div>
              <UFormField label="Numero NAPI (facultatif)" name="napi">
                <UInput
                  v-model="profil.napi"
                  placeholder="Ex: 75A12345"
                  icon="i-lucide-badge-check"
                  class="w-full"
                />
              </UFormField>
            </div>
          </div>

          <!-- Step 2: Premier rucher -->
          <div v-else-if="step === 2" key="step2">
            <h2 class="text-lg font-semibold text-stone-900">Votre premier rucher</h2>
            <p class="mt-1 text-sm text-stone-500">Ou se trouvent vos ruches ?</p>

            <div class="mt-6 space-y-4">
              <UFormField label="Nom du rucher" name="rucherNom">
                <UInput
                  v-model="rucher.nom"
                  placeholder="Mon rucher principal"
                  icon="i-lucide-map-pin"
                  required
                  class="w-full"
                />
              </UFormField>
              <UFormField label="Adresse / Lieu-dit" name="rucherAdresse">
                <UInput
                  v-model="rucher.adresse"
                  placeholder="Lieu-dit Les Tilleuls"
                  class="w-full"
                />
              </UFormField>
              <div class="grid grid-cols-2 gap-3">
                <UFormField label="Commune" name="rucherCommune">
                  <UInput v-model="rucher.commune" placeholder="Amboise" class="w-full" />
                </UFormField>
                <UFormField label="Departement" name="rucherDepartement">
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
                  placeholder="Foret, culture, mixte..."
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
                    <p v-else class="mt-0.5 text-xs text-stone-400">Non renseignee</p>
                  </div>
                  <UButton
                    label="Localiser"
                    icon="i-lucide-locate"
                    variant="outline"
                    size="sm"
                    :loading="geoLoading"
                    @click="detectLocation"
                  />
                </div>
              </div>
            </div>
          </div>

          <!-- Step 3: Premieres ruches -->
          <div v-else-if="step === 3" key="step3">
            <h2 class="text-lg font-semibold text-stone-900">Vos premieres ruches</h2>
            <p class="mt-1 text-sm text-stone-500">Ajoutez vos ruches rapidement par lot</p>

            <div class="mt-6 space-y-3">
              <div
                v-for="(ruche, index) in ruchesForm"
                :key="index"
                class="flex items-end gap-2 rounded-xl bg-stone-50 p-3"
              >
                <UFormField label="Numero" class="flex-1">
                  <UInput
                    v-model="ruche.numero"
                    :placeholder="`Ruche ${index + 1}`"
                    class="w-full"
                  />
                </UFormField>
                <UFormField label="Type" class="flex-1">
                  <select
                    v-model="ruche.type"
                    class="h-9 w-full rounded-lg border border-stone-200 bg-white px-3 text-sm text-stone-700 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                  >
                    <option value="dadant_10">Dadant 10</option>
                    <option value="dadant_12">Dadant 12</option>
                    <option value="langstroth">Langstroth</option>
                    <option value="warre">Warre</option>
                    <option value="voirnot">Voirnot</option>
                    <option value="kenyane">Kenyane</option>
                    <option value="autre">Autre</option>
                  </select>
                </UFormField>
                <UButton
                  v-if="ruchesForm.length > 1"
                  icon="i-lucide-trash-2"
                  variant="ghost"
                  color="error"
                  size="sm"
                  class="mb-0.5"
                  @click="ruchesForm.splice(index, 1)"
                />
              </div>

              <UButton
                label="Ajouter une ruche"
                icon="i-lucide-plus"
                variant="outline"
                color="neutral"
                block
                @click="addRuche"
              />
            </div>
          </div>

          <!-- Step 4: Choix du plan -->
          <div v-else-if="step === 4" key="step4">
            <h2 class="text-lg font-semibold text-stone-900">Choisissez votre plan</h2>
            <p class="mt-1 text-sm text-stone-500">Vous pouvez changer a tout moment</p>

            <div class="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <button
                v-for="plan in plans"
                :key="plan.id"
                type="button"
                class="rounded-xl border-2 p-5 text-left transition-all duration-200"
                :class="
                  selectedPlan === plan.id
                    ? 'border-amber-500 bg-amber-50 shadow-sm'
                    : 'border-stone-200 bg-white hover:border-stone-300'
                "
                @click="selectedPlan = plan.id"
              >
                <div class="flex items-center justify-between">
                  <span class="font-semibold text-stone-900">{{ plan.name }}</span>
                  <span
                    v-if="plan.id === 'pro'"
                    class="rounded-full bg-amber-500 px-2 py-0.5 text-[10px] font-bold text-white"
                  >
                    POPULAIRE
                  </span>
                </div>
                <p class="mt-2 text-2xl font-bold text-stone-900">
                  {{ plan.price
                  }}<span v-if="plan.price !== 'Gratuit'" class="text-sm font-normal text-stone-500"
                    >/mois</span
                  >
                </p>
                <p class="mt-1 text-xs text-stone-500">{{ plan.description }}</p>
              </button>
            </div>
          </div>
        </Transition>

        <!-- Navigation -->
        <div class="mt-8 flex items-center justify-between">
          <UButton
            v-if="step > 1"
            label="Precedent"
            icon="i-lucide-arrow-left"
            variant="ghost"
            color="neutral"
            @click="step--"
          />
          <div v-else />

          <div class="flex items-center gap-2">
            <UButton
              v-if="step > 1 && step < 4"
              label="Passer"
              variant="ghost"
              color="neutral"
              size="sm"
              @click="step++"
            />
            <UButton
              v-if="step < 4"
              label="Suivant"
              icon="i-lucide-arrow-right"
              trailing
              color="primary"
              :loading="saving"
              @click="nextStep"
            />
            <UButton
              v-else
              label="Commencer"
              icon="i-lucide-rocket"
              trailing
              color="primary"
              :loading="saving"
              @click="finishOnboarding"
            />
          </div>
        </div>
      </div>

      <p class="mt-6 text-center text-xs text-stone-400">
        &copy; {{ new Date().getFullYear() }} Apiculture 360°. Tous droits reserves.
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: false });

const authStore = useAuthStore();
const router = useRouter();
const notifications = useNotifications();

const step = ref(1);
const saving = ref(false);
const geoLoading = ref(false);
const createdRucherId = ref<string | null>(null);

// Step 1 data
const profil = reactive({
  prenom: authStore.profil?.prenom ?? '',
  nom: authStore.profil?.nom ?? '',
  telephone: '',
  adresse: '',
  codePostal: '',
  ville: '',
  napi: '',
});

// Step 2 data
const rucher = reactive({
  nom: '',
  adresse: '',
  commune: '',
  departement: '',
  environnement: '',
  latitude: undefined as number | undefined,
  longitude: undefined as number | undefined,
});

// Step 3 data
const ruchesForm = ref([
  { numero: 'Ruche 1', type: 'dadant_10' },
  { numero: 'Ruche 2', type: 'dadant_10' },
  { numero: 'Ruche 3', type: 'dadant_10' },
]);

// Step 4 data
const selectedPlan = ref('decouverte');

const plans = [
  {
    id: 'decouverte',
    name: 'Decouverte',
    price: 'Gratuit',
    description: "Jusqu'a 5 ruches, fonctions de base",
  },
  {
    id: 'starter',
    name: 'Starter',
    price: '19€',
    description: "Jusqu'a 30 ruches, stats avancees",
  },
  { id: 'pro', name: 'Pro', price: '49€', description: 'Ruches illimitees, toutes les fonctions' },
  {
    id: 'expert',
    name: 'Expert',
    price: '99€',
    description: 'Multi-exploitations, API, support premium',
  },
];

function addRuche() {
  ruchesForm.value.push({ numero: `Ruche ${ruchesForm.value.length + 1}`, type: 'dadant_10' });
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
      notifications.warning('Impossible de detecter votre position');
    },
  );
}

async function nextStep() {
  saving.value = true;
  try {
    if (step.value === 1) {
      await authStore.updateProfil({
        prenom: profil.prenom || undefined,
        nom: profil.nom || undefined,
        telephone: profil.telephone || undefined,
        adresse: profil.adresse || undefined,
        codePostal: profil.codePostal || undefined,
        ville: profil.ville || undefined,
        napi: profil.napi || undefined,
      });
    } else if (step.value === 2 && rucher.nom) {
      const res = await $fetch<{ data: { id: string } }>('/api/ruchers', {
        method: 'POST',
        body: rucher,
      });
      createdRucherId.value = res.data.id;
    } else if (step.value === 3 && createdRucherId.value && ruchesForm.value.length > 0) {
      await $fetch('/api/ruches', {
        method: 'POST',
        body: {
          ruches: ruchesForm.value.map((r) => ({
            rucherId: createdRucherId.value,
            numero: r.numero,
            type: r.type,
          })),
        },
      });
    }
    step.value++;
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Erreur lors de la sauvegarde';
    notifications.error(msg);
  } finally {
    saving.value = false;
  }
}

async function finishOnboarding() {
  saving.value = true;
  try {
    await authStore.completeOnboarding();
    notifications.success('Configuration terminee !');
    await router.push('/dashboard');
  } catch {
    notifications.error('Erreur lors de la finalisation');
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
