export default defineNuxtRouteMiddleware(async () => {
  const headers = useRequestHeaders(['cookie']);
  try {
    await appelApi('/api/admin/check', { headers });
  } catch {
    return navigateTo('/dashboard');
  }
});
