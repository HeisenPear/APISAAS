/**
 * QUI SIGNE LE DOCUMENT — une seule fonction, lue des deux côtés.
 *
 * ⚠️ CE FICHIER EXISTE POUR SUPPRIMER UNE TRIPLE RECOPIE. Trois endroits
 * composaient le nom de l'émetteur, chacun à sa façon :
 *
 *     app/pages/finances/facture/[id].vue   [e.prenom, e.nom].join(' ') || 'APIGO'
 *     server/api/…/facturx.get.ts           idem
 *     server/api/…/email.post.ts            idem
 *
 * Trois copies de la même règle, donc trois occasions de diverger — c'est la
 * source de la majorité des défauts de ce dépôt. Le nom commercial devait être
 * la QUATRIÈME. Il est la première à en dériver.
 *
 * ⚠️ LE REPLI SUR « APIGO » A DISPARU, ET C'EST VOULU. APIGO édite le logiciel ;
 * il ne vend pas le miel. Une facture signée du nom de l'éditeur désigne le
 * mauvais vendeur sur une pièce comptable — un compte dont le profil est vide
 * émettait des factures au nom d'APIGO, avec le SIRET absent juste en dessous.
 * Devant une identité qu'on ne sait pas nommer, on REFUSE d'émettre, avec une
 * phrase qui dit où compléter — jamais on n'invente un vendeur.
 *
 * Ce fichier ne contient que des données et des fonctions pures : aucun import
 * de serveur, ce qui lui permet de traverser la frontière client/serveur.
 */

/** Ce dont l'identité a besoin — un sous-ensemble de `profils`. */
export interface ProfilEmetteur {
  nom?: string | null;
  prenom?: string | null;
  nomCommercial?: string | null;
  logoUrl?: string | null;
}

export interface IdentiteEmetteur {
  /**
   * Ce qui s'affiche en tête du document : le nom commercial s'il existe,
   * sinon le nom légal. Chaîne VIDE si le profil ne porte rien — jamais
   * « APIGO », jamais un repli inventé.
   */
  affichage: string;
  /**
   * La mention obligatoire d'identité du vendeur : prénom + nom patronymique.
   * L'apiculteur exerce en nom propre — un nom commercial ne la remplace pas,
   * il s'y ajoute.
   */
  legal: string;
  /**
   * Vrai quand l'affichage DIFFÈRE du légal. Le document doit alors montrer
   * les DEUX : « Le Rucher de Maël » en grand, « Maël Dupont » en mention.
   * Faux quand ils coïncident — répéter le même nom deux fois n'apporte rien.
   */
  mentionLegaleNecessaire: boolean;
  logoUrl: string | null;
}

/** Normalise un champ texte facultatif : `null` et les blancs valent absent. */
function texte(v: string | null | undefined): string {
  return (v ?? '').trim();
}

/** Le nom patronymique complet, ou une chaîne vide s'il manque. */
export function nomLegal(p: ProfilEmetteur | null | undefined): string {
  return [texte(p?.prenom), texte(p?.nom)].filter(Boolean).join(' ');
}

export function identiteEmetteur(p: ProfilEmetteur | null | undefined): IdentiteEmetteur {
  const legal = nomLegal(p);
  const commercial = texte(p?.nomCommercial);
  const affichage = commercial || legal;
  return {
    affichage,
    legal,
    mentionLegaleNecessaire: Boolean(commercial) && commercial !== legal && Boolean(legal),
    logoUrl: texte(p?.logoUrl) || null,
  };
}

/**
 * Le refus d'émettre, ou `null` si l'identité suffit.
 *
 * ⚠️ SEUL LE NOM LÉGAL EST EXIGÉ. Le nom commercial est un confort, le logo
 * aussi ; le nom patronymique est une mention OBLIGATOIRE sur une facture
 * française. C'est donc lui, et lui seul, qui bloque.
 *
 * Le refus est une phrase, et il nomme la sortie — sans quoi l'apiculteur se
 * retrouve devant un mur au moment d'envoyer sa facture.
 */
export function refusIdentiteEmetteur(p: ProfilEmetteur | null | undefined): string | null {
  if (nomLegal(p)) return null;
  return (
    'Votre facture ne peut pas être émise sans votre nom : c’est une mention ' +
    'obligatoire, et APIGO ne signera pas à votre place. Renseignez votre ' +
    'prénom et votre nom dans Réglages › Mon profil, puis réessayez — la ' +
    'facture vous attend, rien n’est perdu.'
  );
}

/**
 * Ce qu'un document a besoin de savoir de l'émetteur, tel que
 * `GET /api/profils/emetteur` le renvoie — c'est-à-dire le profil du
 * PROPRIÉTAIRE de l'exploitation, jamais celui de l'utilisateur connecté.
 */
export interface ProfilEmetteurDoc extends ProfilEmetteur {
  adresse: string | null;
  codePostal: string | null;
  ville: string | null;
  siret: string | null;
  napi: string | null;
  email: string;
  telephone: string | null;
}

/**
 * Reconnaît une adresse email. Volontairement large : on cherche à ATTRAPER,
 * pas à valider — un faux positif retire une mention, un faux négatif imprime
 * une adresse personnelle sur un pot de miel.
 */
const RESSEMBLE_A_UN_EMAIL = /\S+@\S+/;

/**
 * LE NOM QU'ON ACCEPTE D'IMPRIMER — vide si ce n'en est pas un.
 *
 * ⚠️ CETTE FONCTION EXISTE PARCE QU'UNE ADRESSE EMAIL S'EST IMPRIMÉE SUR DES
 * POTS DE MIEL. `useAuthStore().fullName` vaut
 * `[prenom, nom].join(' ') || profil.email` : un repli parfaitement légitime
 * dans la barre latérale — l'apiculteur doit se reconnaître quelque part — et
 * catastrophique sur un document. Ce nom partait dans la charge du QR du
 * passeport, encodée dans le fragment d'URL, gravée dans l'image collée sur les
 * pots, et rendue par la page PUBLIQUE `/p` : « par jean.dupont@gmail.com ».
 *
 * Corriger l'appelant ne suffisait pas : le banc anti-recopie ne voit pas un
 * getter, et la faute est trop facile à refaire. La garde vit donc DANS les
 * composants qui impriment — là où elle ne peut plus être contournée par un
 * appel maladroit.
 *
 * ⚠️ AUCUN CORRECTIF NE RATTRAPE LE PAPIER. Devant un nom qu'on ne sait pas
 * nommer, on n'imprime RIEN : une mention absente se corrige, une adresse
 * personnelle gravée sur mille étiquettes ne se reprend pas.
 */
export function nomImprimable(valeur: string | null | undefined): string {
  const texte = (valeur ?? '').trim();
  return RESSEMBLE_A_UN_EMAIL.test(texte) ? '' : texte;
}
