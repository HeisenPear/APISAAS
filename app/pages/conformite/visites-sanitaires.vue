<script setup lang="ts">
definePageMeta({ layout: 'default' });

const showModal = ref(false);
const { data, pending, refresh } = useFetch('/api/visites-sanitaires', { key: 'visites-list', lazy: true });

interface VisiteRow {
  id: string;
  dateVisite: string;
  veterinaireNom: string | null;
  rucherNom: string | null;
  observations: string | null;
}
interface VeterinaireOption { id: string; nomComplet: string }
interface RucherOption { id: string; nom: string }

const visites = computed<VisiteRow[]>(() => (data.value as { data: VisiteRow[] } | null)?.data ?? []);

const { data: vetoData } = useFetch('/api/veterinaires', { key: 'vetos-for-visites', lazy: true });
const veterinaires = computed<VeterinaireOption[]>(() => (vetoData.value as { data: VeterinaireOption[] } | null)?.data ?? []);

const { data: ruchersData } = useFetch('/api/ruchers', { key: 'ruchers-for-visites', lazy: true });
const ruchers = computed<RucherOption[]>(() => (ruchersData.value as { data: RucherOption[] } | null)?.data ?? []);

const form = reactive({
  veterinaireId: '',
  rucherId: '',
  dateVisite: new Date().toISOString().slice(0, 10),
  observations: '',
  recommandations: '',
});

const saving = ref(false);
const toast = useToast();

async function handleSave() {
  saving.value = true;
  try {
    await $fetch('/api/visites-sanitaires', {
      method: 'POST',
      body: {
        ...form,
        dateVisite: new Date(form.dateVisite).toISOString(),
        veterinaireId: form.veterinaireId || undefined,
        rucherId: form.rucherId || undefined,
      },
    });
    toast.add({ title: 'Visite enregistrée', color: 'success' });
    showModal.value = false;
    await refresh();
  } catch {
    toast.add({ title: 'Erreur', color: 'error' });
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <div>
    <!-- Conformité nav -->
    <div class="mb-6 flex gap-1.5 flex-wrap">
      <NuxtLink to="/conformite/ordonnances" class="rounded-full px-3.5 py-1.5 text-[12px] font-semibold transition-colors bg-[var(--surface-muted)] text-[var(--text-secondary)] hover:bg-[var(--surface-sunk)]">Ordonnances</NuxtLink>
      <NuxtLink to="/conformite/visites-sanitaires" class="rounded-full px-3.5 py-1.5 text-[12px] font-semibold transition-colors bg-[var(--text-primary)] text-white">Visites sanitaires</NuxtLink>
      <NuxtLink to="/conformite/mortalites" class="rounded-full px-3.5 py-1.5 text-[12px] font-semibold transition-colors bg-[var(--surface-muted)] text-[var(--text-secondary)] hover:bg-[var(--surface-sunk)]">Mortalités</NuxtLink>
      <NuxtLink to="/conformite/veterinaires" class="rounded-full px-3.5 py-1.5 text-[12px] font-semibold transition-colors bg-[var(--surface-muted)] text-[var(--text-secondary)] hover:bg-[var(--surface-sunk)]">Vétérinaires</NuxtLink>
    </div>

    <!-- Header -->
    <div class="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 class="text-[26px] font-semibold tracking-[-0.02em] text-[var(--text-primary)]">Visites sanitaires</h1>
        <p class="mt-1 text-[13.5px] text-[var(--text-secondary)]">Registre des visites du vétérinaire sanitaire (Art. 3, arrêté du 5 juin 2000)</p>
      </div>
      <UButton icon="i-lucide-plus" label="Planifier une visite" color="primary" @click="showModal = true" />
    </div>

    <!-- Loading -->
    <div v-if="pending" class="space-y-3">
      <div v-for="i in 3" :key="i" class="h-20 animate-pulse rounded-[14px] bg-[var(--surface-muted)]" />
    </div>

    <template v-else>
      <!-- 01 — Visites planifiées -->
      <div class="mb-8">
        <p class="text-[11px] font-semibold text-[var(--honey-deep)] uppercase tracking-[0.12em] mb-3">01 — Visites planifiées</p>
        <div v-if="visites.filter((v: any) => new Date(v.dateVisite) >= new Date()).length === 0" class="bg-white border border-[var(--border-default)] rounded-[12px] overflow-hidden">
          <UiEmptyState
            icon="i-lucide-stethoscope"
            title="Aucune visite planifiée"
            description="Planifiez votre prochaine visite sanitaire"
            action-label="Planifier une visite"
            @action="showModal = true"
          />
        </div>
        <div v-else class="space-y-3">
          <div
            v-for="visite in visites.filter((v: any) => new Date(v.dateVisite) >= new Date())"
            :key="visite.id"
            class="bg-white border border-[var(--border-default)] rounded-[14px] p-5 flex items-start gap-4"
          >
            <!-- Date badge -->
            <div class="shrink-0 w-12 text-center bg-[var(--surface-muted)] rounded-[10px] py-2 px-1">
              <p class="text-[11px] font-semibold text-[var(--text-tertiary)] uppercase">{{ new Date(visite.dateVisite).toLocaleDateString('fr-FR', { month: 'short' }) }}</p>
              <p class="text-[22px] font-semibold leading-none text-[var(--text-primary)]">{{ new Date(visite.dateVisite).getDate() }}</p>
            </div>
            <div class="flex-1 min-w-0">
              <div class="flex items-start justify-between gap-2">
                <div>
                  <p class="font-semibold text-[var(--text-primary)]">
                    {{ new Date(visite.dateVisite).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) }}
                  </p>
                  <p v-if="visite.veterinaireNom" class="text-[13px] text-[var(--text-secondary)] mt-0.5">Dr. {{ visite.veterinaireNom }}</p>
                  <p v-if="visite.rucherNom" class="text-[13px] text-[var(--text-secondary)]">Rucher : {{ visite.rucherNom }}</p>
                </div>
                <span class="rounded-full px-2.5 py-1 text-[11px] font-semibold shrink-0" style="background:var(--honey-soft);color:var(--honey-deep)">Planifiée</span>
              </div>
              <p v-if="visite.observations" class="text-[13px] text-[var(--text-tertiary)] mt-2 line-clamp-2">{{ visite.observations }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- 02 — Historique -->
      <div>
        <p class="text-[11px] font-semibold text-[var(--honey-deep)] uppercase tracking-[0.12em] mb-3">02 — Historique</p>
        <div v-if="visites.filter((v: any) => new Date(v.dateVisite) < new Date()).length === 0" class="bg-white border border-[var(--border-default)] rounded-[12px] px-4 py-6 text-center text-[13px] text-[var(--text-tertiary)]">
          Aucune visite passée enregistrée
        </div>
        <div v-else class="bg-white border border-[var(--border-default)] rounded-[12px] overflow-hidden">
          <table class="w-full text-sm">
            <thead>
              <tr class="border-b border-[var(--border-faint)] bg-[var(--surface-muted)]">
                <th class="px-4 py-2.5 text-left text-[11px] font-semibold text-[var(--text-tertiary)] uppercase tracking-[0.08em]">Date</th>
                <th class="px-4 py-2.5 text-left text-[11px] font-semibold text-[var(--text-tertiary)] uppercase tracking-[0.08em]">Vétérinaire</th>
                <th class="px-4 py-2.5 text-left text-[11px] font-semibold text-[var(--text-tertiary)] uppercase tracking-[0.08em]">Rucher</th>
                <th class="px-4 py-2.5 text-left text-[11px] font-semibold text-[var(--text-tertiary)] uppercase tracking-[0.08em]">Observations</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="visite in visites.filter((v: any) => new Date(v.dateVisite) < new Date())"
                :key="visite.id"
                class="border-b border-[var(--border-faint)] last:border-0 hover:bg-[var(--surface-muted)] transition-colors"
              >
                <td class="px-4 py-2.5 text-[var(--text-primary)] font-medium">{{ new Date(visite.dateVisite).toLocaleDateString('fr-FR') }}</td>
                <td class="px-4 py-2.5 text-[var(--text-secondary)]">
                  <span v-if="visite.veterinaireNom">Dr. {{ visite.veterinaireNom }}</span>
                  <span v-else class="text-[var(--text-tertiary)]">—</span>
                </td>
                <td class="px-4 py-2.5 text-[var(--text-secondary)]">
                  <span v-if="visite.rucherNom">{{ visite.rucherNom }}</span>
                  <span v-else class="text-[var(--text-tertiary)]">—</span>
                </td>
                <td class="px-4 py-2.5 text-[var(--text-tertiary)] max-w-[200px] truncate">
                  {{ visite.observations || '—' }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </template>

    <!-- Modal -->
    <UModal v-model:open="showModal">
      <template #content>
        <div class="p-6 space-y-4">
          <h3 class="text-lg font-semibold text-[var(--text-primary)]">Nouvelle visite sanitaire</h3>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-sm font-medium text-[var(--text-secondary)] mb-1">Date *</label>
              <UInput v-model="form.dateVisite" type="date" />
            </div>
            <div>
              <label class="block text-sm font-medium text-[var(--text-secondary)] mb-1">Rucher</label>
              <select v-model="form.rucherId" class="w-full rounded-xl border border-[var(--border-default)] bg-white px-3 py-2 text-sm focus:border-[var(--honey)] focus:outline-none">
                <option value="">Tous les ruchers</option>
                <option v-for="r in ruchers" :key="r.id" :value="r.id">{{ r.nom }}</option>
              </select>
            </div>
          </div>
          <div>
            <label class="block text-sm font-medium text-[var(--text-secondary)] mb-1">Vétérinaire</label>
            <select v-model="form.veterinaireId" class="w-full rounded-xl border border-[var(--border-default)] bg-white px-3 py-2 text-sm focus:border-[var(--honey)] focus:outline-none">
              <option value="">Non renseigné</option>
              <option v-for="v in veterinaires" :key="v.id" :value="v.id">{{ v.nomComplet }}</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-[var(--text-secondary)] mb-1">Observations</label>
            <textarea v-model="form.observations" rows="3" class="w-full rounded-xl border border-[var(--border-default)] bg-white px-3 py-2 text-sm focus:border-[var(--honey)] focus:outline-none resize-none" placeholder="Observations du vétérinaire..." />
          </div>
          <div>
            <label class="block text-sm font-medium text-[var(--text-secondary)] mb-1">Recommandations</label>
            <textarea v-model="form.recommandations" rows="2" class="w-full rounded-xl border border-[var(--border-default)] bg-white px-3 py-2 text-sm focus:border-[var(--honey)] focus:outline-none resize-none" placeholder="Recommandations..." />
          </div>
          <div class="flex gap-3 justify-end">
            <UButton label="Annuler" color="neutral" variant="ghost" @click="showModal = false" />
            <UButton label="Enregistrer" color="primary" :loading="saving" @click="handleSave" />
          </div>
        </div>
      </template>
    </UModal>
  </div>
</template>
