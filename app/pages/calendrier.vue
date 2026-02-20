<template>
  <div>
    <UiPageHeader :title="titrePageMois" description="Interventions et événements">
      <template #actions>
        <div class="flex items-center gap-1">
          <UButton
            icon="i-lucide-chevron-left"
            variant="ghost"
            color="neutral"
            size="sm"
            @click="moisPrecedent"
          />
          <UButton
            label="Aujourd'hui"
            variant="outline"
            color="neutral"
            size="sm"
            @click="aujourdhui"
          />
          <UButton
            icon="i-lucide-chevron-right"
            variant="ghost"
            color="neutral"
            size="sm"
            @click="moisSuivant"
          />
        </div>
        <UButton
          label="Nouvelle intervention"
          icon="i-lucide-plus"
          color="primary"
          to="/interventions/nouvelle"
        />
      </template>
    </UiPageHeader>

    <!-- Légende -->
    <div class="mb-4 flex flex-wrap items-center gap-4 text-xs text-stone-500">
      <span class="flex items-center gap-1.5">
        <span class="h-2.5 w-2.5 rounded-full bg-amber-400" />
        Interventions
      </span>
      <span class="ml-auto text-stone-400">
        {{ totalEvenements }} événement{{ totalEvenements > 1 ? 's' : '' }} ce mois
      </span>
    </div>

    <!-- Grille calendrier -->
    <div class="overflow-hidden rounded-2xl border border-stone-200/60 bg-white shadow-sm">
      <!-- En-têtes jours -->
      <div class="grid grid-cols-7 border-b border-stone-100">
        <div
          v-for="jour in jours"
          :key="jour"
          class="py-2 text-center text-xs font-semibold text-stone-400"
        >
          {{ jour }}
        </div>
      </div>

      <!-- Cellules -->
      <div class="grid grid-cols-7">
        <div
          v-for="(cellule, idx) in cellules"
          :key="idx"
          class="group relative min-h-[110px] border-b border-r border-stone-100 p-1.5 transition-colors last:border-r-0"
          :class="[
            !cellule.dansMois ? 'bg-stone-50/50' : 'cursor-pointer hover:bg-amber-50/30',
            cellule.estAujourdhui ? 'bg-amber-50/40' : '',
          ]"
          @click="cellule.dansMois && ouvrirCellule(cellule)"
        >
          <!-- Numéro du jour -->
          <div class="mb-1 flex items-center justify-between">
            <span
              class="flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium"
              :class="
                cellule.estAujourdhui
                  ? 'bg-amber-500 text-white'
                  : cellule.dansMois
                    ? 'text-stone-700'
                    : 'text-stone-300'
              "
            >
              {{ cellule.jour }}
            </span>
            <!-- Bouton + au hover -->
            <button
              v-if="cellule.dansMois"
              class="flex h-5 w-5 items-center justify-center rounded opacity-0 transition-opacity group-hover:opacity-100 hover:bg-amber-100"
              title="Ajouter un événement"
              @click.stop="ouvrirModalAjout(cellule)"
            >
              <UIcon name="i-lucide-plus" class="h-3 w-3 text-amber-600" />
            </button>
          </div>

          <!-- Événements -->
          <div class="space-y-0.5">
            <NuxtLink
              v-for="ev in cellule.evenements.slice(0, 3)"
              :key="ev.id"
              :to="ev.url"
              class="block truncate rounded px-1.5 py-0.5 text-[10px] font-medium transition-opacity hover:opacity-80"
              :class="
                ev.type === 'intervention'
                  ? 'bg-amber-100 text-amber-700'
                  : 'bg-sky-100 text-sky-700'
              "
              :title="ev.titre"
              @click.stop
            >
              {{ ev.titre }}
            </NuxtLink>
            <button
              v-if="cellule.evenements.length > 3"
              class="w-full rounded px-1.5 py-0.5 text-left text-[10px] text-stone-400 hover:text-stone-600"
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
            class="w-full max-w-sm rounded-2xl border border-stone-200/60 bg-white p-6 shadow-xl"
          >
            <div class="mb-4 flex items-center justify-between">
              <h3 class="text-base font-semibold text-stone-900">
                {{ formatDateFull(jourSelectionne.date) }}
              </h3>
              <button
                class="rounded-lg p-1 text-stone-400 hover:bg-stone-100"
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
                class="flex items-center gap-3 rounded-xl p-2.5 transition-colors hover:bg-stone-50"
                @click="jourSelectionne = null"
              >
                <span
                  class="h-2 w-2 rounded-full"
                  :class="ev.type === 'intervention' ? 'bg-amber-400' : 'bg-sky-400'"
                />
                <div class="min-w-0">
                  <p class="truncate text-sm font-medium text-stone-800">{{ ev.titre }}</p>
                  <p class="text-xs text-stone-400">{{ ev.sousTitre }}</p>
                </div>
                <UIcon
                  name="i-lucide-arrow-right"
                  class="ml-auto h-4 w-4 shrink-0 text-stone-300"
                />
              </NuxtLink>
            </div>
            <!-- Ajout depuis ce modal aussi -->
            <div class="mt-4 border-t border-stone-100 pt-4">
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
            class="w-full max-w-xs rounded-2xl border border-stone-200/60 bg-white p-6 shadow-xl"
          >
            <!-- Date sélectionnée -->
            <div class="mb-5 flex items-center gap-3">
              <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100">
                <UIcon name="i-lucide-calendar-plus" class="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p class="text-sm font-semibold text-stone-900">Nouvel événement</p>
                <p class="text-xs text-stone-500">{{ formatDateFull(modalAjout.date) }}</p>
              </div>
              <button
                class="ml-auto rounded-lg p-1 text-stone-400 hover:bg-stone-100"
                @click="modalAjout = null"
              >
                <UIcon name="i-lucide-x" class="h-4 w-4" />
              </button>
            </div>

            <p class="mb-3 text-xs font-medium uppercase tracking-wider text-stone-400">
              Type d'événement
            </p>

            <button
              class="flex w-full items-center gap-3 rounded-xl border-2 border-amber-200 bg-amber-50 px-4 py-3 text-left transition-all hover:border-amber-400 hover:bg-amber-100"
              @click="naviguerVersAjout(modalAjout.date)"
            >
              <div class="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500">
                <UIcon name="i-lucide-zap" class="h-5 w-5 text-white" />
              </div>
              <div>
                <p class="text-sm font-semibold text-stone-900">Intervention</p>
                <p class="text-xs text-stone-500">Traitement, récolte, nourrissement, contrôle…</p>
              </div>
              <UIcon name="i-lucide-chevron-right" class="ml-auto h-4 w-4 text-stone-300" />
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
  date: string;
  titre: string;
  sousTitre: string;
  url: string;
}

const evenements = ref<Evenement[]>([]);
const loadingEv = ref(false);

async function fetchEvenements() {
  loadingEv.value = true;
  try {
    const interventionsRes = await $fetch<{
      data: Array<{
        id: string;
        dateVisite: string;
        type: string;
        rucheNumero?: string;
        rucherNom?: string;
      }>;
    }>('/api/interventions', { query: { limit: 100, page: 1 } }).catch(() => ({ data: [] }));

    evenements.value = interventionsRes.data.map((it) => ({
      id: it.id,
      type: 'intervention' as const,
      date: it.dateVisite,
      titre: it.type ?? 'Intervention',
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
