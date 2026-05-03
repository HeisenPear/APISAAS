<script setup lang="ts">
definePageMeta({ layout: 'default' });

const toast = useToast();
const showModal = ref(false);
const editTarget = ref<Record<string, unknown> | null>(null);

const { data, pending, refresh } = await useFetch('/api/elevage/sessions', {
  key: 'elevage-sessions',
  query: { limit: 20, page: 1 },
});

const { data: reinesData } = await useFetch('/api/elevage/reines', {
  key: 'elevage-reines-select',
  query: { limit: 100, page: 1, active: 'true' },
});

const reinesOptions = computed(() =>
  (reinesData.value?.data || []).map((r: Record<string, unknown>) => {
    const reine = r.reine as Record<string, unknown>;
    return {
      label: (reine.identifiant as string) || `Reine ${(reine.anneeNaissance as string) || ''}`,
      value: reine.id as string,
    };
  })
);

const techniqueOptions = [
  { label: 'Doolittle', value: 'doolittle' },
  { label: 'Cupule artificielle', value: 'cupule_artificielle' },
  { label: 'Transfert direct', value: 'transfert' },
];

const form = reactive({
  dateGreffage: new Date().toISOString().slice(0, 10),
  reineMereId: '' as string | null,
  rucheEleveuse: '',
  nombreCellulesGreffees: '',
  nombreCellulesAcceptees: '',
  technique: '' as string,
  notes: '',
});

const saving = ref(false);

function openCreate() {
  editTarget.value = null;
  Object.assign(form, {
    dateGreffage: new Date().toISOString().slice(0, 10),
    reineMereId: null, rucheEleveuse: '',
    nombreCellulesGreffees: '', nombreCellulesAcceptees: '',
    technique: '', notes: '',
  });
  showModal.value = true;
}

function openEdit(s: Record<string, unknown>) {
  editTarget.value = s;
  Object.assign(form, {
    dateGreffage: (s.dateGreffage as string)?.slice(0, 10) || '',
    reineMereId: (s.reineMereId as string) || null,
    rucheEleveuse: (s.rucheEleveuse as string) || '',
    nombreCellulesGreffees: s.nombreCellulesGreffees || '',
    nombreCellulesAcceptees: s.nombreCellulesAcceptees || '',
    technique: (s.technique as string) || '',
    notes: (s.notes as string) || '',
  });
  showModal.value = true;
}

async function save() {
  saving.value = true;
  try {
    const payload = {
      ...form,
      dateGreffage: new Date(form.dateGreffage).toISOString(),
      reineMereId: form.reineMereId || null,
      nombreCellulesGreffees: Number(form.nombreCellulesGreffees),
      nombreCellulesAcceptees: form.nombreCellulesAcceptees ? Number(form.nombreCellulesAcceptees) : null,
      technique: form.technique || undefined,
    };
    if (editTarget.value) {
      await $fetch(`/api/elevage/sessions/${editTarget.value.id as string}`, { method: 'PUT', body: payload });
      toast.add({ title: 'Session modifiée', color: 'success' });
    } else {
      await $fetch('/api/elevage/sessions', { method: 'POST', body: payload });
      toast.add({ title: 'Session créée', color: 'success' });
    }
    showModal.value = false;
    await refresh();
  } catch (e) {
    toast.add({ title: getApiErrorMessage(e, 'Erreur'), color: 'error' });
  } finally {
    saving.value = false;
  }
}

function tauxAcceptation(s: Record<string, unknown>) {
  if (!s.nombreCellulesAcceptees || !s.nombreCellulesGreffees) return null;
  return Math.round(((s.nombreCellulesAcceptees as number) / (s.nombreCellulesGreffees as number)) * 100);
}

const tauxMoyen = computed(() => {
  const sessions = data.value?.data ?? [];
  const withTaux = sessions.map(tauxAcceptation).filter((t): t is number => t !== null);
  if (!withTaux.length) return null;
  return Math.round(withTaux.reduce((a, b) => a + b, 0) / withTaux.length);
});

const totalAcceptees = computed(() =>
  (data.value?.data ?? []).reduce((sum: number, s: Record<string, unknown>) => sum + ((s.nombreCellulesAcceptees as number) ?? 0), 0)
);

function tauxClass(taux: number | null) {
  if (taux === null) return 'text-[var(--text-tertiary)]';
  if (taux >= 70) return 'text-[var(--sage-deep)] bg-[var(--sage-soft)]';
  if (taux >= 40) return 'text-[var(--honey-deep)] bg-[var(--honey-soft)]';
  return 'text-[var(--status-bad)] bg-red-50';
}
</script>

<template>
  <div class="space-y-8">
    <!-- Header -->
    <div class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h1 class="text-[26px] font-semibold tracking-[-0.02em] text-[var(--text-primary)]" style="font-family:'SF Pro Display',-apple-system,BlinkMacSystemFont,sans-serif">
          Greffage
        </h1>
        <p class="mt-1 text-sm text-[var(--text-secondary)]">
          Suivez vos sessions d'élevage de reines
        </p>
      </div>
      <UButton color="primary" icon="i-lucide-plus" @click="openCreate">Nouvelle session</UButton>
    </div>

    <!-- Nav tabs -->
    <div class="flex items-center gap-1 rounded-[10px] border border-[var(--border-default)] bg-[var(--surface-muted)] w-fit p-0.5">
      <NuxtLink
        to="/elevage"
        class="rounded-[8px] px-4 py-1.5 text-xs font-medium text-[var(--text-tertiary)] transition-colors hover:text-[var(--text-secondary)]"
      >
        Reines
      </NuxtLink>
      <NuxtLink
        to="/elevage/lignees"
        class="rounded-[8px] px-4 py-1.5 text-xs font-medium text-[var(--text-tertiary)] transition-colors hover:text-[var(--text-secondary)]"
      >
        Lignées
      </NuxtLink>
      <span class="rounded-[8px] bg-white px-4 py-1.5 text-xs font-semibold text-[var(--text-primary)] shadow-sm">
        Greffage
      </span>
    </div>

    <!-- 01 — Performances -->
    <section v-if="data?.data?.length" class="space-y-3">
      <p class="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--honey-deep)]">
        01 — Performances
      </p>
      <div class="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <div class="bg-white border border-[var(--border-default)] rounded-[14px] p-5">
          <p class="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--text-tertiary)]">Taux moyen d'acceptation</p>
          <p class="mt-2 text-2xl font-semibold tabular-nums text-[var(--text-primary)]">
            {{ tauxMoyen !== null ? `${tauxMoyen}%` : '—' }}
          </p>
        </div>
        <div class="bg-white border border-[var(--border-default)] rounded-[14px] p-5">
          <p class="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--text-tertiary)]">Total reines élevées</p>
          <p class="mt-2 text-2xl font-semibold tabular-nums text-[var(--text-primary)]">
            {{ totalAcceptees }}
          </p>
        </div>
        <div class="bg-white border border-[var(--border-default)] rounded-[14px] p-5">
          <p class="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--text-tertiary)]">Sessions totales</p>
          <p class="mt-2 text-2xl font-semibold tabular-nums text-[var(--text-primary)]">
            {{ data?.total ?? '—' }}
          </p>
        </div>
      </div>
    </section>

    <!-- Sessions table -->
    <section class="space-y-3">
      <p class="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--honey-deep)]">
        {{ data?.data?.length ? '02 — Sessions' : '01 — Sessions' }}
      </p>

      <div v-if="pending" class="space-y-3">
        <div v-for="i in 5" :key="i" class="h-12 animate-pulse rounded-[14px] bg-[var(--surface-muted)]" />
      </div>

      <div
        v-else-if="!data?.data?.length"
        class="flex flex-col items-center gap-3 rounded-[14px] border border-[var(--border-default)] bg-white py-20 text-center"
      >
        <UIcon name="i-lucide-scissors" class="h-12 w-12 text-[var(--text-tertiary)]" />
        <p class="font-medium text-[var(--text-primary)]">Aucune session de greffage</p>
        <UButton color="primary" variant="soft" @click="openCreate">Créer une session</UButton>
      </div>

      <div v-else class="bg-white border border-[var(--border-default)] rounded-[12px] overflow-hidden">
        <table class="w-full">
          <thead class="bg-[var(--surface-muted)]">
            <tr>
              <th class="px-5 py-2.5 text-left text-[10.5px] font-semibold uppercase tracking-[0.08em] text-[var(--text-tertiary)]">Date</th>
              <th class="hidden px-5 py-2.5 text-left text-[10.5px] font-semibold uppercase tracking-[0.08em] text-[var(--text-tertiary)] sm:table-cell">Technique</th>
              <th class="px-5 py-2.5 text-left text-[10.5px] font-semibold uppercase tracking-[0.08em] text-[var(--text-tertiary)]">Greffées</th>
              <th class="hidden px-5 py-2.5 text-left text-[10.5px] font-semibold uppercase tracking-[0.08em] text-[var(--text-tertiary)] sm:table-cell">Acceptées</th>
              <th class="px-5 py-2.5 text-left text-[10.5px] font-semibold uppercase tracking-[0.08em] text-[var(--text-tertiary)]">Taux</th>
              <th class="px-5 py-2.5 text-left text-[10.5px] font-semibold uppercase tracking-[0.08em] text-[var(--text-tertiary)]">Statut</th>
              <th class="px-5 py-2.5 text-right text-[10.5px] font-semibold uppercase tracking-[0.08em] text-[var(--text-tertiary)]">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-[var(--border-faint)]">
            <tr
              v-for="sess in data.data"
              :key="sess.id"
              class="transition-colors hover:bg-[var(--surface-primary)]"
            >
              <td class="px-5 py-3 text-sm font-medium text-[var(--text-primary)]">
                {{ new Date(sess.dateGreffage).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }) }}
              </td>
              <td class="hidden px-5 py-3 text-sm text-[var(--text-secondary)] sm:table-cell">
                {{ techniqueOptions.find(t => t.value === sess.technique)?.label || '—' }}
              </td>
              <td class="px-5 py-3 text-sm tabular-nums text-[var(--text-secondary)]">
                {{ sess.nombreCellulesGreffees }}
              </td>
              <td class="hidden px-5 py-3 text-sm tabular-nums text-[var(--text-secondary)] sm:table-cell">
                {{ sess.nombreCellulesAcceptees ?? '—' }}
              </td>
              <td class="px-5 py-3">
                <span
                  v-if="tauxAcceptation(sess) !== null"
                  class="rounded-full px-2.5 py-1 text-[11px] font-semibold"
                  :class="tauxClass(tauxAcceptation(sess)!)"
                >
                  {{ tauxAcceptation(sess) }}%
                </span>
                <span v-else class="text-xs text-[var(--text-tertiary)]">—</span>
              </td>
              <td class="px-5 py-3">
                <span
                  class="rounded-full px-2.5 py-1 text-[11px] font-semibold"
                  :class="sess.estTerminee ? 'bg-[var(--surface-muted)] text-[var(--text-tertiary)]' : 'bg-[var(--honey-soft)] text-[var(--honey-deep)]'"
                >
                  {{ sess.estTerminee ? 'Terminée' : 'En cours' }}
                </span>
              </td>
              <td class="px-5 py-3 text-right">
                <button
                  type="button"
                  class="flex h-7 w-7 items-center justify-center rounded-[8px] text-[var(--text-tertiary)] transition-colors hover:bg-[var(--surface-muted)] hover:text-[var(--text-primary)] ml-auto"
                  title="Modifier"
                  @click="openEdit(sess)"
                >
                  <UIcon name="i-lucide-pencil" class="h-3.5 w-3.5" />
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <UModal v-model:open="showModal" :title="editTarget ? 'Modifier la session' : 'Nouvelle session de greffage'">
      <template #body>
        <div class="space-y-4">
          <UFormField label="Date de greffage *">
            <UInput v-model="form.dateGreffage" type="date" />
          </UFormField>
          <UFormField label="Reine mère">
            <USelect v-model="form.reineMereId" :items="reinesOptions" value-key="value" label-key="label" placeholder="Sélectionner une reine mère" />
          </UFormField>
          <UFormField label="Ruche éleveuse">
            <UInput v-model="form.rucheEleveuse" placeholder="Nom de la ruche éleveuse" />
          </UFormField>
          <div class="grid grid-cols-2 gap-3">
            <UFormField label="Cellules greffées *">
              <UInput v-model="form.nombreCellulesGreffees" type="number" min="1" placeholder="Ex: 20" />
            </UFormField>
            <UFormField label="Cellules acceptées">
              <UInput v-model="form.nombreCellulesAcceptees" type="number" min="0" placeholder="Ex: 15" />
            </UFormField>
          </div>
          <UFormField label="Technique">
            <USelect v-model="form.technique" :items="techniqueOptions" value-key="value" label-key="label" placeholder="Sélectionner" />
          </UFormField>
          <UFormField label="Notes">
            <UTextarea v-model="form.notes" :rows="3" placeholder="Conditions, observations..." />
          </UFormField>
        </div>
      </template>
      <template #footer>
        <div class="flex justify-end gap-3">
          <UButton color="neutral" variant="outline" @click="showModal = false">Annuler</UButton>
          <UButton color="primary" :loading="saving" @click="save">
            {{ editTarget ? 'Enregistrer' : 'Créer' }}
          </UButton>
        </div>
      </template>
    </UModal>
  </div>
</template>
