<template>
  <div class="relative overflow-hidden">
    <Transition
      enter-active-class="transition-all duration-300 ease-out"
      enter-from-class="opacity-0 translate-y-3"
      enter-to-class="opacity-100 translate-y-0"
      leave-active-class="transition-all duration-200 ease-in"
      leave-from-class="opacity-100 translate-y-0"
      leave-to-class="opacity-0 -translate-y-3"
      mode="out-in"
    >
      <!-- Success state -->
      <div v-if="step === 'success'" key="success" class="py-8 text-center">
        <div
          class="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--sage-soft)]"
        >
          <UIcon name="i-lucide-check" class="h-8 w-8 text-[var(--sage)]" />
        </div>
        <h1 class="text-xl font-semibold text-stone-900">Compte créé !</h1>
        <p class="mt-1.5 text-sm text-stone-500">Bienvenue sur APIGO, redirection en cours…</p>
        <div class="mx-auto mt-7 h-1.5 w-48 overflow-hidden rounded-full bg-stone-100">
          <div
            class="h-full rounded-full bg-[var(--honey)] transition-all ease-out"
            :class="barReady ? 'w-full duration-[1600ms]' : 'w-0 duration-0'"
          />
        </div>
      </div>

      <!-- Form state -->
      <div v-else key="form">
        <h1 class="text-xl font-semibold text-stone-900">Créer un compte</h1>
        <p class="mt-1 text-sm text-stone-500">Rejoignez APIGO</p>

        <div
          v-if="authError"
          class="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {{ authError }}
        </div>

        <form class="mt-6 space-y-4" method="post" @submit.prevent="handleRegister">
          <div class="grid grid-cols-2 gap-3">
            <UFormField label="Prénom" name="prenom">
              <UInput v-model="prenom" placeholder="Jean" required class="w-full" />
            </UFormField>
            <UFormField label="Nom" name="nom">
              <UInput v-model="nom" placeholder="Dupont" required class="w-full" />
            </UFormField>
          </div>

          <UFormField label="Email" name="email">
            <UInput
              v-model="email"
              type="email"
              placeholder="vous@exemple.fr"
              required
              class="w-full"
            />
          </UFormField>

          <UFormField label="Téléphone" name="telephone" hint="Facultatif">
            <UInput
              v-model="telephone"
              type="tel"
              inputmode="tel"
              autocomplete="tel"
              placeholder="06 12 34 56 78"
              class="w-full"
            />
          </UFormField>

          <UFormField label="Mot de passe" name="password">
            <UInput
              v-model="password"
              type="password"
              placeholder="Minimum 8 caractères"
              required
              class="w-full"
            />
          </UFormField>

          <div v-if="password" class="flex gap-1">
            <div
              v-for="i in 4"
              :key="i"
              class="h-1 flex-1 rounded-full transition-colors"
              :class="i <= passwordStrength ? strengthColor : 'bg-stone-200'"
            />
          </div>

          <UFormField label="Confirmer le mot de passe" name="confirmPassword">
            <UInput
              v-model="confirmPassword"
              type="password"
              placeholder="Confirmer votre mot de passe"
              required
              class="w-full"
            />
          </UFormField>

          <div class="flex items-start gap-2.5 text-sm text-stone-600">
            <UCheckbox
              v-model="acceptCgu"
              class="mt-0.5"
              aria-label="J'ai lu et j'accepte les Conditions Générales d'Utilisation et la Politique de confidentialité"
            />
            <span>
              J'ai lu et j'accepte les
              <NuxtLink
                to="/cgu"
                target="_blank"
                class="font-medium text-honey-deep hover:underline"
                >Conditions Générales d'Utilisation</NuxtLink
              >
              et la
              <NuxtLink
                to="/politique-confidentialite"
                target="_blank"
                class="font-medium text-honey-deep hover:underline"
                >Politique de confidentialité</NuxtLink
              >.
            </span>
          </div>

          <UiTurnstile />

          <UButton
            type="submit"
            label="Créer mon compte"
            icon="i-lucide-user-plus"
            color="primary"
            block
            size="lg"
            :loading="loading"
            :disabled="!isValid"
            class="min-h-[44px]"
          />
        </form>

        <p class="mt-6 text-center text-sm text-stone-500">
          Déjà un compte ?
          <NuxtLink
            :to="{ path: '/login', query: route.query }"
            class="font-medium text-honey-deep hover:text-amber-700"
          >
            Se connecter
          </NuxtLink>
        </p>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import type { ApiResponse } from '~/types/api';
import type { Profil } from '~/types/models';

definePageMeta({ layout: 'auth' });

const supabase = useSupabaseClient();
const authStore = useAuthStore();
const router = useRouter();
const route = useRoute();
const analytics = useAnalytics();
const { consume: consumeCaptcha } = useCaptcha();

const step = ref<'form' | 'success'>('form');
const barReady = ref(false);
const loading = ref(false);
const authError = ref<string | null>(null);

const nom = ref('');
const prenom = ref('');
const email = ref('');
const telephone = ref('');
const password = ref('');
const confirmPassword = ref('');
const acceptCgu = ref(false);

const passwordStrength = computed(() => {
  const p = password.value;
  let score = 0;
  if (p.length >= 8) score++;
  if (/[A-Z]/.test(p)) score++;
  if (/[0-9]/.test(p)) score++;
  if (/[^A-Za-z0-9]/.test(p)) score++;
  return score;
});

const strengthColor = computed(() => {
  if (passwordStrength.value <= 1) return 'bg-red-400';
  if (passwordStrength.value === 2) return 'bg-amber-400';
  if (passwordStrength.value === 3) return 'bg-amber-400';
  return 'bg-amber-500';
});

const isValid = computed(() => {
  return (
    nom.value.trim() &&
    prenom.value.trim() &&
    email.value.trim() &&
    password.value.length >= 8 &&
    password.value === confirmPassword.value &&
    acceptCgu.value
  );
});

async function handleRegister() {
  if (password.value !== confirmPassword.value) {
    authError.value = 'Les mots de passe ne correspondent pas';
    return;
  }
  authError.value = null;
  loading.value = true;
  try {
    await $fetch<ApiResponse<Profil>>('/api/auth/register', {
      method: 'POST',
      body: {
        email: email.value,
        password: password.value,
        nom: nom.value,
        prenom: prenom.value,
        telephone: telephone.value.trim() || undefined,
        acceptCgu: acceptCgu.value,
      },
    });

    // Auto-connexion juste après la création du compte. On passe le token
    // Turnstile exactement comme le login classique (useAuth().login) : sans lui,
    // si la protection CAPTCHA Supabase est active, signInWithPassword échoue
    // ("captcha verification process failed") et l'utilisateur, bien que son
    // compte soit créé, voit une erreur puis doit se reconnecter manuellement.
    const captchaToken = consumeCaptcha();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: email.value,
      password: password.value,
      ...(captchaToken ? { options: { captchaToken } } : {}),
    });

    if (signInError) {
      authError.value = signInError.message.toLowerCase().includes('captcha')
        ? 'Vérification anti-robot expirée. Rechargez la page et réessayez.'
        : signInError.message;
      return;
    }

    step.value = 'success';
    await nextTick();
    // Trigger bar animation on next frame so the transition class is applied
    requestAnimationFrame(() => {
      barReady.value = true;
    });

    // 1800ms: animation runs + session cookie propagates before server call
    await new Promise<void>((resolve) => setTimeout(resolve, 1800));

    await authStore.fetchProfil();
    if (authStore.profil) {
      analytics.identify(authStore.profil.id, {
        plan: authStore.profil.plan,
        trial_active: authStore.profil.trialActive,
        onboarding_complete: false,
      });
      analytics.capture('signup_completed', {
        utm_source: new URLSearchParams(window.location.search).get('utm_source') ?? undefined,
        utm_medium: new URLSearchParams(window.location.search).get('utm_medium') ?? undefined,
        utm_campaign: new URLSearchParams(window.location.search).get('utm_campaign') ?? undefined,
      });
    }
    // Reprise d'une intention (ex. checkout d'un plan) si présente
    const redirect = safeInternalPath(route.query.redirect);
    await router.push(redirect ?? '/onboarding');
  } catch (e: unknown) {
    const err = e as { data?: { message?: string } } | Error | null;
    if (err && typeof err === 'object' && 'data' in err && err.data?.message) {
      authError.value = err.data.message;
    } else {
      authError.value =
        e instanceof Error ? e.message : 'Une erreur est survenue lors de la création du compte';
    }
  } finally {
    loading.value = false;
  }
}
</script>
