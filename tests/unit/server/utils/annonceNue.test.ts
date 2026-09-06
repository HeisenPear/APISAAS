import { describe, it, expect } from 'vitest';
import { classifierTour } from '~~/server/utils/copilote-local';
import { estActionEcriture, lireTypeIntervention } from '~~/server/utils/copilote-actions';
import { CATEGORIES_INTERVENTION } from '~~/app/types/interventions';

/**
 * L'ANNONCE NUE D'UN GESTE — LA PHRASE LA PLUS COURTE DU RUCHER, ET CELLE QUI
 * SERVAIT UN COURS.
 *
 * Un apiculteur qui a les mains dans la ruche dicte deux mots. Mesuré avant
 * correction :
 *
 *   « contrôle ruche 3 »    → la fiche « inspections-ddpp », c'est-à-dire le
 *                             contrôle apicole confondu avec l'inspection
 *                             VÉTÉRINAIRE — un article de réglementation servi
 *                             à quelqu'un qui vient de refermer une ruche
 *   « visite ruche 7 »      → « je n'ai pas compris »
 *   « inspection ruche 4 »  → « je n'ai pas compris »
 *   « commentaire ruche 4 » → « je n'ai pas compris »
 *
 * ⚠️ C'EST LA SECONDE FOIS QUE LA MÊME RÈGLE SE PAIE. Le chantier du varroa
 * avait déjà trouvé « j'ai traité la ruche 3 à l'Apivar » servant la fiche du
 * produit : la fiche gagne par DÉFAUT quand la phrase n'est pas reconnue comme
 * une écriture, jamais parce qu'on l'a jugée plus utile. On ne retire donc
 * rien au savoir — on rend l'écriture reconnaissable.
 */

const t = (phrase: string) => classifierTour([{ role: 'user' as const, content: phrase }]);
const action = (phrase: string): string => {
  const c = t(phrase);
  if (c.kind === 'ecriture') return `ecriture:${c.ecriture.action}`;
  if (c.kind === 'savoir') return `savoir:${(c as { articleId?: string }).articleId ?? ''}`;
  return c.kind;
};

describe('deux mots suffisent à raconter un geste', () => {
  it('garde-fou — le catalogue des gestes n’est pas vide', () => {
    // Tout ce banc itère sur les types réels : si la liste se vidait, la
    // conformité serait « vérifiée » sur zéro cas.
    expect(CATEGORIES_INTERVENTION.length, 'le catalogue des gestes a fondu').toBe(13);
  });

  it('les quatre formulations mesurées avant correction écrivent maintenant', () => {
    expect(action('controle ruche 3'), 'la fiche DDPP gagne encore').toBe('ecriture:intervention');
    expect(action('visite ruche 7')).toBe('ecriture:intervention');
    expect(action('inspection ruche 4')).toBe('ecriture:intervention');
    expect(action('commentaire ruche 4')).toBe('ecriture:intervention');
  });

  it('CHAQUE geste que Maya sait nommer s’annonce sur une ruche', () => {
    /**
     * ⚠️ CE CAS ITÈRE SUR LA SOURCE DE VÉRITÉ — `lireTypeIntervention`, la seule
     * fonction qui sache nommer un type. Un geste ajouté là-bas devient dictable
     * ici sans que personne y pense ; et un geste qui cesserait de l'être
     * tomberait immédiatement.
     *
     * Trois des treize catégories (`deplacement`, `empilement`, `transvasement`)
     * ne sont PAS encore reconnues par leur nom : elles sont comptées comme
     * dette, pas masquées. Le compte est exact, donc en reconnaître une de plus
     * fera tomber ce cas — et c'est le but : un progrès s'enregistre.
     */
    const muets = CATEGORIES_INTERVENTION.filter((cat) => lireTypeIntervention(cat) === undefined);
    expect(
      [...muets].sort(),
      'la liste des gestes que Maya ne sait pas nommer a changé — mets ce compte à jour',
    ).toEqual(['deplacement', 'empilement', 'materiel', 'transvasement']);

    const nommes = CATEGORIES_INTERVENTION.filter((cat) => lireTypeIntervention(cat) !== undefined);
    expect(nommes.length, 'le balayage ne voit plus aucun geste').toBe(9);
    for (const cat of nommes) {
      expect(
        estActionEcriture(`${cat} ruche 3`),
        `« ${cat} ruche 3 » n’est plus reconnue comme une écriture`,
      ).toBe(true);
    }
  });

  it('le matériel exige un VERBE, et c’est voulu', () => {
    /**
     * ⚠️ `materiel` FIGURE DANS LA DETTE CI-DESSUS POUR UNE AUTRE RAISON QUE LES
     * TROIS AUTRES, et les confondre serait une erreur de lecture. Nommer un
     * objet n'est pas le poser : le banc du varroa avait déjà dénoncé « rappel
     * acheter des cadres », qui est une NOTE. Sans le geste, on transforme une
     * liste de courses en intervention.
     *
     * Le geste, lui, doit passer — et « j'ai posé une hausse » est la phrase la
     * plus fréquente du printemps.
     */
    expect(estActionEcriture('pose une hausse ruche 3'), 'la pose d’une hausse est perdue').toBe(
      true,
    );
    expect(
      estActionEcriture('rappel acheter des cadres'),
      'une liste de courses est devenue une intervention',
    ).toBe(false);
  });

  it('il faut un NUMÉRO de ruche, pas le mot « ruche »', () => {
    /**
     * C'est ce qui sépare « contrôle ruche 3 » — UNE colonie, un geste raconté
     * — de « contrôle de mes ruches », qui parle du cheptel en général et peut
     * très bien être une question de réglementation.
     */
    expect(estActionEcriture('controle ruche 3')).toBe(true);
    expect(
      estActionEcriture('controle de mes ruches'),
      'une phrase sans ruche nommée est devenue une écriture',
    ).toBe(false);
  });
});

describe('la fiche reste servie à qui la DEMANDE', () => {
  it('les questions de réglementation gardent leur article', () => {
    /**
     * ⚠️ LE POINT ENTIER DU CHANTIER. On ne retire rien au savoir : on rend
     * l'écriture reconnaissable. Si ces trois-là basculaient en écriture, on
     * aurait remplacé un défaut par son symétrique — et le symétrique est pire,
     * parce qu'il ÉCRIT.
     */
    expect(action('c est quoi un controle sanitaire')).toMatch(/^savoir:/);
    expect(action('inspection ddpp')).toMatch(/^savoir:/);
    expect(action('la ddpp peut elle controler mes ruches')).toMatch(/^savoir:/);
  });

  it('une question sur un geste ne l’enregistre pas', () => {
    // `estQuestion` est évalué AVANT l'annonce nue, et c'est ce qui tient la
    // frontière. Une inversion de ces deux lignes ferait écrire sur une question.
    expect(estActionEcriture('controle ruche 3', true), 'une question a écrit').toBe(false);
    expect(estActionEcriture('pesee ruche 5', true)).toBe(false);
  });

  it('une question sur la règle n’écrit jamais', () => {
    expect(estActionEcriture('faut il faire un controle sur la ruche 3')).toBe(false);
    expect(estActionEcriture('est ce que je dois peser la ruche 5')).toBe(false);
  });
});
