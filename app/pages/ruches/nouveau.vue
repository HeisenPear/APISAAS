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
          Ajoutez une ruche — ou tout un lot d'un coup — à l'un de vos ruchers
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
        allow-bulk
        :submit-label="
          (formData.quantite ?? 1) > 1 ? `Créer ${formData.quantite} ruches` : 'Créer la ruche'
        "
        @submit="handleCreate"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { RucheFormData } from '~/components/ruches/RucheForm.vue';

definePageMeta({ layout: 'default' });

const notifications = useNotifications();
const { createRuche, createRuchesBatch } = useRuches();
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
  quantite: 1,
  numeroDepart: 1,
});

async function handleCreate() {
  const f = formData.value;
  if (!f.rucherId) return;
  const bulk = (f.quantite ?? 1) > 1;
  // En masse, le numéro sert de préfixe et peut être vide ; en simple il est requis.
  if (!bulk && !f.numero.trim()) return;
  saving.value = true;
  try {
    if (bulk) {
      const numeros = genererNumerosRuches(f.numero, f.numeroDepart ?? 1, f.quantite ?? 1);
      await createRuchesBatch(
        numeros.map((numero) => ({
          rucherId: f.rucherId,
          numero,
          type: f.type,
          statut: f.statut || undefined,
          raceAbeille: f.raceAbeille || undefined,
          dateInstallation: f.dateInstallation || undefined,
        })),
      );
      notifications.success(`${numeros.length} ruches créées 🐝`);
      await navigateTo(`/ruchers/${f.rucherId}`);
      return;
    }
    const newRuche = await createRuche({
      rucherId: f.rucherId,
      numero: f.numero,
      type: f.type,
      statut: f.statut || undefined,
      raceAbeille: f.raceAbeille || undefined,
      dateInstallation: f.dateInstallation || undefined,
    });
    notifications.success('Ruche créée avec succès');
    await navigateTo(`/ruches/${newRuche.id}`);
  } catch (e: unknown) {
    notifications.error(getApiErrorMessage(e, 'Erreur lors de la création'));
  } finally {
    saving.value = false;
  }
}
</script>
