<template>
  <div>
    <!-- Loading -->
    <div v-if="loading" class="space-y-4">
      <div class="h-10 w-64 animate-pulse rounded-xl bg-stone-100" />
      <div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div v-for="i in 3" :key="i" class="h-24 animate-pulse rounded-2xl bg-stone-100" />
      </div>
      <div class="h-64 animate-pulse rounded-2xl bg-stone-100" />
    </div>

    <!-- Error -->
    <div v-else-if="error" class="py-20 text-center">
      <UIcon name="i-lucide-alert-triangle" class="mx-auto mb-3 h-10 w-10 text-red-400" />
      <p class="text-sm text-stone-600">{{ error }}</p>
      <UButton
        label="Retour"
        variant="outline"
        color="neutral"
        to="/association/campagnes"
        class="mt-4"
      />
    </div>

    <!-- Content -->
    <template v-else-if="campagne">
      <!-- Header -->
      <UiPageHeader
        :title="campagne.nom"
        :breadcrumbs="[
          { label: 'Association', to: '/association' },
          { label: 'Campagnes', to: '/association/campagnes' },
          { label: campagne.nom },
        ]"
      >
        <template #actions>
          <span
            class="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold uppercase tracking-wide"
            :class="statutBadgeClass(campagne.statut)"
          >
            {{ campagne.statut }}
          </span>

          <UButton
            v-if="campagne.statut === 'brouillon'"
            label="Ouvrir"
            icon="i-lucide-rocket"
            color="primary"
            :loading="actionLoading"
            @click="handleOuvrir"
          />
          <UButton
            v-if="campagne.statut === 'ouverte'"
            label="Fermer"
            icon="i-lucide-lock"
            variant="outline"
            color="neutral"
            :loading="actionLoading"
            @click="handleFermer"
          />
          <UButton
            v-if="campagne.statut === 'brouillon'"
            label="Supprimer"
            icon="i-lucide-trash-2"
            variant="outline"
            color="error"
            :loading="actionLoading"
            @click="handleDelete"
          />
        </template>
      </UiPageHeader>

      <!-- Public link card (ouverte) -->
      <div
        v-if="campagne.statut === 'ouverte'"
        class="mb-6 flex flex-col items-start gap-3 rounded-2xl border border-amber-200/60 bg-amber-50/50 p-4 sm:flex-row sm:items-center sm:justify-between"
      >
        <div class="flex items-center gap-3">
          <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100">
            <UIcon name="i-lucide-link" class="h-5 w-5 text-amber-600" />
          </div>
          <div>
            <p class="text-sm font-medium text-stone-900">Lien public de commande</p>
            <p class="text-xs text-stone-500">{{ publicUrl }}</p>
          </div>
        </div>
        <UButton
          :label="copied ? 'Copie !' : 'Copier le lien'"
          :icon="copied ? 'i-lucide-check' : 'i-lucide-copy'"
          variant="outline"
          :color="copied ? 'primary' : 'neutral'"
          size="sm"
          @click="copyLink"
        />
      </div>

      <!-- Stats KPI -->
      <div class="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <UiKpiCard icon="i-lucide-shopping-cart" label="Commandes" :value="commandes.length" />
        <UiKpiCard
          icon="i-lucide-euro"
          label="Total HT"
          :value="Number(campagne.totalHt ?? 0)"
          suffix=" EUR"
        />
        <UiKpiCard
          icon="i-lucide-receipt"
          label="Total TTC"
          :value="Number(campagne.totalTtc ?? 0)"
          suffix=" EUR"
        />
      </div>

      <!-- Catalogue section -->
      <div class="mb-8 rounded-2xl border border-stone-200/60 bg-white p-6 shadow-sm">
        <div class="mb-4 flex items-center justify-between">
          <h2 class="flex items-center gap-2 text-base font-semibold text-stone-900">
            <UIcon name="i-lucide-package" class="h-5 w-5 text-amber-500" />
            Catalogue
          </h2>
          <UButton
            v-if="campagne.statut === 'brouillon'"
            label="Ajouter"
            icon="i-lucide-plus"
            variant="outline"
            color="neutral"
            size="xs"
            @click="showAddProduct = true"
          />
        </div>

        <!-- Empty produits -->
        <div
          v-if="!campagne.produits || campagne.produits.length === 0"
          class="py-8 text-center text-sm text-stone-400"
        >
          Aucun produit dans cette campagne
        </div>

        <!-- Products list -->
        <div v-else class="divide-y divide-stone-100">
          <div
            v-for="prod in campagne.produits"
            :key="prod.id"
            class="flex items-center justify-between py-3"
          >
            <div class="flex-1">
              <p class="text-sm font-medium text-stone-900">{{ prod.nom }}</p>
              <div class="mt-0.5 flex items-center gap-3 text-xs text-stone-500">
                <span>{{ prod.prixUnitaireHt.toFixed(2) }} EUR HT / {{ prod.unite }}</span>
                <span>TVA {{ prod.tauxTva }}%</span>
                <span v-if="prod.stockDisponible !== null">
                  Stock: {{ prod.stockDisponible }}
                </span>
                <span
                  v-if="prod.categorie"
                  class="rounded-md bg-stone-100 px-1.5 py-0.5 text-[10px] font-medium text-stone-600"
                >
                  {{ prod.categorie }}
                </span>
              </div>
            </div>
            <div v-if="campagne.statut === 'brouillon'" class="flex items-center gap-1">
              <button
                aria-label="Supprimer ce produit"
                type="button"
                class="rounded-lg p-1.5 text-stone-400 transition-colors hover:bg-red-50 hover:text-red-500"
                @click="handleDeleteProduit(prod.id)"
              >
                <UIcon name="i-lucide-trash-2" class="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Commandes section -->
      <div class="mb-8 rounded-2xl border border-stone-200/60 bg-white p-6 shadow-sm">
        <div class="mb-4 flex items-center justify-between">
          <h2 class="flex items-center gap-2 text-base font-semibold text-stone-900">
            <UIcon name="i-lucide-shopping-cart" class="h-5 w-5 text-amber-500" />
            Commandes
          </h2>
          <div class="flex items-center gap-2">
            <UButton
              v-if="campagne.statut === 'ouverte'"
              label="Saisie papier"
              icon="i-lucide-pen-line"
              variant="outline"
              color="neutral"
              size="xs"
              @click="showSaisie = true"
            />
            <UButton
              label="Exporter XLSX"
              icon="i-lucide-download"
              variant="outline"
              color="neutral"
              size="xs"
              @click="exportXlsx"
            />
          </div>
        </div>

        <!-- Empty commandes -->
        <div v-if="commandes.length === 0" class="py-8 text-center text-sm text-stone-400">
          Aucune commande pour le moment
        </div>

        <!-- Commandes list -->
        <div v-else class="divide-y divide-stone-100">
          <div
            v-for="cmd in commandes"
            :key="cmd.id"
            class="flex items-center justify-between py-3"
          >
            <div class="flex-1">
              <div class="flex items-center gap-2">
                <p class="text-sm font-medium text-stone-900">
                  {{ cmd.nom || 'Anonyme' }}
                </p>
                <span
                  class="inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-semibold uppercase"
                  :class="commandeStatutClass(cmd.statut)"
                >
                  {{ cmd.statut }}
                </span>
                <span
                  v-if="cmd.modePaiement"
                  class="inline-flex items-center rounded-full bg-stone-100 px-1.5 py-0.5 text-[10px] font-medium text-stone-500"
                >
                  {{ cmd.modePaiement }}
                </span>
              </div>
              <div class="mt-0.5 flex items-center gap-3 text-xs text-stone-500">
                <span v-if="cmd.email">{{ cmd.email }}</span>
                <span v-if="cmd.totalTtc">{{ cmd.totalTtc.toFixed(2) }} EUR TTC</span>
                <span>{{ formatDate(cmd.createdAt) }}</span>
              </div>
            </div>
            <div class="flex items-center gap-1">
              <UButton
                v-if="cmd.statut === 'en_attente'"
                label="Valider"
                size="xs"
                color="primary"
                variant="soft"
                @click="handleCommandeStatut(cmd.id, 'validee')"
              />
              <UButton
                v-if="cmd.statut === 'en_attente'"
                label="Annuler"
                size="xs"
                color="error"
                variant="soft"
                @click="handleCommandeStatut(cmd.id, 'annulee')"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- Add Product Modal -->
      <UModal v-model:open="showAddProduct">
        <template #content>
          <div class="p-6">
            <h3 class="mb-4 text-lg font-semibold text-stone-900">Ajouter un produit</h3>
            <div class="space-y-4">
              <div>
                <label class="mb-1 block text-sm font-medium text-stone-700">Nom *</label>
                <UInput v-model="newProduct.nom" placeholder="Miel de lavande 500g" required />
              </div>
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="mb-1 block text-sm font-medium text-stone-700"
                    >Prix HT (EUR) *</label
                  >
                  <input
                    v-model.number="newProduct.prixHt"
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    class="h-9 w-full rounded-lg border border-stone-300 bg-white px-3 text-sm"
                  />
                </div>
                <div>
                  <label class="mb-1 block text-sm font-medium text-stone-700">TVA</label>
                  <select
                    v-model.number="newProduct.tauxTva"
                    class="h-9 w-full rounded-lg border border-stone-300 bg-white px-3 text-sm"
                  >
                    <option :value="5.5">5,5%</option>
                    <option :value="10">10%</option>
                    <option :value="20">20%</option>
                  </select>
                </div>
              </div>
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="mb-1 block text-sm font-medium text-stone-700">Unite *</label>
                  <UInput v-model="newProduct.unite" placeholder="pot" required />
                </div>
                <div>
                  <label class="mb-1 block text-sm font-medium text-stone-700">Stock</label>
                  <input
                    v-model.number="newProduct.stockDisponible"
                    type="number"
                    min="0"
                    placeholder="Illimite"
                    class="h-9 w-full rounded-lg border border-stone-300 bg-white px-3 text-sm"
                  />
                </div>
              </div>
              <div>
                <label class="mb-1 block text-sm font-medium text-stone-700">Categorie</label>
                <UInput v-model="newProduct.categorie" placeholder="Miel, Cire..." />
              </div>
            </div>
            <div class="mt-6 flex justify-end gap-2">
              <UButton
                label="Annuler"
                variant="outline"
                color="neutral"
                @click="showAddProduct = false"
              />
              <UButton
                label="Ajouter"
                color="primary"
                :loading="productSaving"
                @click="handleAddProduct"
              />
            </div>
          </div>
        </template>
      </UModal>

      <!-- Saisie papier Modal -->
      <UModal v-model:open="showSaisie">
        <template #content>
          <div class="max-h-[80vh] overflow-y-auto p-6">
            <h3 class="mb-4 text-lg font-semibold text-stone-900">Saisie papier</h3>
            <div class="space-y-4">
              <div>
                <label class="mb-1 block text-sm font-medium text-stone-700">Nom *</label>
                <UInput v-model="saisieForm.nom" placeholder="Jean Dupont" required />
              </div>
              <div>
                <label class="mb-1 block text-sm font-medium text-stone-700">Email</label>
                <UInput v-model="saisieForm.email" type="email" placeholder="jean@mail.fr" />
              </div>
              <div>
                <label class="mb-1 block text-sm font-medium text-stone-700">Telephone</label>
                <UInput v-model="saisieForm.telephone" type="tel" placeholder="06 12 34 56 78" />
              </div>
              <div>
                <label class="mb-1 block text-sm font-medium text-stone-700"
                  >Mode de paiement</label
                >
                <select
                  v-model="saisieForm.modePaiement"
                  class="h-9 w-full rounded-lg border border-stone-300 bg-white px-3 text-sm"
                >
                  <option value="">Non specifie</option>
                  <option value="especes">Especes</option>
                  <option value="cheque">Cheque</option>
                  <option value="virement">Virement</option>
                  <option value="cb">Carte bancaire</option>
                </select>
              </div>

              <!-- Product lines -->
              <div>
                <label class="mb-2 block text-sm font-medium text-stone-700"
                  >Produits commandes</label
                >
                <div
                  v-for="prod in campagne.produits"
                  :key="prod.id"
                  class="mb-2 flex items-center gap-3 rounded-lg border border-stone-100 bg-stone-50/50 px-3 py-2"
                >
                  <span class="flex-1 text-sm text-stone-700">{{ prod.nom }}</span>
                  <span class="text-xs text-stone-500">
                    {{ (prod.prixUnitaireHt * (1 + prod.tauxTva / 100)).toFixed(2) }} EUR
                  </span>
                  <input
                    v-model.number="saisieForm.lignes[prod.id]"
                    type="number"
                    min="0"
                    placeholder="0"
                    class="h-8 w-16 rounded-lg border border-stone-300 bg-white px-2 text-center text-sm"
                  />
                </div>
              </div>

              <!-- Saisie total -->
              <div
                class="rounded-lg bg-amber-50 px-3 py-2 text-right text-sm font-semibold text-amber-800"
              >
                Total TTC: {{ saisieTotalTtc.toFixed(2) }} EUR
              </div>
            </div>
            <div class="mt-6 flex justify-end gap-2">
              <UButton
                label="Annuler"
                variant="outline"
                color="neutral"
                @click="showSaisie = false"
              />
              <UButton
                label="Enregistrer"
                color="primary"
                :loading="saisieSaving"
                @click="handleSaisie"
              />
            </div>
          </div>
        </template>
      </UModal>
    </template>
  </div>
</template>

<script setup lang="ts">
import type { Campagne, Commande } from '~/composables/useCampagnes';

definePageMeta({ layout: 'default' });

const route = useRoute();
const campagneId = route.params.id as string;

const {
  getCampagne,
  ouvrirCampagne,
  fermerCampagne,
  deleteCampagne,
  addProduit,
  deleteProduit,
  getCommandes,
  updateCommande,
  saisieCommande,
} = useCampagnes();

const loading = ref(true);
const error = ref('');
const actionLoading = ref(false);
const campagne = ref<Campagne | null>(null);
const commandes = ref<Commande[]>([]);

// Product modal
const showAddProduct = ref(false);
const productSaving = ref(false);
const newProduct = reactive({
  nom: '',
  prixHt: null as number | null,
  tauxTva: 5.5,
  unite: 'pot',
  stockDisponible: null as number | null,
  categorie: '',
});

// Saisie modal
const showSaisie = ref(false);
const saisieSaving = ref(false);
const saisieForm = reactive({
  nom: '',
  email: '',
  telephone: '',
  modePaiement: '',
  lignes: {} as Record<string, number>,
});

// Copied state
const copied = ref(false);

const publicUrl = computed(() => {
  if (!campagne.value) return '';
  const base = typeof window !== 'undefined' ? window.location.origin : '';
  return `${base}/public/campagne/${campagne.value.tokenPublic}`;
});

const saisieTotalTtc = computed(() => {
  if (!campagne.value?.produits) return 0;
  return campagne.value.produits.reduce((sum, prod) => {
    const qty = saisieForm.lignes[prod.id] ?? 0;
    if (qty <= 0) return sum;
    const prixTtc = prod.prixUnitaireHt * (1 + prod.tauxTva / 100);
    return sum + prixTtc * qty;
  }, 0);
});

async function fetchData() {
  loading.value = true;
  error.value = '';
  try {
    campagne.value = await getCampagne(campagneId);
    try {
      commandes.value = await getCommandes(campagneId);
    } catch {
      commandes.value = [];
    }
  } catch (err: unknown) {
    const e = err as { data?: { message?: string }; message?: string };
    error.value = e.data?.message ?? e.message ?? 'Campagne introuvable';
  } finally {
    loading.value = false;
  }
}

onMounted(fetchData);

async function handleOuvrir() {
  actionLoading.value = true;
  try {
    await ouvrirCampagne(campagneId);
    await fetchData();
  } catch {
    // Error handled silently
  } finally {
    actionLoading.value = false;
  }
}

async function handleFermer() {
  actionLoading.value = true;
  try {
    await fermerCampagne(campagneId);
    await fetchData();
  } catch {
    // Error handled silently
  } finally {
    actionLoading.value = false;
  }
}

async function handleDelete() {
  if (!confirm('Supprimer cette campagne ? Cette action est irreversible.')) return;
  actionLoading.value = true;
  try {
    await deleteCampagne(campagneId);
    navigateTo('/association/campagnes');
  } catch {
    // Error handled silently
  } finally {
    actionLoading.value = false;
  }
}

async function handleDeleteProduit(prodId: string) {
  try {
    await deleteProduit(campagneId, prodId);
    await fetchData();
  } catch {
    // Error handled silently
  }
}

async function handleAddProduct() {
  if (!newProduct.nom || newProduct.prixHt === null) return;
  productSaving.value = true;
  try {
    await addProduit(campagneId, {
      nom: newProduct.nom,
      prixUnitaireHt: newProduct.prixHt,
      tauxTva: newProduct.tauxTva,
      unite: newProduct.unite,
      stockDisponible: newProduct.stockDisponible ?? undefined,
      categorie: newProduct.categorie || undefined,
    });
    showAddProduct.value = false;
    newProduct.nom = '';
    newProduct.prixHt = null;
    newProduct.tauxTva = 5.5;
    newProduct.unite = 'pot';
    newProduct.stockDisponible = null;
    newProduct.categorie = '';
    await fetchData();
  } catch {
    // Error handled silently
  } finally {
    productSaving.value = false;
  }
}

async function handleCommandeStatut(cmdId: string, statut: string) {
  try {
    await updateCommande(campagneId, cmdId, { statut });
    await fetchData();
  } catch {
    // Error handled silently
  }
}

async function handleSaisie() {
  if (!saisieForm.nom) return;
  saisieSaving.value = true;
  try {
    const lignes = Object.entries(saisieForm.lignes)
      .filter(([, qty]) => qty > 0)
      .map(([produitId, quantite]) => ({ produitId, quantite }));

    if (lignes.length === 0) return;

    await saisieCommande(campagneId, {
      nom: saisieForm.nom,
      email: saisieForm.email || undefined,
      telephone: saisieForm.telephone || undefined,
      modePaiement: saisieForm.modePaiement || undefined,
      lignes,
    });
    showSaisie.value = false;
    saisieForm.nom = '';
    saisieForm.email = '';
    saisieForm.telephone = '';
    saisieForm.modePaiement = '';
    saisieForm.lignes = {};
    await fetchData();
  } catch {
    // Error handled silently
  } finally {
    saisieSaving.value = false;
  }
}

function copyLink() {
  navigator.clipboard.writeText(publicUrl.value);
  copied.value = true;
  setTimeout(() => {
    copied.value = false;
  }, 2000);
}

function exportXlsx() {
  window.open(`/api/campagnes/${campagneId}/export`, '_blank');
}

function statutBadgeClass(statut: string): string {
  switch (statut) {
    case 'brouillon':
      return 'bg-stone-100 text-stone-600';
    case 'ouverte':
      return 'bg-amber-50 text-amber-700';
    case 'fermee':
      return 'bg-amber-50 text-amber-700';
    case 'terminee':
      return 'bg-blue-50 text-blue-700';
    default:
      return 'bg-stone-100 text-stone-600';
  }
}

function commandeStatutClass(statut: string): string {
  switch (statut) {
    case 'en_attente':
      return 'bg-amber-50 text-amber-700';
    case 'validee':
      return 'bg-amber-50 text-amber-700';
    case 'annulee':
      return 'bg-red-50 text-red-700';
    case 'livree':
      return 'bg-blue-50 text-blue-700';
    default:
      return 'bg-stone-100 text-stone-600';
  }
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}
</script>
