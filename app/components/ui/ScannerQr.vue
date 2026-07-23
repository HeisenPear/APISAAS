<!--
  ScannerQr — scanner QR plein écran, auto-détecté. On vise le QR collé sur la
  ruche (ou le pot) et la fiche s'ouvre TOUTE SEULE, sans bouton. Sécurité : on ne
  navigue que vers une route APIGO reconnue (cf. analyserQrApigo).
  ⚠️ Comportement caméra à valider sur appareil.
-->
<template>
  <Teleport to="body">
    <Transition name="scan-fade">
      <div v-if="open" class="fixed inset-0 z-[70] bg-black">
        <video ref="videoRef" class="h-full w-full object-cover" muted playsinline autoplay />

        <!-- Voile + cadre de visée -->
        <div class="pointer-events-none absolute inset-0">
          <div class="absolute inset-0" style="background: rgba(0, 0, 0, 0.35)" />
          <div class="absolute left-1/2 top-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2">
            <div
              class="h-full w-full rounded-[24px]"
              style="box-shadow: 0 0 0 100vmax rgba(0, 0, 0, 0.35); outline: 2px solid var(--honey)"
            />
          </div>
        </div>

        <!-- En-tête -->
        <div class="absolute inset-x-0 top-0 flex items-center justify-between p-4">
          <span class="text-[15px] font-semibold text-white">Scanner une ruche</span>
          <button
            type="button"
            class="flex h-9 w-9 items-center justify-center rounded-full text-white"
            style="background: rgba(255, 255, 255, 0.15)"
            aria-label="Fermer"
            @click="fermer"
          >
            <UIcon name="i-lucide-x" class="h-5 w-5" />
          </button>
        </div>

        <!-- Message bas -->
        <div class="absolute inset-x-0 bottom-0 p-6 text-center">
          <p v-if="erreur" class="text-[14px] font-medium text-white">{{ erreur }}</p>
          <p
            v-else-if="message"
            class="inline-block rounded-full px-4 py-2 text-[13.5px] font-medium text-white"
            style="background: rgba(0, 0, 0, 0.5)"
          >
            {{ message }}
          </p>
          <p v-else class="text-[13.5px]" style="color: rgba(255, 255, 255, 0.75)">
            Vise le QR code collé sur la ruche — ça s'ouvre tout seul
          </p>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { analyserQrApigo } from '~/utils/qrApigo';

const open = defineModel<boolean>('open', { default: false });

const videoRef = ref<HTMLVideoElement | null>(null);
const { erreur, demarrer, arreter } = useScannerQr();
const message = ref('');
let timer: ReturnType<typeof setTimeout> | null = null;

function onDetecte(texte: string): void {
  const cible = analyserQrApigo(texte);
  if (cible) {
    arreter();
    open.value = false;
    void navigateTo(cible.path);
  } else {
    // QR lisible mais pas de l'app → on prévient sans fermer (l'apiculteur réessaie).
    message.value = 'QR non reconnu — vise un QR APIGO.';
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => (message.value = ''), 2200);
  }
}

watch(open, async (v) => {
  if (v) {
    message.value = '';
    await nextTick();
    if (videoRef.value) await demarrer(videoRef.value, onDetecte);
  } else {
    arreter();
  }
});

function fermer(): void {
  open.value = false;
}

onBeforeUnmount(() => {
  if (timer) clearTimeout(timer);
  arreter();
});
</script>

<style scoped>
.scan-fade-enter-active,
.scan-fade-leave-active {
  transition: opacity 0.2s ease;
}
.scan-fade-enter-from,
.scan-fade-leave-to {
  opacity: 0;
}
</style>
