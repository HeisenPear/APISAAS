<script setup lang="ts">
import {
  useBanque,
  type FactureOuverte,
  type MouvementBancaire,
  type SuggestionRapprochement,
} from '~/composables/useBanque';

definePageMeta({ layout: 'default' });

const gating = useGating();
const hasAccess = computed(() => gating.can('suiviReglements'));

const toast = useToast();
const { listMouvements, getSuggestions, rapprocher, action, facturesOuvertes } = useBanque();

const suggestions = ref<SuggestionRapprochement[]>([]);
const mouvements = ref<MouvementBancaire[]>([]);
const factures = ref<FactureOuverte[]>([]);
const matchMouvement = ref<MouvementBancaire | null>(null);
const loading = ref(false);

async function load() {
  if (!hasAccess.value) return;
  loading.value = true;
  try {
    [suggestions.value, mouvements.value, factures.value] = await Promise.all([
      getSuggestions(),
      listMouvements(),
      facturesOuvertes(),
    ]);
  } catch (e) {
    toast.add({ title: getApiErrorMessage(e, 'Chargement impossible'), color: 'error' });
  } finally {
    loading.value = false;
  }
}
watch(hasAccess, (v) => v && load(), { immediate: true });

async function confirmerManuel(transactionId: string) {
  const m = matchMouvement.value;
  if (!m) return;
  try {
    await rapprocher(m.id, transactionId);
    toast.add({ title: 'Facture pointée payée', color: 'success' });
    matchMouvement.value = null;
    await load();
  } catch (e) {
    toast.add({ title: getApiErrorMessage(e, 'Rapprochement impossible'), color: 'error' });
  }
}

async function confirmer(s: SuggestionRapprochement) {
  try {
    await rapprocher(s.mouvementId, s.transactionId);
    toast.add({
      title: `Facture ${s.facture.numero ?? ''} pointée payée`.trim(),
      color: 'success',
    });
    await load();
  } catch (e) {
    toast.add({ title: getApiErrorMessage(e, 'Rapprochement impossible'), color: 'error' });
  }
}

async function agir(id: string, act: 'ignorer' | 'restaurer') {
  try {
    await action(id, act);
    await load();
  } catch (e) {
    toast.add({ title: getApiErrorMessage(e, 'Action impossible'), color: 'error' });
  }
}

const aRapprocher = computed(
  () => mouvements.value.filter((m) => m.statut === 'a_rapprocher').length,
);
const pointes = computed(() => mouvements.value.filter((m) => m.statut === 'rapproche').length);

// Complément trésorerie : flux réels lus sur le relevé (hors mouvements ignorés).
const actifs = computed(() => mouvements.value.filter((m) => m.statut !== 'ignore'));
const encaisse = computed(() =>
  actifs.value.reduce((s, m) => s + Math.max(0, Number(m.montant)), 0),
);
const decaisse = computed(() =>
  actifs.value.reduce((s, m) => s + Math.max(0, -Number(m.montant)), 0),
);

function eur(v: number): string {
  return `${v.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`;
}
function dateFr(iso: string): string {
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}
function scoreInfo(score: number): { label: string; color: string } {
  if (score >= 82) return { label: 'Quasi certain', color: 'var(--sage-deep)' };
  if (score >= 60) return { label: 'Probable', color: 'var(--honey-deep)' };
  return { label: 'À vérifier', color: 'var(--text-tertiary)' };
}
</script>

<template>
  <div class="space-y-8">
    <div>
      <h1
        class="text-[26px] font-semibold tracking-[-0.02em] text-[var(--text-primary)]"
        style="
          font-family:
            'SF Pro Display',
            -apple-system,
            BlinkMacSystemFont,
            sans-serif;
        "
      >
        Suivi des règlements
      </h1>
      <p class="mt-1 max-w-2xl text-sm text-[var(--text-secondary)]">
        Importez votre relevé bancaire pour pointer automatiquement les factures réglées et
        fiabiliser vos relances d'impayés. Aucune saisie comptable — juste vos factures à jour.
      </p>
    </div>

    <UiFeatureGate feature="suiviReglements" blur>
      <div class="space-y-8">
        <!-- Import + compteurs -->
        <div class="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div class="lg:col-span-2">
            <FinancesImportReleve @imported="load" />
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div class="rounded-[14px] border border-[var(--border-default)] bg-white p-3">
              <p class="text-lg font-semibold text-[var(--sage-deep)]">+{{ eur(encaisse) }}</p>
              <p class="mt-0.5 text-xs text-[var(--text-tertiary)]">Encaissé (relevé)</p>
            </div>
            <div class="rounded-[14px] border border-[var(--border-default)] bg-white p-3">
              <p class="text-lg font-semibold text-[var(--text-primary)]">−{{ eur(decaisse) }}</p>
              <p class="mt-0.5 text-xs text-[var(--text-tertiary)]">Décaissé (relevé)</p>
            </div>
            <div class="rounded-[14px] border border-[var(--border-default)] bg-white p-3">
              <p class="text-lg font-semibold text-[var(--honey-deep)]">{{ aRapprocher }}</p>
              <p class="mt-0.5 text-xs text-[var(--text-tertiary)]">À rapprocher</p>
            </div>
            <div class="rounded-[14px] border border-[var(--border-default)] bg-white p-3">
              <p class="text-lg font-semibold text-[var(--sage-deep)]">{{ pointes }}</p>
              <p class="mt-0.5 text-xs text-[var(--text-tertiary)]">Pointés</p>
            </div>
          </div>
        </div>

        <!-- Suggestions -->
        <section v-if="suggestions.length" class="space-y-3">
          <h2 class="text-sm font-semibold text-[var(--text-primary)]">
            Rapprochements suggérés ({{ suggestions.length }})
          </h2>
          <div
            v-for="s in suggestions"
            :key="s.mouvementId"
            class="flex flex-col gap-3 rounded-[14px] border border-[var(--border-default)] bg-white p-4 sm:flex-row sm:items-center sm:justify-between"
          >
            <div class="min-w-0 flex-1">
              <div class="flex flex-wrap items-center gap-2">
                <span class="text-sm font-medium text-[var(--text-primary)]">
                  Facture {{ s.facture.numero ?? '—' }} · {{ eur(s.facture.total) }}
                </span>
                <span
                  class="rounded-full px-2 py-0.5 text-[11px] font-medium"
                  :style="{ color: scoreInfo(s.score).color, background: 'var(--surface-muted)' }"
                >
                  {{ scoreInfo(s.score).label }}
                </span>
              </div>
              <p class="mt-1 truncate text-xs text-[var(--text-tertiary)]">
                {{ s.facture.tiers || 'Client non précisé' }} · {{ dateFr(s.mouvement.date) }} · «
                {{ s.mouvement.libelle }} »
              </p>
              <p class="mt-1 text-xs text-[var(--text-secondary)]">{{ s.raisons.join(' · ') }}</p>
            </div>
            <div class="flex shrink-0 gap-2">
              <UButton size="sm" color="primary" icon="i-lucide-check" @click="confirmer(s)">
                Pointer payée
              </UButton>
              <UButton
                size="sm"
                color="neutral"
                variant="ghost"
                icon="i-lucide-x"
                @click="agir(s.mouvementId, 'ignorer')"
              >
                Ignorer
              </UButton>
            </div>
          </div>
        </section>

        <!-- Connexion bancaire automatique (inerte si non configurée) -->
        <FinancesConnexionBancaire @synced="load" />

        <!-- Liste des mouvements importés -->
        <section class="space-y-3">
          <h2 class="text-sm font-semibold text-[var(--text-primary)]">Mouvements importés</h2>
          <FinancesMouvementsBancaires
            :mouvements="mouvements"
            @action="agir"
            @match="(m) => (matchMouvement = m)"
          />
        </section>
      </div>
    </UiFeatureGate>

    <FinancesRapprochementManuel
      v-if="matchMouvement"
      :mouvement="matchMouvement"
      :factures="factures"
      @close="matchMouvement = null"
      @confirm="confirmerManuel"
    />
  </div>
</template>
