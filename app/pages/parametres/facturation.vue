<template>
  <div class="mx-auto max-w-3xl">
    <!-- Back -->
    <NuxtLink
      to="/parametres"
      class="mb-4 inline-flex items-center gap-1.5 text-[13px] font-medium text-[var(--text-tertiary)] transition-colors hover:text-[var(--text-secondary)]"
    >
      <UIcon name="i-lucide-arrow-left" class="h-3.5 w-3.5" />
      Paramètres
    </NuxtLink>

    <!-- Header -->
    <div class="mb-6">
      <h1 class="text-[26px] font-semibold tracking-[-0.02em] text-[var(--text-primary)]">
        Facturation
      </h1>
      <p class="mt-1 text-[13.5px] text-[var(--text-secondary)]">
        Vos coordonnées bancaires et votre mode de paiement par défaut — affichés sur vos factures
        pour faciliter le règlement de vos clients.
      </p>
    </div>

    <!-- RIB & paiement -->
    <section class="rounded-[16px] border border-[var(--border-default)] bg-white p-5">
      <h2 class="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--honey-deep)]">
        Coordonnées bancaires (RIB)
      </h2>

      <div class="mt-3 grid gap-3 sm:grid-cols-2">
        <div class="sm:col-span-2">
          <label class="lbl">IBAN</label>
          <UInput
            v-model="facturation.iban"
            size="sm"
            placeholder="FR76 1234 5678 9012 3456 7890 123"
          />
        </div>
        <div>
          <label class="lbl">BIC / SWIFT</label>
          <UInput v-model="facturation.bic" size="sm" placeholder="AGRIFRPP…" />
        </div>
        <div>
          <label class="lbl">Banque</label>
          <UInput v-model="facturation.banque" size="sm" placeholder="Crédit Agricole…" />
        </div>
        <div>
          <label class="lbl">Titulaire du compte</label>
          <UInput v-model="facturation.titulaire" size="sm" placeholder="Prénom Nom" />
        </div>
        <div>
          <label class="lbl">Mode de paiement par défaut</label>
          <USelect v-model="facturation.modePaiement" size="sm" :items="modePaiementOptions" />
        </div>
      </div>

      <div
        class="mt-4 flex items-center justify-between gap-4 border-t border-[var(--border-default)] pt-4"
      >
        <div>
          <p class="text-[13.5px] font-medium text-[var(--text-primary)]">
            Afficher le RIB sur les factures
          </p>
          <p class="text-[12px] text-[var(--text-secondary)]">
            Vos coordonnées bancaires apparaîtront dans les conditions de règlement.
          </p>
        </div>
        <!-- Un interrupteur sans libellé propre : la description à sa gauche
             n'est reliée à rien pour un lecteur d'écran, qui annonce
             « bouton, non coché » sans dire de quoi. -->
        <USwitch v-model="facturation.afficherRib" aria-label="Afficher le RIB sur les factures" />
      </div>

      <div class="mt-4 flex justify-end">
        <UButton
          label="Enregistrer"
          icon="i-lucide-check"
          color="primary"
          :loading="saving"
          @click="save"
        />
      </div>
    </section>

    <!-- Aperçu facture -->
    <section
      class="mt-5 rounded-[16px] border border-[var(--border-default)] bg-[var(--surface-muted)] p-5"
    >
      <h2 class="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--text-tertiary)]">
        Aperçu sur la facture
      </h2>
      <div
        class="mt-3 rounded-[12px] border border-[var(--border-default)] bg-white p-4 text-[12px] leading-relaxed text-[var(--text-secondary)]"
      >
        <p
          class="mb-2 text-[10px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)]"
        >
          Conditions de règlement
        </p>
        <p>
          <strong class="text-[var(--text-primary)]">Mode de règlement :</strong>
          {{ modePaiementLabel }}.
        </p>
        <div
          v-if="facturation.afficherRib && facturation.iban"
          class="mt-2 rounded-lg border border-[var(--border-default)] bg-[var(--surface-muted)] px-3 py-2"
        >
          <p
            class="mb-1 text-[10px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)]"
          >
            Coordonnées bancaires
          </p>
          <p v-if="facturation.titulaire">
            <strong class="text-[var(--text-primary)]">Titulaire :</strong>
            {{ facturation.titulaire }}
          </p>
          <p v-if="facturation.banque">
            <strong class="text-[var(--text-primary)]">Banque :</strong> {{ facturation.banque }}
          </p>
          <p><strong class="text-[var(--text-primary)]">IBAN :</strong> {{ facturation.iban }}</p>
          <p v-if="facturation.bic">
            <strong class="text-[var(--text-primary)]">BIC :</strong> {{ facturation.bic }}
          </p>
        </div>
        <p v-else class="mt-2 italic text-[var(--text-tertiary)]">
          Le RIB n'apparaîtra pas (activez le bouton ci-dessus et renseignez l'IBAN).
        </p>
      </div>
    </section>

    <!-- Renvoi coordonnées légales -->
    <p class="mt-5 text-[12.5px] text-[var(--text-tertiary)]">
      Vos coordonnées légales (SIRET, adresse, logo) qui figurent en tête de facture se règlent dans
      <NuxtLink
        to="/parametres#exploitation"
        class="font-medium text-[var(--honey-deep)] hover:underline"
      >
        Paramètres → Exploitation
      </NuxtLink>
      . Votre abonnement se gère dans
      <NuxtLink
        to="/parametres/abonnement"
        class="font-medium text-[var(--honey-deep)] hover:underline"
      >
        Abonnement
      </NuxtLink>
      .
    </p>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'default' });
useHead({ title: 'Facturation · APIGO' });

interface FacturationPrefs {
  iban: string;
  bic: string;
  banque: string;
  titulaire: string;
  modePaiement: string;
  afficherRib: boolean;
}

const authStore = useAuthStore();
const notifications = useNotifications();
const profil = computed(() => authStore.profil);

const facturation = reactive<FacturationPrefs>({
  iban: '',
  bic: '',
  banque: '',
  titulaire: '',
  modePaiement: 'virement',
  afficherRib: false,
});

const modePaiementOptions = [
  { label: 'Virement bancaire', value: 'virement' },
  { label: 'Chèque', value: 'cheque' },
  { label: 'Espèces', value: 'especes' },
  { label: 'Carte bancaire', value: 'cb' },
  { label: 'Autre', value: 'autre' },
];

const modePaiementLabel = computed(
  () =>
    modePaiementOptions.find((m) => m.value === facturation.modePaiement)?.label ??
    'Virement bancaire',
);

function hydrate(): void {
  const fp = ((profil.value?.preferences as Record<string, unknown> | null)?.facturation ??
    {}) as Partial<FacturationPrefs>;
  facturation.iban = fp.iban ?? '';
  facturation.bic = fp.bic ?? '';
  facturation.banque = fp.banque ?? '';
  facturation.titulaire = fp.titulaire ?? '';
  facturation.modePaiement = fp.modePaiement ?? 'virement';
  facturation.afficherRib = fp.afficherRib ?? false;
}
watch(profil, hydrate, { immediate: true });

const saving = ref(false);
async function save(): Promise<void> {
  saving.value = true;
  try {
    const existing = (profil.value?.preferences ?? {}) as Record<string, unknown>;
    await authStore.updateProfil({ preferences: { ...existing, facturation: { ...facturation } } });
    notifications.success('Coordonnées de facturation enregistrées ✅');
  } catch (e: unknown) {
    notifications.error(getApiErrorMessage(e, 'Erreur lors de la sauvegarde'));
  } finally {
    saving.value = false;
  }
}
</script>

<style scoped>
.lbl {
  display: block;
  margin-bottom: 4px;
  font-size: 12px;
  font-weight: 500;
  color: var(--text-secondary);
}
</style>
