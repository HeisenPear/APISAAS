<template>
  <div class="rounded-[14px] border border-[var(--border-default)] bg-white p-5">
    <div class="flex items-start gap-3">
      <div
        class="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px]"
        :style="`background:color-mix(in srgb, ${meta.couleur} 14%, transparent)`"
      >
        <UIcon :name="meta.icon" class="h-4.5 w-4.5" :style="`color:${meta.couleur}`" />
      </div>
      <div class="min-w-0 flex-1">
        <h2 class="text-[15px] font-semibold text-[var(--text-primary)]">
          Comment cette balance envoie ses données
        </h2>
        <p class="mt-1 text-[13px] leading-relaxed text-[var(--text-secondary)]">
          {{ meta.description }}
        </p>
      </div>
    </div>

    <!-- ─── WEBHOOK : la voie universelle ─── -->
    <div v-if="balance.source === 'webhook'" class="mt-4 space-y-3">
      <BalancesBalanceChampCopiable label="URL d’ingestion" :valeur="urlIngestion" />
      <BalancesBalanceChampCopiable label="Jeton secret" :valeur="balance.ingestToken" masquable />

      <div>
        <p
          class="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--text-tertiary)]"
        >
          Exemple de requête
        </p>
        <pre
          class="overflow-x-auto rounded-[10px] bg-[var(--surface-sunk)] p-3 text-[11.5px] leading-relaxed text-[var(--text-secondary)]"
        ><code>{{ exempleCurl }}</code></pre>
        <div class="mt-2 flex items-center justify-between gap-2">
          <p class="text-[11.5px] text-[var(--text-tertiary)]">
            Seul <code class="font-semibold">poids_kg</code> est obligatoire. Tout champ
            supplémentaire est conservé tel quel.
          </p>
          <UButton
            size="xs"
            variant="outline"
            color="neutral"
            icon="i-lucide-copy"
            @click="copier(exempleCurl, 'Exemple copié')"
          >
            Copier
          </UButton>
        </div>
      </div>
    </div>

    <!-- ─── BEEP : jeton + synchro ─── -->
    <div v-else-if="balance.source === 'beep'" class="mt-4 space-y-3">
      <UFormField label="Jeton d’accès BEEP" hint="api.beep.nl → Mon compte → API token">
        <UInput
          v-model="tokenBeep"
          type="password"
          placeholder="Collez votre jeton BEEP"
          autocomplete="off"
        />
      </UFormField>
      <p v-if="balance.identifiantExterne" class="text-[12px] text-[var(--text-tertiary)]">
        Appareil BEEP suivi :
        <span class="font-medium text-[var(--text-secondary)]">{{
          balance.identifiantExterne
        }}</span>
      </p>
      <div class="flex flex-wrap gap-2">
        <UButton
          color="neutral"
          variant="outline"
          :loading="enregistrement"
          :disabled="!tokenBeep.trim()"
          @click="enregistrerToken"
        >
          Enregistrer le jeton
        </UButton>
        <UButton
          color="primary"
          icon="i-lucide-refresh-cw"
          :loading="synchro"
          @click="synchroniser"
        >
          Synchroniser maintenant
        </UButton>
      </div>
    </div>

    <!-- ─── CSV : dépôt de fichier ─── -->
    <div v-else-if="balance.source === 'csv'" class="mt-4 space-y-3">
      <p v-if="meta.marques" class="text-[12px] text-[var(--text-tertiary)]">
        Concerné : {{ meta.marques }}.
      </p>
      <label
        class="flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-[12px] border border-dashed border-[var(--border-default)] bg-[var(--surface-muted)] px-4 py-8 text-center transition-colors hover:border-[var(--honey)] hover:bg-[var(--honey-soft)]"
      >
        <UIcon name="i-lucide-upload-cloud" class="h-6 w-6 text-[var(--text-tertiary)]" />
        <span class="text-[13.5px] font-medium text-[var(--text-primary)]">
          {{ fichier?.name ?? 'Déposez le fichier exporté (.csv)' }}
        </span>
        <span class="text-[11.5px] text-[var(--text-tertiary)]">
          Exportez-le depuis l’espace en ligne de votre fabricant.
        </span>
        <input type="file" accept=".csv,text/csv" class="hidden" @change="choisirFichier" />
      </label>
      <UButton
        color="primary"
        block
        icon="i-lucide-file-up"
        :loading="importEnCours"
        :disabled="!fichier"
        @click="importer"
      >
        Importer les mesures
      </UButton>
    </div>

    <!-- ─── MANUELLE : renvoi vers la saisie ─── -->
    <div v-else class="mt-4">
      <UButton color="primary" variant="outline" icon="i-lucide-scale" :to="lienPesee">
        Saisir une pesée
      </UButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import { sourceMeta } from '~/config/balances';
import type { Balance } from '~/composables/useBalances';

const props = defineProps<{ balance: Balance }>();
const emit = defineEmits<{ rafraichir: [] }>();

const { importerFichier, synchroniserBeep, enregistrerConnexion } = useBalanceActions();
const notifications = useNotifications();

const meta = computed(() => sourceMeta(props.balance.source));

/** L'API la calcule côté serveur (bonne origine en prod) ; repli côté client. */
const urlIngestion = computed(() => {
  if (props.balance.urlIngestion) return props.balance.urlIngestion;
  const origine = import.meta.client ? window.location.origin : 'https://apigo.fr';
  return `${origine}/api/balances/ingest/${props.balance.ingestToken}`;
});

const exempleCurl = computed(
  () => `curl -X POST ${urlIngestion.value} \\
  -H "Content-Type: application/json" \\
  -d '{"poids_kg": 42.60, "temperature_c": 18.4, "batterie_pct": 87}'`,
);

const lienPesee = computed(() =>
  props.balance.rucheId
    ? `/interventions/nouvelle?type=pesee&niveau=ruche&rucheId=${props.balance.rucheId}`
    : '/interventions/nouvelle?type=pesee',
);

async function copier(texte: string, message: string) {
  try {
    await navigator.clipboard.writeText(texte);
    notifications.success(message);
  } catch {
    notifications.error('Copie impossible', 'Sélectionnez le texte à la main.');
  }
}

// BEEP
const tokenBeep = ref('');
const enregistrement = ref(false);
const synchro = ref(false);

async function enregistrerToken() {
  enregistrement.value = true;
  try {
    await enregistrerConnexion(tokenBeep.value.trim());
    tokenBeep.value = '';
    notifications.success('Jeton BEEP enregistré');
  } catch (e) {
    notifications.error(getApiErrorMessage(e));
  } finally {
    enregistrement.value = false;
  }
}

async function synchroniser() {
  synchro.value = true;
  try {
    const res = await synchroniserBeep();
    notifications.success(
      'Synchronisation terminée',
      res.mesures ? `${res.mesures} mesure(s) récupérée(s).` : undefined,
    );
    emit('rafraichir');
  } catch (e) {
    notifications.error(getApiErrorMessage(e));
  } finally {
    synchro.value = false;
  }
}

// CSV
const fichier = ref<File | null>(null);
const importEnCours = ref(false);

function choisirFichier(e: Event) {
  fichier.value = (e.target as HTMLInputElement).files?.[0] ?? null;
}

async function importer() {
  if (!fichier.value) return;
  importEnCours.value = true;
  try {
    const res = await importerFichier(props.balance.id, fichier.value);
    fichier.value = null;
    notifications.success('Import terminé', `${res.importees} mesure(s) ajoutée(s).`);
    emit('rafraichir');
  } catch (e) {
    notifications.error(getApiErrorMessage(e));
  } finally {
    importEnCours.value = false;
  }
}
</script>
