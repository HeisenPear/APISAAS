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
          color="primary"
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

    <!-- Identité incomplète : on le dit AVANT le clic, pas au moment du refus.
         Un mur découvert en pleine action coûte bien plus qu'un avertissement. -->
    <div
      v-if="facture && refusIdentite"
      class="mt-4 rounded-[12px] border border-[var(--clay)] bg-[var(--clay-soft)] px-4 py-3 print:hidden"
    >
      <div class="flex items-start gap-2.5">
        <UIcon
          name="i-lucide-user-round-x"
          class="mt-0.5 h-4 w-4 shrink-0 text-[var(--clay-deep)]"
          aria-hidden="true"
        />
        <div class="min-w-0">
          <p class="text-[13px] font-semibold text-[var(--clay-deep)]">
            Il manque votre nom pour émettre cette facture
          </p>
          <p class="mt-1 text-[12px] leading-snug text-[var(--text-secondary)]">
            {{ refusIdentite }}
          </p>
          <NuxtLink
            to="/parametres"
            class="mt-2 inline-flex items-center gap-1 text-[12px] font-semibold text-[var(--honey-deep)] hover:underline"
          >
            Compléter mon profil
            <UIcon name="i-lucide-arrow-right" class="h-3.5 w-3.5" />
          </NuxtLink>
        </div>
      </div>
    </div>

    <!-- Statut + aide — masqué à l'impression -->
    <FinancesFactureStatut v-if="facture" :statut="facture.statut" class="mt-4 print:hidden" />

    <!-- Trace d'envoi : est-ce vraiment parti, et sinon pourquoi -->
    <FinancesFactureEnvoi
      v-if="facture"
      :statut="facture.statut"
      :client-email="facture.clientEmail"
      :envoye-le="facture.emailEnvoyeLe"
      :message-id="facture.emailMessageId"
      :dernier-echec="facture.emailDernierEchec"
      class="mt-3 print:hidden"
    />

    <!-- Bandeau RIB (si non configuré) — masqué à l'impression -->
    <FinancesRibSetupBanner v-if="facture" class="mt-3 print:hidden" />

    <!-- Loading -->
    <div v-if="loading" class="flex items-center justify-center py-20">
      <UIcon name="i-lucide-loader-2" class="h-8 w-8 animate-spin text-stone-400" />
    </div>

    <!-- Invoice -->
    <UiErrorState v-else-if="error" :error="error" :retry="refresh" />

    <div
      v-else-if="facture"
      ref="invoiceRef"
      class="invoice-container mx-auto max-w-[210mm] rounded-2xl border border-stone-200/60 bg-white shadow-sm print:rounded-none print:border-none print:shadow-none"
    >
      <div class="p-8 sm:p-12">
        <!-- Header: Emetteur + FACTURE title -->
        <div class="mb-10 flex items-start justify-between">
          <!--
            L'en-tête d'émetteur est PARTAGÉ avec le bon de livraison
            (`FinancesEnTeteEmetteur`). Il vivait ici en soixante lignes de
            gabarit, et le bon de livraison — qui part avec la marchandise —
            n'en avait aucune : il sortait anonyme. Recopier était la solution
            évidente, et c'est la faute que ce dépôt paie le plus cher.
          -->
          <!--
            ⚠️ LE LOGO EST UNE FONCTIONNALITÉ DE PLAN, DANS LES DEUX SENS.
            `route-gates` refuse déjà le TÉLÉVERSEMENT hors Pro/Expert ; sans ce
            contrôle-ci, un compte rétrogradé continuerait d'afficher
            indéfiniment le logo déposé — une fonctionnalité facturée, servie
            gratuitement. La porte reste ICI et pas dans le composant : c'est la
            page qui connaît son `useGating`, et une porte recopiée dans un
            composant partagé deviendrait une seconde source de vérité sur le
            catalogue.
          -->
          <FinancesEnTeteEmetteur
            :emetteur="facture.emetteur"
            :logo-autorise="can('logoExploitation')"
          />

          <!-- Facture info -->
          <div class="text-right">
            <h1 class="text-3xl font-bold tracking-tight text-stone-900">FACTURE</h1>
            <p class="mt-1 text-lg font-semibold text-honey-deep">
              {{ facture.numero || 'Brouillon' }}
            </p>
            <p v-if="!facture.numero" class="text-[11px] text-stone-400 print:hidden">
              Numéro attribué à l'émission
            </p>
            <div class="mt-3 space-y-0.5 text-sm text-stone-500">
              <p>Date d'émission : {{ formatDate(facture.dateTransaction) }}</p>
              <p v-if="facture.dateEcheance">
                Date d'échéance : {{ formatDate(facture.dateEcheance) }}
              </p>
              <p v-else>Paiement : à réception</p>
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
                {{ formatMoney(montantLigneHt(ligne) ?? 0) }}
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
              class="flex justify-between text-sm text-honey-deep"
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

        <!-- Conditions de paiement — MENTIONS LÉGALES OBLIGATOIRES.
             Extraites dans leur propre composant : tant qu'elles vivaient au
             milieu de mille six cents lignes, aucun banc ne pouvait les
             exercer — et un `v-else` rattaché au mauvais `v-if` imprimait deux
             mentions de TVA contradictoires sur toute facture en franchise. -->
        <FinancesFactureMentions
          :echeance-formatee="facture.dateEcheance ? formatDate(facture.dateEcheance) : null"
          :mode-paiement-label="modePaiementLabel"
          :affiche-rib="afficheRib"
          :facturation="facturation"
          :is-franchise="isFranchise"
          :option-tva-debits="facture.emetteur?.optionTvaDebits === true"
          :taux-tva-list="tauxTvaList"
        />

        <!-- Footer / Identification -->
        <div
          class="mt-6 border-t border-stone-200 pt-4 text-center text-[10px] leading-relaxed text-stone-400"
        >
          <!-- Le pied de page est le bloc d'IDENTIFICATION : nom légal, jamais
               le nom commercial. C'est la mention obligatoire du vendeur, celle
               qui doit correspondre à l'annuaire des entreprises. -->
          <p v-if="facture.emetteur?.siret">
            {{ identite.legal }}
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
            :stocks-charges="stocksStatus !== 'pending'"
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
import { pdfTropLourd, refusPdfTropLourd } from '~/config/tailles-envoi';
import { identiteEmetteur, refusIdentiteEmetteur } from '~/config/identite-emetteur';
import type { FacturationPrefs } from '~/components/finances/FactureMentions.vue';

definePageMeta({ layout: 'default' });

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

interface Emetteur {
  nom: string | null;
  prenom: string | null;
  nomCommercial: string | null;
  logoUrl: string | null;
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
  emailEnvoyeLe: string | null;
  emailMessageId: string | null;
  emailDernierEchec: string | null;
  emetteur: Emetteur | null;
}

const route = useRoute();
const notifications = useNotifications();
const { updateFacture, updateStatut, envoyerFactureEmail } = useFinances();
const { can } = useGating();
const invoiceRef = ref<HTMLElement | null>(null);

const {
  data: responseData,
  status,
  error,
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
  dateTransaction: dateDuJour(),
  lignes: [],
  categorieOperation: 'livraison_biens',
});

const { data: clientsResp } = useFetch<ApiListResponse<Client>>('/api/clients', {
  query: { limit: 100 },
  key: 'facture-edit-clients',
  default: () => ({ data: [], pagination: { page: 1, limit: 100, total: 0, totalPages: 0 } }),
});
// `status` et non `data` : le `default` rend une liste vide dès le premier
// rendu, indiscernable d'un stock épuisé (cf. la même remarque sur /ventes).
const { data: stocksResp, status: stocksStatus } = useFetch<ApiListResponse<Stock>>('/api/stocks', {
  query: { limit: 100 },
  key: 'facture-edit-stocks',
  default: () => ({ data: [], pagination: { page: 1, limit: 100, total: 0, totalPages: 0 } }),
});

/**
 * ⚠️ L'écran d'édition d'une facture choisit un CLIENT et des ARTICLES — deux domaines que Maya écrit. Le client créé à la voix manquait à la liste, et l'apiculteur le recréait, en double.
 */
const { on: surDonneesFacture } = useDataBus();
surDonneesFacture(['client:created', 'client:updated', 'stock:updated', 'stock:mouvement'], () => {
  void refreshNuxtData(['facture-edit-clients', 'facture-edit-stocks']);
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
        // Même garde que le bouton : le lien `?print=1` est le chemin le plus
        // silencieux de tous, personne ne le regarde passer.
        setTimeout(() => {
          if (!refuseSiSansIdentite()) window.print();
        }, 500);
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

/**
 * QUI SIGNE CETTE FACTURE.
 *
 * ⚠️ LE REPLI SUR « APIGO » A DISPARU. Il valait
 * `[prenom, nom].join(' ') || 'APIGO'` — donc un compte au profil vide émettait
 * des factures signées du nom de l'ÉDITEUR du logiciel, avec le SIRET de
 * l'apiculteur juste en dessous. La règle vit désormais dans
 * `app/config/identite-emetteur.ts`, lue à l'identique par la route d'envoi et
 * par le générateur Factur-X : elle était recopiée à trois endroits, et le nom
 * commercial devait être la quatrième copie.
 */
const identite = computed(() => identiteEmetteur(facture.value?.emetteur));

/** Le refus d'émettre, affiché AVANT que l'apiculteur ne clique sur « Envoyer ». */
const refusIdentite = computed(() => refusIdentiteEmetteur(facture.value?.emetteur));

/** TVA ventilée par taux — applique le mode poids ET la remise (cohérent avec le total stocké). */
const tvaParTaux = computed(() => {
  const remise = Number(facture.value?.remise ?? 0);
  const ratio = remise > 0 ? (100 - remise) / 100 : 1;
  const byRate: Record<number, number> = {};
  for (const l of lignes.value) {
    const taux = l.tauxTva ?? 5.5;
    /**
     * Le HT de la ligne vient de `montantLigneHt` : le total STOCKÉ d'abord,
     * le calcul en repli. C'est ce que promettait déjà le commentaire de ce
     * bloc (« cohérent avec le total stocké ») — la formule, elle, recalculait
     * et pouvait donc s'écarter du total que le document affiche juste à côté.
     *
     * ⚠️ L'ACCUMULATION PAR TAUX NE CHANGE PAS. Sur une facture à taux mixtes,
     * la TVA du document (somme puis un seul arrondi) peut différer d'un
     * centime de la somme des ventilations arrondies par taux. C'est un écart
     * connu, et le corriger changerait des montants sur des factures DÉJÀ
     * ÉMISES : c'est une décision de l'apiculteur, pas un effet de bord.
     */
    const ht = montantLigneHt(l) ?? 0;
    /**
     * ⚠️ CETTE LIGNE N'APPELLE PAS `ligneTva`, ET C'EST DÉLIBÉRÉ.
     *
     * J'avais commencé par l'harmoniser — une seule formule, la règle du dépôt.
     * Puis je l'ai MESURÉE, et ma première mesure était fausse : elle faisait
     * bouger DEUX variables à la fois. Séparées, sur 457 600 lignes réalistes
     * (quantités 1→40, prix au centime, quatre taux, quatre remises) :
     * le chemin d'arrondi déplace un centime sur 327 lignes (0,0715 %), la
     * source du HT sur 260 autres (0,0568 %). Exemple du premier : 23,25 € à
     * 20 % remisés de 10 % donnent 4,19 € ici, 4,18 € avec `ligneTva`.
     *
     * La SOURCE, elle, reste `montantLigneHt` : ce n'est pas un rangement mais
     * une correction, puisque le total du document découle lui aussi de
     * `l.total` — l'ancienne ventilation recalculait un HT brut et pouvait donc
     * contredire le total imprimé juste en dessous.
     *
     * Le CHEMIN D'ARRONDI, lui, revient à l'ancien : `Math.round(x)` arrondit
     * un demi au supérieur, là où `round2` passe par une correction d'epsilon
     * qui ne rattrape pas les demi-centimes à ces ordres de grandeur (4,185 est
     * représenté 4,18499…). L'harmoniser n'aurait pas rendu la ventilation plus
     * juste, seulement différente.
     *
     * Or ces chiffres sont IMPRIMÉS SUR DES FACTURES DÉJÀ ÉMISES : rouvrir la
     * page d'une facture de l'an dernier en changerait la ventilation. Le dépôt
     * a déjà nommé cette question comme relevant de l'apiculteur (CLAUDE.md,
     * « ce qui reste ouvert »). Je ne la tranche donc pas au détour d'un
     * correctif : le chemin d'arrondi reste EXACTEMENT celui d'avant, et
     * `tests/unit/app/ventilationTvaGelee.test.ts` le fige pour que personne ne
     * l'harmonise sans le décider.
     */
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

/**
 * Les réglages du PDF vivent dans `app/utils/documentPdf.ts` : ils étaient
 * recopiés ici, et le bon de livraison n'en avait aucun. Ce ne sont pas des
 * réglages de confort — l'échelle et la qualité décident si l'envoi passe sous
 * le plafond de l'infrastructure.
 */
/**
 * ⚠️ LE PAPIER AUSSI. Le bandeau d'avertissement porte `print:hidden` — il ne
 * sort donc pas à l'impression — et ni `imprimer()` ni `downloadPDF()` ne
 * consultaient `refusIdentite`. Seuls le Factur-X et l'email refusaient. Un
 * profil sans nom produisait donc une facture papier dont l'en-tête était VIDE,
 * avec le SIRET juste en dessous : exactement le document qu'on cherche à
 * empêcher, par le chemin que prend l'apiculteur qui imprime pour joindre au
 * colis.
 *
 * Rien n'est perdu en refusant : la facture reste là, il manque un nom.
 */
function refuseSiSansIdentite(): boolean {
  if (!refusIdentite.value) return false;
  notifications.error(refusIdentite.value);
  return true;
}

function imprimer() {
  if (refuseSiSansIdentite()) return;
  window.print();
}

const pdfBusy = ref(false);
async function downloadPDF() {
  if (!invoiceRef.value) return;
  if (refuseSiSansIdentite()) return;
  pdfBusy.value = true;
  try {
    await telechargerPdf(invoiceRef.value, `facture-${facture.value?.numero ?? 'brouillon'}`);
  } catch {
    notifications.error('Erreur lors de la génération du PDF');
  } finally {
    pdfBusy.value = false;
  }
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
    const base64 = await pdfEnBase64(
      invoiceRef.value,
      `facture-${facture.value?.numero ?? 'brouillon'}`,
    );
    /**
     * ⚠️ ON DEVANCE LA COUPURE DE VERCEL. Au-delà de ~4,5 Mo de corps, la
     * plateforme rejette la requête AVANT qu'aucune ligne d'APIGO ne
     * s'exécute : ni le middleware de taille, ni la route, ni le moindre
     * `catch` ne la voient. L'apiculteur reçoit alors une erreur de
     * plateforme, sans phrase et sans porte de sortie. Le seul endroit où on
     * peut encore parler, c'est ici — avant d'envoyer.
     */
    if (pdfTropLourd(base64)) throw new Error(refusPdfTropLourd(base64.length));
    /**
     * ⚠️ ON NE FÊTE QUE CE QUE LE SERVEUR CONFIRME. La route ne répond
     * `sent: true` qu'après un envoi accepté par le service d'email ; un refus
     * remonte en 502 avec sa phrase, attrapée plus bas. Un `sent` absent — une
     * réponse tronquée, un contrat qui bouge — ne vaut PAS succès : il vaut
     * refus, sinon on remet le mensonge qu'on vient de retirer.
     */
    const resultat = await envoyerFactureEmail(route.params.id as string, base64);
    if (!resultat?.sent) {
      throw new Error(
        'L’envoi n’a pas été confirmé — la facture reste un brouillon. Réessayez, ou ' +
          'téléchargez le PDF pour l’envoyer depuis votre messagerie.',
      );
    }
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
      return 'bg-amber-100 text-amber-800';
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
