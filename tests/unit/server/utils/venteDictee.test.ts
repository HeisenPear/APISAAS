import { describe, it, expect } from 'vitest';
import { classifierTour } from '~~/server/utils/copilote-local';
import { analyserVente } from '~~/server/utils/copilote-actions';
import { MAYA_ACTIONS, type ActionCreatrice } from '~~/app/config/maya-actions';

/**
 * LA VENTE ÉTAIT UN SQUELETTE — DÉCLARÉE AU CATALOGUE, INCAPABLE D'ÉCRIRE.
 *
 * Mesuré avant correction, quatre formulations, quatre issues fausses :
 *
 *   « j'ai vendu 12 pots de miel à Dupont »    → l'inventaire des STOCKS
 *   « je veux enregistrer une vente »          → « je n'ai pas compris »
 *   « vendu 20 kg de miel à 12 euros le kilo » → le tableau des FINANCES
 *   « note une vente de 6 pots à Martine »     → « sur quelle ruche ? »
 *
 * C'est le geste commercial central du produit, et de septembre à Noël c'est
 * plusieurs fois par semaine.
 *
 * ⚠️ CE BANC GARDE AUSSI CE QUI NE DOIT PAS BOUGER. Un analyseur de vente qui
 * réclame trop vole les LECTURES (« montre mes ventes »), la NAVIGATION
 * (« ouvre une nouvelle vente ») et ses voisins d'écriture (la récolte, le
 * stock). Les cas « doit survivre » sont la moitié du travail.
 */
const t = (...tours: string[]) =>
  classifierTour(tours.map((content) => ({ role: 'user' as const, content })));

describe('la vente s’écrit, au lieu de renvoyer ailleurs', () => {
  it('produit, quantité et client dans une phrase naturelle', () => {
    const c = t("j'ai vendu 12 pots de miel a Dupont");
    expect(c.kind, 'la phrase part encore ailleurs').toBe('ecriture');
    if (c.kind !== 'ecriture') return;
    expect(c.ecriture.action).toBe('vente');
    if (c.ecriture.action !== 'vente') return;
    expect(c.ecriture.parse.quantite).toBe(12);
    expect(c.ecriture.parse.clientNom).toBe('Dupont');
    expect(c.ecriture.parse.designation).toMatch(/pots/);
    // Le prix n'est pas dans la phrase : Maya doit le DEMANDER, pas l'inventer.
    expect(c.ecriture.parse.manque).toContain('prixUnitaire');
  });

  it('le prix ne se confond pas avec la quantité', () => {
    /**
     * « 12 pots à 8 euros » vaut douze pots à huit euros. Prendre le premier
     * nombre venu inverserait les deux et facturerait huit pots à douze euros —
     * un écart silencieux sur un document comptable.
     */
    const p = analyserVente(
      'note une vente de 6 pots a martine a 8 euros',
      'note une vente de 6 pots a Martine a 8 euros',
    );
    expect(p).not.toBeNull();
    expect(p!.quantite, 'la quantité a pris le prix').toBe(6);
    expect(p!.prixUnitaire, 'le prix a pris la quantité').toBe(8);
    expect(p!.manque).toEqual([]);
  });

  it('le symbole « € » vaut le mot « euros »', () => {
    /**
     * ⚠️ IL NE SURVIVAIT PAS À `normaliser`, QUI NE GARDE QUE `[a-z0-9.]`.
     * L'analyseur cherchait pourtant le prix avec une alternative « € » qui ne
     * pouvait plus figurer dans la chaîne qu'on lui donnait : « vendu 20 kg de
     * miel à 12 €/kg » n'avait AUCUN prix, et Maya répondait « À quel prix
     * unitaire ? » à quelqu'un qui venait de le dire. Un motif juste, appliqué
     * à un texte d'où l'on avait retiré ce qu'il cherchait — aucune relecture
     * du motif seul ne trouve ça. `normaliser` l'épelle désormais.
     */
    const c = t('vendu 20 kg de miel a 12 €/kg');
    expect(c.kind).toBe('ecriture');
    if (c.kind !== 'ecriture' || c.ecriture.action !== 'vente') return;
    expect(c.ecriture.parse.prixUnitaire, 'le symbole € ne vaut plus un prix').toBe(12);
    expect(c.ecriture.parse.quantite).toBe(20);
    expect(c.ecriture.parse.manque, 'Maya redemande ce qu’on vient de lui dire').not.toContain(
      'prixUnitaire',
    );
  });

  it('une CONTENANCE n’est pas une quantité', () => {
    /**
     * ⚠️ « LE PREMIER NOMBRE QUI N'EST PAS LE PRIX » ÉTAIT FAUX, ET LE FACTEUR
     * EST DE CINQ CENTS. Dans « du miel en pots de 500 g à 8 euros », le 500
     * décrit le CONTENANT : la facture partait à 500 × 8 € = 4 000 €.
     *
     * La règle ne rejette pas les unités de mesure — « 20 kg de miel » compte
     * bien — elle rejette un idiome précis : un nombre introduit par « de » ET
     * suivi d'une unité de mesure.
     */
    const p = analyserVente(
      'vendu du miel en pots de 500 g a 8 euros',
      'vendu du miel en pots de 500 g à 8 euros',
    );
    expect(p).not.toBeNull();
    expect(p!.quantite, 'la contenance du pot est devenue le nombre de pots').not.toBe(500);
    // Ne sachant pas COMBIEN, Maya doit demander — pas inventer.
    expect(p!.manque).toContain('quantite');
    expect(p!.prixUnitaire).toBe(8);
  });

  it('le prix reste le prix MÊME quand il est annoncé en premier', () => {
    /**
     * ⚠️ MUTATION RESTÉE VERTE, PUIS REFERMÉE. Le cas ci-dessus (« 6 pots à
     * 8 euros ») ne gardait RIEN : la quantité y précède le prix, donc prendre
     * « le premier nombre venu » donne la bonne réponse par accident. Retirer
     * la mise à l'écart du prix laissait le banc vert.
     *
     * Ici le prix est annoncé D'ABORD. Sans la mise à l'écart, la quantité
     * vaudrait 8 et le prix 8 : huit pots à huit euros, pour six pots à huit
     * euros. Un écart silencieux sur un document comptable.
     */
    const q = 'a 8 euros piece j ai vendu 6 pots';
    const p = analyserVente(q, q);
    expect(p).not.toBeNull();
    expect(p!.prixUnitaire, 'le prix a été pris pour la quantité').toBe(8);
    expect(p!.quantite, 'la quantité a pris la valeur du prix').toBe(6);
  });

  it('la désignation ne garde pas la ponctuation', () => {
    // « vendu du miel à 12 euros le kilo, 20 kg » laissait « miel , » — la
    // virgule finissait sur la facture, dans le libellé du produit.
    const q = 'vendu du miel a 12 euros le kilo, 20 kg';
    const p = analyserVente(q, q);
    expect(p!.designation, 'de la ponctuation traîne dans le libellé').toBe('miel');
  });

  it('une phrase qui annonce l’intention sans décrire le produit ne remplit RIEN', () => {
    // ⚠️ DÉFAUT DE MA PREMIÈRE VERSION : « je veux enregistrer une vente »
    // donnait `designation: "je veux"`, et Maya aurait enchaîné sur
    // « combien de *je veux* ? ». Les verbes d'intention manquaient au filtre.
    const p = analyserVente('je veux enregistrer une vente', 'je veux enregistrer une vente');
    expect(p).not.toBeNull();
    expect(p!.designation, 'une intention n’est pas une désignation de produit').toBeUndefined();
    expect(p!.manque).toContain('designation');
  });

  it('LES LECTURES DOIVENT SURVIVRE — on ne vole pas les questions', () => {
    for (const q of [
      'combien j ai vendu cette annee ?',
      'montre mes ventes',
      'mes ventes du mois',
    ]) {
      expect(t(q).kind, q).not.toBe('ecriture');
    }
  });

  it('LA NAVIGATION DOIT SURVIVRE — et j’avais cassé son banc', () => {
    // Le mot « vente » suffisait à me faire réclamer la phrase, donc Maya
    // proposait d'enregistrer une vente VIDE au lieu d'ouvrir le formulaire.
    expect(t('Ouvre une nouvelle vente').kind).toBe('navigation');
  });

  it('mais « note une nouvelle vente » DÉCRIT UN FAIT, et s’écrit', () => {
    // Le contrôle négatif de la règle ci-dessus : elle ne doit pas avaler tout
    // ce qui contient « nouvelle ». C'est le verbe EN TÊTE qui distingue.
    const c = t('note une nouvelle vente de 6 pots a 8 euros');
    expect(c.kind).toBe('ecriture');
  });

  it('LES VOISINS D’ÉCRITURE DOIVENT SURVIVRE', () => {
    // La récolte est une PRODUCTION, le stock un MOUVEMENT. Ni l'un ni l'autre
    // n'est une vente, et la vente est testée entre les deux.
    const r = t("j'ai recolte 25 kg de toutes fleurs");
    expect(r.kind === 'ecriture' && r.ecriture.action).toBe('recolte');
    const s = t('ajoute 12 pots au stock');
    expect(s.kind === 'ecriture' && s.ecriture.action).toBe('stock');
  });
});

describe('le catalogue et le flux ne peuvent plus diverger', () => {
  it('la vente est déclarée créatrice, et son autonomie exige une confirmation', () => {
    expect(MAYA_ACTIONS.vente.ecrit, 'la vente est redevenue un squelette').toBe(true);
    expect(
      MAYA_ACTIONS.vente.autonomie,
      'de l’argent ne s’écrit jamais sans accord explicite',
    ).toBe('jamais');
  });

  it('toute action déclarée créatrice a bien une branche d’écriture', () => {
    /**
     * ⚠️ C'EST PAR LÀ QUE LE TROU ÉTAIT PASSÉ. `vente` était au catalogue et
     * absente du type `Ecriture`, donc le classifieur ne POUVAIT pas la
     * produire — et rien ne le disait. Un garde de compilation le referme
     * désormais dans `copilote-actions.ts` ; ce cas-ci le dit en français, et
     * tombe si quelqu'un déclare une action créatrice sans la brancher.
     */
    const creatrices = (Object.keys(MAYA_ACTIONS) as ActionCreatrice[]).filter(
      (id) => MAYA_ACTIONS[id].ecrit,
    );
    expect(creatrices.length, 'le catalogue ne déclare plus aucune écriture').toBeGreaterThan(3);

    // Chaque action créatrice doit avoir une phrase qui la produit. Une action
    // qu'aucune phrase ne déclenche est une promesse invérifiable.
    const phraseTest: Record<string, string> = {
      // ⚠️ PAS « controle ruche 3 », ET C'EST UN DÉFAUT MESURÉ, PAS UN CAPRICE.
      // Cette forme-là rend aujourd'hui la fiche de savoir « inspections-ddpp »
      // — le contrôle apicole confondu avec l'inspection vétérinaire. Vérifié
      // sur le code d'AVANT ce chantier : c'est préexistant, pas une
      // régression. Le geste reste atteignable dès que la phrase porte des
      // observations, et c'est cette forme-là qu'on mesure ici. L'annonce nue
      // a son propre chantier.
      intervention: 'ruche 3 reine vue force 4',
      client: 'ajoute le client Dupont',
      recolte: "j'ai recolte 25 kg de toutes fleurs",
      stock: 'ajoute 12 pots au stock',
      vente: "j'ai vendu 12 pots a 8 euros",
      achat: "j'ai achete 200 euros de candi",
      rucher: 'cree un rucher les Tilleuls',
      ruche: 'ajoute une ruche',
      mortalite: "j'ai perdu la ruche 5",
    };
    for (const id of creatrices) {
      const phrase = phraseTest[id];
      expect(phrase, `aucune phrase de test pour l’action « ${id} »`).toBeDefined();
      const c = t(phrase!);
      expect(c.kind, `« ${phrase} » ne produit pas d’écriture`).toBe('ecriture');
      if (c.kind === 'ecriture') {
        expect(c.ecriture.action, `« ${phrase} » ne produit pas l’action « ${id} »`).toBe(id);
      }
    }
  });
});
