<template>
  <div class="space-y-6">
    <!-- Back link -->
    <NuxtLink
      to="/ruchers"
      class="inline-flex items-center gap-1.5 text-xs font-medium transition-colors"
      style="color: var(--text-tertiary)"
      @mouseenter="
        ($event.currentTarget as HTMLAnchorElement).style.color = 'var(--text-secondary)'
      "
      @mouseleave="($event.currentTarget as HTMLAnchorElement).style.color = 'var(--text-tertiary)'"
    >
      <UIcon name="i-lucide-arrow-left" class="h-3.5 w-3.5" />
      Retour aux ruchers
    </NuxtLink>

    <!-- Header -->
    <div class="flex items-center gap-4">
      <div
        class="flex h-11 w-11 shrink-0 items-center justify-center rounded-[12px]"
        style="background: var(--honey-soft)"
      >
        <UIcon name="i-lucide-map-pin" class="h-5 w-5" style="color: var(--honey)" />
      </div>
      <div>
        <h1 class="text-[26px] font-semibold tracking-[-0.02em]" style="color: var(--text-primary)">
          Nouveau rucher
        </h1>
        <p class="text-sm" style="color: var(--text-secondary)">
          Ajoutez un nouvel emplacement pour vos ruches
        </p>
      </div>
    </div>

    <!-- Form card -->
    <div
      class="mx-auto max-w-2xl rounded-[16px] border bg-white p-6 shadow-sm"
      style="border-color: var(--border-default)"
    >
      <RuchersRucherForm
        v-model="formData"
        :loading="saving"
        submit-label="Créer le rucher"
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
const analytics = useAnalytics();

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
    analytics.capture('rucher_created', {
      commune: formData.value.commune || undefined,
      departement: formData.value.departement || undefined,
      environnement: formData.value.environnement || undefined,
    });
    notifications.success('Rucher créé avec succès');
    await router.push(`/ruchers/${rucher.id}`);
  } catch (e: unknown) {
    notifications.error(getApiErrorMessage(e, 'Erreur lors de la création'));
  } finally {
    saving.value = false;
  }
}
</script>
