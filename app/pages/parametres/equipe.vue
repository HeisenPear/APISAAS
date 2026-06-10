<template>
  <div>
    <UiFeatureGate feature="multiUsers" blur>
      <template #preview>
        <div class="space-y-4">
          <div class="h-10 w-40 rounded-xl bg-stone-100" />
          <div class="h-16 rounded-2xl bg-stone-100" />
          <div class="space-y-2">
            <div v-for="i in 3" :key="i" class="h-14 rounded-xl bg-stone-100" />
          </div>
        </div>
      </template>

      <NuxtLink
        to="/parametres"
        class="mb-4 inline-flex items-center gap-1 text-sm text-stone-500 transition-colors hover:text-stone-700"
      >
        <UIcon name="i-lucide-arrow-left" class="h-4 w-4" />
        Retour aux paramètres
      </NuxtLink>

      <div class="mb-8 flex items-start justify-between">
        <div>
          <h1 class="text-2xl font-bold tracking-tight text-stone-900">Équipe</h1>
          <p class="mt-1 text-sm text-stone-500">
            Invitez des collaborateurs à accéder à votre exploitation
          </p>
        </div>
        <UButton
          label="Inviter un membre"
          icon="i-lucide-user-plus"
          color="primary"
          @click="showInvite = true"
        />
      </div>

      <!-- Loading -->
      <div v-if="loading" class="space-y-3">
        <div v-for="i in 3" :key="i" class="h-20 animate-pulse rounded-2xl bg-stone-100" />
      </div>

      <!-- Empty state -->
      <UiEmptyState
        v-else-if="membresData.length === 0"
        icon="i-lucide-users"
        title="Aucun membre"
        description="Invitez des collaborateurs pour partager l'accès à votre exploitation"
        action-label="Inviter un membre"
        @action="showInvite = true"
      />

      <!-- Members list -->
      <div v-else class="space-y-3">
        <!-- Owner (you) -->
        <div
          class="flex items-center justify-between rounded-2xl border border-stone-200/60 bg-white p-5 shadow-sm"
        >
          <div class="flex items-center gap-4">
            <div
              class="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-amber-600 text-sm font-bold text-white"
            >
              {{ authStore.initials }}
            </div>
            <div>
              <p class="font-medium text-stone-900">{{ authStore.fullName }}</p>
              <p class="text-sm text-stone-500">{{ authStore.profil?.email }}</p>
            </div>
          </div>
          <span class="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
            Propriétaire
          </span>
        </div>

        <!-- Team members -->
        <div
          v-for="membre in membresData"
          :key="membre.id"
          class="flex items-center justify-between rounded-2xl border border-stone-200/60 bg-white p-5 shadow-sm transition-all duration-200 hover:shadow-md"
        >
          <div class="flex items-center gap-4">
            <div
              class="flex h-11 w-11 items-center justify-center rounded-full text-sm font-bold"
              :class="
                membre.statut === 'acceptee'
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-stone-100 text-stone-500'
              "
            >
              {{ getMembreInitials(membre) }}
            </div>
            <div>
              <p class="font-medium text-stone-900">
                <template v-if="membre.userName || membre.userPrenom">
                  {{ membre.userPrenom }} {{ membre.userName }}
                </template>
                <template v-else>{{ membre.email }}</template>
              </p>
              <p class="text-sm text-stone-500">{{ membre.email }}</p>
            </div>
          </div>

          <div class="flex items-center gap-3">
            <!-- Status badge -->
            <span
              v-if="membre.statut === 'en_attente'"
              class="rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-600"
            >
              En attente
            </span>

            <!-- Role select -->
            <select
              :value="membre.role"
              class="h-8 rounded-lg border border-stone-200 bg-white px-2 text-xs text-stone-700 focus:border-amber-500 focus:outline-none"
              @change="
                handleRoleChange(
                  membre.id,
                  ($event.target as HTMLSelectElement).value as 'apiculteur' | 'comptable',
                )
              "
            >
              <option value="apiculteur">Apiculteur</option>
              <option value="comptable">Comptable</option>
            </select>

            <!-- Remove -->
            <UButton
              icon="i-lucide-x"
              size="xs"
              variant="ghost"
              color="error"
              @click="handleRemove(membre)"
            />
          </div>
        </div>
      </div>

      <!-- Roles explanation -->
      <div class="mt-8 rounded-2xl border border-stone-200/60 bg-white p-6 shadow-sm">
        <h2 class="mb-4 text-sm font-semibold uppercase tracking-wider text-stone-400">Rôles</h2>
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div class="rounded-xl bg-amber-50 p-4">
            <div class="flex items-center gap-2">
              <UIcon name="i-lucide-crown" class="h-4 w-4 text-amber-600" />
              <p class="text-sm font-semibold text-stone-900">Propriétaire</p>
            </div>
            <p class="mt-1 text-xs text-stone-500">Accès total, gestion équipe, facturation</p>
          </div>
          <div class="rounded-xl bg-emerald-50 p-4">
            <div class="flex items-center gap-2">
              <UIcon name="i-lucide-hexagon" class="h-4 w-4 text-emerald-600" />
              <p class="text-sm font-semibold text-stone-900">Apiculteur</p>
            </div>
            <p class="mt-1 text-xs text-stone-500">Ruchers, ruches, interventions, production</p>
          </div>
          <div class="rounded-xl bg-blue-50 p-4">
            <div class="flex items-center gap-2">
              <UIcon name="i-lucide-eye" class="h-4 w-4 text-blue-600" />
              <p class="text-sm font-semibold text-stone-900">Comptable</p>
            </div>
            <p class="mt-1 text-xs text-stone-500">Lecture seule : finances, exports, clients</p>
          </div>
        </div>
      </div>

      <!-- Invite modal -->
      <UModal v-model:open="showInvite">
        <template #content>
          <div class="p-6">
            <h2 class="mb-4 text-lg font-semibold text-stone-900">Inviter un membre</h2>
            <form class="space-y-4" @submit.prevent="handleInvite">
              <div>
                <label class="mb-1.5 block text-xs font-medium text-stone-500">Email *</label>
                <UInput
                  v-model="inviteEmail"
                  type="email"
                  placeholder="collaborateur@email.com"
                  icon="i-lucide-mail"
                  required
                />
              </div>
              <div>
                <label class="mb-1.5 block text-xs font-medium text-stone-500">Rôle</label>
                <select
                  v-model="inviteRole"
                  class="h-9 w-full rounded-lg border border-stone-200 bg-white px-3 text-sm text-stone-700 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                >
                  <option value="apiculteur">Apiculteur — accès complet terrain</option>
                  <option value="comptable">Comptable — lecture seule finances</option>
                </select>
              </div>
              <div class="flex items-center justify-end gap-3 border-t border-stone-100 pt-4">
                <UButton
                  label="Annuler"
                  variant="ghost"
                  color="neutral"
                  @click="showInvite = false"
                />
                <UButton
                  type="submit"
                  label="Envoyer l'invitation"
                  icon="i-lucide-send"
                  color="primary"
                  :loading="inviting"
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
definePageMeta({ layout: 'default' });

const authStore = useAuthStore();
const notifications = useNotifications();
const { fetchMembres: loadMembres, inviterMembre, changerRole, revoquer } = useMembres();

interface MembreRow {
  id: string;
  email: string;
  role: string;
  statut: string;
  invitedAt: Date | string;
  acceptedAt: Date | string | null;
  userName: string | null;
  userPrenom: string | null;
}

const loading = ref(true);
const membresData = ref<MembreRow[]>([]);
const showInvite = ref(false);
const inviteEmail = ref('');
const inviteRole = ref<'apiculteur' | 'comptable'>('apiculteur');
const inviting = ref(false);

async function fetchMembres() {
  loading.value = true;
  try {
    await loadMembres();
  } catch {
    membresData.value = [];
  } finally {
    loading.value = false;
  }
}

function getMembreInitials(m: MembreRow) {
  if (m.userPrenom && m.userName) {
    return ((m.userPrenom?.[0] ?? '') + (m.userName?.[0] ?? '')).toUpperCase();
  }
  return m.email[0]?.toUpperCase() ?? '?';
}

async function handleInvite() {
  if (!inviteEmail.value || inviting.value) return;
  inviting.value = true;
  try {
    await inviterMembre(inviteEmail.value, inviteRole.value);
    notifications.success('Invitation envoyée à ' + inviteEmail.value);
    showInvite.value = false;
    inviteEmail.value = '';
    inviteRole.value = 'apiculteur';
    await fetchMembres();
  } catch (e: unknown) {
    notifications.error(getApiErrorMessage(e, "Erreur lors de l'envoi de l'invitation"));
  } finally {
    inviting.value = false;
  }
}

async function handleRoleChange(id: string, role: 'apiculteur' | 'comptable') {
  try {
    await changerRole(id, role);
    notifications.success('Rôle mis à jour');
    await fetchMembres();
  } catch (e: unknown) {
    notifications.error(getApiErrorMessage(e, 'Erreur'));
  }
}

async function handleRemove(membre: MembreRow) {
  const label = membre.userPrenom ? `${membre.userPrenom} ${membre.userName}` : membre.email;
  if (!confirm(`Retirer ${label} de votre équipe ?`)) return;
  try {
    await revoquer(membre.id);
    notifications.success('Membre retiré');
    await fetchMembres();
  } catch (e: unknown) {
    notifications.error(getApiErrorMessage(e, 'Erreur'));
  }
}

onMounted(fetchMembres);
</script>
