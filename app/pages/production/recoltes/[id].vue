<template>
  <div>
    <NuxtLink
      to="/production/recoltes"
      class="mb-4 inline-flex items-center gap-1 text-sm text-stone-500 transition-colors hover:text-stone-700"
    >
      <UIcon name="i-lucide-arrow-left" class="h-4 w-4" />
      Retour aux recoltes
    </NuxtLink>

    <!-- Loading -->
    <div v-if="loading" class="space-y-4">
      <div class="h-10 w-48 animate-pulse rounded-lg bg-stone-100" />
      <div class="grid grid-cols-4 gap-4">
        <div v-for="i in 4" :key="i" class="h-24 animate-pulse rounded-2xl bg-stone-100" />
      </div>
    </div>

    <template v-else-if="recolte">
      <!-- Header -->
      <div class="mb-6 flex items-start justify-between">
        <div class="flex items-center gap-3">
          <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50">
            <UIcon name="i-lucide-droplets" class="h-5 w-5 text-amber-600" />
          </div>
          <div>
            <h1 class="text-2xl font-bold tracking-tight text-stone-900">
              {{ recolte.typeMiel || 'Recolte' }}
            </h1>
            <p class="text-sm text-stone-500">{{ formatDate(recolte.dateRecolte) }}</p>
          </div>
        </div>
        <div class="flex flex-wrap justify-end gap-2">
          <UButton
            v-if="!editing && recolte.quantiteKg && peutStock"
            label="Mettre en pot"
            icon="i-lucide-package-plus"
            color="primary"
            @click="openPot"
          />
          <UButton
            :label="editing ? 'Annuler' : 'Modifier'"
            :icon="editing ? 'i-lucide-x' : 'i-lucide-pencil'"
            :variant="editing ? 'ghost' : 'outline'"
            color="neutral"
            @click="toggleEdit"
          />
          <UButton
            v-if="!editing"
            label="Supprimer"
            icon="i-lucide-trash-2"
            variant="ghost"
            color="error"
            @click="handleDelete"
          />
        </div>
      </div>

      <!-- Edit form -->
      <div
        v-if="editing"
        class="mx-auto max-w-2xl rounded-2xl border border-stone-200/60 bg-white p-6 shadow-sm"
      >
        <ProductionRecolteForm
          :initial="editFormData"
          :ruchers="ruchers"
          :ruches="allRuches"
          submit-label="Enregistrer les modifications"
          @submit="handleUpdate"
          @cancel="editing = false"
        />
      </div>

      <!-- Detail view -->
      <template v-else>
        <!-- KPIs -->
        <div class="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div class="rounded-2xl border border-stone-200/60 bg-white p-4 shadow-sm">
            <p class="text-xs text-stone-500">Quantite</p>
            <p class="mt-1 text-2xl font-bold text-amber-600">
              {{ recolte.quantiteKg ? `${Number(recolte.quantiteKg)} kg` : '-' }}
            </p>
          </div>
          <div class="rounded-2xl border border-stone-200/60 bg-white p-4 shadow-sm">
            <p class="text-xs text-stone-500">Humidite</p>
            <p class="mt-1 text-2xl font-bold" :class="humiditeColor">
              {{ recolte.humidite ? `${Number(recolte.humidite)}%` : '-' }}
            </p>
            <p
              v-if="recolte.humidite"
              class="mt-0.5 text-xs"
              :class="Number(recolte.humidite) <= 20 ? 'text-amber-600' : 'text-red-600'"
            >
              {{ Number(recolte.humidite) <= 20 ? 'Conforme (≤ 20%)' : 'Non conforme (> 20%)' }}
            </p>
          </div>
          <div class="rounded-2xl border border-stone-200/60 bg-white p-4 shadow-sm">
            <p class="text-xs text-stone-500">Hausses</p>
            <p class="mt-1 text-2xl font-bold text-stone-900">{{ recolte.nombreHausses ?? '-' }}</p>
          </div>
          <div class="rounded-2xl border border-stone-200/60 bg-white p-4 shadow-sm">
            <p class="text-xs text-stone-500">Lot</p>
            <NuxtLink
              v-if="recolte.numeroLot"
              :to="`/production/lots/${encodeURIComponent(recolte.numeroLot)}`"
              class="mt-1 inline-flex items-center gap-1 text-lg font-bold text-amber-600 hover:text-amber-700"
            >
              {{ recolte.numeroLot }}
              <UIcon name="i-lucide-external-link" class="h-4 w-4" />
            </NuxtLink>
            <p v-else class="mt-1 text-lg font-bold text-stone-400">Non attribue</p>
          </div>
        </div>

        <!-- Info card -->
        <div class="rounded-2xl border border-stone-200/60 bg-white p-6 shadow-sm">
          <h2 class="mb-4 text-sm font-semibold uppercase tracking-wider text-stone-400">
            Details
          </h2>
          <dl class="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
            <div>
              <dt class="text-stone-500">Type de miel</dt>
              <dd class="font-medium text-stone-900">{{ recolte.typeMiel || 'Non specifie' }}</dd>
            </div>
            <div>
              <dt class="text-stone-500">Date de recolte</dt>
              <dd class="font-medium text-stone-900">{{ formatDate(recolte.dateRecolte) }}</dd>
            </div>
            <div>
              <dt class="text-stone-500">Rucher</dt>
              <dd class="font-medium text-stone-900">{{ recolte.rucherNom || 'Non assigne' }}</dd>
            </div>
            <div>
              <dt class="text-stone-500">Ruche</dt>
              <dd class="font-medium text-stone-900">
                {{ recolte.rucheNumero || 'Non assignee' }}
              </dd>
            </div>
            <div v-if="recolte.notes" class="col-span-2">
              <dt class="text-stone-500">Notes</dt>
              <dd class="font-medium text-stone-900">{{ recolte.notes }}</dd>
            </div>
          </dl>
        </div>

        <!-- Photos -->
        <div class="rounded-[14px] border border-[var(--border-default)] bg-white p-6 shadow-sm">
          <h2
            class="mb-4 text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--honey-deep)]"
          >
            Photos
          </h2>
          <UiPhotoUploader
            v-model="recoltePhotos"
            bucket="recoltes-photos"
            :entity-id="recolteId"
            :max-photos="8"
            @update:model-value="saveRecoltePhotos"
          />
        </div>
      </template>
    </template>

    <!-- Not found -->
    <UiEmptyState
      v-else
      icon="i-lucide-search-x"
      title="Recolte introuvable"
      description="Cette recolte n'existe pas ou a ete supprimee"
      action-label="Retour aux recoltes"
      @action="navigateTo('/production/recoltes')"
    />

    <!-- Modal « Mettre en pot » : récolte → stock de miel vendable, au plus simple -->
    <UModal v-model:open="showPot">
      <template #content>
        <div class="p-6">
          <h2 class="text-lg font-semibold text-stone-900">Mettre en pot</h2>
          <p class="mt-1 text-sm text-stone-500">
            Ajoute cette récolte à vos stocks de miel à vendre. Vous pourrez ajuster le prix et le
            conditionnement à tout moment.
          </p>
          <div class="mt-5 space-y-4">
            <UFormField label="Nom du produit">
              <UInput v-model="potNom" placeholder="Miel toutes fleurs 2026" class="w-full" />
            </UFormField>
            <div class="grid grid-cols-2 gap-3">
              <UFormField label="Quantité (kg)">
                <UInput
                  v-model.number="potQuantite"
                  type="number"
                  step="0.1"
                  min="0"
                  class="w-full"
                />
              </UFormField>
              <UFormField label="Prix au kg (€)" hint="Facultatif">
                <UInput
                  v-model.number="potPrix"
                  type="number"
                  step="0.5"
                  min="0"
                  placeholder="—"
                  class="w-full"
                />
              </UFormField>
            </div>
          </div>
          <div class="mt-6 flex justify-end gap-3 border-t border-stone-100 pt-4">
            <UButton label="Annuler" variant="ghost" color="neutral" @click="showPot = false" />
            <UButton
              label="Ajouter au stock"
              icon="i-lucide-check"
              color="primary"
              :loading="potting"
              :disabled="!potNom.trim() || !potQuantite || potQuantite <= 0"
              @click="mettreEnPot"
            />
          </div>
        </div>
      </template>
    </UModal>
  </div>
</template>

<script setup lang="ts">
import type { Rucher, Ruche, PhotoEntry } from '~/types/models';
import type { RecolteFormData } from '~/components/production/RecolteForm.vue';
import type { ApiListResponse } from '~/types/api';

definePageMeta({ layout: 'default' });

const route = useRoute();
const router = useRouter();
const notifications = useNotifications();

const recolteId = route.params.id as string;
const loading = ref(true);
const editing = ref(false);
const saving = ref(false);
const recoltePhotos = ref<PhotoEntry[]>([]);

interface RecolteDetail {
  id: string;
  rucherId: string | null;
  rucheId: string | null;
  dateRecolte: string;
  typeMiel: string | null;
  quantiteKg: string | null;
  humidite: string | null;
  nombreHausses: number | null;
  numeroLot: string | null;
  notes: string | null;
  rucherNom: string | null;
  rucheNumero: string | null;
}

const recolte = ref<RecolteDetail | null>(null);
const ruchers = ref<Rucher[]>([]);
const allRuches = ref<Ruche[]>([]);

// « Mettre en pot » — transforme la récolte en stock de miel vendable en un clic.
// Interconnexion GATÉE PAR L'ABONNEMENT : réservée aux plans qui gèrent le stock
// (Starter+ via `stocksBasique`) ; l'endpoint /api/stocks refuse déjà en dessous,
// et on masque l'action pour ne pas la promettre à un plan qui n'y a pas droit.
const { can } = useGating();
const { emit: emitBus } = useDataBus();
const peutStock = computed(() => can('stocksBasique'));
const showPot = ref(false);
const potting = ref(false);
const potNom = ref('');
const potQuantite = ref<number | null>(null);
const potPrix = ref<number | null>(null);

function anneeRecolte(): number {
  return recolte.value?.dateRecolte
    ? new Date(recolte.value.dateRecolte).getFullYear()
    : new Date().getFullYear();
}

function openPot() {
  const type = recolte.value?.typeMiel?.trim();
  potNom.value = ['Miel', type, anneeRecolte()].filter(Boolean).join(' ');
  potQuantite.value = recolte.value?.quantiteKg ? Number(recolte.value.quantiteKg) : null;
  potPrix.value = null;
  showPot.value = true;
}

async function mettreEnPot() {
  if (!potNom.value.trim() || !potQuantite.value || potQuantite.value <= 0) return;
  potting.value = true;
  try {
    await $fetch('/api/stocks', {
      method: 'POST',
      body: {
        nom: potNom.value.trim(),
        type: 'produit_vente',
        categorie: 'autre',
        categorieVente: 'miel',
        quantite: potQuantite.value,
        unite: 'kg',
        modePrix: 'format',
        prixUnitaire: potPrix.value ?? undefined,
        typeMiel: recolte.value?.typeMiel ?? undefined,
        anneeRecolte: anneeRecolte(),
        numLot: recolte.value?.numeroLot ?? undefined,
        origineGeo: recolte.value?.rucherNom ?? undefined,
      },
    });
    emitBus('stock:created', {});
    showPot.value = false;
    notifications.success('Miel ajouté à vos stocks à vendre');
  } catch (e: unknown) {
    notifications.error(getApiErrorMessage(e, 'Erreur lors de la mise en pot'));
  } finally {
    potting.value = false;
  }
}

const humiditeColor = computed(() => {
  if (!recolte.value?.humidite) return 'text-stone-400';
  const h = Number(recolte.value.humidite);
  if (h <= 18) return 'text-amber-600';
  if (h <= 20) return 'text-amber-600';
  return 'text-red-600';
});

const editFormData = computed(
  (): RecolteFormData => ({
    rucherId: recolte.value?.rucherId ?? '',
    rucheId: recolte.value?.rucheId ?? '',
    dateRecolte: recolte.value?.dateRecolte
      ? new Date(recolte.value.dateRecolte).toISOString().slice(0, 10)
      : '',
    typeMiel: recolte.value?.typeMiel ?? '',
    quantiteKg: recolte.value?.quantiteKg ? Number(recolte.value.quantiteKg) : null,
    humidite: recolte.value?.humidite ? Number(recolte.value.humidite) : null,
    nombreHausses: recolte.value?.nombreHausses ?? null,
    numeroLot: recolte.value?.numeroLot ?? '',
    notes: recolte.value?.notes ?? '',
  }),
);

async function fetchData() {
  loading.value = true;
  try {
    const [res, ruchersRes, ruchesRes] = await Promise.all([
      $fetch<{ data: RecolteDetail }>(`/api/production/recoltes/${recolteId}`),
      $fetch<ApiListResponse<Rucher>>('/api/ruchers?limit=100'),
      $fetch<ApiListResponse<Ruche>>('/api/ruches?limit=200'),
    ]);
    recolte.value = res.data;
    ruchers.value = ruchersRes.data;
    allRuches.value = ruchesRes.data;
    recoltePhotos.value = (res.data as RecolteDetail & { photos?: PhotoEntry[] }).photos ?? [];
  } catch {
    recolte.value = null;
  } finally {
    loading.value = false;
  }
}

function toggleEdit() {
  editing.value = !editing.value;
}

async function saveRecoltePhotos(updated: PhotoEntry[]) {
  recoltePhotos.value = updated;
  try {
    await $fetch(`/api/production/recoltes/${recolteId}`, {
      method: 'PUT',
      body: { photos: updated },
    });
  } catch (e: unknown) {
    notifications.error(getApiErrorMessage(e, 'Erreur sauvegarde photos'));
  }
}

async function handleUpdate(formData: RecolteFormData) {
  saving.value = true;
  try {
    await $fetch(`/api/production/recoltes/${recolteId}`, {
      method: 'PUT',
      body: {
        rucherId: formData.rucherId || null,
        rucheId: formData.rucheId || null,
        dateRecolte: formData.dateRecolte,
        typeMiel: formData.typeMiel || null,
        quantiteKg: formData.quantiteKg,
        humidite: formData.humidite,
        nombreHausses: formData.nombreHausses,
        numeroLot: formData.numeroLot || null,
        notes: formData.notes || null,
      },
    });
    notifications.success('Recolte mise a jour');
    editing.value = false;
    await fetchData();
  } catch (e: unknown) {
    notifications.error(getApiErrorMessage(e, 'Erreur lors de la mise a jour'));
  } finally {
    saving.value = false;
  }
}

async function handleDelete() {
  if (!confirm('Supprimer definitivement cette recolte ?')) return;
  try {
    await ($fetch as typeof $fetch<unknown, string>)(`/api/production/recoltes/${recolteId}`, {
      method: 'DELETE',
    });
    notifications.success('Recolte supprimee');
    await router.push('/production/recoltes');
  } catch (e: unknown) {
    notifications.error(getApiErrorMessage(e, 'Erreur'));
  }
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

onMounted(fetchData);
</script>
