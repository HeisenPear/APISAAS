<template>
  <div class="min-h-dvh bg-[var(--surface-primary)] px-4 py-8">
    <div class="mx-auto max-w-2xl">
      <!-- Loading -->
      <div v-if="loading" class="space-y-4">
        <div class="h-8 w-48 animate-pulse rounded-xl bg-stone-100" />
        <div class="h-4 w-72 animate-pulse rounded-lg bg-stone-100" />
        <div v-for="i in 3" :key="i" class="h-28 animate-pulse rounded-2xl bg-stone-100" />
      </div>

      <!-- Error -->
      <div v-else-if="error" class="py-20 text-center">
        <div class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50">
          <UIcon name="i-lucide-alert-triangle" class="h-8 w-8 text-red-400" />
        </div>
        <h2 class="text-lg font-semibold text-stone-900">Campagne introuvable</h2>
        <p class="mt-1 text-sm text-stone-500">{{ error }}</p>
      </div>

      <!-- Success confirmation -->
      <div v-else-if="orderSuccess" class="py-20 text-center">
        <div
          class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50"
        >
          <UIcon name="i-lucide-check-circle" class="h-8 w-8 text-emerald-500" />
        </div>
        <h2 class="text-xl font-bold text-stone-900">Commande envoyee !</h2>
        <p class="mx-auto mt-2 max-w-sm text-sm text-stone-500">
          Votre commande a bien ete enregistree. Vous recevrez un email de confirmation si vous avez
          fourni votre adresse.
        </p>
        <div
          class="mx-auto mt-6 max-w-sm rounded-2xl border border-stone-200/60 bg-white p-5 text-left shadow-sm"
        >
          <h3 class="mb-3 text-sm font-semibold text-stone-900">Recapitulatif</h3>
          <div class="divide-y divide-stone-100">
            <div
              v-for="item in orderSummary"
              :key="item.nom"
              class="flex items-center justify-between py-2"
            >
              <span class="text-sm text-stone-700">{{ item.nom }} x{{ item.qty }}</span>
              <span class="text-sm font-medium text-stone-900"
                >{{ item.total.toFixed(2) }} EUR</span
              >
            </div>
          </div>
          <div class="mt-3 border-t border-stone-200 pt-3 text-right">
            <span class="text-base font-bold text-amber-700"
              >Total: {{ orderTotal.toFixed(2) }} EUR TTC</span
            >
          </div>
        </div>
      </div>

      <!-- Campaign content -->
      <template v-else-if="data">
        <!-- Header -->
        <div class="mb-8 text-center">
          <div
            class="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50"
          >
            <UIcon name="i-lucide-shopping-bag" class="h-6 w-6 text-amber-600" />
          </div>
          <h1 class="text-2xl font-bold tracking-tight text-stone-900">{{ data.nom }}</h1>
          <p v-if="data.description" class="mx-auto mt-2 max-w-md text-sm text-stone-500">
            {{ data.description }}
          </p>
          <p class="mt-2 text-xs text-stone-400">
            Ouvert du {{ formatDate(data.dateOuverture) }} au {{ formatDate(data.dateFermeture) }}
          </p>
        </div>

        <!-- Product catalogue -->
        <div class="mb-8 space-y-3">
          <h2 class="text-sm font-semibold uppercase tracking-wider text-stone-500">Catalogue</h2>
          <div
            v-for="prod in data.produits"
            :key="prod.id"
            class="flex items-center gap-4 rounded-2xl border border-stone-200/60 bg-white p-4 shadow-sm transition-all duration-200"
          >
            <div class="flex-1">
              <p class="text-sm font-semibold text-stone-900">{{ prod.nom }}</p>
              <p v-if="prod.description" class="mt-0.5 text-xs text-stone-500">
                {{ prod.description }}
              </p>
              <p class="mt-1 text-sm font-medium text-amber-700">
                {{ prixTtc(prod).toFixed(2) }} EUR TTC / {{ prod.unite }}
              </p>
              <p v-if="prod.stockDisponible !== null" class="mt-0.5 text-[10px] text-stone-400">
                {{ prod.stockDisponible }} disponible{{ prod.stockDisponible > 1 ? 's' : '' }}
              </p>
            </div>
            <div class="flex items-center gap-2">
              <button
                type="button"
                class="flex h-8 w-8 items-center justify-center rounded-lg border border-stone-200 bg-white text-stone-500 transition-colors hover:bg-stone-50"
                @click="decrementQty(prod.id)"
              >
                <UIcon name="i-lucide-minus" class="h-3.5 w-3.5" />
              </button>
              <span class="w-8 text-center text-sm font-semibold tabular-nums text-stone-900">
                {{ cart[prod.id] ?? 0 }}
              </span>
              <button
                type="button"
                class="flex h-8 w-8 items-center justify-center rounded-lg border border-amber-200 bg-amber-50 text-amber-700 transition-colors hover:bg-amber-100"
                @click="incrementQty(prod.id)"
              >
                <UIcon name="i-lucide-plus" class="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>

        <!-- Cart summary -->
        <div
          v-if="cartTotal > 0"
          class="mb-6 rounded-2xl border border-amber-200/60 bg-amber-50/50 p-4"
        >
          <div class="flex items-center justify-between">
            <span class="text-sm font-medium text-stone-700">
              {{ cartItemsCount }} article{{ cartItemsCount > 1 ? 's' : '' }}
            </span>
            <span class="text-lg font-bold text-amber-800">{{ cartTotal.toFixed(2) }} EUR TTC</span>
          </div>
        </div>

        <!-- Order form -->
        <form
          v-if="cartTotal > 0"
          class="rounded-2xl border border-stone-200/60 bg-white p-6 shadow-sm"
          @submit.prevent="handleOrder"
        >
          <h2 class="mb-4 text-base font-semibold text-stone-900">Vos coordonnees</h2>
          <div class="space-y-4">
            <div>
              <label class="mb-1 block text-sm font-medium text-stone-700">Nom *</label>
              <UInput v-model="orderForm.nom" placeholder="Jean Dupont" required size="lg" />
            </div>
            <div>
              <label class="mb-1 block text-sm font-medium text-stone-700">Email</label>
              <UInput v-model="orderForm.email" type="email" placeholder="jean@mail.fr" size="lg" />
            </div>
            <div>
              <label class="mb-1 block text-sm font-medium text-stone-700">Telephone</label>
              <UInput
                v-model="orderForm.telephone"
                type="tel"
                placeholder="06 12 34 56 78"
                size="lg"
              />
            </div>
          </div>

          <!-- Error -->
          <div
            v-if="orderError"
            class="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            {{ orderError }}
          </div>

          <UButton
            type="submit"
            label="Envoyer ma commande"
            icon="i-lucide-send"
            color="primary"
            size="lg"
            block
            class="mt-6 min-h-[44px]"
            :loading="ordering"
          />
        </form>

        <!-- Empty cart hint -->
        <div v-else class="py-8 text-center text-sm text-stone-400">
          Selectionnez des produits pour passer commande
        </div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'auth' });

const route = useRoute();
const token = route.params.token as string;

interface PublicProduit {
  id: string;
  nom: string;
  description: string | null;
  prixUnitaireHt: string;
  tauxTva: string;
  unite: string;
  stockDisponible: number | null;
  categorie: string | null;
}

interface PublicCampagne {
  nom: string;
  description: string | null;
  dateOuverture: string;
  dateFermeture: string;
  produits: PublicProduit[];
}

const loading = ref(true);
const error = ref('');
const data = ref<PublicCampagne | null>(null);
const cart = ref<Record<string, number>>({});
const ordering = ref(false);
const orderError = ref('');
const orderSuccess = ref(false);

const orderForm = reactive({
  nom: '',
  email: '',
  telephone: '',
});

interface OrderItem {
  nom: string;
  qty: number;
  total: number;
}

const orderSummary = ref<OrderItem[]>([]);
const orderTotal = ref(0);

function prixTtc(prod: PublicProduit): number {
  return Number(prod.prixUnitaireHt) * (1 + Number(prod.tauxTva) / 100);
}

const cartTotal = computed(() => {
  if (!data.value) return 0;
  return data.value.produits.reduce((sum, prod) => {
    const qty = cart.value[prod.id] ?? 0;
    if (qty <= 0) return sum;
    return sum + prixTtc(prod) * qty;
  }, 0);
});

const cartItemsCount = computed(() => {
  return Object.values(cart.value).reduce((sum, qty) => sum + (qty > 0 ? qty : 0), 0);
});

function incrementQty(prodId: string) {
  cart.value[prodId] = (cart.value[prodId] ?? 0) + 1;
}

function decrementQty(prodId: string) {
  const current = cart.value[prodId] ?? 0;
  if (current > 0) {
    cart.value[prodId] = current - 1;
  }
}

async function fetchCampagne() {
  loading.value = true;
  error.value = '';
  try {
    const res = await $fetch<{ data: PublicCampagne }>(`/api/public/campagne/${token}`);
    data.value = res.data;
  } catch (err: unknown) {
    const e = err as { data?: { message?: string }; message?: string };
    error.value = e.data?.message ?? e.message ?? 'Campagne introuvable ou fermee';
  } finally {
    loading.value = false;
  }
}

onMounted(fetchCampagne);

async function handleOrder() {
  if (!orderForm.nom || ordering.value) return;
  ordering.value = true;
  orderError.value = '';

  try {
    const lignes = Object.entries(cart.value)
      .filter(([, qty]) => qty > 0)
      .map(([produitId, quantite]) => ({ produitId, quantite }));

    if (lignes.length === 0) return;

    await $fetch(`/api/public/campagne/${token}/commander`, {
      method: 'POST',
      body: {
        nomInvite: orderForm.nom,
        emailInvite: orderForm.email || undefined,
        telephone: orderForm.telephone || undefined,
        lignes,
      },
    });

    // Build summary
    if (data.value) {
      orderSummary.value = lignes.map((l) => {
        const prod = data.value!.produits.find((p) => p.id === l.produitId);
        return {
          nom: prod?.nom ?? 'Produit',
          qty: l.quantite,
          total: prod ? prixTtc(prod) * l.quantite : 0,
        };
      });
      orderTotal.value = cartTotal.value;
    }

    orderSuccess.value = true;
  } catch (err: unknown) {
    const e = err as { data?: { message?: string }; message?: string };
    orderError.value = e.data?.message ?? e.message ?? "Erreur lors de l'envoi de la commande";
  } finally {
    ordering.value = false;
  }
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}
</script>
