<template>
  <div class="space-y-6">
    <!-- Back link -->
    <NuxtLink
      to="/ruches"
      class="inline-flex items-center gap-1.5 text-xs font-medium transition-colors"
      style="color: var(--text-tertiary)"
      @mouseenter="
        ($event.currentTarget as HTMLAnchorElement).style.color = 'var(--text-secondary)'
      "
      @mouseleave="($event.currentTarget as HTMLAnchorElement).style.color = 'var(--text-tertiary)'"
    >
      <UIcon name="i-lucide-arrow-left" class="h-3.5 w-3.5" />
      Retour aux ruches
    </NuxtLink>

    <!-- Header -->
    <div class="flex items-center gap-4">
      <div
        class="flex h-11 w-11 shrink-0 items-center justify-center rounded-[12px]"
        style="background: var(--honey-soft)"
      >
        <UIcon name="i-lucide-hexagon" class="h-5 w-5" style="color: var(--honey)" />
      </div>
      <div>
        <h1 class="text-[26px] font-semibold tracking-[-0.02em]" style="color: var(--text-primary)">
          Nouvelle ruche
        </h1>
        <p class="text-sm" style="color: var(--text-secondary)">
          Associez une ruche à l'un de vos ruchers
        </p>
      </div>
    </div>

    <!-- Form card -->
    <div
      class="mx-auto max-w-2xl rounded-[16px] border bg-white p-6 shadow-sm"
      style="border-color: var(--border-default)"
    >
      <RuchesRucheForm
        v-model="formData"
        :loading="saving"
        :ruchers="ruchers"
        submit-label="Créer la ruche"
        @submit="handleCreate"
      />
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
    notifications.success('Votre ruche est créée 🐝');
    await navigateTo(`/ruches/${newRuche.id}`);
  } catch (e: unknown) {
    notifications.error(getApiErrorMessage(e, 'Erreur lors de la création'));
  } finally {
    saving.value = false;
  }
}
</script>
