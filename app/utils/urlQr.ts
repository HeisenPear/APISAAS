import { SITE_URL } from './seo';

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * LES URL QU'ON IMPRIME SUR UN OBJET PHYSIQUE.
 *
 * Un QR collé sur une hausse, une ruche ou un pot vit des ANNÉES sur le
 * terrain. Il survit à tous les déploiements, à toutes les previews, à tous
 * les postes de développement. L'URL qu'il porte doit donc être celle du
 * domaine de production, et rien d'autre.
 *
 * ⚠️ LE DÉFAUT QUI A PRODUIT CE MODULE — LES QR DE HAUSSE ÉTAIENT MORTS.
 *
 * Quatre endroits du serveur fabriquaient l'URL du QR d'une hausse avec un
 * sous-domaine écrit en dur. Ce sous-domaine N'EXISTE PAS : il ne résout pas
 * (NXDOMAIN), alors que l'apex, lui, est bien servi par Vercel. Autrement dit
 * chaque étiquette de hausse imprimée depuis la génération de parc porte un
 * QR qui ne mène nulle part — pas une page d'erreur de l'application, une
 * erreur DNS du téléphone, sur le terrain, hors réseau.
 *
 * Pire : l'URL était ÉCRITE EN BASE (`hausses.qr_code_data`), donc figée.
 *
 * Et pendant ce temps, la fiche de la hausse affichait, elle, un QR construit
 * sur `window.location.origin`. La même hausse avait donc DEUX QR différents
 * selon l'écran d'où on l'imprimait — l'un mort partout, l'autre mort dès
 * qu'on l'imprimait depuis une preview ou depuis localhost.
 *
 * La règle était pourtant connue : `PasseportPotQr.vue` la portait dans un
 * commentaire, exacte, depuis le début — « un QR imprimé sur un pot doit
 * pointer vers le domaine de production, jamais vers l'URL où il a été
 * généré ». Elle était écrite dans UN fichier au lieu d'être une fonction.
 * C'est la classe de défaut la plus fréquente de ce dépôt : une règle
 * recopiée diverge, une règle dérivée ne le peut pas.
 *
 * Ces trois fonctions sont désormais les SEULS endroits du dépôt où le chemin
 * d'un QR se fabrique — `tests/unit/urlsQrCanoniques.test.ts` l'exige.
 * ═══════════════════════════════════════════════════════════════════════════
 */

/** L'URL encodée dans le QR collé sur une hausse. */
export function urlQrHausse(idHausse: string): string {
  return `${SITE_URL}/hausses/${idHausse}?scan=1`;
}

/** L'URL encodée dans le QR collé sur une ruche. */
export function urlQrRuche(idRuche: string): string {
  return `${SITE_URL}/ruches/${idRuche}?scan=1`;
}

/**
 * L'URL du passeport d'un pot de miel. Le passeport voyage ENTIÈREMENT dans le
 * fragment (`#…`) : il n'est jamais envoyé au serveur, et la page le décode
 * côté client. C'est ce qui permet à l'étiquette de rester lisible même si le
 * lot est supprimé.
 */
export function urlPasseportPot(passeportEncode: string): string {
  return `${SITE_URL}/p#${passeportEncode}`;
}
