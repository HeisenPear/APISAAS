<template>
  <UModal v-model:open="ouvert" title="Réglages de la balance">
    <template #body>
      <div class="space-y-5">
        <!-- Identité -->
        <div class="grid gap-3 sm:grid-cols-2">
          <UFormField label="Nom">
            <UInput v-model="form.nom" placeholder="Balance rucher du bois" />
          </UFormField>
          <UFormField label="Statut">
            <USelect
              v-model="form.statut"
              :items="STATUTS.map((s) => ({ label: s.label, value: s.value }))"
              value-key="value"
              label-key="label"
            />
          </UFormField>
          <UFormField label="Marque">
            <UInput v-model="form.marque" placeholder="Optibee, BEEP…" />
          </UFormField>
          <UFormField label="Modèle">
            <UInput v-model="form.modele" placeholder="Optionnel" />
          </UFormField>
        </div>

        <!-- Liaison -->
        <div>
          <p
            class="mb-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--text-tertiary)]"
          >
            Sous quoi est-elle posée ?
          </p>
          <div class="grid gap-3 sm:grid-cols-3">
            <UFormField label="Ruche">
              <USelect
                v-model="form.rucheId"
                :items="optionsRuches"
                value-key="value"
                label-key="label"
              />
            </UFormField>
            <UFormField label="Hausse">
              <USelect
                v-model="form.hausseId"
                :items="optionsHausses"
                value-key="value"
                label-key="label"
              />
            </UFormField>
            <UFormField label="Rucher">
              <USelect
                v-model="form.rucherId"
                :items="optionsRuchers"
                value-key="value"
                label-key="label"
              />
            </UFormField>
          </div>
          <p class="mt-1.5 text-[11.5px] text-[var(--text-tertiary)]">
            Lier la hausse fait marcher le scan QR terrain : je scanne la hausse, je vois son poids.
          </p>
        </div>

        <!-- Tare -->
        <UFormField
          label="Tare (poids du matériel à vide)"
          hint="Retranchée du brut pour obtenir le poids net"
        >
          <UInput v-model="form.poidsTare" type="number" step="0.1" placeholder="ex. 18,5" />
        </UFormField>

        <!-- Seuils -->
        <div>
          <p
            class="mb-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--text-tertiary)]"
          >
            Seuils d’alerte
          </p>
          <div class="grid gap-3 sm:grid-cols-2">
            <UFormField
              v-for="s in CHAMPS_SEUILS"
              :key="s.cle"
              :label="s.label"
              :hint="s.hint"
              :description="s.aide"
            >
              <UInput
                v-model="form[s.cle]"
                type="number"
                :step="s.step"
                :placeholder="`Par défaut : ${s.defaut}`"
              />
            </UFormField>
          </div>
        </div>

        <UFormField label="Notes">
          <UTextarea v-model="form.notes" :rows="2" placeholder="Optionnel" />
        </UFormField>
      </div>
    </template>

    <template #footer>
      <div class="flex w-full items-center justify-between gap-3">
        <UButton color="error" variant="ghost" icon="i-lucide-trash-2" @click="supprimer">
          Supprimer
        </UButton>
        <div class="flex gap-2">
          <UButton color="neutral" variant="outline" @click="ouvert = false">Annuler</UButton>
          <UButton color="primary" :loading="enregistrement" @click="enregistrer">
            Enregistrer
          </UButton>
        </div>
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import { SEUILS_DEFAUT, STATUTS, type StatutBalance } from '~/config/balances';
import type { Balance, UpdateBalancePayload } from '~/composables/useBalances';

const props = defineProps<{ balance: Balance }>();
const emit = defineEmits<{ enregistre: []; supprime: [] }>();
const ouvert = defineModel<boolean>('open', { default: false });

const { updateBalance, deleteBalance } = useBalanceActions();
const notifications = useNotifications();

const { ruches } = useRuches();
const { hausses } = useHausses({ limit: ref(200) });
const { ruchers } = useRuchers();

/** Reka UI interdit une valeur vide dans un select → sentinelle 'none'. */
const AUCUN = 'none';

const CHAMPS_SEUILS = [
  {
    cle: 'seuilVariationKg' as const,
    label: 'Variation brutale',
    hint: 'kg',
    aide: 'Chute soudaine = essaimage ou vol.',
    step: '0.5',
    defaut: SEUILS_DEFAUT.variationKg,
  },
  {
    cle: 'seuilPoidsRecolteKg' as const,
    label: 'Hausse pleine',
    hint: 'kg',
    aide: 'Au-delà, on vous dit d’aller récolter.',
    step: '1',
    defaut: SEUILS_DEFAUT.poidsRecolteKg,
  },
  {
    cle: 'seuilBatteriePct' as const,
    label: 'Batterie faible',
    hint: '%',
    aide: 'Alerte avant que le capteur s’éteigne.',
    step: '5',
    defaut: SEUILS_DEFAUT.batteriePct,
  },
  {
    cle: 'seuilSilenceHeures' as const,
    label: 'Silence du capteur',
    hint: 'h',
    aide: 'Au-delà, la balance est signalée muette.',
    step: '1',
    defaut: SEUILS_DEFAUT.silenceHeures,
  },
];

const form = reactive({
  nom: '',
  marque: '',
  modele: '',
  statut: 'active' as StatutBalance,
  rucheId: AUCUN,
  hausseId: AUCUN,
  rucherId: AUCUN,
  poidsTare: '',
  seuilVariationKg: '',
  seuilPoidsRecolteKg: '',
  seuilBatteriePct: '',
  seuilSilenceHeures: '',
  notes: '',
});

/** Un decimal peut arriver en string (Drizzle) ou en number (agrégat SQL). */
function champTexte(v: string | number | null): string {
  return v === null || v === undefined ? '' : String(v);
}

function remplir() {
  const b = props.balance;
  form.nom = b.nom;
  form.marque = b.marque ?? '';
  form.modele = b.modele ?? '';
  form.statut = b.statut;
  form.rucheId = b.rucheId ?? AUCUN;
  form.hausseId = b.hausseId ?? AUCUN;
  form.rucherId = b.rucherId ?? AUCUN;
  form.poidsTare = champTexte(b.poidsTare);
  form.seuilVariationKg = champTexte(b.seuilVariationKg);
  form.seuilPoidsRecolteKg = champTexte(b.seuilPoidsRecolteKg);
  form.seuilBatteriePct = b.seuilBatteriePct?.toString() ?? '';
  form.seuilSilenceHeures = b.seuilSilenceHeures?.toString() ?? '';
  form.notes = b.notes ?? '';
}

watch(ouvert, (v) => v && remplir(), { immediate: true });

const optionsRuches = computed(() => [
  { label: 'Aucune', value: AUCUN },
  ...ruches.value.map((r) => ({ label: r.numero, value: r.id })),
]);
const optionsHausses = computed(() => [
  { label: 'Aucune', value: AUCUN },
  ...hausses.value.map((h) => ({ label: h.numero, value: h.id })),
]);
const optionsRuchers = computed(() => [
  { label: 'Aucun', value: AUCUN },
  ...ruchers.value.map((r) => ({ label: r.nom, value: r.id })),
]);

function texte(v: string): string | null {
  return v.trim() ? v.trim() : null;
}
function chiffre(v: string): number | null {
  const n = Number(v);
  return v.trim() && Number.isFinite(n) ? n : null;
}
function lien(v: string): string | null {
  return v === AUCUN ? null : v;
}

const enregistrement = ref(false);

async function enregistrer() {
  const payload: UpdateBalancePayload = {
    nom: form.nom.trim(),
    marque: texte(form.marque),
    modele: texte(form.modele),
    statut: form.statut,
    rucheId: lien(form.rucheId),
    hausseId: lien(form.hausseId),
    rucherId: lien(form.rucherId),
    poidsTare: chiffre(form.poidsTare),
    seuilVariationKg: chiffre(form.seuilVariationKg),
    seuilPoidsRecolteKg: chiffre(form.seuilPoidsRecolteKg),
    seuilBatteriePct: chiffre(form.seuilBatteriePct),
    seuilSilenceHeures: chiffre(form.seuilSilenceHeures),
    notes: texte(form.notes),
  };
  enregistrement.value = true;
  try {
    await updateBalance(props.balance.id, payload);
    notifications.success('Réglages enregistrés');
    ouvert.value = false;
    emit('enregistre');
  } catch (e) {
    notifications.error(getApiErrorMessage(e));
  } finally {
    enregistrement.value = false;
  }
}

async function supprimer() {
  if (!confirm(`Supprimer « ${props.balance.nom} » et tout son historique de mesures ?`)) return;
  try {
    await deleteBalance(props.balance.id);
    notifications.success('Balance supprimée');
    ouvert.value = false;
    emit('supprime');
  } catch (e) {
    notifications.error(getApiErrorMessage(e));
  }
}
</script>
