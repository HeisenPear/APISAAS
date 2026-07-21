<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-[26px] font-semibold tracking-[-0.02em]" style="color: var(--text-primary)">
          Abonnements
        </h1>
        <p class="text-sm" style="color: var(--text-secondary)">
          Vue admin — tous les utilisateurs
        </p>
      </div>
      <UButton
        icon="i-lucide-refresh-cw"
        variant="outline"
        color="neutral"
        size="sm"
        :loading="pending"
        @click="refresh()"
      >
        Rafraîchir
      </UButton>
    </div>

    <AdminTabs />

    <!-- Stats cards -->
    <div v-if="stats" class="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
      <div
        v-for="card in statCards"
        :key="card.label"
        class="rounded-[14px] border bg-white p-4"
        style="border-color: var(--border-default)"
      >
        <p
          class="text-[11px] font-semibold uppercase tracking-[0.12em] mb-1"
          style="color: var(--honey-deep)"
        >
          {{ card.label }}
        </p>
        <p class="text-[22px] font-bold tracking-[-0.02em]" :style="`color:${card.color}`">
          {{ card.value }}
        </p>
      </div>
    </div>

    <!-- Table -->
    <div class="rounded-[14px] border overflow-hidden" style="border-color: var(--border-default)">
      <!-- Search bar -->
      <div
        class="flex items-center gap-3 border-b px-4 py-3"
        style="border-color: var(--border-default); background: var(--surface-muted)"
      >
        <UIcon
          name="i-lucide-search"
          class="h-4 w-4 shrink-0"
          style="color: var(--text-tertiary)"
        />
        <input
          v-model="search"
          type="search"
          placeholder="Rechercher par nom, email…"
          class="flex-1 bg-transparent text-[14px] outline-none"
          style="color: var(--text-primary)"
        />
        <select
          v-model="filterPlan"
          class="h-8 rounded-[8px] border px-2 text-xs bg-white"
          style="border-color: var(--border-default); color: var(--text-primary)"
        >
          <option value="">Tous les plans</option>
          <option value="decouverte">Découverte</option>
          <option value="trial">En trial</option>
          <option value="starter">Starter</option>
          <option value="pro">Pro</option>
          <option value="expert">Expert</option>
        </select>
      </div>

      <!-- Loading -->
      <div v-if="pending" class="flex items-center justify-center py-12">
        <UIcon
          name="i-lucide-loader-2"
          class="h-6 w-6 animate-spin"
          style="color: var(--text-tertiary)"
        />
      </div>

      <!-- Mobile : liste de cartes -->
      <div v-else class="divide-y md:hidden" style="border-color: var(--border-default)">
        <div
          v-for="u in filteredUsers"
          :key="u.id"
          class="flex items-start gap-3 p-4"
          style="border-color: var(--border-default)"
        >
          <div class="min-w-0 flex-1">
            <div class="flex items-center gap-2">
              <p class="truncate font-semibold text-[14px]" style="color: var(--text-primary)">
                {{ u.prenom }} {{ u.nom || '—' }}
              </p>
              <span
                class="inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-[10.5px] font-semibold"
                :class="planBadgeClass(u.plan, u.trialActive)"
              >
                {{ u.trialActive ? 'Trial Pro' : planLabel(u.plan) }}
              </span>
            </div>
            <p
              class="mt-0.5 flex flex-wrap items-center gap-x-3 truncate text-[12.5px]"
              style="color: var(--text-tertiary)"
            >
              <a :href="`mailto:${u.email}`" class="hover:underline">{{ u.email }}</a>
              <a
                v-if="u.telephone"
                :href="`tel:${u.telephone}`"
                class="flex items-center gap-1 hover:underline"
              >
                <UIcon name="i-lucide-phone" class="h-3 w-3" />{{ u.telephone }}
              </a>
            </p>
            <div class="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11.5px]">
              <span class="flex items-center gap-1.5" style="color: var(--text-secondary)">
                <span
                  class="h-1.5 w-1.5 rounded-full"
                  :class="
                    u.stripeSubscriptionId
                      ? 'bg-emerald-500'
                      : u.stripeCustomerId
                        ? 'bg-amber-500'
                        : 'bg-stone-300'
                  "
                />
                {{
                  u.stripeSubscriptionId
                    ? 'Abonné Stripe'
                    : u.stripeCustomerId
                      ? 'Client Stripe (sans abo) ⚠'
                      : 'Pas de Stripe'
                }}
              </span>
              <button
                v-if="u.stripeCustomerId"
                type="button"
                class="flex items-center gap-1 text-[11.5px] font-medium"
                style="color: var(--honey-deep)"
                :class="syncingId === u.id ? 'opacity-50 pointer-events-none' : ''"
                @click="syncStripe(u)"
              >
                <UIcon
                  :name="syncingId === u.id ? 'i-lucide-loader-2' : 'i-lucide-refresh-cw'"
                  class="h-3 w-3"
                  :class="syncingId === u.id ? 'animate-spin' : ''"
                />
                Sync Stripe
              </button>
              <span v-if="u.trialActive && u.trialEndsAt" style="color: var(--honey-deep)">
                {{ daysLeft(u.trialEndsAt) }}j de trial
              </span>
              <span style="color: var(--text-tertiary)">
                Inscrit le {{ formatDate(u.createdAt) }}
              </span>
            </div>
          </div>
          <button
            type="button"
            class="flex h-8 w-8 shrink-0 items-center justify-center rounded-[8px] transition-colors hover:bg-red-50"
            :class="deletingId === u.id ? 'pointer-events-none opacity-50' : ''"
            title="Supprimer ce profil"
            @click="confirmDelete(u)"
          >
            <UIcon name="i-lucide-trash-2" class="h-4 w-4" style="color: var(--status-bad)" />
          </button>
        </div>
        <div
          v-if="filteredUsers.length === 0"
          class="py-10 text-center text-sm"
          style="color: var(--text-tertiary)"
        >
          Aucun utilisateur trouvé
        </div>
      </div>

      <!-- Desktop : tableau -->
      <div v-if="!pending" class="hidden overflow-x-auto md:block">
        <table class="w-full text-sm">
          <thead>
            <tr
              class="border-b"
              style="border-color: var(--border-default); background: var(--surface-muted)"
            >
              <th
                class="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.08em]"
                style="color: var(--text-tertiary)"
              >
                Utilisateur
              </th>
              <th
                class="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.08em]"
                style="color: var(--text-tertiary)"
              >
                Plan
              </th>
              <th
                class="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.08em]"
                style="color: var(--text-tertiary)"
              >
                Trial
              </th>
              <th
                class="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.08em]"
                style="color: var(--text-tertiary)"
              >
                Stripe
              </th>
              <th
                class="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.08em]"
                style="color: var(--text-tertiary)"
              >
                Inscription
              </th>
              <th class="px-4 py-3 w-10" />
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="u in filteredUsers"
              :key="u.id"
              class="border-b last:border-0 transition-colors"
              style="border-color: var(--border-default)"
              @mouseenter="
                ($event.currentTarget as HTMLElement).style.background = 'var(--surface-muted)'
              "
              @mouseleave="($event.currentTarget as HTMLElement).style.background = ''"
            >
              <td class="px-4 py-3">
                <p class="font-medium text-[13px]" style="color: var(--text-primary)">
                  {{ u.prenom }} {{ u.nom }}
                </p>
                <p class="text-[12px]" style="color: var(--text-tertiary)">{{ u.email }}</p>
              </td>
              <td class="px-4 py-3">
                <span
                  class="inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold"
                  :class="planBadgeClass(u.plan, u.trialActive)"
                >
                  {{ u.trialActive ? 'Trial Pro' : planLabel(u.plan) }}
                </span>
              </td>
              <td class="px-4 py-3">
                <div v-if="u.trialActive && u.trialEndsAt">
                  <p class="text-[12px] font-medium" style="color: var(--honey-deep)">
                    {{ daysLeft(u.trialEndsAt) }}j restants
                  </p>
                  <p class="text-[11px]" style="color: var(--text-tertiary)">
                    Fin : {{ formatDate(u.trialEndsAt) }}
                  </p>
                </div>
                <span
                  v-else-if="u.trialUsed"
                  class="text-[11px]"
                  style="color: var(--text-tertiary)"
                  >Essai utilisé</span
                >
                <span v-else class="text-[11px]" style="color: var(--text-tertiary)"
                  >Jamais d’essai</span
                >
              </td>
              <td class="px-4 py-3">
                <div class="flex items-center gap-1.5">
                  <span
                    class="h-1.5 w-1.5 rounded-full"
                    :class="
                      u.stripeSubscriptionId
                        ? 'bg-emerald-500'
                        : u.stripeCustomerId
                          ? 'bg-amber-500'
                          : 'bg-stone-300'
                    "
                  />
                  <span
                    class="text-[12px]"
                    :style="`color: ${u.stripeCustomerId && !u.stripeSubscriptionId ? 'var(--clay-deep)' : 'var(--text-secondary)'}`"
                  >
                    {{
                      u.stripeSubscriptionId
                        ? 'Abonné'
                        : u.stripeCustomerId
                          ? 'Client (sans abo) ⚠'
                          : '—'
                    }}
                  </span>
                </div>
              </td>
              <td class="px-4 py-3 text-[12px]" style="color: var(--text-tertiary)">
                {{ formatDate(u.createdAt) }}
              </td>
              <td class="px-4 py-3">
                <div class="flex items-center justify-end gap-1">
                  <select
                    :value="u.plan"
                    title="Corriger le plan manuellement (filet de secours — préférez Sync Stripe)"
                    class="rounded-[7px] border bg-white px-1.5 py-1 text-[11px]"
                    style="border-color: var(--border-default); color: var(--text-secondary)"
                    @change="setPlan(u, ($event.target as HTMLSelectElement).value)"
                  >
                    <option value="decouverte">Découverte</option>
                    <option value="starter">Starter</option>
                    <option value="pro">Pro</option>
                    <option value="expert">Expert</option>
                  </select>
                  <button
                    v-if="u.stripeCustomerId"
                    type="button"
                    class="flex h-7 w-7 items-center justify-center rounded-[7px] transition-colors hover:bg-[var(--surface-muted)]"
                    :class="syncingId === u.id ? 'opacity-50 pointer-events-none' : ''"
                    title="Synchroniser le plan depuis Stripe"
                    @click="syncStripe(u)"
                  >
                    <UIcon
                      :name="syncingId === u.id ? 'i-lucide-loader-2' : 'i-lucide-refresh-cw'"
                      class="h-3.5 w-3.5"
                      :class="syncingId === u.id ? 'animate-spin' : ''"
                      style="color: var(--honey-deep)"
                    />
                  </button>
                  <button
                    type="button"
                    class="flex h-7 w-7 items-center justify-center rounded-[7px] transition-colors hover:bg-red-50"
                    :class="deletingId === u.id ? 'opacity-50 pointer-events-none' : ''"
                    title="Supprimer ce profil"
                    @click="confirmDelete(u)"
                  >
                    <UIcon
                      name="i-lucide-trash-2"
                      class="h-3.5 w-3.5"
                      style="color: var(--status-bad)"
                    />
                  </button>
                </div>
              </td>
            </tr>
            <tr v-if="filteredUsers.length === 0">
              <td colspan="6" class="py-10 text-center text-sm" style="color: var(--text-tertiary)">
                Aucun utilisateur trouvé
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <p class="text-xs text-right" style="color: var(--text-tertiary)">
      {{ filteredUsers.length }} utilisateur{{ filteredUsers.length > 1 ? 's' : '' }} affiché{{
        filteredUsers.length > 1 ? 's' : ''
      }}
    </p>

    <!-- Modal confirmation suppression -->
    <UModal v-model:open="showDeleteModal">
      <template #content>
        <div class="p-6">
          <div
            class="mb-4 flex h-12 w-12 items-center justify-center rounded-[12px]"
            style="background: rgba(181, 69, 69, 0.1)"
          >
            <UIcon name="i-lucide-trash-2" class="h-6 w-6" style="color: var(--status-bad)" />
          </div>
          <h3 class="text-[17px] font-bold mb-1" style="color: var(--text-primary)">
            Supprimer ce profil ?
          </h3>
          <p class="text-sm mb-1" style="color: var(--text-secondary)">
            <strong>{{ userToDelete?.prenom }} {{ userToDelete?.nom }}</strong> —
            {{ userToDelete?.email }}
          </p>
          <p v-if="userToDelete" class="mb-2 flex flex-wrap items-center gap-2 text-[12px]">
            <span
              class="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold"
              :class="planBadgeClass(userToDelete.plan, userToDelete.trialActive)"
            >
              {{ userToDelete.trialActive ? 'Trial Pro' : planLabel(userToDelete.plan) }}
            </span>
            <span
              v-if="userToDelete.stripeCustomerId"
              style="color: var(--clay-deep)"
              class="font-medium"
            >
              ⚠ Client Stripe — son/ses abonnement(s) seront annulés
            </span>
          </p>
          <p class="text-[12.5px] mb-6" style="color: var(--text-tertiary)">
            Toutes les données seront supprimées définitivement (ruchers, ruches, interventions,
            productions…). Tous les abonnements Stripe du client seront annulés. Cette action est
            irréversible.
          </p>
          <div class="flex gap-3">
            <UButton
              variant="outline"
              color="neutral"
              class="flex-1"
              @click="showDeleteModal = false"
            >
              Annuler
            </UButton>
            <UButton
              color="error"
              class="flex-1"
              :loading="deletingId !== null"
              @click="executeDelete"
            >
              Supprimer définitivement
            </UButton>
          </div>
        </div>
      </template>
    </UModal>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'default', middleware: 'admin' });

interface AdminUser {
  id: string;
  email: string;
  telephone: string | null;
  nom: string | null;
  prenom: string | null;
  plan: string;
  trialActive: boolean;
  trialStartedAt: string | null;
  trialEndsAt: string | null;
  trialUsed: boolean;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  onboardingComplete: boolean;
  createdAt: string;
}

interface AdminStats {
  total: number;
  enTrial: number;
  payants: number;
  decouverte: number;
  mrr: number;
  mrrAnnuel: number;
}

const search = ref('');
const filterPlan = ref('');
// Drill-down depuis la vue d'ensemble : /admin/users?plan=pro|trial|…
const route = useRoute();
onMounted(() => {
  const q = route.query.plan;
  if (typeof q === 'string' && q) filterPlan.value = q;
});
const showDeleteModal = ref(false);
const userToDelete = ref<AdminUser | null>(null);
const deletingId = ref<string | null>(null);
const toast = useToast();

function confirmDelete(u: AdminUser) {
  userToDelete.value = u;
  showDeleteModal.value = true;
}

async function executeDelete() {
  if (!userToDelete.value) return;
  deletingId.value = userToDelete.value.id;
  try {
    await $fetch(`/api/admin/users/${userToDelete.value.id}`, { method: 'DELETE' });
    showDeleteModal.value = false;
    toast.add({ title: 'Profil supprimé', color: 'success' });
    await refresh();
  } catch (e: unknown) {
    toast.add({ title: getApiErrorMessage(e, 'Erreur lors de la suppression'), color: 'error' });
  } finally {
    deletingId.value = null;
    userToDelete.value = null;
  }
}

const syncingId = ref<string | null>(null);

/** Réconcilie le plan depuis Stripe (filet quand un webhook a été manqué). */
async function syncStripe(u: AdminUser) {
  syncingId.value = u.id;
  try {
    const res = await $fetch<{ data: { synced: boolean; plan?: string; reason?: string } }>(
      `/api/admin/users/${u.id}/sync-stripe`,
      { method: 'POST' },
    );
    const d = res.data;
    if (d.synced) {
      toast.add({ title: `Synchronisé : plan ${planLabel(d.plan ?? '')}`, color: 'success' });
      await refresh();
    } else {
      toast.add({ title: d.reason ?? 'Rien à synchroniser', color: 'warning' });
    }
  } catch (e: unknown) {
    toast.add({ title: getApiErrorMessage(e, 'Échec de la synchro Stripe'), color: 'error' });
  } finally {
    syncingId.value = null;
  }
}

/** Correction manuelle du plan (filet de secours si Stripe ne renvoie rien). */
async function setPlan(u: AdminUser, plan: string) {
  if (plan === u.plan) return;
  // Garde-fou : un changement de plan par mégarde est risqué (facturation).
  const ok = confirm(
    `Forcer le plan de ${u.email} sur « ${planLabel(plan)} » ?\n\n` +
      'Correction manuelle : un abonnement Stripe actif pourra l’écraser au prochain ' +
      'événement. Préférez « Sync Stripe » si le client a payé.',
  );
  if (!ok) {
    await refresh(); // ré-aligne le <select> sur la valeur réelle
    return;
  }
  try {
    await $fetch(`/api/admin/users/${u.id}`, { method: 'PATCH', body: { plan } });
    toast.add({ title: `Plan mis à jour : ${planLabel(plan)}`, color: 'success' });
    await refresh();
  } catch (e: unknown) {
    toast.add({ title: getApiErrorMessage(e, 'Erreur lors de la mise à jour'), color: 'error' });
  }
}

const { data, pending, refresh } = useFetch<{ data: AdminUser[]; stats: AdminStats }>(
  '/api/admin/users',
  {
    key: 'admin-users',
    lazy: true,
    // Filet réseau : ne jamais laisser la page « tourner » indéfiniment si la
    // requête pend (le serveur est déjà borné par withDbRetry côté API).
    timeout: 20_000,
  },
);

const users = computed(() => data.value?.data ?? []);
const stats = computed(() => data.value?.stats ?? null);

const statCards = computed(() => {
  if (!stats.value) return [];
  return [
    { label: 'Total', value: stats.value.total, color: 'var(--text-primary)' },
    { label: 'En trial', value: stats.value.enTrial, color: 'var(--honey)' },
    { label: 'Payants', value: stats.value.payants, color: 'var(--sage-deep)' },
    { label: 'Découverte', value: stats.value.decouverte, color: 'var(--text-tertiary)' },
    { label: 'MRR', value: `${stats.value.mrr.toFixed(2)} €`, color: 'var(--sage-deep)' },
    { label: 'ARR', value: `${stats.value.mrrAnnuel.toFixed(0)} €`, color: 'var(--sage-deep)' },
  ];
});

const filteredUsers = computed(() => {
  let list = users.value;

  if (search.value) {
    const q = search.value.toLowerCase();
    list = list.filter(
      (u) =>
        u.email.toLowerCase().includes(q) ||
        (u.nom ?? '').toLowerCase().includes(q) ||
        (u.prenom ?? '').toLowerCase().includes(q),
    );
  }

  if (filterPlan.value === 'trial') {
    list = list.filter((u) => u.trialActive);
  } else if (filterPlan.value) {
    list = list.filter((u) => u.plan === filterPlan.value && !u.trialActive);
  }

  return list;
});

function planLabel(plan: string) {
  const labels: Record<string, string> = {
    decouverte: 'Découverte',
    starter: 'Starter',
    pro: 'Pro',
    expert: 'Expert',
  };
  return labels[plan] ?? plan;
}

function planBadgeClass(plan: string, trialActive: boolean) {
  if (trialActive) return 'bg-amber-100 text-amber-800';
  const map: Record<string, string> = {
    decouverte: 'bg-stone-100 text-stone-600',
    starter: 'bg-blue-50 text-blue-700',
    pro: 'bg-emerald-50 text-emerald-700',
    expert: 'bg-violet-50 text-violet-700',
  };
  return map[plan] ?? 'bg-stone-100 text-stone-500';
}

function daysLeft(endsAt: string | null): number {
  if (!endsAt) return 0;
  const diff = new Date(endsAt).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

function formatDate(date: string | null | undefined) {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
  });
}
</script>
