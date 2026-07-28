<script setup lang="ts">
import {
  routeOptimale,
  ordonnerSelon,
  distanceTotaleKm,
  lienMaps,
  type ArretBase,
} from '~/utils/tourneeRoutes';

definePageMeta({ layout: 'default' });

interface Arret extends ArretBase {
  ordre: number;
  distanceKm: number;
}
interface ArretSansCoords {
  rucherId: string;
  nom: string;
  commune: string | null;
  nbEnRetard: number;
  nbCritiques: number;
}
interface Tournee {
  arrets: Arret[];
  sansCoords: ArretSansCoords[];
  totalKm: number;
  lienMaps: string | null;
  nbRuchersAVisiter: number;
  nbRuchesAVisiter: number;
  seuilJours: number;
}

const gating = useGating();

const { data, pending } = useFetch<{ data: Tournee }>('/api/tournee', {
  lazy: true,
  immediate: gating.can('tourneeOptimisee'),
});
const t = computed(() => data.value?.data ?? null);

// Feuille de route du jour : agenda (RDV, traitements) + rythme de la saison.
interface PlanJour {
  saison: 'hiver' | 'printemps' | 'ete' | 'automne';
  cadenceJours: number;
  chargeSemaine: number;
  rdv: { heure: string; label: string }[];
  nbTraitements: number;
}
const { data: planData } = useFetch<{ data: PlanJour }>('/api/plan-jour', {
  lazy: true,
  immediate: gating.can('tourneeOptimisee'),
});
const plan = computed(() => planData.value?.data ?? null);
const SAISON_LABEL: Record<PlanJour['saison'], string> = {
  hiver: 'Hiver',
  printemps: 'Printemps',
  ete: 'Été',
  automne: 'Automne',
};
const aAgenda = computed(
  () => !!plan.value && (plan.value.rdv.length > 0 || plan.value.nbTraitements > 0),
);
const rienAFaire = computed(
  () => !!t.value && t.value.arrets.length === 0 && t.value.sansCoords.length === 0,
);

// ── Trajet : optimisé, départ au choix, réordonnable au doigt ──
const arretsBase = computed<ArretBase[]>(() => t.value?.arrets ?? []);
const departChoisi = ref(''); // '' = automatique (le plus court)

// Ordre courant des étapes : réinitialisé au trajet optimal quand les données ou
// le départ changent ; modifiable à la main par glisser-déposer.
const etapes = ref<ArretBase[]>([]);
const reordonne = ref(false);
watch(
  [arretsBase, departChoisi],
  () => {
    etapes.value = routeOptimale(arretsBase.value, departChoisi.value || undefined);
    reordonne.value = false;
  },
  { immediate: true },
);

const routeAffichee = computed(() => ordonnerSelon(etapes.value));
const totalActive = computed(() => distanceTotaleKm(routeAffichee.value));
const mapsActive = computed(() => lienMaps(routeAffichee.value));

function reinitialiser() {
  etapes.value = routeOptimale(arretsBase.value, departChoisi.value || undefined);
  reordonne.value = false;
}

// Glisser-déposer (Pointer Events : tactile + souris).
const dragId = ref<string | null>(null);
function startDrag(e: PointerEvent, id: string) {
  dragId.value = id;
  (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
}
function moveDrag(e: PointerEvent) {
  if (!dragId.value) return;
  e.preventDefault();
  const el = document
    .elementFromPoint(e.clientX, e.clientY)
    ?.closest('[data-id]') as HTMLElement | null;
  const targetId = el?.dataset.id;
  if (!targetId || targetId === dragId.value) return;
  const arr = [...etapes.value];
  const from = arr.findIndex((a) => a.rucherId === dragId.value);
  const to = arr.findIndex((a) => a.rucherId === targetId);
  if (from < 0 || to < 0) return;
  const [moved] = arr.splice(from, 1);
  arr.splice(to, 0, moved!);
  etapes.value = arr;
  reordonne.value = true;
}
function endDrag() {
  dragId.value = null;
}

const dateLabel = new Date().toLocaleDateString('fr-FR', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
});
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div>
      <h1
        class="text-[26px] font-semibold tracking-[-0.02em]"
        style="
          font-family:
            'SF Pro Display',
            -apple-system,
            system-ui,
            sans-serif;
        "
      >
        Ma tournée
      </h1>
      <p class="mt-1 text-[14px] capitalize text-[var(--text-secondary)]">{{ dateLabel }}</p>
    </div>

    <UiFeatureGate feature="tourneeOptimisee" blur>
      <!-- Rythme de la saison + agenda du jour (RDV, traitements) -->
      <div v-if="plan" class="mb-4 space-y-3">
        <div
          class="flex flex-wrap items-center gap-x-4 gap-y-1.5 rounded-[14px] border border-[var(--border-default)] bg-white px-4 py-3"
        >
          <span
            class="rounded-full px-2.5 py-1 text-[12px] font-semibold"
            style="background: var(--sage-soft); color: var(--sage-deep)"
          >
            {{ SAISON_LABEL[plan.saison] }}
          </span>
          <span class="text-[13px] text-[var(--text-secondary)]">
            Rythme conseillé : une visite tous les
            <span class="font-semibold text-[var(--text-primary)]">{{ plan.cadenceJours }} j</span>
          </span>
          <span
            v-if="plan.chargeSemaine > 0"
            class="text-[13px] text-[var(--text-secondary)] before:mr-2 before:text-[var(--text-quaternary)] before:content-['·']"
          >
            ≈ <span class="font-semibold text-[var(--text-primary)]">{{ plan.chargeSemaine }}</span>
            visites conseillées cette semaine
          </span>
        </div>

        <!-- Agenda du jour -->
        <div
          v-if="aAgenda"
          class="rounded-[14px] border border-[var(--border-default)] bg-white p-4"
        >
          <p
            class="mb-2 flex items-center gap-1.5 text-[13px] font-semibold text-[var(--text-secondary)]"
          >
            <UIcon name="i-lucide-calendar-clock" class="h-4 w-4" />
            Aussi au programme aujourd'hui
          </p>
          <ul class="space-y-1.5">
            <li
              v-for="(r, i) in plan.rdv"
              :key="`rdv-${i}`"
              class="flex items-center gap-2 text-[14px] text-[var(--text-primary)]"
            >
              <UIcon name="i-lucide-handshake" class="h-4 w-4 text-[var(--honey-deep)]" />
              {{ r.label }}
            </li>
            <li
              v-if="plan.nbTraitements > 0"
              class="flex items-center gap-2 text-[14px] text-[var(--text-primary)]"
            >
              <UIcon name="i-lucide-flask-conical" class="h-4 w-4 text-[var(--clay-deep)]" />
              {{ plan.nbTraitements }} traitement{{ plan.nbTraitements > 1 ? 's' : '' }} à clôturer
              (délai d'attente écoulé)
            </li>
          </ul>
        </div>
      </div>

      <!-- Chargement -->
      <div v-if="pending && !data" class="space-y-3">
        <div class="h-20 animate-pulse rounded-[14px] bg-[var(--surface-muted)]" />
        <div
          v-for="i in 3"
          :key="i"
          class="h-24 animate-pulse rounded-[14px] bg-[var(--surface-muted)]"
        />
      </div>

      <!-- Tout est à jour -->
      <div
        v-else-if="rienAFaire"
        class="rounded-[14px] border border-[var(--border-default)] bg-white p-10 text-center"
      >
        <div
          class="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full"
          style="background: var(--sage-soft)"
        >
          <UIcon name="i-lucide-check" class="h-6 w-6" style="color: var(--sage-deep)" />
        </div>
        <p class="text-[15px] font-semibold text-[var(--text-primary)]">Tout est à jour 🎉</p>
        <p class="mx-auto mt-1 max-w-md text-[14px] text-[var(--text-secondary)]">
          Aucun rucher n'a de ruche en retard de visite ou en santé critique. Profitez-en&nbsp;!
        </p>
      </div>

      <!-- Tournée -->
      <div v-else-if="t" class="space-y-4">
        <!-- Résumé + Maps -->
        <div
          class="flex flex-wrap items-center justify-between gap-4 rounded-[14px] border border-[var(--border-default)] bg-white p-5"
        >
          <div class="flex items-center gap-6">
            <div>
              <p class="text-[22px] font-semibold leading-none text-[var(--text-primary)]">
                {{ t.nbRuchersAVisiter }}
              </p>
              <p class="mt-1 text-[12px] text-[var(--text-tertiary)]">
                rucher{{ t.nbRuchersAVisiter > 1 ? 's' : '' }} · {{ t.nbRuchesAVisiter }} ruche{{
                  t.nbRuchesAVisiter > 1 ? 's' : ''
                }}
              </p>
            </div>
            <div
              v-if="routeAffichee.length > 1"
              class="border-l border-[var(--border-default)] pl-6"
            >
              <p class="text-[22px] font-semibold leading-none text-[var(--text-primary)]">
                ~{{ totalActive }} km
              </p>
              <p class="mt-1 text-[12px] text-[var(--text-tertiary)]">à vol d'oiseau</p>
            </div>
          </div>
          <a
            v-if="mapsActive"
            :href="mapsActive"
            target="_blank"
            rel="noopener"
            class="flex items-center gap-2 rounded-[10px] px-4 py-2.5 text-[14px] font-semibold text-white transition-all hover:-translate-y-0.5"
            style="background: var(--honey)"
          >
            <UIcon name="i-lucide-navigation" class="h-4 w-4" />
            Ouvrir l'itinéraire
          </a>
        </div>

        <!-- Départ (trajet le plus rapide) + réordonnancement manuel -->
        <div
          v-if="routeAffichee.length > 1"
          class="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-[14px] border border-[var(--border-default)] bg-white p-3"
        >
          <div class="flex items-center gap-2">
            <span class="text-[13px] text-[var(--text-secondary)]">Partir de</span>
            <select
              v-model="departChoisi"
              class="h-9 rounded-[10px] border border-[var(--border-default)] bg-white px-2.5 text-[13px]"
            >
              <option value="">Auto (le plus rapide)</option>
              <option v-for="a in arretsBase" :key="a.rucherId" :value="a.rucherId">
                {{ a.nom }}
              </option>
            </select>
          </div>
          <span class="flex items-center gap-1.5 text-[12px] text-[var(--text-tertiary)]">
            <UIcon name="i-lucide-grip-vertical" class="h-3.5 w-3.5" />
            Glissez une étape pour réordonner
          </span>
          <button
            v-if="reordonne"
            type="button"
            class="ml-auto text-[12px] font-medium text-[var(--honey-deep)] underline"
            @click="reinitialiser"
          >
            Réinitialiser
          </button>
        </div>

        <!-- Étapes (réordonnables au glisser) -->
        <ol class="space-y-3">
          <li
            v-for="a in routeAffichee"
            :key="a.rucherId"
            :data-id="a.rucherId"
            class="flex items-center gap-2 rounded-[14px] border bg-white p-3 transition-all"
            :style="
              dragId === a.rucherId
                ? 'border-color: var(--honey); box-shadow: 0 6px 18px rgba(0,0,0,.12); opacity:.95'
                : 'border-color: var(--border-default)'
            "
          >
            <!-- Poignée de glissement -->
            <button
              type="button"
              class="flex h-9 w-7 shrink-0 cursor-grab touch-none items-center justify-center text-[var(--text-quaternary)] hover:text-[var(--text-secondary)]"
              style="touch-action: none"
              aria-label="Réordonner"
              @pointerdown="startDrag($event, a.rucherId)"
              @pointermove="moveDrag"
              @pointerup="endDrag"
              @pointercancel="endDrag"
            >
              <UIcon name="i-lucide-grip-vertical" class="h-5 w-5" />
            </button>
            <span
              class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[15px] font-bold text-white"
              style="background: var(--surface-sidebar)"
              >{{ a.ordre }}</span
            >
            <NuxtLink
              :to="`/ruchers/${a.rucherId}`"
              class="flex min-w-0 flex-1 items-center gap-3 hover:opacity-80"
            >
              <div class="min-w-0 flex-1">
                <p class="truncate text-[15px] font-semibold text-[var(--text-primary)]">
                  {{ a.nom }}
                </p>
                <div class="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
                  <span v-if="a.commune" class="text-[12px] text-[var(--text-tertiary)]">{{
                    a.commune
                  }}</span>
                  <span
                    v-if="a.nbEnRetard > 0"
                    class="rounded-full px-2 py-0.5 text-[11px] font-semibold"
                    style="background: var(--honey-soft); color: var(--honey-deep)"
                  >
                    {{ a.nbEnRetard }} en retard
                  </span>
                  <span
                    v-if="a.nbCritiques > 0"
                    class="rounded-full px-2 py-0.5 text-[11px] font-semibold"
                    style="background: var(--clay-soft); color: var(--clay-deep)"
                  >
                    {{ a.nbCritiques }} santé critique
                  </span>
                </div>
              </div>
              <div v-if="a.ordre > 1" class="shrink-0 text-right">
                <p class="text-[13px] font-medium text-[var(--text-secondary)]">
                  +{{ a.distanceKm }} km
                </p>
              </div>
              <UIcon
                name="i-lucide-chevron-right"
                class="h-4 w-4 shrink-0 text-[var(--text-quaternary)]"
              />
            </NuxtLink>
          </li>
        </ol>

        <!-- Ruchers à visiter sans coordonnées -->
        <div
          v-if="t.sansCoords.length > 0"
          class="rounded-[14px] border border-dashed border-[var(--border-default)] bg-[var(--surface-muted)] p-4"
        >
          <p
            class="mb-2 flex items-center gap-1.5 text-[13px] font-semibold text-[var(--text-secondary)]"
          >
            <UIcon name="i-lucide-map-pin-off" class="h-4 w-4" />
            À visiter aussi — position GPS manquante
          </p>
          <NuxtLink
            v-for="s in t.sansCoords"
            :key="s.rucherId"
            :to="`/ruchers/${s.rucherId}`"
            class="flex items-center justify-between py-1.5 text-[14px] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          >
            <span>{{ s.nom }}</span>
            <span class="text-[12px] text-[var(--text-tertiary)]">
              {{ s.nbEnRetard > 0 ? `${s.nbEnRetard} en retard` : ''
              }}{{ s.nbEnRetard > 0 && s.nbCritiques > 0 ? ' · ' : ''
              }}{{ s.nbCritiques > 0 ? `${s.nbCritiques} critique` : '' }}
            </span>
          </NuxtLink>
          <p class="mt-1 text-[12px] text-[var(--text-quaternary)]">
            Ajoutez leurs coordonnées pour les intégrer à l'itinéraire optimisé.
          </p>
        </div>
      </div>

      <!-- Teaser (comptes sans la feature) -->
      <template #preview>
        <div class="space-y-4">
          <div
            class="flex items-center justify-between rounded-[14px] border border-[var(--border-default)] bg-white p-5"
          >
            <div>
              <p class="text-[22px] font-semibold leading-none">3 ruchers · 6 ruches</p>
              <p class="mt-1 text-[12px] text-[var(--text-tertiary)]">~16 km à vol d'oiseau</p>
            </div>
            <span
              class="flex items-center gap-2 rounded-[10px] px-4 py-2.5 text-[14px] font-semibold text-white"
              style="background: var(--honey)"
            >
              <UIcon name="i-lucide-navigation" class="h-4 w-4" /> Ouvrir l'itinéraire
            </span>
          </div>
          <div
            v-for="(d, i) in [
              { nom: 'Rucher des Tilleuls', km: 2.4, retard: 3, crit: 0 },
              { nom: 'Rucher du Verger', km: 5.1, retard: 0, crit: 1 },
              { nom: 'Rucher Haut-Bois', km: 8.7, retard: 2, crit: 0 },
            ]"
            :key="i"
            class="flex items-center gap-4 rounded-[14px] border border-[var(--border-default)] bg-white p-4"
          >
            <span
              class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[15px] font-bold text-white"
              style="background: var(--surface-sidebar)"
              >{{ i + 1 }}</span
            >
            <div class="flex-1">
              <p class="text-[15px] font-semibold">{{ d.nom }}</p>
              <div class="mt-1 flex gap-2">
                <span
                  v-if="d.retard"
                  class="rounded-full px-2 py-0.5 text-[11px] font-semibold"
                  style="background: var(--honey-soft); color: var(--honey-deep)"
                  >{{ d.retard }} en retard</span
                >
                <span
                  v-if="d.crit"
                  class="rounded-full px-2 py-0.5 text-[11px] font-semibold"
                  style="background: var(--clay-soft); color: var(--clay-deep)"
                  >{{ d.crit }} santé critique</span
                >
              </div>
            </div>
            <span v-if="i > 0" class="text-[13px] font-medium text-[var(--text-secondary)]"
              >+{{ d.km }} km</span
            >
          </div>
        </div>
      </template>
    </UiFeatureGate>
  </div>
</template>
