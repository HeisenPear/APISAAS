// ═══════════════════════════════════════════════════════════════════════════
// SCANNER QR auto-détecté — flux caméra + détection en continu.
//
// Détecteur NATIF `BarcodeDetector` quand il existe (Android/Chrome : rapide),
// sinon repli sur `jsQR` (décodage des frames sur canvas) — indispensable pour
// iOS/Safari qui n'a pas BarcodeDetector. Aucun réseau, tout local.
//
// ⚠️ Comportement caméra à valider sur appareil (hors portée des tests auto).
// ═══════════════════════════════════════════════════════════════════════════

// BarcodeDetector n'est pas typé par la lib DOM : minimum requis (zéro `any`).
interface CodeDetecte {
  readonly rawValue: string;
}
interface DetecteurCodeBarre {
  detect(source: CanvasImageSource): Promise<CodeDetecte[]>;
}
type ConstructeurDetecteur = new (options: { formats: string[] }) => DetecteurCodeBarre;

function constructeurDetecteur(): ConstructeurDetecteur | null {
  if (!import.meta.client) return null;
  return (window as unknown as { BarcodeDetector?: ConstructeurDetecteur }).BarcodeDetector ?? null;
}

export function useScannerQr() {
  const actif = ref(false);
  const erreur = ref<string | null>(null);

  let stream: MediaStream | null = null;
  let raf = 0;
  let detecteur: DetecteurCodeBarre | null = null;
  const canvas = import.meta.client ? document.createElement('canvas') : null;
  let dernier = '';

  /** Démarre la caméra et scanne en continu. `onDetecte` reçoit le texte du QR. */
  async function demarrer(
    video: HTMLVideoElement,
    onDetecte: (texte: string) => void,
  ): Promise<void> {
    erreur.value = null;
    dernier = '';
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' } },
        audio: false,
      });
      video.srcObject = stream;
      video.setAttribute('playsinline', 'true'); // iOS : ne pas passer en plein écran natif
      await video.play();
      actif.value = true;
    } catch {
      erreur.value = 'Caméra indisponible ou accès refusé. Autorise la caméra pour scanner.';
      return;
    }

    const Ctor = constructeurDetecteur();
    if (Ctor) {
      try {
        detecteur = new Ctor({ formats: ['qr_code'] });
      } catch {
        detecteur = null;
      }
    }

    const ctx = canvas?.getContext('2d', { willReadFrequently: true }) ?? null;
    const boucle = async (): Promise<void> => {
      if (!actif.value) return;
      if (video.readyState >= video.HAVE_CURRENT_DATA && video.videoWidth > 0) {
        try {
          let val: string | null = null;
          if (detecteur) {
            const codes = await detecteur.detect(video);
            val = codes[0]?.rawValue ?? null;
          } else if (canvas && ctx) {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            const image = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const { default: jsQR } = await import('jsqr');
            val =
              jsQR(image.data, image.width, image.height, { inversionAttempts: 'dontInvert' })
                ?.data ?? null;
          }
          // Anti-rebond : on ne renvoie pas 30×/s le même code.
          if (val && val !== dernier) {
            dernier = val;
            onDetecte(val);
          }
        } catch {
          /* frame illisible — on réessaie à la suivante */
        }
      }
      raf = requestAnimationFrame(boucle);
    };
    raf = requestAnimationFrame(boucle);
  }

  function arreter(): void {
    actif.value = false;
    if (raf) cancelAnimationFrame(raf);
    stream?.getTracks().forEach((t) => t.stop());
    stream = null;
  }

  onScopeDispose(arreter);

  return { actif, erreur, demarrer, arreter };
}
