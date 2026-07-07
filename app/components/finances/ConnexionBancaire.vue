<script setup lang="ts">
import { useBanque, type ConnexionBancaire, type Institution } from '~/composables/useBanque';

// Émis après une synchro réussie → la page recharge mouvements + suggestions.
const emit = defineEmits<{ synced: [] }>();

const toast = useToast();
const route = useRoute();
const router = useRouter();
const banque = useBanque();

const actif = ref(false);
const connexions = ref<ConnexionBancaire[]>([]);
const institutions = ref<Institution[]>([]);
const recherche = ref('');
const choixOuvert = ref(false);
const busy = ref(false);

const institutionsFiltrees = computed(() => {
  const q = recherche.value.trim().toLowerCase();
  const base = q
    ? institutions.value.filter((i) => i.name.toLowerCase().includes(q))
    : institutions.value;
  return base.slice(0, 40);
});

async function chargerEtat() {
  const e = await banque.etatConnexion();
  actif.value = e.actif;
  connexions.value = e.connexions;
}

async function ouvrirChoix() {
  choixOuvert.value = true;
  if (institutions.value.length === 0) {
    try {
      institutions.value = await banque.listerInstitutions('FR');
    } catch (e) {
      toast.add({ title: getApiErrorMessage(e, 'Banques indisponibles'), color: 'error' });
    }
  }
}

async function connecter(i: Institution) {
  busy.value = true;
  try {
    const res = await banque.initierConnexion(i.id, i.name);
    if (res?.link) window.location.href = res.link; // redirection vers l'auth banque
  } catch (e) {
    toast.add({ title: getApiErrorMessage(e, 'Connexion impossible'), color: 'error' });
    busy.value = false;
  }
}

async function synchroniser(connexionId?: string) {
  busy.value = true;
  try {
    const res = await banque.synchroniser(connexionId);
    toast.add({
      title: res?.importes
        ? `${res.importes} mouvement(s) synchronisé(s)`
        : 'Aucun nouveau mouvement',
      color: res?.importes ? 'success' : 'info',
    });
    await chargerEtat();
    emit('synced');
  } catch (e) {
    toast.add({ title: getApiErrorMessage(e, 'Synchronisation impossible'), color: 'error' });
  } finally {
    busy.value = false;
  }
}

const statutLabel: Record<ConnexionBancaire['statut'], string> = {
  en_attente: 'En attente',
  liee: 'Connectée',
  expiree: 'Expirée',
  erreur: 'Erreur',
};

onMounted(async () => {
  await chargerEtat();
  // Retour de l'authentification banque (redirect GoCardless) → on synchronise.
  if (route.query.gc === 'callback') {
    router.replace({ query: {} });
    if (actif.value) await synchroniser();
  }
});
</script>

<template>
  <!-- Inerte tant que l'agrégateur n'est pas configuré ET qu'aucune connexion n'existe. -->
  <div
    v-if="actif || connexions.length"
    class="rounded-[14px] border border-[var(--border-default)] bg-white p-4"
  >
    <div class="flex items-start justify-between gap-3">
      <div>
        <p class="text-sm font-medium text-[var(--text-primary)]">Connexion bancaire automatique</p>
        <p class="mt-0.5 text-xs text-[var(--text-tertiary)]">
          Synchronisez vos mouvements sans import manuel (via un agrégateur agréé DSP2).
        </p>
      </div>
      <UButton
        v-if="actif"
        size="sm"
        color="primary"
        variant="soft"
        icon="i-lucide-link"
        :loading="busy"
        @click="ouvrirChoix"
      >
        Connecter ma banque
      </UButton>
    </div>

    <!-- Connexions existantes -->
    <div v-if="connexions.length" class="mt-3 space-y-2">
      <div
        v-for="c in connexions"
        :key="c.id"
        class="flex items-center justify-between gap-3 rounded-[10px] bg-[var(--surface-muted)] px-3 py-2"
      >
        <span class="truncate text-sm text-[var(--text-primary)]">
          {{ c.institutionNom || 'Banque' }}
          <span class="text-xs text-[var(--text-tertiary)]">· {{ statutLabel[c.statut] }}</span>
        </span>
        <UButton
          size="xs"
          color="neutral"
          variant="ghost"
          icon="i-lucide-refresh-cw"
          :loading="busy"
          @click="synchroniser(c.id)"
        >
          Synchroniser
        </UButton>
      </div>
    </div>

    <!-- Choix de la banque -->
    <div v-if="choixOuvert && actif" class="mt-3">
      <UInput v-model="recherche" placeholder="Rechercher votre banque…" icon="i-lucide-search" />
      <div class="mt-2 max-h-56 space-y-1 overflow-y-auto">
        <button
          v-for="i in institutionsFiltrees"
          :key="i.id"
          type="button"
          :disabled="busy"
          class="flex w-full items-center gap-2 rounded-[8px] px-3 py-2 text-left text-sm text-[var(--text-primary)] hover:bg-[var(--surface-muted)] disabled:opacity-50"
          @click="connecter(i)"
        >
          <img v-if="i.logo" :src="i.logo" alt="" class="h-5 w-5 rounded" />
          {{ i.name }}
        </button>
        <p
          v-if="!institutionsFiltrees.length"
          class="px-3 py-2 text-xs text-[var(--text-tertiary)]"
        >
          Aucune banque trouvée.
        </p>
      </div>
    </div>
  </div>
</template>
