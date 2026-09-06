<script setup lang="ts">
definePageMeta({ layout: 'default' });

const toast = useToast();
const { emit, on } = useDataBus();
const showModal = ref(false);
const editTarget = ref<Record<string, unknown> | null>(null);

/**
 * La forme servie par `/api/elevage/sessions`, écrite ici parce qu'elle n'est
 * plus déduite de la route (cf. le commentaire de l'appel juste en dessous).
 * L'index signature garde le reste des colonnes accessible aux fonctions qui
 * travaillent en `Record<string, unknown>` (openEdit, tauxAcceptation…).
 */
type SessionGreffage = {
  id: string;
  dateGreffage: string;
  reineMereId: string | null;
  rucheEleveuse: string | null;
  nombreCellulesGreffees: number;
  nombreCellulesAcceptees: number | null;
  technique: string | null;
  notes: string | null;
  estTerminee: boolean;
  [colonne: string]: unknown;
};
interface ReponseSessions {
  data: SessionGreffage[];
  total: number;
  page: number;
  limit: number;
}

/**
 * ⚠️ `useAsyncData` + `appelApi`, ET PAS `useFetch` — cf. `app/utils/appelApi.ts`.
 * Résoudre le chemin contre l'union des 213 routes fait déplier à TypeScript le
 * type de retour réel de chaque handler. Le type est désormais NOMMÉ ci-dessus,
 * donc vérifié ; la `query`, constante, est sérialisée dans l'URL.
 */
const { data, pending, error, refresh } = useAsyncData<ReponseSessions>(
  'elevage-sessions',
  () => appelApi<ReponseSessions>('/api/elevage/sessions?limit=20&page=1'),
  { lazy: true },
);
on(['session_greffage:created', 'session_greffage:updated', 'session_greffage:deleted'], () =>
  refresh(),
);
onMounted(() => refresh());

/** Une ligne par reine, jointe à sa lignée — cf. `server/api/elevage/reines/index.get.ts`. */
interface ReponseReinesElevage {
  data: Array<Record<string, unknown>>;
}

/**
 * ⚠️ Même bascule que ci-dessus — cf. `app/utils/appelApi.ts`. La clé reste
 * `elevage-reines-select` : c'est elle que `refreshNuxtData` rappelle plus bas.
 */
const { data: reinesData } = useAsyncData<ReponseReinesElevage>(
  'elevage-reines-select',
  () => appelApi<ReponseReinesElevage>('/api/elevage/reines?limit=100&page=1&active=true'),
  { lazy: true },
);

/**
 * ⚠️ CETTE LISTE VENAIT D'UN `useFetch` QUE RIEN NE RAFRAÎCHISSAIT. Maya crée
 * une reine à la voix, et le sélecteur de reine continuait d'afficher l'ancien jeu jusqu'au
 * rechargement de la page — l'apiculteur cherche ce qu'il vient de créer, ne le
 * trouve pas, et le recrée.
 */
const { on: surEvenementDonneesReines } = useDataBus();
surEvenementDonneesReines(['reine:created', 'reine:updated', 'reine:deleted'], () => {
  void refreshNuxtData(['elevage-reines-select']);
});

const reinesOptions = computed(() =>
  (reinesData.value?.data || []).map((r: Record<string, unknown>) => {
    const reine = r.reine as Record<string, unknown>;
    return {
      label: (reine.identifiant as string) || `Reine ${(reine.anneeNaissance as string) || ''}`,
      value: reine.id as string,
    };
  }),
);

/**
 * « Aucune reine » n'est PAS « pas encore chargé ».
 *
 * La requête est `lazy` : `data` vaut null le temps de l'aller-retour. Tester
 * la longueur seule affichait « vous n'avez aucune reine » à tout le monde
 * pendant une fraction de seconde — un mensonge, et le clignotement qui va avec.
 */
const aucuneReine = computed(() => reinesData.value != null && reinesOptions.value.length === 0);

const techniqueOptions = [
  { label: 'Doolittle', value: 'doolittle' },
  { label: 'Cupule artificielle', value: 'cupule_artificielle' },
  { label: 'Transfert direct', value: 'transfert' },
];

const form = reactive({
  dateGreffage: dateDuJour(),
  reineMereId: '' as string | undefined,
  rucheEleveuse: '',
  nombreCellulesGreffees: '',
  nombreCellulesAcceptees: '',
  technique: '' as string,
  notes: '',
});

const saving = ref(false);

const receptricesModalOpen = ref(false);
const receptricesSession = ref<{ id: string; nombreCellulesGreffees?: number } | null>(null);
function openReceptrices(s: Record<string, unknown>) {
  receptricesSession.value = {
    id: s.id as string,
    nombreCellulesGreffees: s.nombreCellulesGreffees as number | undefined,
  };
  receptricesModalOpen.value = true;
}

/**
 * La session précédente — la liste est rendue par date décroissante, donc c'est
 * la première. Sert à pré-remplir la suivante (demande de Roger).
 */
const dernniereSession = computed<Record<string, unknown> | null>(
  () => (data.value?.data ?? [])[0] ?? null,
);

/** Ce qui a été repris de la session précédente, pour le DIRE à l'apiculteur. */
const preRemplie = ref(false);

function openCreate() {
  editTarget.value = null;
  // Un éleveur greffe EN SÉRIE : même reine mère, même ruche éleveuse, même
  // technique, même nombre de cellules, à quelques jours d'intervalle. Repartir
  // d'un formulaire vide, c'est lui faire retaper la même chose chaque semaine.
  //
  // Ce qui n'est PAS repris : la date (c'est aujourd'hui), les cellules
  // acceptées (elles ne se comptent qu'après) et les notes (propres à la
  // session). Reprendre un résultat passé pour un résultat présent serait un
  // chiffre inventé.
  const p = dernniereSession.value;
  preRemplie.value = p != null;
  Object.assign(form, {
    dateGreffage: dateDuJour(),
    reineMereId: (p?.reineMereId as string) || undefined,
    rucheEleveuse: (p?.rucheEleveuse as string) || '',
    nombreCellulesGreffees: (p?.nombreCellulesGreffees as number | string) ?? '',
    nombreCellulesAcceptees: '',
    technique: (p?.technique as string) || '',
    notes: '',
  });
  showModal.value = true;
}

function openEdit(s: Record<string, unknown>) {
  editTarget.value = s;
  preRemplie.value = false;
  Object.assign(form, {
    dateGreffage: (s.dateGreffage as string)?.slice(0, 10) || '',
    reineMereId: (s.reineMereId as string) || null,
    rucheEleveuse: (s.rucheEleveuse as string) || '',
    nombreCellulesGreffees: s.nombreCellulesGreffees || '',
    nombreCellulesAcceptees: s.nombreCellulesAcceptees || '',
    technique: (s.technique as string) || '',
    notes: (s.notes as string) || '',
  });
  showModal.value = true;
}

async function save() {
  saving.value = true;
  try {
    const payload = {
      ...form,
      dateGreffage: new Date(form.dateGreffage).toISOString(),
      reineMereId: form.reineMereId || null,
      nombreCellulesGreffees: Number(form.nombreCellulesGreffees),
      nombreCellulesAcceptees: form.nombreCellulesAcceptees
        ? Number(form.nombreCellulesAcceptees)
        : null,
      technique: form.technique || undefined,
    };
    if (editTarget.value) {
      // `appelApi` et non `$fetch` — cf. `app/utils/appelApi.ts`. La réponse
      // n'est pas lue : `unknown` suffit et ne déplie aucune route.
      await appelApi<unknown>(`/api/elevage/sessions/${editTarget.value.id as string}`, {
        method: 'PUT',
        body: payload,
      });
      toast.add({ title: 'Session modifiée', color: 'success' });
      emit('session_greffage:updated', { id: editTarget.value.id as string });
    } else {
      // `appelApi` et non `$fetch` — cf. `app/utils/appelApi.ts`.
      await appelApi<unknown>('/api/elevage/sessions', { method: 'POST', body: payload });
      toast.add({ title: 'Session créée', color: 'success' });
      emit('session_greffage:created');
    }
    showModal.value = false;
    await refresh();
  } catch (e) {
    toast.add({ title: getApiErrorMessage(e, 'Erreur'), color: 'error' });
  } finally {
    saving.value = false;
  }
}

function tauxAcceptation(s: Record<string, unknown>) {
  if (!s.nombreCellulesAcceptees || !s.nombreCellulesGreffees) return null;
  return Math.round(
    ((s.nombreCellulesAcceptees as number) / (s.nombreCellulesGreffees as number)) * 100,
  );
}

const tauxMoyen = computed(() => {
  const sessions = data.value?.data ?? [];
  const withTaux = sessions.map(tauxAcceptation).filter((t): t is number => t !== null);
  if (!withTaux.length) return null;
  return Math.round(withTaux.reduce((a, b) => a + b, 0) / withTaux.length);
});

const totalAcceptees = computed(() =>
  (data.value?.data ?? []).reduce(
    (sum: number, s: Record<string, unknown>) => sum + ((s.nombreCellulesAcceptees as number) ?? 0),
    0,
  ),
);

function tauxClass(taux: number | null) {
  if (taux === null) return 'text-[var(--text-tertiary)]';
  if (taux >= 70) return 'text-[var(--sage-deep)] bg-[var(--sage-soft)]';
  if (taux >= 40) return 'text-[var(--honey-deep)] bg-[var(--honey-soft)]';
  return 'text-[var(--status-bad)] bg-red-50';
}
</script>

<template>
  <div class="space-y-8">
    <!-- Header -->
    <div class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
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
          Greffage
        </h1>
        <p class="mt-1 text-sm text-[var(--text-secondary)]">
          Suivez vos sessions d'élevage de reines
        </p>
      </div>
      <UButton color="primary" icon="i-lucide-plus" @click="openCreate">Nouvelle session</UButton>
    </div>

    <!-- Nav tabs -->
    <div
      class="flex items-center gap-1 rounded-[10px] border border-[var(--border-default)] bg-[var(--surface-muted)] w-fit p-0.5"
    >
      <NuxtLink
        to="/elevage"
        class="rounded-[8px] px-4 py-1.5 text-xs font-medium text-[var(--text-tertiary)] transition-colors hover:text-[var(--text-secondary)]"
      >
        Reines
      </NuxtLink>
      <NuxtLink
        to="/elevage/lignees"
        class="rounded-[8px] px-4 py-1.5 text-xs font-medium text-[var(--text-tertiary)] transition-colors hover:text-[var(--text-secondary)]"
      >
        Lignées
      </NuxtLink>
      <span
        class="rounded-[8px] bg-white px-4 py-1.5 text-xs font-semibold text-[var(--text-primary)] shadow-sm"
      >
        Greffage
      </span>
    </div>

    <!-- 01 — Performances -->
    <section v-if="data?.data?.length" class="space-y-3">
      <p class="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--honey-deep)]">
        01 — Performances
      </p>
      <div class="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <div class="bg-white border border-[var(--border-default)] rounded-[14px] p-5">
          <p
            class="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--text-tertiary)]"
          >
            Taux moyen d'acceptation
          </p>
          <p class="mt-2 text-2xl font-semibold tabular-nums text-[var(--text-primary)]">
            {{ tauxMoyen !== null ? `${tauxMoyen}%` : '—' }}
          </p>
        </div>
        <div class="bg-white border border-[var(--border-default)] rounded-[14px] p-5">
          <p
            class="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--text-tertiary)]"
          >
            Total reines élevées
          </p>
          <p class="mt-2 text-2xl font-semibold tabular-nums text-[var(--text-primary)]">
            {{ totalAcceptees }}
          </p>
        </div>
        <div class="bg-white border border-[var(--border-default)] rounded-[14px] p-5">
          <p
            class="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--text-tertiary)]"
          >
            Sessions totales
          </p>
          <p class="mt-2 text-2xl font-semibold tabular-nums text-[var(--text-primary)]">
            {{ data?.total ?? '—' }}
          </p>
        </div>
      </div>
    </section>

    <!-- Sessions table -->
    <section class="space-y-3">
      <p class="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--honey-deep)]">
        {{ data?.data?.length ? '02 — Sessions' : '01 — Sessions' }}
      </p>

      <div v-if="pending" class="space-y-3">
        <div
          v-for="i in 5"
          :key="i"
          class="h-12 animate-pulse rounded-[14px] bg-[var(--surface-muted)]"
        />
      </div>

      <UiErrorState v-else-if="error" :error="error" :retry="refresh" />

      <div
        v-else-if="!data?.data?.length"
        class="flex flex-col items-center gap-3 rounded-[14px] border border-[var(--border-default)] bg-white py-20 text-center"
      >
        <UIcon name="i-lucide-scissors" class="h-12 w-12 text-[var(--text-tertiary)]" />
        <p class="font-medium text-[var(--text-primary)]">Prêt à élever vos reines ?</p>
        <UButton color="primary" variant="soft" @click="openCreate">Créer une session</UButton>
      </div>

      <div
        v-else
        class="bg-white border border-[var(--border-default)] rounded-[12px] overflow-hidden"
      >
        <table class="w-full">
          <thead class="bg-[var(--surface-muted)]">
            <tr>
              <th
                class="px-5 py-2.5 text-left text-[10.5px] font-semibold uppercase tracking-[0.08em] text-[var(--text-tertiary)]"
              >
                Date
              </th>
              <th
                class="hidden px-5 py-2.5 text-left text-[10.5px] font-semibold uppercase tracking-[0.08em] text-[var(--text-tertiary)] sm:table-cell"
              >
                Technique
              </th>
              <th
                class="px-5 py-2.5 text-left text-[10.5px] font-semibold uppercase tracking-[0.08em] text-[var(--text-tertiary)]"
              >
                Greffées
              </th>
              <th
                class="hidden px-5 py-2.5 text-left text-[10.5px] font-semibold uppercase tracking-[0.08em] text-[var(--text-tertiary)] sm:table-cell"
              >
                Acceptées
              </th>
              <th
                class="px-5 py-2.5 text-left text-[10.5px] font-semibold uppercase tracking-[0.08em] text-[var(--text-tertiary)]"
              >
                Taux
              </th>
              <th
                class="px-5 py-2.5 text-left text-[10.5px] font-semibold uppercase tracking-[0.08em] text-[var(--text-tertiary)]"
              >
                Statut
              </th>
              <th
                class="px-5 py-2.5 text-right text-[10.5px] font-semibold uppercase tracking-[0.08em] text-[var(--text-tertiary)]"
              >
                Actions
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-[var(--border-faint)]">
            <tr
              v-for="sess in data.data"
              :key="sess.id"
              class="transition-colors hover:bg-[var(--surface-primary)]"
            >
              <td class="px-5 py-3 text-sm font-medium text-[var(--text-primary)]">
                {{
                  new Date(sess.dateGreffage).toLocaleDateString('fr-FR', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                  })
                }}
              </td>
              <td class="hidden px-5 py-3 text-sm text-[var(--text-secondary)] sm:table-cell">
                {{ techniqueOptions.find((t) => t.value === sess.technique)?.label || '—' }}
              </td>
              <td class="px-5 py-3 text-sm tabular-nums text-[var(--text-secondary)]">
                {{ sess.nombreCellulesGreffees }}
              </td>
              <td
                class="hidden px-5 py-3 text-sm tabular-nums text-[var(--text-secondary)] sm:table-cell"
              >
                {{ sess.nombreCellulesAcceptees ?? '—' }}
              </td>
              <td class="px-5 py-3">
                <span
                  v-if="tauxAcceptation(sess) !== null"
                  class="rounded-full px-2.5 py-1 text-[11px] font-semibold"
                  :class="tauxClass(tauxAcceptation(sess)!)"
                >
                  {{ tauxAcceptation(sess) }}%
                </span>
                <span v-else class="text-xs text-[var(--text-tertiary)]">—</span>
              </td>
              <td class="px-5 py-3">
                <span
                  class="rounded-full px-2.5 py-1 text-[11px] font-semibold"
                  :class="
                    sess.estTerminee
                      ? 'bg-[var(--surface-muted)] text-[var(--text-tertiary)]'
                      : 'bg-[var(--honey-soft)] text-[var(--honey-deep)]'
                  "
                >
                  {{ sess.estTerminee ? 'Terminée' : 'En cours' }}
                </span>
              </td>
              <td class="px-5 py-3 text-right">
                <div class="flex items-center justify-end gap-1">
                  <button
                    type="button"
                    class="flex h-7 w-7 items-center justify-center rounded-[8px] text-[var(--text-tertiary)] transition-colors hover:bg-[var(--surface-muted)] hover:text-[var(--text-primary)]"
                    title="Récepteurs (ruchettes)"
                    @click="openReceptrices(sess)"
                  >
                    <UIcon name="i-lucide-list-checks" class="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    class="flex h-7 w-7 items-center justify-center rounded-[8px] text-[var(--text-tertiary)] transition-colors hover:bg-[var(--surface-muted)] hover:text-[var(--text-primary)]"
                    title="Modifier"
                    @click="openEdit(sess)"
                  >
                    <UIcon name="i-lucide-pencil" class="h-3.5 w-3.5" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <UModal
      v-model:open="showModal"
      :title="editTarget ? 'Modifier la session' : 'Nouvelle session de greffage'"
    >
      <template #body>
        <div class="space-y-4">
          <!-- On DIT que le formulaire est pré-rempli : sans ce mot, un champ
               déjà garni passe pour un bug ou pour une saisie oubliée. -->
          <p
            v-if="preRemplie && !editTarget"
            class="flex items-start gap-2 rounded-[10px] bg-[var(--honey-soft)] px-3 py-2 text-[12.5px] text-[var(--honey-deep)]"
          >
            <UIcon name="i-lucide-copy" class="mt-0.5 h-3.5 w-3.5 shrink-0" />
            Repris de votre dernière session — reine mère, ruche éleveuse, technique et nombre de
            cellules. Corrigez ce qui a changé.
          </p>
          <UFormField label="Date de greffage *">
            <UiMobileDatePicker v-model="form.dateGreffage" mode="date" />
          </UFormField>
          <UFormField label="Reine mère">
            <USelect
              v-model="form.reineMereId"
              :items="reinesOptions"
              value-key="value"
              label-key="label"
              :disabled="aucuneReine"
              :placeholder="
                aucuneReine ? 'Aucune reine enregistrée' : 'Sélectionner une reine mère'
              "
            />
            <!-- La liste vide ne disait RIEN : on cliquait, rien ne s'ouvrait,
                 et on cherchait la panne. Le champ est facultatif — on explique
                 donc ce qu'on perd à le laisser vide, sans bloquer la saisie. -->
            <p
              v-if="aucuneReine"
              class="mt-1.5 text-[12px] leading-relaxed text-[var(--text-tertiary)]"
            >
              Facultatif. Vous n’avez encore aucune reine enregistrée : en
              <NuxtLink
                to="/elevage/reines"
                class="font-medium text-[var(--honey-deep)] underline underline-offset-2"
                >créer une</NuxtLink
              >
              permet de rattacher ce greffage à sa lignée.
            </p>
          </UFormField>
          <UFormField label="Ruche éleveuse">
            <UInput v-model="form.rucheEleveuse" placeholder="Nom de la ruche éleveuse" />
          </UFormField>
          <div class="grid grid-cols-2 gap-3">
            <UFormField label="Cellules greffées *">
              <UInput
                v-model="form.nombreCellulesGreffees"
                type="number"
                min="1"
                placeholder="Ex: 20"
              />
            </UFormField>
            <UFormField label="Cellules acceptées">
              <UInput
                v-model="form.nombreCellulesAcceptees"
                type="number"
                min="0"
                placeholder="Ex: 15"
              />
            </UFormField>
          </div>
          <UFormField label="Technique">
            <USelect
              v-model="form.technique"
              :items="techniqueOptions"
              value-key="value"
              label-key="label"
              placeholder="Sélectionner"
            />
          </UFormField>
          <UFormField label="Notes">
            <UTextarea v-model="form.notes" :rows="3" placeholder="Conditions, observations..." />
          </UFormField>
        </div>
      </template>
      <template #footer>
        <div class="flex justify-end gap-3">
          <UButton color="neutral" variant="outline" @click="showModal = false">Annuler</UButton>
          <UButton color="primary" :loading="saving" @click="save">
            {{ editTarget ? 'Enregistrer' : 'Créer' }}
          </UButton>
        </div>
      </template>
    </UModal>

    <ElevageReceptricesModal v-model:open="receptricesModalOpen" :session="receptricesSession" />
  </div>
</template>
