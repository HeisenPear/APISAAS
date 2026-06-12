<script setup lang="ts">
definePageMeta({ layout: 'default' });

const showModal = ref(false);
const editId = ref<string | null>(null);
const { data, pending, refresh } = useFetch('/api/veterinaires', {
  key: 'veterinaires-page',
  lazy: true,
});
const { emit, on } = useDataBus();
on(['veterinaire:created', 'veterinaire:updated', 'veterinaire:deleted'], () => refresh());
onMounted(() => refresh());

interface VeterinaireRow {
  id: string;
  nomComplet: string;
  cabinet: string | null;
  telephone: string | null;
  email: string | null;
  estPrincipal: boolean;
}

const veterinaires = computed<VeterinaireRow[]>(
  () => (data.value as { data: VeterinaireRow[] } | null)?.data ?? [],
);

const form = reactive({
  nomComplet: '',
  cabinet: '',
  telephone: '',
  email: '',
  adresse: '',
  numeroOrdre: '',
  estPrincipal: false,
});

function openCreate() {
  editId.value = null;
  Object.assign(form, {
    nomComplet: '',
    cabinet: '',
    telephone: '',
    email: '',
    adresse: '',
    numeroOrdre: '',
    estPrincipal: false,
  });
  showModal.value = true;
}

function openEdit(veto: VeterinaireRow) {
  editId.value = veto.id;
  Object.assign(form, veto);
  showModal.value = true;
}

const saving = ref(false);
const toast = useToast();

async function handleSave() {
  saving.value = true;
  try {
    if (editId.value) {
      await $fetch(`/api/veterinaires/${editId.value}`, { method: 'PUT', body: form });
    } else {
      await $fetch('/api/veterinaires', { method: 'POST', body: form });
    }
    toast.add({
      title: editId.value ? 'Vétérinaire modifié' : 'Vétérinaire ajouté',
      color: 'success',
    });
    emit(
      editId.value ? 'veterinaire:updated' : 'veterinaire:created',
      editId.value ? { id: editId.value } : undefined,
    );
    showModal.value = false;
    await refresh();
  } catch {
    toast.add({ title: 'Erreur', color: 'error' });
  } finally {
    saving.value = false;
  }
}

async function handleDelete(id: string) {
  await $fetch(`/api/veterinaires/${id}`, { method: 'DELETE' });
  toast.add({ title: 'Vétérinaire supprimé', color: 'success' });
  emit('veterinaire:deleted', { id });
  await refresh();
}
</script>

<template>
  <div>
    <UiPageHeader
      title="Vétérinaires"
      description="Vos vétérinaires sanitaires — requis pour les ordonnances et visites"
    >
      <template #actions>
        <UButton icon="i-lucide-plus" label="Ajouter" color="primary" @click="openCreate" />
      </template>
    </UiPageHeader>

    <div v-if="pending" class="space-y-3">
      <div v-for="i in 2" :key="i" class="h-20 animate-pulse rounded-2xl bg-stone-100" />
    </div>

    <div
      v-else-if="!veterinaires.length"
      class="rounded-2xl border border-stone-200/60 bg-white p-12 text-center"
    >
      <UIcon name="i-lucide-user-round" class="mx-auto h-10 w-10 text-stone-300" />
      <p class="mt-3 text-stone-500">
        Ajoutez votre vétérinaire et gardez son contact à portée de main pour vos ordonnances et
        visites.
      </p>
      <UButton class="mt-4" label="Ajouter un vétérinaire" color="primary" @click="openCreate" />
    </div>

    <div v-else class="space-y-3">
      <div
        v-for="veto in veterinaires"
        :key="veto.id"
        class="rounded-2xl border border-stone-200/60 bg-white p-4 shadow-sm"
      >
        <div class="flex items-start justify-between">
          <div class="flex items-start gap-3">
            <div class="h-10 w-10 rounded-xl bg-stone-50 flex items-center justify-center shrink-0">
              <UIcon name="i-lucide-user-round" class="h-5 w-5 text-stone-400" />
            </div>
            <div>
              <div class="flex items-center gap-2">
                <p class="font-semibold text-stone-900">Dr. {{ veto.nomComplet }}</p>
                <UBadge
                  v-if="veto.estPrincipal"
                  label="Principal"
                  color="primary"
                  variant="subtle"
                  size="xs"
                />
              </div>
              <p v-if="veto.cabinet" class="text-sm text-stone-500">{{ veto.cabinet }}</p>
              <p class="text-sm text-stone-400">
                <span v-if="veto.telephone">{{ veto.telephone }}</span>
                <span v-if="veto.telephone && veto.email"> • </span>
                <span v-if="veto.email">{{ veto.email }}</span>
              </p>
            </div>
          </div>
          <div class="flex gap-2">
            <UButton
              icon="i-lucide-pencil"
              size="xs"
              color="neutral"
              variant="ghost"
              @click="openEdit(veto)"
            />
            <UButton
              icon="i-lucide-trash-2"
              size="xs"
              color="error"
              variant="ghost"
              @click="handleDelete(veto.id)"
            />
          </div>
        </div>
      </div>
    </div>

    <UModal v-model:open="showModal">
      <template #content>
        <div class="p-6 space-y-4">
          <h3 class="text-lg font-semibold text-stone-900">
            {{ editId ? 'Modifier' : 'Nouveau' }} vétérinaire
          </h3>
          <div>
            <label class="block text-sm font-medium text-stone-700 mb-1">Nom complet *</label>
            <UInput v-model="form.nomComplet" placeholder="Dupont Jean" />
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-sm font-medium text-stone-700 mb-1">Cabinet</label>
              <UInput v-model="form.cabinet" placeholder="Cabinet vétérinaire..." />
            </div>
            <div>
              <label class="block text-sm font-medium text-stone-700 mb-1">N° Ordre</label>
              <UInput v-model="form.numeroOrdre" placeholder="12345" />
            </div>
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-sm font-medium text-stone-700 mb-1">Téléphone</label>
              <UInput v-model="form.telephone" placeholder="06 00 00 00 00" />
            </div>
            <div>
              <label class="block text-sm font-medium text-stone-700 mb-1">Email</label>
              <UInput v-model="form.email" type="email" placeholder="veto@cabinet.fr" />
            </div>
          </div>
          <div>
            <label class="block text-sm font-medium text-stone-700 mb-1">Adresse</label>
            <UInput v-model="form.adresse" placeholder="1 rue de la Santé, 75001 Paris" />
          </div>
          <label class="flex items-center gap-2 cursor-pointer">
            <input v-model="form.estPrincipal" type="checkbox" class="rounded" />
            <span class="text-sm text-stone-700">Vétérinaire principal</span>
          </label>
          <div class="flex gap-3 justify-end pt-2">
            <UButton label="Annuler" color="neutral" variant="ghost" @click="showModal = false" />
            <UButton
              label="Enregistrer"
              color="primary"
              :loading="saving"
              :disabled="!form.nomComplet"
              @click="handleSave"
            />
          </div>
        </div>
      </template>
    </UModal>
  </div>
</template>
