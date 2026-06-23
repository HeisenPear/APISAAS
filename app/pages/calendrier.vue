<template>
  <div class="space-y-5">
    <!-- Header -->
    <div class="flex items-center justify-between flex-wrap gap-3">
      <div class="flex items-center gap-3">
        <h1
          class="text-[26px] font-semibold tracking-[-0.02em] capitalize"
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
        <CalendrierSync />
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
          v-for="(jour, i) in jours"
          :key="jour + i"
          class="py-2 text-center text-[11px] font-semibold uppercase tracking-[0.06em] text-[var(--text-tertiary)] md:py-2.5 md:text-[10.5px]"
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
          class="group relative flex min-h-[58px] flex-col items-center border-b border-r border-[var(--border-default)] py-1.5 transition-colors last:border-r-0 md:min-h-[116px] md:items-stretch md:p-1.5"
          :class="[
            !cellule.dansMois
              ? 'bg-[var(--surface-muted)]/50'
              : 'cursor-pointer hover:bg-[var(--honey-soft)]/30',
            cellule.estAujourdhui ? 'md:bg-[var(--honey-soft)]' : '',
            estJourActif(cellule) ? 'bg-[var(--honey-soft)]/60 md:bg-transparent' : '',
          ]"
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
              title="Ajouter un événement"
              @click.stop="ouvrirModalAjout(cellule)"
            >
              <UIcon name="i-lucide-plus" class="h-3 w-3" style="color: var(--honey-deep)" />
            </button>
          </div>

          <!-- Mobile: pastilles d'événements (style Apple) -->
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
            <NuxtLink
              v-for="ev in cellule.evenements.slice(0, 3)"
              :key="ev.id"
              :to="ev.url"
              class="block truncate rounded-[4px] px-1.5 py-0.5 text-[10px] font-medium transition-opacity hover:opacity-80"
              :class="chipClass(ev)"
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

    <!-- ── Agenda du jour sélectionné (mobile uniquement, style Apple) ─────── -->
    <section ref="agendaRef" class="md:hidden">
      <div v-if="jourActif" class="space-y-3">
        <!-- En-tête date + bouton ajout -->
        <div class="flex items-end justify-between px-0.5">
          <div class="min-w-0">
            <p
              class="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--text-tertiary)]"
            >
              {{ jourActifWeekday }}
            </p>
            <h2
              class="mt-0.5 text-[19px] font-semibold capitalize tracking-[-0.01em] text-[var(--text-primary)]"
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
          </div>
          <button
            type="button"
            class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--honey)] text-white shadow-sm transition-transform active:scale-95"
            title="Ajouter un événement"
            @click="ouvrirModalAjout(jourActif)"
          >
            <UIcon name="i-lucide-plus" class="h-5 w-5" />
          </button>
        </div>

        <!-- Liste des événements -->
        <div v-if="jourActif.evenements.length > 0" class="space-y-2">
          <NuxtLink
            v-for="ev in jourActif.evenements"
            :key="ev.id"
            :to="ev.url"
            class="flex items-center gap-3 rounded-[14px] border border-[var(--border-default)] bg-white p-3.5 transition-colors active:bg-[var(--surface-muted)]"
          >
            <span
              class="h-9 w-1 shrink-0 rounded-full"
              :class="ev.sousType === 'rendez_vous_pro' ? 'bg-violet-400' : 'bg-[var(--honey)]'"
            />
            <div class="min-w-0 flex-1">
              <p class="truncate text-[14px] font-semibold text-[var(--text-primary)]">
                {{ ev.titre }}
              </p>
              <p
                v-if="ev.sousTitre"
                class="mt-0.5 truncate text-[12.5px] text-[var(--text-tertiary)]"
              >
                {{ ev.sousTitre }}
              </p>
            </div>
            <UIcon
              name="i-lucide-chevron-right"
              class="h-4 w-4 shrink-0 text-[var(--text-tertiary)]"
            />
          </NuxtLink>
        </div>

        <!-- Empty state -->
        <div
          v-else
          class="flex flex-col items-center justify-center rounded-[14px] border border-dashed border-[var(--border-default)] bg-white py-10 text-center"
        >
          <div
            class="flex h-11 w-11 items-center justify-center rounded-full"
            style="background: var(--honey-soft)"
          >
            <UIcon name="i-lucide-calendar" class="h-5 w-5" style="color: var(--honey-deep)" />
          </div>
          <p class="mt-3 text-[13.5px] font-medium text-[var(--text-secondary)]">
            Aucun événement ce jour
          </p>
          <button
            type="button"
            class="mt-3 inline-flex items-center gap-1.5 rounded-full bg-[var(--honey-soft)] px-4 py-2 text-[13px] font-semibold text-[var(--honey-deep)] transition-colors active:bg-[var(--honey)]/20"
            @click="ouvrirModalAjout(jourActif)"
          >
            <UIcon name="i-lucide-plus" class="h-4 w-4" />
            Ajouter un événement
          </button>
        </div>
      </div>
    </section>

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
                style="
                  font-family:
                    'SF Pro Display',
                    -apple-system,
                    system-ui,
                    sans-serif;
                "
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
                  <p class="truncate text-[13px] font-medium text-[var(--text-primary)]">
                    {{ ev.titre }}
                  </p>
                  <p class="text-[11.5px] text-[var(--text-tertiary)]">{{ ev.sousTitre }}</p>
                </div>
                <UIcon
                  name="i-lucide-arrow-right"
                  class="ml-auto h-4 w-4 shrink-0 text-[var(--text-tertiary)]"
                />
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
              <div
                class="flex h-10 w-10 items-center justify-center rounded-xl"
                style="background: var(--honey-soft)"
              >
                <UIcon
                  name="i-lucide-calendar-plus"
                  class="h-5 w-5"
                  style="color: var(--honey-deep)"
                />
              </div>
              <div>
                <p class="text-[13px] font-semibold text-[var(--text-primary)]">Nouvel événement</p>
                <p class="text-[12px] text-[var(--text-tertiary)]">
                  {{ formatDateFull(modalAjout.date) }}
                </p>
              </div>
              <button
                class="ml-auto rounded-lg p-1 text-[var(--text-tertiary)] hover:bg-[var(--surface-muted)]"
                @click="modalAjout = null"
              >
                <UIcon name="i-lucide-x" class="h-4 w-4" />
              </button>
            </div>

            <p
              class="mb-3 text-[11px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)]"
            >
              Type d'événement
            </p>

            <!-- Intervention -->
            <button
              class="flex w-full items-center gap-3 rounded-xl border-2 px-4 py-3 text-left transition-all"
              style="border-color: var(--honey-soft); background: var(--honey-soft)"
              @click="naviguerVersAjout(modalAjout.date)"
            >
              <div
                class="flex h-9 w-9 items-center justify-center rounded-lg"
                style="background: var(--honey)"
              >
                <UIcon name="i-lucide-zap" class="h-5 w-5 text-white" />
              </div>
              <div>
                <p class="text-[13px] font-semibold text-[var(--text-primary)]">Intervention</p>
                <p class="text-[11.5px] text-[var(--text-secondary)]">
                  Traitement, récolte, nourrissement, contrôle…
                </p>
              </div>
              <UIcon
                name="i-lucide-chevron-right"
                class="ml-auto h-4 w-4 text-[var(--text-tertiary)]"
              />
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
                <p class="text-[13px] font-semibold text-[var(--text-primary)]">
                  Modifier le rendez-vous
                </p>
                <p class="text-[11.5px] text-[var(--text-secondary)]">
                  Un rendez-vous pro est déjà prévu ce jour
                </p>
              </div>
              <UIcon
                name="i-lucide-chevron-right"
                class="ml-auto h-4 w-4 text-[var(--text-tertiary)]"
              />
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
                <p class="text-[11.5px] text-[var(--text-secondary)]">
                  Vétérinaire, syndicat, fournisseur, client…
                </p>
              </div>
              <UIcon
                name="i-lucide-chevron-right"
                class="ml-auto h-4 w-4 text-[var(--text-tertiary)]"
              />
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
const joursCourts = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

// Bascule vue mobile (pastilles + agenda) vs desktop (grille riche)
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

// ── Agenda mobile : jour sélectionné ───────────────────────────────────────────
const agendaRef = ref<HTMLElement | null>(null);
const jourActif = ref<Cellule | null>(null);

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

function numeroClass(c: Cellule): string {
  if (c.estAujourdhui) return 'bg-[var(--honey)] text-white';
  if (isMobile.value && estJourActif(c)) return 'bg-[var(--text-primary)] text-white';
  if (c.dansMois) return 'text-[var(--text-primary)]';
  return 'text-[var(--text-tertiary)]';
}

function dotClass(ev: Evenement): string {
  return ev.sousType === 'rendez_vous_pro' ? 'bg-violet-400' : 'bg-[var(--honey)]';
}

function chipClass(ev: Evenement): string {
  if (ev.sousType === 'rendez_vous_pro') return 'bg-violet-100 text-violet-700';
  if (ev.type === 'intervention') return 'bg-[var(--honey-soft)] text-[var(--honey-deep)]';
  return 'bg-[var(--status-info)]/10 text-[var(--status-info)]';
}

const jourActifTitre = computed(() =>
  jourActif.value
    ? jourActif.value.date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })
    : '',
);
const jourActifWeekday = computed(() =>
  jourActif.value ? jourActif.value.date.toLocaleDateString('fr-FR', { weekday: 'long' }) : '',
);

/** Clic sur une cellule : mobile → agenda du jour, desktop → modal existant. */
function onCelluleClick(cellule: Cellule) {
  if (!cellule.dansMois) return;
  if (isMobile.value) {
    jourActif.value = cellule;
    nextTick(() => agendaRef.value?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }));
  } else {
    ouvrirCellule(cellule);
  }
}

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
