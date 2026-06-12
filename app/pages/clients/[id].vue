<template>
  <div>
    <!-- Back nav -->
    <NuxtLink
      to="/clients"
      class="mb-6 inline-flex items-center gap-1.5 text-[13px] font-medium text-[var(--text-tertiary)] transition-colors hover:text-[var(--text-secondary)]"
    >
      <UIcon name="i-lucide-arrow-left" class="h-3.5 w-3.5" />
      Clients
    </NuxtLink>

    <!-- Loading -->
    <div v-if="loading" class="space-y-4">
      <div class="h-8 w-48 animate-pulse rounded-[8px] bg-[var(--surface-muted)]" />
      <div class="h-64 animate-pulse rounded-[14px] bg-[var(--surface-muted)]" />
    </div>

    <template v-else-if="client">
      <!-- Header -->
      <div class="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1
            class="font-display text-[26px] font-semibold tracking-tight text-[var(--text-primary)]"
          >
            {{ client.entreprise || `${client.nom} ${client.prenom ?? ''}`.trim() }}
          </h1>
          <div class="mt-2 flex items-center gap-2.5">
            <span
              v-if="client.type"
              class="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold"
              :class="typeClass(client.type)"
              >{{ client.type }}</span
            >
            <span
              v-if="client.email"
              class="flex items-center gap-1 text-[13px] text-[var(--text-secondary)]"
            >
              <UIcon name="i-lucide-mail" class="h-3.5 w-3.5 text-[var(--text-tertiary)]" />
              {{ client.email }}
            </span>
            <span
              v-if="client.telephone"
              class="flex items-center gap-1 text-[13px] text-[var(--text-secondary)]"
            >
              <UIcon name="i-lucide-phone" class="h-3.5 w-3.5 text-[var(--text-tertiary)]" />
              {{ client.telephone }}
            </span>
            <span v-if="client.ville" class="text-[13px] text-[var(--text-tertiary)]">{{
              [client.codePostal, client.ville].filter(Boolean).join(' ')
            }}</span>
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
      <div v-if="editing" class="rounded-[14px] border border-[var(--border-default)] bg-white p-6">
        <form class="space-y-4" @submit.prevent="handleUpdate">
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="mb-1.5 block text-[12px] font-medium text-[var(--text-secondary)]"
                >Nom</label
              >
              <input
                v-model="editForm.nom"
                type="text"
                required
                class="w-full rounded-[10px] border border-[var(--border-default)] bg-white px-3 py-2.5 text-[13px] text-[var(--text-primary)] outline-none transition focus:border-[var(--honey)] focus:ring-2 focus:ring-[var(--honey)]/20"
              />
            </div>
            <div>
              <label class="mb-1.5 block text-[12px] font-medium text-[var(--text-secondary)]"
                >Prénom</label
              >
              <input
                v-model="editForm.prenom"
                type="text"
                class="w-full rounded-[10px] border border-[var(--border-default)] bg-white px-3 py-2.5 text-[13px] text-[var(--text-primary)] outline-none transition focus:border-[var(--honey)] focus:ring-2 focus:ring-[var(--honey)]/20"
              />
            </div>
            <div>
              <label class="mb-1.5 block text-[12px] font-medium text-[var(--text-secondary)]"
                >Entreprise</label
              >
              <input
                v-model="editForm.entreprise"
                type="text"
                class="w-full rounded-[10px] border border-[var(--border-default)] bg-white px-3 py-2.5 text-[13px] text-[var(--text-primary)] outline-none transition focus:border-[var(--honey)] focus:ring-2 focus:ring-[var(--honey)]/20"
              />
            </div>
            <div>
              <label class="mb-1.5 block text-[12px] font-medium text-[var(--text-secondary)]"
                >Type</label
              >
              <select
                v-model="editForm.type"
                class="w-full rounded-[10px] border border-[var(--border-default)] bg-white px-3 py-2.5 text-[13px] text-[var(--text-primary)] outline-none transition focus:border-[var(--honey)] focus:ring-2 focus:ring-[var(--honey)]/20"
              >
                <option value="">Non défini</option>
                <option value="particulier">Particulier</option>
                <option value="professionnel">Professionnel</option>
                <option value="revendeur">Revendeur</option>
              </select>
            </div>
            <div>
              <label class="mb-1.5 block text-[12px] font-medium text-[var(--text-secondary)]"
                >Email</label
              >
              <input
                v-model="editForm.email"
                type="email"
                class="w-full rounded-[10px] border border-[var(--border-default)] bg-white px-3 py-2.5 text-[13px] text-[var(--text-primary)] outline-none transition focus:border-[var(--honey)] focus:ring-2 focus:ring-[var(--honey)]/20"
              />
            </div>
            <div>
              <label class="mb-1.5 block text-[12px] font-medium text-[var(--text-secondary)]"
                >Téléphone</label
              >
              <input
                v-model="editForm.telephone"
                type="tel"
                class="w-full rounded-[10px] border border-[var(--border-default)] bg-white px-3 py-2.5 text-[13px] text-[var(--text-primary)] outline-none transition focus:border-[var(--honey)] focus:ring-2 focus:ring-[var(--honey)]/20"
              />
            </div>
          </div>
          <div>
            <label class="mb-1.5 block text-[12px] font-medium text-[var(--text-secondary)]"
              >Adresse</label
            >
            <input
              v-model="editForm.adresse"
              type="text"
              class="w-full rounded-[10px] border border-[var(--border-default)] bg-white px-3 py-2.5 text-[13px] text-[var(--text-primary)] outline-none transition focus:border-[var(--honey)] focus:ring-2 focus:ring-[var(--honey)]/20"
            />
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="mb-1.5 block text-[12px] font-medium text-[var(--text-secondary)]"
                >Code postal</label
              >
              <input
                v-model="editForm.codePostal"
                type="text"
                class="w-full rounded-[10px] border border-[var(--border-default)] bg-white px-3 py-2.5 text-[13px] text-[var(--text-primary)] outline-none transition focus:border-[var(--honey)] focus:ring-2 focus:ring-[var(--honey)]/20"
              />
            </div>
            <div>
              <label class="mb-1.5 block text-[12px] font-medium text-[var(--text-secondary)]"
                >Ville</label
              >
              <input
                v-model="editForm.ville"
                type="text"
                class="w-full rounded-[10px] border border-[var(--border-default)] bg-white px-3 py-2.5 text-[13px] text-[var(--text-primary)] outline-none transition focus:border-[var(--honey)] focus:ring-2 focus:ring-[var(--honey)]/20"
              />
            </div>
          </div>
          <div>
            <label class="mb-1.5 block text-[12px] font-medium text-[var(--text-secondary)]"
              >SIRET</label
            >
            <input
              v-model="editForm.siret"
              type="text"
              class="w-full rounded-[10px] border border-[var(--border-default)] bg-white px-3 py-2.5 text-[13px] text-[var(--text-primary)] outline-none transition focus:border-[var(--honey)] focus:ring-2 focus:ring-[var(--honey)]/20"
            />
          </div>
          <div>
            <label class="mb-1.5 block text-[12px] font-medium text-[var(--text-secondary)]">
              SIREN
              <span class="font-normal text-[var(--text-quaternary)]"
                >(9 chiffres — obligatoire pour la facturation électronique)</span
              >
            </label>
            <input
              v-model="editForm.siren"
              type="text"
              maxlength="9"
              placeholder="123456789"
              class="w-full rounded-[10px] border border-[var(--border-default)] bg-white px-3 py-2.5 text-[13px] text-[var(--text-primary)] outline-none transition focus:border-[var(--honey)] focus:ring-2 focus:ring-[var(--honey)]/20"
            />
            <p
              v-if="editForm.siren && !/^\d{9}$/.test(editForm.siren)"
              class="mt-1 text-xs text-red-500"
            >
              Le SIREN doit contenir exactement 9 chiffres
            </p>
          </div>
          <div class="sm:col-span-2">
            <label
              class="mb-1.5 flex items-center gap-2 text-[12px] font-medium text-[var(--text-secondary)]"
            >
              <input v-model="showAdresseLivraison" type="checkbox" class="rounded" />
              Adresse de livraison différente de l'adresse de facturation
            </label>
            <div v-if="showAdresseLivraison" class="mt-2 space-y-2">
              <input
                v-model="editForm.adresseLivraison"
                type="text"
                placeholder="Adresse de livraison"
                class="w-full rounded-[10px] border border-[var(--border-default)] bg-white px-3 py-2.5 text-[13px] text-[var(--text-primary)] outline-none transition focus:border-[var(--honey)] focus:ring-2 focus:ring-[var(--honey)]/20"
              />
              <div class="grid grid-cols-2 gap-2">
                <input
                  v-model="editForm.codePostalLivraison"
                  type="text"
                  placeholder="Code postal"
                  class="w-full rounded-[10px] border border-[var(--border-default)] bg-white px-3 py-2.5 text-[13px] text-[var(--text-primary)] outline-none transition focus:border-[var(--honey)] focus:ring-2 focus:ring-[var(--honey)]/20"
                />
                <input
                  v-model="editForm.villeLivraison"
                  type="text"
                  placeholder="Ville"
                  class="w-full rounded-[10px] border border-[var(--border-default)] bg-white px-3 py-2.5 text-[13px] text-[var(--text-primary)] outline-none transition focus:border-[var(--honey)] focus:ring-2 focus:ring-[var(--honey)]/20"
                />
              </div>
            </div>
          </div>
          <div>
            <label class="mb-1.5 block text-[12px] font-medium text-[var(--text-secondary)]"
              >Notes</label
            >
            <textarea
              v-model="editForm.notes"
              :rows="3"
              class="w-full rounded-[10px] border border-[var(--border-default)] bg-white px-3 py-2.5 text-[13px] text-[var(--text-primary)] outline-none transition focus:border-[var(--honey)] focus:ring-2 focus:ring-[var(--honey)]/20"
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

      <!-- Info sections -->
      <div v-else class="space-y-8">
        <!-- 01 — Commandes -->
        <div>
          <div class="mb-4 flex items-center justify-between">
            <p
              class="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--honey-deep)]"
            >
              01 — Commandes
            </p>
            <button
              class="inline-flex items-center gap-1 text-[12px] font-medium text-[var(--honey-deep)] hover:underline"
              @click="navigateTo(`/finances/ventes?clientId=${client.id}`)"
            >
              <UIcon name="i-lucide-plus" class="h-3 w-3" />
              Nouvelle vente
            </button>
          </div>
          <div
            v-if="clientTransactions.length === 0"
            class="bg-white border border-[var(--border-default)] rounded-[14px] py-8 text-center text-[13px] text-[var(--text-tertiary)]"
          >
            Aucune commande
          </div>
          <div
            v-else
            class="bg-white border border-[var(--border-default)] rounded-[12px] overflow-hidden"
          >
            <table class="w-full">
              <thead>
                <tr class="bg-[var(--surface-muted)] border-b border-[var(--border-default)]">
                  <th
                    class="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-[var(--text-tertiary)]"
                  >
                    N° facture
                  </th>
                  <th
                    class="hidden px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-[var(--text-tertiary)] sm:table-cell"
                  >
                    Date
                  </th>
                  <th
                    class="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wide text-[var(--text-tertiary)]"
                  >
                    Montant
                  </th>
                  <th
                    class="px-4 py-3 text-center text-[11px] font-semibold uppercase tracking-wide text-[var(--text-tertiary)]"
                  >
                    Statut
                  </th>
                </tr>
              </thead>
              <tbody class="divide-y divide-[var(--border-faint)]">
                <tr
                  v-for="t in clientTransactions"
                  :key="t.id"
                  class="transition-colors hover:bg-[var(--surface-muted)]/40"
                >
                  <td class="px-4 py-3">
                    <NuxtLink
                      :to="`/finances/facture/${t.id}`"
                      class="text-[13px] font-semibold text-[var(--text-primary)] hover:text-[var(--honey-deep)] transition-colors"
                    >
                      {{ t.numero || '—' }}
                    </NuxtLink>
                  </td>
                  <td class="hidden px-4 py-3 sm:table-cell">
                    <span class="text-[12.5px] text-[var(--text-secondary)]">{{
                      formatDate(t.dateTransaction)
                    }}</span>
                  </td>
                  <td class="px-4 py-3 text-right">
                    <span class="text-[13px] font-bold text-[var(--text-primary)]">{{
                      formatMoney(Number(t.total ?? 0))
                    }}</span>
                  </td>
                  <td class="px-4 py-3 text-center">
                    <span
                      class="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold"
                      :class="statutClass(t.statut)"
                    >
                      {{ t.statut }}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- 02 — Informations -->
        <div>
          <p
            class="mb-4 text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--honey-deep)]"
          >
            02 — Informations
          </p>
          <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <!-- Contact details -->
            <div class="bg-white border border-[var(--border-default)] rounded-[14px] p-5">
              <p
                class="mb-4 text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--text-tertiary)]"
              >
                Contact
              </p>
              <dl class="space-y-3">
                <div v-if="client.email" class="flex items-start gap-2.5">
                  <UIcon
                    name="i-lucide-mail"
                    class="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--text-tertiary)]"
                  />
                  <a
                    :href="`mailto:${client.email}`"
                    class="text-[13px] text-[var(--honey-deep)] hover:underline"
                    >{{ client.email }}</a
                  >
                </div>
                <div v-if="client.telephone" class="flex items-start gap-2.5">
                  <UIcon
                    name="i-lucide-phone"
                    class="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--text-tertiary)]"
                  />
                  <a
                    :href="`tel:${client.telephone}`"
                    class="text-[13px] text-[var(--text-secondary)]"
                    >{{ client.telephone }}</a
                  >
                </div>
                <div v-if="client.adresse || client.ville" class="flex items-start gap-2.5">
                  <UIcon
                    name="i-lucide-map-pin"
                    class="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--text-tertiary)]"
                  />
                  <span class="text-[13px] text-[var(--text-secondary)]">
                    {{
                      [client.adresse, [client.codePostal, client.ville].filter(Boolean).join(' ')]
                        .filter(Boolean)
                        .join(', ')
                    }}
                  </span>
                </div>
                <div v-if="client.siret" class="flex items-start gap-2.5">
                  <UIcon
                    name="i-lucide-building-2"
                    class="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--text-tertiary)]"
                  />
                  <span class="text-[13px] text-[var(--text-secondary)]"
                    >SIRET : {{ client.siret }}</span
                  >
                </div>
                <div v-if="client.siren" class="flex items-start gap-2.5">
                  <UIcon
                    name="i-lucide-hash"
                    class="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--text-tertiary)]"
                  />
                  <span class="text-[13px] text-[var(--text-secondary)]"
                    >SIREN : {{ client.siren }}</span
                  >
                </div>
                <div v-if="client.adresseLivraison" class="flex items-start gap-2.5">
                  <UIcon
                    name="i-lucide-truck"
                    class="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--text-tertiary)]"
                  />
                  <span class="text-[13px] text-[var(--text-secondary)]">
                    Livraison :
                    {{
                      [
                        client.adresseLivraison,
                        [client.codePostalLivraison, client.villeLivraison]
                          .filter(Boolean)
                          .join(' '),
                      ]
                        .filter(Boolean)
                        .join(', ')
                    }}
                  </span>
                </div>
              </dl>
            </div>
            <!-- Notes -->
            <div class="bg-white border border-[var(--border-default)] rounded-[14px] p-5">
              <p
                class="mb-4 text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--text-tertiary)]"
              >
                Notes
              </p>
              <p
                v-if="client.notes"
                class="whitespace-pre-line text-[13px] text-[var(--text-secondary)]"
              >
                {{ client.notes }}
              </p>
              <p v-else class="text-[13px] text-[var(--text-quaternary)]">Aucune note</p>
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
    notifications.success('Client mis à jour');
    editing.value = false;
    await refreshNuxtData(`client-${route.params.id}`);
  } catch (e: unknown) {
    notifications.error(getApiErrorMessage(e, 'Erreur lors de la mise à jour'));
  } finally {
    saving.value = false;
  }
}

async function handleDelete() {
  if (
    !confirm(
      'Supprimer ce client ? Vous perdrez aussi son historique de commandes, et c’est définitif.',
    )
  )
    return;
  try {
    await deleteClient(route.params.id as string);
    notifications.success('Client supprimé');
    await navigateTo('/clients');
  } catch (e: unknown) {
    notifications.error(getApiErrorMessage(e, 'Erreur lors de la suppression'));
  }
}

function typeClass(type: string) {
  if (type === 'professionnel') return 'bg-blue-50 text-blue-700';
  if (type === 'revendeur') return 'bg-violet-50 text-violet-700';
  return 'bg-[var(--surface-muted)] text-[var(--text-secondary)]';
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
      return 'bg-[var(--surface-muted)] text-[var(--text-tertiary)]';
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
