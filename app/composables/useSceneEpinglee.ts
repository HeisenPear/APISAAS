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
export function useSceneEpinglee(
  cible: Ref<HTMLElement | undefined>,
  nombreEtapes: number,
  /**
   * Largeur en dessous de laquelle la scène REDEVIENT UN EMPILEMENT (le
   * composant le décide en CSS ; il doit dire ici la même valeur). `0` = jamais.
   */
  seuilEmpilement = 0,
) {
  const progression = ref(0);
  const etape = ref(0);
  const dansEtape = ref(0);
  const fige = ref(false);
  /**
   * ⚠️ LA SCÈNE EST-ELLE VRAIMENT UNE SCÈNE, OU UN SIMPLE EMPILEMENT ?
   *
   * Cette question n'était pas posée, et il en découlait un défaut
   * d'accessibilité que rien ne pouvait voir. Un composant de scène marque ses
   * temps inactifs `aria-hidden` — c'est juste QUAND UN SEUL EST VISIBLE. Or il
   * y a deux modes où ils le sont TOUS :
   *
   *   · « réduire les animations » : on ne branche aucun écouteur, `etape` reste
   *     à 0 et le CSS remet les temps à la suite ;
   *   · sous le seuil d'empilement : le CSS les remet à la suite aussi, mais le
   *     JavaScript, lui, continue de tourner et `etape` change au défilement.
   *
   * Dans ces deux modes, `aria-hidden="i !== etape"` masque à un lecteur
   * d'écran trois contenus sur quatre PARFAITEMENT VISIBLES à l'œil. Un
   * apiculteur qui lit la page à la voix n'en entend qu'un quart, sans que rien
   * ne le signale — ni erreur, ni avertissement, ni test.
   *
   * `empile` vaut donc `true` par défaut, y compris au rendu serveur : le HTML
   * envoyé n'a aucun `aria-hidden`, ce qui est l'état SÛR — tout est lisible.
   * Il ne passe à `false` qu'une fois qu'on a vérifié, dans le navigateur, que
   * la scène s'épingle réellement.
   */
  const empile = ref(true);

  function reglerMode(): void {
    const mouvementReduit = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
    empile.value = mouvementReduit || window.innerWidth < seuilEmpilement;
  }

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

  /** Le mode dépend de la largeur : il se recalcule au redimensionnement. */
  function auRedimensionnement(): void {
    reglerMode();
    auDefilement();
  }

  onMounted(() => {
    // Le mode se règle DANS TOUS LES CAS, y compris sous mouvement réduit : la
    // sortie anticipée ci-dessous ne doit pas laisser `empile` à sa valeur de
    // rendu serveur par hasard, mais parce qu'on a mesuré.
    reglerMode();
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    window.addEventListener('scroll', auDefilement, { passive: true });
    window.addEventListener('resize', auRedimensionnement);
    mesurer();
  });

  onBeforeUnmount(() => {
    window.removeEventListener('scroll', auDefilement);
    window.removeEventListener('resize', auRedimensionnement);
  });

  return { progression, etape, dansEtape, fige, empile };
}
