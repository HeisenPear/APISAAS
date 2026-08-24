<template>
  <div>
    <LandingHeader />

    <main style="background: var(--surface-primary)">
      <section class="relative overflow-hidden pt-24 pb-16 sm:pt-28">
        <!-- Ambient honey glow -->
        <div class="pointer-events-none absolute inset-0 overflow-hidden">
          <div
            class="absolute -top-40 left-1/2 h-[600px] w-[900px] -translate-x-1/2 rounded-full opacity-[0.06] blur-[120px]"
            style="background: var(--honey)"
          />
        </div>

        <div class="relative mx-auto max-w-2xl px-4 sm:px-6">
          <!-- En-tête -->
          <div class="mb-8 text-center">
            <div
              class="mb-5 inline-flex items-center gap-2 rounded-full border px-3.5 py-1 text-[12px] font-semibold"
              style="
                background: var(--honey-soft);
                border-color: color-mix(in srgb, var(--honey) 25%, transparent);
                color: var(--honey-deep);
              "
            >
              <span
                class="h-1.5 w-1.5 animate-pulse rounded-full"
                style="background: var(--honey)"
              />
              Démo personnalisée · gratuite · sans engagement
            </div>
            <h1
              class="mb-3 text-[32px] font-bold leading-[1.1] tracking-[-0.03em] sm:text-[40px]"
              style="color: var(--text-primary)"
            >
              Réservez votre démo APIGO
            </h1>
            <p
              class="mx-auto max-w-lg text-[15px] leading-relaxed"
              style="color: var(--text-secondary)"
            >
              Dites-nous où vous en êtes et ce que vous cherchez. On vous recontacte rapidement pour
              une démonstration taillée pour votre exploitation.
            </p>
          </div>

          <!-- Confirmation -->
          <div
            v-if="submitted"
            class="rounded-[18px] border bg-white p-8 text-center"
            style="border-color: var(--border-default)"
          >
            <div
              class="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full"
              style="background: var(--sage-soft)"
            >
              <UIcon name="i-lucide-check" class="h-8 w-8" style="color: var(--sage-deep)" />
            </div>
            <h2
              class="mb-2 text-[22px] font-bold tracking-[-0.02em]"
              style="color: var(--text-primary)"
            >
              C'est réservé, {{ form.prenom || 'merci' }} !
            </h2>
            <p
              class="mx-auto mb-6 max-w-md text-[14.5px] leading-relaxed"
              style="color: var(--text-secondary)"
            >
              Votre démo est bien réservée<template v-if="bookedLabel">
                — <strong style="color: var(--text-primary)">{{ bookedLabel }}</strong></template
              >. Un email de confirmation vient de vous être envoyé. À très vite !
            </p>
            <div class="flex flex-col items-center justify-center gap-3 sm:flex-row">
              <NuxtLink
                to="/register"
                class="inline-flex w-full items-center justify-center gap-2 rounded-[12px] px-6 py-3 text-[14px] font-bold text-white transition-all hover:-translate-y-0.5 sm:w-auto"
                style="background: var(--honey)"
              >
                <UiBeeIcon class="h-4 w-4" />
                Essayer APIGO en attendant
              </NuxtLink>
              <NuxtLink
                to="/"
                class="inline-flex w-full items-center justify-center rounded-[12px] border bg-white px-6 py-3 text-[14px] font-semibold transition-all hover:-translate-y-0.5 sm:w-auto"
                style="border-color: var(--border-default); color: var(--text-primary)"
              >
                Retour à l'accueil
              </NuxtLink>
            </div>
          </div>

          <!-- Formulaire -->
          <form
            v-else
            class="rounded-[18px] border bg-white p-6 sm:p-8"
            style="border-color: var(--border-default)"
            @submit.prevent="submit"
          >
            <!-- Honeypot anti-bot (invisible) -->
            <div aria-hidden="true" class="absolute -left-[9999px] h-0 w-0 overflow-hidden">
              <label
                >Ne pas remplir<input
                  v-model="form.website"
                  type="text"
                  tabindex="-1"
                  autocomplete="off"
              /></label>
            </div>

            <div class="grid gap-4 sm:grid-cols-2">
              <div>
                <label
                  class="mb-1.5 block text-[13px] font-medium"
                  style="color: var(--text-secondary)"
                  >Prénom *</label
                >
                <input v-model="form.prenom" type="text" required :class="inputClass" />
              </div>
              <div>
                <label
                  class="mb-1.5 block text-[13px] font-medium"
                  style="color: var(--text-secondary)"
                  >Nom *</label
                >
                <input v-model="form.nom" type="text" required :class="inputClass" />
              </div>
            </div>

            <div class="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <label
                  class="mb-1.5 block text-[13px] font-medium"
                  style="color: var(--text-secondary)"
                  >Email *</label
                >
                <input v-model="form.email" type="email" required :class="inputClass" />
              </div>
              <div>
                <label
                  class="mb-1.5 block text-[13px] font-medium"
                  style="color: var(--text-secondary)"
                  >Téléphone *</label
                >
                <input v-model="form.telephone" type="tel" required :class="inputClass" />
              </div>
            </div>

            <div class="mt-4">
              <label
                class="mb-1.5 block text-[13px] font-medium"
                style="color: var(--text-secondary)"
              >
                Votre objectif & vos besoins *
              </label>
              <textarea
                v-model="form.objectif"
                required
                rows="4"
                placeholder="Ex : je gère 80 ruches, je cherche à simplifier mon registre d'élevage et ma facturation…"
                class="w-full resize-y rounded-[10px] border bg-white px-4 py-3 text-[15px] outline-none transition-shadow focus:ring-2"
                style="
                  border-color: var(--border-default);
                  color: var(--text-primary);
                  --tw-ring-color: color-mix(in srgb, var(--honey) 30%, transparent);
                "
              />
            </div>

            <!-- Créneau (calendrier) -->
            <div class="mt-7">
              <p
                class="mb-1 text-[11px] font-semibold uppercase tracking-[0.12em]"
                style="color: var(--honey-deep)"
              >
                Choisissez votre créneau *
              </p>
              <p class="mb-4 text-[12.5px]" style="color: var(--text-tertiary)">
                En semaine en soirée, le week-end toute la journée (heure de Paris).
              </p>

              <!-- Chargement -->
              <div
                v-if="slotsPending"
                class="flex items-center gap-2 py-6 text-[13px]"
                style="color: var(--text-tertiary)"
              >
                <UIcon name="i-lucide-loader-2" class="h-4 w-4 animate-spin" />
                Chargement des créneaux…
              </div>

              <!-- Aucun créneau -->
              <UiErrorState v-else-if="slotsError" :error="slotsError" :retry="refreshSlots" />

              <div
                v-else-if="days.length === 0"
                class="rounded-[10px] border px-4 py-4 text-[13px]"
                style="border-color: var(--border-default); color: var(--text-tertiary)"
              >
                Aucun créneau disponible pour le moment. Réessayez plus tard ou écrivez-nous
                directement.
              </div>

              <template v-else>
                <!-- Sélecteur de jour -->
                <div class="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
                  <button
                    v-for="d in days"
                    :key="d.dateKey"
                    type="button"
                    :class="dayPillClass(d)"
                    @click="selectedDay = d.dateKey"
                  >
                    <span class="text-[11px] font-semibold uppercase tracking-wide">{{
                      dayPill(d.dateKey).wd
                    }}</span>
                    <span class="text-[17px] font-bold leading-none">{{
                      dayPill(d.dateKey).num
                    }}</span>
                    <span class="text-[10px]" :style="`color:${dayHintColor(d)}`">
                      {{ dayAvail(d) ? `${dayAvail(d)} dispo` : 'complet' }}
                    </span>
                  </button>
                </div>

                <!-- Créneaux du jour sélectionné -->
                <div class="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4">
                  <button
                    v-for="s in currentSlots"
                    :key="s.iso"
                    type="button"
                    :disabled="!s.available"
                    :class="slotClass(s)"
                    @click="form.slot = form.slot === s.iso ? '' : s.iso"
                  >
                    {{ s.time }}
                    <span v-if="!s.available" class="block text-[9.5px] font-normal">occupé</span>
                  </button>
                </div>

                <p
                  v-if="form.slot"
                  class="mt-3 flex items-center gap-1.5 text-[12.5px] font-medium"
                  style="color: var(--sage-deep)"
                >
                  <UIcon name="i-lucide-calendar-check" class="h-4 w-4" />
                  {{ selectedSlotLabel }}
                </p>
              </template>
            </div>

            <p
              v-if="errorMsg"
              class="mt-5 text-[13px] font-medium"
              style="color: var(--status-bad)"
            >
              {{ errorMsg }}
            </p>

            <button
              type="submit"
              :disabled="loading || !form.slot"
              class="mt-6 flex w-full items-center justify-center gap-2 rounded-[13px] py-3.5 text-[15px] font-bold text-white transition-all hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
              style="
                background: var(--honey);
                box-shadow: 0 6px 24px color-mix(in srgb, var(--honey) 35%, transparent);
              "
            >
              <UIcon
                :name="loading ? 'i-lucide-loader-2' : 'i-lucide-calendar-check'"
                class="h-5 w-5"
                :class="loading ? 'animate-spin' : ''"
              />
              {{
                loading ? 'Réservation…' : form.slot ? 'Réserver ma démo' : 'Choisissez un créneau'
              }}
            </button>

            <p class="mt-4 text-center text-[12px]" style="color: var(--text-tertiary)">
              Vos coordonnées servent uniquement à organiser votre démo.
              <NuxtLink to="/politique-confidentialite" class="underline">Confidentialité</NuxtLink
              >.
            </p>
          </form>
        </div>
      </section>
    </main>

    <LandingFooter />
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: false });

useSeoPage({
  title: 'Réserver une démo — APIGO',
  description:
    'Réservez une démonstration personnalisée et gratuite d’APIGO, le logiciel de gestion apicole tout-en-un. On vous recontacte pour une démo adaptée à votre exploitation.',
  path: '/demo',
});

const route = useRoute();

const inputClass =
  'h-11 w-full rounded-[10px] border bg-white px-4 text-[15px] outline-none transition-shadow focus:ring-2 border-[var(--border-default)] text-[var(--text-primary)] [--tw-ring-color:color-mix(in_srgb,var(--honey)_30%,transparent)]';

interface SlotItem {
  iso: string;
  time: string;
  available: boolean;
}
interface DayGroup {
  dateKey: string;
  label: string;
  slots: SlotItem[];
}

// Créneaux disponibles (générés serveur, occupation en temps réel).
const {
  data: slotsData,
  pending: slotsPending,
  error: slotsError,
  refresh: refreshSlots,
} = useFetch<{ data: { days: DayGroup[] } }>('/api/public/demo/slots', { key: 'demo-slots' });
const days = computed(() => slotsData.value?.data.days ?? []);

const selectedDay = ref('');
watch(
  days,
  (list) => {
    if (!selectedDay.value && list.length) {
      const target = list.find((d) => d.slots.some((s) => s.available)) ?? list[0];
      if (target) selectedDay.value = target.dateKey;
    }
  },
  { immediate: true },
);
const currentSlots = computed(
  () => days.value.find((d) => d.dateKey === selectedDay.value)?.slots ?? [],
);

const form = reactive({
  prenom: '',
  nom: '',
  email: '',
  telephone: '',
  objectif: '',
  slot: '' as string,
  website: '', // honeypot
});

const selectedSlotLabel = computed(() => (form.slot ? formatSlotLong(form.slot) : ''));

const loading = ref(false);
const submitted = ref(false);
const bookedLabel = ref('');
const errorMsg = ref('');

// Pastille de jour : abréviation jour + numéro (heure de Paris).
function dayPill(dateKey: string): { wd: string; num: number } {
  const parts = dateKey.split('-');
  const dt = new Date(Date.UTC(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]), 12));
  const wd = new Intl.DateTimeFormat('fr-FR', { timeZone: 'Europe/Paris', weekday: 'short' })
    .format(dt)
    .replace('.', '');
  return { wd: wd.charAt(0).toUpperCase() + wd.slice(1), num: Number(parts[2]) };
}
function dayAvail(d: DayGroup): number {
  return d.slots.filter((s) => s.available).length;
}
function dayHintColor(d: DayGroup): string {
  return dayAvail(d) ? 'var(--sage-deep)' : 'var(--tint-idle)';
}
function dayPillClass(d: DayGroup): string {
  const active = selectedDay.value === d.dateKey;
  return [
    'flex min-w-[58px] shrink-0 flex-col items-center gap-0.5 rounded-[12px] border px-3 py-2 transition-all',
    active
      ? 'border-[var(--honey)] bg-[var(--honey-soft)] text-[var(--honey-deep)]'
      : 'border-[var(--border-default)] bg-white text-[var(--text-secondary)] hover:border-[var(--border-hover)]',
  ].join(' ');
}
function slotClass(s: SlotItem): string {
  if (!s.available) {
    return 'cursor-not-allowed rounded-[10px] border py-2.5 text-[13px] font-medium border-[var(--border-default)] bg-[var(--surface-muted)] text-[var(--text-quaternary)]';
  }
  const active = form.slot === s.iso;
  return [
    'rounded-[10px] border py-2.5 text-[13px] font-medium transition-all',
    active
      ? 'border-[var(--honey)] bg-[var(--honey-soft)] text-[var(--honey-deep)] shadow-sm'
      : 'border-[var(--border-default)] bg-white text-[var(--text-secondary)] hover:border-[var(--border-hover)]',
  ].join(' ');
}

async function submit() {
  errorMsg.value = '';
  if (!form.slot) {
    errorMsg.value = 'Choisissez un créneau pour réserver.';
    return;
  }
  loading.value = true;
  try {
    await $fetch('/api/public/demo', {
      method: 'POST',
      body: {
        prenom: form.prenom,
        nom: form.nom,
        email: form.email,
        telephone: form.telephone,
        objectif: form.objectif,
        slot: form.slot,
        source: (route.query.from as string) || 'demo_page',
        website: form.website || undefined,
      },
    });
    bookedLabel.value = formatSlotLong(form.slot);
    submitted.value = true;
    if (import.meta.client) window.scrollTo({ top: 0, behavior: 'smooth' });
  } catch (e: unknown) {
    // Créneau pris entre-temps → on rafraîchit la liste pour refléter l'occupation.
    errorMsg.value = getApiErrorMessage(e, 'Une erreur est survenue. Réessayez dans un instant.');
    form.slot = '';
    await refreshNuxtData('demo-slots');
  } finally {
    loading.value = false;
  }
}
</script>
