<template>
  <article
    class="rounded-[12px] border px-4 py-3 transition-colors duration-200"
    :class="
      message.masque
        ? 'border-dashed border-[var(--border-default)] bg-[var(--surface-subtle)]'
        : 'border-[var(--border-default)] bg-white'
    "
  >
    <div class="flex items-start justify-between gap-3">
      <p class="text-xs text-[var(--text-tertiary)]">
        {{ message.auteur }} · {{ dateLisible(message.createdAt) }}
        <!--
          ⚠️ « MODIFIÉ LE … » EST DÛ AU LECTEUR. Corriger un message après que
          d'autres y ont répondu change le sens de leurs réponses ; le taire
          rendrait le fil trompeur pour qui arrive après.
        -->
        <span v-if="message.modifieLe" class="italic">
          · modifié le {{ dateLisible(message.modifieLe) }}
        </span>
      </p>

      <!--
        ⚠️ `estMien` VIENT DU SERVEUR, ON NE LE DEVINE PAS. L'auteur est réduit
        à un pseudonyme, et deux personnes peuvent porter « Camille D. » :
        comparer les libellés afficherait « modifier » sur le message d'un
        homonyme, que la route refuserait. Proposer puis refuser est le défaut
        qu'on ferme partout ailleurs dans ce produit.
      -->
      <div v-if="message.estMien && !message.masque && !edition" class="flex shrink-0 gap-1">
        <UButton
          size="xs"
          variant="ghost"
          color="neutral"
          icon="i-lucide-pencil"
          aria-label="Modifier mon message"
          @click="ouvrirEdition"
        />
        <UButton
          size="xs"
          variant="ghost"
          color="neutral"
          icon="i-lucide-trash-2"
          aria-label="Supprimer mon message"
          @click="emit('supprimer')"
        />
      </div>

      <!-- Signaler : le message de QUELQU'UN D'AUTRE, et jamais le sien. -->
      <UButton
        v-else-if="peutAgir && !message.estMien && !message.masque"
        size="xs"
        variant="ghost"
        color="neutral"
        icon="i-lucide-flag"
        aria-label="Signaler ce message"
        class="shrink-0"
        @click="emit('signaler')"
      />
    </div>

    <div v-if="edition" class="mt-2 space-y-2">
      <UTextarea v-model="brouillon" :rows="4" :maxlength="10000" />
      <p v-if="erreur" class="text-sm text-[var(--danger)]">{{ erreur }}</p>
      <div class="flex justify-end gap-2">
        <UButton size="sm" variant="ghost" color="neutral" @click="edition = false">
          Annuler
        </UButton>
        <UButton
          size="sm"
          color="primary"
          :loading="envoi"
          :disabled="brouillon.trim().length < 2"
          @click="enregistrer"
        >
          Enregistrer
        </UButton>
      </div>
    </div>

    <!--
      ⚠️ `whitespace-pre-wrap` ET RIEN D'AUTRE. On n'interprète NI markdown NI
      HTML : un forum public où le texte d'un inconnu devient du balisage est
      une porte ouverte, et `v-html` sur du contenu d'utilisateur est
      exactement la faille qu'on n'ouvre pas pour du gras. Les retours à la
      ligne suffisent à rendre un message lisible.
    -->
    <p
      v-else
      class="mt-2 whitespace-pre-wrap text-[15px] leading-relaxed"
      :class="message.masque ? 'italic text-[var(--text-tertiary)]' : 'text-[var(--text-primary)]'"
    >
      {{ message.contenu }}
    </p>
  </article>
</template>

<script setup lang="ts">
import type { MessageForum } from '~/composables/useForum';
import { getApiErrorMessage } from '~/utils/apiError';

const props = defineProps<{ message: MessageForum; peutAgir: boolean }>();
const emit = defineEmits<{ signaler: []; supprimer: []; modifie: [] }>();

const { modifierMessage } = useForum();
const edition = ref(false);
const brouillon = ref('');
const envoi = ref(false);
const erreur = ref('');

function ouvrirEdition() {
  brouillon.value = props.message.contenu;
  erreur.value = '';
  edition.value = true;
}

async function enregistrer() {
  if (brouillon.value.trim().length < 2 || envoi.value) return;
  envoi.value = true;
  erreur.value = '';
  try {
    await modifierMessage(props.message.id, brouillon.value.trim());
    edition.value = false;
    emit('modifie');
  } catch (e) {
    // Un message masqué entre-temps répond 404 avec sa phrase : on la montre.
    erreur.value = getApiErrorMessage(e);
  } finally {
    envoi.value = false;
  }
}

function dateLisible(iso: string): string {
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
</script>
