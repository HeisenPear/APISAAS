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

const message = ref('Verification en cours...');

// Traiter les paramètres d'URL pour la confirmation d'email
onMounted(async () => {
  const { access_token, refresh_token, error } = route.query;

  // Si il y a une erreur dans les paramètres
  if (error) {
    message.value = 'Erreur de confirmation. Le lien est peut-être expiré.';
    setTimeout(() => router.push('/register'), 3000);
    return;
  }

  // Si on a des tokens d'auth, les traiter
  if (access_token && refresh_token) {
    try {
      const { error: sessionError } = await supabase.auth.setSession({
        access_token: access_token as string,
        refresh_token: refresh_token as string,
      });

      if (sessionError) {
        message.value = 'Erreur lors de la confirmation. Veuillez réessayer.';
        setTimeout(() => router.push('/register'), 3000);
        return;
      }
    } catch (err) {
      message.value = 'Erreur lors de la confirmation. Veuillez réessayer.';
      setTimeout(() => router.push('/register'), 3000);
      return;
    }
  }

  // Timeout au cas où la confirmation prend trop de temps
  setTimeout(() => {
    if (!user.value) {
      message.value = 'Confirmation expirée. Veuillez vous reconnecter.';
      setTimeout(() => router.push('/login'), 2000);
    }
  }, 10000);
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
      } catch (err) {
        message.value = 'Erreur lors du chargement du profil.';
        setTimeout(() => router.push('/login'), 2000);
      }
    }
  },
  { immediate: true },
);
</script>
