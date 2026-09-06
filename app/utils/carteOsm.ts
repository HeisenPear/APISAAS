/**
 * Fond de carte OpenStreetMap — réglages partagés par les quatre cartes.
 *
 * Ils étaient recopiés dans chaque composant, et avaient divergé : trois cartes
 * sur quatre coupaient l'attribution, une seule la gardait.
 */

/**
 * Un seul hôte, pas `{s}`.
 *
 * Le motif `{s}.tile.openstreetmap.org` répartissait les tuiles sur `a.`, `b.`
 * et `c.` — une ruse d'époque HTTP/1.1, où le navigateur plafonnait à six
 * connexions par hôte. En HTTP/2 elle se retourne contre nous : trois origines,
 * donc trois poignées de main TLS et trois pools au lieu d'un flux multiplexé.
 * La politique d'usage d'OSM déconseille désormais ce motif.
 */
export const TUILES_OSM = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';

/**
 * L'attribution n'est pas décorative : les données OSM sont sous ODbL, qui
 * l'exige. `CarteFloraisons`, `CarteFrelon` et `RucherMap` créaient leur carte
 * avec `attributionControl: false` et ne passaient aucune `attribution` — le
 * crédit disparaissait donc deux fois. Seule `CarteTranshumance` le portait.
 */
export const ATTRIBUTION_OSM =
  '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>';

export const OPTIONS_TUILES_OSM = {
  maxZoom: 19,
  attribution: ATTRIBUTION_OSM,
  /**
   * Deux rangées de tuiles gardées hors écran. Au zoom, Leaflet purge l'ancien
   * niveau avant que le nouveau soit arrivé : c'est ce trou qui se voit en gris.
   * Un tampon plus large laisse l'ancienne rangée à l'écran le temps que la
   * suivante charge.
   */
  keepBuffer: 4,
} as const;

/** Ce dont on a besoin d'une carte Leaflet, sans importer le type complet. */
interface CarteRedimensionnable {
  invalidateSize: (options?: { animate?: boolean }) => unknown;
}

/**
 * Recale la carte quand son conteneur change de taille.
 *
 * Leaflet mémorise les dimensions du conteneur au montage et calcule sa grille
 * de tuiles dessus. Si le conteneur grandit ensuite — barre latérale repliée,
 * panneau ouvert, rotation du téléphone, mise en page qui se stabilise après le
 * chargement des données — la grille reste calée sur l'ancienne taille et la
 * zone gagnée n'est couverte par aucune tuile. Elle s'affiche en gris.
 *
 * Le dépôt connaissait déjà le remède, mais seulement pour les graphiques :
 * `admin/Chart`, `meteo/Radar`, `MayaChart`, `TresorerieChart` et
 * `RevenueChart` observent tous leur conteneur pour appeler `resize()`. Aucune
 * des quatre cartes ne le faisait, alors que Leaflet réclame exactement la même
 * chose sous le nom `invalidateSize()`.
 *
 * @returns la fonction d'arrêt, à appeler dans `onUnmounted`.
 */
export function suivreTailleCarte(carte: CarteRedimensionnable, cible: HTMLElement): () => void {
  if (typeof ResizeObserver === 'undefined') return () => {};

  let attente: ReturnType<typeof setTimeout> | null = null;
  const observateur = new ResizeObserver(() => {
    // Un redimensionnement arrive par rafales (glissement d'un panneau) :
    // on ne recalcule qu'une fois la rafale finie.
    if (attente) clearTimeout(attente);
    attente = setTimeout(() => carte.invalidateSize({ animate: false }), 120);
  });
  observateur.observe(cible);

  return () => {
    if (attente) clearTimeout(attente);
    observateur.disconnect();
  };
}
