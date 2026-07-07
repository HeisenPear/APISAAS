<script setup lang="ts">
import { useBanque } from '~/composables/useBanque';

const emit = defineEmits<{ imported: [] }>();

const toast = useToast();
const { importReleve } = useBanque();
const input = ref<HTMLInputElement | null>(null);
const loading = ref(false);

function choisir() {
  input.value?.click();
}

async function onFichier(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0];
  if (!file) return;
  loading.value = true;
  try {
    const contenu = await file.text();
    const res = await importReleve(contenu, file.name);
    if (!res || res.importes === 0) {
      toast.add({
        title: res?.doublons
          ? 'Relevé déjà importé (aucun nouveau mouvement)'
          : 'Aucun mouvement lisible dans ce fichier',
        color: 'warning',
      });
    } else {
      toast.add({
        title: `${res.importes} mouvement${res.importes > 1 ? 's' : ''} importé${res.importes > 1 ? 's' : ''}`,
        description:
          [
            res.doublons ? `${res.doublons} doublon(s) ignoré(s)` : '',
            res.ignorees ? `${res.ignorees} ligne(s) illisible(s)` : '',
          ]
            .filter(Boolean)
            .join(' · ') || undefined,
        color: 'success',
      });
      emit('imported');
    }
  } catch (err) {
    toast.add({ title: getApiErrorMessage(err, "Échec de l'import"), color: 'error' });
  } finally {
    loading.value = false;
    if (input.value) input.value.value = '';
  }
}
</script>

<template>
  <div
    class="flex flex-col items-center gap-3 rounded-[14px] border border-dashed border-[var(--border-default)] bg-[var(--surface-muted)] px-6 py-8 text-center"
  >
    <div class="flex h-11 w-11 items-center justify-center rounded-full bg-[var(--honey-soft)]">
      <UIcon name="i-lucide-upload" class="h-5 w-5 text-[var(--honey-deep)]" />
    </div>
    <div>
      <p class="text-sm font-medium text-[var(--text-primary)]">Importer un relevé bancaire</p>
      <p class="mt-1 text-xs text-[var(--text-tertiary)]">
        Fichier CSV ou OFX exporté depuis votre banque — vos identifiants ne quittent jamais votre
        banque.
      </p>
    </div>
    <UButton :loading="loading" color="primary" variant="soft" @click="choisir">
      Choisir un fichier
    </UButton>
    <input
      ref="input"
      type="file"
      accept=".csv,.ofx,.txt,text/csv"
      class="hidden"
      @change="onFichier"
    />
  </div>
</template>
