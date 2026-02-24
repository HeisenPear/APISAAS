<template>
  <div class="space-y-5">
    <!-- Type de rendez-vous -->
    <div>
      <label class="mb-3 block text-sm font-medium text-stone-600">Type de rendez-vous</label>
      <div class="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <button
          v-for="t in typesRdv"
          :key="t.value"
          type="button"
          class="flex flex-col items-center gap-2 rounded-xl border-2 px-3 py-3 text-center transition-all duration-200"
          :class="
            form.type_rdv === t.value
              ? 'border-violet-400 bg-violet-50 text-violet-700'
              : 'border-stone-200 bg-white text-stone-600 hover:border-stone-300 hover:bg-stone-50'
          "
          @click="form.type_rdv = t.value"
        >
          <UIcon :name="t.icon" class="h-5 w-5" />
          <span class="text-xs font-medium leading-tight">{{ t.label }}</span>
        </button>
      </div>
    </div>

    <!-- Statut -->
    <div>
      <label class="mb-2 block text-sm font-medium text-stone-600">Statut</label>
      <div class="flex flex-wrap gap-2">
        <button
          v-for="s in statuts"
          :key="s.value"
          type="button"
          class="flex items-center gap-2 rounded-xl border-2 px-4 py-2 text-sm font-medium transition-all duration-200"
          :class="
            form.statut === s.value
              ? `${s.activeClass} ring-2 ring-offset-1`
              : 'border-stone-200 bg-stone-100 text-stone-600 hover:bg-stone-200'
          "
          @click="form.statut = s.value"
        >
          <UIcon :name="s.icon" class="h-4 w-4" />
          {{ s.label }}
        </button>
      </div>
    </div>

    <!-- Détails -->
    <div class="space-y-4 rounded-xl bg-stone-50 p-4">
      <h4 class="text-xs font-semibold uppercase tracking-wider text-stone-400">Détails</h4>

      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label class="mb-1.5 block text-sm font-medium text-stone-600">Interlocuteur</label>
          <input
            v-model="form.interlocuteur"
            type="text"
            placeholder="Nom, entreprise, organisme…"
            class="h-9 w-full rounded-lg border border-stone-200 bg-white px-3 text-sm text-stone-700 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20"
          />
        </div>

        <div>
          <label class="mb-1.5 block text-sm font-medium text-stone-600">Lieu</label>
          <input
            v-model="form.lieu"
            type="text"
            placeholder="Adresse, cabinet, en ligne…"
            class="h-9 w-full rounded-lg border border-stone-200 bg-white px-3 text-sm text-stone-700 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20"
          />
        </div>
      </div>

      <div>
        <label class="mb-1.5 block text-sm font-medium text-stone-600">Notes</label>
        <textarea
          v-model="form.notes"
          :rows="3"
          placeholder="Ordre du jour, documents à préparer, suivi…"
          class="w-full rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm text-stone-700 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { DonneesRendezVousPro } from '~/types/interventions';

const props = defineProps<{
  modelValue: DonneesRendezVousPro;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: DonneesRendezVousPro];
}>();

const typesRdv = [
  { value: 'veterinaire' as const, label: 'Vétérinaire', icon: 'i-lucide-stethoscope' },
  { value: 'syndicat_apicole' as const, label: 'Syndicat apicole', icon: 'i-lucide-users' },
  { value: 'fournisseur' as const, label: 'Fournisseur', icon: 'i-lucide-package' },
  { value: 'client_acheteur' as const, label: 'Client / Acheteur', icon: 'i-lucide-handshake' },
  { value: 'formation' as const, label: 'Formation', icon: 'i-lucide-graduation-cap' },
  { value: 'certification' as const, label: 'Certification', icon: 'i-lucide-badge-check' },
  { value: 'inspection_dsa' as const, label: 'Inspection DSA', icon: 'i-lucide-clipboard-check' },
  { value: 'autre' as const, label: 'Autre', icon: 'i-lucide-more-horizontal' },
];

const statuts = [
  {
    value: 'planifie' as const,
    label: 'Planifié',
    icon: 'i-lucide-clock',
    activeClass: 'border-sky-400 bg-sky-50 text-sky-700',
  },
  {
    value: 'realise' as const,
    label: 'Réalisé',
    icon: 'i-lucide-check-circle-2',
    activeClass: 'border-emerald-400 bg-emerald-50 text-emerald-700',
  },
  {
    value: 'annule' as const,
    label: 'Annulé',
    icon: 'i-lucide-x-circle',
    activeClass: 'border-red-400 bg-red-50 text-red-700',
  },
];

const form = reactive<DonneesRendezVousPro>({
  type_rdv: props.modelValue.type_rdv ?? 'autre',
  statut: props.modelValue.statut ?? 'planifie',
  interlocuteur: props.modelValue.interlocuteur ?? '',
  lieu: props.modelValue.lieu ?? '',
  notes: props.modelValue.notes ?? '',
});

watch(
  () => ({ ...form }),
  () => {
    emit('update:modelValue', {
      type_rdv: form.type_rdv,
      statut: form.statut,
      interlocuteur: form.interlocuteur || undefined,
      lieu: form.lieu || undefined,
      notes: form.notes || undefined,
    });
  },
  { deep: true, immediate: true },
);
</script>
