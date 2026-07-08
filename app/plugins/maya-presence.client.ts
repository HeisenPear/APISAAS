// Hydrate le mode de présence de Maya depuis localStorage au plus tôt (client),
// pour que les surfaces proactives (MayaCard, launcher) se gatent sans flash.
export default defineNuxtPlugin(() => {
  useMayaStore().hydrate();
});
