<template>
  <div
    class="flex min-h-dvh items-center justify-center p-4 py-10"
    style="background: var(--surface-primary)"
  >
    <div class="w-full max-w-lg space-y-6">
      <!-- Logo -->
      <div class="flex justify-center">
        <NuxtLink to="/" class="flex items-center gap-2.5">
          <img
            src="/logo_apigo.webp"
            alt="APIGO"
            class="h-9 w-9 rounded-xl shadow-sm object-cover"
          />
          <span class="text-base font-bold tracking-tight" style="color: var(--text-primary)"
            >APIGO</span
          >
        </NuxtLink>
      </div>

      <!-- Card principale -->
      <div
        class="rounded-[20px] border bg-white shadow-sm overflow-hidden"
        style="border-color: var(--border-default)"
      >
        <!-- Bandeau top honey -->
        <div
          class="px-8 py-5 text-center"
          style="background: linear-gradient(135deg, var(--honey) 0%, var(--honey-dark) 100%)"
        >
          <div
            class="inline-flex items-center gap-2 rounded-full bg-white/20 px-4 py-1.5 text-[13px] font-semibold text-white mb-3"
          >
            <UIcon name="i-lucide-shield-check" class="h-4 w-4" />
            0 € débité aujourd'hui
          </div>
          <h1 class="text-[26px] font-bold tracking-[-0.025em] text-white leading-tight">
            60 jours Pro, entièrement gratuits
          </h1>
          <p class="mt-1.5 text-[14px] text-white/80">
            Votre carte sécurise le compte — aucun débit avant la fin de l'essai
          </p>
        </div>

        <div class="p-8">
          <!-- Alerte annulation -->
          <div
            v-if="route.query.canceled"
            class="mb-6 flex items-center gap-2 rounded-[10px] px-4 py-3 text-sm"
            style="background: var(--clay-soft); color: var(--clay-deep)"
          >
            <UIcon name="i-lucide-info" class="h-4 w-4 shrink-0" />
            Paiement annulé. Vous pouvez réessayer ou continuer avec le plan Découverte.
          </div>

          <!-- Si trial déjà utilisé -->
          <div v-if="trialAlreadyUsed" class="text-center py-4">
            <div
              class="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-[14px]"
              style="background: var(--honey-soft)"
            >
              <UIcon name="i-lucide-check-circle" class="h-7 w-7" style="color: var(--honey)" />
            </div>
            <h2
              class="text-[20px] font-bold tracking-[-0.02em] mb-2"
              style="color: var(--text-primary)"
            >
              Essai déjà activé
            </h2>
            <p class="text-sm mb-6" style="color: var(--text-secondary)">
              Vous avez déjà utilisé votre essai gratuit. Souscrivez directement à un plan payant.
            </p>
            <NuxtLink
              to="/tarifs"
              class="inline-flex items-center gap-2 rounded-[12px] px-5 py-2.5 text-sm font-semibold text-white"
              style="background: var(--honey)"
            >
              Voir les plans
            </NuxtLink>
          </div>

          <!-- Flow normal -->
          <template v-else>
            <!-- Timeline rassurante -->
            <div class="mb-7">
              <p
                class="text-[11px] font-semibold uppercase tracking-[0.1em] mb-3"
                style="color: var(--honey-deep)"
              >
                Comment ça marche
              </p>
              <div class="flex items-start gap-0">
                <!-- Étape 1 -->
                <div class="flex-1 text-center">
                  <div
                    class="mx-auto mb-2 flex h-9 w-9 items-center justify-center rounded-full text-white text-sm font-bold"
                    style="background: var(--honey)"
                  >
                    1
                  </div>
                  <p class="text-[12px] font-semibold" style="color: var(--text-primary)">
                    Aujourd'hui
                  </p>
                  <p class="text-[11px] leading-snug mt-0.5" style="color: var(--text-tertiary)">
                    Carte enregistrée<br />0 € prélevé
                  </p>
                </div>
                <!-- Trait -->
                <div
                  class="mt-4.5 flex-1 border-t-2 border-dashed"
                  style="border-color: var(--border-default)"
                />
                <!-- Étape 2 -->
                <div class="flex-1 text-center">
                  <div
                    class="mx-auto mb-2 flex h-9 w-9 items-center justify-center rounded-full text-[13px] font-bold"
                    style="background: var(--honey-soft); color: var(--honey-deep)"
                  >
                    2
                  </div>
                  <p class="text-[12px] font-semibold" style="color: var(--text-primary)">J-7</p>
                  <p class="text-[11px] leading-snug mt-0.5" style="color: var(--text-tertiary)">
                    Email de rappel<br />Annulez si besoin
                  </p>
                </div>
                <!-- Trait -->
                <div
                  class="mt-4.5 flex-1 border-t-2 border-dashed"
                  style="border-color: var(--border-default)"
                />
                <!-- Étape 3 -->
                <div class="flex-1 text-center">
                  <div
                    class="mx-auto mb-2 flex h-9 w-9 items-center justify-center rounded-full text-[13px] font-bold"
                    style="background: var(--surface-muted); color: var(--text-tertiary)"
                  >
                    3
                  </div>
                  <p class="text-[12px] font-semibold" style="color: var(--text-primary)">
                    Jour 60
                  </p>
                  <p class="text-[11px] leading-snug mt-0.5" style="color: var(--text-tertiary)">
                    14,99 €/mois<br />si vous continuez
                  </p>
                </div>
              </div>
            </div>

            <!-- Features incluses -->
            <div class="mb-6">
              <p
                class="text-[11px] font-semibold uppercase tracking-[0.1em] mb-3"
                style="color: var(--honey-deep)"
              >
                Tout le plan Pro débloqué
              </p>
              <ul class="space-y-2">
                <li
                  v-for="f in proFeatures"
                  :key="f"
                  class="flex items-center gap-2.5 text-[13px]"
                  style="color: var(--text-secondary)"
                >
                  <UIcon
                    name="i-lucide-check"
                    class="h-4 w-4 shrink-0"
                    style="color: var(--sage)"
                  />
                  {{ f }}
                </li>
              </ul>
            </div>

            <!-- Note rassurante carte -->
            <div
              class="mb-6 flex gap-3 rounded-[12px] border px-4 py-3.5"
              style="background: var(--honey-soft); border-color: rgba(245, 166, 35, 0.2)"
            >
              <UIcon
                name="i-lucide-lock"
                class="h-4 w-4 shrink-0 mt-0.5"
                style="color: var(--honey-dark)"
              />
              <p class="text-[12.5px] leading-relaxed" style="color: var(--honey-deep)">
                <strong>Pourquoi votre carte ?</strong> Elle sécurise votre compte et permet la
                continuité du service après l'essai — vous ne serez débité que dans 60 jours, et
                seulement si vous choisissez de rester.
              </p>
            </div>

            <!-- Acceptation CGV (vente d'abonnement) -->
            <div
              class="mb-4 flex items-start gap-2 text-[12.5px]"
              style="color: var(--text-secondary)"
            >
              <UCheckbox v-model="acceptCgv" class="mt-0.5" />
              <span>
                J'accepte les
                <NuxtLink to="/cgv" target="_blank" class="font-medium text-honey-deep underline"
                  >CGV</NuxtLink
                >
                et demande l'accès immédiat au service (renonciation au droit de rétractation de 14
                jours).
              </span>
            </div>

            <!-- CTA principal -->
            <UButton
              block
              size="lg"
              color="primary"
              icon="i-lucide-zap"
              :loading="loading"
              :disabled="!acceptCgv"
              class="mb-3 font-semibold"
              @click="activateTrial"
            >
              Démarrer mes 60 jours gratuits
            </UButton>

            <!-- Prix après trial -->
            <p class="mb-3 text-center text-[12px]" style="color: var(--text-tertiary)">
              Puis 14,99 €/mois — résiliable en 1 clic avant la fin de l'essai, sans frais
            </p>

            <!-- Skip -->
            <button
              type="button"
              class="w-full text-center text-[12.5px] py-2 transition-colors"
              style="color: var(--text-quaternary)"
              @click="skipTrial"
            >
              Rester sur le plan Découverte gratuit →
            </button>
          </template>
        </div>
      </div>

      <!-- Réassurance basse -->
      <div class="flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
        <div
          v-for="proof in proofs"
          :key="proof.label"
          class="flex items-center gap-1.5 text-[12px]"
          style="color: var(--text-tertiary)"
        >
          <UIcon :name="proof.icon" class="h-3.5 w-3.5" style="color: var(--sage)" />
          {{ proof.label }}
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
const acceptCgv = ref(false);
const analytics = useAnalytics();

const proFeatures = [
  '50 ruches, 5 ruchers',
  'Interventions groupées illimitées',
  'Facturation Pro (Factur-X)',
  'Score prédictif de santé par colonie',
  'Suivi reine, transhumance, traçabilité lots',
  'TVA multi-taux automatique',
  "3 membres d'équipe",
];

const proofs = [
  { label: 'Sans engagement', icon: 'i-lucide-handshake' },
  { label: 'Annulation en 1 clic', icon: 'i-lucide-x-circle' },
  { label: 'Paiement sécurisé Stripe', icon: 'i-lucide-shield-check' },
  { label: 'Données hébergées en Europe (UE)', icon: 'i-lucide-map-pin' },
];

onMounted(async () => {
  if (!authStore.profil) await authStore.fetchProfil();
  const p = authStore.profil as (typeof authStore.profil & { trialUsed?: boolean }) | null;
  if (p?.trialUsed) trialAlreadyUsed.value = true;
});

async function activateTrial() {
  loading.value = true;
  try {
    const res = await $fetch<{ data: { url: string } }>('/api/stripe/trial-checkout', {
      method: 'POST',
      body: { acceptCgv: acceptCgv.value },
    });
    if (res.data.url) {
      analytics.capture('trial_started', { plan: 'pro_trial', trigger: 'activer-essai' });
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
  analytics.capture('trial_skipped', { from_plan: 'decouverte' });
  router.push('/dashboard');
}
</script>
