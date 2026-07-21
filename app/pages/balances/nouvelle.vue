<template>
  <div class="mx-auto max-w-3xl">
    <NuxtLink
      to="/balances"
      class="mb-4 inline-flex items-center gap-1.5 text-[12.5px] text-[var(--text-tertiary)] transition-colors hover:text-[var(--text-secondary)]"
    >
      <UIcon name="i-lucide-arrow-left" class="h-3.5 w-3.5" />
      Balances
    </NuxtLink>

    <UiPageHeader
      title="Ajouter une balance"
      :description="
        etape === 1
          ? 'D’abord : par quel chemin ses mesures vont-elles arriver jusqu’ici ?'
          : 'Quelques informations pour la retrouver et la rattacher au bon endroit.'
      "
    />

    <UiFeatureGate feature="balancesConnectees" blur>
      <template #preview>
        <div class="grid gap-3 sm:grid-cols-2">
          <div v-for="i in 4" :key="i" class="h-40 rounded-[14px] bg-[var(--surface-muted)]" />
        </div>
      </template>

      <!-- ÉTAPE 1 — la source, expliquée sans enjoliver -->
      <div v-if="etape === 1" class="space-y-4">
        <BalancesBalanceSourceChoix v-model="source" />
        <div class="flex justify-end">
          <UButton
            color="primary"
            trailing-icon="i-lucide-arrow-right"
            :disabled="!source"
            @click="etape = 2"
          >
            Continuer
          </UButton>
        </div>
      </div>

      <!-- ÉTAPE 2 — l'identité et le rattachement -->
      <div v-else class="space-y-4">
        <div
          class="flex items-center gap-3 rounded-[12px] border border-[var(--border-default)] bg-white px-4 py-3"
        >
          <UIcon :name="meta.icon" class="h-4.5 w-4.5" :style="`color:${meta.couleur}`" />
          <div class="min-w-0 flex-1">
            <p class="text-[13.5px] font-semibold text-[var(--text-primary)]">{{ meta.label }}</p>
            <p class="truncate text-[11.5px] text-[var(--text-tertiary)]">{{ meta.resume }}</p>
          </div>
          <UButton size="xs" variant="ghost" color="neutral" @click="etape = 1">Changer</UButton>
        </div>

        <div class="space-y-4 rounded-[14px] border border-[var(--border-default)] bg-white p-5">
          <UFormField label="Nom" required>
            <UInput v-model="form.nom" placeholder="Balance rucher du bois" autofocus />
          </UFormField>

          <div class="grid gap-3 sm:grid-cols-2">
            <UFormField label="Marque">
              <UInput v-model="form.marque" :placeholder="placeholderMarque" />
            </UFormField>
            <UFormField label="Modèle">
              <UInput v-model="form.modele" placeholder="Optionnel" />
            </UFormField>
          </div>

          <UFormField
            v-if="source !== 'manuelle'"
            :label="labelIdentifiant"
            :hint="source === 'beep' ? 'Requis pour la synchronisation' : 'Optionnel'"
          >
            <UInput v-model="form.identifiantExterne" placeholder="ex. 70B3D5…" />
          </UFormField>

          <UFormField label="Tare (poids du matériel à vide)" hint="kg — optionnel">
            <UInput v-model="form.poidsTare" type="number" step="0.1" placeholder="ex. 18,5" />
          </UFormField>

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
              Tout est facultatif : une balance peut aussi servir de simple témoin de miellée pour
              un rucher entier.
            </p>
          </div>
        </div>

        <div class="flex justify-between gap-2">
          <UButton color="neutral" variant="outline" @click="etape = 1">Retour</UButton>
          <UButton
            color="primary"
            :loading="enregistrement"
            :disabled="!form.nom.trim()"
            @click="creer"
          >
            Créer la balance
          </UButton>
        </div>

        <p class="text-center text-[11.5px] text-[var(--text-tertiary)]">
          {{ prochaineEtape }}
        </p>
      </div>
    </UiFeatureGate>
  </div>
</template>

<script setup lang="ts">
import { sourceMeta, type SourceBalance } from '~/config/balances';

definePageMeta({ title: 'Ajouter une balance' });

const { createBalance } = useBalanceActions();
const notifications = useNotifications();

const { ruches } = useRuches();
const { hausses } = useHausses({ limit: ref(200) });
const { ruchers } = useRuchers();

const AUCUN = 'none';

const etape = ref<1 | 2>(1);
const source = ref<SourceBalance | null>('webhook');
const meta = computed(() => sourceMeta(source.value ?? 'webhook'));

const form = reactive({
  nom: '',
  marque: '',
  modele: '',
  identifiantExterne: '',
  poidsTare: '',
  rucheId: AUCUN,
  hausseId: AUCUN,
  rucherId: AUCUN,
});

const placeholderMarque = computed(() =>
  source.value === 'beep' ? 'BEEP' : 'Optibee, Bee2Beep, Label Abeille…',
);

const labelIdentifiant = computed(() =>
  source.value === 'beep' ? 'Identifiant de l’appareil BEEP' : 'Numéro de série / DevEUI',
);

const prochaineEtape = computed(() => {
  switch (source.value) {
    case 'webhook':
      return 'À l’étape suivante, vous recevrez l’URL d’ingestion et le jeton à donner à votre capteur.';
    case 'beep':
      return 'À l’étape suivante, vous collerez votre jeton BEEP et lancerez la première synchronisation.';
    case 'csv':
      return 'À l’étape suivante, vous pourrez déposer le fichier exporté depuis l’espace de votre fabricant.';
    default:
      return 'À l’étape suivante, vous pourrez saisir votre première pesée.';
  }
});

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
function lien(v: string): string | null {
  return v === AUCUN ? null : v;
}

const enregistrement = ref(false);

async function creer() {
  if (!source.value || !form.nom.trim()) return;
  enregistrement.value = true;
  try {
    const balance = await createBalance({
      nom: form.nom.trim(),
      source: source.value,
      marque: texte(form.marque),
      modele: texte(form.modele),
      identifiantExterne: texte(form.identifiantExterne),
      poidsTare: form.poidsTare.trim() ? Number(form.poidsTare) : null,
      rucheId: lien(form.rucheId),
      hausseId: lien(form.hausseId),
      rucherId: lien(form.rucherId),
    });
    notifications.success('Balance créée', 'Reste à la brancher — tout est expliqué sur sa fiche.');
    await navigateTo(`/balances/${balance.id}`);
  } catch (e) {
    notifications.error(getApiErrorMessage(e));
  } finally {
    enregistrement.value = false;
  }
}
</script>
