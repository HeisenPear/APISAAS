<template>
  <div>
    <UiFeatureGate feature="clients" blur>
      <template #preview>
        <div class="space-y-4">
          <div class="flex items-center justify-between mb-6">
            <div class="h-8 w-32 rounded-xl bg-stone-100" />
            <div class="h-8 w-28 rounded-xl bg-stone-100" />
          </div>
          <div class="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <div v-for="i in 3" :key="i" class="h-20 rounded-2xl bg-stone-100" />
          </div>
          <div class="space-y-2">
            <div v-for="i in 5" :key="i" class="h-14 rounded-xl bg-stone-100" />
          </div>
        </div>
      </template>

      <!-- Header -->
      <div class="mb-6 flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold tracking-tight text-stone-900">Clients</h1>
          <p class="mt-1 text-sm text-stone-500">Gerez vos clients et contacts</p>
        </div>
        <UButton
          label="Nouveau client"
          icon="i-lucide-plus"
          color="primary"
          @click="showForm = true"
        />
      </div>

      <!-- KPIs -->
      <div class="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
        <div class="rounded-2xl border border-stone-200/60 bg-white p-4 shadow-sm">
          <p class="text-xs text-stone-500">Total clients</p>
          <p class="mt-1 text-2xl font-bold text-stone-900">{{ pagination?.total ?? 0 }}</p>
        </div>
        <div class="rounded-2xl border border-stone-200/60 bg-white p-4 shadow-sm">
          <p class="text-xs text-stone-500">Professionnels</p>
          <p class="mt-1 text-2xl font-bold text-amber-600">
            {{ clientsList.filter((c) => c.type === 'professionnel').length }}
          </p>
        </div>
        <div class="rounded-2xl border border-stone-200/60 bg-white p-4 shadow-sm">
          <p class="text-xs text-stone-500">Particuliers</p>
          <p class="mt-1 text-2xl font-bold text-stone-600">
            {{ clientsList.filter((c) => c.type === 'particulier').length }}
          </p>
        </div>
      </div>

      <!-- Search -->
      <div class="mb-4">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Rechercher un client..."
          class="w-full rounded-xl border border-stone-200 bg-white px-4 py-2.5 text-sm text-stone-700 shadow-sm focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
        />
      </div>

      <!-- Loading -->
      <div v-if="loading" class="space-y-3">
        <div v-for="i in 5" :key="i" class="h-16 animate-pulse rounded-2xl bg-stone-100" />
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

      <!-- List -->
      <div v-else class="space-y-2">
        <NuxtLink
          v-for="client in clientsList"
          :key="client.id"
          :to="`/clients/${client.id}`"
          class="flex items-center gap-4 rounded-2xl border border-stone-200/60 bg-white p-4 shadow-sm transition-colors hover:bg-stone-50"
        >
          <div
            class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-100 text-sm font-bold text-amber-700"
          >
            {{ getInitials(client) }}
          </div>
          <div class="min-w-0 flex-1">
            <div class="flex items-center gap-2">
              <p class="truncate text-sm font-medium text-stone-900">
                {{ client.entreprise || `${client.nom} ${client.prenom ?? ''}`.trim() }}
              </p>
              <span
                v-if="client.type"
                class="shrink-0 rounded-md px-1.5 py-0.5 text-xs font-medium"
                :class="typeClass(client.type)"
              >
                {{ client.type }}
              </span>
            </div>
            <p class="mt-0.5 truncate text-xs text-stone-400">
              <template v-if="client.email">{{ client.email }}</template>
              <template v-else-if="client.ville">{{ client.ville }}</template>
            </p>
          </div>
          <UIcon name="i-lucide-chevron-right" class="h-4 w-4 shrink-0 text-stone-300" />
        </NuxtLink>
      </div>

      <!-- Create modal -->
      <UModal v-model:open="showForm">
        <template #content>
          <div class="p-6">
            <h2 class="mb-4 text-lg font-semibold text-stone-900">Nouveau client</h2>
            <form class="space-y-4" @submit.prevent="handleCreate">
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="mb-1 block text-sm text-stone-600">Nom *</label>
                  <input
                    v-model="form.nom"
                    type="text"
                    required
                    class="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                  />
                </div>
                <div>
                  <label class="mb-1 block text-sm text-stone-600">Prenom</label>
                  <input
                    v-model="form.prenom"
                    type="text"
                    class="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                  />
                </div>
              </div>
              <div>
                <label class="mb-1 block text-sm text-stone-600">Entreprise</label>
                <input
                  v-model="form.entreprise"
                  type="text"
                  class="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                />
              </div>
              <div>
                <label class="mb-1 block text-sm text-stone-600">Type</label>
                <select
                  v-model="form.type"
                  class="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                >
                  <option value="">Non defini</option>
                  <option value="particulier">Particulier</option>
                  <option value="professionnel">Professionnel</option>
                  <option value="revendeur">Revendeur</option>
                </select>
              </div>
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="mb-1 block text-sm text-stone-600">Email</label>
                  <input
                    v-model="form.email"
                    type="email"
                    class="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                  />
                </div>
                <div>
                  <label class="mb-1 block text-sm text-stone-600">Telephone</label>
                  <input
                    v-model="form.telephone"
                    type="tel"
                    class="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                  />
                </div>
              </div>
              <div>
                <label class="mb-1 block text-sm text-stone-600">Adresse</label>
                <input
                  v-model="form.adresse"
                  type="text"
                  class="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                />
              </div>
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="mb-1 block text-sm text-stone-600">Code postal</label>
                  <input
                    v-model="form.codePostal"
                    type="text"
                    class="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                  />
                </div>
                <div>
                  <label class="mb-1 block text-sm text-stone-600">Ville</label>
                  <input
                    v-model="form.ville"
                    type="text"
                    class="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                  />
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
  query: { limit: 100, search: searchDebounced },
  default: () => ({ data: [], pagination: { page: 1, limit: 100, total: 0, totalPages: 0 } }),
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
  return 'bg-stone-100 text-stone-600';
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
