/**
 * ÉCHAPPEMENT HTML — une seule règle, pour tout ce qui interpole du texte
 * saisi par l'utilisateur dans du HTML.
 *
 * ⚠️ CETTE FONCTION VIVAIT DANS `email.ts`, ET LE CERFA NE L'UTILISAIT PAS.
 * `server/api/declarations/napi/cerfa-pdf.get.ts` interpolait le nom, l'adresse,
 * la ville, le téléphone et les NOMS DE RUCHERS bruts dans un document renvoyé
 * en `Content-Type: text/html` — sur l'origine de l'application. Le nom d'un
 * rucher est du texte libre, et il peut venir d'un membre de l'équipe.
 *
 * Elle est donc extraite ici : une règle de sécurité rangée dans le module des
 * emails est une règle que le prochain appelant ne trouvera pas.
 */
export function echapperHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
