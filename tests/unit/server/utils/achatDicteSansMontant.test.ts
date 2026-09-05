import { describe, it, expect } from 'vitest';
import { classifierTour } from '~~/server/utils/copilote-local';
import { analyserAchat } from '~~/server/utils/copilote-actions';

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * « NOTE UN ACHAT DE SIROP » PARTAIT SUR UNE INTERVENTION.
 *
 * ─── LE DÉFAUT, MESURÉ AVANT CORRECTION ────────────────────────────────────
 *   « note un achat de sirop »     → INTERVENTION, « sur quelle ruche ? »
 *   « note une dépense de sirop »  → INTERVENTION
 *   « note un achat de candi »     → INTERVENTION
 *
 * `analyserAchat` renonçait faute de montant, et le nourrissement ramassait la
 * phrase derrière lui — le sirop et le candi étant précisément ce qu'on donne
 * aux colonies. L'apiculteur qui note sa facture de sirop s'entendait demander
 * sur quelle ruche il l'avait versé.
 *
 * ─── LA RÈGLE, EMPRUNTÉE À LA VENTE ────────────────────────────────────────
 * Un NOM seul ne raconte rien (« mes achats » se consulte) ; un nom précédé
 * d'un ORDRE d'enregistrement est une écriture. La vente porte cette règle
 * depuis toujours. L'achat l'applique désormais — et le montant manquant part
 * dans `manque`, donc Maya demande « combien ? ».
 *
 * ─── CE QUI NE DOIT SURTOUT PAS BOUGER ─────────────────────────────────────
 * La moitié de ce banc. Un analyseur d'achat qui réclame trop vole les
 * LECTURES, les PENSE-BÊTES et surtout les INTERVENTIONS de nourrissement,
 * qui parlent du même sirop.
 *
 * ⚠️ ET LE SOUHAIT N'EST PAS UN ORDRE, ICI. « je veux enregistrer une vente »
 * est un ordre — le souhait porte sur l'enregistrement. « je veux acheter des
 * cadres » est une intention — le souhait porte sur l'ACHAT. Confondre les
 * deux écrirait une charge que personne n'a payée.
 * ═══════════════════════════════════════════════════════════════════════════
 */
const classer = (phrase: string) => classifierTour([{ role: 'user' as const, content: phrase }]);

/** L'action produite par une phrase, ou le genre du tour s'il n'écrit pas. */
function issue(phrase: string): string {
  const c = classer(phrase);
  return c.kind === 'ecriture' ? c.ecriture.action : c.kind;
}

describe('une dépense dictée sans montant est une dépense', () => {
  it('GARDE-FOU : le classifieur répond, et distingue deux issues connues', () => {
    // Sans ce cas, un classifieur en panne rendrait tout le banc vrai à vide.
    expect(issue("j'ai acheté du sirop"), 'le cas déjà correct avant ce correctif').toBe('achat');
    expect(
      issue('note un controle sur la ruche 1'),
      'une intervention reste une intervention',
    ).toBe('intervention');
  });

  it.each([
    'note un achat de sirop',
    'note une depense de sirop',
    'note un achat de candi',
    'enregistre un achat de sirop',
    'ajoute une depense de carburant',
  ])('« %s » est une dépense, pas une visite de ruche', (phrase) => {
    expect(
      issue(phrase),
      'la phrase repart sur une intervention : Maya demandera « sur quelle ruche ? » ' +
        'à quelqu’un qui note une facture.',
    ).toBe('achat');
  });

  it('le montant manquant se DEMANDE, il ne fait plus renoncer', () => {
    const p = analyserAchat('note un achat de sirop', 'note un achat de sirop');
    expect(p, 'l’analyseur renonce encore').not.toBeNull();
    expect(p!.manque, 'Maya doit demander le montant, pas l’inventer').toContain('montant');
    expect(p!.montantUnitaireTtc, 'aucun montant ne doit être supposé').toBeUndefined();
    expect(p!.designation, 'ce qui est acheté doit survivre à l’analyse').toMatch(/sirop/);
  });

  describe('ce qui ne doit PAS devenir une dépense', () => {
    it.each([
      ['je veux acheter des cadres', 'un SOUHAIT d’achat n’est pas une charge engagée'],
      ['rappel acheter des cadres', 'un pense-bête n’est pas une charge'],
      ['il faut que j achete des cadres', 'une intention future n’est pas une charge'],
    ])('« %s » — %s', (phrase) => {
      expect(
        issue(phrase),
        'une charge que personne n’a payée fausserait le résultat de l’exercice',
      ).not.toBe('achat');
    });

    it.each(['montre mes achats', 'combien j ai depense ce mois'])(
      '« %s » reste une LECTURE',
      (phrase) => {
        expect(issue(phrase), 'consulter n’est pas écrire').not.toBe('achat');
      },
    );

    it('le nourrissement au sirop reste une intervention', () => {
      /**
       * Le voisin le plus proche, et le plus facile à voler : il parle du même
       * sirop. C'est bien un geste sur une colonie, pas une facture.
       */
      expect(issue('note un nourrissement au sirop sur la ruche 3')).toBe('intervention');
    });
  });
});
