<template>
  <form class="space-y-5" @submit.prevent="$emit('submit')">
    <!-- Client -->
    <div>
      <label class="mb-1.5 block text-[13px] font-semibold text-[var(--text-primary)]"
        >Client</label
      >
      <div class="relative">
        <select
          :value="modelValue.clientId"
          class="h-11 w-full appearance-none rounded-[10px] border border-[var(--border-default)] bg-white px-4 pr-9 text-[15px] text-[var(--text-primary)] outline-none transition-all focus:border-[var(--honey)] focus:ring-2 focus:ring-[var(--honey)]/15"
          @change="onClientChange(($event.target as HTMLSelectElement).value)"
        >
          <option value="">Sans client</option>
          <option v-for="c in clients" :key="c.id" :value="c.id">
            {{ clientDisplayName(c) }}{{ clientTypeSuffix(c) }}
          </option>
        </select>
        <UIcon
          name="i-lucide-chevron-down"
          class="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-tertiary)]"
        />
      </div>
    </div>

    <!-- Date création + Date livraison -->
    <div class="grid grid-cols-2 gap-3">
      <div>
        <label class="mb-1.5 block text-[13px] font-semibold text-[var(--text-primary)]"
          >Date de création <span class="text-[var(--status-bad)]">*</span></label
        >
        <UiMobileDatePicker
          :model-value="modelValue.dateCreation ?? null"
          mode="date"
          @update:model-value="update('dateCreation', $event ?? '')"
        />
      </div>
      <div>
        <label class="mb-1.5 block text-[13px] font-semibold text-[var(--text-primary)]"
          >Date de livraison</label
        >
        <UiMobileDatePicker
          :model-value="modelValue.dateLivraison ?? null"
          mode="date"
          @update:model-value="update('dateLivraison', $event ?? undefined)"
        />
      </div>
    </div>

    <!-- Stock miel picker -->
    <div
      v-if="mielStocks.length > 0"
      class="rounded-[12px] border border-[var(--honey)]/30 bg-[var(--honey-soft)] p-4"
    >
      <div class="mb-3 flex items-center gap-2">
        <div class="flex h-8 w-8 items-center justify-center rounded-[8px] bg-[var(--honey)]">
          <span class="text-sm">🍯</span>
        </div>
        <div>
          <p class="text-[13px] font-semibold text-[var(--honey-deep)]">Stocks miel disponibles</p>
          <p class="text-[11px] text-[var(--honey-deep)]/70">
            {{ mielStocks.length }} variété(s) en stock
          </p>
        </div>
      </div>
      <div class="grid grid-cols-2 gap-2 sm:grid-cols-3">
        <button
          v-for="stock in mielStocks"
          :key="stock.id"
          type="button"
          class="flex flex-col items-start gap-1 rounded-[10px] border border-[var(--honey)]/20 bg-white p-3 text-left transition-all hover:border-[var(--honey)]/60 hover:shadow-sm"
          @click="addStockLine(stock)"
        >
          <span class="text-[13px] font-semibold text-[var(--honey-deep)] leading-tight">{{
            varietelabel(stock.typeMiel!)
          }}</span>
          <div class="flex flex-wrap gap-1">
            <span
              v-if="stock.anneeRecolte"
              class="rounded-full bg-[var(--honey-soft)] border border-[var(--honey)]/20 px-1.5 py-0.5 text-[10px] text-[var(--honey-deep)]"
              >{{ stock.anneeRecolte }}</span
            >
            <span
              v-if="stock.numLot"
              class="rounded-full bg-[var(--surface-muted)] px-1.5 py-0.5 text-[10px] text-[var(--text-tertiary)]"
              >{{ stock.numLot }}</span
            >
          </div>
          <div class="flex w-full items-center justify-between">
            <span class="text-[11px] text-[var(--text-tertiary)]"
              >{{ Number(stock.quantite) }} {{ stock.unite ?? 'kg' }}</span
            >
            <span v-if="stock.prixUnitaire" class="text-[10px] font-bold text-[var(--honey-deep)]"
              >{{ Number(stock.prixUnitaire).toFixed(2) }} €/{{ stock.unite ?? 'kg' }}</span
            >
          </div>
        </button>
      </div>
    </div>

    <!-- Autres stocks -->
    <div
      v-if="otherStocks.length > 0"
      class="rounded-[12px] border border-[var(--border-default)] bg-[var(--surface-muted)] p-3"
    >
      <p class="mb-2 text-[11px] font-semibold uppercase tracking-wide text-[var(--text-tertiary)]">
        Autres produits
      </p>
      <div class="grid grid-cols-2 gap-2 sm:grid-cols-3">
        <button
          v-for="stock in otherStocks"
          :key="stock.id"
          type="button"
          class="flex items-center justify-between rounded-[8px] border border-[var(--border-default)] bg-white px-3 py-2 text-left text-[12px] transition-all hover:border-[var(--honey)]/40 hover:bg-[var(--honey-soft)]"
          @click="addStockLine(stock)"
        >
          <span class="font-medium text-[var(--text-primary)] truncate">{{ stock.nom }}</span>
          <span class="ml-2 shrink-0 text-[var(--text-tertiary)]"
            >{{ Number(stock.quantite) }} {{ stock.unite ?? 'u' }}</span
          >
        </button>
      </div>
    </div>

    <!-- Rien à piocher : on le DIT, plutôt que de laisser les deux blocs
         ci-dessus disparaître en silence. Sans ce mot, un apiculteur dont le
         stock vient de tomber à zéro croit à une panne du bon de livraison. -->
    <div
      v-if="stocksCharges && mielStocks.length === 0 && otherStocks.length === 0"
      class="rounded-[12px] border border-dashed border-[var(--border-default)] bg-[var(--surface-muted)] p-4"
    >
      <div class="flex items-start gap-3">
        <div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-[8px] bg-white">
          <UIcon name="i-lucide-warehouse" class="h-4 w-4 text-[var(--text-tertiary)]" />
        </div>
        <div class="min-w-0 flex-1">
          <p class="text-[13px] font-semibold text-[var(--text-primary)]">
            Livrer depuis vos stocks
          </p>
          <p class="mt-0.5 text-[12px] leading-relaxed text-[var(--text-secondary)]">
            {{ messageStockVide }}
          </p>
        </div>
        <UButton
          to="/stocks"
          label="Mes stocks"
          color="neutral"
          variant="ghost"
          size="xs"
          class="shrink-0"
        />
      </div>
    </div>

    <!-- Lignes du BL -->
    <div>
      <div class="mb-2 flex items-center justify-between">
        <label class="text-[13px] font-semibold text-[var(--text-primary)]"
          >Lignes <span class="text-[var(--status-bad)]">*</span></label
        >
        <button
          type="button"
          class="flex items-center gap-1 rounded-[8px] border border-[var(--border-default)] bg-white px-2.5 py-1 text-[12px] font-medium text-[var(--text-secondary)] hover:bg-[var(--surface-muted)]"
          @click="addEmptyLine"
        >
          <UIcon name="i-lucide-plus" class="h-3.5 w-3.5" />
          Ligne libre
        </button>
      </div>

      <div class="space-y-2">
        <div
          v-for="(ligne, index) in modelValue.lignes"
          :key="index"
          class="rounded-[10px] border border-[var(--border-default)] bg-white p-3"
        >
          <!-- Traceability badges -->
          <div v-if="ligne.typeMiel" class="mb-2 flex flex-wrap gap-1">
            <span
              class="rounded-full bg-[var(--honey-soft)] px-2 py-0.5 text-[10px] font-semibold text-[var(--honey-deep)]"
              >🍯 {{ varietelabel(ligne.typeMiel) }}</span
            >
            <span
              v-if="ligne.anneeRecolte"
              class="rounded-full bg-[var(--honey-soft)] px-2 py-0.5 text-[10px] text-[var(--honey-deep)]"
              >{{ ligne.anneeRecolte }}</span
            >
            <span
              v-if="ligne.numLot"
              class="rounded-full bg-[var(--surface-muted)] border border-[var(--border-default)] px-2 py-0.5 text-[10px] text-[var(--text-tertiary)]"
              >{{ ligne.numLot }}</span
            >
            <span v-if="ligne.origineGeo" class="text-[10px] text-[var(--text-tertiary)]"
              ><UIcon name="i-lucide-map-pin" class="inline h-2.5 w-2.5" />
              {{ ligne.origineGeo }}</span
            >
          </div>

          <div class="grid grid-cols-12 items-end gap-2">
            <div class="col-span-5">
              <label v-if="index === 0" class="mb-1 block text-[11px] text-[var(--text-tertiary)]"
                >Description</label
              >
              <input
                :value="ligne.description"
                type="text"
                required
                placeholder="Ex : Miel d'Acacia 500g"
                class="h-9 w-full rounded-[8px] border border-[var(--border-default)] bg-[var(--surface-muted)] px-3 text-[13px] text-[var(--text-primary)] outline-none focus:border-[var(--honey)] focus:ring-2 focus:ring-[var(--honey)]/15"
                @input="
                  updateLigne(index, 'description', ($event.target as HTMLInputElement).value)
                "
              />
            </div>
            <div class="col-span-2">
              <label v-if="index === 0" class="mb-1 block text-[11px] text-[var(--text-tertiary)]"
                >Qté</label
              >
              <input
                :value="ligne.quantite"
                type="number"
                min="0.01"
                step="0.01"
                required
                :max="ligne.stockQuantite ?? undefined"
                class="h-9 w-full rounded-[8px] border border-[var(--border-default)] bg-[var(--surface-muted)] px-3 text-[13px] text-[var(--text-primary)] outline-none focus:border-[var(--honey)] focus:ring-2 focus:ring-[var(--honey)]/15"
                @input="
                  updateLigne(index, 'quantite', Number(($event.target as HTMLInputElement).value))
                "
              />
              <p
                v-if="ligne.stockQuantite"
                class="mt-0.5 text-[10px] text-[var(--text-quaternary)]"
              >
                max {{ ligne.stockQuantite }}
              </p>
            </div>
            <div class="col-span-2">
              <label v-if="index === 0" class="mb-1 block text-[11px] text-[var(--text-tertiary)]"
                >PU HT (€)</label
              >
              <input
                :value="ligne.prixUnitaire ?? ''"
                type="number"
                min="0"
                step="0.01"
                placeholder="—"
                class="h-9 w-full rounded-[8px] border border-[var(--border-default)] bg-[var(--surface-muted)] px-3 text-[13px] text-[var(--text-primary)] outline-none focus:border-[var(--honey)] focus:ring-2 focus:ring-[var(--honey)]/15"
                @input="
                  updateLigne(
                    index,
                    'prixUnitaire',
                    ($event.target as HTMLInputElement).value
                      ? Number(($event.target as HTMLInputElement).value)
                      : undefined,
                  )
                "
              />
            </div>
            <div class="col-span-2 text-right">
              <label v-if="index === 0" class="mb-1 block text-[11px] text-[var(--text-tertiary)]"
                >Total HT</label
              >
              <p class="py-1.5 text-[13px] font-semibold text-[var(--text-primary)]">
                {{
                  ligne.prixUnitaire != null
                    ? formatMoney(ligne.quantite * ligne.prixUnitaire)
                    : '—'
                }}
              </p>
            </div>
            <div class="col-span-1 flex justify-end">
              <button
                v-if="modelValue.lignes.length > 1"
                type="button"
                class="flex h-9 w-9 items-center justify-center rounded-[8px] text-[var(--text-tertiary)] hover:bg-red-50 hover:text-red-500"
                @click="removeLine(index)"
              >
                <UIcon name="i-lucide-x" class="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Totaux (si prix renseignés) -->
    <div
      v-if="sousTotal > 0"
      class="ml-auto w-64 space-y-1 rounded-[12px] border border-[var(--border-default)] bg-[var(--surface-muted)] p-3"
    >
      <div class="flex justify-between text-[12px] text-[var(--text-secondary)]">
        <span>Sous-total HT</span>
        <span class="font-medium">{{ formatMoney(sousTotal) }}</span>
      </div>
      <div
        class="flex justify-between border-t border-[var(--border-default)] pt-1.5 text-[14px] font-semibold text-[var(--text-primary)]"
      >
        <span>Total HT</span>
        <span>{{ formatMoney(sousTotal) }}</span>
      </div>
      <p class="text-[10px] text-[var(--text-tertiary)]">Les prix sont indicatifs sur un BL</p>
    </div>

    <!-- Adresse de livraison -->
    <div>
      <button
        type="button"
        class="flex items-center gap-1.5 text-[12px] font-medium text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"
        @click="showAdresse = !showAdresse"
      >
        <UIcon
          :name="showAdresse ? 'i-lucide-chevron-down' : 'i-lucide-chevron-right'"
          class="h-3.5 w-3.5"
        />
        Adresse de livraison spécifique
      </button>
      <div v-if="showAdresse" class="mt-3 space-y-2">
        <input
          :value="modelValue.adresseLivraison"
          type="text"
          placeholder="Adresse"
          class="h-10 w-full rounded-[8px] border border-[var(--border-default)] bg-white px-3 text-[13px] text-[var(--text-primary)] outline-none focus:border-[var(--honey)] focus:ring-1 focus:ring-[var(--honey)]/15"
          @input="update('adresseLivraison', ($event.target as HTMLInputElement).value)"
        />
        <div class="grid grid-cols-3 gap-2">
          <input
            :value="modelValue.codePostalLivraison"
            type="text"
            placeholder="Code postal"
            class="h-10 rounded-[8px] border border-[var(--border-default)] bg-white px-3 text-[13px] text-[var(--text-primary)] outline-none focus:border-[var(--honey)] focus:ring-1 focus:ring-[var(--honey)]/15"
            @input="update('codePostalLivraison', ($event.target as HTMLInputElement).value)"
          />
          <input
            :value="modelValue.villeLivraison"
            type="text"
            placeholder="Ville"
            class="col-span-2 h-10 rounded-[8px] border border-[var(--border-default)] bg-white px-3 text-[13px] text-[var(--text-primary)] outline-none focus:border-[var(--honey)] focus:ring-1 focus:ring-[var(--honey)]/15"
            @input="update('villeLivraison', ($event.target as HTMLInputElement).value)"
          />
        </div>
      </div>
    </div>

    <!-- Notes -->
    <div>
      <label class="mb-1.5 block text-[13px] font-semibold text-[var(--text-primary)]">Notes</label>
      <textarea
        :value="modelValue.notes"
        :rows="2"
        class="w-full resize-none rounded-[10px] border border-[var(--border-default)] bg-white px-4 py-2.5 text-[13px] text-[var(--text-primary)] outline-none transition-all focus:border-[var(--honey)] focus:ring-2 focus:ring-[var(--honey)]/15"
        placeholder="Notes optionnelles…"
        @input="update('notes', ($event.target as HTMLTextAreaElement).value)"
      />
    </div>
  </form>
</template>

<script setup lang="ts">
import type { Client, Stock } from '~/types/models';
import { TYPES_MIEL, TVA_PAR_CATEGORIE_VENTE } from '~/types/enums';
import type { CategorieVente } from '~/types/enums';

interface LigneBL {
  description: string;
  quantite: number;
  prixUnitaire?: number;
  tauxTva: number;
  stockId?: string;
  stockQuantite?: number;
  typeMiel?: string;
  presentation?: string;
  numLot?: string;
  origineGeo?: string;
  anneeRecolte?: number;
}

export interface BLFormData {
  clientId?: string;
  dateCreation: string;
  dateLivraison?: string;
  lignes: LigneBL[];
  notes?: string;
  adresseLivraison?: string;
  codePostalLivraison?: string;
  villeLivraison?: string;
}

const props = withDefaults(
  defineProps<{
    modelValue: BLFormData;
    clients: Client[];
    stocks?: Stock[];
    /**
     * La liste des stocks est-elle ARRIVÉE ? Le parent envoie `[]` pendant le
     * chargement, indiscernable d'un stock réellement vide : sans cette
     * information, « aucun produit en stock » s'affiche une fraction de seconde
     * avant que les produits apparaissent.
     */
    stocksCharges?: boolean;
  }>(),
  { stocks: undefined, stocksCharges: true },
);

const emit = defineEmits<{
  'update:modelValue': [value: BLFormData];
  submit: [];
}>();

const showAdresse = ref(false);

const mielStocks = computed(() =>
  (props.stocks ?? []).filter((s) => s.typeMiel && Number(s.quantite) > 0),
);

const otherStocks = computed(() =>
  (props.stocks ?? []).filter((s) => !s.typeMiel && Number(s.quantite) > 0),
);

/**
 * « Pas encore de stock » et « stocks épuisés » n'appellent pas le même geste :
 * le premier une création, le second un réapprovisionnement. Les confondre
 * envoie l'apiculteur créer un doublon du produit qu'il possède déjà.
 */
const messageStockVide = computed(() =>
  (props.stocks ?? []).length === 0
    ? 'Aucun produit en stock pour l’instant. Dès qu’il y en aura, ils s’ajouteront ici en un clic, avec leur lot et leur traçabilité. En attendant, saisissez une ligne libre.'
    : 'Vos produits sont tous à zéro. Réapprovisionnez-les pour les livrer en un clic ; en attendant, saisissez une ligne libre.',
);

const sousTotal = computed(() =>
  props.modelValue.lignes.reduce((sum, l) => sum + l.quantite * (l.prixUnitaire ?? 0), 0),
);

function varietelabel(typeMiel: string) {
  return TYPES_MIEL.find((t) => t.value === typeMiel)?.label ?? typeMiel;
}

function clientDisplayName(c: Client) {
  return c.entreprise || `${c.nom} ${c.prenom ?? ''}`.trim();
}

function clientTypeSuffix(c: Client) {
  if (c.type === 'revendeur') return ' (Revendeur)';
  if (c.type === 'professionnel') return ' (Pro)';
  return '';
}

function onClientChange(clientId: string) {
  const client = (props.clients ?? []).find((c) => c.id === clientId);
  const updates: Partial<BLFormData> = { clientId: clientId || undefined };
  if (client?.adresseLivraison) {
    updates.adresseLivraison = client.adresseLivraison;
    updates.codePostalLivraison = client.codePostalLivraison ?? undefined;
    updates.villeLivraison = client.villeLivraison ?? undefined;
    showAdresse.value = true;
  }
  emit('update:modelValue', { ...props.modelValue, ...updates });
}

function update(key: keyof BLFormData, value: unknown) {
  emit('update:modelValue', { ...props.modelValue, [key]: value });
}

function updateLigne(index: number, key: keyof LigneBL, value: string | number | undefined) {
  const lignes: LigneBL[] = props.modelValue.lignes.map((l) => ({ ...l }));
  const ligne = lignes[index];
  if (!ligne) return;
  (ligne as unknown as Record<string, unknown>)[key] = value;
  emit('update:modelValue', { ...props.modelValue, lignes });
}

function addEmptyLine() {
  const lignes = [...props.modelValue.lignes, { description: '', quantite: 1, tauxTva: 5.5 }];
  emit('update:modelValue', { ...props.modelValue, lignes });
}

function addStockLine(stock: Stock) {
  const tauxTva =
    stock.tauxTva !== null && stock.tauxTva !== undefined
      ? Number(stock.tauxTva)
      : stock.categorieVente
        ? (TVA_PAR_CATEGORIE_VENTE[stock.categorieVente as CategorieVente] ?? 5.5)
        : 5.5;

  const ligne: LigneBL = {
    description: stock.nom,
    quantite: 1,
    prixUnitaire: stock.prixUnitaire ? Number(stock.prixUnitaire) : undefined,
    tauxTva,
    stockId: stock.id,
    stockQuantite: Number(stock.quantite),
    typeMiel: stock.typeMiel ?? undefined,
    presentation: stock.presentation ?? undefined,
    numLot: stock.numLot ?? undefined,
    origineGeo: stock.origineGeo ?? undefined,
    anneeRecolte: stock.anneeRecolte ?? undefined,
  };

  const lignes = [...props.modelValue.lignes];
  const emptyIdx = lignes.findIndex((l) => !l.description);
  if (emptyIdx >= 0) {
    lignes[emptyIdx] = ligne;
  } else {
    lignes.push(ligne);
  }
  emit('update:modelValue', { ...props.modelValue, lignes });
}

function removeLine(index: number) {
  const lignes = props.modelValue.lignes.filter((_, i) => i !== index);
  emit('update:modelValue', { ...props.modelValue, lignes });
}

function formatMoney(amount: number) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(amount);
}
</script>
