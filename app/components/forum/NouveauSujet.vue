<template>
  <form
    class="space-y-3 rounded-[16px] border border-[var(--border-default)] bg-white p-4"
    @submit.prevent="soumettre"
  >
    <div>
      <label for="forum-titre" class="mb-1 block text-sm font-medium text-[var(--text-primary)]">
        Votre question
      </label>
      <UInput
        id="forum-titre"
        v-model="titre"
        placeholder="Ex. Traitement varroa fin août : acide oxalique ou lanières ?"
        :maxlength="200"
      />
    </div>

    <div>
      <label for="forum-message" class="mb-1 block text-sm font-medium text-[var(--text-primary)]">
        Précisez
      </label>
      <UTextarea
        id="forum-message"
        v-model="message"
        :rows="5"
        :maxlength="10000"
        placeholder="Le contexte aide beaucoup : région, nombre de colonies, ce que vous avez déjà essayé."
      />
    </div>

    <!--
      Le refus est une PHRASE, et elle vient du serveur telle quelle : plafond
      quotidien, titre déjà pris, message trop court. La réafficher mot pour mot
      évite qu'un code d'erreur remplace une explication.
    -->
    <p v-if="erreur" class="text-sm text-[var(--danger)]">{{ erreur }}</p>

    <div class="flex justify-end">
      <UButton type="submit" color="primary" :loading="envoi" :disabled="!valide">
        Publier
      </UButton>
    </div>
  </form>
</template>

<script setup lang="ts">
import { getApiErrorMessage } from '~/utils/apiError';

const emit = defineEmits<{ cree: [slug: string] }>();

const { ouvrirSujet } = useForum();

const titre = ref('');
const message = ref('');
const envoi = ref(false);
const erreur = ref('');

/**
 * ⚠️ LES MÊMES BORNES QUE LE SCHÉMA ZOD DE LA ROUTE (5/200 et 10/10 000).
 * Un bouton actif sur une saisie que le serveur refusera fait vivre le refus au
 * pire moment : après avoir tout tapé. Les deux doivent dire la même chose.
 */
const valide = computed(() => titre.value.trim().length >= 5 && message.value.trim().length >= 10);

async function soumettre() {
  if (!valide.value || envoi.value) return;
  envoi.value = true;
  erreur.value = '';
  try {
    const { slug } = await ouvrirSujet(titre.value.trim(), message.value.trim());
    titre.value = '';
    message.value = '';
    emit('cree', slug);
  } catch (e) {
    erreur.value = getApiErrorMessage(e);
  } finally {
    envoi.value = false;
  }
}
</script>
