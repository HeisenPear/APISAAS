<template>
  <div class="flex min-h-dvh">

    <!-- ─── LEFT PANEL — Brand ───────────────────────────────────────── -->
    <div
      class="relative hidden flex-col justify-between overflow-hidden bg-[#1c1c1e] p-10 lg:flex lg:w-[44%] xl:w-[42%]"
    >
      <!-- Honeycomb background pattern -->
      <div class="pointer-events-none absolute inset-0">
        <svg class="h-full w-full opacity-[0.035]" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="hex" x="0" y="0" width="56" height="97" patternUnits="userSpaceOnUse">
              <polygon
                points="28,1 55,15 55,43 28,57 1,43 1,15"
                fill="none"
                stroke="white"
                stroke-width="1"
              />
              <polygon
                points="28,49 55,63 55,91 28,105 1,91 1,63"
                fill="none"
                stroke="white"
                stroke-width="1"
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#hex)" />
        </svg>
      </div>

      <!-- Amber glow bottom-left -->
      <div
        class="pointer-events-none absolute -bottom-32 -left-24 h-72 w-72 rounded-full bg-[var(--honey)] opacity-10 blur-[80px]"
      />

      <!-- Top — Logo -->
      <div class="relative flex items-center gap-3">
        <img
          src="/logo_apigo.webp"
          alt="APIGO"
          class="h-9 w-9 rounded-[10px] object-cover shadow-lg"
        >
        <span class="text-[17px] font-semibold tracking-[-0.01em] text-white">APIGO</span>
      </div>

      <!-- Middle — Value prop -->
      <div class="relative">
        <p
          class="text-[10px] font-semibold uppercase tracking-[0.18em]"
          style="color: var(--honey)"
        >
          Gestion apicole
        </p>
        <h1
          class="mt-3 text-[30px] font-semibold leading-[1.18] tracking-[-0.025em] text-white xl:text-[34px]"
          style="font-family: 'SF Pro Display', 'Inter', system-ui, sans-serif"
        >
          Gérez vos ruchers<br>depuis n'importe où.
        </h1>
        <p class="mt-4 max-w-xs text-[14px] leading-relaxed text-white/45">
          Du rucher au bilan comptable — tout ce dont vous avez besoin pour piloter votre
          exploitation.
        </p>

        <!-- Feature pills -->
        <div class="mt-8 flex flex-wrap gap-2">
          <span
            v-for="feat in features"
            :key="feat.label"
            class="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.06] px-3 py-1.5 text-[12px] font-medium text-white/60"
          >
            <UIcon :name="feat.icon" class="h-3 w-3" style="color: var(--honey)" />
            {{ feat.label }}
          </span>
        </div>
      </div>

      <!-- Bottom — Tagline -->
      <div class="relative border-t border-white/10 pt-6">
        <p class="text-[12px] text-white/30">
          Données hébergées en Europe · RGPD conforme
        </p>
      </div>
    </div>

    <!-- ─── RIGHT PANEL — Form ────────────────────────────────────────── -->
    <div
      class="flex flex-1 flex-col items-center justify-center bg-[var(--surface-primary)] px-6 py-12 md:px-10"
    >
      <!-- Mobile logo (lg: hidden) -->
      <div class="mb-10 flex flex-col items-center lg:hidden">
        <img
          src="/logo_apigo.webp"
          alt="APIGO"
          class="h-12 w-12 rounded-[12px] object-cover shadow-md"
        >
        <span class="mt-2.5 text-[15px] font-semibold text-[var(--text-primary)]">APIGO</span>
      </div>

      <div class="w-full max-w-[400px]">

        <!-- Heading -->
        <div class="mb-8">
          <h2
            class="text-[26px] font-semibold tracking-[-0.02em] text-[var(--text-primary)]"
            style="font-family: 'SF Pro Display', 'Inter', system-ui, sans-serif"
          >
            Bienvenue
          </h2>
          <p class="mt-1.5 text-[15px] text-[var(--text-secondary)]">
            Connectez-vous à votre espace apicole
          </p>
        </div>

        <!-- Error -->
        <Transition
          enter-active-class="transition-all duration-200 ease-out"
          enter-from-class="opacity-0 -translate-y-1"
          enter-to-class="opacity-100 translate-y-0"
          leave-active-class="transition-all duration-150 ease-in"
          leave-from-class="opacity-100 translate-y-0"
          leave-to-class="opacity-0 -translate-y-1"
        >
          <div
            v-if="authError"
            class="mb-5 flex items-start gap-3 rounded-[10px] border border-red-200/70 bg-red-50 px-4 py-3"
          >
            <UIcon name="i-lucide-circle-alert" class="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
            <p class="text-[13px] text-red-700">{{ authError }}</p>
          </div>
        </Transition>

        <!-- Form -->
        <form class="space-y-4" @submit.prevent="handleLogin">

          <!-- Email -->
          <div>
            <label
              for="login-email"
              class="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.09em] text-[var(--text-tertiary)]"
            >
              Adresse email
            </label>
            <input
              id="login-email"
              ref="emailInput"
              v-model="email"
              type="email"
              placeholder="vous@exemple.fr"
              required
              autocomplete="email"
              class="input-field"
            >
          </div>

          <!-- Password -->
          <div>
            <label
              for="login-password"
              class="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.09em] text-[var(--text-tertiary)]"
            >
              Mot de passe
            </label>
            <div class="relative">
              <input
                id="login-password"
                v-model="password"
                :type="showPassword ? 'text' : 'password'"
                placeholder="Votre mot de passe"
                required
                autocomplete="current-password"
                class="input-field pr-11"
              >
              <button
                type="button"
                class="absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)] transition-colors duration-150 hover:text-[var(--text-secondary)]"
                :title="showPassword ? 'Masquer' : 'Afficher'"
                @click="showPassword = !showPassword"
              >
                <UIcon
                  :name="showPassword ? 'i-lucide-eye-off' : 'i-lucide-eye'"
                  class="h-4 w-4"
                />
              </button>
            </div>
          </div>

          <!-- Remember + Forgot -->
          <div class="flex items-center justify-between pt-0.5">
            <label class="flex cursor-pointer select-none items-center gap-2">
              <div
                class="flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-[5px] border transition-all duration-150"
                :class="
                  rememberMe
                    ? 'border-[var(--honey)] bg-[var(--honey)]'
                    : 'border-[var(--border-hover)] bg-white'
                "
                @click="rememberMe = !rememberMe"
              >
                <UIcon
                  v-if="rememberMe"
                  name="i-lucide-check"
                  class="h-[10px] w-[10px] text-white"
                />
              </div>
              <span class="text-[13px] text-[var(--text-secondary)]">Se souvenir de moi</span>
            </label>
            <NuxtLink
              to="/reset-password"
              class="text-[13px] font-medium text-[var(--honey-deep)] transition-colors hover:text-[var(--honey)]"
            >
              Mot de passe oublié ?
            </NuxtLink>
          </div>

          <!-- Submit CTA -->
          <button
            type="submit"
            :disabled="loading"
            class="mt-1 flex h-11 w-full items-center justify-center gap-2 rounded-[10px] bg-[var(--honey)] text-[14px] font-semibold text-white shadow-sm transition-all duration-200 hover:bg-[var(--honey-dark)] hover:shadow-md active:scale-[0.985] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <UIcon
              :name="loading ? 'i-lucide-loader-2' : 'i-lucide-log-in'"
              class="h-4 w-4"
              :class="loading ? 'animate-spin' : ''"
            />
            {{ loading ? 'Connexion…' : 'Se connecter' }}
          </button>
        </form>

        <!-- Divider -->
        <div class="my-6 flex items-center gap-3">
          <div class="h-px flex-1 bg-[var(--border-default)]" />
          <span class="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--text-quaternary)]">ou</span>
          <div class="h-px flex-1 bg-[var(--border-default)]" />
        </div>

        <!-- Magic link -->
        <div v-if="!magicLinkSent">
          <button
            type="button"
            :disabled="magicLoading"
            class="flex h-11 w-full items-center justify-center gap-2 rounded-[10px] border border-[var(--border-default)] bg-white text-[14px] font-medium text-[var(--text-secondary)] transition-all duration-150 hover:border-[var(--border-hover)] hover:bg-[var(--surface-muted)] hover:text-[var(--text-primary)] active:scale-[0.985] disabled:cursor-not-allowed disabled:opacity-60"
            @click="handleMagicLink"
          >
            <UIcon
              :name="magicLoading ? 'i-lucide-loader-2' : 'i-lucide-wand-2'"
              class="h-4 w-4 text-[var(--honey)]"
              :class="magicLoading ? 'animate-spin' : ''"
            />
            {{ magicLoading ? 'Envoi en cours…' : 'Connexion par lien magique' }}
          </button>
          <p class="mt-2 text-center text-[11px] text-[var(--text-tertiary)]">
            Recevez un lien de connexion instantané par email
          </p>
        </div>

        <!-- Magic link sent -->
        <div
          v-else
          class="flex flex-col items-center gap-2 rounded-[10px] border border-emerald-200/70 bg-emerald-50 px-4 py-5 text-center"
        >
          <div
            class="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100"
          >
            <UIcon name="i-lucide-mail-check" class="h-4.5 w-4.5 text-emerald-600" />
          </div>
          <p class="text-[13px] font-semibold text-emerald-800">Lien envoyé !</p>
          <p class="text-[12px] text-emerald-600">
            Vérifiez votre boîte email et cliquez sur le lien.
          </p>
        </div>

        <!-- Register link -->
        <p class="mt-8 text-center text-[13px] text-[var(--text-tertiary)]">
          Pas encore de compte ?
          <NuxtLink
            to="/register"
            class="font-semibold text-[var(--text-primary)] underline decoration-[var(--border-hover)] underline-offset-2 transition-colors hover:text-[var(--honey-deep)] hover:decoration-[var(--honey)]"
          >
            Créer un compte gratuitement
          </NuxtLink>
        </p>

        <!-- Footer links -->
        <div class="mt-10 flex items-center justify-center gap-4">
          <NuxtLink
            to="/mentions-legales"
            class="text-[11px] text-[var(--text-quaternary)] transition-colors hover:text-[var(--text-tertiary)]"
          >
            Mentions légales
          </NuxtLink>
          <span class="text-[var(--text-quaternary)]">·</span>
          <NuxtLink
            to="/politique-confidentialite"
            class="text-[11px] text-[var(--text-quaternary)] transition-colors hover:text-[var(--text-tertiary)]"
          >
            Confidentialité
          </NuxtLink>
          <span class="text-[var(--text-quaternary)]">·</span>
          <NuxtLink
            to="/cgu"
            class="text-[11px] text-[var(--text-quaternary)] transition-colors hover:text-[var(--text-tertiary)]"
          >
            CGU
          </NuxtLink>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: false });

const { login, loginWithMagicLink, loading, error: authError, clearError } = useAuth();

const email = ref('');
const password = ref('');
const rememberMe = ref(true);
const showPassword = ref(false);
const magicLinkSent = ref(false);
const magicLoading = ref(false);
const emailInput = ref<HTMLInputElement | null>(null);

const features = [
  { icon: 'i-lucide-clipboard-check', label: 'Interventions' },
  { icon: 'i-lucide-package', label: 'Production' },
  { icon: 'i-lucide-wallet', label: 'Comptabilité' },
  { icon: 'i-lucide-map-pin', label: 'Transhumance' },
  { icon: 'i-lucide-shield-check', label: 'Conformité' },
];

onMounted(() => emailInput.value?.focus());

async function handleLogin() {
  await login({ email: email.value, password: password.value, rememberMe: rememberMe.value });
}

async function handleMagicLink() {
  if (!email.value) {
    authError.value = 'Saisissez votre email pour recevoir un lien magique';
    return;
  }
  clearError();
  magicLoading.value = true;
  const sent = await loginWithMagicLink(email.value);
  magicLoading.value = false;
  if (sent) magicLinkSent.value = true;
}
</script>

<style scoped>
.input-field {
  height: 44px;
  width: 100%;
  border-radius: 10px;
  border: 1px solid var(--border-default);
  background: white;
  padding: 0 16px;
  font-size: 15px;
  color: var(--text-primary);
  outline: none;
  transition: border-color 150ms ease, box-shadow 150ms ease;
}

.input-field::placeholder {
  color: var(--text-quaternary);
}

.input-field:focus {
  border-color: var(--honey);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--honey) 15%, transparent);
}
</style>
