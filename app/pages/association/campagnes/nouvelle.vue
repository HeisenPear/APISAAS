<template>
  <div>
    <UiPageHeader
      title="Nouvelle campagne"
      description="Créez une campagne et ajoutez vos produits"
      :breadcrumbs="[
        { label: 'Association', to: '/association' },
        { label: 'Campagnes', to: '/association/campagnes' },
        { label: 'Nouvelle' },
      ]"
    />

    <form class="max-w-3xl space-y-8" @submit.prevent="handleSubmit">
      <!-- Section 1: Informations -->
      <div class="rounded-2xl border border-stone-200/60 bg-white p-6 shadow-sm">
        <h2 class="mb-4 flex items-center gap-2 text-base font-semibold text-stone-900">
          <UIcon name="i-lucide-info" class="h-5 w-5 text-amber-500" />
          Informations de la campagne
        </h2>

        <div class="space-y-5">
          <!-- Nom -->
          <div>
            <label class="mb-1.5 block text-sm font-medium text-stone-700">
              Nom de la campagne *
            </label>
            <UInput
              v-model="form.nom"
              placeholder="Ex: Commande groupee printemps 2026"
              required
              size="lg"
            />
          </div>

          <!-- Description -->
          <div>
            <label class="mb-1.5 block text-sm font-medium text-stone-700"> Description </label>
            <UTextarea
              v-model="form.description"
              placeholder="Decrivez la campagne, les conditions..."
              :rows="3"
            />
          </div>

          <!-- Dates -->
          <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label class="mb-1.5 block text-sm font-medium text-stone-700">
                Date d'ouverture *
              </label>
              <UiMobileDatePicker v-model="form.dateOuverture" mode="date" />
            </div>
            <div>
              <label class="mb-1.5 block text-sm font-medium text-stone-700">
                Date de fermeture *
              </label>
              <UiMobileDatePicker v-model="form.dateFermeture" mode="date" />
            </div>
          </div>

          <!-- Notes -->
          <div>
            <label class="mb-1.5 block text-sm font-medium text-stone-700"> Notes internes </label>
            <UTextarea
              v-model="form.notes"
              placeholder="Notes visibles uniquement par les administrateurs..."
              :rows="2"
            />
          </div>
        </div>
      </div>

      <!-- Section 2: Produits -->
      <div class="rounded-2xl border border-stone-200/60 bg-white p-6 shadow-sm">
        <h2 class="mb-4 flex items-center gap-2 text-base font-semibold text-stone-900">
          <UIcon name="i-lucide-package" class="h-5 w-5 text-amber-500" />
          Catalogue produits
        </h2>

        <!-- Empty produits -->
        <div
          v-if="produits.length === 0"
          class="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-stone-200 px-6 py-10 text-center"
        >
          <UIcon name="i-lucide-package-plus" class="mb-2 h-8 w-8 text-stone-300" />
          <p class="text-sm text-stone-500">Aucun produit pour le moment</p>
          <UButton
            label="Ajouter un produit"
            icon="i-lucide-plus"
            variant="outline"
            color="neutral"
            class="mt-3"
            @click="addProduct"
          />
        </div>

        <!-- Product rows -->
        <div v-else class="space-y-4">
          <div
            v-for="(prod, idx) in produits"
            :key="idx"
            class="rounded-xl border border-stone-200/60 bg-stone-50/50 p-4"
          >
            <div class="mb-3 flex items-center justify-between">
              <span class="text-xs font-medium text-stone-500">Produit {{ idx + 1 }}</span>
              <button
                type="button"
                class="rounded-lg p-1 text-stone-400 transition-colors hover:bg-red-50 hover:text-red-500"
                @click="removeProduct(idx)"
              >
                <UIcon name="i-lucide-trash-2" class="h-4 w-4" />
              </button>
            </div>

            <div class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <!-- Nom -->
              <div class="sm:col-span-2 lg:col-span-1">
                <label class="mb-1 block text-xs font-medium text-stone-600">Nom *</label>
                <UInput v-model="prod.nom" placeholder="Miel de lavande 500g" required size="sm" />
              </div>

              <!-- Prix HT -->
              <div>
                <label class="mb-1 block text-xs font-medium text-stone-600">Prix HT (EUR) *</label>
                <input
                  v-model.number="prod.prixHt"
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  placeholder="8.50"
                  class="h-8 w-full rounded-lg border border-stone-300 bg-white px-3 text-sm text-stone-900 transition-colors focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400/50"
                />
              </div>

              <!-- TVA -->
              <div>
                <label class="mb-1 block text-xs font-medium text-stone-600">TVA (%)</label>
                <select
                  v-model.number="prod.tauxTva"
                  class="h-8 w-full rounded-lg border border-stone-300 bg-white px-3 text-sm text-stone-900 transition-colors focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400/50"
                >
                  <option :value="5.5">5,5%</option>
                  <option :value="10">10%</option>
                  <option :value="20">20%</option>
                </select>
              </div>

              <!-- Unite -->
              <div>
                <label class="mb-1 block text-xs font-medium text-stone-600">Unite *</label>
                <UInput v-model="prod.unite" placeholder="pot, kg, L..." required size="sm" />
              </div>

              <!-- Stock -->
              <div>
                <label class="mb-1 block text-xs font-medium text-stone-600"
                  >Stock disponible</label
                >
                <input
                  v-model.number="prod.stockDisponible"
                  type="number"
                  min="0"
                  placeholder="Illimite"
                  class="h-8 w-full rounded-lg border border-stone-300 bg-white px-3 text-sm text-stone-900 transition-colors focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400/50"
                />
              </div>

              <!-- Categorie -->
              <div>
                <label class="mb-1 block text-xs font-medium text-stone-600">Categorie</label>
                <UInput v-model="prod.categorie" placeholder="Miel, Cire, Materiel..." size="sm" />
              </div>
            </div>
          </div>

          <UButton
            label="Ajouter un produit"
            icon="i-lucide-plus"
            variant="outline"
            color="neutral"
            @click="addProduct"
          />
        </div>
      </div>

      <!-- Error -->
      <div
        v-if="errorMsg"
        class="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
      >
        {{ errorMsg }}
      </div>

      <!-- Actions -->
      <div class="flex items-center gap-3">
        <UButton
          type="submit"
          label="Créer la campagne"
          icon="i-lucide-check"
          color="primary"
          size="lg"
          :loading="saving"
          class="min-h-[44px]"
        />
        <UButton
          label="Annuler"
          variant="outline"
          color="neutral"
          to="/association/campagnes"
          class="min-h-[44px]"
        />
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'default' });

const { createCampagne, addProduit } = useCampagnes();

const saving = ref(false);
const errorMsg = ref('');

const form = reactive({
  nom: '',
  description: '',
  dateOuverture: '',
  dateFermeture: '',
  notes: '',
});

interface ProduitRow {
  nom: string;
  prixHt: number | null;
  tauxTva: number;
  unite: string;
  stockDisponible: number | null;
  categorie: string;
}

const produits = ref<ProduitRow[]>([]);

function addProduct() {
  produits.value.push({
    nom: '',
    prixHt: null,
    tauxTva: 5.5,
    unite: 'pot',
    stockDisponible: null,
    categorie: '',
  });
}

function removeProduct(idx: number) {
  produits.value.splice(idx, 1);
}

async function handleSubmit() {
  saving.value = true;
  errorMsg.value = '';

  try {
    // Validate dates
    if (form.dateFermeture <= form.dateOuverture) {
      errorMsg.value = "La date de fermeture doit etre posterieure a la date d'ouverture";
      saving.value = false;
      return;
    }

    // Create campaign
    const campagne = await createCampagne({
      nom: form.nom,
      description: form.description || undefined,
      dateOuverture: form.dateOuverture,
      dateFermeture: form.dateFermeture,
      notes: form.notes || undefined,
    });

    // Add products
    for (const p of produits.value) {
      if (p && p.nom && p.prixHt !== null) {
        await addProduit(campagne.id, {
          nom: p.nom,
          prixUnitaireHt: p.prixHt,
          tauxTva: p.tauxTva,
          unite: p.unite,
          stockDisponible: p.stockDisponible ?? undefined,
          categorie: p.categorie || undefined,
        });
      }
    }

    navigateTo(`/association/campagnes/${campagne.id}`);
  } catch (err: unknown) {
    const error = err as { data?: { message?: string }; message?: string };
    errorMsg.value = error.data?.message ?? error.message ?? 'Une erreur est survenue';
  } finally {
    saving.value = false;
  }
}
</script>
