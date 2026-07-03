<template>
  <div>
    <h2 class="text-xl font-semibold text-stone-900">Mot de passe oublie</h2>
    <p class="mt-1 text-sm text-stone-500">
      Entrez votre email pour recevoir un lien de reinitialisation
    </p>

    <div
      v-if="authError"
      class="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
    >
      {{ authError }}
    </div>

    <div
      v-if="sent"
      class="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700"
    >
      <UIcon name="i-lucide-mail-check" class="mr-1 inline h-4 w-4" />
      Un email de reinitialisation vous a ete envoye. Verifiez votre boite mail.
    </div>

    <form v-if="!sent" class="mt-6 space-y-4" method="post" @submit.prevent="handleReset">
      <UFormField label="Email" name="email">
        <UInput
          v-model="email"
          type="email"
          placeholder="vous@exemple.fr"
          required
          class="w-full"
        />
      </UFormField>

      <UiTurnstile />

      <UButton
        type="submit"
        label="Envoyer le lien"
        icon="i-lucide-send"
        color="primary"
        block
        size="lg"
        :loading="loading"
        class="min-h-[44px]"
      />
    </form>

    <p class="mt-6 text-center text-sm text-stone-500">
      <NuxtLink to="/login" class="font-medium text-amber-600 hover:text-amber-700">
        Retour a la connexion
      </NuxtLink>
    </p>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'auth' });

const { resetPassword, loading, error: authError } = useAuth();

const email = ref('');
const sent = ref(false);

async function handleReset() {
  const success = await resetPassword(email.value);
  if (success) sent.value = true;
}
</script>
