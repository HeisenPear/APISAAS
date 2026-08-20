<template>
  <Teleport to="body">
    <Transition name="qem">
      <div
        v-if="open"
        class="fixed inset-0 z-[60] flex items-end justify-center bg-black/40 sm:items-center sm:p-4"
        @click.self="close"
      >
        <div
          class="qem-card flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-[22px] bg-white shadow-2xl sm:max-w-md sm:rounded-[22px]"
        >
          <!-- Header -->
          <div
            class="flex shrink-0 items-center justify-between border-b px-5 py-4"
            style="border-color: var(--border-default)"
          >
            <div class="flex items-center gap-3">
              <div
                class="flex h-10 w-10 items-center justify-center rounded-xl"
                style="background: var(--honey-soft)"
              >
                <UIcon
                  name="i-lucide-calendar-plus"
                  class="h-5 w-5"
                  style="color: var(--honey-deep)"
                />
              </div>
              <div>
                <p class="text-[14px] font-semibold" style="color: var(--text-primary)">
                  Nouvel événement
                </p>
                <p class="text-[12px] capitalize" style="color: var(--text-tertiary)">
                  {{ dateLabel }}
                </p>
              </div>
            </div>
            <button
              aria-label="Fermer"
              type="button"
              class="flex h-8 w-8 items-center justify-center rounded-lg transition-colors hover:bg-[var(--surface-muted)]"
              @click="close"
            >
              <UIcon name="i-lucide-x" class="h-4 w-4" style="color: var(--text-tertiary)" />
            </button>
          </div>

          <!-- Segmented control -->
          <div class="shrink-0 px-5 pt-4">
            <div
              class="grid grid-cols-2 gap-1 rounded-[12px] p-1"
              style="background: var(--surface-muted)"
            >
              <button
                v-for="m in MODES"
                :key="m.value"
                type="button"
                class="flex items-center justify-center gap-1.5 rounded-[9px] py-2 text-[13px] font-medium transition-all"
                :class="
                  mode === m.value
                    ? 'bg-white shadow-sm'
                    : 'text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]'
                "
                :style="mode === m.value ? 'color: var(--text-primary)' : ''"
                @click="mode = m.value"
              >
                <UIcon :name="m.icon" class="h-4 w-4" />
                {{ m.label }}
              </button>
            </div>
          </div>

          <!-- Scrollable body -->
          <div class="flex-1 space-y-4 overflow-y-auto px-5 py-4">
            <!-- Heure (commun) -->
            <div>
              <label class="qem-label">Heure</label>
              <input v-model="time" type="time" class="qem-input" />
            </div>

            <!-- ─── Mode INTERVENTION ─────────────────────────────────── -->
            <template v-if="mode === 'intervention'">
              <div>
                <label class="qem-label">Ruche</label>
                <USelect
                  v-model="rucheId"
                  :items="rucheItems"
                  value-key="value"
                  label-key="label"
                  placeholder="Sélectionner une ruche"
                  class="w-full"
                />
                <p v-if="!loadingData && rucheItems.length === 0" class="qem-hint">
                  Aucune ruche disponible — créez-en une d'abord.
                </p>
              </div>

              <div>
                <label class="qem-label">Type d'intervention</label>
                <div class="grid grid-cols-3 gap-1.5">
                  <button
                    v-for="t in INTER_TYPES"
                    :key="t.value"
                    type="button"
                    class="flex flex-col items-center gap-1 rounded-[10px] border-2 px-1 py-2.5 transition-all"
                    :class="
                      interType === t.value
                        ? 'border-[var(--honey)] bg-[var(--honey-soft)]'
                        : 'border-[var(--border-default)] hover:border-[var(--honey)]/40'
                    "
                    @click="interType = t.value"
                  >
                    <UIcon
                      :name="t.icon"
                      class="h-4 w-4"
                      :style="
                        interType === t.value
                          ? 'color: var(--honey-deep)'
                          : 'color: var(--text-tertiary)'
                      "
                    />
                    <span
                      class="text-[11px] font-medium"
                      :style="
                        interType === t.value
                          ? 'color: var(--text-primary)'
                          : 'color: var(--text-secondary)'
                      "
                      >{{ t.label }}</span
                    >
                  </button>
                </div>
              </div>

              <!-- Champs par type -->
              <div v-if="interType === 'commentaire'">
                <label class="qem-label">Note</label>
                <textarea
                  v-model="note"
                  rows="3"
                  class="qem-input"
                  placeholder="Ce que vous prévoyez / observez…"
                />
              </div>

              <template v-else-if="interType === 'controle'">
                <div>
                  <label class="qem-label">Force de la colonie</label>
                  <div class="grid grid-cols-4 gap-1.5">
                    <button
                      v-for="f in [1, 2, 3, 4]"
                      :key="f"
                      type="button"
                      class="rounded-[9px] border-2 py-2 text-[13px] font-semibold transition-all"
                      :class="
                        cForce === f
                          ? 'border-[var(--honey)] bg-[var(--honey-soft)] text-[var(--text-primary)]'
                          : 'border-[var(--border-default)] text-[var(--text-tertiary)]'
                      "
                      @click="cForce = f"
                    >
                      {{ f }}
                    </button>
                  </div>
                </div>
                <div>
                  <label class="qem-label">Comportement</label>
                  <USelect
                    v-model="cComportement"
                    :items="COMPORTEMENTS"
                    value-key="value"
                    label-key="label"
                    class="w-full"
                  />
                </div>
              </template>

              <template v-else-if="interType === 'nourrissement'">
                <div>
                  <label class="qem-label">Type d'aliment</label>
                  <USelect
                    v-model="nType"
                    :items="NOURRI_TYPES"
                    value-key="value"
                    label-key="label"
                    class="w-full"
                  />
                </div>
                <div class="grid grid-cols-2 gap-3">
                  <div>
                    <label class="qem-label">Quantité</label>
                    <input
                      v-model.number="nQuantite"
                      type="number"
                      min="0"
                      step="0.1"
                      class="qem-input"
                    />
                  </div>
                  <div>
                    <label class="qem-label">Unité</label>
                    <USelect
                      v-model="nUnite"
                      :items="UNITES"
                      value-key="value"
                      label-key="label"
                      class="w-full"
                    />
                  </div>
                </div>
              </template>

              <div v-else-if="interType === 'recolte'">
                <label class="qem-label">Produit</label>
                <USelect
                  v-model="rProduit"
                  :items="PRODUITS"
                  value-key="value"
                  label-key="label"
                  class="w-full"
                />
              </div>

              <template v-else-if="interType === 'pesee'">
                <div class="grid grid-cols-2 gap-3">
                  <div>
                    <label class="qem-label">Poids (kg)</label>
                    <input
                      v-model.number="pPoids"
                      type="number"
                      min="0"
                      step="0.1"
                      class="qem-input"
                    />
                  </div>
                  <div>
                    <label class="qem-label">Type de pesée</label>
                    <USelect
                      v-model="pType"
                      :items="TYPES_PESEE"
                      value-key="value"
                      label-key="label"
                      class="w-full"
                    />
                  </div>
                </div>
              </template>

              <!-- Note libre (sauf type commentaire qui EST la note) -->
              <div v-if="interType !== 'commentaire'">
                <label class="qem-label">Note (facultatif)</label>
                <textarea v-model="note" rows="2" class="qem-input" placeholder="Précisions…" />
              </div>

              <NuxtLink
                :to="detailWizardUrl"
                class="flex items-center justify-center gap-1.5 text-[12.5px] font-medium text-[var(--honey-deep)] hover:underline"
                @click="close"
              >
                Visite complète détaillée
                <UIcon name="i-lucide-arrow-right" class="h-3.5 w-3.5" />
              </NuxtLink>
            </template>

            <!-- ─── Mode RENDEZ-VOUS ──────────────────────────────────── -->
            <template v-else>
              <div>
                <label class="qem-label">Type de rendez-vous</label>
                <USelect
                  v-model="rdvType"
                  :items="RDV_TYPES"
                  value-key="value"
                  label-key="label"
                  class="w-full"
                />
              </div>
              <div>
                <label class="qem-label">Contact (facultatif)</label>
                <input
                  v-model="rdvContact"
                  type="text"
                  class="qem-input"
                  placeholder="Nom, téléphone, lieu…"
                />
              </div>
              <div>
                <label class="qem-label">Rucher concerné (facultatif)</label>
                <USelect
                  v-model="rdvRucherId"
                  :items="rucherItems"
                  value-key="value"
                  label-key="label"
                  class="w-full"
                />
              </div>
              <div>
                <label class="qem-label">Notes (facultatif)</label>
                <textarea
                  v-model="rdvNotes"
                  rows="2"
                  class="qem-input"
                  placeholder="Objet du rendez-vous…"
                />
              </div>
            </template>
          </div>

          <!-- Footer -->
          <div
            class="shrink-0 border-t px-5 py-4"
            style="
              border-color: var(--border-default);
              padding-bottom: max(1rem, env(safe-area-inset-bottom, 0px));
            "
          >
            <UButton
              block
              color="primary"
              size="lg"
              icon="i-lucide-check"
              :loading="saving"
              :disabled="!canSubmit"
              class="font-semibold"
              @click="submit"
            >
              {{ mode === 'rdv' ? 'Créer le rendez-vous' : "Créer l'intervention" }}
            </UButton>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import type { ApiListResponse } from '~/types/api';

const props = defineProps<{
  open: boolean;
  date: Date | null;
}>();

const emit = defineEmits<{
  'update:open': [value: boolean];
  saved: [];
}>();

const notifications = useNotifications();
const { emit: busEmit } = useDataBus();

// ── Options ────────────────────────────────────────────────────────────────
const MODES = [
  { value: 'intervention' as const, label: 'Intervention', icon: 'i-lucide-clipboard-list' },
  { value: 'rdv' as const, label: 'Rendez-vous', icon: 'i-lucide-briefcase' },
];

const INTER_TYPES = [
  { value: 'commentaire', label: 'Note', icon: 'i-lucide-sticky-note' },
  { value: 'controle', label: 'Contrôle', icon: 'i-lucide-clipboard-check' },
  { value: 'nourrissement', label: 'Nourrir', icon: 'i-lucide-droplet' },
  { value: 'recolte', label: 'Récolte', icon: 'i-lucide-package' },
  { value: 'pesee', label: 'Pesée', icon: 'i-lucide-scale' },
] as const;

const COMPORTEMENTS = [
  { value: 'calme', label: 'Calme' },
  { value: 'agitee', label: 'Agitée' },
  { value: 'agressive', label: 'Agressive' },
];
const NOURRI_TYPES = [
  { value: 'sirop_sucre', label: 'Sirop de sucre' },
  { value: 'sirop_glucose', label: 'Sirop de glucose' },
  { value: 'candi', label: 'Candi' },
  { value: 'pate_proteique', label: 'Pâte protéique' },
  { value: 'miel', label: 'Miel' },
  { value: 'autre', label: 'Autre' },
];
const UNITES = [
  { value: 'kg', label: 'kg' },
  { value: 'g', label: 'g' },
  { value: 'litres', label: 'litres' },
  { value: 'ml', label: 'ml' },
];
const PRODUITS = [
  { value: 'miel', label: 'Miel' },
  { value: 'pollen', label: 'Pollen' },
  { value: 'propolis', label: 'Propolis' },
];
const TYPES_PESEE = [
  { value: 'totale', label: 'Totale' },
  { value: 'cote_droit', label: 'Côté droit' },
  { value: 'cote_gauche', label: 'Côté gauche' },
  { value: 'arriere', label: 'Arrière' },
];
const RDV_TYPES = [
  { value: 'veterinaire', label: 'Vétérinaire' },
  { value: 'syndicat', label: 'Syndicat' },
  { value: 'fournisseur', label: 'Fournisseur' },
  { value: 'client', label: 'Client' },
  { value: 'administration', label: 'Administration' },
  { value: 'autre', label: 'Autre' },
];

// ── State ────────────────────────────────────────────────────────────────
const mode = ref<'intervention' | 'rdv'>('intervention');
const time = ref('09:00');
const saving = ref(false);

// Intervention
const rucheId = ref('');
const interType = ref<(typeof INTER_TYPES)[number]['value']>('commentaire');
const note = ref('');
const cForce = ref(3);
const cComportement = ref('calme');
const nType = ref('sirop_sucre');
const nQuantite = ref<number | null>(null);
const nUnite = ref('litres');
const rProduit = ref('miel');
const pPoids = ref<number | null>(null);
const pType = ref('totale');

// RDV
const rdvType = ref('veterinaire');
const rdvContact = ref('');
const rdvNotes = ref('');
// Reka UI (Nuxt UI v3) interdit un <SelectItem value=""> → sentinelle non vide.
const RUCHER_NONE = 'none';
const rdvRucherId = ref(RUCHER_NONE);

// ── Données (ruches / ruchers) ─────────────────────────────────────────────
const loadingData = ref(false);
const ruches = ref<{ id: string; numero: string | number; rucherNom?: string }[]>([]);
const ruchers = ref<{ id: string; nom: string }[]>([]);
let dataLoaded = false;

async function loadData() {
  if (dataLoaded) return;
  loadingData.value = true;
  try {
    const [ruchesRes, ruchersRes] = await Promise.all([
      $fetch<ApiListResponse<{ id: string; numero: string | number; rucherNom?: string }>>(
        '/api/ruches',
        { query: { limit: 200 } },
      ),
      $fetch<ApiListResponse<{ id: string; nom: string }>>('/api/ruchers', {
        query: { limit: 200 },
      }),
    ]);
    ruches.value = ruchesRes.data;
    ruchers.value = ruchersRes.data;
    if (!rucheId.value && ruches.value[0]) rucheId.value = ruches.value[0].id;
    dataLoaded = true;
  } catch {
    // Silencieux : selects vides, l'utilisateur voit le hint « aucune ruche »
  } finally {
    loadingData.value = false;
  }
}

const rucheItems = computed(() =>
  ruches.value.map((r) => ({
    value: r.id,
    label: `Ruche ${r.numero}${r.rucherNom ? ` · ${r.rucherNom}` : ''}`,
  })),
);
const rucherItems = computed(() => [
  { value: RUCHER_NONE, label: 'Aucun rucher' },
  ...ruchers.value.map((r) => ({ value: r.id, label: r.nom })),
]);

const dateLabel = computed(() =>
  props.date
    ? props.date.toLocaleDateString('fr-FR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : '',
);

const detailWizardUrl = computed(() => {
  if (!props.date) return '/interventions/nouvelle';
  const y = props.date.getFullYear();
  const m = String(props.date.getMonth() + 1).padStart(2, '0');
  const d = String(props.date.getDate()).padStart(2, '0');
  return `/interventions/nouvelle?date=${y}-${m}-${d}`;
});

const canSubmit = computed(() => {
  if (mode.value === 'rdv') return true;
  if (!rucheId.value) return false;
  if (interType.value === 'commentaire') return note.value.trim().length > 0;
  if (interType.value === 'nourrissement') return (nQuantite.value ?? 0) > 0;
  if (interType.value === 'pesee') return (pPoids.value ?? 0) > 0;
  return true;
});

// Combine la date sélectionnée (jour) avec l'heure choisie → ISO.
function buildDate(): Date {
  const base = props.date ? new Date(props.date) : new Date();
  const [h, m] = time.value.split(':').map(Number);
  base.setHours(h ?? 9, m ?? 0, 0, 0);
  return base;
}

function buildDonnees(): Record<string, unknown> {
  switch (interType.value) {
    case 'commentaire':
      return { texte: note.value.trim() };
    case 'controle':
      return {
        forceColonie: cForce.value,
        comportement: cComportement.value,
        reineVue: null,
        couvainPresent: null,
        celluleRoyale: null,
        reserves: null,
      };
    case 'nourrissement':
      return { type: nType.value, quantite: nQuantite.value ?? 0, unite: nUnite.value };
    case 'recolte':
      return { typeProduit: rProduit.value };
    case 'pesee':
      return { poidsKg: pPoids.value ?? 0, typePesee: pType.value };
    default:
      return {};
  }
}

async function submit() {
  if (!canSubmit.value || saving.value) return;
  saving.value = true;
  try {
    if (mode.value === 'rdv') {
      await $fetch('/api/interventions/rdv-pro', {
        method: 'POST',
        body: {
          date: buildDate().toISOString(),
          typeRdv: rdvType.value,
          contact: rdvContact.value || undefined,
          notes: rdvNotes.value || undefined,
          rucherId:
            rdvRucherId.value && rdvRucherId.value !== RUCHER_NONE ? rdvRucherId.value : undefined,
        },
      });
      notifications.success('Rendez-vous créé');
    } else {
      await $fetch('/api/interventions', {
        method: 'POST',
        body: {
          rucheId: rucheId.value,
          date: buildDate().toISOString(),
          type: interType.value,
          donnees: buildDonnees(),
          commentaire: interType.value !== 'commentaire' && note.value ? note.value : undefined,
        },
      });
      notifications.success('Intervention créée');
    }
    busEmit('intervention:created');
    emit('saved');
    close();
  } catch (e: unknown) {
    notifications.error(getApiErrorMessage(e, 'Erreur lors de la création'));
  } finally {
    saving.value = false;
  }
}

function resetFields() {
  mode.value = 'intervention';
  interType.value = 'commentaire';
  note.value = '';
  cForce.value = 3;
  cComportement.value = 'calme';
  nQuantite.value = null;
  pPoids.value = null;
  rdvContact.value = '';
  rdvNotes.value = '';
  rdvRucherId.value = '';
  time.value = '09:00';
}

function close() {
  emit('update:open', false);
}

watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) {
      resetFields();
      loadData();
    }
  },
);
</script>

<style scoped>
.qem-label {
  display: block;
  margin-bottom: 0.375rem;
  font-size: 12px;
  font-weight: 600;
  color: var(--text-secondary);
}
.qem-input {
  width: 100%;
  min-height: 44px;
  border-radius: 10px;
  border: 1px solid var(--border-default);
  background: white;
  padding: 0.5rem 0.75rem;
  font-size: 14px;
  color: var(--text-primary);
}
.qem-input:focus {
  outline: none;
  border-color: var(--honey);
}
.qem-hint {
  margin-top: 0.375rem;
  font-size: 12px;
  color: var(--text-tertiary);
}

.qem-enter-active,
.qem-leave-active {
  transition: opacity 220ms ease;
}
.qem-enter-active .qem-card,
.qem-leave-active .qem-card {
  transition: transform 260ms cubic-bezier(0.16, 1, 0.3, 1);
}
.qem-enter-from,
.qem-leave-to {
  opacity: 0;
}
.qem-enter-from .qem-card,
.qem-leave-to .qem-card {
  transform: translateY(16px);
}
</style>
