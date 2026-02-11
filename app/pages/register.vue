<template>
  <div>
    <h2 class="text-xl font-semibold text-stone-900">Creer un compte</h2>
    <p class="mt-1 text-sm text-stone-500">Rejoignez Apiculture 360°</p>

    <div
      v-if="authError"
      class="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
    >
      {{ authError }}
    </div>

    <form class="mt-6 space-y-4" @submit.prevent="handleRegister">
      <div class="grid grid-cols-2 gap-3">
        <UFormField label="Prenom" name="prenom">
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

      <UFormField label="Mot de passe" name="password">
        <UInput
          v-model="password"
          type="password"
          placeholder="Minimum 8 caracteres"
          required
          class="w-full"
        />
      </UFormField>

      <!-- Password strength -->
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

      <UButton
        type="submit"
        label="Creer mon compte"
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
      Deja un compte ?
      <NuxtLink to="/login" class="font-medium text-amber-600 hover:text-amber-700">
        Se connecter
      </NuxtLink>
    </p>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'auth' });

const { register, loading, error: authError } = useAuth();

const nom = ref('');
const prenom = ref('');
const email = ref('');
const password = ref('');
const confirmPassword = ref('');

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
  if (passwordStrength.value === 3) return 'bg-emerald-400';
  return 'bg-emerald-500';
});

const isValid = computed(() => {
  return (
    nom.value.trim() &&
    prenom.value.trim() &&
    email.value.trim() &&
    password.value.length >= 8 &&
    password.value === confirmPassword.value
  );
});

async function handleRegister() {
  if (password.value !== confirmPassword.value) {
    authError.value = 'Les mots de passe ne correspondent pas';
    return;
  }
  await register({
    email: email.value,
    password: password.value,
    nom: nom.value,
    prenom: prenom.value,
  });
}
</script>
