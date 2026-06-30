import { type MaybeRef, ref, toValue, watch } from 'vue';

export function useQrCode(url: MaybeRef<string>) {
  const qrDataUrl = ref<string | null>(null);
  const generating = ref(false);

  async function generate() {
    const value = toValue(url);
    if (!value) {
      qrDataUrl.value = null;
      return;
    }
    generating.value = true;
    try {
      // Import dynamique : qrcode (~30 Ko) n'est chargé qu'au moment de générer un QR,
      // pas dans le bundle des routes qui n'en affichent pas.
      const { default: QRCode } = await import('qrcode');
      qrDataUrl.value = await QRCode.toDataURL(value, {
        width: 200,
        margin: 1,
        color: { dark: '#1C1C1E', light: '#FFFFFF' },
      });
    } catch {
      qrDataUrl.value = null;
    } finally {
      generating.value = false;
    }
  }

  watch(() => toValue(url), generate, { immediate: true });

  return { qrDataUrl, generating };
}
