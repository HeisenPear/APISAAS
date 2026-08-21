<template>
  <Teleport to="body">
    <Transition name="fade">
      <div
        v-if="open"
        class="fixed inset-0 z-[80] flex items-end justify-center bg-black/40 p-0 backdrop-blur-[2px] sm:items-center sm:p-6"
        @click.self="close"
      >
        <div
          class="max-h-[92dvh] w-full overflow-y-auto rounded-t-[20px] bg-white shadow-2xl sm:max-w-xl sm:rounded-[20px]"
        >
          <!-- Header -->
          <div
            class="sticky top-0 z-10 flex items-center justify-between border-b bg-white/95 px-5 py-4 backdrop-blur"
            style="border-color: var(--border-default)"
          >
            <div class="min-w-0">
              <h3
                class="flex items-center gap-2 text-[15px] font-bold"
                style="color: var(--text-primary)"
              >
                <UIcon name="i-lucide-flower-2" class="h-4.5 w-4.5" style="color: var(--honey)" />
                Potentiel mellifère
              </h3>
              <p class="truncate text-[12px]" style="color: var(--text-tertiary)">
                {{ emplacement?.nom }} · rayon {{ (rayon / 1000).toLocaleString('fr-FR') }} km
              </p>
            </div>
            <button
              type="button"
              class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-colors hover:bg-stone-100"
              aria-label="Fermer"
              @click="close"
            >
              <UIcon name="i-lucide-x" class="h-4 w-4" style="color: var(--text-tertiary)" />
            </button>
          </div>

          <div class="px-5 py-5">
            <!-- Chargement -->
            <div v-if="pending" class="flex flex-col items-center gap-3 py-14">
              <UIcon
                name="i-lucide-loader-2"
                class="h-7 w-7 animate-spin"
                style="color: var(--honey)"
              />
              <p class="text-[13px]" style="color: var(--text-secondary)">
                Analyse des parcelles agricoles (RPG)…
              </p>
            </div>

            <!-- Erreur / gate plan -->
            <div v-else-if="erreur" class="flex flex-col items-center gap-3 py-10 text-center">
              <UIcon
                :name="erreur.code === 'PLAN_REQUIRED' ? 'i-lucide-lock' : 'i-lucide-cloud-off'"
                class="h-8 w-8"
                style="color: var(--text-tertiary)"
              />
              <p class="max-w-sm text-[13px]" style="color: var(--text-secondary)">
                {{ erreur.message }}
              </p>
              <UButton
                v-if="erreur.code === 'PLAN_REQUIRED'"
                to="/tarifs"
                size="sm"
                color="primary"
              >
                Passer au plan Pro
              </UButton>
              <UButton v-else size="sm" variant="outline" color="neutral" @click="charger"
                >Réessayer</UButton
              >
            </div>

            <template v-else-if="analyse">
              <!-- Score + stats -->
              <div class="mb-5 flex items-center gap-5">
                <svg viewBox="0 0 96 96" class="h-24 w-24 shrink-0">
                  <circle
                    cx="48"
                    cy="48"
                    r="40"
                    fill="none"
                    stroke="var(--surface-muted)"
                    stroke-width="9"
                  />
                  <circle
                    cx="48"
                    cy="48"
                    r="40"
                    fill="none"
                    :stroke="scoreColor"
                    stroke-width="9"
                    stroke-linecap="round"
                    :stroke-dasharray="`${(analyse.score / 100) * 251.3} 251.3`"
                    transform="rotate(-90 48 48)"
                  />
                  <text
                    x="48"
                    y="46"
                    text-anchor="middle"
                    font-size="22"
                    font-weight="700"
                    fill="var(--text-primary)"
                  >
                    {{ analyse.score }}
                  </text>
                  <text
                    x="48"
                    y="62"
                    text-anchor="middle"
                    font-size="9"
                    fill="var(--text-tertiary)"
                  >
                    / 100
                  </text>
                </svg>
                <div class="grid flex-1 grid-cols-2 gap-x-4 gap-y-2">
                  <div>
                    <p
                      class="text-[16px] font-bold tabular-nums"
                      style="color: var(--text-primary)"
                    >
                      {{ analyse.surfaceUtileHa.toLocaleString('fr-FR') }} ha
                    </p>
                    <p class="text-[10.5px]" style="color: var(--text-quaternary)">
                      surfaces mellifères
                    </p>
                  </div>
                  <div>
                    <p
                      class="text-[16px] font-bold tabular-nums"
                      style="color: var(--text-primary)"
                    >
                      {{ analyse.nbParcelles }}
                    </p>
                    <p class="text-[10.5px]" style="color: var(--text-quaternary)">
                      parcelles analysées
                    </p>
                  </div>
                  <div class="col-span-2">
                    <p class="text-[12px] font-medium" :style="`color:${scoreColor}`">
                      {{ verdict }}
                    </p>
                    <p class="text-[10.5px]" style="color: var(--text-quaternary)">
                      RPG millésime {{ analyse.millesime }}
                    </p>
                  </div>
                </div>
              </div>

              <!-- Rayon -->
              <div class="mb-5 flex items-center gap-2">
                <span class="text-[11.5px] font-medium" style="color: var(--text-tertiary)"
                  >Rayon de butinage :</span
                >
                <button
                  v-for="r in [1500, 3000]"
                  :key="r"
                  type="button"
                  class="rounded-full border px-2.5 py-1 text-[11.5px] font-semibold transition-colors"
                  :style="
                    rayon === r
                      ? 'background: var(--honey); border-color: var(--honey); color: white'
                      : 'border-color: var(--border-default); color: var(--text-secondary)'
                  "
                  @click="setRayon(r)"
                >
                  {{ r / 1000 }} km
                </button>
              </div>

              <!-- Calendrier de floraisons -->
              <p
                class="mb-2 text-[12px] font-bold uppercase tracking-[0.08em]"
                style="color: var(--honey-deep)"
              >
                Calendrier de miellées prévisionnel
              </p>
              <div class="mb-1 flex h-[72px] items-end gap-1">
                <div
                  v-for="m in analyse.calendrier"
                  :key="m.mois"
                  class="group relative flex flex-1 flex-col items-center justify-end"
                >
                  <div
                    class="w-full rounded-t-[4px] transition-all"
                    :style="{
                      height: `${Math.max(m.intensite, m.intensite > 0 ? 8 : 2)}%`,
                      background: m.intensite > 0 ? 'var(--honey)' : 'var(--surface-muted)',
                      opacity: m.intensite > 0 ? 0.35 + (m.intensite / 100) * 0.65 : 1,
                    }"
                  />
                  <div
                    v-if="m.cultures.length"
                    class="pointer-events-none absolute bottom-full z-10 mb-1 hidden max-w-[180px] rounded-md px-2 py-1 text-[10px] text-white group-hover:block"
                    style="background: var(--text-primary)"
                  >
                    {{ m.cultures.join(', ') }}
                  </div>
                </div>
              </div>
              <div class="mb-5 flex gap-1">
                <span
                  v-for="m in analyse.calendrier"
                  :key="m.mois"
                  class="flex-1 text-center text-[9.5px]"
                  style="color: var(--text-quaternary)"
                  >{{ MOIS[m.mois] }}</span
                >
              </div>

              <!-- Cultures dominantes -->
              <p
                class="mb-2 text-[12px] font-bold uppercase tracking-[0.08em]"
                style="color: var(--honey-deep)"
              >
                Ressources autour de l'emplacement
              </p>
              <div
                v-if="!analyse.cultures.length"
                class="py-6 text-center text-[12.5px]"
                style="color: var(--text-tertiary)"
              >
                Aucune parcelle agricole déclarée dans ce rayon (zone urbaine, forêt ou hors PAC).
              </div>
              <div v-else class="space-y-2.5">
                <div v-for="c in analyse.cultures" :key="c.code">
                  <div class="mb-0.5 flex items-baseline justify-between gap-2 text-[12.5px]">
                    <span class="truncate font-medium" style="color: var(--text-primary)">
                      {{ c.label }}
                      <span
                        v-if="c.floraison"
                        class="ml-1 text-[10.5px] font-normal"
                        style="color: var(--text-quaternary)"
                      >
                        {{ MOIS[c.floraison[0]] }}–{{ MOIS[c.floraison[1]] }}
                      </span>
                    </span>
                    <span class="shrink-0 tabular-nums" style="color: var(--text-secondary)">
                      {{ c.surfaceHa.toLocaleString('fr-FR') }} ha
                    </span>
                  </div>
                  <div
                    class="h-1.5 overflow-hidden rounded-full"
                    style="background: var(--surface-muted)"
                  >
                    <div
                      class="h-full rounded-full"
                      :style="{
                        width: `${Math.round((c.surfaceHa / maxSurface) * 100)}%`,
                        background:
                          c.nectar >= 4
                            ? 'var(--honey)'
                            : c.nectar >= 2
                              ? 'var(--sage)'
                              : 'var(--border-default)',
                      }"
                    />
                  </div>
                </div>
              </div>

              <p class="mt-5 text-[10.5px] leading-relaxed" style="color: var(--text-quaternary)">
                Source : Registre Parcellaire Graphique (IGN, open data) — cultures déclarées à la
                PAC. Les forêts et haies n'y figurent pas ; les fenêtres de floraison sont
                indicatives et varient avec la météo.
              </p>
            </template>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
interface Emplacement {
  id: string;
  nom: string;
  latitude: string | number;
  longitude: string | number;
}
interface CultureAgg {
  code: string;
  label: string;
  surfaceHa: number;
  nectar: number;
  floraison: [number, number] | null;
}
interface Analyse {
  score: number;
  surfaceUtileHa: number;
  nbParcelles: number;
  millesime: string;
  cultures: CultureAgg[];
  calendrier: { mois: number; intensite: number; cultures: string[] }[];
}

const open = defineModel<boolean>({ default: false });
const { emplacement } = defineProps<{ emplacement: Emplacement | null }>();

const MOIS: Record<number, string> = {
  1: 'Jan',
  2: 'Fév',
  3: 'Mar',
  4: 'Avr',
  5: 'Mai',
  6: 'Juin',
  7: 'Juil',
  8: 'Août',
  9: 'Sep',
  10: 'Oct',
  11: 'Nov',
  12: 'Déc',
};

const pending = ref(false);
const analyse = ref<Analyse | null>(null);
const erreur = ref<{ code?: string; message: string } | null>(null);
const rayon = ref(3000);

const maxSurface = computed(() =>
  Math.max(1, ...(analyse.value?.cultures.map((c) => c.surfaceHa) ?? [])),
);
const scoreColor = computed(() => {
  const s = analyse.value?.score ?? 0;
  return s >= 60 ? 'var(--sage-deep)' : s >= 35 ? 'var(--honey)' : '#d97706';
});
const verdict = computed(() => {
  const s = analyse.value?.score ?? 0;
  if (s >= 70) return 'Environnement très favorable';
  if (s >= 45) return 'Bon potentiel mellifère';
  if (s >= 20) return 'Potentiel modéré — à compléter (forêts non comptées)';
  return 'Ressources agricoles limitées dans ce rayon';
});

async function charger() {
  if (!emplacement) return;
  pending.value = true;
  erreur.value = null;
  analyse.value = null;
  try {
    const res = await $fetch<{ data: Analyse }>('/api/transhumance/analyse-mellifere', {
      query: { lat: emplacement.latitude, lng: emplacement.longitude, rayon: rayon.value },
    });
    analyse.value = res.data;
  } catch (e: unknown) {
    const err = e as { data?: { data?: { code?: string; message?: string }; message?: string } };
    erreur.value = {
      code: err.data?.data?.code,
      message: err.data?.data?.message ?? err.data?.message ?? "L'analyse a échoué. Réessayez.",
    };
  } finally {
    pending.value = false;
  }
}

function setRayon(r: number) {
  if (rayon.value === r) return;
  rayon.value = r;
  charger();
}

function close() {
  open.value = false;
}

watch(open, (v) => {
  if (v) {
    rayon.value = 3000;
    charger();
  }
});
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 200ms ease-out;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
