import type { Appareil, MemoireEchecs } from '~/utils/erreurMicro';

/**
 * L'ADAPTATEUR IMPUR du diagnostic micro — et il est seul de son espèce.
 *
 * `erreurMicro.ts` revendique sa pureté dans son en-tête, et c'est ce qui le
 * rend vérifiable sans navigateur. Tout ce qui touche au monde extérieur — le
 * stockage local, la nature de l'appareil — vit donc ICI, dans un module que
 * les deux lecteurs de parole (la dictée, le réveil vocal) importent au lieu de
 * le recopier chacun de son côté.
 *
 * ⚠️ CE FICHIER EXISTE À CAUSE D'UN DÉFAUT MESURÉ, PAS PAR GOÛT DU DÉCOUPAGE.
 * La mémoire d'échecs vivait dans une fermeture de module, donc elle repartait
 * de zéro à CHAQUE CHARGEMENT DE PAGE. Sur un navigateur où la dictée ne peut
 * pas fonctionner — Arc, Brave, tout Chromium sans clé Google — le message
 * durable n'apparaissait jamais : il fallait deux échecs dans la MÊME session,
 * alors que le premier échec est fatal et coupe la relance. L'apiculteur
 * relisait donc « réessaie » indéfiniment, sur un navigateur où réessayer ne
 * pouvait rien changer. Signalé depuis le terrain sur Arc, journal à l'appui.
 */

/**
 * Mémoire d'échecs qui SURVIT au rechargement, par lecteur de parole.
 *
 * Grain volontaire : par appareil (`localStorage`), pas par compte. La cause est
 * le navigateur, pas l'apiculteur — le même compte ouvert sur Chrome doit
 * repartir de zéro, et le même navigateur doit se souvenir quel que soit le
 * compte connecté.
 *
 * Échoue en SILENCE et en mode volatile si le stockage est refusé (navigation
 * privée, réglage strict) : perdre la mémoire dégrade le message, elle ne doit
 * jamais faire tomber la dictée.
 */
export function memoireLocaleEchecsMicro(cle: string): MemoireEchecs {
  const nom = `apigo_micro_echecs_${cle}`;
  return {
    lire() {
      if (!import.meta.client) return 0;
      try {
        const n = Number.parseInt(localStorage.getItem(nom) ?? '', 10);
        return Number.isFinite(n) && n > 0 ? n : 0;
      } catch {
        return 0;
      }
    },
    ecrire(n) {
      if (!import.meta.client) return;
      try {
        localStorage.setItem(nom, String(n));
      } catch {
        /* stockage refusé : on retombe sur « réessaie », jamais sur une panne */
      }
    },
  };
}

/**
 * L'appareil, UNIQUEMENT pour nommer l'issue qui marche (cf. `issueDeSecours`).
 *
 * On ne cherche pas à identifier le navigateur — ce serait à la fois impossible
 * (Arc se présente comme Chrome) et inutile : ce qu'on doit dire, c'est ce qui
 * FONCTIONNE là où l'apiculteur est. Le tactile passe en premier parce que le
 * micro du clavier est la bonne réponse quel que soit le système en dessous, et
 * qu'un iPad se présente comme un Mac.
 *
 * `'autre'` en cas de doute — et `'autre'` sert la phrase la plus prudente
 * (« écris ta phrase »), qui est vraie partout. Une détection ratée dégrade le
 * conseil ; elle ne le rend jamais faux.
 */
export function detecterAppareil(): Appareil {
  if (!import.meta.client) return 'autre';
  try {
    if (matchMedia('(pointer: coarse)').matches) return 'tactile';
    const nav = navigator as Navigator & { userAgentData?: { platform?: string } };
    const plateforme = `${nav.userAgentData?.platform ?? ''} ${navigator.userAgent}`.toLowerCase();
    if (/mac|iphone|ipad|ipod/.test(plateforme)) return 'mac';
    if (/win/.test(plateforme)) return 'windows';
    return 'autre';
  } catch {
    return 'autre';
  }
}
