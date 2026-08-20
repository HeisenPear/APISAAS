import { progressionScene, etapeActive, progressionEtape } from '~/utils/sceneDefilement';

/**
 * Branche une scène épinglée sur le défilement.
 *
 * Le conteneur est très haut, son enfant est `position: sticky` : l'enfant se
 * fige, le défilement court derrière lui, et ce composable dit où l'on en est.
 * Toute l'arithmétique vit dans `~/utils/sceneDefilement`, testée à part ; ici
 * il n'y a que la plomberie navigateur.
 *
 *   const scene = ref<HTMLElement>();
 *   const { etape, progression } = useSceneEpinglee(scene, 4);
 *
 * Trois précautions, toutes payées d'expérience dans ce dépôt :
 *
 *  · rAF EN GARDE-BARRIÈRE. Une molette déclenche des dizaines d'événements
 *    entre deux images ; sans garde, on calcule autant de fois pour rien.
 *
 *  · MOUVEMENT RÉDUIT RESPECTÉ. On n'abandonne pas pour autant le contenu : on
 *    laisse la scène sur sa PREMIÈRE étape, lisible, plutôt que sur du vide.
 *
 *  · RIEN AU RENDU SERVEUR. Pas de `window` hors du montage : la page doit se
 *    rendre côté serveur, et une lecture trop tôt la met en 500.
 */
export function useSceneEpinglee(cible: Ref<HTMLElement | undefined>, nombreEtapes: number) {
  const progression = ref(0);
  const etape = ref(0);
  const dansEtape = ref(0);
  const fige = ref(false);

  let imagePrevue = false;

  function mesurer(): void {
    imagePrevue = false;
    const el = cible.value;
    if (!el) return;
    const boite = el.getBoundingClientRect();
    const p = progressionScene(boite.top, boite.height, window.innerHeight);
    progression.value = p;
    etape.value = etapeActive(p, nombreEtapes);
    dansEtape.value = progressionEtape(p, nombreEtapes);
    // « Épinglé » au sens visuel : l'enfant collant est effectivement collé.
    fige.value = boite.top <= 0 && boite.bottom >= window.innerHeight;
  }

  function auDefilement(): void {
    if (imagePrevue) return;
    imagePrevue = true;
    requestAnimationFrame(mesurer);
  }

  onMounted(() => {
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    window.addEventListener('scroll', auDefilement, { passive: true });
    window.addEventListener('resize', auDefilement);
    mesurer();
  });

  onBeforeUnmount(() => {
    window.removeEventListener('scroll', auDefilement);
    window.removeEventListener('resize', auDefilement);
  });

  return { progression, etape, dansEtape, fige };
}
