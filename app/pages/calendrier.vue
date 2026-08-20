<template>
  <div class="space-y-5">
    <!-- ── Header ──────────────────────────────────────────────────────────── -->
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div class="flex items-center gap-3">
        <h1
          class="text-[26px] font-semibold capitalize tracking-[-0.02em]"
          style="
            font-family:
              'SF Pro Display',
              -apple-system,
              system-ui,
              sans-serif;
          "
        >
          {{ titrePageMois }}
        </h1>
        <div
          class="flex items-center gap-0.5 rounded-[10px] border border-[var(--border-default)] bg-white p-0.5"
        >
          <button
            aria-label="Mois précédent"
            type="button"
            class="flex h-7 w-7 items-center justify-center rounded-[7px] text-[var(--text-secondary)] transition-colors hover:bg-[var(--surface-muted)]"
            @click="moisPrecedent"
          >
            <UIcon name="i-lucide-chevron-left" class="h-4 w-4" />
          </button>
          <button
            type="button"
            class="rounded-[7px] px-3 py-1 text-[12.5px] font-medium text-[var(--text-secondary)] transition-colors hover:bg-[var(--surface-muted)]"
            @click="aujourdhui"
          >
            Aujourd'hui
          </button>
          <button
            aria-label="Mois suivant"
            type="button"
            class="flex h-7 w-7 items-center justify-center rounded-[7px] text-[var(--text-secondary)] transition-colors hover:bg-[var(--surface-muted)]"
            @click="moisSuivant"
          >
            <UIcon name="i-lucide-chevron-right" class="h-4 w-4" />
          </button>
        </div>
      </div>
      <div class="flex items-center gap-2">
        <!-- Legend -->
        <div class="mr-1 hidden items-center gap-3 lg:flex">
          <span class="flex items-center gap-1.5 text-[12px] text-[var(--text-tertiary)]">
            <span class="h-2 w-2 rounded-full" style="background-color: var(--honey)" />
            Interventions
          </span>
          <span class="flex items-center gap-1.5 text-[12px] text-[var(--text-tertiary)]">
            <span class="h-2 w-2 rounded-full bg-violet-400" />
            Rendez-vous
          </span>
        </div>
        <CalendrierSync />
        <UButton
          label="Nouvel événement"
          icon="i-lucide-plus"
          color="primary"
          size="sm"
          @click="openQuickCreate((jourActif ?? aujourdCellule)?.date ?? aujourdhuiDate)"
        />
      </div>
    </div>

    <!-- Maya, sur l'agenda : ce qui a une échéance — visites en retard, fenêtre
         météo à saisir. Vue transversale, d'où le contexte « calendrier ». -->
    <IaMayaContextCard contexte="calendrier" />

    <!-- ── Calendrier + panneau du jour ────────────────────────────────────── -->
    <div
      class="grid grid-cols-1 gap-5 md:items-start md:transition-[grid-template-columns] md:duration-300 md:ease-out"
      :class="panelOpen ? 'md:grid-cols-[minmax(0,1fr)_360px]' : 'md:grid-cols-[minmax(0,1fr)_0px]'"
    >
      <!-- Calendar card -->
      <div
        class="min-w-0 overflow-hidden rounded-[16px] border border-[var(--border-default)] bg-white shadow-sm"
      >
        <!-- Weekday header row -->
        <div class="grid grid-cols-7 border-b border-[var(--border-default)]">
          <div
            v-for="(jour, i) in jours"
            :key="jour + i"
            class="py-2.5 text-center text-[11px] font-semibold uppercase tracking-[0.06em] text-[var(--text-tertiary)] md:text-[10.5px]"
            style="background-color: var(--surface-muted)"
          >
            <span class="md:hidden">{{ joursCourts[i] }}</span>
            <span class="hidden md:inline">{{ jour }}</span>
          </div>
        </div>

        <!-- Day cells -->
        <div class="grid grid-cols-7">
          <div
            v-for="(cellule, idx) in cellules"
            :key="idx"
            class="group relative flex min-h-[60px] flex-col items-center border-b border-r border-[var(--border-default)] py-1.5 transition-colors last:border-r-0 md:min-h-[112px] md:items-stretch md:p-1.5"
            :class="cellClass(cellule)"
            @click="onCelluleClick(cellule)"
          >
            <!-- Day number -->
            <div class="flex w-full items-center justify-center md:justify-between">
              <span
                class="flex h-7 w-7 items-center justify-center rounded-full text-[13px] font-medium md:h-6 md:w-6 md:text-[12px]"
                :class="numeroClass(cellule)"
              >
                {{ cellule.jour }}
              </span>
              <!-- Add button on hover (desktop) -->
              <button
                v-if="cellule.dansMois"
                class="hidden h-5 w-5 items-center justify-center rounded opacity-0 transition-opacity hover:bg-[var(--honey-soft)] group-hover:opacity-100 md:flex"
                title="Créer un événement"
                @click.stop="openQuickCreate(cellule.date)"
              >
                <UIcon name="i-lucide-plus" class="h-3 w-3" style="color: var(--honey-deep)" />
              </button>
            </div>

            <!-- Mobile: pastilles d'événements -->
            <div
              v-if="cellule.dansMois && cellule.evenements.length > 0"
              class="mt-1.5 flex items-center justify-center gap-1 md:hidden"
            >
              <span
                v-for="ev in cellule.evenements.slice(0, 4)"
                :key="ev.id"
                class="h-1.5 w-1.5 rounded-full"
                :class="dotClass(ev)"
              />
            </div>

            <!-- Desktop: chips texte -->
            <div class="mt-1 hidden space-y-0.5 md:block">
              <button
                v-for="ev in cellule.evenements.slice(0, 3)"
                :key="ev.id"
                class="flex w-full items-center gap-1 truncate rounded-[5px] px-1.5 py-0.5 text-left text-[10px] font-medium transition-opacity hover:opacity-80"
                :class="chipClass(ev)"
                :title="ev.titre"
                @click.stop="ouvrirJour(cellule)"
              >
                <span class="h-1.5 w-1.5 shrink-0 rounded-full" :class="dotClass(ev)" />
                <span class="truncate">{{ ev.titre }}</span>
              </button>
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

      <!-- ── Panneau du jour (droite desktop · sous le calendrier mobile) ───── -->
      <aside ref="agendaRef" class="min-w-0 md:overflow-hidden">
        <div
          v-if="jourActif"
          class="flex flex-col rounded-[16px] border border-[var(--border-default)] bg-white shadow-sm md:sticky md:top-4 md:max-h-[calc(100dvh-7rem)]"
        >
          <!-- En-tête -->
          <div
            class="flex shrink-0 items-start justify-between border-b border-[var(--border-default)] px-4 py-3.5"
          >
            <div class="min-w-0">
              <p
                class="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--text-tertiary)]"
              >
                {{ jourActifWeekday }}
              </p>
              <h2
                class="mt-0.5 text-[18px] font-semibold capitalize tracking-[-0.01em] text-[var(--text-primary)]"
                style="
                  font-family:
                    'SF Pro Display',
                    -apple-system,
                    system-ui,
                    sans-serif;
                "
              >
                {{ jourActifTitre }}
              </h2>
              <p class="mt-0.5 text-[12px] text-[var(--text-tertiary)]">
                {{ jourActif.evenements.length }} événement{{
                  jourActif.evenements.length > 1 ? 's' : ''
                }}
              </p>
            </div>
            <button
              type="button"
              class="hidden h-7 w-7 items-center justify-center rounded-lg text-[var(--text-tertiary)] transition-colors hover:bg-[var(--surface-muted)] md:flex"
              title="Fermer"
              @click="panelOpen = false"
            >
              <UIcon name="i-lucide-x" class="h-4 w-4" />
            </button>
          </div>

          <!-- Liste / vide -->
          <div class="flex-1 overflow-y-auto p-3">
            <div v-if="jourActif.evenements.length > 0" class="space-y-2">
              <NuxtLink
                v-for="ev in jourActif.evenements"
                :key="ev.id"
                :to="ev.url"
                class="flex items-center gap-3 rounded-[12px] border border-[var(--border-default)] bg-white p-3 transition-colors hover:bg-[var(--surface-muted)]"
              >
                <span class="h-9 w-1 shrink-0 rounded-full" :class="dotClass(ev)" />
                <div class="min-w-0 flex-1">
                  <p class="truncate text-[13.5px] font-semibold text-[var(--text-primary)]">
                    {{ ev.titre }}
                  </p>
                  <p
                    v-if="ev.heure || ev.sousTitre"
                    class="mt-0.5 truncate text-[12px] text-[var(--text-tertiary)]"
                  >
                    <span v-if="ev.heure" class="font-medium text-[var(--text-secondary)]">{{
                      ev.heure
                    }}</span>
                    <span v-if="ev.heure && ev.sousTitre"> · </span>{{ ev.sousTitre }}
                  </p>
                </div>
                <UIcon
                  name="i-lucide-chevron-right"
                  class="h-4 w-4 shrink-0 text-[var(--text-tertiary)]"
                />
              </NuxtLink>
            </div>

            <div
              v-else
              class="flex flex-col items-center justify-center rounded-[12px] border border-dashed border-[var(--border-default)] py-10 text-center"
            >
              <div
                class="flex h-11 w-11 items-center justify-center rounded-full"
                style="background: var(--honey-soft)"
              >
                <UIcon name="i-lucide-calendar" class="h-5 w-5" style="color: var(--honey-deep)" />
              </div>
              <p class="mt-3 text-[13px] font-medium text-[var(--text-secondary)]">
                Aucun événement ce jour
              </p>
              <p class="mt-0.5 text-[12px] text-[var(--text-tertiary)]">
                Planifiez une intervention ou un rendez-vous
              </p>
            </div>
          </div>

          <!-- Footer CTA -->
          <div class="shrink-0 border-t border-[var(--border-default)] p-3">
            <UButton
              block
              color="primary"
              icon="i-lucide-plus"
              class="font-semibold"
              @click="openQuickCreate(jourActif.date)"
            >
              Créer un événement
            </UButton>
          </div>
        </div>
      </aside>
    </div>

    <!-- ── Formulaire popup (création rapide) ──────────────────────────────── -->
    <CalendrierQuickEventModal
      v-model:open="quickOpen"
      :date="quickDate"
      @saved="fetchEvenements"
    />
  </div>
</template>

<script setup lang="ts">
// Libellés d'intervention : SOURCE UNIQUE partagée avec la liste des
// interventions. Le calendrier tenait sa propre table, qu'il fallait penser
// à compléter à chaque nouveau type écrit en base — et qu'on oubliait.
import { libelleTypeIntervention } from '~/types/interventions';
definePageMeta({ layout: 'default' });

const jours = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
const joursCourts = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

// Bascule vue mobile (pastilles + agenda) vs desktop (grille riche + panneau)
const isMobile = useMediaQuery('(max-width: 767px)');

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
  heure?: string;
  titre: string;
  sousTitre: string;
  url: string;
}

const evenements = ref<Evenement[]>([]);
const loadingEv = ref(false);

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
        emplacementNom?: string | null;
      }>;
    }>('/api/interventions', {
      query: { limit: 1000, page: 1, from, to, excludeRdvPro: false },
    }).catch(() => ({ data: [] }));

    evenements.value = interventionsRes.data.map((it) => ({
      id: it.id,
      type: 'intervention' as const,
      sousType: it.type,
      date: it.dateVisite,
      heure: new Date(it.dateVisite).toLocaleTimeString('fr-FR', {
        hour: '2-digit',
        minute: '2-digit',
      }),
      titre: libelleTypeIntervention(it.type),
      sousTitre: [it.rucheNumero, it.rucherNom, it.emplacementNom].filter(Boolean).join(' — '),
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

const aujourdCellule = computed(() => cellules.value.find((c) => c.estAujourdhui) ?? null);

// ── Jour sélectionné + panneau ─────────────────────────────────────────────────
const agendaRef = ref<HTMLElement | null>(null);
const jourActif = ref<Cellule | null>(null);
const panelOpen = ref(false);

function memeJour(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

// Garde le jour actif synchronisé : conserve la sélection si elle reste dans le
// mois affiché (et rafraîchit ses événements après fetch), sinon retombe sur
// aujourd'hui si présent, à défaut le 1er du mois.
watch(
  cellules,
  (cells) => {
    const valides = cells.filter((c) => c.dansMois);
    if (jourActif.value) {
      const found = valides.find((c) => memeJour(c.date, jourActif.value!.date));
      if (found) {
        jourActif.value = found;
        return;
      }
    }
    jourActif.value = valides.find((c) => c.estAujourdhui) ?? valides[0] ?? null;
  },
  { immediate: true },
);

function estJourActif(c: Cellule): boolean {
  return !!jourActif.value && c.dansMois && memeJour(c.date, jourActif.value.date);
}

function cellClass(cellule: Cellule): string[] {
  const classes: string[] = [];
  if (!cellule.dansMois) {
    classes.push('bg-[var(--surface-muted)]/40');
  } else {
    classes.push('cursor-pointer hover:bg-[var(--honey-soft)]/40');
  }
  if (cellule.estAujourdhui) classes.push('md:bg-[var(--honey-soft)]/60');
  // Jour sélectionné mis en avant (desktop : anneau honey ; mobile : fond doux)
  if (estJourActif(cellule)) {
    classes.push('bg-[var(--honey-soft)]/60 md:bg-transparent');
    if (panelOpen.value) classes.push('md:ring-2 md:ring-inset md:ring-[var(--honey)]');
  }
  return classes;
}

function numeroClass(c: Cellule): string {
  if (c.estAujourdhui) return 'bg-[var(--honey)] text-white';
  if (estJourActif(c)) return 'bg-[var(--text-primary)] text-white';
  if (c.dansMois) return 'text-[var(--text-primary)]';
  return 'text-[var(--text-tertiary)]';
}

function dotClass(ev: Evenement): string {
  return ev.sousType === 'rendez_vous_pro' ? 'bg-violet-400' : 'bg-[var(--honey)]';
}

function chipClass(ev: Evenement): string {
  if (ev.sousType === 'rendez_vous_pro') return 'bg-violet-50 text-violet-700';
  return 'bg-[var(--honey-soft)] text-[var(--honey-deep)]';
}

const jourActifTitre = computed(() =>
  jourActif.value
    ? jourActif.value.date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })
    : '',
);
const jourActifWeekday = computed(() =>
  jourActif.value ? jourActif.value.date.toLocaleDateString('fr-FR', { weekday: 'long' }) : '',
);

/** Clic sur une cellule : sélectionne le jour et ouvre le panneau (desktop). */
function onCelluleClick(cellule: Cellule) {
  if (!cellule.dansMois) return;
  jourActif.value = cellule;
  if (isMobile.value) {
    nextTick(() => agendaRef.value?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }));
  } else {
    panelOpen.value = true;
  }
}

/** Ouvre le panneau du jour (depuis un chip ou « +N autres »). */
function ouvrirJour(cellule: Cellule) {
  if (!cellule.dansMois) return;
  jourActif.value = cellule;
  if (isMobile.value) {
    nextTick(() => agendaRef.value?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }));
  } else {
    panelOpen.value = true;
  }
}

// ── Formulaire popup ────────────────────────────────────────────────────────────
const quickOpen = ref(false);
const quickDate = ref<Date | null>(null);

function openQuickCreate(date: Date) {
  quickDate.value = date;
  quickOpen.value = true;
}

watch([annee, mois], fetchEvenements);
onMounted(fetchEvenements);

// DataBus: rafraîchir le calendrier après création/suppression d'intervention
const { on } = useDataBus();
on(['intervention:created', 'intervention:updated', 'intervention:deleted'], fetchEvenements);
</script>
