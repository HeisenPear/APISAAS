<template>
  <div>
    <!-- Back + Header -->
    <div class="mb-6">
      <NuxtLink
        to="/ruchers"
        class="mb-3 inline-flex items-center gap-1 text-sm text-stone-500 transition-colors hover:text-stone-700"
      >
        <UIcon name="i-lucide-arrow-left" class="h-4 w-4" />
        Retour aux ruchers
      </NuxtLink>
      <h1 class="text-2xl font-bold tracking-tight text-stone-900">Nouveau rucher</h1>
      <p class="mt-1 text-sm text-stone-500">Ajoutez un nouvel emplacement pour vos ruches</p>
    </div>

    <!-- Form card -->
    <div class="mx-auto max-w-2xl rounded-2xl border border-stone-200/60 bg-white p-6 shadow-sm">
      <RuchersRucherForm
        v-model="formData"
        :loading="saving"
        submit-label="Creer le rucher"
        @submit="handleSubmit"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'default' });

const router = useRouter();
const notifications = useNotifications();
const { createRucher } = useRuchers();

const saving = ref(false);

const formData = ref({
  nom: '',
  description: '',
  adresse: '',
  commune: '',
  departement: '',
  codePostal: '',
  environnement: '',
  notesAcces: '',
  latitude: undefined as number | undefined,
  longitude: undefined as number | undefined,
});

async function handleSubmit() {
  if (!formData.value.nom.trim()) {
    notifications.warning('Le nom du rucher est requis');
    return;
  }

  saving.value = true;
  try {
    const rucher = await createRucher(formData.value);
    notifications.success('Rucher cree avec succes');
    await router.push(`/ruchers/${rucher.id}`);
  } catch (e: unknown) {
    notifications.error(getApiErrorMessage(e, 'Erreur lors de la creation'));
  } finally {
    saving.value = false;
  }
}
</script>
