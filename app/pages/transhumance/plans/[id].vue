<script setup lang="ts">
definePageMeta({ layout: 'default' });

const route = useRoute();
const router = useRouter();
const toast = useToast();

const planId = route.params.id as string;

/** Formes de réponse, jusqu'ici obtenues par cast juste sous les appels. */
interface ReponsePlan {
  data: Record<string, unknown>;
}
interface ReponseListe {
  data: Record<string, unknown>[];
}

/**
 * ⚠️ `useAsyncData` + `appelApi`, ET PAS `useFetch` — cf. `app/utils/appelApi.ts`.
 * Typer ces chemins contre l'union des 213 routes fait déplier à TypeScript le
 * type de retour réel de chaque handler, et le projet est au-delà de sa limite
 * d'instanciation. Les `query` sont sérialisées à la main dans l'URL, ce que
 * `useFetch` faisait pour nous ; les clés ne bougent pas, `refreshNuxtData`
 * plus bas s'appuie dessus.
 */
const {
  data: planData,
  pending,
  error: planError,
  refresh: refreshPlan,
} = useAsyncData<ReponsePlan>(
  `transhumance-plan-${planId}`,
  () => appelApi<ReponsePlan>(`/api/transhumance/plans/${planId}`),
  { lazy: true },
);

const { data: ruchersData } = useAsyncData<ReponseListe>(
  'transhumance-plan-ruchers',
  () => appelApi<ReponseListe>('/api/ruchers?limit=100&page=1&actif=true'),
  { lazy: true },
);

const { data: emplacementsData } = useAsyncData<ReponseListe>(
  'transhumance-plan-emplacements',
  () => appelApi<ReponseListe>('/api/transhumance/emplacements?limit=100&page=1'),
  { lazy: true },
);

/**
 * ⚠️ CETTE LISTE VENAIT D'UN `useFetch` QUE RIEN NE RAFRAÎCHISSAIT. Maya crée
 * un rucher à la voix, et le plan de transhumance continuait d'afficher l'ancien jeu jusqu'au
 * rechargement de la page — l'apiculteur cherche ce qu'il vient de créer, ne le
 * trouve pas, et le recrée.
 */
const { on: surEvenementDonnees } = useDataBus();
surEvenementDonnees(
  ['rucher:created', 'rucher:updated', 'rucher:deleted', 'emplacement:created'],
  () => {
    void refreshNuxtData(['transhumance-plan-ruchers', 'transhumance-plan-emplacements']);
  },
);

const plan = computed(() => planData.value?.data);

const rucherOptions = computed(() =>
  (ruchersData.value?.data ?? []).map((r: Record<string, unknown>) => ({
    label: r.nom as string,
    value: r.id as string,
  })),
);

const emplacementOptions = computed(() =>
  (emplacementsData.value?.data ?? []).map((e: Record<string, unknown>) => ({
    label: (e.nom as string) + (e.commune ? ` — ${e.commune as string}` : ''),
    value: e.id as string,
  })),
);

const statutOptions = [
  { label: 'Planifié', value: 'planifie' },
  { label: 'En cours', value: 'en_cours' },
  { label: 'Réalisé', value: 'realise' },
  { label: 'Annulé', value: 'annule' },
];

const form = reactive({
  miellee: '',
  annee: new Date().getFullYear(),
  datePrevue: '',
  dateRetourPrevue: '',
  dateRealisee: '',
  rucherOrigineId: '' as string | undefined,
  emplacementDestinationId: '' as string | undefined,
  nombreRuchesPrevues: '',
  nombreRuchesRealisees: '',
  productionKg: '',
  distanceKm: '',
  dureeMinutes: '',
  coutCarburantEuros: '',
  notes: '',
  statut: 'planifie' as string,
});

watch(
  plan,
  (p) => {
    if (!p) return;
    Object.assign(form, {
      miellee: p.miellee || '',
      annee: p.annee,
      datePrevue: p.datePrevue ? new Date(p.datePrevue as string).toISOString().slice(0, 10) : '',
      dateRetourPrevue: p.dateRetourPrevue
        ? new Date(p.dateRetourPrevue as string).toISOString().slice(0, 10)
        : '',
      dateRealisee: p.dateRealisee
        ? new Date(p.dateRealisee as string).toISOString().slice(0, 10)
        : '',
      rucherOrigineId: (p.rucherOrigineId as string) || undefined,
      emplacementDestinationId: (p.emplacementDestinationId as string) || undefined,
      nombreRuchesPrevues: p.nombreRuchesPrevues?.toString() || '',
      nombreRuchesRealisees: p.nombreRuchesRealisees?.toString() || '',
      productionKg: p.productionKg ? Number(p.productionKg).toString() : '',
      distanceKm: p.distanceKm ? Number(p.distanceKm).toString() : '',
      dureeMinutes: p.dureeMinutes?.toString() || '',
      coutCarburantEuros: p.coutCarburantEuros ? Number(p.coutCarburantEuros).toString() : '',
      notes: p.notes || '',
      statut: p.statut || 'planifie',
    });
  },
  { immediate: true },
);

const saving = ref(false);
const showDeleteModal = ref(false);

async function save() {
  saving.value = true;
  try {
    const payload: Record<string, unknown> = {
      statut: form.statut,
      miellee: form.miellee || null,
      annee: Number(form.annee),
      datePrevue: new Date(form.datePrevue).toISOString(),
      dateRetourPrevue: form.dateRetourPrevue
        ? new Date(form.dateRetourPrevue).toISOString()
        : null,
      dateRealisee: form.dateRealisee ? new Date(form.dateRealisee).toISOString() : null,
      rucherOrigineId: form.rucherOrigineId || null,
      emplacementDestinationId: form.emplacementDestinationId || null,
      nombreRuchesPrevues: Number(form.nombreRuchesPrevues),
      nombreRuchesRealisees: form.nombreRuchesRealisees ? Number(form.nombreRuchesRealisees) : null,
      productionKg: form.productionKg ? Number(form.productionKg) : null,
      distanceKm: form.distanceKm ? Number(form.distanceKm) : null,
      dureeMinutes: form.dureeMinutes ? Number(form.dureeMinutes) : null,
      coutCarburantEuros: form.coutCarburantEuros ? Number(form.coutCarburantEuros) : null,
      notes: form.notes || null,
    };
    // ⚠️ `appelApi` et non `$fetch` — cf. `app/utils/appelApi.ts`.
    await appelApi<unknown>(`/api/transhumance/plans/${planId}`, { method: 'PUT', body: payload });
    toast.add({ title: 'Plan enregistré', color: 'success' });
    await router.push('/transhumance');
  } catch (e) {
    toast.add({ title: getApiErrorMessage(e, 'Erreur sauvegarde'), color: 'error' });
  } finally {
    saving.value = false;
  }
}

async function deletePlan() {
  try {
    // ⚠️ `appelApi` et non `$fetch` — cf. `app/utils/appelApi.ts`.
    await appelApi<unknown>(`/api/transhumance/plans/${planId}`, { method: 'DELETE' });
    toast.add({ title: 'Plan supprimé', color: 'success' });
    await router.push('/transhumance');
  } catch (e) {
    toast.add({ title: getApiErrorMessage(e, 'Erreur suppression'), color: 'error' });
  }
}

const statutColors: Record<string, string> = {
  planifie: 'bg-blue-100 text-blue-700',
  en_cours: 'bg-amber-100 text-amber-700',
  realise: 'bg-amber-100 text-amber-700',
  annule: 'bg-stone-100 text-stone-500',
};
</script>

<template>
  <div class="space-y-8">
    <!-- Header -->
    <div class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <div class="mb-1 flex items-center gap-2">
          <NuxtLink
            to="/transhumance"
            class="text-xs font-medium text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"
          >
            ← Transhumance
          </NuxtLink>
        </div>
        <h1
          class="text-[26px] font-semibold tracking-[-0.02em] text-[var(--text-primary)]"
          style="
            font-family:
              'SF Pro Display',
              -apple-system,
              BlinkMacSystemFont,
              sans-serif;
          "
        >
          <span v-if="pending">Chargement…</span>
          <span v-else>{{ plan?.miellee || `Plan ${plan?.annee}` }}</span>
        </h1>
        <p
          v-if="!pending && plan"
          class="mt-1 flex items-center gap-2 text-sm text-[var(--text-secondary)]"
        >
          <span
            class="rounded-full px-2.5 py-0.5 text-[11px] font-semibold"
            :class="statutColors[plan.statut as string]"
          >
            {{ statutOptions.find((s) => s.value === plan!.statut)?.label }}
          </span>
          <span
            >{{ plan?.nombreRuchesPrevues }} ruche{{
              plan?.nombreRuchesPrevues !== 1 ? 's' : ''
            }}
            prévues</span
          >
        </p>
      </div>
      <div class="flex items-center gap-2">
        <button
          type="button"
          class="flex h-9 w-9 items-center justify-center rounded-[10px] border border-[var(--border-default)] text-[var(--text-tertiary)] transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-500"
          title="Supprimer ce plan"
          @click="showDeleteModal = true"
        >
          <UIcon name="i-lucide-trash-2" class="h-4 w-4" />
        </button>
        <UButton color="primary" :loading="saving" icon="i-lucide-check" @click="save">
          Enregistrer
        </UButton>
      </div>
    </div>

    <!-- Pill nav -->
    <div
      class="flex items-center gap-1 rounded-[10px] border border-[var(--border-default)] bg-[var(--surface-muted)] w-fit p-0.5"
    >
      <NuxtLink
        to="/transhumance"
        class="rounded-[8px] px-4 py-1.5 text-xs font-medium text-[var(--text-tertiary)] transition-colors hover:text-[var(--text-secondary)]"
      >
        Plans
      </NuxtLink>
      <NuxtLink
        to="/transhumance/emplacements"
        class="rounded-[8px] px-4 py-1.5 text-xs font-medium text-[var(--text-tertiary)] transition-colors hover:text-[var(--text-secondary)]"
      >
        Emplacements
      </NuxtLink>
    </div>

    <!-- Loading -->
    <div v-if="pending" class="space-y-4">
      <div
        v-for="i in 4"
        :key="i"
        class="h-32 animate-pulse rounded-[14px] bg-[var(--surface-muted)]"
      />
    </div>

    <UiErrorState v-else-if="planError" :error="planError" :retry="refreshPlan" />

    <template v-else-if="plan">
      <div class="max-w-2xl space-y-6">
        <!-- 01 — Statut -->
        <section class="space-y-4">
          <p class="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--honey-deep)]">
            01 — Statut
          </p>
          <div class="rounded-[14px] border border-[var(--border-default)] bg-white p-5 space-y-4">
            <UFormField label="Statut du plan">
              <USelect
                v-model="form.statut"
                :items="statutOptions"
                value-key="value"
                label-key="label"
              />
            </UFormField>
            <div v-if="form.statut === 'realise'" class="grid grid-cols-2 gap-4">
              <UFormField label="Date de réalisation">
                <UiMobileDatePicker v-model="form.dateRealisee" mode="date" />
              </UFormField>
              <UFormField label="Ruches réalisées">
                <UInput v-model="form.nombreRuchesRealisees" type="number" min="0" />
              </UFormField>
              <UFormField label="Production (kg)">
                <UInput
                  v-model="form.productionKg"
                  type="number"
                  min="0"
                  step="0.1"
                  placeholder="0.0"
                />
              </UFormField>
            </div>
          </div>
        </section>

        <!-- 02 — Miellée & dates -->
        <section class="space-y-4">
          <p class="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--honey-deep)]">
            02 — Miellée & dates
          </p>
          <div class="rounded-[14px] border border-[var(--border-default)] bg-white p-5 space-y-4">
            <div class="grid grid-cols-2 gap-4">
              <UFormField label="Miellée visée" class="col-span-2">
                <UInput v-model="form.miellee" placeholder="Acacia, Lavande…" />
              </UFormField>
              <UFormField label="Année">
                <UInput v-model="form.annee" type="number" />
              </UFormField>
            </div>
            <div class="grid grid-cols-2 gap-4">
              <UFormField label="Date de départ *">
                <UiMobileDatePicker v-model="form.datePrevue" mode="date" />
              </UFormField>
              <UFormField label="Date de retour">
                <UiMobileDatePicker v-model="form.dateRetourPrevue" mode="date" />
              </UFormField>
            </div>
          </div>
        </section>

        <!-- 03 — Ruches & logistique -->
        <section class="space-y-4">
          <p class="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--honey-deep)]">
            03 — Ruches & logistique
          </p>
          <div class="rounded-[14px] border border-[var(--border-default)] bg-white p-5 space-y-4">
            <UFormField label="Nombre de ruches prévues *">
              <UInput v-model="form.nombreRuchesPrevues" type="number" min="1" />
            </UFormField>
            <UFormField label="Rucher d'origine">
              <USelect
                v-model="form.rucherOrigineId"
                :items="rucherOptions"
                value-key="value"
                label-key="label"
                placeholder="Sélectionner un rucher"
              />
            </UFormField>
            <UFormField label="Emplacement de destination">
              <USelect
                v-model="form.emplacementDestinationId"
                :items="emplacementOptions"
                value-key="value"
                label-key="label"
                placeholder="Sélectionner un emplacement"
              />
            </UFormField>
          </div>
        </section>

        <!-- 04 — Transport & coûts -->
        <section class="space-y-4">
          <p class="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--honey-deep)]">
            04 — Transport & coûts
          </p>
          <div class="rounded-[14px] border border-[var(--border-default)] bg-white p-5">
            <div class="grid grid-cols-3 gap-4">
              <UFormField label="Distance (km)">
                <UInput v-model="form.distanceKm" type="number" min="0" placeholder="0" />
              </UFormField>
              <UFormField label="Durée (min)">
                <UInput v-model="form.dureeMinutes" type="number" min="0" placeholder="0" />
              </UFormField>
              <UFormField label="Carburant (€)">
                <UInput
                  v-model="form.coutCarburantEuros"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                />
              </UFormField>
            </div>
          </div>
        </section>

        <!-- 05 — Notes -->
        <section class="space-y-4">
          <p class="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--honey-deep)]">
            05 — Notes
          </p>
          <div class="rounded-[14px] border border-[var(--border-default)] bg-white p-5">
            <UTextarea
              v-model="form.notes"
              :rows="4"
              placeholder="Observations, accès, contacts sur place…"
            />
          </div>
        </section>

        <!-- Actions -->
        <div class="flex items-center justify-between pt-2">
          <NuxtLink
            to="/transhumance"
            class="text-sm font-medium text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"
          >
            Annuler
          </NuxtLink>
          <UButton color="primary" :loading="saving" icon="i-lucide-check" @click="save">
            Enregistrer
          </UButton>
        </div>
      </div>
    </template>

    <!-- Delete modal -->
    <UModal v-model:open="showDeleteModal" title="Supprimer ce plan">
      <template #body>
        <p class="text-[13.5px] text-[var(--text-secondary)]">
          Supprimer <strong>{{ plan?.miellee || `Plan ${plan?.annee}` }}</strong> ? Cette action est
          irréversible.
        </p>
      </template>
      <template #footer>
        <div class="flex justify-end gap-3">
          <UButton color="neutral" variant="outline" @click="showDeleteModal = false"
            >Annuler</UButton
          >
          <UButton color="error" @click="deletePlan">Supprimer</UButton>
        </div>
      </template>
    </UModal>
  </div>
</template>
