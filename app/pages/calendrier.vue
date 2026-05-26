<template>
  <div class="space-y-5">
    <!-- Header -->
    <div class="flex items-center justify-between flex-wrap gap-3">
      <div class="flex items-center gap-3">
        <h1
          class="text-[26px] font-semibold tracking-[-0.02em] capitalize"
          style="font-family: 'SF Pro Display', -apple-system, system-ui, sans-serif"
        >
          {{ titrePageMois }}
        </h1>
        <div class="flex items-center gap-1">
          <button
            type="button"
            class="flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--border-default)] text-[var(--text-secondary)] transition-colors hover:bg-[var(--surface-muted)]"
            @click="moisPrecedent"
          >
            <UIcon name="i-lucide-chevron-left" class="h-4 w-4" />
          </button>
          <button
            type="button"
            class="rounded-lg border border-[var(--border-default)] px-3 py-1.5 text-[12.5px] font-medium text-[var(--text-secondary)] transition-colors hover:bg-[var(--surface-muted)]"
            @click="aujourdhui"
          >
            Aujourd'hui
          </button>
          <button
            type="button"
            class="flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--border-default)] text-[var(--text-secondary)] transition-colors hover:bg-[var(--surface-muted)]"
            @click="moisSuivant"
          >
            <UIcon name="i-lucide-chevron-right" class="h-4 w-4" />
          </button>
        </div>
      </div>
      <div class="flex items-center gap-2">
        <!-- Legend -->
        <div class="hidden sm:flex items-center gap-3 mr-2">
          <span class="flex items-center gap-1.5 text-[12px] text-[var(--text-tertiary)]">
            <span class="h-2 w-2 rounded-full" style="background-color: var(--honey)" />
            Interventions
          </span>
          <span class="flex items-center gap-1.5 text-[12px] text-[var(--text-tertiary)]">
            <span class="h-2 w-2 rounded-full bg-violet-400" />
            Rendez-vous pro
          </span>
          <span class="text-[12px] text-[var(--text-tertiary)]">
            {{ totalEvenements }} événement{{ totalEvenements > 1 ? 's' : '' }}
          </span>
        </div>
        <UButton
          label="Nouvelle intervention"
          icon="i-lucide-plus"
          color="primary"
          size="sm"
          to="/interventions/nouvelle"
        />
      </div>
    </div>

    <!-- Calendar grid -->
    <div class="overflow-hidden rounded-[14px] border border-[var(--border-default)] bg-white">
      <!-- Weekday header row -->
      <div class="grid grid-cols-7 border-b border-[var(--border-default)]">
        <div
          v-for="jour in jours"
          :key="jour"
          class="py-2.5 text-center text-[10.5px] font-semibold uppercase tracking-[0.06em] text-[var(--text-tertiary)]"
          style="background-color: var(--surface-muted)"
        >
          {{ jour }}
        </div>
      </div>

      <!-- Day cells -->
      <div class="grid grid-cols-7">
        <div
          v-for="(cellule, idx) in cellules"
          :key="idx"
          class="group relative min-h-[116px] border-b border-r border-[var(--border-default)] p-1.5 transition-colors last:border-r-0"
          :class="[
            !cellule.dansMois ? 'bg-[var(--surface-muted)]/50' : 'cursor-pointer hover:bg-[var(--honey-soft)]/30',
            cellule.estAujourdhui ? 'bg-[var(--honey-soft)]' : '',
          ]"
          @click="cellule.dansMois && ouvrirCellule(cellule)"
        >
          <!-- Day number -->
          <div class="mb-1 flex items-center justify-between">
            <span
              class="flex h-6 w-6 items-center justify-center rounded-full text-[12px] font-medium"
              :class="
                cellule.estAujourdhui
                  ? 'bg-[var(--honey)] text-white'
                  : cellule.dansMois
                    ? 'text-[var(--text-primary)]'
                    : 'text-[var(--text-tertiary)]'
              "
            >
              {{ cellule.jour }}
            </span>
            <!-- Add button on hover -->
            <button
              v-if="cellule.dansMois"
              class="flex h-5 w-5 items-center justify-center rounded opacity-0 transition-opacity group-hover:opacity-100 hover:bg-[var(--honey-soft)]"
              title="Ajouter un événement"
              @click.stop="ouvrirModalAjout(cellule)"
            >
              <UIcon name="i-lucide-plus" class="h-3 w-3" style="color: var(--honey-deep)" />
            </button>
          </div>

          <!-- Events -->
          <div class="space-y-0.5">
            <NuxtLink
              v-for="ev in cellule.evenements.slice(0, 3)"
              :key="ev.id"
              :to="ev.url"
              class="block truncate rounded-[4px] px-1.5 py-0.5 text-[10px] font-medium transition-opacity hover:opacity-80"
              :class="
                ev.sousType === 'rendez_vous_pro'
                  ? 'bg-violet-100 text-violet-700'
                  : ev.type === 'intervention'
                    ? 'bg-[var(--honey-soft)] text-[var(--honey-deep)]'
                    : 'bg-[var(--status-info)]/10 text-[var(--status-info)]'
              "
              :title="ev.titre"
              @click.stop
            >
              {{ ev.titre }}
            </NuxtLink>
            <button
              v-if="cellule.evenements.length > 3"
              class="w-full rounded px-1.5 py-0.5 text-left text-[10px] text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"
              @click.stop="ouvrirJour(cellule)"
            >
              +{{ cellule.evenements.length - 3 }} autres
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- ── Modal détail journée ────────────────────────────────────────────── -->
    <Teleport to="body">
      <Transition name="fade">
        <div
          v-if="jourSelectionne"
          class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          @click.self="jourSelectionne = null"
        >
          <div
            class="w-full max-w-sm rounded-[16px] border border-[var(--border-default)] bg-white p-6 shadow-xl"
          >
            <div class="mb-4 flex items-center justify-between">
              <h3
                class="text-[15px] font-semibold text-[var(--text-primary)]"
                style="font-family: 'SF Pro Display', -apple-system, system-ui, sans-serif"
              >
                {{ formatDateFull(jourSelectionne.date) }}
              </h3>
              <button
                class="rounded-lg p-1 text-[var(--text-tertiary)] hover:bg-[var(--surface-muted)]"
                @click="jourSelectionne = null"
              >
                <UIcon name="i-lucide-x" class="h-4 w-4" />
              </button>
            </div>
            <div class="space-y-2">
              <NuxtLink
                v-for="ev in jourSelectionne.evenements"
                :key="ev.id"
                :to="ev.url"
                class="flex items-center gap-3 rounded-xl p-2.5 transition-colors hover:bg-[var(--surface-muted)]"
                @click="jourSelectionne = null"
              >
                <span
                  class="h-2 w-2 rounded-full"
                  :class="ev.type === 'intervention' ? 'bg-[var(--honey)]' : 'bg-violet-400'"
                />
                <div class="min-w-0">
                  <p class="truncate text-[13px] font-medium text-[var(--text-primary)]">{{ ev.titre }}</p>
                  <p class="text-[11.5px] text-[var(--text-tertiary)]">{{ ev.sousTitre }}</p>
                </div>
                <UIcon name="i-lucide-arrow-right" class="ml-auto h-4 w-4 shrink-0 text-[var(--text-tertiary)]" />
              </NuxtLink>
            </div>
            <div class="mt-4 border-t border-[var(--border-default)] pt-4">
              <UButton
                label="Ajouter une intervention"
                icon="i-lucide-zap"
                color="primary"
                variant="soft"
                size="sm"
                class="w-full"
                @click="naviguerVersAjout(jourSelectionne.date)"
              />
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- ── Modal ajout événement ───────────────────────────────────────────── -->
    <Teleport to="body">
      <Transition name="fade">
        <div
          v-if="modalAjout"
          class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          @click.self="modalAjout = null"
        >
          <div
            class="w-full max-w-xs rounded-[16px] border border-[var(--border-default)] bg-white p-6 shadow-xl"
          >
            <!-- Date sélectionnée -->
            <div class="mb-5 flex items-center gap-3">
              <div class="flex h-10 w-10 items-center justify-center rounded-xl" style="background: var(--honey-soft)">
                <UIcon name="i-lucide-calendar-plus" class="h-5 w-5" style="color: var(--honey-deep)" />
              </div>
              <div>
                <p class="text-[13px] font-semibold text-[var(--text-primary)]">Nouvel événement</p>
                <p class="text-[12px] text-[var(--text-tertiary)]">{{ formatDateFull(modalAjout.date) }}</p>
              </div>
              <button
                class="ml-auto rounded-lg p-1 text-[var(--text-tertiary)] hover:bg-[var(--surface-muted)]"
                @click="modalAjout = null"
              >
                <UIcon name="i-lucide-x" class="h-4 w-4" />
              </button>
            </div>

            <p class="mb-3 text-[11px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">
              Type d'événement
            </p>

            <!-- Intervention -->
            <button
              class="flex w-full items-center gap-3 rounded-xl border-2 px-4 py-3 text-left transition-all"
              style="border-color: var(--honey-soft); background: var(--honey-soft)"
              @click="naviguerVersAjout(modalAjout.date)"
            >
              <div class="flex h-9 w-9 items-center justify-center rounded-lg" style="background: var(--honey)">
                <UIcon name="i-lucide-zap" class="h-5 w-5 text-white" />
              </div>
              <div>
                <p class="text-[13px] font-semibold text-[var(--text-primary)]">Intervention</p>
                <p class="text-[11.5px] text-[var(--text-secondary)]">Traitement, récolte, nourrissement, contrôle…</p>
              </div>
              <UIcon name="i-lucide-chevron-right" class="ml-auto h-4 w-4 text-[var(--text-tertiary)]" />
            </button>

            <!-- RDV pro : modifier si déjà existant, créer sinon -->
            <NuxtLink
              v-if="rdvProDuJour(modalAjout)"
              :to="`/interventions/${rdvProDuJour(modalAjout)!.id}`"
              class="mt-2 flex w-full items-center gap-3 rounded-xl border-2 border-violet-200 bg-violet-50 px-4 py-3 text-left transition-all hover:border-violet-400 hover:bg-violet-100"
              @click="modalAjout = null"
            >
              <div class="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-500">
                <UIcon name="i-lucide-pencil" class="h-5 w-5 text-white" />
              </div>
              <div>
                <p class="text-[13px] font-semibold text-[var(--text-primary)]">Modifier le rendez-vous</p>
                <p class="text-[11.5px] text-[var(--text-secondary)]">Un rendez-vous pro est déjà prévu ce jour</p>
              </div>
              <UIcon name="i-lucide-chevron-right" class="ml-auto h-4 w-4 text-[var(--text-tertiary)]" />
            </NuxtLink>
            <button
              v-else
              class="mt-2 flex w-full items-center gap-3 rounded-xl border-2 border-violet-200 bg-violet-50 px-4 py-3 text-left transition-all hover:border-violet-400 hover:bg-violet-100"
              @click="naviguerVersRdvPro(modalAjout.date)"
            >
              <div class="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-500">
                <UIcon name="i-lucide-briefcase" class="h-5 w-5 text-white" />
              </div>
              <div>
                <p class="text-[13px] font-semibold text-[var(--text-primary)]">Rendez-vous pro</p>
                <p class="text-[11.5px] text-[var(--text-secondary)]">Vétérinaire, syndicat, fournisseur, client…</p>
              </div>
              <UIcon name="i-lucide-chevron-right" class="ml-auto h-4 w-4 text-[var(--text-tertiary)]" />
            </button>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'default' });

const jours = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

// ── Navigation mois ───────────────────────────────────────────────────────────
const aujourdhuiDate = new Date();
const annee = ref(aujourdhuiDate.getFullYear());
const mois = ref(aujourdhuiDate.getMonth()); // 0-indexed

function moisSuivant() {
  if (mois.value === 11) {
    mois.value = 0;
    annee.value++;
  } else mois.value++;
}
function moisPrecedent() {
  if (mois.value === 0) {
    mois.value = 11;
    annee.value--;
  } else mois.value--;
}
function aujourdhui() {
  annee.value = aujourdhuiDate.getFullYear();
  mois.value = aujourdhuiDate.getMonth();
}

const titrePageMois = computed(() =>
  new Date(annee.value, mois.value, 1).toLocaleDateString('fr-FR', {
    month: 'long',
    year: 'numeric',
  }),
);

// ── Fetch événements ──────────────────────────────────────────────────────────
interface Evenement {
  id: string;
  type: 'intervention';
  sousType?: string;
  date: string;
  titre: string;
  sousTitre: string;
  url: string;
}

const evenements = ref<Evenement[]>([]);
const loadingEv = ref(false);

const TYPE_LABELS: Record<string, string> = {
  rendez_vous_pro: 'Rendez-vous pro',
  visite_rucher: 'Visite du rucher',
  controle: 'Contrôle',
  traitement: 'Traitement',
  varroa: 'Varroa',
  nourrissement: 'Nourrissement',
  recolte: 'Récolte',
  pesee: 'Pesée',
  materiel: 'Matériel',
  sanitaire: 'Sanitaire',
  essaimage: 'Essaimage',
  division: 'Division',
  deplacement: 'Déplacement',
  reine: 'Reine',
  commentaire: 'Note',
  multi: 'Visite complète',
};

async function fetchEvenements() {
  loadingEv.value = true;
  try {
    // Plage du mois affiché (en UTC pour correspondre au stockage serveur)
    const from = new Date(annee.value, mois.value, 1).toISOString();
    const to = new Date(annee.value, mois.value + 1, 0, 23, 59, 59, 999).toISOString();

    const interventionsRes = await $fetch<{
      data: Array<{
        id: string;
        dateVisite: string;
        type: string;
        rucheNumero?: string;
        rucherNom?: string;
      }>;
    }>('/api/interventions', {
      query: { limit: 1000, page: 1, from, to, excludeRdvPro: false },
    }).catch(() => ({ data: [] }));

    evenements.value = interventionsRes.data.map((it) => ({
      id: it.id,
      type: 'intervention' as const,
      sousType: it.type,
      date: it.dateVisite,
      titre: TYPE_LABELS[it.type] ?? it.type ?? 'Intervention',
      sousTitre: [it.rucheNumero, it.rucherNom].filter(Boolean).join(' — '),
      url: `/interventions/${it.id}`,
    }));
  } finally {
    loadingEv.value = false;
  }
}

// ── Construction grille ───────────────────────────────────────────────────────
interface Cellule {
  jour: number;
  date: Date;
  dansMois: boolean;
  estAujourdhui: boolean;
  evenements: Evenement[];
}

const cellules = computed<Cellule[]>(() => {
  const premier = new Date(annee.value, mois.value, 1);
  const dernier = new Date(annee.value, mois.value + 1, 0);

  let debutSemaine = premier.getDay() - 1;
  if (debutSemaine < 0) debutSemaine = 6;

  const cells: Cellule[] = [];

  const moisPrec = new Date(annee.value, mois.value, 0);
  for (let i = debutSemaine - 1; i >= 0; i--) {
    const date = new Date(annee.value, mois.value - 1, moisPrec.getDate() - i);
    cells.push({
      jour: date.getDate(),
      date,
      dansMois: false,
      estAujourdhui: false,
      evenements: [],
    });
  }

  for (let d = 1; d <= dernier.getDate(); d++) {
    const date = new Date(annee.value, mois.value, d);
    const isToday =
      date.getDate() === aujourdhuiDate.getDate() &&
      date.getMonth() === aujourdhuiDate.getMonth() &&
      date.getFullYear() === aujourdhuiDate.getFullYear();

    const evJour = evenements.value.filter((ev) => {
      const evDate = new Date(ev.date);
      return (
        evDate.getFullYear() === annee.value &&
        evDate.getMonth() === mois.value &&
        evDate.getDate() === d
      );
    });

    cells.push({ jour: d, date, dansMois: true, estAujourdhui: isToday, evenements: evJour });
  }

  let next = 1;
  while (cells.length < 42) {
    const date = new Date(annee.value, mois.value + 1, next++);
    cells.push({
      jour: date.getDate(),
      date,
      dansMois: false,
      estAujourdhui: false,
      evenements: [],
    });
  }

  return cells;
});

const totalEvenements = computed(() =>
  cellules.value.filter((c) => c.dansMois).reduce((acc, c) => acc + c.evenements.length, 0),
);

// ── Modals ────────────────────────────────────────────────────────────────────
const jourSelectionne = ref<Cellule | null>(null);
const modalAjout = ref<Cellule | null>(null);

function ouvrirJour(cellule: Cellule) {
  jourSelectionne.value = cellule;
}

/** Clic sur la cellule → ouvre le modal si des événements existent, sinon ajout direct */
function ouvrirCellule(cellule: Cellule) {
  if (cellule.evenements.length > 0) {
    jourSelectionne.value = cellule;
  } else {
    modalAjout.value = cellule;
  }
}

function ouvrirModalAjout(cellule: Cellule) {
  modalAjout.value = cellule;
}

function dateToQueryString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function naviguerVersAjout(date: Date) {
  const dateStr = dateToQueryString(date);
  modalAjout.value = null;
  jourSelectionne.value = null;
  navigateTo(`/interventions/nouvelle?date=${dateStr}`);
}

/** Retourne le rendez-vous pro existant sur une cellule, ou null */
function rdvProDuJour(cellule: Cellule): Evenement | null {
  return cellule.evenements.find((ev) => ev.sousType === 'rendez_vous_pro') ?? null;
}

function naviguerVersRdvPro(date: Date) {
  const dateStr = dateToQueryString(date);
  modalAjout.value = null;
  jourSelectionne.value = null;
  navigateTo(`/interventions/nouvelle?date=${dateStr}&type=rendez_vous_pro`);
}

function formatDateFull(date: Date): string {
  return date.toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

watch([annee, mois], fetchEvenements);
onMounted(fetchEvenements);

// DataBus: rafraîchir le calendrier après création/suppression d'intervention
const { on } = useDataBus();
on(['intervention:created', 'intervention:updated', 'intervention:deleted'], fetchEvenements);
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 200ms ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
