/**
 * LES PLAFONDS DE TAILLE D'UN ENVOI — des DONNÉES, lisibles des deux côtés.
 *
 * ⚠️ CE FICHIER EXISTE PARCE QU'UN PLAFOND VIT AILLEURS QUE DANS LE CODE.
 * Vercel coupe le corps d'une requête à ~4,5 Mo AVANT que la moindre ligne
 * d'APIGO ne s'exécute : ni le middleware de taille, ni la route, ni le
 * moindre `try/catch` ne voient passer la requête. L'apiculteur reçoit une
 * erreur de plateforme, sans phrase et sans porte de sortie.
 *
 * On ne peut donc pas « gérer » cette panne côté serveur : il faut la
 * DEVANCER dans le navigateur, avant l'envoi. D'où ces constantes, posées une
 * fois et lues aux deux endroits — le fichier ne contient que des données et
 * aucun import, ce qui lui permet de traverser la frontière client/serveur.
 *
 * ⚠️ CE PLAFOND NE SE RELÈVE PAS DEPUIS LE CODE. Un PDF trop lourd doit être
 * ALLÉGÉ (échelle du rendu, qualité JPEG dans `optionsPdf()`), pas autorisé
 * plus haut : la coupure vient de l'infrastructure.
 */

/** Ce que Vercel accepte comme corps de requête (offre Hobby). */
export const PLAFOND_CORPS_VERCEL_OCTETS = 4_500_000;

/**
 * Ce qu'on s'autorise à poster en base64 pour un PDF.
 *
 * La marge sous le plafond de Vercel couvre l'enveloppe JSON, le préfixe
 * `data:application/pdf;base64,` et les en-têtes. Un banc vérifie que cette
 * marge existe toujours : les deux nombres ne doivent jamais se croiser.
 */
export const PLAFOND_PDF_BASE64_OCTETS = 4_000_000;

/**
 * Le refus, en toutes lettres. Il nomme ce qui bloque, l'ordre de grandeur, et
 * ce qu'on peut faire tout de suite — la règle du dépôt : jamais de « non »
 * sans porte de sortie.
 */
export function refusPdfTropLourd(octetsBase64: number): string {
  const mo = (octetsBase64 / 1_048_576).toFixed(1).replace('.', ',');
  return (
    `Ce PDF pèse ${mo} Mo une fois encodé, au-delà de ce que la plateforme ` +
    'accepte d’envoyer en une fois — rien n’est parti, la facture est intacte. ' +
    'Téléchargez-le depuis cette page et envoyez-le depuis votre messagerie ; ' +
    'ou allégez la facture (moins de lignes, moins de photos) et réessayez.'
  );
}

/** Le PDF encodé dépasse-t-il ce qu'on peut poster ? */
export function pdfTropLourd(base64: string): boolean {
  return base64.length > PLAFOND_PDF_BASE64_OCTETS;
}
