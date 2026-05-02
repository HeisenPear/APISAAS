<script setup lang="ts">
definePageMeta({ layout: 'default' });

const filtre = ref<'actives' | 'passees' | 'toutes'>('actives');
const showModal = ref(false);

const { data, pending, refresh } = await useFetch(() => `/api/ordonnances?filtre=${filtre.value}`, {
  key: 'ordonnances-list',
});
const ordonnances = computed(() => (data.value as any)?.data ?? []);

watch(filtre, () => refresh());

const { data: vetoData } = await useFetch('/api/veterinaires', { key: 'vetos-list' });
const veterinaires = computed(() => (vetoData.value as any)?.data ?? []);

// Medicaments
const MEDICAMENTS = [
  'Apivar', 'Apitraz', 'Apiguard', 'Apilife Var', 'MAQS', 'VarroMed',
  'Api-Bioxal', 'Oxybee', 'Polyvar Yellow', 'Apistan', 'Tylan', 'Autre',
];

const DELAIS: Record<string, number> = {
  'Apivar': 0, 'Apitraz': 0, 'Apiguard': 0, 'Apilife Var': 0,
  'MAQS': 0, 'VarroMed': 0, 'Api-Bioxal': 0, 'Oxybee': 0,
  'Polyvar Yellow': 0, 'Apistan': 0, 'Tylan': 14,
};

const form = reactive({
  veterinaireId: '',
  datePrescription: new Date().toISOString().slice(0, 10),
  medicament: '',
  substance: '',
  posologie: '',
  dureeTraitementJours: 42,
  delaiAttenteAvantRecolteJours: 0,
  notes: '',
});

function onMedicamentChange() {
  form.delaiAttenteAvantRecolteJours = DELAIS[form.medicament] ?? 0;
}

const saving = ref(false);
const toast = useToast();

async function handleSave() {
  saving.value = true;
  try {
    await $fetch('/api/ordonnances', {
      method: 'POST',
      body: {
        ...form,
        datePrescription: new Date(form.datePrescription).toISOString(),
        veterinaireId: form.veterinaireId || undefined,
      },
    });
    toast.add({ title: 'Ordonnance enregistrée', color: 'success' });
    showModal.value = false;
    await refresh();
    Object.assign(form, {
      veterinaireId: '', datePrescription: new Date().toISOString().slice(0, 10),
      medicament: '', substance: '', posologie: '', dureeTraitementJours: 42,
      delaiAttenteAvantRecolteJours: 0, notes: '',
    });
  } catch {
    toast.add({ title: 'Erreur', color: 'error' });
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <div>
    <UiPageHeader
      title="Ordonnances vétérinaires"
      description="Suivi des prescriptions et délais d'attente avant récolte"
    >
      <template #actions>
        <UButton icon="i-lucide-plus" label="Nouvelle ordonnance" color="primary" @click="showModal = true" />
      </template>
    </UiPageHeader>

    <!-- Filtres -->
    <div class="mb-4 flex rounded-xl border border-stone-200 bg-white w-fit">
      <button
        v-for="opt in [{ value: 'actives', label: 'Actives' }, { value: 'passees', label: 'Passées' }, { value: 'toutes', label: 'Toutes' }]"
        :key="opt.value"
        class="px-4 py-1.5 text-sm font-medium transition-colors first:rounded-l-xl last:rounded-r-xl"
        :class="filtre === opt.value ? 'bg-stone-900 text-white' : 'text-stone-600 hover:text-stone-900'"
        @click="filtre = opt.value as 'actives' | 'passees' | 'toutes'"
      >
        {{ opt.label }}
      </button>
    </div>

    <!-- Loading -->
    <div v-if="pending" class="space-y-3">
      <div v-for="i in 3" :key="i" class="h-16 animate-pulse rounded-2xl bg-stone-100" />
    </div>

    <!-- Empty -->
    <div v-else-if="!ordonnances.length" class="rounded-2xl border border-stone-200/60 bg-white p-12 text-center">
      <UIcon name="i-lucide-pill" class="mx-auto h-10 w-10 text-stone-300" />
      <p class="mt-3 text-stone-500">Aucune ordonnance enregistrée</p>
      <UButton class="mt-4" label="Ajouter une ordonnance" color="primary" @click="showModal = true" />
    </div>

    <!-- Liste -->
    <div v-else class="space-y-3">
      <div
        v-for="ord in ordonnances"
        :key="ord.id"
        class="rounded-2xl border bg-white p-4 shadow-sm"
        :class="ord.enDelaiAttente ? 'border-red-200' : 'border-stone-200/60'"
      >
        <div class="flex items-start justify-between gap-3">
          <div class="flex items-start gap-3">
            <div
              class="mt-0.5 h-10 w-10 rounded-xl flex items-center justify-center shrink-0"
              :class="ord.enDelaiAttente ? 'bg-red-50' : 'bg-stone-50'"
            >
              <UIcon name="i-lucide-pill" class="h-5 w-5" :class="ord.enDelaiAttente ? 'text-red-500' : 'text-stone-400'" />
            </div>
            <div>
              <p class="font-semibold text-stone-900">{{ ord.medicament }}</p>
              <p class="text-sm text-stone-500">
                {{ new Date(ord.datePrescription).toLocaleDateString('fr-FR') }}
                <span v-if="ord.veterinaireNom"> • Dr. {{ ord.veterinaireNom }}</span>
              </p>
              <p v-if="ord.posologie" class="text-xs text-stone-400 mt-0.5">{{ ord.posologie }}</p>
            </div>
          </div>
          <div class="flex flex-col items-end gap-1 shrink-0">
            <UBadge
              v-if="ord.enDelaiAttente"
              label="Délai d'attente actif"
              color="error"
              variant="subtle"
              size="xs"
            />
            <p v-if="ord.enDelaiAttente" class="text-xs text-red-500">
              Jusqu'au {{ new Date(ord.dateFinDelaiAttente).toLocaleDateString('fr-FR') }}
            </p>
            <p v-else class="text-xs text-stone-400">Délai écoulé</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal nouvelle ordonnance -->
    <UModal v-model:open="showModal">
      <template #content>
        <div class="p-6 space-y-4">
          <h3 class="text-lg font-semibold text-stone-900">Nouvelle ordonnance</h3>

          <div>
            <label class="block text-sm font-medium text-stone-700 mb-1">Médicament *</label>
            <select
              v-model="form.medicament"
              class="w-full rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm focus:border-amber-400 focus:outline-none"
              @change="onMedicamentChange"
            >
              <option value="">Choisir un médicament</option>
              <option v-for="m in MEDICAMENTS" :key="m" :value="m">{{ m }}</option>
            </select>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-sm font-medium text-stone-700 mb-1">Date prescription *</label>
              <UInput v-model="form.datePrescription" type="date" />
            </div>
            <div>
              <label class="block text-sm font-medium text-stone-700 mb-1">Délai d'attente (jours) *</label>
              <UInput v-model="form.delaiAttenteAvantRecolteJours" type="number" :min="0" />
            </div>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-sm font-medium text-stone-700 mb-1">Durée traitement (jours)</label>
              <UInput v-model="form.dureeTraitementJours" type="number" :min="1" />
            </div>
            <div>
              <label class="block text-sm font-medium text-stone-700 mb-1">Vétérinaire</label>
              <select
                v-model="form.veterinaireId"
                class="w-full rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm focus:border-amber-400 focus:outline-none"
              >
                <option value="">Aucun</option>
                <option v-for="v in veterinaires" :key="v.id" :value="v.id">{{ v.nomComplet }}</option>
              </select>
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-stone-700 mb-1">Posologie</label>
            <UInput v-model="form.posologie" placeholder="Ex: 2 lanières par ruche, 6-8 semaines" />
          </div>

          <div>
            <label class="block text-sm font-medium text-stone-700 mb-1">Notes</label>
            <UInput v-model="form.notes" placeholder="Notes libres" />
          </div>

          <div class="flex gap-3 justify-end pt-2">
            <UButton label="Annuler" color="neutral" variant="ghost" @click="showModal = false" />
            <UButton label="Enregistrer" color="primary" :loading="saving" :disabled="!form.medicament" @click="handleSave" />
          </div>
        </div>
      </template>
    </UModal>
  </div>
</template>
