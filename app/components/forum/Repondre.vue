<template>
  <form
    class="space-y-3 rounded-[12px] border border-[var(--border-default)] bg-white p-4"
    @submit.prevent="soumettre"
  >
    <label for="forum-reponse" class="block text-sm font-medium text-[var(--text-primary)]">
      Votre réponse
    </label>
    <UTextarea
      id="forum-reponse"
      v-model="contenu"
      :rows="4"
      :maxlength="10000"
      placeholder="Ce que vous avez observé, ce qui a marché chez vous…"
    />

    <p v-if="erreur" class="text-sm text-[var(--danger)]">{{ erreur }}</p>

    <div class="flex justify-end">
      <UButton type="submit" color="primary" :loading="envoi" :disabled="contenu.trim().length < 2">
        Répondre
      </UButton>
    </div>
  </form>
</template>

<script setup lang="ts">
import { getApiErrorMessage } from '~/utils/apiError';

const props = defineProps<{ sujetId: string }>();
const emit = defineEmits<{ envoye: [] }>();

const { repondre } = useForum();
const contenu = ref('');
const envoi = ref(false);
const erreur = ref('');

async function soumettre() {
  if (contenu.value.trim().length < 2 || envoi.value) return;
  envoi.value = true;
  erreur.value = '';
  try {
    await repondre(props.sujetId, contenu.value.trim());
    contenu.value = '';
    emit('envoye');
  } catch (e) {
    // Le plafond quotidien arrive ici sous forme de phrase : on la montre telle quelle.
    erreur.value = getApiErrorMessage(e);
  } finally {
    envoi.value = false;
  }
}
</script>
