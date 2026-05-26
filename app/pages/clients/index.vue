<template>
  <div>
    <UiFeatureGate feature="clients" blur>
      <template #preview>
        <div class="space-y-4">
          <div class="h-10 w-full rounded-[8px] bg-[var(--surface-muted)]" />
          <div class="space-y-2">
            <div v-for="i in 5" :key="i" class="h-14 rounded-[8px] bg-[var(--surface-muted)]" />
          </div>
        </div>
      </template>

      <!-- Header -->
      <div class="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 class="font-display text-[26px] font-semibold tracking-tight text-[var(--text-primary)]">Clients</h1>
          <p class="mt-1 text-[13.5px] text-[var(--text-secondary)]">
            {{ pagination?.total ?? 0 }} client{{ (pagination?.total ?? 0) > 1 ? 's' : '' }} enregistré{{ (pagination?.total ?? 0) > 1 ? 's' : '' }} ·
            <NuxtLink to="/finances/ventes" class="text-[var(--honey-deep)] hover:underline">Voir les ventes →</NuxtLink>
          </p>
        </div>
        <button
          class="inline-flex items-center gap-1.5 rounded-[8px] bg-[var(--honey)] px-3.5 py-2 text-[13px] font-semibold text-white shadow-sm transition-all hover:bg-[var(--honey-dark)]"
          @click="showForm = true"
        >
          <UIcon name="i-lucide-plus" class="h-3.5 w-3.5" />
          Nouveau client
        </button>
      </div>

      <!-- Search -->
      <div class="mb-6 relative">
        <UIcon name="i-lucide-search" class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-quaternary)]" />
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Rechercher un client par nom, email, ville…"
          class="w-full rounded-[8px] border border-[var(--border-default)] bg-white py-2.5 pl-10 pr-4 text-[13px] text-[var(--text-primary)] placeholder-[var(--text-quaternary)] shadow-sm outline-none transition focus:border-[var(--honey)] focus:ring-2 focus:ring-[var(--honey)]/20"
        >
      </div>

      <!-- Loading -->
      <div v-if="loading" class="space-y-2">
        <div v-for="i in 5" :key="i" class="h-14 animate-pulse rounded-[8px] bg-[var(--surface-muted)]" />
      </div>

      <!-- Empty -->
      <UiEmptyState
        v-else-if="clientsList.length === 0"
        icon="i-lucide-users"
        title="Aucun client"
        description="Ajoutez votre premier client pour commencer"
        action-label="Nouveau client"
        @action="showForm = true"
      />

      <!-- Table -->
      <div v-else class="bg-white border border-[var(--border-default)] rounded-[12px] overflow-hidden">
        <table class="w-full">
          <thead>
            <tr class="bg-[var(--surface-muted)] border-b border-[var(--border-default)]">
              <th class="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-[var(--text-tertiary)]">Nom / Entreprise</th>
              <th class="hidden px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-[var(--text-tertiary)] sm:table-cell">Email</th>
              <th class="hidden px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-[var(--text-tertiary)] md:table-cell">Téléphone</th>
              <th class="hidden px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-[var(--text-tertiary)] lg:table-cell">Ville</th>
              <th class="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wide text-[var(--text-tertiary)]">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-[var(--border-faint)]">
            <tr
              v-for="client in clientsList"
              :key="client.id"
              class="transition-colors hover:bg-[var(--surface-muted)]/40"
            >
              <td class="px-4 py-3">
                <NuxtLink :to="`/clients/${client.id}`" class="flex items-center gap-3 group">
                  <div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--honey-soft)] text-[12px] font-bold text-[var(--honey-deep)]">
                    {{ getInitials(client) }}
                  </div>
                  <div class="min-w-0">
                    <p class="text-[13px] font-medium text-[var(--text-primary)] group-hover:text-[var(--honey-deep)] transition-colors truncate">
                      {{ client.entreprise || `${client.nom} ${client.prenom ?? ''}`.trim() }}
                    </p>
                    <span
                      v-if="client.type"
                      class="inline-block rounded-full px-1.5 py-0.5 text-[10px] font-semibold"
                      :class="typeClass(client.type)"
                    >{{ client.type }}</span>
                  </div>
                </NuxtLink>
              </td>
              <td class="hidden px-4 py-3 sm:table-cell">
                <span class="text-[12.5px] text-[var(--text-secondary)]">{{ client.email || '—' }}</span>
              </td>
              <td class="hidden px-4 py-3 md:table-cell">
                <span class="text-[12.5px] text-[var(--text-secondary)]">{{ client.telephone || '—' }}</span>
              </td>
              <td class="hidden px-4 py-3 lg:table-cell">
                <span class="text-[12.5px] text-[var(--text-secondary)]">{{ client.ville || '—' }}</span>
              </td>
              <td class="px-4 py-3 text-right">
                <NuxtLink
                  :to="`/clients/${client.id}`"
                  class="inline-flex items-center gap-1 text-[12px] font-medium text-[var(--honey-deep)] hover:underline"
                >
                  Voir
                  <UIcon name="i-lucide-chevron-right" class="h-3 w-3" />
                </NuxtLink>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Create modal -->
      <UModal v-model:open="showForm">
        <template #content>
          <div class="p-6">
            <h2 class="mb-4 text-[17px] font-semibold text-[var(--text-primary)]">Nouveau client</h2>
            <form class="space-y-4" @submit.prevent="handleCreate">
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="mb-1.5 block text-[12px] font-medium text-[var(--text-secondary)]">Nom *</label>
                  <input
                    v-model="form.nom"
                    type="text"
                    required
                    class="w-full rounded-[10px] border border-[var(--border-default)] bg-white px-3 py-2.5 text-[13px] text-[var(--text-primary)] outline-none transition focus:border-[var(--honey)] focus:ring-2 focus:ring-[var(--honey)]/20"
                  >
                </div>
                <div>
                  <label class="mb-1.5 block text-[12px] font-medium text-[var(--text-secondary)]">Prénom</label>
                  <input
                    v-model="form.prenom"
                    type="text"
                    class="w-full rounded-[10px] border border-[var(--border-default)] bg-white px-3 py-2.5 text-[13px] text-[var(--text-primary)] outline-none transition focus:border-[var(--honey)] focus:ring-2 focus:ring-[var(--honey)]/20"
                  >
                </div>
              </div>
              <div>
                <label class="mb-1.5 block text-[12px] font-medium text-[var(--text-secondary)]">Entreprise</label>
                <input
                  v-model="form.entreprise"
                  type="text"
                  class="w-full rounded-[10px] border border-[var(--border-default)] bg-white px-3 py-2.5 text-[13px] text-[var(--text-primary)] outline-none transition focus:border-[var(--honey)] focus:ring-2 focus:ring-[var(--honey)]/20"
                >
              </div>
              <div>
                <label class="mb-1.5 block text-[12px] font-medium text-[var(--text-secondary)]">Type</label>
                <select
                  v-model="form.type"
                  class="w-full rounded-[10px] border border-[var(--border-default)] bg-white px-3 py-2.5 text-[13px] text-[var(--text-primary)] outline-none transition focus:border-[var(--honey)] focus:ring-2 focus:ring-[var(--honey)]/20"
                >
                  <option value="">Non défini</option>
                  <option value="particulier">Particulier</option>
                  <option value="professionnel">Professionnel</option>
                  <option value="revendeur">Revendeur</option>
                </select>
              </div>
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="mb-1.5 block text-[12px] font-medium text-[var(--text-secondary)]">Email</label>
                  <input
                    v-model="form.email"
                    type="email"
                    class="w-full rounded-[10px] border border-[var(--border-default)] bg-white px-3 py-2.5 text-[13px] text-[var(--text-primary)] outline-none transition focus:border-[var(--honey)] focus:ring-2 focus:ring-[var(--honey)]/20"
                  >
                </div>
                <div>
                  <label class="mb-1.5 block text-[12px] font-medium text-[var(--text-secondary)]">Téléphone</label>
                  <input
                    v-model="form.telephone"
                    type="tel"
                    class="w-full rounded-[10px] border border-[var(--border-default)] bg-white px-3 py-2.5 text-[13px] text-[var(--text-primary)] outline-none transition focus:border-[var(--honey)] focus:ring-2 focus:ring-[var(--honey)]/20"
                  >
                </div>
              </div>
              <div>
                <label class="mb-1.5 block text-[12px] font-medium text-[var(--text-secondary)]">Adresse</label>
                <input
                  v-model="form.adresse"
                  type="text"
                  class="w-full rounded-[10px] border border-[var(--border-default)] bg-white px-3 py-2.5 text-[13px] text-[var(--text-primary)] outline-none transition focus:border-[var(--honey)] focus:ring-2 focus:ring-[var(--honey)]/20"
                >
              </div>
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="mb-1.5 block text-[12px] font-medium text-[var(--text-secondary)]">Code postal</label>
                  <input
                    v-model="form.codePostal"
                    type="text"
                    class="w-full rounded-[10px] border border-[var(--border-default)] bg-white px-3 py-2.5 text-[13px] text-[var(--text-primary)] outline-none transition focus:border-[var(--honey)] focus:ring-2 focus:ring-[var(--honey)]/20"
                  >
                </div>
                <div>
                  <label class="mb-1.5 block text-[12px] font-medium text-[var(--text-secondary)]">Ville</label>
                  <input
                    v-model="form.ville"
                    type="text"
                    class="w-full rounded-[10px] border border-[var(--border-default)] bg-white px-3 py-2.5 text-[13px] text-[var(--text-primary)] outline-none transition focus:border-[var(--honey)] focus:ring-2 focus:ring-[var(--honey)]/20"
                  >
                </div>
              </div>
              <div class="flex justify-end gap-2 pt-2">
                <UButton
                  label="Annuler"
                  variant="ghost"
                  color="neutral"
                  @click="showForm = false"
                />
                <UButton
                  type="submit"
                  label="Creer"
                  icon="i-lucide-check"
                  color="primary"
                  :loading="saving"
                />
              </div>
            </form>
          </div>
        </template>
      </UModal>
    </UiFeatureGate>
  </div>
</template>

<script setup lang="ts">
import type { Client } from '~/types/models';
import type { ApiListResponse } from '~/types/api';

definePageMeta({ layout: 'default' });

const notifications = useNotifications();
const { createClient } = useClients();

const searchQuery = ref('');
const searchDebounced = refDebounced(searchQuery, 300);
const showForm = ref(false);
const saving = ref(false);

const form = reactive({
  nom: '',
  prenom: '',
  entreprise: '',
  type: '' as '' | 'particulier' | 'professionnel' | 'revendeur',
  email: '',
  telephone: '',
  adresse: '',
  codePostal: '',
  ville: '',
});

const {
  data: clientsData,
  status,
  refresh,
} = useFetch<ApiListResponse<Client>>('/api/clients', {
  key: 'clients-page-list',
  query: { limit: 100, search: searchDebounced },
  default: () => ({ data: [], pagination: { page: 1, limit: 100, total: 0, totalPages: 0 } }),
  lazy: true,
});

const loading = computed(() => status.value === 'pending');
const clientsList = computed(() => clientsData.value?.data ?? []);
const pagination = computed(() => clientsData.value?.pagination);

function getInitials(client: Client): string {
  if (client.entreprise) return client.entreprise.slice(0, 2).toUpperCase();
  const first = client.nom?.[0] ?? '';
  const second = client.prenom?.[0] ?? '';
  return (first + second).toUpperCase() || '?';
}

function typeClass(type: string) {
  if (type === 'professionnel') return 'bg-blue-50 text-blue-700';
  if (type === 'revendeur') return 'bg-violet-50 text-violet-700';
  return 'bg-[var(--surface-muted)] text-[var(--text-secondary)]';
}

async function handleCreate() {
  saving.value = true;
  try {
    await createClient({
      nom: form.nom,
      prenom: form.prenom || undefined,
      entreprise: form.entreprise || undefined,
      type: form.type || undefined,
      email: form.email || undefined,
      telephone: form.telephone || undefined,
      adresse: form.adresse || undefined,
      codePostal: form.codePostal || undefined,
      ville: form.ville || undefined,
    });
    notifications.success('Client cree');
    showForm.value = false;
    Object.assign(form, {
      nom: '',
      prenom: '',
      entreprise: '',
      type: '',
      email: '',
      telephone: '',
      adresse: '',
      codePostal: '',
      ville: '',
    });
    await refresh();
  } catch (e: unknown) {
    notifications.error(getApiErrorMessage(e, 'Erreur lors de la creation'));
  } finally {
    saving.value = false;
  }
}
</script>
