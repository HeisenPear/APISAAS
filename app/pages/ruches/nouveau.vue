<template>
  <div>
    <!-- Back link -->
    <NuxtLink
      to="/ruches"
      class="mb-4 inline-flex items-center gap-1 text-sm text-stone-500 transition-colors hover:text-stone-700"
    >
      <UIcon name="i-lucide-arrow-left" class="h-4 w-4" />
      Retour aux ruches
    </NuxtLink>

    <div class="mx-auto max-w-2xl">
      <h1 class="mb-6 text-2xl font-bold tracking-tight text-stone-900">Nouvelle ruche</h1>

      <div class="rounded-2xl border border-stone-200/60 bg-white p-6 shadow-sm">
        <RuchesRucheForm
          v-model="formData"
          :loading="saving"
          :ruchers="ruchers"
          submit-label="Creer la ruche"
          @submit="handleCreate"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { RucheFormData } from '~/components/ruches/RucheForm.vue';

definePageMeta({ layout: 'default' });

const notifications = useNotifications();
const { createRuche } = useRuches();
const { ruchers } = useRuchers();
const saving = ref(false);

const formData = ref<RucheFormData>({
  rucherId: '',
  numero: '',
  type: 'dadant_10',
  statut: 'active',
  raceAbeille: 'inconnue',
  qualiteReine: 'inconnue',
  dateInstallation: '',
  origineEssaim: '',
  marquageReine: '',
  nombreCadres: undefined,
  nombreHausses: undefined,
  notes: '',
});

async function handleCreate() {
  if (!formData.value.rucherId || !formData.value.numero.trim()) return;
  saving.value = true;
  try {
    const newRuche = await createRuche({
      rucherId: formData.value.rucherId,
      numero: formData.value.numero,
      type: formData.value.type,
      statut: formData.value.statut || undefined,
      raceAbeille: formData.value.raceAbeille || undefined,
      dateInstallation: formData.value.dateInstallation || undefined,
    });
    notifications.success('Ruche creee avec succes');
    await navigateTo(`/ruches/${newRuche.id}`);
  } catch (e: unknown) {
    notifications.error(e instanceof Error ? e.message : 'Erreur lors de la creation');
  } finally {
    saving.value = false;
  }
}
</script>
