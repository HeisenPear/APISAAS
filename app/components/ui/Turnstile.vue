<script setup lang="ts">
/**
 * Widget Cloudflare Turnstile — CAPTCHA « managed » (souvent invisible) pour
 * protéger l'auth Supabase du brute-force / bot.
 *
 * ENV-GATED : ne rend RIEN et ne charge AUCUN script tant que
 * `NUXT_PUBLIC_TURNSTILE_SITE_KEY` n'est pas défini → zéro impact tant que le
 * CAPTCHA n'est pas activé (dashboard Supabase). Fail-open côté widget : si le
 * script Cloudflare ne charge pas, on n'empêche pas l'usage — Supabase reste
 * l'autorité (un appel auth sans token échouera proprement si le CAPTCHA est requis).
 */
const { token } = useCaptcha();
const siteKey = (useRuntimeConfig().public.turnstileSiteKey as string) || '';
const el = ref<HTMLElement | null>(null);
let widgetId: string | undefined;

interface TurnstileApi {
  render: (
    el: HTMLElement,
    opts: {
      sitekey: string;
      callback: (t: string) => void;
      'expired-callback'?: () => void;
      'error-callback'?: () => void;
    },
  ) => string;
  remove: (id: string) => void;
}
function api(): TurnstileApi | undefined {
  return (window as unknown as { turnstile?: TurnstileApi }).turnstile;
}

function loadScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (api()) return resolve();
    const existing = document.querySelector<HTMLScriptElement>('script[data-turnstile]');
    if (existing) {
      existing.addEventListener('load', () => resolve());
      existing.addEventListener('error', () => reject(new Error('turnstile')));
      return;
    }
    const s = document.createElement('script');
    s.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
    s.async = true;
    s.defer = true;
    s.setAttribute('data-turnstile', '');
    s.onload = () => resolve();
    s.onerror = () => reject(new Error('turnstile'));
    document.head.appendChild(s);
  });
}

onMounted(async () => {
  if (!siteKey || !el.value) return;
  try {
    await loadScript();
    const t = api();
    if (!t || !el.value) return;
    widgetId = t.render(el.value, {
      sitekey: siteKey,
      callback: (tok) => (token.value = tok),
      'expired-callback': () => (token.value = null),
      'error-callback': () => (token.value = null),
    });
  } catch {
    // Chargement du CAPTCHA impossible — fail-open (voir en-tête).
  }
});

onBeforeUnmount(() => {
  const t = api();
  if (t && widgetId) t.remove(widgetId);
  token.value = null;
});
</script>

<template>
  <div v-if="siteKey" ref="el" class="flex justify-center" />
</template>
