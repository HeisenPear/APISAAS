<template>
  <div>
    <NuxtLink
      to="/parametres"
      class="mb-4 inline-flex items-center gap-1 text-sm text-stone-500 transition-colors hover:text-stone-700"
    >
      <UIcon name="i-lucide-arrow-left" class="h-4 w-4" />
      Retour aux paramètres
    </NuxtLink>

    <!-- ── Invitations reçues (HORS gate : un invité doit pouvoir accepter
         quel que soit son propre plan — il opère sous celui du propriétaire) ── -->
    <section v-if="invitationsRecues.length" class="mb-8">
      <h2 class="mb-3 text-sm font-semibold uppercase tracking-wider text-stone-400">
        Invitations reçues
      </h2>
      <div class="space-y-3">
        <div
          v-for="inv in invitationsRecues"
          :key="inv.id"
          class="flex flex-col gap-3 rounded-2xl border border-amber-200 bg-amber-50/60 p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between"
        >
          <div class="flex items-center gap-4">
            <div
              class="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-amber-600 text-sm font-bold text-white"
            >
              <UIcon name="i-lucide-mail-open" class="h-5 w-5" />
            </div>
            <div>
              <p class="font-medium text-stone-900">
                {{ ownerLabel(inv) }} vous invite à rejoindre son exploitation
              </p>
              <p class="text-sm text-stone-500">
                Rôle proposé : <strong>{{ roleLabel(inv.role) }}</strong>
              </p>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <UButton
              label="Accepter"
              icon="i-lucide-check"
              color="primary"
              size="sm"
              :loading="accepting === inv.id"
              @click="handleAccept(inv)"
            />
            <UButton
              label="Refuser"
              variant="ghost"
              color="neutral"
              size="sm"
              :disabled="accepting === inv.id"
              @click="handleDecline(inv)"
            />
          </div>
        </div>
      </div>
    </section>

    <!-- ── Gestion d'équipe (réservée au propriétaire avec la feature multiUsers) ── -->
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

      <div class="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 class="text-2xl font-bold tracking-tight text-stone-900">Équipe</h1>
          <p class="mt-1 text-sm text-stone-500">
            Invitez des collaborateurs à accéder à votre exploitation
          </p>
          <span
            v-if="siegesLabel"
            class="mt-2.5 inline-flex items-center gap-1.5 rounded-full bg-stone-100 px-2.5 py-0.5 text-xs font-medium text-stone-600"
          >
            <UIcon name="i-lucide-users" class="h-3.5 w-3.5" />
            {{ siegesLabel }} sièges utilisés
          </span>
        </div>
        <div class="flex flex-col items-start gap-1.5 sm:items-end">
          <UButton
            label="Inviter un membre"
            icon="i-lucide-user-plus"
            color="primary"
            data-tutorial="equipe-invite"
            :disabled="siegesAtteints"
            @click="showInvite = true"
          />
          <p
            v-if="siegesAtteints"
            class="max-w-[220px] text-[11px] leading-snug text-stone-400 sm:text-right"
          >
            Vous avez atteint les sièges inclus.
            <a
              href="mailto:apigo360.apiculture@gmail.com?subject=Agrandir%20mon%20%C3%A9quipe%20APIGO"
              class="font-medium text-honey-deep hover:underline"
              >Contactez-nous</a
            >
            pour agrandir votre équipe.
          </p>
        </div>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="space-y-3">
        <div v-for="i in 3" :key="i" class="h-20 animate-pulse rounded-2xl bg-stone-100" />
      </div>

      <!-- Members list -->
      <div v-else data-tutorial="equipe-membres" class="space-y-3">
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
                  ? 'bg-amber-100 text-amber-700'
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
              class="rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-honey-deep"
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
                  ($event.target as HTMLSelectElement).value as MembreRole,
                )
              "
            >
              <option v-for="r in roleOptions" :key="r.value" :value="r.value">
                {{ r.label }}
              </option>
            </select>

            <!-- Relancer l'invitation (membre encore en attente) -->
            <UButton
              v-if="membre.statut === 'en_attente'"
              label="Relancer"
              icon="i-lucide-send"
              size="xs"
              variant="ghost"
              color="neutral"
              :loading="relancing === membre.id"
              @click="handleRelancer(membre)"
            />

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
        <div class="mb-4 flex items-center justify-between gap-3">
          <h2 class="text-sm font-semibold uppercase tracking-wider text-stone-400">
            Rôles & accès
          </h2>
          <span
            v-if="!peutRolesAvances"
            class="rounded-full bg-amber-50 px-2.5 py-0.5 text-[11px] font-semibold text-amber-700"
          >
            Rôles limités · Expert
          </span>
        </div>
        <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div
            v-for="r in ROLE_DEFS"
            :key="r.value"
            class="rounded-xl border border-stone-100 bg-stone-50/60 p-4"
            :class="r.restreint && !peutRolesAvances ? 'opacity-55' : ''"
          >
            <div class="flex items-center gap-2">
              <p class="text-sm font-semibold text-stone-900">{{ r.label }}</p>
              <span
                v-if="r.restreint"
                class="rounded-full bg-amber-100 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-amber-700"
              >
                Expert
              </span>
            </div>
            <p class="mt-1 text-xs text-stone-500">{{ r.description }}</p>
          </div>
        </div>
        <p v-if="!peutRolesAvances" class="mt-3 text-xs text-stone-500">
          Les rôles à accès limité (technicien, comptable, lecture) sont réservés au plan
          <NuxtLink to="/tarifs" class="font-semibold text-honey-deep hover:underline"
            >Expert</NuxtLink
          >.
        </p>
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
                  <option v-for="r in roleOptions" :key="r.value" :value="r.value">
                    {{ r.label }} — {{ r.description }}
                  </option>
                </select>
                <p v-if="!peutRolesAvances" class="mt-1.5 text-[11px] text-stone-400">
                  Technicien, comptable et lecture seule sont réservés au plan Expert.
                </p>
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
import { hasFeature } from '~/config/plans';
import { ROLE_DEFS, type MembreRole } from '~/config/roles';

definePageMeta({ layout: 'default' });

const gating = useGating();
/** Rôles à accès restreint (technicien / comptable / lecture) → plan Expert. */
const peutRolesAvances = computed(() => hasFeature(gating.plan.value, 'rolesEquipe'));
/** Options de rôle proposées : restreintes filtrées selon le plan. */
const roleOptions = computed(() => ROLE_DEFS.filter((r) => !r.restreint || peutRolesAvances.value));
/** Sièges d'équipe consommés (actifs + invitations en attente) : "3/10". */
const siegesLabel = computed(() => gating.usageDisplay('membresEquipe'));
/** Le forfait de sièges inclus est-il atteint ? (bloque de nouvelles invitations) */
const siegesAtteints = computed(() => gating.isAtLimit('membresEquipe'));

const authStore = useAuthStore();
const notifications = useNotifications();
const {
  membresData,
  loading,
  fetchMembres,
  inviterMembre,
  changerRole,
  revoquer,
  relancerInvitation,
  fetchInvitations,
  accepterInvitation,
  refuserInvitation,
} = useMembres();

interface MembreRow {
  id: string;
  email: string;
  role: string;
  statut: string;
  userName: string | null;
  userPrenom: string | null;
}

interface InvitationRecue {
  id: string;
  ownerId: string;
  email: string;
  role: MembreRole;
  statut: string;
  invitedAt: string;
  ownerNom: string | null;
  ownerPrenom: string | null;
}

const invitationsRecues = ref<InvitationRecue[]>([]);
const accepting = ref<string | null>(null);
const showInvite = ref(false);
const inviteEmail = ref('');
const inviteRole = ref<MembreRole>('apiculteur');
const inviting = ref(false);

const ROLE_LABELS: Record<string, string> = Object.fromEntries(
  ROLE_DEFS.map((r) => [r.value, r.label]),
);
const roleLabel = (r: string) => ROLE_LABELS[r] ?? r;
const ownerLabel = (inv: InvitationRecue) =>
  [inv.ownerPrenom, inv.ownerNom].filter(Boolean).join(' ') || 'Un apiculteur';

async function loadInvitations() {
  try {
    invitationsRecues.value = await fetchInvitations();
  } catch {
    invitationsRecues.value = [];
  }
}

function getMembreInitials(m: MembreRow) {
  if (m.userPrenom && m.userName) {
    return ((m.userPrenom?.[0] ?? '') + (m.userName?.[0] ?? '')).toUpperCase();
  }
  return m.email[0]?.toUpperCase() ?? '?';
}

async function handleAccept(inv: InvitationRecue) {
  if (accepting.value) return;
  accepting.value = inv.id;
  try {
    await accepterInvitation(inv.id);
    notifications.success(`Vous avez rejoint l'exploitation de ${ownerLabel(inv)}`);
    // Rechargement complet : on bascule dans l'espace du propriétaire, toutes
    // les données (dashboard, ruches…) doivent être re-fetchées sous ownerId.
    if (import.meta.client) window.location.href = '/dashboard';
  } catch (e: unknown) {
    notifications.error(getApiErrorMessage(e, "Erreur lors de l'acceptation"));
    accepting.value = null;
  }
}

async function handleDecline(inv: InvitationRecue) {
  if (!confirm(`Refuser l'invitation de ${ownerLabel(inv)} ?`)) return;
  try {
    await refuserInvitation(inv.id);
    invitationsRecues.value = invitationsRecues.value.filter((i) => i.id !== inv.id);
    notifications.success('Invitation refusée');
  } catch (e: unknown) {
    notifications.error(getApiErrorMessage(e, 'Erreur'));
  }
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
    gating.refreshUsage();
  } catch (e: unknown) {
    notifications.error(getApiErrorMessage(e, "Erreur lors de l'envoi de l'invitation"));
  } finally {
    inviting.value = false;
  }
}

async function handleRoleChange(id: string, role: MembreRole) {
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
    gating.refreshUsage();
  } catch (e: unknown) {
    notifications.error(getApiErrorMessage(e, 'Erreur'));
  }
}

const relancing = ref<string | null>(null);
async function handleRelancer(membre: MembreRow) {
  if (relancing.value) return;
  relancing.value = membre.id;
  try {
    await relancerInvitation(membre.id);
    notifications.success('Invitation renvoyée à ' + membre.email);
  } catch (e: unknown) {
    notifications.error(getApiErrorMessage(e, 'Erreur lors de la relance'));
  } finally {
    relancing.value = null;
  }
}

onMounted(() => {
  fetchMembres();
  loadInvitations();
  gating.refreshUsage();
});
</script>
