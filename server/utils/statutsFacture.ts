import type { statutFactureEnum } from '~~/server/database/schema';

/**
 * CE QUI COMPTE DANS UN CHIFFRE D'AFFAIRES — une seule fois, pour tout le monde.
 *
 * ⚠️ CE MODULE EXISTE PARCE QUE LE DÉPÔT AVAIT QUATRE RÉPONSES À LA MÊME
 * QUESTION, et que Maya donnait la plus fausse des quatre :
 *
 *   server/api/finances/dashboard.get.ts   notInArray(statut, ['brouillon','annulee'])
 *   server/api/finances/tresorerie.get.ts  ne(statut, 'brouillon')
 *   copilote-data.getFinances              AUCUN filtre de statut
 *   copilote-data.getSerie12Mois           AUCUN filtre de statut
 *   copilote-data.getClients               statut <> 'annulee'
 *
 * Conséquence vécue : l'apiculteur ouvrait sa page Finances, y lisait un
 * chiffre ; il demandait le même chiffre à Maya, et en obtenait un autre —
 * gonflé de ses brouillons et de ses factures annulées. Sur le nombre le plus
 * regardé du produit. C'est « dériver, jamais recopier » appliqué à l'argent :
 * cinq copies d'une règle, donc cinq occasions de diverger, et elles avaient
 * toutes divergé.
 *
 * La réponse retenue n'est pas inventée ici : c'est celle que le produit donne
 * déjà sur sa page Finances. Ce module ne tranche rien de neuf, il arrête la
 * dispersion.
 */

/**
 * Un statut de facture, DÉRIVÉ de l'énumération de la base.
 *
 * ⚠️ SUFFIXÉ `Db` À DESSEIN. `app/types/enums.ts` exporte déjà un
 * `StatutFacture` — une recopie à la main des cinq mêmes valeurs, que personne
 * n'utilise. L'auto-import de Nuxt résout PAR NOM : deux modules exportant le
 * même nom donnent deux chemins, et l'un est silencieusement ignoré. Le nom est
 * donc distinct, et la seule source lue ici est l'énumération de la BASE — la
 * seule des deux qui contraigne vraiment les données.
 */
export type StatutFactureDb = (typeof statutFactureEnum.enumValues)[number];

/**
 * Chaque statut, et s'il pèse dans le chiffre d'affaires réalisé.
 *
 * ⚠️ `Record` COMPLET, ET C'EST TOUT L'INTÉRÊT. Un sixième statut ajouté à
 * l'énumération casse la compilation ici, et force quelqu'un à décider s'il est
 * du chiffre d'affaires ou non. Une liste filtrée par exclusion aurait fait
 * l'inverse : le statut inconnu serait entré dans le CA en silence — « inconnu
 * ne vaut jamais laisse passer », y compris quand la conséquence est un chiffre
 * trop grand plutôt qu'une porte ouverte.
 */
const COMPTE_DANS_LE_CA: Record<StatutFactureDb, boolean> = {
  /** Jamais émise : le client ne l'a pas reçue, elle n'engage personne. */
  brouillon: false,
  /** Émise et due — c'est du chiffre d'affaires, même pas encore encaissé. */
  envoyee: true,
  /** Encaissée. */
  payee: true,
  /** Émise, due, en retard : toujours du chiffre d'affaires, pas encore un impayé perdu. */
  en_retard: true,
  /** Retirée : elle ne sera jamais encaissée. */
  annulee: false,
};

/** Les statuts qui pèsent dans le chiffre d'affaires. Dérivés de la table ci-dessus. */
export const STATUTS_CA_REALISE = (Object.keys(COMPTE_DANS_LE_CA) as StatutFactureDb[]).filter(
  (s) => COMPTE_DANS_LE_CA[s],
);

/** Les statuts qui n'y pèsent pas — utile aux messages, et aux bancs. */
export const STATUTS_HORS_CA = (Object.keys(COMPTE_DANS_LE_CA) as StatutFactureDb[]).filter(
  (s) => !COMPTE_DANS_LE_CA[s],
);

/** Cette facture compte-t-elle dans le chiffre d'affaires ? Pur. */
export function compteDansLeCa(statut: string): boolean {
  return COMPTE_DANS_LE_CA[statut as StatutFactureDb] === true;
}
