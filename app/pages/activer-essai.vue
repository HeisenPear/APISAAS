<template>
  <div class="flex min-h-dvh items-center justify-center p-4" style="background:var(--surface-primary)">
    <div class="w-full max-w-lg space-y-8">

      <!-- Logo -->
      <div class="flex justify-center">
        <NuxtLink to="/" class="flex items-center gap-2.5">
          <img src="/logo_apigo.webp" alt="APIGO" class="h-9 w-9 rounded-xl shadow-sm object-cover">
          <span class="text-base font-bold tracking-tight" style="color:var(--text-primary)">APIGO</span>
        </NuxtLink>
      </div>

      <!-- Card principale -->
      <div class="rounded-[20px] border bg-white p-8 shadow-sm" style="border-color:var(--border-default)">

        <!-- Alerte annulation -->
        <div v-if="route.query.canceled" class="mb-6 flex items-center gap-2 rounded-[10px] px-4 py-3 text-sm" style="background:var(--clay-soft);color:var(--clay-deep)">
          <UIcon name="i-lucide-info" class="h-4 w-4 shrink-0" />
          Paiement annulé. Vous pouvez réessayer ou continuer avec le plan Découverte.
        </div>

        <!-- Si trial déjà utilisé -->
        <div v-if="trialAlreadyUsed" class="text-center">
          <div class="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-[14px]" style="background:var(--honey-soft)">
            <UIcon name="i-lucide-check-circle" class="h-7 w-7" style="color:var(--honey)" />
          </div>
          <h1 class="text-[22px] font-bold tracking-[-0.02em] mb-2" style="color:var(--text-primary)">Essai déjà activé</h1>
          <p class="text-sm mb-6" style="color:var(--text-secondary)">Vous avez déjà utilisé votre essai gratuit. Souscrivez directement à un plan payant.</p>
          <NuxtLink to="/tarifs" class="inline-flex items-center gap-2 rounded-[12px] px-5 py-2.5 text-sm font-semibold text-white" style="background:var(--honey)">
            Voir les plans
          </NuxtLink>
        </div>

        <!-- Flow normal -->
        <template v-else>
          <!-- Header -->
          <div class="mb-6 text-center">
            <div class="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-[14px]" style="background:var(--honey-soft)">
              <UIcon name="i-lucide-zap" class="h-7 w-7" style="color:var(--honey)" />
            </div>
            <h1 class="text-[24px] font-bold tracking-[-0.025em]" style="color:var(--text-primary)">
              Essai Pro gratuit — 60 jours
            </h1>
            <p class="mt-2 text-sm leading-relaxed" style="color:var(--text-secondary)">
              Testez toutes les fonctionnalités Pro sans limitation.<br>
              <strong style="color:var(--text-primary)">Aucun débit pendant 60 jours.</strong>
              Résiliable à tout moment.
            </p>
          </div>

          <!-- Features incluses -->
          <ul class="mb-6 space-y-2">
            <li v-for="f in proFeatures" :key="f" class="flex items-center gap-2.5 text-[13px]" style="color:var(--text-secondary)">
              <UIcon name="i-lucide-check" class="h-4 w-4 shrink-0" style="color:var(--sage)" />
              {{ f }}
            </li>
          </ul>

          <!-- Prix après trial -->
          <div class="mb-6 rounded-[12px] px-4 py-3 text-center text-[12.5px]" style="background:var(--surface-muted);color:var(--text-tertiary)">
            Après les 60 jours : <strong style="color:var(--text-secondary)">14,99 €/mois</strong> — annulable avant sans frais
          </div>

          <!-- CTA principal -->
          <UButton
            block
            size="lg"
            color="primary"
            icon="i-lucide-credit-card"
            :loading="loading"
            class="mb-3 font-semibold"
            @click="activateTrial"
          >
            Activer mon essai — entrer ma carte
          </UButton>

          <!-- Skip -->
          <button
            type="button"
            class="w-full text-center text-sm py-2 transition-colors"
            style="color:var(--text-tertiary)"
            @click="skipTrial"
          >
            Continuer sans essai avec le plan Découverte gratuit →
          </button>
        </template>
      </div>

      <!-- Réassurance -->
      <div class="flex flex-wrap items-center justify-center gap-x-5 gap-y-1.5">
        <div v-for="proof in proofs" :key="proof" class="flex items-center gap-1.5 text-[12px]" style="color:var(--text-tertiary)">
          <UIcon name="i-lucide-shield-check" class="h-3.5 w-3.5" style="color:var(--sage)" />
          {{ proof }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: false });

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const toast = useToast();
const loading = ref(false);
const trialAlreadyUsed = ref(false);

const proFeatures = [
  '50 ruches, 5 ruchers',
  'Interventions groupées illimitées',
  'Facturation Pro + export FEC',
  'Score prédictif de santé par colonie',
  'Suivi reine, transhumance, traçabilité lots',
  'TVA multi-taux automatique',
  '3 membres d\'équipe',
];

const proofs = ['Sans engagement', 'Annulation en 1 clic', 'Données hébergées en France'];

// Vérifier si l'utilisateur a déjà un trial
onMounted(async () => {
  if (!authStore.profil) await authStore.fetchProfil();
  const p = authStore.profil as (typeof authStore.profil & { trialUsed?: boolean }) | null;
  if (p?.trialUsed) trialAlreadyUsed.value = true;
});

async function activateTrial() {
  loading.value = true;
  try {
    const res = await $fetch<{ data: { url: string } }>('/api/stripe/trial-checkout', { method: 'POST' });
    if (res.data.url) {
      window.location.href = res.data.url;
    }
  } catch (e: unknown) {
    const msg = getApiErrorMessage(e, "Erreur lors de l'activation de l'essai");
    if (msg.includes('déjà utilisé')) trialAlreadyUsed.value = true;
    toast.add({ title: msg, color: 'error' });
  } finally {
    loading.value = false;
  }
}

function skipTrial() {
  router.push('/onboarding');
}
</script>
