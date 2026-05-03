<script setup lang="ts">
definePageMeta({ layout: 'default' });

const showModal = ref(false);
interface Mortalite {
  id: string;
  nombreColonies: number;
  dateConstatee: string;
  rucherNom?: string | null;
  causeSuspectee?: string | null;
  declarationTraces?: boolean;
  declarationAssurance?: boolean;
}

interface RucherOption {
  id: string;
  nom: string;
}

const { data, pending, refresh } = await useFetch('/api/mortalites', { key: 'mortalites-list' });
const mortalites = computed<Mortalite[]>(() => (data.value as { data: Mortalite[] } | null)?.data ?? []);

const { data: ruchersData } = await useFetch('/api/ruchers', { key: 'ruchers-for-mortalites' });
const ruchers = computed<RucherOption[]>(() => (ruchersData.value as { data: RucherOption[] } | null)?.data ?? []);

const CAUSES = ['Varroa', 'Famine', 'Pesticides', 'Maladie', 'Pillage', 'Froid', 'Inconnue', 'Autre'];
const TYPES = [
  { value: 'hiver', label: 'Mortalité hivernale' },
  { value: 'printemps', label: 'Mortalité printanière' },
  { value: 'ete', label: 'Mortalité estivale' },
  { value: 'automne', label: 'Mortalité automnale' },
  { value: 'aiguë', label: 'Mortalité aiguë (rapide)' },
];

const form = reactive({
  rucherId: '',
  dateConstatee: new Date().toISOString().slice(0, 10),
  type: 'hiver',
  nombreColonies: 1,
  causeSuspectee: '',
  declarationTraces: false,
  declarationAssurance: false,
  notes: '',
});

const saving = ref(false);
const toast = useToast();

async function handleSave() {
  saving.value = true;
  try {
    await $fetch('/api/mortalites', {
      method: 'POST',
      body: {
        ...form,
        dateConstatee: new Date(form.dateConstatee).toISOString(),
        rucherId: form.rucherId || undefined,
      },
    });
    toast.add({ title: 'Mortalité enregistrée', color: 'success' });
    showModal.value = false;
    await refresh();
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
      title="Mortalités"
      description="Registre des pertes de colonies (obligatoire pour registre d'élevage)"
    >
      <template #actions>
        <UButton icon="i-lucide-plus" label="Enregistrer une mortalité" color="primary" @click="showModal = true" />
      </template>
    </UiPageHeader>

    <div v-if="pending" class="space-y-3">
      <div v-for="i in 3" :key="i" class="h-16 animate-pulse rounded-2xl bg-stone-100" />
    </div>

    <div v-else-if="!mortalites.length" class="rounded-2xl border border-stone-200/60 bg-white p-12 text-center">
      <UIcon name="i-lucide-heart-off" class="mx-auto h-10 w-10 text-stone-300" />
      <p class="mt-3 text-stone-500">Aucune mortalité enregistrée</p>
    </div>

    <div v-else class="space-y-3">
      <div
        v-for="mort in mortalites"
        :key="mort.id"
        class="rounded-2xl border border-stone-200/60 bg-white p-4 shadow-sm"
      >
        <div class="flex items-start justify-between gap-3">
          <div class="flex items-start gap-3">
            <div class="h-10 w-10 rounded-xl bg-red-50 flex items-center justify-center shrink-0">
              <UIcon name="i-lucide-heart-off" class="h-5 w-5 text-red-400" />
            </div>
            <div>
              <p class="font-semibold text-stone-900">
                {{ mort.nombreColonies }} colonie{{ mort.nombreColonies > 1 ? 's' : '' }} perdues
              </p>
              <p class="text-sm text-stone-500">
                {{ new Date(mort.dateConstatee).toLocaleDateString('fr-FR') }}
                <span v-if="mort.rucherNom"> • {{ mort.rucherNom }}</span>
                <span v-if="mort.causeSuspectee"> • {{ mort.causeSuspectee }}</span>
              </p>
            </div>
          </div>
          <div class="flex gap-1 shrink-0">
            <UBadge v-if="mort.declarationTraces" label="TRACES" color="warning" variant="subtle" size="xs" />
            <UBadge v-if="mort.declarationAssurance" label="Assurance" color="info" variant="subtle" size="xs" />
          </div>
        </div>
      </div>
    </div>

    <UModal v-model:open="showModal">
      <template #content>
        <div class="p-6 space-y-4">
          <h3 class="text-lg font-semibold text-stone-900">Enregistrer une mortalité</h3>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-sm font-medium text-stone-700 mb-1">Date constatée *</label>
              <UInput v-model="form.dateConstatee" type="date" />
            </div>
            <div>
              <label class="block text-sm font-medium text-stone-700 mb-1">Nb colonies *</label>
              <UInput v-model="form.nombreColonies" type="number" :min="1" />
            </div>
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-sm font-medium text-stone-700 mb-1">Type</label>
              <select v-model="form.type" class="w-full rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm focus:border-amber-400 focus:outline-none">
                <option v-for="t in TYPES" :key="t.value" :value="t.value">{{ t.label }}</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-stone-700 mb-1">Rucher</label>
              <select v-model="form.rucherId" class="w-full rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm focus:border-amber-400 focus:outline-none">
                <option value="">Non renseigné</option>
                <option v-for="r in ruchers" :key="r.id" :value="r.id">{{ r.nom }}</option>
              </select>
            </div>
          </div>
          <div>
            <label class="block text-sm font-medium text-stone-700 mb-1">Cause suspectée</label>
            <select v-model="form.causeSuspectee" class="w-full rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm focus:border-amber-400 focus:outline-none">
              <option value="">Non renseignée</option>
              <option v-for="c in CAUSES" :key="c" :value="c">{{ c }}</option>
            </select>
          </div>
          <div class="space-y-2">
            <label class="flex items-center gap-2 cursor-pointer">
              <input v-model="form.declarationTraces" type="checkbox" class="rounded" />
              <span class="text-sm text-stone-700">Déclaration TRACES (mortalités suspectes)</span>
            </label>
            <label class="flex items-center gap-2 cursor-pointer">
              <input v-model="form.declarationAssurance" type="checkbox" class="rounded" />
              <span class="text-sm text-stone-700">Déclaration assurance</span>
            </label>
          </div>
          <div>
            <label class="block text-sm font-medium text-stone-700 mb-1">Notes</label>
            <textarea v-model="form.notes" rows="2" class="w-full rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm focus:border-amber-400 focus:outline-none resize-none"></textarea>
          </div>
          <div class="flex gap-3 justify-end">
            <UButton label="Annuler" color="neutral" variant="ghost" @click="showModal = false" />
            <UButton label="Enregistrer" color="primary" :loading="saving" @click="handleSave" />
          </div>
        </div>
      </template>
    </UModal>
  </div>
</template>
