/**
 * ═══════════════════════════════════════════════════════════════════════════
 * LE PRIX D'UNE LIGNE — UNE SEULE FORMULE, DES DEUX CÔTÉS DE LA FRONTIÈRE.
 *
 * ⚠️ CE MODULE EXISTE PARCE QUE « LE BUG D'ORIGINE » EST REVENU PAR L'ÉCRAN.
 *
 * `server/utils/pricing.ts` le nomme depuis le premier jour : dix seaux de
 * 25 kg à 10 €/kg valent 2 500 €, pas 100. Le serveur, lui, avait fini par
 * l'apprendre — `ligneTotalHt` regarde `modePrix` et `contenance`, et
 * `tests/unit/server/argentUneSeuleRegle.test.ts` refuse toute recopie.
 *
 * Mais ce banc-là ne balayait que `server/`. Or ce que l'apiculteur IMPRIME et
 * ce qu'il LIT en saisissant ne sont pas calculés par le serveur : ce sont des
 * expressions écrites dans les pages. Elles disaient toutes
 * `quantité × prixUnitaire`, cinq fois pour les seuls bons de livraison — dont
 * DEUX dans le formulaire de création, donc sous les yeux de celui qui saisit,
 * avant même qu'un serveur ait vu la ligne.
 *
 * Le résultat était le pire des trois possibles : le bon de livraison qui part
 * avec la marchandise annonçait 100 €, la base stockait 2 500 €, et la facture
 * qui en découle réclamait 2 500 €. Le papier contredisait son propre
 * enregistrement — et le client reçoit les deux.
 *
 * C'est « la couverture qui s'arrête juste avant » de CLAUDE.md, dans le banc
 * écrit précisément pour empêcher ce défaut-là.
 *
 * ─── POURQUOI ICI, ET PAS DANS `pricing.ts` ────────────────────────────────
 * `app/utils/` est le domicile à deux faces de ce dépôt : quinze fichiers de
 * `server/` y importent déjà (`urlQr`, `demoSlots`, `frelonFiabilite`,
 * `qualiteMiel`, `selectionReines`…). L'inverse — une page qui importerait
 * `~~/server/utils/…` — n'existe nulle part, et tirerait un module du serveur
 * dans le paquet du navigateur : le jour où `pricing.ts` importe la base, tout
 * le socle SQL part chez le client.
 *
 * `server/utils/pricing.ts` RÉEXPORTE donc ces noms plutôt que de les
 * redéfinir. Le dépôt interdit les réexports (cf. `collisionsAutoImport`) —
 * l'interdiction vise le SECOND CHEMIN dans un MÊME espace d'auto-import. Ici
 * les deux espaces sont disjoints : Nitro ne voit que `server/utils`, Nuxt que
 * `app/utils` + `app/composables`. Chaque espace a exactement un exportateur,
 * et c'est le même code.
 * ═══════════════════════════════════════════════════════════════════════════
 */

export type ModePrix = 'format' | 'poids';

export interface LignePricingInput {
  quantite: number | string | null | undefined;
  prixUnitaire: number | string | null | undefined;
  modePrix?: ModePrix | null;
  /** Contenance d'une unité (ex: 25 pour un seau de 25 kg) — requis si modePrix = 'poids' */
  contenance?: number | string | null;
}

/** Arrondi monétaire à 2 décimales, robuste aux erreurs flottantes. */
export function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

/**
 * Un montant lu depuis n'importe quelle porte — une saisie de formulaire (une
 * chaîne), un `numeric` de Postgres (une chaîne aussi), un champ vide.
 *
 * Exporté pour que `server/utils/pricing.ts` n'ait pas à en écrire une seconde
 * copie : c'est la conversion qui décide qu'un champ vide vaut 0 et qu'un
 * `NaN` ne se propage pas dans un total.
 */
export function nombreMonetaire(v: number | string | null | undefined): number {
  if (v === null || v === undefined || v === '') return 0;
  const n = typeof v === 'number' ? v : Number(v);
  return Number.isFinite(n) ? n : 0;
}

/**
 * Total HT d'une ligne, arrondi à 2 décimales.
 *
 * En mode 'poids', si la contenance est absente/0 on retombe sur un calcul
 * format (quantité × prix) plutôt que de renvoyer 0 — évite de "perdre" une
 * ligne mal saisie.
 */
export function ligneTotalHt(input: LignePricingInput): number {
  const quantite = nombreMonetaire(input.quantite);
  const prixUnitaire = nombreMonetaire(input.prixUnitaire);

  if (input.modePrix === 'poids') {
    const contenance = nombreMonetaire(input.contenance);
    if (contenance > 0) {
      return round2(quantite * contenance * prixUnitaire);
    }
    // contenance manquante en mode poids → fallback format (defensive)
  }

  return round2(quantite * prixUnitaire);
}

/** Montant de TVA d'une ligne à partir de son total HT et de son taux (%). */
export function ligneTva(totalHt: number, tauxTva: number | string | null | undefined): number {
  return round2((totalHt * nombreMonetaire(tauxTva)) / 100);
}

/**
 * Une ligne telle qu'elle revient de l'API ou telle qu'on la saisit.
 *
 * `Partial` n'est pas un relâchement : les lignes stockées (`LigneBL`)
 * déclarent `prixUnitaire` FACULTATIF — un bon de livraison peut n'annoncer
 * que des quantités. Exiger le champ ici obligerait chaque appelant à un cast,
 * et un cast finit toujours par masquer autre chose.
 */
export interface LigneAffichable extends Partial<LignePricingInput> {
  total?: number | string | null;
}

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * DEUX LECTURES D'UNE MÊME LIGNE, ET ELLES NE SE CONFONDENT PAS.
 *
 * ⚠️ J'AI FAILLI LES CONFONDRE, ET LE FORMULAIRE DE VENTE AURAIT AFFICHÉ 0 €.
 *
 * Une ligne qui revient de l'API porte le total que LE SERVEUR a calculé et
 * écrit : c'est lui qui fait foi, parce que c'est lui que `convertir` et
 * `facturer-groupe` reprendront sur la facture. Une ligne EN COURS DE SAISIE
 * porte un champ `total` qui ne veut rien dire : `VenteForm` l'initialise à 0
 * et ne le remet jamais à jour pendant la frappe. Lire ce total-là, c'est
 * afficher zéro pendant que l'apiculteur tape ses montants.
 *
 * C'est la même leçon que « deux lectures d'une donnée, confondues » de
 * CLAUDE.md : « à quel domaine appartient cette route » et « que rend cet
 * appel » sont deux questions. Ici : « combien vaut cette ligne au dossier »
 * et « combien vaut ce que je suis en train de saisir ».
 *
 * Deux questions, deux fonctions, et un banc qui refuse qu'un formulaire
 * appelle la version « au dossier ».
 * ═══════════════════════════════════════════════════════════════════════════
 */

/**
 * CE QUE VAUT UNE LIGNE QU'ON EST EN TRAIN DE SAISIR — toujours recalculé.
 *
 * ⚠️ `undefined`, PAS `0`. Un bon de livraison peut légitimement n'annoncer que
 * des quantités, le prix venant à la facturation — la règle est déjà tenue
 * côté serveur par `lignesBonLivraisonAvecTotaux`. Afficher « 0,00 € » là où
 * le prix n'est pas encore convenu, c'est annoncer la gratuité.
 */
export function montantSaisiHt(ligne: Partial<LignePricingInput>): number | undefined {
  if (ligne.prixUnitaire === null || ligne.prixUnitaire === undefined) return undefined;
  // Les quatre clés sont posées explicitement : `Partial` rend le champ
  // FACULTATIF (il peut être absent), là où `ligneTotalHt` exige qu'il soit
  // présent — quitte à valoir `undefined`, ce dont elle sait quoi faire.
  return ligneTotalHt({
    quantite: ligne.quantite,
    prixUnitaire: ligne.prixUnitaire,
    modePrix: ligne.modePrix,
    contenance: ligne.contenance,
  });
}

/**
 * CE QUE VAUT UNE LIGNE AU DOSSIER — le total STOCKÉ d'abord.
 *
 * ⚠️ LE TOTAL STOCKÉ GAGNE, ET CE N'EST PAS UN DÉTAIL. Les deux routes qui
 * transforment un bon de livraison en facture (`convertir`, `facturer-groupe`)
 * reprennent `l.total` tel quel — « une conversion ne RE-TARIFE pas ». Un
 * écran qui recalculerait au lieu de lire ce total pourrait donc, sur une
 * donnée ancienne, montrer un montant que la facture ne reprendra pas. Or
 * c'est le même document : le bon signé et la facture émise doivent porter le
 * même chiffre, sinon c'est le client qui arbitre.
 *
 * Le calcul ne sert que de REPLI, pour les lignes anciennes écrites avant que
 * le serveur ne stocke le total.
 */
export function montantLigneHt(ligne: LigneAffichable): number | undefined {
  if (ligne.total !== null && ligne.total !== undefined && ligne.total !== '') {
    return round2(nombreMonetaire(ligne.total));
  }
  return montantSaisiHt(ligne);
}

/**
 * LE SOUS-TOTAL HT D'UN DOCUMENT — la somme de ce qui est AFFICHÉ.
 *
 * ⚠️ L'ARRONDI EST PAR LIGNE, PUIS SUR LA SOMME. CLAUDE.md en fait une règle :
 * « ce qui est affiché doit s'additionner à ce qui est affiché ». Sommer des
 * montants non arrondis puis n'arrondir qu'à la fin donne un total que le
 * lecteur ne retrouve pas en additionnant la colonne — et c'est exactement
 * l'écart d'un centime qui séparait les deux portes d'une campagne.
 */
export function sommeMontantsHt(lignes: ReadonlyArray<LigneAffichable>): number {
  return round2(lignes.reduce((somme, l) => somme + (montantLigneHt(l) ?? 0), 0));
}

/** Le sous-total d'un FORMULAIRE : la somme de ce qu'on est en train de saisir. */
export function sommeSaisieHt(lignes: ReadonlyArray<Partial<LignePricingInput>>): number {
  return round2(lignes.reduce((somme, l) => somme + (montantSaisiHt(l) ?? 0), 0));
}
