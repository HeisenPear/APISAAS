// Comment un auteur apparaît sur le forum — RÈGLE PURE.
//
// ⚠️ LE FORUM EST LU SANS COMPTE ET INDEXÉ PAR LES MOTEURS. Tout ce qui sort
// d'ici part sur la place publique et y reste : une page de forum se retrouve
// des années plus tard, y compris dans un cache que nous ne contrôlons pas.
// L'auteur d'un message n'a pas consenti à être trouvable par son nom complet,
// encore moins par son e-mail, parce qu'il a répondu à une question sur le
// varroa.
//
// D'où une fonction unique, sans accès à la base, dont un banc vérifie qu'elle
// ne laisse JAMAIS passer une adresse e-mail — le seul champ de `profils` dont
// la fuite serait immédiatement exploitable.

/** Ce que la couche route a le droit de lui donner. Volontairement minuscule. */
export interface AuteurAffichable {
  id: string;
  prenom?: string | null;
  nom?: string | null;
}

/**
 * Le pseudonyme d'un compte sans prénom.
 *
 * ⚠️ IL PORTE UN SUFFIXE, ET SANS LUI LE FIL DEVIENT ILLISIBLE. Trois comptes
 * sans prénom donneraient trois « Apiculteur » identiques : on croirait qu'une
 * seule personne se répond à elle-même. Le suffixe vient de l'identifiant, il
 * est donc STABLE — le même compte porte le même pseudonyme d'un message à
 * l'autre, et d'un fil à l'autre, ce qui est exactement ce qu'une conversation
 * demande.
 *
 * Quatre caractères hexadécimaux : assez pour distinguer les quelques
 * participants d'un fil, trop peu pour remonter à quoi que ce soit.
 */
export const PSEUDONYME_SANS_PRENOM = 'Apiculteur';

export function pseudonymeForum(auteur: AuteurAffichable): string {
  const prenom = (auteur.prenom ?? '').trim();
  if (!prenom) {
    const suffixe = auteur.id.replace(/-/g, '').slice(0, 4);
    return `${PSEUDONYME_SANS_PRENOM} ${suffixe}`;
  }

  /**
   * ⚠️ L'INITIALE, PAS LE NOM. « Camille D. » identifie dans une conversation
   * sans être un état civil ; « Camille Dubois » se cherche dans un moteur et
   * relie le forum à la personne réelle, à son exploitation, à son adresse —
   * que le produit connaît toutes. La différence tient à une lettre, et c'est
   * toute la différence.
   */
  const nom = (auteur.nom ?? '').trim();
  const initiale = nom ? ` ${nom[0]!.toUpperCase()}.` : '';
  return `${prenom}${initiale}`;
}
