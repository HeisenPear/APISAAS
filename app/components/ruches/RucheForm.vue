<template>
  <form class="space-y-6" @submit.prevent="$emit('submit')">

    <!-- Section: Emplacement -->
    <div class="space-y-3">
      <p class="text-[11px] font-semibold uppercase tracking-[0.12em]" style="color:var(--honey-deep)">Emplacement</p>
      <UFormField label="Rucher *" name="rucherId" required>
        <select
          :value="modelValue.rucherId"
          required
          class="form-select w-full h-10 rounded-[10px] border px-3 text-[14px] bg-white appearance-none cursor-pointer"
          style="border-color:var(--border-default);color:var(--text-primary)"
          @change="update('rucherId', ($event.target as HTMLSelectElement).value)"
        >
          <option value="" disabled>Choisir un rucher</option>
          <option v-for="r in ruchers" :key="r.id" :value="r.id">{{ r.nom }}</option>
        </select>
      </UFormField>
    </div>

    <!-- Section: Identité -->
    <div class="space-y-3">
      <p class="text-[11px] font-semibold uppercase tracking-[0.12em]" style="color:var(--honey-deep)">Identité</p>

      <UFormField label="Numéro / Nom *" name="numero" required>
        <UInput
          :model-value="modelValue.numero"
          placeholder="ex: Ruche 01, R-2024-001"
          required
          class="w-full"
          @update:model-value="update('numero', $event)"
        />
      </UFormField>

      <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <UFormField label="Type de ruche *" name="type" required>
          <select
            :value="modelValue.type"
            required
            class="form-select w-full h-10 rounded-[10px] border px-3 text-[14px] bg-white appearance-none cursor-pointer"
            style="border-color:var(--border-default);color:var(--text-primary)"
            @change="update('type', ($event.target as HTMLSelectElement).value)"
          >
            <option value="dadant_10">Dadant 10 cadres</option>
            <option value="dadant_12">Dadant 12 cadres</option>
            <option value="langstroth">Langstroth</option>
            <option value="warre">Warré</option>
            <option value="voirnot">Voirnot</option>
            <option value="kenyane">Kenyane (TBH)</option>
            <option value="autre">Autre</option>
          </select>
        </UFormField>

        <UFormField label="Statut" name="statut">
          <select
            :value="modelValue.statut"
            class="form-select w-full h-10 rounded-[10px] border px-3 text-[14px] bg-white appearance-none cursor-pointer"
            style="border-color:var(--border-default);color:var(--text-primary)"
            @change="update('statut', ($event.target as HTMLSelectElement).value)"
          >
            <option value="active">Active</option>
            <option value="faible">Faible</option>
            <option value="orpheline">Orpheline</option>
            <option value="essaimee">Essaimée</option>
            <option value="morte">Morte</option>
            <option value="vendue">Vendue</option>
            <option value="fusionnee">Fusionnée</option>
          </select>
        </UFormField>
      </div>
    </div>

    <!-- Section: Configuration (optionnel) -->
    <div class="space-y-3">
      <p class="text-[11px] font-semibold uppercase tracking-[0.12em]" style="color:var(--honey-deep)">Configuration <span class="normal-case font-normal" style="color:var(--text-tertiary)">— optionnel</span></p>

      <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <UFormField label="Race d'abeille" name="raceAbeille">
          <select
            :value="modelValue.raceAbeille"
            class="form-select w-full h-10 rounded-[10px] border px-3 text-[14px] bg-white appearance-none cursor-pointer"
            style="border-color:var(--border-default);color:var(--text-primary)"
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

        <UFormField label="Qualité de la reine" name="qualiteReine">
          <select
            :value="modelValue.qualiteReine"
            class="form-select w-full h-10 rounded-[10px] border px-3 text-[14px] bg-white appearance-none cursor-pointer"
            style="border-color:var(--border-default);color:var(--text-primary)"
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

      <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <UFormField label="Date d'installation" name="dateInstallation">
          <UInput
            type="date"
            :model-value="modelValue.dateInstallation"
            class="w-full"
            @update:model-value="update('dateInstallation', $event)"
          />
        </UFormField>
        <UFormField label="Origine de l'essaim" name="origineEssaim">
          <UInput
            :model-value="modelValue.origineEssaim"
            placeholder="Achat, essaimage, division..."
            class="w-full"
            @update:model-value="update('origineEssaim', $event)"
          />
        </UFormField>
      </div>

      <div class="grid grid-cols-3 gap-3">
        <UFormField label="Marquage reine" name="marquageReine">
          <UInput
            :model-value="modelValue.marquageReine"
            placeholder="Bleu 2025"
            class="w-full"
            @update:model-value="update('marquageReine', $event)"
          />
        </UFormField>
        <UFormField label="Cadres" name="nombreCadres">
          <UInput
            type="number"
            :model-value="modelValue.nombreCadres"
            :min="0"
            :max="30"
            placeholder="10"
            class="w-full"
            @update:model-value="update('nombreCadres', $event ? Number($event) : undefined)"
          />
        </UFormField>
        <UFormField label="Hausses" name="nombreHausses">
          <UInput
            type="number"
            :model-value="modelValue.nombreHausses"
            :min="0"
            :max="10"
            placeholder="0"
            class="w-full"
            @update:model-value="update('nombreHausses', $event ? Number($event) : undefined)"
          />
        </UFormField>
      </div>
    </div>

    <!-- Section: Notes -->
    <div class="space-y-3">
      <p class="text-[11px] font-semibold uppercase tracking-[0.12em]" style="color:var(--honey-deep)">Notes</p>
      <UFormField label="" name="notes">
        <UTextarea
          :model-value="modelValue.notes"
          placeholder="Observations, historique, particularités..."
          :rows="3"
          class="w-full"
          @update:model-value="update('notes', $event)"
        />
      </UFormField>
    </div>

    <!-- Submit -->
    <div class="flex justify-end border-t pt-5" style="border-color:var(--border-default)">
      <UButton type="submit" :label="submitLabel" icon="i-lucide-check" color="primary" :loading="loading" class="min-h-[44px]" />
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

const submitLabel = computed(() => props.submitLabel ?? 'Enregistrer');

function update<K extends keyof RucheFormData>(key: K, value: RucheFormData[K]) {
  emit('update:modelValue', { ...props.modelValue, [key]: value });
}
</script>

<style scoped>
.form-select:focus {
  outline: none;
  border-color: var(--honey);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--honey) 15%, transparent);
}
</style>
