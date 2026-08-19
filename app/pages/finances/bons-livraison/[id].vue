<template>
  <div>
    <!-- Toolbar (masqué à l'impression) -->
    <div class="mb-6 flex items-center justify-between print:hidden">
      <NuxtLink
        to="/finances/bons-livraison"
        class="inline-flex items-center gap-1.5 text-[13px] font-medium text-[var(--text-tertiary)] transition-colors hover:text-[var(--text-secondary)]"
      >
        <UIcon name="i-lucide-arrow-left" class="h-3.5 w-3.5" />
        Bons de livraison
      </NuxtLink>

      <div v-if="bl" class="flex flex-wrap items-center gap-2">
        <UButton
          v-if="bl.statut === 'brouillon'"
          label="Marquer livré"
          icon="i-lucide-package-check"
          variant="outline"
          color="primary"
          :loading="saving"
          @click="markLivre"
        />
        <UButton
          v-if="bl.statut === 'livre' && !bl.transactionId"
          label="Convertir en facture"
          icon="i-lucide-file-text"
          color="primary"
          :loading="saving"
          @click="handleConvertir"
        />
        <NuxtLink
          v-if="bl.transactionId"
          :to="`/finances/facture/${bl.transactionId}`"
          class="inline-flex items-center gap-1.5 rounded-[8px] border border-[var(--border-default)] bg-white px-3 py-1.5 text-[12px] font-medium text-[var(--text-secondary)] hover:bg-[var(--surface-muted)]"
        >
          <UIcon name="i-lucide-receipt" class="h-3.5 w-3.5" />
          Voir la facture {{ bl.transactionNumero }}
        </NuxtLink>
        <UButton
          label="Imprimer"
          icon="i-lucide-printer"
          variant="outline"
          color="neutral"
          @click="printBL"
        />
        <UButton
          v-if="bl.statut === 'brouillon'"
          icon="i-lucide-trash-2"
          variant="ghost"
          color="error"
          :loading="saving"
          @click="handleDelete"
        />
        <UButton
          v-if="bl.statut !== 'annule' && bl.statut !== 'facture'"
          label="Annuler"
          variant="ghost"
          color="neutral"
          :loading="saving"
          @click="handleAnnuler"
        />
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="flex items-center justify-center py-20">
      <UIcon name="i-lucide-loader-2" class="h-8 w-8 animate-spin text-[var(--text-tertiary)]" />
    </div>

    <UiErrorState
      v-else-if="erreurChargement"
      :error="erreurChargement"
      titre="Bon de livraison indisponible"
      :retry="fetchBL"
    />

    <!-- Document BL -->
    <div
      v-else-if="bl"
      class="mx-auto max-w-3xl rounded-[16px] border border-[var(--border-default)] bg-white p-8 shadow-sm print:shadow-none print:border-0 print:rounded-none"
    >
      <!-- En-tête document -->
      <div class="mb-8 flex items-start justify-between">
        <div>
          <h1 class="text-[28px] font-bold tracking-tight text-[var(--text-primary)]">
            BON DE LIVRAISON
          </h1>
          <p class="mt-1 text-[16px] font-semibold text-[var(--honey-deep)]">{{ bl.numero }}</p>
          <div class="mt-3 space-y-0.5 text-[13px] text-[var(--text-secondary)]">
            <p>
              <span class="font-medium">Date :</span>
              {{ formatDate(bl.dateCreation as unknown as string) }}
            </p>
            <p v-if="bl.dateLivraison">
              <span class="font-medium">Livraison :</span>
              {{ formatDate(bl.dateLivraison as unknown as string) }}
            </p>
          </div>
        </div>
        <div class="text-right">
          <span
            class="rounded-full px-3 py-1 text-[12px] font-semibold"
            :class="statutBadgeClass(bl.statut)"
            >{{ statutLabel(bl.statut) }}</span
          >
          <p v-if="bl.transactionNumero" class="mt-2 text-[11px] text-[var(--text-tertiary)]">
            Facture : {{ bl.transactionNumero }}
          </p>
        </div>
      </div>

      <!-- Client -->
      <div v-if="bl.clientNom || bl.clientEntreprise" class="mb-8 grid grid-cols-2 gap-8">
        <div>
          <p
            class="mb-2 text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--text-tertiary)]"
          >
            Destinataire
          </p>
          <div class="text-[14px] text-[var(--text-primary)] space-y-0.5">
            <p class="font-semibold">
              {{ bl.clientEntreprise || `${bl.clientNom} ${bl.clientPrenom ?? ''}`.trim() }}
            </p>
            <p v-if="bl.clientEntreprise && bl.clientNom">
              {{ bl.clientNom }} {{ bl.clientPrenom }}
            </p>
            <p v-if="bl.clientAdresse" class="text-[var(--text-secondary)]">
              {{ bl.clientAdresse }}
            </p>
            <p v-if="bl.clientCodePostal || bl.clientVille" class="text-[var(--text-secondary)]">
              {{ bl.clientCodePostal }} {{ bl.clientVille }}
            </p>
            <p v-if="bl.clientEmail" class="text-[12px] text-[var(--text-tertiary)]">
              {{ bl.clientEmail }}
            </p>
          </div>
        </div>
        <div v-if="bl.adresseLivraison || bl.clientAdresseLivraison">
          <p
            class="mb-2 text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--text-tertiary)]"
          >
            Adresse de livraison
          </p>
          <div class="text-[14px] text-[var(--text-secondary)] space-y-0.5">
            <p>{{ bl.adresseLivraison || bl.clientAdresseLivraison }}</p>
            <p>
              {{ bl.codePostalLivraison || bl.clientCodePostalLivraison }}
              {{ bl.villeLivraison || bl.clientVilleLivraison }}
            </p>
          </div>
        </div>
      </div>

      <!-- Tableau des lignes -->
      <table class="w-full text-[13px]">
        <thead>
          <tr class="border-b-2 border-[var(--border-default)]">
            <th
              class="pb-2 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--text-tertiary)]"
            >
              Désignation
            </th>
            <th
              class="pb-2 text-right text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--text-tertiary)]"
            >
              Qté
            </th>
            <th
              class="pb-2 text-right text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--text-tertiary)]"
            >
              P.U. HT
            </th>
            <th
              class="pb-2 text-right text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--text-tertiary)]"
            >
              Total HT
            </th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="(ligne, i) in bl.lignes ?? []"
            :key="i"
            class="border-b border-[var(--border-default)]"
          >
            <td class="py-3 pr-4">
              <p class="font-medium text-[var(--text-primary)]">{{ ligne.description }}</p>
              <!-- Traceability miel -->
              <div v-if="ligne.typeMiel || ligne.numLot" class="mt-1 flex flex-wrap gap-1">
                <span
                  v-if="ligne.typeMiel"
                  class="rounded-full bg-[var(--honey-soft)] px-2 py-0.5 text-[10px] font-medium text-[var(--honey-deep)]"
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
                  Lot : {{ ligne.numLot }}
                </span>
                <span v-if="ligne.origineGeo" class="text-[10px] text-[var(--text-tertiary)]">
                  <UIcon name="i-lucide-map-pin" class="inline h-2.5 w-2.5" />
                  {{ ligne.origineGeo }}
                </span>
              </div>
            </td>
            <td class="py-3 text-right font-medium text-[var(--text-primary)]">
              {{ ligne.quantite }}
            </td>
            <td class="py-3 text-right text-[var(--text-secondary)]">
              {{ ligne.prixUnitaire != null ? formatMoney(ligne.prixUnitaire) : '—' }}
            </td>
            <td class="py-3 text-right font-semibold text-[var(--text-primary)]">
              {{
                ligne.prixUnitaire != null ? formatMoney(ligne.quantite * ligne.prixUnitaire) : '—'
              }}
            </td>
          </tr>
        </tbody>
      </table>

      <!-- Total (si prix) -->
      <div v-if="sousTotal > 0" class="ml-auto mt-4 w-56 space-y-1.5">
        <div class="flex justify-between text-[13px] text-[var(--text-secondary)]">
          <span>Sous-total HT</span>
          <span class="font-medium">{{ formatMoney(sousTotal) }}</span>
        </div>
        <div
          class="flex justify-between border-t border-[var(--border-default)] pt-2 text-[15px] font-bold text-[var(--text-primary)]"
        >
          <span>Total HT</span>
          <span>{{ formatMoney(sousTotal) }}</span>
        </div>
      </div>

      <!-- Notes -->
      <div v-if="bl.notes" class="mt-8 rounded-[10px] bg-[var(--surface-muted)] px-4 py-3">
        <p class="text-[12px] text-[var(--text-secondary)]">{{ bl.notes }}</p>
      </div>

      <!-- Footer BL -->
      <div
        class="mt-10 border-t border-[var(--border-default)] pt-4 text-[11px] text-[var(--text-quaternary)]"
      >
        <p>Document non contractuel — Ce bon de livraison ne constitue pas une facture.</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { TYPES_MIEL } from '~/types/enums';

definePageMeta({ layout: 'default' });

const route = useRoute();
const router = useRouter();
const notifications = useNotifications();
const { updateBL, deleteBL, convertirEnFacture } = useBonsLivraison();

const id = computed(() => route.params.id as string);
const loading = ref(true);
const saving = ref(false);

interface BLDetail {
  id: string;
  numero: string;
  dateCreation: unknown;
  dateLivraison: unknown;
  statut: string;
  lignes: Array<{
    description: string;
    quantite: number;
    prixUnitaire?: number;
    typeMiel?: string;
    anneeRecolte?: number;
    numLot?: string;
    origineGeo?: string;
  }>;
  transactionId: string | null;
  transactionNumero: string | null;
  notes: string | null;
  adresseLivraison: string | null;
  codePostalLivraison: string | null;
  villeLivraison: string | null;
  clientNom: string | null;
  clientPrenom: string | null;
  clientEntreprise: string | null;
  clientAdresse: string | null;
  clientCodePostal: string | null;
  clientVille: string | null;
  clientEmail: string | null;
  clientType: string | null;
  clientAdresseLivraison: string | null;
  clientCodePostalLivraison: string | null;
  clientVilleLivraison: string | null;
}

const bl = ref<BLDetail | null>(null);
/** Échec de CHARGEMENT du document (distinct des échecs d'écriture plus bas). */
const erreurChargement = ref<unknown>(null);

async function fetchBL() {
  loading.value = true;
  erreurChargement.value = null;
  try {
    const res = await $fetch<{ data: BLDetail }>(`/api/bons-livraison/${id.value}`);
    bl.value = res.data;
  } catch (e) {
    // « Introuvable » ne vaut que pour un 404. Sur une panne (500, réseau), le
    // bon existe toujours : annoncer sa disparition est faux et pousse à le
    // recréer. On ne quitte donc la page que lorsqu'il n'existe réellement plus.
    const statut = (e as { statusCode?: number })?.statusCode ?? (e as { status?: number })?.status;
    if (statut === 404) {
      notifications.error('Bon de livraison introuvable');
      await router.push('/finances/bons-livraison');
    } else {
      erreurChargement.value = e;
    }
  } finally {
    loading.value = false;
  }
}

const sousTotal = computed(() =>
  (bl.value?.lignes ?? []).reduce((s, l) => s + l.quantite * (l.prixUnitaire ?? 0), 0),
);

function varietelabel(typeMiel: string) {
  return TYPES_MIEL.find((t) => t.value === typeMiel)?.label ?? typeMiel;
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function formatMoney(n: number) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(n);
}

function statutLabel(s: string) {
  const m: Record<string, string> = {
    brouillon: 'Brouillon',
    livre: 'Livré',
    facture: 'Facturé',
    annule: 'Annulé',
  };
  return m[s] ?? s;
}

function statutBadgeClass(s: string) {
  const m: Record<string, string> = {
    brouillon: 'bg-[var(--surface-muted)] text-[var(--text-secondary)]',
    livre: 'bg-[var(--honey-soft)] text-[var(--honey-deep)]',
    facture: 'bg-amber-50 text-amber-700',
    annule: 'bg-red-50 text-red-600',
  };
  return m[s] ?? 'bg-[var(--surface-muted)] text-[var(--text-secondary)]';
}

async function markLivre() {
  saving.value = true;
  try {
    await updateBL(id.value, { statut: 'livre' });
    await fetchBL();
    notifications.success('BL marqué comme livré');
  } catch (e) {
    notifications.error(getApiErrorMessage(e, 'Erreur'));
  } finally {
    saving.value = false;
  }
}

async function handleConvertir() {
  if (!confirm('Convertir ce BL en facture ?')) return;
  saving.value = true;
  try {
    const result = await convertirEnFacture(id.value);
    const transaction = result.transaction as Record<string, unknown>;
    notifications.success(`Facture ${transaction.numero} créée`);
    await router.push(`/finances/facture/${transaction.id}`);
  } catch (e) {
    notifications.error(getApiErrorMessage(e, 'Erreur lors de la conversion'));
  } finally {
    saving.value = false;
  }
}

async function handleDelete() {
  if (!confirm('Supprimer ce BL ? Le stock sera restitué.')) return;
  saving.value = true;
  try {
    await deleteBL(id.value);
    notifications.success('BL supprimé');
    await router.push('/finances/bons-livraison');
  } catch (e) {
    notifications.error(getApiErrorMessage(e, 'Erreur lors de la suppression'));
  } finally {
    saving.value = false;
  }
}

async function handleAnnuler() {
  if (!confirm('Annuler ce BL ? Les stocks seront restitués.')) return;
  saving.value = true;
  try {
    await updateBL(id.value, { statut: 'annule' });
    await fetchBL();
    notifications.success('BL annulé — stocks restitués');
  } catch (e) {
    notifications.error(getApiErrorMessage(e, 'Erreur'));
  } finally {
    saving.value = false;
  }
}

function printBL() {
  window.print();
}

onMounted(fetchBL);
</script>

<style>
@media print {
  .sidebar,
  header,
  nav,
  .print\:hidden {
    display: none !important;
  }
  body {
    background: white;
  }
}
</style>
