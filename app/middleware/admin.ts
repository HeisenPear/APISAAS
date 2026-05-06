export default defineNuxtRouteMiddleware(async () => {
  const headers = useRequestHeaders(['cookie']);
  try {
    await $fetch('/api/admin/check', { headers });
  } catch {
    return navigateTo('/dashboard');
  }
});
