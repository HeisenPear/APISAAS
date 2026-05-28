<script setup lang="ts">
definePageMeta({ layout: 'default' });

const route = useRoute();
const router = useRouter();
const toast = useToast();

const now = new Date();
const currentYear = now.getFullYear();

const { data: ruchersData } = useFetch('/api/ruchers', {
  key: 'transhumance-ruchers-select',
  query: { limit: 100, page: 1, actif: 'true' },
  lazy: true,
});

const { data: emplacementsData } = useFetch('/api/transhumance/emplacements', {
  key: 'transhumance-emplacements-select',
  query: { limit: 100, page: 1, actif: 'true' },
  lazy: true,
});

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

const prefilledEmplacementId = route.query.emplacementId as string | undefined;

const form = reactive({
  miellee: '',
  annee: currentYear,
  datePrevue: now.toISOString().slice(0, 10),
  dateRetourPrevue: '',
  rucherOrigineId: '' as string | undefined,
  emplacementDestinationId: (prefilledEmplacementId || '') as string | undefined,
  nombreRuchesPrevues: '',
  distanceKm: '',
  dureeMinutes: '',
  coutCarburantEuros: '',
  notes: '',
});

const saving = ref(false);

async function save() {
  if (!form.datePrevue || !form.nombreRuchesPrevues) {
    toast.add({
      title: 'Champs requis manquants',
      description: 'Date prévue et nombre de ruches sont obligatoires',
      color: 'error',
    });
    return;
  }
  saving.value = true;
  try {
    const payload = {
      annee: Number(form.annee),
      datePrevue: new Date(form.datePrevue).toISOString(),
      dateRetourPrevue: form.dateRetourPrevue
        ? new Date(form.dateRetourPrevue).toISOString()
        : undefined,
      miellee: form.miellee || undefined,
      rucherOrigineId: form.rucherOrigineId || undefined,
      emplacementDestinationId: form.emplacementDestinationId || undefined,
      nombreRuchesPrevues: Number(form.nombreRuchesPrevues),
      distanceKm: form.distanceKm ? Number(form.distanceKm) : undefined,
      dureeMinutes: form.dureeMinutes ? Number(form.dureeMinutes) : undefined,
      coutCarburantEuros: form.coutCarburantEuros ? Number(form.coutCarburantEuros) : undefined,
      notes: form.notes || undefined,
      statut: 'planifie',
    };
    await $fetch('/api/transhumance/plans', { method: 'POST', body: payload });
    toast.add({ title: 'Plan créé', color: 'success' });
    await router.push('/transhumance');
  } catch (e) {
    toast.add({ title: getApiErrorMessage(e, 'Erreur création'), color: 'error' });
  } finally {
    saving.value = false;
  }
}
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
          Nouveau plan
        </h1>
        <p class="mt-1 text-sm text-[var(--text-secondary)]">
          Planifiez un déplacement de ruches vers une miellée
        </p>
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

    <!-- Form -->
    <div class="max-w-2xl space-y-6">
      <!-- 01 — Miellée & dates -->
      <section class="space-y-4">
        <p class="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--honey-deep)]">
          01 — Miellée & dates
        </p>
        <div class="rounded-[14px] border border-[var(--border-default)] bg-white p-5 space-y-4">
          <div class="grid grid-cols-2 gap-4">
            <UFormField label="Miellée visée" class="col-span-2">
              <UInput v-model="form.miellee" placeholder="Ex: Acacia, Lavande, Châtaignier…" />
            </UFormField>
            <UFormField label="Année *">
              <UInput v-model="form.annee" type="number" :min="2000" :max="2100" />
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

      <!-- 02 — Ruches & logistique -->
      <section class="space-y-4">
        <p class="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--honey-deep)]">
          02 — Ruches & logistique
        </p>
        <div class="rounded-[14px] border border-[var(--border-default)] bg-white p-5 space-y-4">
          <UFormField label="Nombre de ruches prévues *">
            <UInput v-model="form.nombreRuchesPrevues" type="number" min="1" placeholder="Ex: 20" />
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
          <p v-if="!emplacementsData?.data?.length" class="text-xs text-[var(--text-tertiary)]">
            Aucun emplacement enregistré —
            <NuxtLink
              to="/transhumance/emplacements"
              class="font-medium text-[var(--honey-deep)] hover:underline"
            >
              En créer un
            </NuxtLink>
          </p>
        </div>
      </section>

      <!-- 03 — Transport & coûts -->
      <section class="space-y-4">
        <p class="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--honey-deep)]">
          03 — Transport & coûts
        </p>
        <div class="rounded-[14px] border border-[var(--border-default)] bg-white p-5 space-y-4">
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

      <!-- 04 — Notes -->
      <section class="space-y-4">
        <p class="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--honey-deep)]">
          04 — Notes
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
          Créer le plan
        </UButton>
      </div>
    </div>
  </div>
</template>
