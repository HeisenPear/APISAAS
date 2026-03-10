/**
 * Accès à la caméra native via Capacitor.
 * Fallback sur <input type="file"> pour le web.
 */
export function useNativeCamera() {
  const { isNative } = usePlatform();

  async function takePhoto(): Promise<string | null> {
    if (!isNative.value) {
      // Web fallback — retourne une promesse résolue par <input type="file">
      return new Promise((resolve) => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.capture = 'environment';
        input.onchange = () => {
          const file = input.files?.[0];
          if (!file) return resolve(null);
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(file);
        };
        input.click();
      });
    }

    try {
      const { Camera, CameraResultType, CameraSource } = await import('@capacitor/camera');
      const photo = await Camera.getPhoto({
        quality: 80,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Camera,
      });
      return photo.dataUrl ?? null;
    } catch {
      return null;
    }
  }

  async function pickFromGallery(): Promise<string | null> {
    if (!isNative.value) {
      return new Promise((resolve) => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = () => {
          const file = input.files?.[0];
          if (!file) return resolve(null);
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(file);
        };
        input.click();
      });
    }

    try {
      const { Camera, CameraResultType, CameraSource } = await import('@capacitor/camera');
      const photo = await Camera.getPhoto({
        quality: 80,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Photos,
      });
      return photo.dataUrl ?? null;
    } catch {
      return null;
    }
  }

  return { takePhoto, pickFromGallery };
}
