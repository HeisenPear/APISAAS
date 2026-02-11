export default defineNuxtRouteMiddleware(async (to) => {
  const user = useSupabaseUser();

  // Skip for public pages
  const publicPaths = ['/', '/login', '/register', '/reset-password', '/confirm'];
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

  // Redirect to onboarding if not complete
  if (!authStore.isOnboarded && to.path !== '/onboarding') {
    return navigateTo('/onboarding');
  }
});
