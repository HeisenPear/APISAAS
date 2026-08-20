<script setup lang="ts">
import { MEDICAMENTS_APICOLES } from '~/config/medicaments-apicoles';

definePageMeta({ layout: 'default' });

const filtre = ref<'actives' | 'passees' | 'toutes'>('actives');
const showModal = ref(false);

const { data, pending, error, refresh } = useFetch(
  () => `/api/ordonnances?filtre=${filtre.value}`,
  {
    key: 'ordonnances-list',
    lazy: true,
  },
);

interface OrdonnanceRow {
  id: string;
  medicament: string;
  veterinaireNom: string | null;
  datePrescription: string;
  dateFinDelaiAttente: string | null;
  enDelaiAttente: boolean;
}
interface VeterinaireOption {
  id: string;
  nomComplet: string;
}

const ordonnances = computed<OrdonnanceRow[]>(
  () => (data.value as { data: OrdonnanceRow[] } | null)?.data ?? [],
);

watch(filtre, () => refresh());

const { data: vetoData } = useFetch('/api/veterinaires', { key: 'vetos-list', lazy: true });
const veterinaires = computed<VeterinaireOption[]>(
  () => (vetoData.value as { data: VeterinaireOption[] } | null)?.data ?? [],
);

/**
 * « Aucun vétérinaire » n'est PAS « pas encore chargé » : la requête est
 * `lazy`, donc `data` vaut null pendant l'aller-retour. Tester la longueur
 * seule ferait clignoter « aucun vétérinaire enregistré » chez ceux qui en ont.
 */
const aucunVeterinaire = computed(() => vetoData.value != null && veterinaires.value.length === 0);

// Médicaments — source unique : `app/config/medicaments-apicoles.ts`.
// Cette page en portait une COPIE (liste + délais d'attente). Les deux jeux
// coïncidaient encore, mais le délai d'attente avant récolte est une donnée
// réglementaire : deux sources qui divergent en silence, c'est du miel vendu
// pendant le délai. Une seule table, donc, et la substance se remplit avec.
const MEDICAMENTS = [...MEDICAMENTS_APICOLES.map((m) => m.nom), 'Autre'];

const PAR_NOM = new Map(MEDICAMENTS_APICOLES.map((m) => [m.nom, m]));

const form = reactive({
  veterinaireId: '',
  datePrescription: new Date().toISOString().slice(0, 10),
  medicament: '',
  substance: '',
  posologie: '',
  dureeTraitementJours: 42,
  delaiAttenteAvantRecolteJours: 0,
  notes: '',
});

function onMedicamentChange() {
  // Les deux champs sont DÉRIVÉS du produit : changer de produit les remet à
  // zéro, sans quoi « Apistan puis Autre » garderait le délai du précédent.
  const produit = PAR_NOM.get(form.medicament);
  form.delaiAttenteAvantRecolteJours = produit?.delaiAttenteJours ?? 0;
  form.substance = produit?.substance ?? '';
}

const saving = ref(false);
const toast = useToast();

async function handleSave() {
  saving.value = true;
  try {
    await $fetch('/api/ordonnances', {
      method: 'POST',
      body: {
        ...form,
        datePrescription: new Date(form.datePrescription).toISOString(),
        veterinaireId: form.veterinaireId || undefined,
      },
    });
    toast.add({ title: 'Ordonnance enregistrée', color: 'success' });
    showModal.value = false;
    await refresh();
    Object.assign(form, {
      veterinaireId: '',
      datePrescription: new Date().toISOString().slice(0, 10),
      medicament: '',
      substance: '',
      posologie: '',
      dureeTraitementJours: 42,
      delaiAttenteAvantRecolteJours: 0,
      notes: '',
    });
  } catch {
    toast.add({ title: 'Erreur', color: 'error' });
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <div>
    <!-- Header -->
    <div class="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 class="text-[26px] font-semibold tracking-[-0.02em] text-[var(--text-primary)]">
          Ordonnances vétérinaires
        </h1>
        <p class="mt-1 text-[13.5px] text-[var(--text-secondary)]">
          Suivi des prescriptions et délais d'attente avant récolte
        </p>
      </div>
      <UButton icon="i-lucide-plus" label="Ajouter" color="primary" @click="showModal = true" />
    </div>

    <!-- Conformité nav -->
    <div class="mb-6 flex gap-1.5 flex-wrap">
      <NuxtLink
        to="/conformite/ordonnances"
        class="rounded-full px-3.5 py-1.5 text-[12px] font-semibold transition-colors bg-[var(--text-primary)] text-white"
        >Ordonnances</NuxtLink
      >
      <NuxtLink
        to="/conformite/visites-sanitaires"
        class="rounded-full px-3.5 py-1.5 text-[12px] font-semibold transition-colors bg-[var(--surface-muted)] text-[var(--text-secondary)] hover:bg-[var(--surface-sunk)]"
        >Visites sanitaires</NuxtLink
      >
      <NuxtLink
        to="/conformite/mortalites"
        class="rounded-full px-3.5 py-1.5 text-[12px] font-semibold transition-colors bg-[var(--surface-muted)] text-[var(--text-secondary)] hover:bg-[var(--surface-sunk)]"
        >Mortalités</NuxtLink
      >
      <NuxtLink
        to="/conformite/veterinaires"
        class="rounded-full px-3.5 py-1.5 text-[12px] font-semibold transition-colors bg-[var(--surface-muted)] text-[var(--text-secondary)] hover:bg-[var(--surface-sunk)]"
        >Vétérinaires</NuxtLink
      >
    </div>

    <!-- Loading -->
    <div v-if="pending" class="space-y-3">
      <div
        v-for="i in 3"
        :key="i"
        class="h-14 animate-pulse rounded-[14px] bg-[var(--surface-muted)]"
      />
    </div>

    <UiErrorState v-else-if="error" :error="error" :retry="refresh" />

    <template v-else>
      <!-- 01 — En cours / à venir -->
      <div class="mb-8">
        <p
          class="text-[11px] font-semibold text-[var(--honey-deep)] uppercase tracking-[0.12em] mb-3"
        >
          01 — En cours / à venir
        </p>
        <div
          v-if="ordonnances.filter((o: any) => o.enDelaiAttente).length === 0"
          class="bg-white border border-[var(--border-default)] rounded-[12px] overflow-hidden"
        >
          <UiEmptyState
            icon="i-lucide-pill"
            title="Aucun traitement en cours"
            description="Dès qu'une ordonnance vétérinaire est en cours, elle s'affiche ici — pratique pour ne rien oublier."
            action-label="Ajouter une ordonnance"
            @action="showModal = true"
          />
        </div>
        <div
          v-else
          class="bg-white border border-[var(--border-default)] rounded-[12px] overflow-hidden"
        >
          <table class="w-full text-sm">
            <thead>
              <tr class="border-b border-[var(--border-faint)] bg-[var(--surface-muted)]">
                <th
                  class="px-4 py-2.5 text-left text-[11px] font-semibold text-[var(--text-tertiary)] uppercase tracking-[0.08em]"
                >
                  Médicament
                </th>
                <th
                  class="px-4 py-2.5 text-left text-[11px] font-semibold text-[var(--text-tertiary)] uppercase tracking-[0.08em]"
                >
                  Vétérinaire
                </th>
                <th
                  class="px-4 py-2.5 text-left text-[11px] font-semibold text-[var(--text-tertiary)] uppercase tracking-[0.08em]"
                >
                  Prescription
                </th>
                <th
                  class="px-4 py-2.5 text-left text-[11px] font-semibold text-[var(--text-tertiary)] uppercase tracking-[0.08em]"
                >
                  Fin délai
                </th>
                <th
                  class="px-4 py-2.5 text-left text-[11px] font-semibold text-[var(--text-tertiary)] uppercase tracking-[0.08em]"
                >
                  Statut
                </th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="ord in ordonnances.filter((o: any) => o.enDelaiAttente)"
                :key="ord.id"
                class="border-b border-[var(--border-faint)] last:border-0 hover:bg-[var(--surface-muted)] transition-colors"
              >
                <td class="px-4 py-3 font-semibold text-[var(--text-primary)]">
                  {{ ord.medicament }}
                </td>
                <td class="px-4 py-3 text-[var(--text-secondary)]">
                  <span v-if="ord.veterinaireNom">Dr. {{ ord.veterinaireNom }}</span>
                  <span v-else class="text-[var(--text-tertiary)]">—</span>
                </td>
                <td class="px-4 py-3 text-[var(--text-secondary)]">
                  {{ new Date(ord.datePrescription).toLocaleDateString('fr-FR') }}
                </td>
                <td class="px-4 py-3 text-[var(--text-secondary)]">
                  <span v-if="ord.dateFinDelaiAttente">{{
                    new Date(ord.dateFinDelaiAttente).toLocaleDateString('fr-FR')
                  }}</span>
                  <span v-else class="text-[var(--text-tertiary)]">—</span>
                </td>
                <td class="px-4 py-3">
                  <span
                    v-if="ord.enDelaiAttente"
                    class="rounded-full px-2.5 py-1 text-[11px] font-semibold"
                    style="background: var(--honey-soft); color: var(--honey-deep)"
                    >En cours</span
                  >
                  <span
                    v-else
                    class="rounded-full px-2.5 py-1 text-[11px] font-semibold"
                    style="background: var(--sage-soft); color: var(--sage-deep)"
                    >Terminé</span
                  >
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- 02 — Archives -->
      <div>
        <p
          class="text-[11px] font-semibold text-[var(--honey-deep)] uppercase tracking-[0.12em] mb-3"
        >
          02 — Archives
        </p>
        <div
          v-if="ordonnances.filter((o: any) => !o.enDelaiAttente).length === 0"
          class="bg-white border border-[var(--border-default)] rounded-[12px] px-4 py-6 text-center text-[13px] text-[var(--text-tertiary)]"
        >
          Aucune ordonnance archivée pour le moment.
        </div>
        <div
          v-else
          class="bg-white border border-[var(--border-default)] rounded-[12px] overflow-hidden"
        >
          <table class="w-full text-sm">
            <thead>
              <tr class="border-b border-[var(--border-faint)] bg-[var(--surface-muted)]">
                <th
                  class="px-4 py-2.5 text-left text-[11px] font-semibold text-[var(--text-tertiary)] uppercase tracking-[0.08em]"
                >
                  Médicament
                </th>
                <th
                  class="px-4 py-2.5 text-left text-[11px] font-semibold text-[var(--text-tertiary)] uppercase tracking-[0.08em]"
                >
                  Vétérinaire
                </th>
                <th
                  class="px-4 py-2.5 text-left text-[11px] font-semibold text-[var(--text-tertiary)] uppercase tracking-[0.08em]"
                >
                  Prescription
                </th>
                <th
                  class="px-4 py-2.5 text-left text-[11px] font-semibold text-[var(--text-tertiary)] uppercase tracking-[0.08em]"
                >
                  Statut
                </th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="ord in ordonnances.filter((o: any) => !o.enDelaiAttente)"
                :key="ord.id"
                class="border-b border-[var(--border-faint)] last:border-0 hover:bg-[var(--surface-muted)] transition-colors"
              >
                <td class="px-4 py-2.5 font-medium text-[var(--text-primary)]">
                  {{ ord.medicament }}
                </td>
                <td class="px-4 py-2.5 text-[var(--text-secondary)]">
                  <span v-if="ord.veterinaireNom">Dr. {{ ord.veterinaireNom }}</span>
                  <span v-else class="text-[var(--text-tertiary)]">—</span>
                </td>
                <td class="px-4 py-2.5 text-[var(--text-secondary)]">
                  {{ new Date(ord.datePrescription).toLocaleDateString('fr-FR') }}
                </td>
                <td class="px-4 py-2.5">
                  <span
                    class="rounded-full px-2.5 py-1 text-[11px] font-semibold"
                    style="background: var(--sage-soft); color: var(--sage-deep)"
                    >Terminé</span
                  >
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </template>

    <!-- Modal nouvelle ordonnance -->
    <UModal v-model:open="showModal">
      <template #content>
        <div class="p-6 space-y-4">
          <h3 class="text-lg font-semibold text-[var(--text-primary)]">Nouvelle ordonnance</h3>

          <div>
            <label class="block text-sm font-medium text-[var(--text-secondary)] mb-1"
              >Médicament *</label
            >
            <select
              v-model="form.medicament"
              class="w-full rounded-xl border border-[var(--border-default)] bg-white px-3 py-2 text-sm focus:border-[var(--honey)] focus:outline-none"
              @change="onMedicamentChange"
            >
              <option value="">Choisir un médicament</option>
              <option v-for="m in MEDICAMENTS" :key="m" :value="m">{{ m }}</option>
            </select>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-sm font-medium text-[var(--text-secondary)] mb-1"
                >Date prescription *</label
              >
              <UiMobileDatePicker v-model="form.datePrescription" mode="date" />
            </div>
            <div>
              <label class="block text-sm font-medium text-[var(--text-secondary)] mb-1"
                >Délai d'attente (jours) *</label
              >
              <UInput v-model="form.delaiAttenteAvantRecolteJours" type="number" :min="0" />
            </div>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-sm font-medium text-[var(--text-secondary)] mb-1"
                >Durée traitement (jours)</label
              >
              <UInput v-model="form.dureeTraitementJours" type="number" :min="1" />
            </div>
            <div>
              <label class="block text-sm font-medium text-[var(--text-secondary)] mb-1"
                >Vétérinaire</label
              >
              <select
                v-model="form.veterinaireId"
                class="w-full rounded-xl border border-[var(--border-default)] bg-white px-3 py-2 text-sm focus:border-[var(--honey)] focus:outline-none"
              >
                <option value="">Aucun</option>
                <option v-for="v in veterinaires" :key="v.id" :value="v.id">
                  {{ v.nomComplet }}
                </option>
              </select>
              <!-- Liste vide : « Aucun » et rien d'autre, sans dire où en
                   ajouter. Le champ reste facultatif — on explique juste ce que
                   le rattachement apporte, et où le faire. -->
              <p v-if="aucunVeterinaire" class="mt-1.5 text-xs text-[var(--text-tertiary)]">
                Aucun vétérinaire enregistré —
                <NuxtLink
                  to="/conformite/veterinaires"
                  class="font-medium text-[var(--honey-deep)] hover:underline"
                >
                  en ajouter un
                </NuxtLink>
                rattache l'ordonnance à son prescripteur pour vos contrôles.
              </p>
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-[var(--text-secondary)] mb-1"
              >Posologie</label
            >
            <UInput v-model="form.posologie" placeholder="Ex: 2 lanières par ruche, 6-8 semaines" />
          </div>

          <div>
            <label class="block text-sm font-medium text-[var(--text-secondary)] mb-1">Notes</label>
            <UInput v-model="form.notes" placeholder="Notes libres" />
          </div>

          <div class="flex gap-3 justify-end pt-2">
            <UButton label="Annuler" color="neutral" variant="ghost" @click="showModal = false" />
            <UButton
              label="Enregistrer"
              color="primary"
              :loading="saving"
              :disabled="!form.medicament"
              @click="handleSave"
            />
          </div>
        </div>
      </template>
    </UModal>
  </div>
</template>
