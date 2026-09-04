/**
 * LA DATE D'AUJOURD'HUI, TELLE QUE L'APICULTEUR LA LIT SUR SON TÉLÉPHONE.
 *
 * ⚠️ `new Date().toISOString()` DÉCOUPÉ EN DIX REND LA DATE UTC, PAS LA SIENNE.
 * Vingt-six pré-remplissages de formulaire l'utilisaient. En France — UTC+1
 * l'hiver, UTC+2 l'été — cela veut dire qu'entre minuit et une heure (deux en
 * été), la date proposée est CELLE DE LA VEILLE :
 *
 *   · une visite sanitaire, une déclaration de mortalité ou une ordonnance —
 *     des pièces que le registre d'élevage doit dater juste — reçoivent la
 *     date d'hier ;
 *   · une facture saisie le 1ᵉʳ janvier à 00 h 30 est datée du 31 décembre,
 *     donc rattachée à l'EXERCICE PRÉCÉDENT.
 *
 * Le défaut ne se reproduit pas à la demande : il ne se voit qu'entre minuit
 * et l'heure d'été, et seulement pour qui saisit à ce moment-là. C'est
 * exactement le profil des bogues de fuseau que ce dépôt connaît déjà côté
 * serveur, et pour lesquels `server/utils/horloge.ts` existe.
 *
 * ⚠️ NE PAS CONFONDRE AVEC LE FORMATAGE D'UNE DATE STOCKÉE. Une valeur
 * date-seule est rangée à MINUIT UTC (cf. `jourUtc`) : la relire avec
 * un découpage de `toISOString()` rend le bon jour des deux côtés, et la passer
 * en local la décalerait. Ces appels-là sont justes et ne doivent pas être
 * touchés. La différence tient en un mot : `new Date()` sans argument
 * signifie « maintenant », donc « chez l'apiculteur ».
 */

/** `YYYY-MM-DD` du jour, dans le fuseau du navigateur. */
export function dateDuJour(d: Date = new Date()): string {
  const mois = String(d.getMonth() + 1).padStart(2, '0');
  const jour = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mois}-${jour}`;
}

/**
 * `YYYY-MM-DD` d'une date quelconque, dans le fuseau du navigateur.
 *
 * Pour une date SAISIE ou AFFICHÉE — jamais pour relire une valeur date-seule
 * venue de la base, qui est à minuit UTC et se relit telle quelle.
 */
export function dateLocale(d: Date | string): string {
  return dateDuJour(typeof d === 'string' ? new Date(d) : d);
}
