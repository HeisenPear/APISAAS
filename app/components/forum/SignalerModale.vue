<template>
  <UModal :open="true" title="Signaler ce message" @update:open="emit('ferme')">
    <template #body>
      <div class="space-y-3">
        <p class="text-sm text-[var(--text-secondary)]">
          Un message signalé par {{ SEUIL_MASQUAGE }} personnes différentes est masqué
          automatiquement, le temps d’être relu. Rien n’est supprimé.
        </p>

        <!--
          Les motifs viennent de `MOTIFS_ABUS` — jamais recopiés. `danger_sanitaire`
          est en tête parce que c'est le seul qui coûte des colonies.
        -->
        <fieldset class="space-y-1.5">
          <legend class="sr-only">Motif du signalement</legend>
          <label
            v-for="m in MOTIFS_ABUS"
            :key="m.value"
            class="flex cursor-pointer items-start gap-2 rounded-[10px] border px-3 py-2 transition-colors duration-200"
            :class="
              motif === m.value
                ? 'border-[var(--honey)] bg-[var(--honey-soft)]'
                : 'border-[var(--border-default)] hover:bg-[var(--surface-hover)]'
            "
          >
            <input v-model="motif" type="radio" :value="m.value" class="mt-1 shrink-0" />
            <span class="min-w-0">
              <span class="block text-sm font-medium text-[var(--text-primary)]">
                {{ m.label }}
              </span>
              <span v-if="m.description" class="block text-xs text-[var(--text-tertiary)]">
                {{ m.description }}
              </span>
            </span>
          </label>
        </fieldset>

        <UTextarea
          v-model="precision"
          :rows="2"
          :maxlength="1000"
          placeholder="Précisez si besoin (facultatif)"
        />

        <p v-if="erreur" class="text-sm text-[var(--danger)]">{{ erreur }}</p>
      </div>
    </template>

    <template #footer>
      <div class="flex w-full justify-end gap-2">
        <UButton variant="ghost" color="neutral" @click="emit('ferme')">Annuler</UButton>
        <UButton color="primary" :loading="envoi" :disabled="!motif" @click="envoyer">
          Signaler
        </UButton>
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import { MOTIFS_ABUS, type MotifAbus } from '~/config/forum';
import { SEUIL_MASQUAGE } from '~/utils/forumModeration';
import { getApiErrorMessage } from '~/utils/apiError';

const props = defineProps<{ messageId: string }>();
const emit = defineEmits<{ ferme: []; signale: [] }>();

const { signaler } = useForum();
const motif = ref<MotifAbus | ''>('');
const precision = ref('');
const envoi = ref(false);
const erreur = ref('');

async function envoyer() {
  if (!motif.value || envoi.value) return;
  envoi.value = true;
  erreur.value = '';
  try {
    await signaler(props.messageId, motif.value, precision.value.trim() || undefined);
    emit('signale');
  } catch (e) {
    /**
     * ⚠️ TROIS REFUS ARRIVENT ICI, ET TOUS SONT DES PHRASES. Droit de signaler
     * suspendu (403), plafond quotidien (429), son propre message (400). Aucune
     * ne doit devenir un code : le refus doit dire quoi faire — écrire depuis
     * Réglages › Aide pour le premier, revenir demain pour le deuxième,
     * supprimer plutôt que signaler pour le troisième.
     */
    erreur.value = getApiErrorMessage(e);
  } finally {
    envoi.value = false;
  }
}
</script>
