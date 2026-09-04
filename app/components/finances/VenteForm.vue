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
          @change="update('clientId', ($event.target as HTMLSelectElement).value || undefined)"
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

    <!-- Date + Échéance -->
    <div class="grid grid-cols-2 gap-3">
      <div>
        <label class="mb-1.5 block text-[13px] font-semibold text-[var(--text-primary)]"
          >Date <span class="text-[var(--status-bad)]">*</span></label
        >
        <UiMobileDatePicker
          :model-value="modelValue.dateTransaction ?? null"
          mode="date"
          @update:model-value="update('dateTransaction', $event ?? '')"
        />
      </div>
      <div>
        <label class="mb-1.5 block text-[13px] font-semibold text-[var(--text-primary)]"
          >Échéance</label
        >
        <UiMobileDatePicker
          :model-value="modelValue.dateEcheance ?? null"
          mode="date"
          @update:model-value="update('dateEcheance', $event ?? undefined)"
        />
      </div>
    </div>

    <!-- Stock picker -->
    <div
      v-if="availableStocks.length > 0"
      class="rounded-[12px] border border-[var(--honey)]/30 bg-[var(--honey-soft)] p-4"
    >
      <div class="mb-3 flex items-center gap-2">
        <div class="flex h-8 w-8 items-center justify-center rounded-[8px] bg-[var(--honey)]">
          <UIcon name="i-lucide-warehouse" class="h-4 w-4 text-white" />
        </div>
        <div>
          <p class="text-[13px] font-semibold text-[var(--honey-deep)]">Vendre depuis vos stocks</p>
          <p class="text-[11px] text-[var(--honey-deep)]/70">
            {{ availableStocks.length }} produit(s) disponible(s)
          </p>
        </div>
      </div>
      <!-- Honey stocks en premier -->
      <div class="grid grid-cols-2 gap-2 sm:grid-cols-3">
        <button
          v-for="stock in availableStocks"
          :key="stock.id"
          type="button"
          class="flex flex-col items-start gap-1 rounded-[10px] border border-[var(--honey)]/20 bg-white p-3 text-left transition-all hover:border-[var(--honey)]/60 hover:shadow-sm"
          @click="addStockLine(stock)"
        >
          <span class="text-[13px] font-semibold text-[var(--text-primary)] leading-tight">{{
            stock.nom
          }}</span>
          <!-- Honey traceability preview -->
          <div v-if="stock.typeMiel" class="flex flex-wrap gap-1">
            <span
              class="rounded-full bg-[var(--honey-soft)] px-1.5 py-0.5 text-[10px] font-medium text-[var(--honey-deep)]"
            >
              {{ varietelabel(stock.typeMiel) }}
            </span>
            <span
              v-if="stock.anneeRecolte"
              class="rounded-full bg-[var(--honey-soft)] px-1.5 py-0.5 text-[10px] text-[var(--honey-deep)]"
            >
              {{ stock.anneeRecolte }}
            </span>
          </div>
          <div class="flex w-full items-center justify-between">
            <span class="text-[11px] text-[var(--text-tertiary)]"
              >{{ Number(stock.quantite) }} {{ stock.unite ?? 'u' }}</span
            >
            <span
              v-if="stock.prixUnitaire"
              class="rounded-[6px] bg-[var(--honey-soft)] px-1.5 py-0.5 text-[10px] font-bold text-[var(--honey-deep)]"
            >
              {{ formatMoney(Number(stock.prixUnitaire)) }}/{{ stock.unite ?? 'u' }}
            </span>
          </div>
        </button>
      </div>
    </div>

    <!-- … et quand il n'y a rien à piocher, ON LE DIT.
         Le bloc disparaissait sans un mot : un apiculteur qui vend depuis ses
         stocks croyait la fonction absente d'APIGO, et ceux dont les stocks
         venaient de tomber à zéro croyaient à une panne. On distingue donc les
         deux cas, et on rappelle que la ligne libre reste toujours possible. -->
    <div
      v-else-if="stocksCharges"
      class="rounded-[12px] border border-dashed border-[var(--border-default)] bg-[var(--surface-muted)] p-4"
    >
      <div class="flex items-start gap-3">
        <div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-[8px] bg-white">
          <UIcon name="i-lucide-warehouse" class="h-4 w-4 text-[var(--text-tertiary)]" />
        </div>
        <div class="min-w-0 flex-1">
          <p class="text-[13px] font-semibold text-[var(--text-primary)]">
            Vendre depuis vos stocks
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

    <!-- Lignes de facturation -->
    <div>
      <div class="mb-2 flex items-center justify-between">
        <label class="text-[13px] font-semibold text-[var(--text-primary)]">Lignes</label>
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
          class="rounded-[10px] border border-[var(--border-default)] bg-[var(--surface-muted)] p-3"
        >
          <!-- Stock / Honey badge -->
          <div
            v-if="ligne.stockId || ligne.typeMiel"
            class="mb-2 flex flex-wrap items-center gap-1.5"
          >
            <span
              v-if="ligne.stockId"
              class="flex items-center gap-1 text-[11px] font-medium text-[var(--honey-deep)]"
            >
              <UIcon name="i-lucide-warehouse" class="h-3 w-3" /> Stock
            </span>
            <span
              v-if="ligne.typeMiel"
              class="rounded-full bg-[var(--honey-soft)] px-2 py-0.5 text-[10px] font-semibold text-[var(--honey-deep)]"
            >
              🍯 {{ varietelabel(ligne.typeMiel) }}
            </span>
            <span
              v-if="ligne.anneeRecolte"
              class="rounded-full bg-[var(--honey-soft)] px-2 py-0.5 text-[10px] text-[var(--honey-deep)]"
            >
              {{ ligne.anneeRecolte }}
            </span>
            <span
              v-if="ligne.numLot"
              class="rounded-full bg-[var(--surface-muted)] border border-[var(--border-default)] px-2 py-0.5 text-[10px] text-[var(--text-tertiary)]"
            >
              {{ ligne.numLot }}
            </span>
            <span v-if="ligne.origineGeo" class="text-[10px] text-[var(--text-tertiary)]">
              <UIcon name="i-lucide-map-pin" class="inline h-2.5 w-2.5" /> {{ ligne.origineGeo }}
            </span>
          </div>

          <!-- Pedigree — reine vendue (optionnel, module élevage Expert) -->
          <div v-if="ligne.categorieVente === 'reine' && reineOptions.length" class="mb-2">
            <label class="mb-1 block text-[11px] text-[var(--text-tertiary)]">
              <UIcon name="i-lucide-crown" class="inline h-3 w-3" /> Reine vendue (optionnel)
            </label>
            <USelect
              :model-value="ligne.reineElevageId ?? undefined"
              :items="reineOptions"
              value-key="value"
              label-key="label"
              placeholder="Relier à une reine du module élevage"
              class="max-w-xs"
              @update:model-value="(v) => updateLigne(index, 'reineElevageId', v)"
            />
          </div>

          <div class="grid grid-cols-12 items-end gap-2">
            <!-- Description -->
            <div class="col-span-5">
              <label v-if="index === 0" class="mb-1 block text-[11px] text-[var(--text-tertiary)]"
                >Description</label
              >
              <input
                :value="ligne.description"
                type="text"
                required
                placeholder="Description"
                class="h-9 w-full rounded-[8px] border border-[var(--border-default)] bg-white px-3 text-[13px] text-[var(--text-primary)] outline-none focus:border-[var(--honey)] focus:ring-2 focus:ring-[var(--honey)]/15"
                @input="
                  updateLigne(index, 'description', ($event.target as HTMLInputElement).value)
                "
              />
            </div>
            <!-- Quantité -->
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
                class="h-9 w-full rounded-[8px] border border-[var(--border-default)] bg-white px-3 text-[13px] text-[var(--text-primary)] outline-none focus:border-[var(--honey)] focus:ring-2 focus:ring-[var(--honey)]/15"
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
            <!-- Prix unitaire HT -->
            <div class="col-span-2">
              <label v-if="index === 0" class="mb-1 block text-[11px] text-[var(--text-tertiary)]"
                >PU HT (€)</label
              >
              <input
                :value="ligne.prixUnitaire"
                type="number"
                min="0"
                step="0.01"
                required
                class="h-9 w-full rounded-[8px] border border-[var(--border-default)] bg-white px-3 text-[13px] text-[var(--text-primary)] outline-none focus:border-[var(--honey)] focus:ring-2 focus:ring-[var(--honey)]/15"
                @input="
                  updateLigne(
                    index,
                    'prixUnitaire',
                    Number(($event.target as HTMLInputElement).value),
                  )
                "
              />
            </div>
            <!-- Total HT -->
            <div class="col-span-2 text-right">
              <label v-if="index === 0" class="mb-1 block text-[11px] text-[var(--text-tertiary)]"
                >Total HT</label
              >
              <p class="py-1.5 text-[13px] font-semibold text-[var(--text-primary)]">
                {{ formatMoney(ligneTotalHt(ligne)) }}
              </p>
              <p
                v-if="ligne.modePrix === 'poids' && ligne.contenance"
                class="text-[10px] text-[var(--text-tertiary)]"
              >
                {{ ligne.quantite }} × {{ ligne.contenance }}{{ ligne.uniteContenance || '' }}
              </p>
            </div>
            <!-- Supprimer -->
            <div class="col-span-1 flex justify-end">
              <button
                v-if="modelValue.lignes.length > 1"
                type="button"
                aria-label="Retirer cette ligne"
                class="flex h-9 w-9 items-center justify-center rounded-[8px] text-[var(--text-tertiary)] hover:bg-red-50 hover:text-red-500"
                @click="removeLine(index)"
              >
                <UIcon name="i-lucide-x" class="h-4 w-4" />
              </button>
            </div>
          </div>

          <!-- TVA par ligne -->
          <div class="mt-2 flex flex-wrap items-center gap-1.5">
            <span class="text-[11px] text-[var(--text-tertiary)]">TVA :</span>
            <button
              v-for="taux in TVA_RATES"
              :key="taux.value"
              type="button"
              class="rounded-full px-2 py-0.5 text-[11px] font-semibold transition-all"
              :class="
                ligne.tauxTva === taux.value
                  ? taux.activeClass
                  : 'bg-[var(--surface-muted)] text-[var(--text-tertiary)] hover:bg-[var(--border-default)]'
              "
              :title="taux.description"
              @click="updateLigne(index, 'tauxTva', taux.value)"
            >
              {{ taux.value }}%
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Remise -->
    <div class="flex items-center gap-3">
      <label class="shrink-0 text-[13px] font-semibold text-[var(--text-primary)]">Remise</label>
      <div class="flex items-center gap-2">
        <input
          type="number"
          min="0"
          max="100"
          step="0.5"
          :value="modelValue.remise ?? 0"
          placeholder="0"
          class="w-20 rounded-[8px] border border-[var(--border-default)] bg-white px-3 py-2 text-[13px] text-[var(--text-primary)] outline-none transition focus:border-[var(--honey)] focus:ring-2 focus:ring-[var(--honey)]/15"
          @input="update('remise', Number(($event.target as HTMLInputElement).value) || 0)"
        />
        <span class="text-[13px] text-[var(--text-secondary)]">%</span>
        <span v-if="(modelValue.remise ?? 0) > 0" class="text-[12px] text-honey-deep">
          — {{ formatMoney(remiseMontant) }} déduits
        </span>
      </div>
    </div>

    <!-- Récapitulatif TVA -->
    <div
      class="ml-auto w-72 space-y-1.5 rounded-[12px] border border-[var(--border-default)] bg-[var(--surface-muted)] p-4"
    >
      <div class="flex justify-between text-[13px] text-[var(--text-secondary)]">
        <span>Sous-total HT</span>
        <span class="font-medium">{{ formatMoney(sousTotal) }}</span>
      </div>
      <div
        v-if="(modelValue.remise ?? 0) > 0"
        class="flex justify-between text-[12px] text-honey-deep"
      >
        <span>Remise ({{ modelValue.remise }}%)</span>
        <span>- {{ formatMoney(remiseMontant) }}</span>
      </div>
      <div
        v-if="(modelValue.remise ?? 0) > 0"
        class="flex justify-between text-[12px] text-[var(--text-secondary)]"
      >
        <span>HT net</span>
        <span class="font-medium">{{ formatMoney(sousTotalNet) }}</span>
      </div>
      <template v-for="(amount, rate) in tvaParTaux" :key="rate">
        <div class="flex justify-between text-[12px] text-[var(--text-tertiary)]">
          <span>TVA {{ rate }}%</span>
          <span>{{ formatMoney(amount) }}</span>
        </div>
      </template>
      <div
        class="flex justify-between border-t border-[var(--border-default)] pt-2 text-[15px] font-bold text-[var(--text-primary)]"
      >
        <span>Total TTC</span>
        <span>{{ formatMoney(totalTTC) }}</span>
      </div>
    </div>

    <!-- Nature de l'opération -->
    <div>
      <label class="mb-1.5 block text-[13px] font-semibold text-[var(--text-primary)]">
        Nature de l'opération <span class="text-[var(--status-bad)]">*</span>
      </label>
      <div class="flex gap-2">
        <button
          v-for="cat in CATEGORIES_OPERATION"
          :key="cat.value"
          type="button"
          class="flex flex-1 items-center justify-center gap-1.5 rounded-[10px] border-2 px-3 py-2 text-[12px] font-medium transition-all"
          :class="
            modelValue.categorieOperation === cat.value
              ? 'border-[var(--honey)] bg-[var(--honey-soft)] text-[var(--honey-deep)]'
              : 'border-[var(--border-default)] bg-white text-[var(--text-secondary)] hover:bg-[var(--surface-muted)]'
          "
          @click="update('categorieOperation', cat.value)"
        >
          <UIcon :name="cat.icon" class="h-4 w-4" />
          {{ cat.label }}
        </button>
      </div>
      <p class="mt-1 text-[11px] text-[var(--text-tertiary)]">
        Mention obligatoire depuis sept. 2026 (décret n° 2022-1299)
      </p>
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
import { TVA_PAR_CATEGORIE_VENTE, TYPES_MIEL } from '~/types/enums';
import type { CategorieVente } from '~/types/enums';

interface Ligne {
  description: string;
  quantite: number;
  prixUnitaire: number;
  total: number;
  tauxTva: number;
  modePrix?: 'format' | 'poids';
  contenance?: number | null;
  uniteContenance?: string;
  stockId?: string;
  stockQuantite?: number;
  // Traçabilité miel — Décret 2003-587
  typeMiel?: string;
  presentation?: string;
  numLot?: string;
  origineGeo?: string;
  anneeRecolte?: number;
  // Pedigree — reine vendue (module élevage, Expert), optionnel
  categorieVente?: string;
  reineElevageId?: string | null;
}

interface VenteFormData {
  clientId?: string;
  dateTransaction: string;
  dateEcheance?: string;
  lignes: Ligne[];
  remise?: number;
  notes?: string;
  categorieOperation: 'livraison_biens' | 'prestation_services' | 'mixte';
}

const CATEGORIES_OPERATION = [
  { value: 'livraison_biens', label: 'Livraison de biens', icon: 'i-lucide-package' },
  { value: 'prestation_services', label: 'Prestation', icon: 'i-lucide-briefcase' },
  { value: 'mixte', label: 'Mixte', icon: 'i-lucide-shuffle' },
] as const;

const TVA_RATES = [
  {
    value: 5.5,
    label: '5,5%',
    activeClass: 'bg-amber-100 text-amber-700',
    description: 'Alimentaire — Art. 278-0 bis A CGI (miel, pollen, gelée royale…)',
  },
  {
    value: 10,
    label: '10%',
    activeClass: 'bg-blue-100 text-blue-700',
    description: 'Animaux vivants & médicaments vétérinaires — Art. 278 bis CGI',
  },
  {
    value: 20,
    label: '20%',
    activeClass: 'bg-[var(--surface-muted)] text-[var(--text-secondary)]',
    description: 'Taux normal — matériel, équipements, hydromel, cosmétiques…',
  },
  {
    value: 0,
    label: '0%',
    activeClass: 'bg-[var(--honey-soft)] text-[var(--honey-deep)]',
    description: 'Franchise en base (Art. 293 B CGI) / Export / Intra-UE',
  },
] as const;

const props = withDefaults(
  defineProps<{
    modelValue: VenteFormData;
    clients: Client[];
    stocks?: Stock[];
    /**
     * La liste des stocks est-elle ARRIVÉE ? Le parent envoie `[]` pendant le
     * chargement, ce qui est indiscernable d'un stock réellement vide : sans
     * cette information, « aucun produit en stock » s'affiche une fraction de
     * seconde avant que les produits apparaissent. Par défaut vrai, pour les
     * appelants qui passent une liste déjà résolue.
     */
    stocksCharges?: boolean;
  }>(),
  { stocks: undefined, stocksCharges: true },
);

const emit = defineEmits<{
  'update:modelValue': [value: VenteFormData];
  submit: [];
}>();

// Sélecteur de reine (pedigree client) — uniquement pour les comptes avec le
// module élevage (Expert), fetché à la demande (pas pour tout le monde).
const gating = useGating();
const { data: reinesElevageData } = useFetch('/api/elevage/reines', {
  key: 'ventes-reines-options',
  query: { limit: 200, page: 1, active: 'true' },
  lazy: true,
  immediate: gating.can('elevageReines'),
});
const reineOptions = computed(() =>
  (reinesElevageData.value?.data ?? []).map((r: Record<string, unknown>) => {
    const reine = r.reine as Record<string, unknown>;
    return {
      label: (reine.identifiant as string) || `Reine ${(reine.id as string).slice(-4)}`,
      value: reine.id as string,
    };
  }),
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

const availableStocks = computed(() => {
  const list = (props.stocks ?? []).filter((s) => Number(s.quantite) > 0);
  return [...list].sort((a, b) => {
    if (a.typeMiel && !b.typeMiel) return -1;
    if (!a.typeMiel && b.typeMiel) return 1;
    return 0;
  });
});

/**
 * « Pas encore de stock » et « stocks épuisés » ne se soignent pas pareil : le
 * premier attend une création, le second un réapprovisionnement. Les confondre
 * envoie l'apiculteur créer un doublon du produit qu'il a déjà.
 */
const messageStockVide = computed(() =>
  (props.stocks ?? []).length === 0
    ? 'Aucun produit en stock pour l’instant. Dès qu’il y en aura, ils s’ajouteront ici en un clic, traçabilité comprise. En attendant, saisissez une ligne libre.'
    : 'Vos produits sont tous à zéro. Réapprovisionnez-les pour les vendre en un clic ; en attendant, saisissez une ligne libre.',
);

/**
 * ⚠️ UN « MIROIR CLIENT » ÉCRIT À LA MAIN VIVAIT ICI, et il n'était pas fidèle :
 * il n'arrondissait pas par ligne. Le formulaire annonçait donc un sous-total
 * qui pouvait s'écarter d'un centime de celui que le serveur allait écrire —
 * exactement l'écart que CLAUDE.md décrit entre les deux portes d'une campagne.
 * La fonction est maintenant celle du serveur, atteinte par le même module.
 */
const sousTotal = computed(() => sommeSaisieHt(props.modelValue.lignes));

const remiseRatio = computed(() => {
  const r = props.modelValue.remise ?? 0;
  return r > 0 ? (100 - r) / 100 : 1;
});

const remiseMontant = computed(() => {
  const r = props.modelValue.remise ?? 0;
  return r > 0 ? Math.round(sousTotal.value * r) / 100 : 0;
});

const sousTotalNet = computed(
  () => Math.round((sousTotal.value - remiseMontant.value) * 100) / 100,
);

const tvaParTaux = computed(() => {
  const byRate: Record<number, number> = {};
  for (const l of props.modelValue.lignes) {
    const ht = ligneTotalHt(l) * remiseRatio.value;
    const tva = Math.round(ht * l.tauxTva) / 100;
    byRate[l.tauxTva] = (byRate[l.tauxTva] ?? 0) + tva;
  }
  return byRate;
});

const totalTVA = computed(() => Object.values(tvaParTaux.value).reduce((sum, t) => sum + t, 0));
const totalTTC = computed(() => Math.round((sousTotalNet.value + totalTVA.value) * 100) / 100);

function update(key: keyof VenteFormData, value: unknown) {
  emit('update:modelValue', { ...props.modelValue, [key]: value });
}

function updateLigne(index: number, key: keyof Ligne, value: string | number | null | undefined) {
  const lignes: Ligne[] = props.modelValue.lignes.map((l) => ({ ...l }));
  const ligne = lignes[index];
  if (!ligne) return;
  if (key === 'description') ligne.description = value as string;
  else if (key === 'quantite') ligne.quantite = value as number;
  else if (key === 'prixUnitaire') ligne.prixUnitaire = value as number;
  else if (key === 'total') ligne.total = value as number;
  else if (key === 'tauxTva') ligne.tauxTva = value as number;
  else if (key === 'reineElevageId') ligne.reineElevageId = (value as string) || null;
  emit('update:modelValue', { ...props.modelValue, lignes });
}

function addEmptyLine() {
  const lignes = [
    ...props.modelValue.lignes,
    { description: '', quantite: 1, prixUnitaire: 0, total: 0, tauxTva: 5.5 },
  ];
  emit('update:modelValue', { ...props.modelValue, lignes });
}

function addStockLine(stock: Stock) {
  const tauxTva =
    stock.tauxTva !== null && stock.tauxTva !== undefined
      ? Number(stock.tauxTva)
      : stock.categorieVente
        ? (TVA_PAR_CATEGORIE_VENTE[stock.categorieVente as CategorieVente] ?? 5.5)
        : 5.5;

  const ligne: Ligne = {
    description: stock.nom,
    quantite: 1,
    prixUnitaire: Number(stock.prixUnitaire ?? 0),
    total: 0,
    tauxTva,
    modePrix: stock.modePrix ?? 'format',
    contenance: stock.contenance != null ? Number(stock.contenance) : null,
    uniteContenance: stock.uniteContenance ?? undefined,
    stockId: stock.id,
    stockQuantite: Number(stock.quantite),
    // Traçabilité miel auto-fill
    typeMiel: stock.typeMiel ?? undefined,
    presentation: stock.presentation ?? undefined,
    numLot: stock.numLot ?? undefined,
    origineGeo: stock.origineGeo ?? undefined,
    anneeRecolte: stock.anneeRecolte ?? undefined,
    categorieVente: stock.categorieVente ?? undefined,
  };

  const lignes = [...props.modelValue.lignes];
  const emptyIdx = lignes.findIndex((l) => !l.description && l.prixUnitaire === 0);
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
