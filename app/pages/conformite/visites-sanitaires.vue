<script setup lang="ts">
definePageMeta({ layout: 'default' });

const showModal = ref(false);
const { data, pending, refresh } = await useFetch('/api/visites-sanitaires', { key: 'visites-list' });
const visites = computed(() => (data.value as any)?.data ?? []);

const { data: vetoData } = await useFetch('/api/veterinaires', { key: 'vetos-for-visites' });
const veterinaires = computed(() => (vetoData.value as any)?.data ?? []);

const { data: ruchersData } = await useFetch('/api/ruchers', { key: 'ruchers-for-visites' });
const ruchers = computed(() => (ruchersData.value as any)?.data ?? []);

const form = reactive({
  veterinaireId: '',
  rucherId: '',
  dateVisite: new Date().toISOString().slice(0, 10),
  observations: '',
  recommandations: '',
});

const saving = ref(false);
const toast = useToast();

async function handleSave() {
  saving.value = true;
  try {
    await $fetch('/api/visites-sanitaires', {
      method: 'POST',
      body: {
        ...form,
        dateVisite: new Date(form.dateVisite).toISOString(),
        veterinaireId: form.veterinaireId || undefined,
        rucherId: form.rucherId || undefined,
      },
    });
    toast.add({ title: 'Visite enregistrée', color: 'success' });
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
      title="Visites sanitaires"
      description="Registre des visites du vétérinaire sanitaire (obligatoire Art. 3 arrêté du 5 juin 2000)"
    >
      <template #actions>
        <UButton icon="i-lucide-plus" label="Ajouter une visite" color="primary" @click="showModal = true" />
      </template>
    </UiPageHeader>

    <div v-if="pending" class="space-y-3">
      <div v-for="i in 3" :key="i" class="h-16 animate-pulse rounded-2xl bg-stone-100" />
    </div>

    <div v-else-if="!visites.length" class="rounded-2xl border border-stone-200/60 bg-white p-12 text-center">
      <UIcon name="i-lucide-stethoscope" class="mx-auto h-10 w-10 text-stone-300" />
      <p class="mt-3 text-stone-500">Aucune visite enregistrée</p>
      <UButton class="mt-4" label="Ajouter une visite" color="primary" @click="showModal = true" />
    </div>

    <div v-else class="space-y-3">
      <div
        v-for="visite in visites"
        :key="visite.id"
        class="rounded-2xl border border-stone-200/60 bg-white p-4 shadow-sm"
      >
        <div class="flex items-start gap-3">
          <div class="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
            <UIcon name="i-lucide-stethoscope" class="h-5 w-5 text-blue-500" />
          </div>
          <div class="flex-1 min-w-0">
            <div class="flex items-center justify-between">
              <p class="font-semibold text-stone-900">
                {{ new Date(visite.dateVisite).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) }}
              </p>
              <p v-if="visite.veterinaireNom" class="text-sm text-stone-500">Dr. {{ visite.veterinaireNom }}</p>
            </div>
            <p v-if="visite.rucherNom" class="text-sm text-stone-500">Rucher : {{ visite.rucherNom }}</p>
            <p v-if="visite.observations" class="text-sm text-stone-600 mt-1 truncate">{{ visite.observations }}</p>
          </div>
        </div>
      </div>
    </div>

    <UModal v-model:open="showModal">
      <template #content>
        <div class="p-6 space-y-4">
          <h3 class="text-lg font-semibold text-stone-900">Nouvelle visite sanitaire</h3>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-sm font-medium text-stone-700 mb-1">Date *</label>
              <UInput v-model="form.dateVisite" type="date" />
            </div>
            <div>
              <label class="block text-sm font-medium text-stone-700 mb-1">Rucher</label>
              <select v-model="form.rucherId" class="w-full rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm focus:border-amber-400 focus:outline-none">
                <option value="">Tous les ruchers</option>
                <option v-for="r in ruchers" :key="r.id" :value="r.id">{{ r.nom }}</option>
              </select>
            </div>
          </div>
          <div>
            <label class="block text-sm font-medium text-stone-700 mb-1">Vétérinaire</label>
            <select v-model="form.veterinaireId" class="w-full rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm focus:border-amber-400 focus:outline-none">
              <option value="">Non renseigné</option>
              <option v-for="v in veterinaires" :key="v.id" :value="v.id">{{ v.nomComplet }}</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-stone-700 mb-1">Observations</label>
            <textarea v-model="form.observations" rows="3" class="w-full rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm focus:border-amber-400 focus:outline-none resize-none" placeholder="Observations du vétérinaire..." />
          </div>
          <div>
            <label class="block text-sm font-medium text-stone-700 mb-1">Recommandations</label>
            <textarea v-model="form.recommandations" rows="2" class="w-full rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm focus:border-amber-400 focus:outline-none resize-none" placeholder="Recommandations..." />
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
