<template>
  <div>
    <h2 class="text-xl font-semibold text-stone-900">Se connecter</h2>
    <p class="mt-1 text-sm text-stone-500">Accedez a votre espace apicole</p>

    <!-- Error alert -->
    <div
      v-if="authError"
      class="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
    >
      {{ authError }}
    </div>

    <form class="mt-6 space-y-4" @submit.prevent="handleLogin">
      <UFormField label="Email" name="email">
        <UInput
          v-model="email"
          type="email"
          placeholder="vous@exemple.fr"
          required
          class="w-full"
        />
      </UFormField>

      <UFormField label="Mot de passe" name="password">
        <UInput
          v-model="password"
          type="password"
          placeholder="Votre mot de passe"
          required
          class="w-full"
        />
      </UFormField>

      <!-- Remember me + Forgot password -->
      <div class="flex items-center justify-between">
        <label class="flex cursor-pointer items-center gap-2">
          <input
            v-model="rememberMe"
            type="checkbox"
            class="h-4 w-4 rounded border-stone-300 accent-amber-500"
          />
          <span class="text-sm text-stone-600">Se souvenir de moi</span>
        </label>
        <NuxtLink
          to="/reset-password"
          class="text-sm font-medium text-amber-600 hover:text-amber-700"
        >
          Mot de passe oublie ?
        </NuxtLink>
      </div>

      <UButton
        type="submit"
        label="Se connecter"
        icon="i-lucide-log-in"
        color="primary"
        block
        size="lg"
        :loading="loading"
        class="min-h-[44px]"
      />
    </form>

    <div class="my-6 flex items-center gap-3">
      <div class="h-px flex-1 bg-stone-200" />
      <span class="text-xs text-stone-400">ou</span>
      <div class="h-px flex-1 bg-stone-200" />
    </div>

    <!-- Magic link -->
    <div v-if="!magicLinkSent" class="space-y-3">
      <UButton
        label="Connexion par lien magique"
        icon="i-lucide-wand-2"
        variant="outline"
        color="neutral"
        block
        :loading="magicLoading"
        class="min-h-[44px]"
        @click="handleMagicLink"
      />
    </div>
    <div v-else class="rounded-xl bg-emerald-50 px-4 py-3 text-center text-sm text-emerald-700">
      <UIcon name="i-lucide-mail-check" class="mb-1 inline h-5 w-5" />
      <p>Lien envoye ! Verifiez votre boite email.</p>
    </div>

    <p class="mt-6 text-center text-sm text-stone-500">
      Pas encore de compte ?
      <NuxtLink to="/register" class="font-medium text-amber-600 hover:text-amber-700">
        S'inscrire
      </NuxtLink>
    </p>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'auth' });

const { login, loginWithMagicLink, loading, error: authError, clearError } = useAuth();

const email = ref('');
const password = ref('');
const rememberMe = ref(true);
const magicLinkSent = ref(false);
const magicLoading = ref(false);

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
