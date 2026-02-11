export default defineNuxtRouteMiddleware(async (to) => {
  const user = useSupabaseUser();

  // Skip for public pages and onboarding itself
  const publicPaths = ['/', '/login', '/register', '/reset-password', '/confirm', '/onboarding'];
  if (publicPaths.includes(to.path)) return;

  // Skip if not authenticated
  if (!user.value) return;

  // Fetch profil if needed
  const authStore = useAuthStore();
  if (!authStore.profil) {
    try {
      await authStore.fetchProfil();
    } catch {
      return;
    }
  }

  // If profil could not be loaded, redirect to login (not onboarding)
  if (!authStore.profil) {
    return navigateTo('/login');
  }

  // Redirect to onboarding if not complete
  if (!authStore.isOnboarded) {
    return navigateTo('/onboarding');
  }
});
