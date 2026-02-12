<template>
  <div>
    <!-- Back link -->
    <NuxtLink
      to="/stocks"
      class="mb-4 inline-flex items-center gap-1 text-sm text-stone-500 transition-colors hover:text-stone-700"
    >
      <UIcon name="i-lucide-arrow-left" class="h-4 w-4" />
      Retour aux stocks
    </NuxtLink>

    <!-- Header -->
    <UiPageHeader title="Alertes de stock" description="Articles en dessous du seuil d'alerte" />

    <!-- Loading -->
    <div v-if="loading" class="mt-6">
      <UiLoadingSkeleton variant="card" :count="4" />
    </div>

    <!-- Empty state -->
    <div
      v-else-if="alertes.length === 0"
      class="mt-8 rounded-2xl border border-emerald-200 bg-emerald-50/50 p-8 text-center"
    >
      <div
        class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-100"
      >
        <UIcon name="i-lucide-check-circle" class="h-8 w-8 text-emerald-600" />
      </div>
      <h3 class="text-lg font-semibold text-stone-900">Tout est en ordre</h3>
      <p class="mt-1 text-sm text-stone-500">
        Aucun article n'est en dessous de son seuil d'alerte
      </p>
    </div>

    <!-- Alerts list -->
    <div v-else class="mt-6 space-y-4">
      <div
        v-for="stock in alertes"
        :key="stock.id"
        class="flex items-center gap-4 rounded-2xl border border-red-200 bg-red-50/30 p-5 shadow-sm"
      >
        <div class="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-red-100">
          <UIcon name="i-lucide-alert-triangle" class="h-6 w-6 text-red-600" />
        </div>

        <div class="flex-1">
          <p class="font-semibold text-stone-900">{{ stock.nom }}</p>
          <p class="text-sm text-stone-500">
            <span class="capitalize">{{ stock.categorie }}</span>
            <span v-if="stock.emplacement"> · {{ stock.emplacement }}</span>
          </p>
        </div>

        <div class="text-right">
          <p class="text-lg font-bold text-red-600">
            {{ Number(stock.quantite) }}
            <span class="text-sm font-normal text-stone-400">{{ stock.unite || 'u' }}</span>
          </p>
          <p class="text-xs text-stone-400">
            Seuil : {{ Number(stock.seuilAlerte) }} {{ stock.unite || 'u' }}
          </p>
        </div>

        <div class="ml-2">
          <UButton
            icon="i-lucide-plus"
            label="Reapprovisionner"
            size="sm"
            color="primary"
            @click="reapprovisionner(stock)"
          />
        </div>
      </div>
    </div>

    <!-- Modal mouvement -->
    <UModal v-model:open="showMouvementForm">
      <template #content>
        <div class="p-6">
          <StocksMouvementForm
            mouvement-type="entree"
            :stock-nom="selectedStock?.nom"
            :loading="saving"
            @submit="handleMouvement"
            @cancel="showMouvementForm = false"
          />
        </div>
      </template>
    </UModal>
  </div>
</template>

<script setup lang="ts">
import type { Stock } from '~/types/models';

definePageMeta({ layout: 'default' });

const notifications = useNotifications();
const { getAlertes, createMouvement } = useStocks();

const alertes = ref<Stock[]>([]);
const loading = ref(true);
const showMouvementForm = ref(false);
const selectedStock = ref<Stock | null>(null);
const saving = ref(false);

async function loadAlertes() {
  loading.value = true;
  try {
    alertes.value = await getAlertes();
  } catch {
    alertes.value = [];
  } finally {
    loading.value = false;
  }
}

onMounted(() => loadAlertes());

function reapprovisionner(stock: Stock) {
  selectedStock.value = stock;
  showMouvementForm.value = true;
}

async function handleMouvement(data: { quantite: number; motif: string }) {
  if (!selectedStock.value) return;
  saving.value = true;
  try {
    await createMouvement({
      stockId: selectedStock.value.id,
      type: 'entree',
      quantite: data.quantite,
      motif: data.motif || undefined,
    });
    notifications.success('Stock reapprovisionne');
    showMouvementForm.value = false;
    await loadAlertes();
  } catch (e: unknown) {
    notifications.error(e instanceof Error ? e.message : 'Erreur');
  } finally {
    saving.value = false;
  }
}
</script>
