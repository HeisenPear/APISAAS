<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-[26px] font-semibold tracking-[-0.02em]" style="color:var(--text-primary)">Abonnements</h1>
        <p class="text-sm" style="color:var(--text-secondary)">Vue admin — tous les utilisateurs</p>
      </div>
      <UButton icon="i-lucide-refresh-cw" variant="outline" color="neutral" size="sm" :loading="pending" @click="refresh()">
        Rafraîchir
      </UButton>
    </div>

    <!-- Stats cards -->
    <div v-if="stats" class="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
      <div v-for="card in statCards" :key="card.label" class="rounded-[14px] border bg-white p-4" style="border-color:var(--border-default)">
        <p class="text-[11px] font-semibold uppercase tracking-[0.12em] mb-1" style="color:var(--honey-deep)">{{ card.label }}</p>
        <p class="text-[22px] font-bold tracking-[-0.02em]" :style="`color:${card.color}`">{{ card.value }}</p>
      </div>
    </div>

    <!-- Table -->
    <div class="rounded-[14px] border overflow-hidden" style="border-color:var(--border-default)">
      <!-- Search bar -->
      <div class="flex items-center gap-3 border-b px-4 py-3" style="border-color:var(--border-default);background:var(--surface-muted)">
        <UIcon name="i-lucide-search" class="h-4 w-4 shrink-0" style="color:var(--text-tertiary)" />
        <input
          v-model="search"
          type="search"
          placeholder="Rechercher par nom, email…"
          class="flex-1 bg-transparent text-[14px] outline-none"
          style="color:var(--text-primary)"
        >
        <select v-model="filterPlan" class="h-8 rounded-[8px] border px-2 text-xs bg-white" style="border-color:var(--border-default);color:var(--text-primary)">
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
        <UIcon name="i-lucide-loader-2" class="h-6 w-6 animate-spin" style="color:var(--text-tertiary)" />
      </div>

      <!-- Table -->
      <div v-else class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b" style="border-color:var(--border-default);background:var(--surface-muted)">
              <th class="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.08em]" style="color:var(--text-tertiary)">Utilisateur</th>
              <th class="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.08em]" style="color:var(--text-tertiary)">Plan</th>
              <th class="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.08em]" style="color:var(--text-tertiary)">Trial</th>
              <th class="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.08em]" style="color:var(--text-tertiary)">Stripe</th>
              <th class="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.08em]" style="color:var(--text-tertiary)">Inscription</th>
              <th class="px-4 py-3 w-10" />
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="u in filteredUsers"
              :key="u.id"
              class="border-b last:border-0 transition-colors"
              style="border-color:var(--border-default)"
              @mouseenter="($event.currentTarget as HTMLElement).style.background = 'var(--surface-muted)'"
              @mouseleave="($event.currentTarget as HTMLElement).style.background = ''"
            >
              <td class="px-4 py-3">
                <p class="font-medium text-[13px]" style="color:var(--text-primary)">{{ u.prenom }} {{ u.nom }}</p>
                <p class="text-[12px]" style="color:var(--text-tertiary)">{{ u.email }}</p>
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
                  <p class="text-[12px] font-medium" style="color:var(--honey-deep)">
                    {{ daysLeft(u.trialEndsAt) }}j restants
                  </p>
                  <p class="text-[11px]" style="color:var(--text-tertiary)">
                    Fin : {{ formatDate(u.trialEndsAt) }}
                  </p>
                </div>
                <span v-else-if="u.trialUsed" class="text-[11px]" style="color:var(--text-tertiary)">Utilisé</span>
                <span v-else class="text-[11px]" style="color:var(--text-tertiary)">—</span>
              </td>
              <td class="px-4 py-3">
                <div class="flex items-center gap-1.5">
                  <span
                    class="h-1.5 w-1.5 rounded-full"
                    :class="u.stripeSubscriptionId ? 'bg-emerald-500' : 'bg-stone-300'"
                  />
                  <span class="text-[12px]" style="color:var(--text-secondary)">
                    {{ u.stripeSubscriptionId ? 'Actif' : u.stripeCustomerId ? 'Customer' : '—' }}
                  </span>
                </div>
              </td>
              <td class="px-4 py-3 text-[12px]" style="color:var(--text-tertiary)">
                {{ formatDate(u.createdAt) }}
              </td>
              <td class="px-4 py-3">
                <button
                  type="button"
                  class="flex h-7 w-7 items-center justify-center rounded-[7px] transition-colors hover:bg-red-50"
                  :class="deletingId === u.id ? 'opacity-50 pointer-events-none' : ''"
                  title="Supprimer ce profil"
                  @click="confirmDelete(u)"
                >
                  <UIcon name="i-lucide-trash-2" class="h-3.5 w-3.5" style="color:var(--status-bad)" />
                </button>
              </td>
            </tr>
            <tr v-if="filteredUsers.length === 0">
              <td colspan="6" class="py-10 text-center text-sm" style="color:var(--text-tertiary)">Aucun utilisateur trouvé</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <p class="text-xs text-right" style="color:var(--text-tertiary)">{{ filteredUsers.length }} utilisateur{{ filteredUsers.length > 1 ? 's' : '' }} affiché{{ filteredUsers.length > 1 ? 's' : '' }}</p>

    <!-- Modal confirmation suppression -->
  <UModal v-model:open="showDeleteModal">
    <template #content>
      <div class="p-6">
        <div class="mb-4 flex h-12 w-12 items-center justify-center rounded-[12px]" style="background:rgba(181,69,69,0.1)">
          <UIcon name="i-lucide-trash-2" class="h-6 w-6" style="color:var(--status-bad)" />
        </div>
        <h3 class="text-[17px] font-bold mb-1" style="color:var(--text-primary)">Supprimer ce profil ?</h3>
        <p class="text-sm mb-1" style="color:var(--text-secondary)">
          <strong>{{ userToDelete?.prenom }} {{ userToDelete?.nom }}</strong> — {{ userToDelete?.email }}
        </p>
        <p class="text-[12.5px] mb-6" style="color:var(--text-tertiary)">
          Toutes les données seront supprimées définitivement (ruchers, ruches, interventions, productions…). L'abonnement Stripe actif sera annulé. Cette action est irréversible.
        </p>
        <div class="flex gap-3">
          <UButton variant="outline" color="neutral" class="flex-1" @click="showDeleteModal = false">
            Annuler
          </UButton>
          <UButton color="error" class="flex-1" :loading="deletingId !== null" @click="executeDelete">
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

const { data, pending, refresh } = await useFetch<{ data: AdminUser[]; stats: AdminStats }>('/api/admin/users', {
  key: 'admin-users',
});

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
  const labels: Record<string, string> = { decouverte: 'Découverte', starter: 'Starter', pro: 'Pro', expert: 'Expert' };
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
  return new Date(date).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: '2-digit' });
}
</script>
