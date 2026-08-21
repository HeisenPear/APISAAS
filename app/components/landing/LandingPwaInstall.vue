<script setup lang="ts">
interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const deferredPrompt = ref<BeforeInstallPromptEvent | null>(null);
const isIOS = ref(false);
const isStandalone = ref(false);
const installed = ref(false);

function onBeforeInstallPrompt(e: Event) {
  e.preventDefault();
  deferredPrompt.value = e as BeforeInstallPromptEvent;
}

onMounted(() => {
  const ua = navigator.userAgent || '';
  isIOS.value = /iphone|ipad|ipod/i.test(ua);
  isStandalone.value =
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
  window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt);
  window.addEventListener('appinstalled', () => {
    installed.value = true;
  });
});

onUnmounted(() => window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt));

const canPrompt = computed(() => !!deferredPrompt.value);

async function install() {
  if (!deferredPrompt.value) return;
  await deferredPrompt.value.prompt();
  const choice = await deferredPrompt.value.userChoice;
  if (choice.outcome === 'accepted') installed.value = true;
  deferredPrompt.value = null;
}
</script>

<template>
  <section
    v-if="!isStandalone"
    class="py-16 sm:py-24 md:py-28"
    style="background: var(--surface-primary)"
  >
    <div class="mx-auto max-w-5xl px-4 sm:px-6">
      <div
        class="grid items-center gap-10 overflow-hidden rounded-[24px] border p-7 sm:p-10 lg:grid-cols-2"
        style="border-color: var(--border-default); background: white"
      >
        <!-- Pitch -->
        <div>
          <p
            class="mb-3 text-[11px] font-semibold uppercase tracking-[0.12em]"
            style="color: var(--honey-deep)"
          >
            Application mobile
          </p>
          <h2
            class="text-[28px] font-bold leading-tight tracking-[-0.025em] sm:text-[34px]"
            style="color: var(--text-primary)"
          >
            APIGO dans votre poche,<br class="hidden sm:block" />
            même au rucher
          </h2>
          <p class="mt-4 text-[15px] leading-relaxed" style="color: var(--text-secondary)">
            Installez l'app sur votre téléphone : accès en un tap depuis l'écran d'accueil, et elle
            fonctionne <strong>hors connexion</strong> sur le terrain. Aucun store, rien à
            télécharger — directement depuis votre navigateur.
          </p>
          <ul class="mt-5 space-y-2.5">
            <li
              v-for="f in [
                { icon: 'i-lucide-wifi-off', text: 'Fonctionne hors-ligne, en pleine nature' },
                { icon: 'i-lucide-smartphone', text: 'Accès en 1 tap, comme une vraie app' },
                { icon: 'i-lucide-bell', text: 'Notifications pour vos alertes et rappels' },
              ]"
              :key="f.text"
              class="flex items-center gap-2.5 text-[14px]"
              style="color: var(--text-secondary)"
            >
              <span
                class="flex h-7 w-7 shrink-0 items-center justify-center rounded-full"
                style="background: var(--honey-soft)"
              >
                <UIcon :name="f.icon" class="h-4 w-4" style="color: var(--honey-deep)" />
              </span>
              {{ f.text }}
            </li>
          </ul>
        </div>

        <!-- Carte d'installation -->
        <div
          class="rounded-[18px] p-6 sm:p-7"
          style="background: var(--surface-primary); border: 1px solid var(--border-default)"
        >
          <div class="mb-4 flex items-center gap-3">
            <img src="/logo_apigo.webp" alt="APIGO" class="h-10 w-auto object-contain" />
            <div>
              <p class="text-[15px] font-semibold" style="color: var(--text-primary)">APIGO</p>
              <p class="text-[12px]" style="color: var(--text-tertiary)">
                Gestion apicole · apigo.fr
              </p>
            </div>
          </div>

          <!-- Déjà installée -->
          <div
            v-if="installed"
            class="flex items-center gap-2 rounded-[12px] px-4 py-3 text-[14px] font-medium"
            style="background: var(--sage-soft); color: var(--sage-deep)"
          >
            <UIcon name="i-lucide-check-circle" class="h-5 w-5" />
            Application installée — retrouvez-la sur votre écran d'accueil&nbsp;!
          </div>

          <!-- Android / desktop : prompt natif -->
          <div v-else-if="canPrompt">
            <button
              type="button"
              class="flex w-full items-center justify-center gap-2 rounded-[12px] py-3.5 text-[15px] font-semibold text-[var(--text-primary)] transition-all hover:-translate-y-0.5"
              style="
                background: var(--honey);
                box-shadow: 0 4px 16px color-mix(in srgb, var(--honey) 30%, transparent);
              "
              @click="install"
            >
              <UIcon name="i-lucide-download" class="h-5 w-5" />
              Installer l'application
            </button>
            <p class="mt-3 text-center text-[12.5px]" style="color: var(--text-tertiary)">
              Gratuit · installation en 2 secondes
            </p>
          </div>

          <!-- iOS Safari : instructions manuelles -->
          <div v-else-if="isIOS" class="space-y-3">
            <p class="text-[13px] font-medium" style="color: var(--text-secondary)">
              Sur iPhone / iPad, depuis <strong>Safari</strong> :
            </p>
            <ol class="space-y-2.5">
              <li
                v-for="(step, i) in [
                  'Touchez l’icône Partager en bas de l’écran',
                  'Faites défiler puis « Sur l’écran d’accueil »',
                  'Validez avec « Ajouter » — c’est fait !',
                ]"
                :key="i"
                class="flex items-start gap-3 text-[13.5px]"
                style="color: var(--text-secondary)"
              >
                <span
                  class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[12px] font-bold"
                  style="background: var(--honey-soft); color: var(--honey-deep)"
                  >{{ i + 1 }}</span
                >
                <span>
                  {{ step }}
                  <UIcon
                    v-if="i === 0"
                    name="i-lucide-share"
                    class="ml-1 inline h-4 w-4 align-text-bottom"
                    style="color: var(--honey-deep)"
                  />
                </span>
              </li>
            </ol>
          </div>

          <!-- Autres navigateurs : fallback générique -->
          <div v-else class="space-y-3 text-[13.5px]" style="color: var(--text-secondary)">
            <div class="flex items-start gap-2.5">
              <UIcon
                name="i-lucide-smartphone"
                class="mt-0.5 h-4 w-4 shrink-0 text-[var(--honey-deep)]"
              />
              <span><strong>Android (Chrome)</strong> : menu ⋮ → « Installer l'application ».</span>
            </div>
            <div class="flex items-start gap-2.5">
              <UIcon
                name="i-lucide-share"
                class="mt-0.5 h-4 w-4 shrink-0 text-[var(--honey-deep)]"
              />
              <span><strong>iPhone (Safari)</strong> : Partager → « Sur l'écran d'accueil ».</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
