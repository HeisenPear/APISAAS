<template>
  <div>
    <!-- Toolbar (hidden on print) -->
    <div class="mb-6 flex items-center justify-between print:hidden">
      <NuxtLink
        to="/finances/ventes"
        class="inline-flex items-center gap-1 text-sm text-stone-500 transition-colors hover:text-stone-700"
      >
        <UIcon name="i-lucide-arrow-left" class="h-4 w-4" />
        Retour aux ventes
      </NuxtLink>
      <div class="flex flex-wrap items-center gap-2">
        <UButton
          v-if="facture && facture.statut === 'brouillon'"
          label="Modifier"
          icon="i-lucide-pencil"
          variant="outline"
          color="neutral"
          @click="openEdit"
        />
        <UButton
          v-if="facture && facture.statut === 'brouillon'"
          label="Marquer envoyee"
          icon="i-lucide-send"
          variant="outline"
          color="primary"
          @click="markEnvoyee"
        />
        <UButton
          v-if="facture && facture.statut === 'envoyee'"
          label="Marquer payee"
          icon="i-lucide-check-circle"
          variant="outline"
          color="success"
          @click="markPayee"
        />
        <UButton
          label="Télécharger PDF"
          icon="i-lucide-download"
          color="primary"
          :loading="pdfBusy"
          @click="downloadPDF"
        />
        <UButton
          v-if="facture"
          label="Envoyer au client"
          icon="i-lucide-mail"
          variant="outline"
          color="primary"
          :loading="emailBusy"
          :disabled="!facture.clientEmail"
          :title="
            !facture.clientEmail ? 'Aucun email client (complétez la fiche client)' : undefined
          "
          @click="envoyerEmail"
        />
        <UButton
          label="Imprimer"
          icon="i-lucide-printer"
          variant="ghost"
          color="neutral"
          @click="imprimer"
        />
        <UButton
          icon="i-lucide-file-check"
          variant="outline"
          color="neutral"
          :loading="downloadingFacturx"
          :disabled="!facture?.emetteur?.siret || !facture?.numero"
          :title="
            !facture?.emetteur?.siret
              ? 'SIRET manquant dans vos paramètres'
              : !facture?.numero
                ? 'Émettez la facture pour générer le Factur-X'
                : undefined
          "
          @click="downloadFacturX"
        >
          Télécharger Factur-X
        </UButton>
      </div>
    </div>

    <!-- Info Factur-X -->
    <p v-if="facture" class="mt-2 text-xs text-stone-400 print:hidden">
      Le fichier Factur-X est conforme à la norme EN 16931. Déposez-le sur votre plateforme agréée
      (Qonto, Pennylane, etc.) pour l'envoyer à votre client.
    </p>

    <!-- Statut + aide — masqué à l'impression -->
    <FinancesFactureStatut v-if="facture" :statut="facture.statut" class="mt-4 print:hidden" />

    <!-- Bandeau RIB (si non configuré) — masqué à l'impression -->
    <FinancesRibSetupBanner v-if="facture" class="mt-3 print:hidden" />

    <!-- Loading -->
    <div v-if="loading" class="flex items-center justify-center py-20">
      <UIcon name="i-lucide-loader-2" class="h-8 w-8 animate-spin text-stone-400" />
    </div>

    <!-- Invoice -->
    <div
      v-else-if="facture"
      ref="invoiceRef"
      class="invoice-container mx-auto max-w-[210mm] rounded-2xl border border-stone-200/60 bg-white shadow-sm print:rounded-none print:border-none print:shadow-none"
    >
      <div class="p-8 sm:p-12">
        <!-- Header: Emetteur + FACTURE title -->
        <div class="mb-10 flex items-start justify-between">
          <!-- Emetteur -->
          <div class="max-w-[55%]">
            <div class="mb-1 flex items-center gap-2">
              <div
                class="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/20 print:bg-amber-100"
              >
                <UIcon name="i-lucide-hexagon" class="h-5 w-5 text-amber-600" />
              </div>
              <span class="text-lg font-bold text-stone-900">
                {{ emetteurNom }}
              </span>
            </div>
            <div class="mt-2 space-y-0.5 text-sm text-stone-500">
              <p v-if="facture.emetteur?.adresse">{{ facture.emetteur.adresse }}</p>
              <p v-if="facture.emetteur?.codePostal || facture.emetteur?.ville">
                {{
                  [facture.emetteur.codePostal, facture.emetteur.ville].filter(Boolean).join(' ')
                }}
              </p>
              <p v-if="facture.emetteur?.telephone">Tel : {{ facture.emetteur.telephone }}</p>
              <p v-if="facture.emetteur?.email">{{ facture.emetteur.email }}</p>
              <div class="mt-2 space-y-0.5 text-xs text-stone-400">
                <p v-if="facture.emetteur?.siret">SIRET : {{ facture.emetteur.siret }}</p>
                <p v-if="facture.emetteur?.siret">
                  SIREN : {{ facture.emetteur.siret.slice(0, 9) }}
                </p>
                <p v-if="facture.emetteur?.napi">N° NAPI : {{ facture.emetteur.napi }}</p>
              </div>
            </div>
          </div>

          <!-- Facture info -->
          <div class="text-right">
            <h1 class="text-3xl font-bold tracking-tight text-stone-900">FACTURE</h1>
            <p class="mt-1 text-lg font-semibold text-amber-600">
              {{ facture.numero || 'Brouillon' }}
            </p>
            <p v-if="!facture.numero" class="text-[11px] text-stone-400 print:hidden">
              Numéro attribué à l'émission
            </p>
            <div class="mt-3 space-y-0.5 text-sm text-stone-500">
              <p>Date d'emission : {{ formatDate(facture.dateTransaction) }}</p>
              <p v-if="facture.dateEcheance">
                Date d'echeance : {{ formatDate(facture.dateEcheance) }}
              </p>
              <p v-else>Paiement : a reception</p>
            </div>
            <span
              class="mt-2 inline-block rounded-full px-3 py-1 text-xs font-semibold print:hidden"
              :class="statutClass(facture.statut)"
            >
              {{ statutLabel(facture.statut) }}
            </span>
          </div>
        </div>

        <!-- Client info -->
        <div class="mb-8 rounded-xl bg-stone-50 p-5 print:bg-gray-50">
          <p class="mb-1 text-xs font-semibold uppercase tracking-wider text-stone-400">
            Destinataire
          </p>
          <p class="text-base font-semibold text-stone-900">
            {{
              facture.clientEntreprise ||
              [facture.clientNom, facture.clientPrenom].filter(Boolean).join(' ') ||
              'Client non renseigne'
            }}
          </p>
          <div class="mt-1 space-y-0.5 text-sm text-stone-500">
            <p v-if="facture.clientAdresse">{{ facture.clientAdresse }}</p>
            <p v-if="facture.clientCodePostal || facture.clientVille">
              {{ [facture.clientCodePostal, facture.clientVille].filter(Boolean).join(' ') }}
            </p>
            <p v-if="facture.clientEmail">{{ facture.clientEmail }}</p>
            <p v-if="facture.clientTelephone">{{ facture.clientTelephone }}</p>
            <p v-if="facture.clientSiret" class="text-xs text-stone-400">
              SIRET : {{ facture.clientSiret }}
            </p>
            <!-- MENTION 1 : SIREN client -->
            <p v-if="facture.clientSiren" class="text-xs text-stone-400">
              SIREN : {{ facture.clientSiren }}
            </p>
            <!-- MENTION 2 : Adresse de livraison -->
            <div v-if="facture.clientAdresseLivraison" class="mt-1.5 text-xs text-stone-500">
              <span class="font-semibold text-stone-600">Adresse de livraison :</span><br />
              {{ facture.clientAdresseLivraison }}<br />
              {{
                [facture.clientCodePostalLivraison, facture.clientVilleLivraison]
                  .filter(Boolean)
                  .join(' ')
              }}
            </div>
          </div>
        </div>

        <!-- Alerte SIRET émetteur manquant -->
        <div
          v-if="!facture.emetteur?.siret"
          class="mb-4 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 print:hidden"
        >
          <UIcon name="i-lucide-alert-circle" class="h-4 w-4 shrink-0" />
          Votre SIRET est manquant — le téléchargement Factur-X est indisponible.
          <NuxtLink to="/parametres" class="font-medium underline">
            Compléter mes paramètres →
          </NuxtLink>
        </div>

        <!-- Alerte SIREN client manquant -->
        <div
          v-if="facture.clientId && !facture.clientSiren"
          class="mb-4 flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700 print:hidden"
        >
          <UIcon name="i-lucide-alert-triangle" class="h-4 w-4 shrink-0" />
          Le SIREN du client est requis pour une facture électronique conforme.
          <NuxtLink :to="`/clients/${facture.clientId}`" class="font-medium underline">
            Compléter la fiche client →
          </NuxtLink>
        </div>

        <!-- MENTION 3 : Nature de l'opération -->
        <div class="mb-4">
          <p class="text-xs text-stone-500">
            Nature de l'opération :
            <span class="font-medium">
              {{
                facture.categorieOperation === 'prestation_services'
                  ? 'Prestation de services'
                  : facture.categorieOperation === 'mixte'
                    ? 'Livraison de biens et prestation de services'
                    : 'Livraison de biens'
              }}
            </span>
          </p>
        </div>

        <!-- Lignes table -->
        <table class="mb-6 w-full">
          <thead>
            <tr class="border-b-2 border-stone-200">
              <th
                class="pb-3 text-left text-xs font-semibold uppercase tracking-wider text-stone-400"
              >
                Designation
              </th>
              <th
                class="pb-3 text-right text-xs font-semibold uppercase tracking-wider text-stone-400"
              >
                Qte
              </th>
              <th
                class="pb-3 text-right text-xs font-semibold uppercase tracking-wider text-stone-400"
              >
                P.U. HT
              </th>
              <th
                class="pb-3 text-right text-xs font-semibold uppercase tracking-wider text-stone-400"
              >
                TVA
              </th>
              <th
                class="pb-3 text-right text-xs font-semibold uppercase tracking-wider text-stone-400"
              >
                Montant HT
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(ligne, index) in lignes" :key="index" class="border-b border-stone-100">
              <td class="py-3 text-sm text-stone-700">
                <p>{{ ligne.description }}</p>
                <p
                  v-if="ligne.typeMiel || ligne.numLot"
                  class="mt-0.5 text-[11px] text-[var(--text-tertiary)]"
                >
                  <span v-if="ligne.typeMiel">Miel {{ varietelabel(ligne.typeMiel) }}</span>
                  <span v-if="ligne.anneeRecolte"> — {{ ligne.anneeRecolte }}</span>
                  <span v-if="ligne.numLot"> — Lot : {{ ligne.numLot }}</span>
                  <span v-if="ligne.origineGeo"> — {{ ligne.origineGeo }}</span>
                </p>
              </td>
              <td class="py-3 text-right text-sm text-stone-600">{{ ligne.quantite }}</td>
              <td class="py-3 text-right text-sm text-stone-600">
                {{ formatMoney(ligne.prixUnitaire) }}
              </td>
              <td class="py-3 text-right text-xs text-stone-500">{{ ligne.tauxTva ?? 5.5 }}%</td>
              <td class="py-3 text-right text-sm font-medium text-stone-900">
                {{
                  formatMoney(
                    ligne.total != null ? Number(ligne.total) : ligne.quantite * ligne.prixUnitaire,
                  )
                }}
              </td>
            </tr>
          </tbody>
        </table>

        <!-- Totals -->
        <div class="flex justify-end">
          <div class="w-72 space-y-2">
            <div class="flex justify-between text-sm text-stone-600">
              <span>Total HT</span>
              <span class="font-medium">{{ formatMoney(Number(facture.sousTotal ?? 0)) }}</span>
            </div>
            <div
              v-if="Number(facture.remise ?? 0) > 0"
              class="flex justify-between text-sm text-emerald-600"
            >
              <span>Remise ({{ Number(facture.remise) }}%)</span>
              <span class="font-medium"
                >-
                {{
                  formatMoney((Number(facture.sousTotal ?? 0) * Number(facture.remise)) / 100)
                }}</span
              >
            </div>
            <div
              v-if="Number(facture.remise ?? 0) > 0"
              class="flex justify-between text-sm text-stone-700"
            >
              <span class="font-medium">HT net</span>
              <span class="font-medium">{{
                formatMoney(Number(facture.sousTotal ?? 0) * (1 - Number(facture.remise) / 100))
              }}</span>
            </div>
            <template v-for="(amount, rate) in tvaParTaux" :key="rate">
              <div class="flex justify-between text-sm text-stone-600">
                <span>TVA {{ rate }}%</span>
                <span class="font-medium">{{ formatMoney(amount) }}</span>
              </div>
            </template>
            <div
              v-if="Object.keys(tvaParTaux).length === 0"
              class="flex justify-between text-sm text-stone-600"
            >
              <span>TVA</span>
              <span class="font-medium">{{ formatMoney(0) }}</span>
            </div>
            <div class="flex justify-between border-t-2 border-stone-900 pt-2">
              <span class="text-base font-bold text-stone-900">Total TTC</span>
              <span class="text-xl font-bold text-stone-900">{{
                formatMoney(Number(facture.total ?? 0))
              }}</span>
            </div>
          </div>
        </div>

        <!-- Notes -->
        <div v-if="facture.notes" class="mt-8 rounded-xl bg-stone-50 p-4 print:bg-gray-50">
          <p class="mb-1 text-xs font-semibold uppercase tracking-wider text-stone-400">Notes</p>
          <p class="whitespace-pre-line text-sm text-stone-600">{{ facture.notes }}</p>
        </div>

        <!-- Conditions de paiement — MENTIONS LEGALES OBLIGATOIRES -->
        <div class="mt-8 space-y-3 border-t border-stone-200 pt-5">
          <h4 class="text-xs font-semibold uppercase tracking-wider text-stone-400">
            Conditions de reglement
          </h4>

          <div class="space-y-1.5 text-[11px] leading-relaxed text-stone-500">
            <!-- Delai + mode de paiement -->
            <p>
              <strong class="text-stone-600">Delai de paiement :</strong>
              {{
                facture.dateEcheance
                  ? `A reception, echeance le ${formatDate(facture.dateEcheance)}`
                  : 'Paiement comptant a reception de la facture'
              }}. <strong class="text-stone-600">Mode de reglement :</strong>
              {{ modePaiementLabel }}.
            </p>

            <!-- RIB (si activé dans les paramètres) -->
            <div
              v-if="afficheRib"
              class="mt-1.5 rounded-lg border border-stone-200 bg-stone-50 px-3 py-2 print:bg-gray-50"
            >
              <p class="mb-1 text-[10px] font-semibold uppercase tracking-wider text-stone-500">
                Coordonnées bancaires
              </p>
              <div class="grid grid-cols-1 gap-x-6 gap-y-0.5 sm:grid-cols-2">
                <p v-if="facturation.titulaire">
                  <strong class="text-stone-600">Titulaire :</strong> {{ facturation.titulaire }}
                </p>
                <p v-if="facturation.banque">
                  <strong class="text-stone-600">Banque :</strong> {{ facturation.banque }}
                </p>
                <p><strong class="text-stone-600">IBAN :</strong> {{ facturation.iban }}</p>
                <p v-if="facturation.bic">
                  <strong class="text-stone-600">BIC :</strong> {{ facturation.bic }}
                </p>
              </div>
            </div>

            <!-- Escompte -->
            <p>
              <strong class="text-stone-600">Escompte :</strong>
              Pas d'escompte accorde en cas de paiement anticipe.
            </p>

            <!-- Penalites de retard -->
            <p>
              <strong class="text-stone-600">Penalites de retard :</strong>
              En cas de retard de paiement, des penalites seront exigibles au taux annuel de
              {{ TAUX_PENALITES }}% (taux directeur BCE {{ TAUX_BCE }}% majore de 10 points, art.
              L.441-10 du Code de commerce).
            </p>

            <!-- Indemnite forfaitaire -->
            <p>
              <strong class="text-stone-600">Indemnite de recouvrement :</strong>
              Tout retard de paiement entrainera l'exigibilite d'une indemnite forfaitaire pour
              frais de recouvrement de <strong>40 €</strong> (art. D.441-5 du Code de commerce). Une
              indemnisation complementaire pourra etre reclamee sur justificatifs.
            </p>

            <!-- TVA -->
            <p v-if="isFranchise">
              <strong class="text-stone-600">TVA :</strong>
              TVA non applicable, article 293 B du Code general des impots (franchise en base de
              TVA).
            </p>
            <!-- MENTION 4 : Option TVA débits -->
            <p v-if="facture.emetteur?.optionTvaDebits" class="font-medium text-stone-600">
              Option pour le paiement de la taxe d'après les débits
            </p>
            <p v-else>
              <strong class="text-stone-600">TVA :</strong>
              Taux applicable{{ tauxTvaList.length > 1 ? 's' : '' }} :
              <template v-for="(taux, i) in tauxTvaList" :key="taux">
                {{ taux }}%<template v-if="taux === 5.5"> (reduit)</template
                ><template v-else-if="taux === 10"> (intermediaire)</template
                ><template v-else-if="taux === 20"> (normal)</template
                ><template v-if="i < tauxTvaList.length - 1">, </template>
              </template>
              — Art. 278 et suivants du CGI.
            </p>
          </div>
        </div>

        <!-- Footer / Identification -->
        <div
          class="mt-6 border-t border-stone-200 pt-4 text-center text-[10px] leading-relaxed text-stone-400"
        >
          <p v-if="facture.emetteur?.siret">
            {{ emetteurNom }}
            — SIRET {{ facture.emetteur.siret }} — SIREN {{ facture.emetteur.siret.slice(0, 9) }}
            <template v-if="facture.emetteur?.napi">
              — N° NAPI {{ facture.emetteur.napi }}</template
            >
          </p>
          <p v-if="!isFranchise && facture.emetteur?.siret">
            N° TVA intracommunautaire : FR{{ tvaIntraKey }}{{ facture.emetteur.siret.slice(0, 9) }}
          </p>
          <p class="mt-1">
            Facture emise le {{ formatDate(facture.dateTransaction) }} —
            {{ facture.numero || 'Brouillon' }}
          </p>
        </div>
      </div>
    </div>

    <!-- Modale d'édition d'un brouillon -->
    <UModal v-model:open="showEditModal">
      <template #content>
        <div class="max-h-[80vh] overflow-y-auto p-6">
          <h2 class="mb-4 text-lg font-semibold text-stone-900">Modifier le brouillon</h2>
          <FinancesVenteForm
            v-model="editForm"
            :clients="clientsList"
            :stocks="stocksList"
            @submit="submitEdit"
          />
          <div class="mt-4 flex justify-end gap-2">
            <UButton
              label="Annuler"
              variant="ghost"
              color="neutral"
              @click="showEditModal = false"
            />
            <UButton
              label="Enregistrer les modifications"
              icon="i-lucide-check"
              color="primary"
              :loading="savingEdit"
              @click="submitEdit"
            />
          </div>
        </div>
      </template>
    </UModal>
  </div>
</template>

<script setup lang="ts">
import type { ApiResponse, ApiListResponse } from '~/types/api';
import type { Client, Stock } from '~/types/models';
import { factureVersForm, type VenteFormData } from '~/types/facture';
import { TYPES_MIEL } from '~/types/enums';

definePageMeta({ layout: 'default' });

// Taux BCE en vigueur (1er semestre 2026) — art. L.441-10 Code de commerce
const TAUX_BCE = '2,15';
const TAUX_PENALITES = '12,15';

interface Ligne {
  description: string;
  quantite: number;
  prixUnitaire: number;
  total: number;
  tauxTva?: number;
  modePrix?: 'format' | 'poids';
  contenance?: number | null;
  typeMiel?: string;
  numLot?: string;
  origineGeo?: string;
  anneeRecolte?: number;
}

interface FacturationPrefs {
  iban?: string;
  bic?: string;
  banque?: string;
  titulaire?: string;
  modePaiement?: string;
  afficherRib?: boolean;
}

interface Emetteur {
  nom: string | null;
  prenom: string | null;
  email: string;
  telephone: string | null;
  adresse: string | null;
  codePostal: string | null;
  ville: string | null;
  siret: string | null;
  napi: string | null;
  optionTvaDebits: boolean | null;
  franchiseTva?: boolean | null;
  preferences?: { facturation?: FacturationPrefs } | null;
}

interface FactureDetail {
  id: string;
  type: string;
  numero: string | null;
  dateTransaction: string | Date;
  dateEcheance: string | Date | null;
  statut: string;
  sousTotal: string | null;
  tva: string | null;
  remise: string | null;
  total: string | null;
  pdfUrl: string | null;
  notes: string | null;
  lignes: Ligne[] | null;
  categorie: string | null;
  clientId: string | null;
  clientNom: string | null;
  clientPrenom: string | null;
  clientEntreprise: string | null;
  clientEmail: string | null;
  clientTelephone: string | null;
  clientAdresse: string | null;
  clientCodePostal: string | null;
  clientVille: string | null;
  clientSiret: string | null;
  clientSiren: string | null;
  clientAdresseLivraison: string | null;
  clientCodePostalLivraison: string | null;
  clientVilleLivraison: string | null;
  categorieOperation: string | null;
  emetteur: Emetteur | null;
}

const route = useRoute();
const notifications = useNotifications();
const { updateFacture, updateStatut, envoyerFactureEmail } = useFinances();
const invoiceRef = ref<HTMLElement | null>(null);

const {
  data: responseData,
  status,
  refresh,
} = useFetch<ApiResponse<FactureDetail>>(`/api/finances/factures/${route.params.id}`, {
  key: `facture-${route.params.id}`,
  default: () => ({ data: null as unknown as FactureDetail }),
});

const loading = computed(() => status.value === 'pending');
const facture = computed(() => responseData.value?.data);

// ─── Édition d'un brouillon ───────────────────────────────────────────────────
const showEditModal = ref(false);
const savingEdit = ref(false);
const editForm = ref<VenteFormData>({
  dateTransaction: new Date().toISOString().slice(0, 10),
  lignes: [],
  categorieOperation: 'livraison_biens',
});

const { data: clientsResp } = useFetch<ApiListResponse<Client>>('/api/clients', {
  query: { limit: 100 },
  key: 'facture-edit-clients',
  default: () => ({ data: [], pagination: { page: 1, limit: 100, total: 0, totalPages: 0 } }),
});
const { data: stocksResp } = useFetch<ApiListResponse<Stock>>('/api/stocks', {
  query: { limit: 100 },
  key: 'facture-edit-stocks',
  default: () => ({ data: [], pagination: { page: 1, limit: 100, total: 0, totalPages: 0 } }),
});
const clientsList = computed(() => clientsResp.value?.data ?? []);
const stocksList = computed(() => stocksResp.value?.data ?? []);

function openEdit() {
  if (!facture.value) return;
  editForm.value = factureVersForm(facture.value);
  showEditModal.value = true;
}

async function submitEdit() {
  if (savingEdit.value || !facture.value) return;
  savingEdit.value = true;
  try {
    const f = editForm.value;
    await updateFacture(facture.value.id, {
      clientId: f.clientId ?? null,
      dateTransaction: f.dateTransaction,
      dateEcheance: f.dateEcheance ?? null,
      lignes: f.lignes,
      remise: f.remise ?? null,
      notes: f.notes ?? null,
    });
    notifications.success('Brouillon mis à jour ✅');
    showEditModal.value = false;
    await refresh();
  } catch (e: unknown) {
    notifications.error(getApiErrorMessage(e, 'Erreur lors de la modification'));
  } finally {
    savingEdit.value = false;
  }
}

// Auto-print if ?print=1 in URL
watch(
  facture,
  (val) => {
    if (val && route.query.print === '1') {
      nextTick(() => {
        setTimeout(() => window.print(), 500);
      });
    }
  },
  { once: true },
);

const lignes = computed<Ligne[]>(() => {
  const raw = facture.value?.lignes;
  if (!raw || !Array.isArray(raw)) return [];
  return raw;
});

const emetteurNom = computed(() => {
  const e = facture.value?.emetteur;
  if (!e) return 'APIGO';
  return [e.prenom, e.nom].filter(Boolean).join(' ') || 'APIGO';
});

/** TVA ventilée par taux — applique le mode poids ET la remise (cohérent avec le total stocké). */
const tvaParTaux = computed(() => {
  const remise = Number(facture.value?.remise ?? 0);
  const ratio = remise > 0 ? (100 - remise) / 100 : 1;
  const byRate: Record<number, number> = {};
  for (const l of lignes.value) {
    const taux = l.tauxTva ?? 5.5;
    const ht =
      l.modePrix === 'poids' && l.contenance
        ? l.quantite * Number(l.contenance) * l.prixUnitaire
        : l.quantite * l.prixUnitaire;
    const tva = Math.round(ht * ratio * taux) / 100;
    if (tva > 0) byRate[taux] = (byRate[taux] ?? 0) + tva;
  }
  return byRate;
});

const tauxTvaList = computed(() => Object.keys(tvaParTaux.value).map(Number));

const isFranchise = computed(
  () =>
    facture.value?.emetteur?.franchiseTva === true ||
    tauxTvaList.value.length === 0 ||
    (tauxTvaList.value.length === 1 && tauxTvaList.value[0] === 0),
);

// Compute TVA intracommunautaire key from SIREN (algorithme officiel)
const tvaIntraKey = computed(() => {
  const siret = facture.value?.emetteur?.siret;
  if (!siret || siret.length < 9) return '00';
  const siren = parseInt(siret.slice(0, 9), 10);
  const key = (12 + 3 * (siren % 97)) % 97;
  return String(key).padStart(2, '0');
});

const downloadingFacturx = ref(false);

async function downloadFacturX() {
  downloadingFacturx.value = true;
  try {
    const xml = await $fetch<string>(`/api/finances/factures/${route.params.id}/facturx`);
    const blob = new Blob([xml], { type: 'application/xml; charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `facture-${facture.value?.numero ?? 'facturx'}-facturx.xml`;
    a.click();
    URL.revokeObjectURL(url);
  } catch (e: unknown) {
    notifications.error(getApiErrorMessage(e, 'Erreur lors de la génération Factur-X'));
  } finally {
    downloadingFacturx.value = false;
  }
}

// ─── RIB & mode de paiement (réglages vendeur) ────────────────────────────────
const facturation = computed<FacturationPrefs>(
  () => facture.value?.emetteur?.preferences?.facturation ?? {},
);

const MODE_PAIEMENT_LABELS: Record<string, string> = {
  virement: 'Virement bancaire',
  cheque: 'Chèque',
  especes: 'Espèces',
  cb: 'Carte bancaire',
  autre: 'Autre',
};
const modePaiementLabel = computed(() => {
  const m = facturation.value.modePaiement;
  return m ? (MODE_PAIEMENT_LABELS[m] ?? m) : 'Virement bancaire ou chèque';
});
const afficheRib = computed(
  () => facturation.value.afficherRib === true && !!facturation.value.iban,
);

// ─── PDF (html2pdf, côté client uniquement) ───────────────────────────────────
function optionsPdf() {
  return {
    filename: `facture-${facture.value?.numero ?? 'brouillon'}.pdf`,
    margin: [8, 8, 8, 8] as [number, number, number, number],
    image: { type: 'jpeg' as const, quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true, backgroundColor: '#ffffff' },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' as const },
  };
}

function imprimer() {
  window.print();
}

const pdfBusy = ref(false);
async function downloadPDF() {
  if (!invoiceRef.value) return;
  pdfBusy.value = true;
  try {
    const html2pdf = (await import('html2pdf.js')).default;
    await html2pdf().set(optionsPdf()).from(invoiceRef.value).save();
  } catch {
    notifications.error('Erreur lors de la génération du PDF');
  } finally {
    pdfBusy.value = false;
  }
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('Lecture PDF impossible'));
    reader.readAsDataURL(blob);
  });
}

const emailBusy = ref(false);
async function envoyerEmail() {
  if (!invoiceRef.value) return;
  if (!facture.value?.clientEmail) {
    notifications.error("Ce client n'a pas d'adresse email — complétez sa fiche.");
    return;
  }
  emailBusy.value = true;
  try {
    const html2pdf = (await import('html2pdf.js')).default;
    const blob = (await html2pdf()
      .set(optionsPdf())
      .from(invoiceRef.value)
      .outputPdf('blob')) as Blob;
    const base64 = await blobToBase64(blob);
    await envoyerFactureEmail(route.params.id as string, base64);
    notifications.success(`Facture envoyée à ${facture.value.clientEmail}`);
    await refresh();
  } catch (e: unknown) {
    notifications.error(getApiErrorMessage(e, "Erreur lors de l'envoi"));
  } finally {
    emailBusy.value = false;
  }
}

async function markEnvoyee() {
  try {
    await updateStatut(route.params.id as string, 'envoyee');
    notifications.success('Facture marquee comme envoyee');
    await refresh();
  } catch (e: unknown) {
    notifications.error(getApiErrorMessage(e, 'Erreur'));
  }
}

async function markPayee() {
  try {
    await updateStatut(route.params.id as string, 'payee');
    notifications.success('Facture marquee comme payee');
    await refresh();
  } catch (e: unknown) {
    notifications.error(getApiErrorMessage(e, 'Erreur'));
  }
}

function statutClass(statut: string) {
  switch (statut) {
    case 'payee':
      return 'bg-emerald-100 text-emerald-800';
    case 'envoyee':
      return 'bg-blue-100 text-blue-800';
    case 'en_retard':
      return 'bg-red-100 text-red-800';
    case 'annulee':
      return 'bg-stone-100 text-stone-500';
    default:
      return 'bg-amber-100 text-amber-800';
  }
}

function statutLabel(statut: string) {
  const labels: Record<string, string> = {
    brouillon: 'Brouillon',
    envoyee: 'Envoyee',
    payee: 'Payee',
    en_retard: 'En retard',
    annulee: 'Annulee',
  };
  return labels[statut] ?? statut;
}

function formatDate(d: string | Date) {
  return new Date(d).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function formatMoney(amount: number) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(amount);
}

function varietelabel(typeMiel: string) {
  return TYPES_MIEL.find((t) => t.value === typeMiel)?.label ?? typeMiel;
}
</script>

<style>
@media print {
  body * {
    visibility: hidden;
  }
  .invoice-container,
  .invoice-container * {
    visibility: visible;
  }
  .invoice-container {
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
    margin: 0;
    padding: 0;
  }
  @page {
    margin: 10mm;
    size: A4;
  }
}
</style>
