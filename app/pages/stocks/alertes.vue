<template>
  <div>
    <!-- Back link -->
    <NuxtLink
      to="/stocks"
      class="mb-6 inline-flex items-center gap-1.5 text-[13px] font-medium text-[var(--text-tertiary)] transition-colors hover:text-[var(--text-secondary)]"
    >
      <UIcon name="i-lucide-arrow-left" class="h-3.5 w-3.5" />
      Stocks
    </NuxtLink>

    <!-- Header -->
    <div class="mb-8">
      <h1
        class="font-display text-[26px] font-semibold tracking-[-0.02em] text-[var(--text-primary)]"
      >
        Alertes de stock
      </h1>
      <p class="mt-1 text-[13.5px] text-[var(--text-secondary)]">
        Articles en dessous du seuil d'alerte
      </p>
    </div>

    <!-- Loading -->
    <div v-if="loading">
      <UiLoadingSkeleton variant="card" :count="4" />
    </div>

    <!-- Empty state -->
    <div
      v-else-if="alertes.length === 0"
      class="rounded-[16px] border border-amber-200 bg-amber-50/50 p-10 text-center"
    >
      <div
        class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-[14px] bg-amber-100"
      >
        <UIcon name="i-lucide-check-circle" class="h-8 w-8 text-honey-deep" />
      </div>
      <p class="text-[15px] font-semibold text-[var(--text-primary)]">Tout est en ordre</p>
      <p class="mt-1 text-[13px] text-[var(--text-secondary)]">
        Aucun article n'est en dessous de son seuil d'alerte
      </p>
    </div>

    <!-- Alerts list -->
    <div v-else class="space-y-3">
      <div
        v-for="stock in alertes"
        :key="stock.id"
        class="flex items-center gap-4 rounded-[12px] border border-red-200 bg-red-50/30 px-4 py-4"
      >
        <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-red-100">
          <UIcon name="i-lucide-alert-triangle" class="h-5 w-5 text-red-600" />
        </div>

        <div class="flex-1 min-w-0">
          <p class="text-[14px] font-semibold text-[var(--text-primary)]">{{ stock.nom }}</p>
          <p class="text-[12px] text-[var(--text-tertiary)]">
            <span class="capitalize">{{ stock.categorie }}</span>
            <span v-if="stock.emplacement"> · {{ stock.emplacement }}</span>
          </p>
        </div>

        <div class="text-right shrink-0">
          <p class="text-[16px] font-bold text-red-600">
            {{ Number(stock.quantite) }}
            <span class="text-[13px] font-normal text-[var(--text-tertiary)]">{{
              stock.unite || 'u'
            }}</span>
          </p>
          <p class="text-[11px] text-[var(--text-quaternary)]">
            Seuil : {{ Number(stock.seuilAlerte) }} {{ stock.unite || 'u' }}
          </p>
        </div>

        <div class="ml-2 shrink-0">
          <UButton
            icon="i-lucide-plus"
            label="Réapprovisionner"
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
    notifications.success('Stock réapprovisionné');
    showMouvementForm.value = false;
    await loadAlertes();
  } catch (e: unknown) {
    notifications.error(getApiErrorMessage(e, 'Erreur'));
  } finally {
    saving.value = false;
  }
}
</script>
