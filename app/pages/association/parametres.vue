<template>
  <div>
    <UiPageHeader
      :title="organisation ? 'Parametres de l\'association' : 'Creer votre association'"
      :description="
        organisation
          ? 'Modifiez les informations de votre structure'
          : 'Renseignez les informations de votre structure pour demarrer'
      "
      :breadcrumbs="[{ label: 'Association', to: '/association' }, { label: 'Parametres' }]"
    />

    <!-- Loading -->
    <div v-if="orgPending" class="max-w-2xl space-y-4">
      <div v-for="i in 6" :key="i" class="h-12 animate-pulse rounded-xl bg-stone-100" />
    </div>

    <!-- Form -->
    <form v-else class="max-w-2xl" @submit.prevent="handleSubmit">
      <div class="space-y-6 rounded-2xl border border-stone-200/60 bg-white p-6 shadow-sm">
        <!-- Nom -->
        <div>
          <label class="mb-1.5 block text-sm font-medium text-stone-700">
            Nom de l'organisation *
          </label>
          <UInput
            v-model="form.nom"
            placeholder="Ex: GDSA du Var, Syndicat Apicole 13..."
            required
            size="lg"
          />
        </div>

        <!-- Type -->
        <div>
          <label class="mb-1.5 block text-sm font-medium text-stone-700">
            Type de structure *
          </label>
          <select
            v-model="form.type"
            required
            class="h-10 w-full rounded-lg border border-stone-300 bg-white px-3 text-sm text-stone-900 transition-colors focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400/50"
          >
            <option value="" disabled>Selectionnez un type</option>
            <option value="gdsa">GDSA</option>
            <option value="syndicat">Syndicat apicole</option>
            <option value="cuma">CUMA</option>
            <option value="gie">GIE</option>
            <option value="gaec">GAEC</option>
            <option value="association">Association loi 1901</option>
            <option value="autre">Autre</option>
          </select>
        </div>

        <!-- SIRET -->
        <div>
          <label class="mb-1.5 block text-sm font-medium text-stone-700"> SIRET </label>
          <UInput v-model="form.siret" placeholder="123 456 789 00012" maxlength="17" />
        </div>

        <!-- Adresse -->
        <div>
          <label class="mb-1.5 block text-sm font-medium text-stone-700"> Adresse </label>
          <UInput v-model="form.adresse" placeholder="12 rue des Abeilles" />
        </div>

        <!-- Code postal + Ville -->
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label class="mb-1.5 block text-sm font-medium text-stone-700"> Code postal </label>
            <UInput v-model="form.codePostal" placeholder="83000" maxlength="5" />
          </div>
          <div>
            <label class="mb-1.5 block text-sm font-medium text-stone-700"> Ville </label>
            <UInput v-model="form.ville" placeholder="Toulon" />
          </div>
        </div>

        <!-- Email + Telephone -->
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label class="mb-1.5 block text-sm font-medium text-stone-700"> Email </label>
            <UInput v-model="form.email" type="email" placeholder="contact@gdsa83.fr" />
          </div>
          <div>
            <label class="mb-1.5 block text-sm font-medium text-stone-700"> Telephone </label>
            <UInput v-model="form.telephone" type="tel" placeholder="04 94 12 34 56" />
          </div>
        </div>
      </div>

      <!-- Actions -->
      <div class="mt-6 flex items-center gap-3">
        <UButton
          type="submit"
          :label="organisation ? 'Enregistrer' : 'Creer l\'association'"
          icon="i-lucide-check"
          color="primary"
          size="lg"
          :loading="saving"
          class="min-h-[44px]"
        />
        <UButton
          label="Annuler"
          variant="outline"
          color="neutral"
          to="/association"
          class="min-h-[44px]"
        />
      </div>

      <!-- Success message -->
      <div
        v-if="successMsg"
        class="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700"
      >
        {{ successMsg }}
      </div>

      <!-- Error message -->
      <div
        v-if="errorMsg"
        class="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
      >
        {{ errorMsg }}
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'default' });

const {
  organisation,
  pending: orgPending,
  createOrganisation,
  updateOrganisation,
} = useOrganisation();

const saving = ref(false);
const successMsg = ref('');
const errorMsg = ref('');

const form = reactive({
  nom: '',
  type: '',
  siret: '',
  adresse: '',
  codePostal: '',
  ville: '',
  email: '',
  telephone: '',
});

// Pre-fill form when org loads
watch(
  () => organisation.value,
  (org) => {
    if (org) {
      form.nom = org.nom;
      form.type = org.type;
      form.siret = org.siret ?? '';
      form.adresse = org.adresse ?? '';
      form.codePostal = org.codePostal ?? '';
      form.ville = org.ville ?? '';
      form.email = org.email ?? '';
      form.telephone = org.telephone ?? '';
    }
  },
  { immediate: true },
);

async function handleSubmit() {
  saving.value = true;
  successMsg.value = '';
  errorMsg.value = '';

  try {
    const payload = {
      nom: form.nom,
      type: form.type,
      siret: form.siret || undefined,
      adresse: form.adresse || undefined,
      codePostal: form.codePostal || undefined,
      ville: form.ville || undefined,
      email: form.email || undefined,
      telephone: form.telephone || undefined,
    };

    if (organisation.value) {
      await updateOrganisation(organisation.value.id, payload);
      successMsg.value = 'Parametres mis a jour avec succes';
    } else {
      await createOrganisation(payload as { nom: string; type: string });
      successMsg.value = 'Association creee avec succes';
      navigateTo('/association');
    }
  } catch (err: unknown) {
    const error = err as { data?: { message?: string }; message?: string };
    errorMsg.value = error.data?.message ?? error.message ?? 'Une erreur est survenue';
  } finally {
    saving.value = false;
  }
}
</script>
