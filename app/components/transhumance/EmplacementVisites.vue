<script setup lang="ts">
interface VisiteEmplacement {
  id: string;
  dateVisite: string;
  type: string | null;
  commentaire: string | null;
  meteo: { temperature?: number } | null;
  donnees: { actions?: string[] } | null;
}

const props = defineProps<{
  modelValue: boolean;
  emplacement: { id: string; nom: string } | null;
}>();
const emit = defineEmits<{ 'update:modelValue': [boolean] }>();

const toast = useToast();
const isOpen = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v),
});

const visites = ref<VisiteEmplacement[]>([]);
const chargement = ref(false);

async function chargerVisites() {
  if (!props.emplacement) return;
  chargement.value = true;
  try {
    const res = await appelApi<{ data: VisiteEmplacement[] }>('/api/interventions', {
      query: { emplacementId: props.emplacement.id, limit: 50 },
    });
    visites.value = res.data;
  } catch (e) {
    toast.add({ title: getApiErrorMessage(e, 'Erreur de chargement des visites'), color: 'error' });
  } finally {
    chargement.value = false;
  }
}

watch(
  () => props.modelValue,
  (v) => {
    if (v) {
      showForm.value = false;
      chargerVisites();
    }
  },
);

// ─── Nouvelle visite ───
const showForm = ref(false);
const saving = ref(false);
const form = reactive({
  date: '',
  temperature: null as number | null,
  notes: '',
});

function ouvrirForm() {
  const now = new Date();
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  form.date = now.toISOString().slice(0, 16);
  form.temperature = null;
  form.notes = '';
  showForm.value = true;
}

async function enregistrerVisite() {
  if (!props.emplacement) return;
  saving.value = true;
  try {
    await appelApi('/api/interventions/visite-rucher', {
      method: 'POST',
      body: {
        emplacementId: props.emplacement.id,
        date: form.date ? new Date(form.date).toISOString() : undefined,
        temperature: form.temperature ?? undefined,
        notes: form.notes.trim() || undefined,
      },
    });
    toast.add({ title: 'Visite enregistrée', color: 'success' });
    showForm.value = false;
    await chargerVisites();
  } catch (e) {
    toast.add({ title: getApiErrorMessage(e, "Erreur lors de l'enregistrement"), color: 'error' });
  } finally {
    saving.value = false;
  }
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}
</script>

<template>
  <UModal v-model:open="isOpen" :title="`Suivi — ${emplacement?.nom ?? 'Emplacement'}`">
    <template #body>
      <div class="space-y-4">
        <div class="flex items-center justify-between">
          <p class="text-[13px] text-[var(--text-secondary)]">
            Visites et interventions sur cet emplacement
          </p>
          <UButton
            v-if="!showForm"
            size="sm"
            color="primary"
            variant="soft"
            icon="i-lucide-plus"
            @click="ouvrirForm"
          >
            Nouvelle visite
          </UButton>
        </div>

        <!-- Formulaire nouvelle visite -->
        <div
          v-if="showForm"
          class="space-y-3 rounded-[10px] border border-[var(--border-default)] bg-[var(--surface-muted)] p-4"
        >
          <div class="grid grid-cols-2 gap-3">
            <UFormField label="Date">
              <UInput v-model="form.date" type="datetime-local" />
            </UFormField>
            <UFormField label="Température (°C)">
              <UInput v-model.number="form.temperature" type="number" placeholder="18" />
            </UFormField>
          </div>
          <UFormField label="Notes">
            <UTextarea
              v-model="form.notes"
              :rows="3"
              placeholder="État de la miellée, floraison, accès, matériel laissé sur place…"
            />
          </UFormField>
          <div class="flex justify-end gap-2">
            <UButton size="sm" color="neutral" variant="ghost" @click="showForm = false">
              Annuler
            </UButton>
            <UButton size="sm" color="primary" :loading="saving" @click="enregistrerVisite">
              Enregistrer
            </UButton>
          </div>
        </div>

        <!-- Historique -->
        <div v-if="chargement" class="space-y-2">
          <div
            v-for="i in 3"
            :key="i"
            class="h-14 animate-pulse rounded-[10px] bg-[var(--surface-muted)]"
          />
        </div>
        <div
          v-else-if="!visites.length"
          class="flex flex-col items-center gap-2 rounded-[10px] border border-dashed border-[var(--border-default)] py-8 text-center"
        >
          <UIcon name="i-lucide-clipboard-list" class="h-8 w-8 text-[var(--text-tertiary)]" />
          <p class="text-[13px] text-[var(--text-secondary)]">
            Aucune visite enregistrée sur cet emplacement
          </p>
        </div>
        <ul v-else class="max-h-[45vh] space-y-2 overflow-y-auto pr-1">
          <li
            v-for="v in visites"
            :key="v.id"
            class="rounded-[10px] border border-[var(--border-default)] bg-white p-3"
          >
            <div class="flex items-center justify-between gap-2">
              <span class="text-[13px] font-semibold text-[var(--text-primary)]">
                {{ formatDate(v.dateVisite) }}
              </span>
              <span
                v-if="v.meteo?.temperature != null"
                class="shrink-0 rounded-full bg-[var(--honey-soft)] px-2 py-0.5 text-[11px] font-medium text-[var(--honey-deep)]"
              >
                {{ v.meteo.temperature }}°C
              </span>
            </div>
            <p v-if="v.commentaire" class="mt-1 text-[12.5px] text-[var(--text-secondary)]">
              {{ v.commentaire }}
            </p>
          </li>
        </ul>
      </div>
    </template>
    <template #footer>
      <div class="flex w-full justify-end">
        <UButton color="neutral" variant="outline" @click="isOpen = false">Fermer</UButton>
      </div>
    </template>
  </UModal>
</template>
