<template>
  <div>
    <!-- Loading -->
    <div v-if="!profil" class="space-y-6">
      <div v-for="i in 4" :key="i" class="h-40 animate-pulse rounded-2xl bg-stone-100" />
    </div>

    <template v-else>
      <!-- Profile header card -->
      <div class="mb-8 rounded-2xl border border-stone-200/60 bg-white p-6 shadow-sm">
        <div class="flex items-center gap-5">
          <div
            class="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 text-2xl font-bold text-white shadow-md"
          >
            {{ initials }}
          </div>
          <div class="min-w-0 flex-1">
            <h1 class="text-xl font-bold text-stone-900">{{ profil.prenom }} {{ profil.nom }}</h1>
            <p class="text-sm text-stone-500">{{ profil.email }}</p>
            <div class="mt-1.5 flex items-center gap-2">
              <span
                class="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium"
                :class="planStyle"
              >
                <UIcon :name="planIcon" class="h-3 w-3" />
                {{ planLabels[profil.plan] ?? profil.plan }}
              </span>
              <span v-if="profil.napi" class="text-xs text-stone-400">
                NAPI {{ profil.napi }}
              </span>
            </div>
          </div>
          <UButton
            label="Se déconnecter"
            icon="i-lucide-log-out"
            variant="outline"
            color="neutral"
            @click="handleLogout"
          />
        </div>
      </div>

      <!-- Two-column layout -->
      <div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <!-- Left column: forms -->
        <div class="space-y-6 lg:col-span-2">
          <form @submit.prevent="handleSave">
            <!-- Profil personnel -->
            <div class="rounded-2xl border border-stone-200/60 bg-white shadow-sm">
              <div class="flex items-center gap-3 border-b border-stone-100 px-6 py-4">
                <div class="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50">
                  <UIcon name="i-lucide-user" class="h-4 w-4 text-amber-600" />
                </div>
                <h2 class="text-sm font-semibold text-stone-900">Profil personnel</h2>
              </div>
              <div class="grid grid-cols-1 gap-4 p-6 sm:grid-cols-2">
                <div>
                  <label class="mb-1.5 block text-xs font-medium text-stone-500">Prénom</label>
                  <UInput v-model="form.prenom" placeholder="Votre prénom" />
                </div>
                <div>
                  <label class="mb-1.5 block text-xs font-medium text-stone-500">Nom</label>
                  <UInput v-model="form.nom" placeholder="Votre nom" />
                </div>
                <div>
                  <label class="mb-1.5 block text-xs font-medium text-stone-500">Email</label>
                  <UInput :model-value="profil.email" disabled icon="i-lucide-lock" />
                </div>
                <div>
                  <label class="mb-1.5 block text-xs font-medium text-stone-500">Téléphone</label>
                  <UInput v-model="form.telephone" type="tel" placeholder="06 12 34 56 78" />
                </div>
              </div>
            </div>

            <!-- Exploitation -->
            <div class="mt-6 rounded-2xl border border-stone-200/60 bg-white shadow-sm">
              <div class="flex items-center gap-3 border-b border-stone-100 px-6 py-4">
                <div class="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50">
                  <UIcon name="i-lucide-hexagon" class="h-4 w-4 text-emerald-600" />
                </div>
                <div>
                  <h2 class="text-sm font-semibold text-stone-900">Exploitation apicole</h2>
                  <p class="text-xs text-stone-400">Informations légales et facturation</p>
                </div>
              </div>
              <div class="grid grid-cols-1 gap-4 p-6 sm:grid-cols-2">
                <div class="sm:col-span-2">
                  <label class="mb-1.5 block text-xs font-medium text-stone-500">Adresse</label>
                  <UInput
                    v-model="form.adresse"
                    placeholder="Adresse de l'exploitation"
                    icon="i-lucide-map-pin"
                  />
                </div>
                <div>
                  <label class="mb-1.5 block text-xs font-medium text-stone-500">Code postal</label>
                  <UInput v-model="form.codePostal" placeholder="75000" maxlength="5" />
                </div>
                <div>
                  <label class="mb-1.5 block text-xs font-medium text-stone-500">Ville</label>
                  <UInput v-model="form.ville" placeholder="Paris" />
                </div>
                <div>
                  <label class="mb-1.5 block text-xs font-medium text-stone-500">NAPI</label>
                  <UInput v-model="form.napi" placeholder="Numéro apiculteur (GDSA / DDPP)" />
                </div>
                <div>
                  <label class="mb-1.5 block text-xs font-medium text-stone-500">SIRET</label>
                  <UInput v-model="form.siret" placeholder="14 chiffres" maxlength="14" />
                </div>
                <div class="sm:col-span-2">
                  <label
                    class="flex items-center justify-between rounded-xl border border-stone-200 bg-stone-50 px-4 py-3"
                  >
                    <div>
                      <p class="text-sm font-medium text-stone-700">Option TVA sur les débits</p>
                      <p class="text-xs text-stone-400 mt-0.5">
                        Ajoute la mention "Option pour le paiement de la taxe d'après les débits"
                        sur toutes vos factures
                      </p>
                    </div>
                    <USwitch v-model="form.optionTvaDebits" />
                  </label>
                </div>
              </div>
            </div>

            <!-- Save -->
            <div class="mt-6 flex items-center justify-between">
              <p v-if="hasChanges" class="text-xs text-amber-600">Modifications non enregistrées</p>
              <span v-else />
              <UButton
                type="submit"
                label="Enregistrer les modifications"
                icon="i-lucide-check"
                color="primary"
                :loading="saving"
                :disabled="!hasChanges"
              />
            </div>
          </form>
        </div>

        <!-- Right column: quick actions -->
        <div class="space-y-6">
          <!-- Notifications -->
          <div class="rounded-2xl border border-stone-200/60 bg-white shadow-sm">
            <div class="flex items-center gap-3 border-b border-stone-100 px-6 py-4">
              <div class="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50">
                <UIcon name="i-lucide-bell" class="h-4 w-4 text-blue-600" />
              </div>
              <h2 class="text-sm font-semibold text-stone-900">Notifications</h2>
            </div>
            <div class="divide-y divide-stone-100 px-6">
              <label class="flex items-center justify-between py-3.5">
                <div>
                  <p class="text-sm text-stone-700">Stocks bas</p>
                  <p class="text-xs text-stone-400">Sous le seuil d'alerte</p>
                </div>
                <USwitch v-model="prefs.alertesStock" />
              </label>
              <label class="flex items-center justify-between py-3.5">
                <div>
                  <p class="text-sm text-stone-700">Interventions</p>
                  <p class="text-xs text-stone-400">Rappels planifiés</p>
                </div>
                <USwitch v-model="prefs.rappelsInterventions" />
              </label>
              <label class="flex items-center justify-between py-3.5">
                <div>
                  <p class="text-sm text-stone-700">Météo</p>
                  <p class="text-xs text-stone-400">Gel et canicule</p>
                </div>
                <USwitch v-model="prefs.alertesMeteo" />
              </label>
              <label class="flex items-center justify-between py-3.5">
                <div>
                  <p class="text-sm text-stone-700">Digest hebdo</p>
                  <p class="text-xs text-stone-400">Résumé chaque lundi</p>
                </div>
                <USwitch v-model="prefs.digestHebdo" />
              </label>
            </div>
          </div>

          <!-- Raccourcis -->
          <div class="rounded-2xl border border-stone-200/60 bg-white shadow-sm">
            <div class="divide-y divide-stone-100">
              <NuxtLink
                to="/parametres/facturation"
                class="flex w-full items-center justify-between px-6 py-3.5 text-left transition-colors hover:bg-stone-50"
              >
                <div class="flex items-center gap-3">
                  <div class="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50">
                    <UIcon name="i-lucide-credit-card" class="h-4 w-4 text-amber-600" />
                  </div>
                  <div>
                    <p class="text-sm font-medium text-stone-700">Abonnement</p>
                    <p class="text-xs text-stone-400">
                      {{ planLabels[profil.plan] ?? profil.plan }}
                    </p>
                  </div>
                </div>
                <UIcon name="i-lucide-chevron-right" class="h-4 w-4 text-stone-300" />
              </NuxtLink>
              <NuxtLink
                to="/parametres/equipe"
                class="flex w-full items-center justify-between px-6 py-3.5 text-left transition-colors hover:bg-stone-50"
              >
                <div class="flex items-center gap-3">
                  <div class="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50">
                    <UIcon name="i-lucide-users" class="h-4 w-4 text-emerald-600" />
                  </div>
                  <div>
                    <p class="text-sm font-medium text-stone-700">Équipe</p>
                    <p class="text-xs text-stone-400">Gérer vos collaborateurs</p>
                  </div>
                </div>
                <UIcon name="i-lucide-chevron-right" class="h-4 w-4 text-stone-300" />
              </NuxtLink>
            </div>
          </div>

          <!-- Sécurité -->
          <div class="rounded-2xl border border-stone-200/60 bg-white shadow-sm">
            <div class="flex items-center gap-3 border-b border-stone-100 px-6 py-4">
              <div class="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-50">
                <UIcon name="i-lucide-shield" class="h-4 w-4 text-violet-600" />
              </div>
              <h2 class="text-sm font-semibold text-stone-900">Sécurité</h2>
            </div>
            <div class="divide-y divide-stone-100">
              <button
                type="button"
                class="flex w-full items-center justify-between px-6 py-3.5 text-left transition-colors hover:bg-stone-50"
                @click="handleChangePassword"
              >
                <div class="flex items-center gap-3">
                  <UIcon name="i-lucide-key-round" class="h-4 w-4 text-stone-400" />
                  <span class="text-sm text-stone-700">Modifier le mot de passe</span>
                </div>
                <UIcon name="i-lucide-chevron-right" class="h-4 w-4 text-stone-300" />
              </button>
              <button
                type="button"
                class="flex w-full items-center justify-between px-6 py-3.5 text-left transition-colors hover:bg-stone-50"
                @click="handleLogout"
              >
                <div class="flex items-center gap-3">
                  <UIcon name="i-lucide-log-out" class="h-4 w-4 text-stone-400" />
                  <span class="text-sm text-stone-700">Se déconnecter</span>
                </div>
                <UIcon name="i-lucide-chevron-right" class="h-4 w-4 text-stone-300" />
              </button>
            </div>
          </div>

          <!-- Légal -->
          <div class="rounded-2xl border border-stone-200/60 bg-white shadow-sm">
            <div class="flex items-center gap-3 border-b border-stone-100 px-6 py-4">
              <div class="flex h-8 w-8 items-center justify-center rounded-lg bg-stone-100">
                <UIcon name="i-lucide-scale" class="h-4 w-4 text-stone-600" />
              </div>
              <h2 class="text-sm font-semibold text-stone-900">Légal</h2>
            </div>
            <div class="divide-y divide-stone-100">
              <NuxtLink
                to="/cgu"
                target="_blank"
                class="flex w-full items-center justify-between px-6 py-3.5 text-left transition-colors hover:bg-stone-50"
              >
                <div class="flex items-center gap-3">
                  <UIcon name="i-lucide-file-text" class="h-4 w-4 text-stone-400" />
                  <span class="text-sm text-stone-700">Conditions Générales d'Utilisation</span>
                </div>
                <UIcon name="i-lucide-external-link" class="h-4 w-4 text-stone-300" />
              </NuxtLink>
              <NuxtLink
                to="/politique-confidentialite"
                target="_blank"
                class="flex w-full items-center justify-between px-6 py-3.5 text-left transition-colors hover:bg-stone-50"
              >
                <div class="flex items-center gap-3">
                  <UIcon name="i-lucide-shield" class="h-4 w-4 text-stone-400" />
                  <span class="text-sm text-stone-700">Politique de confidentialité</span>
                </div>
                <UIcon name="i-lucide-external-link" class="h-4 w-4 text-stone-300" />
              </NuxtLink>
            </div>
          </div>

          <!-- Données & Danger zone -->
          <div class="rounded-2xl border border-stone-200/60 bg-white shadow-sm">
            <div class="flex items-center gap-3 border-b border-stone-100 px-6 py-4">
              <div class="flex h-8 w-8 items-center justify-center rounded-lg bg-stone-100">
                <UIcon name="i-lucide-database" class="h-4 w-4 text-stone-600" />
              </div>
              <h2 class="text-sm font-semibold text-stone-900">Données</h2>
            </div>
            <div class="divide-y divide-stone-100">
              <button
                type="button"
                class="flex w-full items-center justify-between px-6 py-3.5 text-left transition-colors hover:bg-stone-50"
                @click="exportData"
              >
                <div class="flex items-center gap-3">
                  <UIcon name="i-lucide-download" class="h-4 w-4 text-stone-400" />
                  <div>
                    <p class="text-sm text-stone-700">Exporter mes données</p>
                    <p class="text-xs text-stone-400">Format CSV (RGPD)</p>
                  </div>
                </div>
                <UIcon name="i-lucide-chevron-right" class="h-4 w-4 text-stone-300" />
              </button>
              <button
                type="button"
                class="flex w-full items-center justify-between px-6 py-3.5 text-left transition-colors hover:bg-red-50"
                @click="handleDeleteAccount"
              >
                <div class="flex items-center gap-3">
                  <UIcon name="i-lucide-trash-2" class="h-4 w-4 text-red-400" />
                  <div>
                    <p class="text-sm text-red-600">Supprimer mon compte</p>
                    <p class="text-xs text-stone-400">Irréversible</p>
                  </div>
                </div>
                <UIcon name="i-lucide-chevron-right" class="h-4 w-4 text-red-300" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'default' });

const authStore = useAuthStore();
const { logout, resetPassword } = useAuth();
const notifications = useNotifications();

const profil = computed(() => authStore.profil);
const initials = computed(() => authStore.initials);
const saving = ref(false);

const planLabels: Record<string, string> = {
  decouverte: 'Découverte',
  starter: 'Starter',
  pro: 'Pro',
  expert: 'Expert',
};

const planStyle = computed(() => {
  const styles: Record<string, string> = {
    decouverte: 'bg-stone-100 text-stone-600',
    starter: 'bg-blue-50 text-blue-700',
    pro: 'bg-amber-50 text-amber-700',
    expert: 'bg-violet-50 text-violet-700',
  };
  return styles[profil.value?.plan ?? ''] ?? 'bg-stone-100 text-stone-600';
});

const planIcon = computed(() => {
  const icons: Record<string, string> = {
    decouverte: 'i-lucide-sparkles',
    starter: 'i-lucide-zap',
    pro: 'i-lucide-crown',
    expert: 'i-lucide-gem',
  };
  return icons[profil.value?.plan ?? ''] ?? 'i-lucide-sparkles';
});

const form = reactive({
  nom: profil.value?.nom ?? '',
  prenom: profil.value?.prenom ?? '',
  telephone: profil.value?.telephone ?? '',
  adresse: profil.value?.adresse ?? '',
  codePostal: profil.value?.codePostal ?? '',
  ville: profil.value?.ville ?? '',
  napi: profil.value?.napi ?? '',
  siret: profil.value?.siret ?? '',
  optionTvaDebits: profil.value?.optionTvaDebits ?? false,
});

interface Preferences {
  alertesStock: boolean;
  rappelsInterventions: boolean;
  alertesMeteo: boolean;
  digestHebdo: boolean;
}

const savedPrefs = (profil.value?.preferences ?? {}) as Partial<Preferences>;
const prefs = reactive<Preferences>({
  alertesStock: savedPrefs.alertesStock ?? true,
  rappelsInterventions: savedPrefs.rappelsInterventions ?? true,
  alertesMeteo: savedPrefs.alertesMeteo ?? true,
  digestHebdo: savedPrefs.digestHebdo ?? false,
});

// Detect unsaved changes
const hasChanges = computed(() => {
  if (!profil.value) return false;
  const p = profil.value;
  const sp = (p.preferences ?? {}) as Partial<Preferences>;
  return (
    form.nom !== (p.nom ?? '') ||
    form.prenom !== (p.prenom ?? '') ||
    form.telephone !== (p.telephone ?? '') ||
    form.adresse !== (p.adresse ?? '') ||
    form.codePostal !== (p.codePostal ?? '') ||
    form.ville !== (p.ville ?? '') ||
    form.napi !== (p.napi ?? '') ||
    form.siret !== (p.siret ?? '') ||
    form.optionTvaDebits !== (p.optionTvaDebits ?? false) ||
    prefs.alertesStock !== (sp.alertesStock ?? true) ||
    prefs.rappelsInterventions !== (sp.rappelsInterventions ?? true) ||
    prefs.alertesMeteo !== (sp.alertesMeteo ?? true) ||
    prefs.digestHebdo !== (sp.digestHebdo ?? false)
  );
});

watch(profil, (p) => {
  if (!p) return;
  form.nom = p.nom ?? '';
  form.prenom = p.prenom ?? '';
  form.telephone = p.telephone ?? '';
  form.adresse = p.adresse ?? '';
  form.codePostal = p.codePostal ?? '';
  form.ville = p.ville ?? '';
  form.napi = p.napi ?? '';
  form.siret = p.siret ?? '';
  form.optionTvaDebits = p.optionTvaDebits ?? false;
  const sp = (p.preferences ?? {}) as Partial<Preferences>;
  prefs.alertesStock = sp.alertesStock ?? true;
  prefs.rappelsInterventions = sp.rappelsInterventions ?? true;
  prefs.alertesMeteo = sp.alertesMeteo ?? true;
  prefs.digestHebdo = sp.digestHebdo ?? false;
});

async function handleSave() {
  saving.value = true;
  try {
    await authStore.updateProfil({
      nom: form.nom || undefined,
      prenom: form.prenom || undefined,
      telephone: form.telephone || null,
      adresse: form.adresse || null,
      codePostal: form.codePostal || null,
      ville: form.ville || null,
      napi: form.napi || null,
      siret: form.siret || null,
      optionTvaDebits: form.optionTvaDebits,
      preferences: { ...prefs },
    });
    notifications.success('Paramètres enregistrés');
  } catch (e: unknown) {
    notifications.error(getApiErrorMessage(e, 'Erreur lors de la sauvegarde'));
  } finally {
    saving.value = false;
  }
}

async function handleChangePassword() {
  if (!profil.value?.email) return;
  const sent = await resetPassword(profil.value.email);
  if (sent) {
    notifications.success('Un email de réinitialisation a été envoyé à ' + profil.value.email);
  } else {
    notifications.error("Erreur lors de l'envoi de l'email");
  }
}

async function handleLogout() {
  await logout();
}

function exportData() {
  window.open('/api/finances/export?format=csv', '_blank');
  notifications.success('Export lancé');
}

function handleDeleteAccount() {
  notifications.error('Contactez le support pour supprimer votre compte');
}
</script>
