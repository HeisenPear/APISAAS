<template>
  <div>
    <NuxtLink
      to="/clients"
      class="mb-4 inline-flex items-center gap-1 text-sm text-stone-500 transition-colors hover:text-stone-700"
    >
      <UIcon name="i-lucide-arrow-left" class="h-4 w-4" />
      Retour aux clients
    </NuxtLink>

    <!-- Loading -->
    <div v-if="loading" class="space-y-4">
      <div class="h-8 w-48 animate-pulse rounded-lg bg-stone-100" />
      <div class="h-64 animate-pulse rounded-2xl bg-stone-100" />
    </div>

    <template v-else-if="client">
      <!-- Header -->
      <div class="mb-6 flex items-start justify-between">
        <div>
          <h1 class="text-2xl font-bold tracking-tight text-stone-900">
            {{ client.entreprise || `${client.nom} ${client.prenom ?? ''}`.trim() }}
          </h1>
          <div class="mt-1 flex items-center gap-2 text-sm text-stone-500">
            <span
              v-if="client.type"
              class="rounded-md px-1.5 py-0.5 text-xs font-medium"
              :class="typeClass(client.type)"
            >
              {{ client.type }}
            </span>
            <span v-if="client.ville">{{ client.ville }}</span>
          </div>
        </div>
        <div class="flex gap-2">
          <UButton
            :label="editing ? 'Annuler' : 'Modifier'"
            :icon="editing ? 'i-lucide-x' : 'i-lucide-pencil'"
            :variant="editing ? 'ghost' : 'outline'"
            color="neutral"
            @click="toggleEdit"
          />
          <UButton
            v-if="!editing"
            label="Supprimer"
            icon="i-lucide-trash-2"
            variant="ghost"
            color="error"
            @click="handleDelete"
          />
        </div>
      </div>

      <!-- Edit form -->
      <div v-if="editing" class="rounded-2xl border border-stone-200/60 bg-white p-6 shadow-sm">
        <form class="space-y-4" @submit.prevent="handleUpdate">
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="mb-1 block text-sm text-stone-600">Nom</label>
              <input
                v-model="editForm.nom"
                type="text"
                required
                class="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
              />
            </div>
            <div>
              <label class="mb-1 block text-sm text-stone-600">Prenom</label>
              <input
                v-model="editForm.prenom"
                type="text"
                class="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
              />
            </div>
            <div>
              <label class="mb-1 block text-sm text-stone-600">Entreprise</label>
              <input
                v-model="editForm.entreprise"
                type="text"
                class="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
              />
            </div>
            <div>
              <label class="mb-1 block text-sm text-stone-600">Type</label>
              <select
                v-model="editForm.type"
                class="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
              >
                <option value="">Non defini</option>
                <option value="particulier">Particulier</option>
                <option value="professionnel">Professionnel</option>
                <option value="revendeur">Revendeur</option>
              </select>
            </div>
            <div>
              <label class="mb-1 block text-sm text-stone-600">Email</label>
              <input
                v-model="editForm.email"
                type="email"
                class="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
              />
            </div>
            <div>
              <label class="mb-1 block text-sm text-stone-600">Telephone</label>
              <input
                v-model="editForm.telephone"
                type="tel"
                class="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
              />
            </div>
          </div>
          <div>
            <label class="mb-1 block text-sm text-stone-600">Adresse</label>
            <input
              v-model="editForm.adresse"
              type="text"
              class="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
            />
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="mb-1 block text-sm text-stone-600">Code postal</label>
              <input
                v-model="editForm.codePostal"
                type="text"
                class="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
              />
            </div>
            <div>
              <label class="mb-1 block text-sm text-stone-600">Ville</label>
              <input
                v-model="editForm.ville"
                type="text"
                class="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
              />
            </div>
          </div>
          <div>
            <label class="mb-1 block text-sm text-stone-600">SIRET</label>
            <input
              v-model="editForm.siret"
              type="text"
              class="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
            />
          </div>
          <div>
            <label class="mb-1 block text-sm text-stone-600">
              SIREN
              <span class="font-normal text-stone-400"
                >(9 chiffres — obligatoire pour la facturation électronique)</span
              >
            </label>
            <input
              v-model="editForm.siren"
              type="text"
              maxlength="9"
              placeholder="123456789"
              class="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
            />
            <p
              v-if="editForm.siren && !/^\d{9}$/.test(editForm.siren)"
              class="mt-1 text-xs text-red-500"
            >
              Le SIREN doit contenir exactement 9 chiffres
            </p>
          </div>
          <div class="sm:col-span-2">
            <label class="mb-1 flex items-center gap-2 text-sm text-stone-600">
              <input v-model="showAdresseLivraison" type="checkbox" class="rounded" />
              Adresse de livraison différente de l'adresse de facturation
            </label>
            <div v-if="showAdresseLivraison" class="mt-2 space-y-2">
              <input
                v-model="editForm.adresseLivraison"
                type="text"
                placeholder="Adresse de livraison"
                class="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
              />
              <div class="grid grid-cols-2 gap-2">
                <input
                  v-model="editForm.codePostalLivraison"
                  type="text"
                  placeholder="Code postal"
                  class="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                />
                <input
                  v-model="editForm.villeLivraison"
                  type="text"
                  placeholder="Ville"
                  class="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                />
              </div>
            </div>
          </div>
          <div>
            <label class="mb-1 block text-sm text-stone-600">Notes</label>
            <textarea
              v-model="editForm.notes"
              :rows="3"
              class="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
            />
          </div>
          <div class="flex justify-end gap-2">
            <UButton label="Annuler" variant="ghost" color="neutral" @click="editing = false" />
            <UButton
              type="submit"
              label="Enregistrer"
              icon="i-lucide-check"
              color="primary"
              :loading="saving"
            />
          </div>
        </form>
      </div>

      <!-- Info cards -->
      <div v-else class="space-y-6">
        <div class="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <!-- Contact -->
          <div class="rounded-2xl border border-stone-200/60 bg-white p-6 shadow-sm">
            <h3 class="mb-4 text-sm font-semibold uppercase tracking-wider text-stone-400">
              Contact
            </h3>
            <dl class="space-y-3 text-sm">
              <div v-if="client.email" class="flex items-center gap-2">
                <UIcon name="i-lucide-mail" class="h-4 w-4 text-stone-400" />
                <a :href="`mailto:${client.email}`" class="text-amber-600 hover:underline">{{
                  client.email
                }}</a>
              </div>
              <div v-if="client.telephone" class="flex items-center gap-2">
                <UIcon name="i-lucide-phone" class="h-4 w-4 text-stone-400" />
                <a :href="`tel:${client.telephone}`" class="text-stone-700">{{
                  client.telephone
                }}</a>
              </div>
              <div v-if="client.adresse || client.ville" class="flex items-start gap-2">
                <UIcon name="i-lucide-map-pin" class="mt-0.5 h-4 w-4 text-stone-400" />
                <span class="text-stone-700">
                  {{
                    [client.adresse, [client.codePostal, client.ville].filter(Boolean).join(' ')]
                      .filter(Boolean)
                      .join(', ')
                  }}
                </span>
              </div>
              <div v-if="client.siret" class="flex items-center gap-2">
                <UIcon name="i-lucide-building-2" class="h-4 w-4 text-stone-400" />
                <span class="text-stone-700">SIRET: {{ client.siret }}</span>
              </div>
              <div v-if="client.siren" class="flex items-center gap-2">
                <UIcon name="i-lucide-hash" class="h-4 w-4 text-stone-400" />
                <span class="text-stone-700">SIREN: {{ client.siren }}</span>
              </div>
              <div v-if="client.adresseLivraison" class="flex items-start gap-2">
                <UIcon name="i-lucide-truck" class="mt-0.5 h-4 w-4 text-stone-400" />
                <span class="text-stone-700">
                  Livraison :
                  {{
                    [
                      client.adresseLivraison,
                      [client.codePostalLivraison, client.villeLivraison].filter(Boolean).join(' '),
                    ]
                      .filter(Boolean)
                      .join(', ')
                  }}
                </span>
              </div>
            </dl>
          </div>

          <!-- Notes -->
          <div class="rounded-2xl border border-stone-200/60 bg-white p-6 shadow-sm">
            <h3 class="mb-4 text-sm font-semibold uppercase tracking-wider text-stone-400">
              Notes
            </h3>
            <p v-if="client.notes" class="text-sm text-stone-600 whitespace-pre-line">
              {{ client.notes }}
            </p>
            <p v-else class="text-sm text-stone-400">Aucune note</p>
          </div>
        </div>

        <!-- Transactions -->
        <div class="rounded-2xl border border-stone-200/60 bg-white p-6 shadow-sm">
          <div class="mb-4 flex items-center justify-between">
            <h3 class="text-sm font-semibold uppercase tracking-wider text-stone-400">
              Transactions recentes
            </h3>
            <UButton
              label="Nouvelle vente"
              icon="i-lucide-plus"
              size="sm"
              color="primary"
              variant="ghost"
              @click="navigateTo(`/finances/ventes?clientId=${client.id}`)"
            />
          </div>
          <div
            v-if="clientTransactions.length === 0"
            class="py-4 text-center text-sm text-stone-400"
          >
            Aucune transaction
          </div>
          <div v-else class="space-y-2">
            <div
              v-for="t in clientTransactions"
              :key="t.id"
              class="flex items-center justify-between rounded-xl bg-stone-50 px-4 py-3"
            >
              <div>
                <p class="text-sm font-medium text-stone-900">{{ t.numero }}</p>
                <p class="text-xs text-stone-400">{{ formatDate(t.dateTransaction) }}</p>
              </div>
              <div class="flex items-center gap-3">
                <span
                  class="rounded-md px-2 py-0.5 text-xs font-medium"
                  :class="statutClass(t.statut)"
                >
                  {{ t.statut }}
                </span>
                <span class="text-sm font-semibold text-stone-900">{{
                  formatMoney(Number(t.total ?? 0))
                }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import type { Client, Transaction } from '~/types/models';
import type { ApiResponse } from '~/types/api';

definePageMeta({ layout: 'default' });

const route = useRoute();
const notifications = useNotifications();
const { updateClient, deleteClient } = useClients();

const editing = ref(false);
const saving = ref(false);
const showAdresseLivraison = ref(false);

const { data: responseData, status } = useFetch<
  ApiResponse<Client & { transactions: Transaction[] }>
>(`/api/clients/${route.params.id}`, {
  key: `client-${route.params.id}`,
  default: () => ({ data: null as unknown as Client & { transactions: Transaction[] } }),
});

const loading = computed(() => status.value === 'pending');
const client = computed(() => responseData.value?.data);
const clientTransactions = computed(() => client.value?.transactions ?? []);

const editForm = reactive({
  nom: '',
  prenom: '',
  entreprise: '',
  type: '' as string,
  email: '',
  telephone: '',
  adresse: '',
  codePostal: '',
  ville: '',
  siret: '',
  siren: '',
  adresseLivraison: '',
  codePostalLivraison: '',
  villeLivraison: '',
  notes: '',
});

function toggleEdit() {
  if (!editing.value && client.value) {
    Object.assign(editForm, {
      nom: client.value.nom ?? '',
      prenom: client.value.prenom ?? '',
      entreprise: client.value.entreprise ?? '',
      type: client.value.type ?? '',
      email: client.value.email ?? '',
      telephone: client.value.telephone ?? '',
      adresse: client.value.adresse ?? '',
      codePostal: client.value.codePostal ?? '',
      ville: client.value.ville ?? '',
      siret: client.value.siret ?? '',
      siren: client.value.siren ?? '',
      adresseLivraison: client.value.adresseLivraison ?? '',
      codePostalLivraison: client.value.codePostalLivraison ?? '',
      villeLivraison: client.value.villeLivraison ?? '',
      notes: client.value.notes ?? '',
    });
    showAdresseLivraison.value = !!client.value.adresseLivraison;
  }
  editing.value = !editing.value;
}

async function handleUpdate() {
  saving.value = true;
  try {
    await updateClient(route.params.id as string, {
      nom: editForm.nom,
      prenom: editForm.prenom || undefined,
      entreprise: editForm.entreprise || undefined,
      type: (editForm.type as 'particulier' | 'professionnel' | 'revendeur') || undefined,
      email: editForm.email || undefined,
      telephone: editForm.telephone || undefined,
      adresse: editForm.adresse || undefined,
      codePostal: editForm.codePostal || undefined,
      ville: editForm.ville || undefined,
      siret: editForm.siret || undefined,
      siren: editForm.siren || undefined,
      adresseLivraison: editForm.adresseLivraison || undefined,
      codePostalLivraison: editForm.codePostalLivraison || undefined,
      villeLivraison: editForm.villeLivraison || undefined,
      notes: editForm.notes || undefined,
    });
    notifications.success('Client mis a jour');
    editing.value = false;
    await refreshNuxtData(`client-${route.params.id}`);
  } catch (e: unknown) {
    notifications.error(getApiErrorMessage(e, 'Erreur lors de la mise a jour'));
  } finally {
    saving.value = false;
  }
}

async function handleDelete() {
  if (!confirm('Voulez-vous vraiment supprimer ce client ?')) return;
  try {
    await deleteClient(route.params.id as string);
    notifications.success('Client supprime');
    await navigateTo('/clients');
  } catch (e: unknown) {
    notifications.error(getApiErrorMessage(e, 'Erreur lors de la suppression'));
  }
}

function typeClass(type: string) {
  if (type === 'professionnel') return 'bg-blue-50 text-blue-700';
  if (type === 'revendeur') return 'bg-violet-50 text-violet-700';
  return 'bg-stone-100 text-stone-600';
}

function statutClass(statut: string) {
  switch (statut) {
    case 'payee':
      return 'bg-emerald-50 text-emerald-700';
    case 'envoyee':
      return 'bg-blue-50 text-blue-700';
    case 'en_retard':
      return 'bg-red-50 text-red-700';
    case 'annulee':
      return 'bg-stone-100 text-stone-500';
    default:
      return 'bg-amber-50 text-amber-700';
  }
}

function formatDate(d: string | Date) {
  return new Date(d).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function formatMoney(amount: number) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(amount);
}
</script>
