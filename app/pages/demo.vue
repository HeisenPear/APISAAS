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
              C'est noté, {{ form.prenom || 'merci' }} !
            </h2>
            <p
              class="mx-auto mb-6 max-w-md text-[14.5px] leading-relaxed"
              style="color: var(--text-secondary)"
            >
              Votre demande est bien arrivée. Un email de confirmation vient de vous être envoyé —
              on vous recontacte très vite pour caler le créneau.
            </p>
            <div class="flex flex-col items-center justify-center gap-3 sm:flex-row">
              <NuxtLink
                to="/register"
                class="inline-flex w-full items-center justify-center gap-2 rounded-[12px] px-6 py-3 text-[14px] font-bold text-white transition-all hover:-translate-y-0.5 sm:w-auto"
                style="background: var(--honey)"
              >
                <span class="text-[15px] leading-none" aria-hidden="true">🐝</span>
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

            <!-- Créneau souhaité -->
            <div class="mt-7">
              <p
                class="mb-1 text-[11px] font-semibold uppercase tracking-[0.12em]"
                style="color: var(--honey-deep)"
              >
                Créneau souhaité
              </p>
              <p class="mb-4 text-[12.5px]" style="color: var(--text-tertiary)">
                Optionnel — donnez-nous une préférence, on confirme ensemble par la suite.
              </p>

              <div class="space-y-5">
                <!-- Période -->
                <div>
                  <p class="mb-2 text-[13px] font-medium" style="color: var(--text-secondary)">
                    Quand vous arrange ?
                  </p>
                  <div class="flex flex-wrap gap-2">
                    <button
                      v-for="p in periodes"
                      :key="p.value"
                      type="button"
                      :class="chipClass(form.creneauPeriode === p.value)"
                      @click="toggle('creneauPeriode', p.value)"
                    >
                      {{ p.label }}
                    </button>
                  </div>
                </div>

                <!-- Jour -->
                <div>
                  <p class="mb-2 text-[13px] font-medium" style="color: var(--text-secondary)">
                    Quel jour ?
                  </p>
                  <div class="grid grid-cols-5 gap-2">
                    <button
                      v-for="j in jours"
                      :key="j.value"
                      type="button"
                      :class="cellClass(form.creneauJour === j.value)"
                      @click="toggle('creneauJour', j.value)"
                    >
                      <span class="sm:hidden">{{ j.short }}</span>
                      <span class="hidden sm:inline">{{ j.full }}</span>
                    </button>
                  </div>
                </div>

                <!-- Moment -->
                <div>
                  <p class="mb-2 text-[13px] font-medium" style="color: var(--text-secondary)">
                    Matin ou après-midi ?
                  </p>
                  <div class="grid grid-cols-2 gap-2">
                    <button
                      v-for="m in moments"
                      :key="m.value"
                      type="button"
                      :class="cellClass(form.creneauMoment === m.value)"
                      @click="toggle('creneauMoment', m.value)"
                    >
                      <UIcon :name="m.icon" class="h-4 w-4" />
                      {{ m.label }}
                    </button>
                  </div>
                </div>
              </div>
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
              :disabled="loading"
              class="mt-6 flex w-full items-center justify-center gap-2 rounded-[13px] py-3.5 text-[15px] font-bold text-white transition-all hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
              style="
                background: var(--honey);
                box-shadow: 0 6px 24px color-mix(in srgb, var(--honey) 35%, transparent);
              "
            >
              <UIcon
                :name="loading ? 'i-lucide-loader-2' : 'i-lucide-send'"
                class="h-5 w-5"
                :class="loading ? 'animate-spin' : ''"
              />
              {{ loading ? 'Envoi…' : 'Envoyer ma demande' }}
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

const periodes = [
  { value: 'cette_semaine', label: 'Cette semaine' },
  { value: 'semaine_prochaine', label: 'La semaine prochaine' },
  { value: 'flexible', label: 'Flexible' },
];
const jours = [
  { value: 'lundi', short: 'Lun', full: 'Lundi' },
  { value: 'mardi', short: 'Mar', full: 'Mardi' },
  { value: 'mercredi', short: 'Mer', full: 'Mercredi' },
  { value: 'jeudi', short: 'Jeu', full: 'Jeudi' },
  { value: 'vendredi', short: 'Ven', full: 'Vendredi' },
];
const moments = [
  { value: 'matin', label: 'Matin', icon: 'i-lucide-sunrise' },
  { value: 'apres_midi', label: 'Après-midi', icon: 'i-lucide-sunset' },
];

const form = reactive({
  prenom: '',
  nom: '',
  email: '',
  telephone: '',
  objectif: '',
  creneauPeriode: '' as string,
  creneauJour: '' as string,
  creneauMoment: '' as string,
  website: '', // honeypot
});

const loading = ref(false);
const submitted = ref(false);
const errorMsg = ref('');

function chipClass(active: boolean): string {
  return [
    'rounded-[10px] border px-3.5 py-2 text-[13px] font-medium transition-all',
    active
      ? 'border-[var(--honey)] bg-[var(--honey-soft)] text-[var(--honey-deep)]'
      : 'border-[var(--border-default)] bg-white text-[var(--text-secondary)] hover:border-[var(--border-hover)]',
  ].join(' ');
}

// Bouton de grille (jours, moments) : pleine largeur, centré, même code couleur.
function cellClass(active: boolean): string {
  return [
    'flex w-full items-center justify-center gap-1.5 rounded-[10px] border py-2.5 text-[13px] font-medium transition-all',
    active
      ? 'border-[var(--honey)] bg-[var(--honey-soft)] text-[var(--honey-deep)] shadow-sm'
      : 'border-[var(--border-default)] bg-white text-[var(--text-secondary)] hover:border-[var(--border-hover)]',
  ].join(' ');
}

// Sélection exclusive par groupe : recliquer désélectionne.
function toggle(field: 'creneauPeriode' | 'creneauJour' | 'creneauMoment', value: string) {
  form[field] = form[field] === value ? '' : value;
}

async function submit() {
  errorMsg.value = '';
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
        creneauPeriode: form.creneauPeriode || undefined,
        creneauJour: form.creneauJour || undefined,
        creneauMoment: form.creneauMoment || undefined,
        source: (route.query.from as string) || 'demo_page',
        website: form.website || undefined,
      },
    });
    submitted.value = true;
    if (import.meta.client) window.scrollTo({ top: 0, behavior: 'smooth' });
  } catch (e: unknown) {
    errorMsg.value = getApiErrorMessage(e, 'Une erreur est survenue. Réessayez dans un instant.');
  } finally {
    loading.value = false;
  }
}
</script>
