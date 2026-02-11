<template>
  <form class="space-y-5" @submit.prevent="$emit('submit')">
    <!-- Rucher selection -->
    <UFormField label="Rucher" name="rucherId" required>
      <select
        :value="modelValue.rucherId"
        required
        class="h-9 w-full rounded-lg border border-stone-200 bg-white px-3 text-sm text-stone-700 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
        @change="update('rucherId', ($event.target as HTMLSelectElement).value)"
      >
        <option value="" disabled>Choisir un rucher</option>
        <option v-for="r in ruchers" :key="r.id" :value="r.id">{{ r.nom }}</option>
      </select>
    </UFormField>

    <!-- Numero -->
    <UFormField label="Numero / Nom" name="numero" required>
      <UInput
        :model-value="modelValue.numero"
        placeholder="ex: Ruche 01, R-2024-001"
        required
        class="w-full"
        @update:model-value="update('numero', $event)"
      />
    </UFormField>

    <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <!-- Type -->
      <UFormField label="Type de ruche" name="type" required>
        <select
          :value="modelValue.type"
          required
          class="h-9 w-full rounded-lg border border-stone-200 bg-white px-3 text-sm text-stone-700 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
          @change="update('type', ($event.target as HTMLSelectElement).value)"
        >
          <option value="dadant_10">Dadant 10 cadres</option>
          <option value="dadant_12">Dadant 12 cadres</option>
          <option value="langstroth">Langstroth</option>
          <option value="warre">Warre</option>
          <option value="voirnot">Voirnot</option>
          <option value="kenyane">Kenyane (TBH)</option>
          <option value="autre">Autre</option>
        </select>
      </UFormField>

      <!-- Statut -->
      <UFormField label="Statut" name="statut">
        <select
          :value="modelValue.statut"
          class="h-9 w-full rounded-lg border border-stone-200 bg-white px-3 text-sm text-stone-700 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
          @change="update('statut', ($event.target as HTMLSelectElement).value)"
        >
          <option value="active">Active</option>
          <option value="faible">Faible</option>
          <option value="orpheline">Orpheline</option>
          <option value="essaimee">Essaimee</option>
          <option value="morte">Morte</option>
          <option value="vendue">Vendue</option>
          <option value="fusionnee">Fusionnee</option>
        </select>
      </UFormField>
    </div>

    <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <!-- Race -->
      <UFormField label="Race d'abeille" name="raceAbeille">
        <select
          :value="modelValue.raceAbeille"
          class="h-9 w-full rounded-lg border border-stone-200 bg-white px-3 text-sm text-stone-700 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
          @change="update('raceAbeille', ($event.target as HTMLSelectElement).value)"
        >
          <option value="inconnue">Inconnue</option>
          <option value="noire">Noire</option>
          <option value="buckfast">Buckfast</option>
          <option value="carnica">Carnica</option>
          <option value="italienne">Italienne</option>
          <option value="caucasienne">Caucasienne</option>
          <option value="hybride">Hybride</option>
        </select>
      </UFormField>

      <!-- Qualite reine -->
      <UFormField label="Qualite de la reine" name="qualiteReine">
        <select
          :value="modelValue.qualiteReine"
          class="h-9 w-full rounded-lg border border-stone-200 bg-white px-3 text-sm text-stone-700 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
          @change="update('qualiteReine', ($event.target as HTMLSelectElement).value)"
        >
          <option value="inconnue">Inconnue</option>
          <option value="excellente">Excellente</option>
          <option value="bonne">Bonne</option>
          <option value="moyenne">Moyenne</option>
          <option value="faible">Faible</option>
          <option value="absente">Absente</option>
        </select>
      </UFormField>
    </div>

    <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <!-- Date installation -->
      <UFormField label="Date d'installation" name="dateInstallation">
        <UInput
          type="date"
          :model-value="modelValue.dateInstallation"
          class="w-full"
          @update:model-value="update('dateInstallation', $event)"
        />
      </UFormField>

      <!-- Origine essaim -->
      <UFormField label="Origine de l'essaim" name="origineEssaim">
        <UInput
          :model-value="modelValue.origineEssaim"
          placeholder="Achat, essaimage, division..."
          class="w-full"
          @update:model-value="update('origineEssaim', $event)"
        />
      </UFormField>
    </div>

    <div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <!-- Marquage reine -->
      <UFormField label="Marquage reine" name="marquageReine">
        <UInput
          :model-value="modelValue.marquageReine"
          placeholder="Bleu 2025"
          class="w-full"
          @update:model-value="update('marquageReine', $event)"
        />
      </UFormField>

      <!-- Nombre cadres -->
      <UFormField label="Nombre de cadres" name="nombreCadres">
        <UInput
          type="number"
          :model-value="modelValue.nombreCadres"
          :min="0"
          :max="30"
          class="w-full"
          @update:model-value="update('nombreCadres', $event ? Number($event) : undefined)"
        />
      </UFormField>

      <!-- Nombre hausses -->
      <UFormField label="Nombre de hausses" name="nombreHausses">
        <UInput
          type="number"
          :model-value="modelValue.nombreHausses"
          :min="0"
          :max="10"
          class="w-full"
          @update:model-value="update('nombreHausses', $event ? Number($event) : undefined)"
        />
      </UFormField>
    </div>

    <!-- Notes -->
    <UFormField label="Notes" name="notes">
      <UTextarea
        :model-value="modelValue.notes"
        placeholder="Observations, historique..."
        :rows="3"
        class="w-full"
        @update:model-value="update('notes', $event)"
      />
    </UFormField>

    <!-- Submit -->
    <div class="flex justify-end pt-2">
      <UButton type="submit" :label="submitLabel" color="primary" :loading="loading" />
    </div>
  </form>
</template>

<script setup lang="ts">
import type { Rucher } from '~/types/models';

export interface RucheFormData {
  rucherId: string;
  numero: string;
  type: string;
  statut: string;
  raceAbeille: string;
  qualiteReine: string;
  dateInstallation: string;
  origineEssaim: string;
  marquageReine: string;
  nombreCadres: number | undefined;
  nombreHausses: number | undefined;
  notes: string;
}

const props = defineProps<{
  modelValue: RucheFormData;
  loading?: boolean;
  submitLabel?: string;
  ruchers: Rucher[];
}>();

const emit = defineEmits<{
  'update:modelValue': [value: RucheFormData];
  submit: [];
}>();

function update<K extends keyof RucheFormData>(key: K, value: RucheFormData[K]) {
  emit('update:modelValue', { ...props.modelValue, [key]: value });
}
</script>
