<template>
  <div class="flex flex-col items-center py-8 text-center">
    <div
      class="mb-4 h-8 w-8 animate-spin rounded-full border-2 border-amber-500 border-t-transparent"
    />
    <p class="text-sm text-stone-500">{{ message }}</p>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'auth' });

const user = useSupabaseUser();
const authStore = useAuthStore();
const router = useRouter();
const route = useRoute();
const supabase = useSupabaseClient();

const message = ref('Vérification en cours...');

onMounted(async () => {
  const { access_token, refresh_token, code, error } = route.query;

  if (error) {
    message.value = 'Erreur de confirmation. Le lien est peut-être expiré.';
    setTimeout(() => router.push('/register'), 3000);
    return;
  }

  // PKCE flow (Supabase JS v2 par défaut) — code en query param
  if (code) {
    try {
      const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code as string);
      if (exchangeError) {
        message.value = 'Lien de confirmation invalide ou expiré. Veuillez réessayer.';
        setTimeout(() => router.push('/register'), 3000);
      }
    } catch {
      message.value = 'Erreur lors de la confirmation. Veuillez réessayer.';
      setTimeout(() => router.push('/register'), 3000);
    }
    return;
  }

  // Implicit flow (ancien) — tokens en query params
  if (access_token && refresh_token) {
    try {
      const { error: sessionError } = await supabase.auth.setSession({
        access_token: access_token as string,
        refresh_token: refresh_token as string,
      });
      if (sessionError) {
        message.value = 'Erreur lors de la confirmation. Veuillez réessayer.';
        setTimeout(() => router.push('/register'), 3000);
      }
    } catch {
      message.value = 'Erreur lors de la confirmation. Veuillez réessayer.';
      setTimeout(() => router.push('/register'), 3000);
    }
    return;
  }

  // Aucun token — le module @nuxtjs/supabase gère peut-être le hash fragment
  // Attendre que la session soit établie (max 15s)
  setTimeout(() => {
    if (!user.value) {
      message.value = 'Confirmation expirée. Veuillez vous reconnecter.';
      setTimeout(() => router.push('/login'), 2000);
    }
  }, 15000);
});

watch(
  user,
  async (u) => {
    if (u) {
      message.value = 'Confirmation réussie ! Redirection...';
      try {
        await authStore.fetchProfil();
        if (authStore.isOnboarded) {
          await router.push('/dashboard');
        } else {
          await router.push('/onboarding');
        }
      } catch {
        message.value = 'Erreur lors du chargement du profil.';
        setTimeout(() => router.push('/login'), 2000);
      }
    }
  },
  { immediate: true },
);
</script>
