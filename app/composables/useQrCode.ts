import QRCode from 'qrcode';
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
