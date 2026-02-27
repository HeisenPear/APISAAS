<template>
  <div>
    <div class="mb-6">
      <h1 class="text-2xl font-bold tracking-tight text-stone-900">Parametres</h1>
      <p class="mt-1 text-sm text-stone-500">Gerez votre profil et vos preferences</p>
    </div>

    <!-- Loading -->
    <div v-if="!profil" class="space-y-6">
      <div v-for="i in 3" :key="i" class="h-48 animate-pulse rounded-2xl bg-stone-100" />
    </div>

    <template v-else>
      <!-- Profil personnel -->
      <form class="space-y-6" @submit.prevent="handleSave">
        <div class="rounded-2xl border border-stone-200/60 bg-white p-6 shadow-sm">
          <h2 class="mb-4 text-sm font-semibold uppercase tracking-wider text-stone-400">
            Profil personnel
          </h2>
          <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label class="mb-1.5 block text-sm font-medium text-stone-700">Prenom</label>
              <UInput v-model="form.prenom" placeholder="Votre prenom" />
            </div>
            <div>
              <label class="mb-1.5 block text-sm font-medium text-stone-700">Nom</label>
              <UInput v-model="form.nom" placeholder="Votre nom" />
            </div>
            <div>
              <label class="mb-1.5 block text-sm font-medium text-stone-700">Email</label>
              <UInput :model-value="profil.email" disabled />
              <p class="mt-1 text-xs text-stone-400">L'email ne peut pas etre modifie ici</p>
            </div>
            <div>
              <label class="mb-1.5 block text-sm font-medium text-stone-700">Telephone</label>
              <UInput v-model="form.telephone" type="tel" placeholder="06 12 34 56 78" />
            </div>
          </div>
        </div>

        <!-- Exploitation -->
        <div class="rounded-2xl border border-stone-200/60 bg-white p-6 shadow-sm">
          <h2 class="mb-4 text-sm font-semibold uppercase tracking-wider text-stone-400">
            Exploitation apicole
          </h2>
          <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div class="sm:col-span-2">
              <label class="mb-1.5 block text-sm font-medium text-stone-700">Adresse</label>
              <UInput v-model="form.adresse" placeholder="Adresse de l'exploitation" />
            </div>
            <div>
              <label class="mb-1.5 block text-sm font-medium text-stone-700">Code postal</label>
              <UInput v-model="form.codePostal" placeholder="75000" maxlength="5" />
            </div>
            <div>
              <label class="mb-1.5 block text-sm font-medium text-stone-700">Ville</label>
              <UInput v-model="form.ville" placeholder="Paris" />
            </div>
            <div>
              <label class="mb-1.5 block text-sm font-medium text-stone-700">NAPI</label>
              <UInput v-model="form.napi" placeholder="Numero apiculteur" />
              <p class="mt-1 text-xs text-stone-400">Numero d'apiculteur (GDSA / DDPP)</p>
            </div>
            <div>
              <label class="mb-1.5 block text-sm font-medium text-stone-700">SIRET</label>
              <UInput v-model="form.siret" placeholder="14 chiffres" maxlength="14" />
              <p class="mt-1 text-xs text-stone-400">Obligatoire pour la facturation</p>
            </div>
          </div>
        </div>

        <!-- Preferences -->
        <div class="rounded-2xl border border-stone-200/60 bg-white p-6 shadow-sm">
          <h2 class="mb-4 text-sm font-semibold uppercase tracking-wider text-stone-400">
            Preferences
          </h2>
          <div class="space-y-4">
            <label class="flex items-center justify-between">
              <div>
                <p class="text-sm font-medium text-stone-700">Alertes stock bas</p>
                <p class="text-xs text-stone-400">
                  Etre notifie quand un stock passe sous le seuil
                </p>
              </div>
              <UToggle v-model="prefs.alertesStock" />
            </label>
            <label class="flex items-center justify-between">
              <div>
                <p class="text-sm font-medium text-stone-700">Rappels interventions</p>
                <p class="text-xs text-stone-400">Rappel des interventions planifiees</p>
              </div>
              <UToggle v-model="prefs.rappelsInterventions" />
            </label>
            <label class="flex items-center justify-between">
              <div>
                <p class="text-sm font-medium text-stone-700">Alertes meteo</p>
                <p class="text-xs text-stone-400">Alertes gel et canicule par rucher</p>
              </div>
              <UToggle v-model="prefs.alertesMeteo" />
            </label>
            <label class="flex items-center justify-between">
              <div>
                <p class="text-sm font-medium text-stone-700">Digest hebdomadaire</p>
                <p class="text-xs text-stone-400">Resume par email chaque lundi</p>
              </div>
              <UToggle v-model="prefs.digestHebdo" />
            </label>
          </div>
        </div>

        <!-- Save button -->
        <div class="flex justify-end">
          <UButton
            type="submit"
            label="Enregistrer"
            icon="i-lucide-check"
            color="primary"
            :loading="saving"
          />
        </div>
      </form>

      <!-- Compte -->
      <div class="mt-6 rounded-2xl border border-stone-200/60 bg-white p-6 shadow-sm">
        <h2 class="mb-4 text-sm font-semibold uppercase tracking-wider text-stone-400">Compte</h2>
        <div class="space-y-3">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-stone-700">Plan actuel</p>
              <p class="text-xs text-stone-400">
                {{ planLabels[profil.plan] ?? profil.plan }}
              </p>
            </div>
            <UButton
              label="Gerer l'abonnement"
              icon="i-lucide-credit-card"
              variant="outline"
              color="neutral"
              size="sm"
              disabled
            />
          </div>
          <div class="border-t border-stone-100 pt-3">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm font-medium text-stone-700">Exporter mes donnees</p>
                <p class="text-xs text-stone-400">Telechargez toutes vos donnees (RGPD)</p>
              </div>
              <UButton
                label="Exporter"
                icon="i-lucide-download"
                variant="outline"
                color="neutral"
                size="sm"
                @click="exportData"
              />
            </div>
          </div>
          <div class="border-t border-stone-100 pt-3">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm font-medium text-red-600">Supprimer mon compte</p>
                <p class="text-xs text-stone-400">
                  Action irreversible, toutes les donnees seront perdues
                </p>
              </div>
              <UButton
                label="Supprimer"
                icon="i-lucide-trash-2"
                variant="ghost"
                color="error"
                size="sm"
                @click="handleDeleteAccount"
              />
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
const notifications = useNotifications();

const profil = computed(() => authStore.profil);
const saving = ref(false);

const planLabels: Record<string, string> = {
  decouverte: 'Decouverte (gratuit)',
  starter: 'Starter',
  pro: 'Pro',
  expert: 'Expert',
};

const form = reactive({
  nom: profil.value?.nom ?? '',
  prenom: profil.value?.prenom ?? '',
  telephone: profil.value?.telephone ?? '',
  adresse: profil.value?.adresse ?? '',
  codePostal: profil.value?.codePostal ?? '',
  ville: profil.value?.ville ?? '',
  napi: profil.value?.napi ?? '',
  siret: profil.value?.siret ?? '',
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
      preferences: { ...prefs },
    });
    notifications.success('Parametres enregistres');
  } catch (e: unknown) {
    notifications.error(getApiErrorMessage(e, 'Erreur lors de la sauvegarde'));
  } finally {
    saving.value = false;
  }
}

function exportData() {
  window.open('/api/finances/export?format=csv', '_blank');
  notifications.success('Export lance');
}

function handleDeleteAccount() {
  notifications.error('Contactez le support pour supprimer votre compte');
}
</script>
