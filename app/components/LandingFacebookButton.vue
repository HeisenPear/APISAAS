<template>
  <a
    v-if="!bandeauAffiche"
    :href="facebookLink"
    target="_blank"
    rel="noopener noreferrer"
    aria-label="Conseil & aide — page Facebook APIGO"
    class="fixed bottom-6 right-6 z-40 inline-flex items-center gap-2 rounded-full bg-[#1877F2] px-4 py-3 text-white shadow-lg transition-all duration-200 hover:shadow-xl hover:-translate-y-0.5 md:px-6 md:py-4"
  >
    <!-- Icône Facebook -->
    <UIcon name="i-lucide-facebook" class="h-5 w-5 md:h-6 md:w-6" />
    <!-- Texte (masqué sur mobile) -->
    <span class="hidden text-sm font-semibold md:inline"> Conseil & aide </span>
  </a>
</template>

<script setup lang="ts">
/**
 * ⚠️ DEUX SURCOUCHES FIXES SE DISPUTAIENT LE MÊME COIN, ET CELLE-CI PERDAIT.
 *
 * Le bandeau de consentement est en `fixed bottom-4 left-4 right-4 z-[9999]`,
 * monté sur TOUTES les pages tant que le visiteur n'a pas répondu. Ce bouton
 * est en `bottom-6 right-6 z-40` : il vit donc ENTIÈREMENT à l'intérieur du
 * rectangle du bandeau, et 40 ne pèse rien contre 9999.
 *
 * Conséquence démontrable par le seul CSS : tant que le bandeau est affiché,
 * ce bouton est INCLIQUABLE. Sur mobile c'est pire — le bandeau y passe en
 * pleine largeur (`left-4 right-4`), donc toute la bande basse de l'écran est
 * morte pour la page en dessous. C'est exactement ce qu'on décrit comme « un
 * bug de clic ».
 *
 * Aucune porte ne pouvait le voir : `scripts/audit-mise-en-page.mjs` écarte
 * délibérément les descendants d'ancêtres `fixed` ou `sticky` — son commentaire
 * nomme littéralement « bandeau de consentement, en-tête collant, bouton
 * flottant » — parce que les signaler noierait les vrais défauts.
 *
 * On ne cherche pas à passer AU-DESSUS du bandeau : un consentement doit rester
 * au premier plan. On s'efface le temps qu'il soit répondu.
 */
const facebookLink = 'https://www.facebook.com/profile.php?id=61590641625616';

const { hasAnswered } = useAnalyticsConsent();
const route = useRoute();
/** Le bandeau ne s'affiche pas sur l'onboarding : le bouton n'a rien à y céder. */
const bandeauAffiche = computed(() => !hasAnswered.value && route.path !== '/onboarding');
</script>
