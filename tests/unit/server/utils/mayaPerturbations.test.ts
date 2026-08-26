import { describe, expect, it } from 'vitest';
import { classifierTour } from '~~/server/utils/copilote-local';
import { CORPUS, type CasQuestion } from '../../../corpus/mayaQuestions.mts';
import { PERTURBATIONS } from '../../../corpus/perturbations.mts';

/**
 * MESURER L'ANTICIPATION, PAS LA RÉPÉTITION.
 *
 * Un corpus écrit à la main finit par se mesurer lui-même : cent questions
 * rédigées par quelqu'un qui connaît le moteur ressemblent à ce que le moteur
 * sait lire. Le score monte, la capacité ne bouge pas, et personne ne peut le
 * voir puisque l'instrument et l'objet ont la même origine.
 *
 * Le perturbateur casse ce cercle sans écrire une question de plus. Dix
 * transformations DÉTERMINISTES appliquées aux 102 questions produisent
 * 1 020 mesures que personne n'a rédigées, et qu'on ne peut donc pas
 * « optimiser » autrement qu'en améliorant vraiment la robustesse.
 *
 * ⚠️ ON NE MESURE QUE LES CAS DÉJÀ RÉUSSIS. Une question que Maya ne comprend
 * pas encore ne dit rien sur sa résistance au bruit : l'inclure mélangerait
 * deux dettes distinctes, et le chiffre ne voudrait plus rien dire.
 */

const decide = (q: string): string => {
  const c = classifierTour([{ role: 'user', content: q }]);
  return c.kind === 'action'
    ? `action:${c.intent}`
    : c.kind === 'savoir'
      ? `savoir:${c.articleId}`
      : c.kind;
};

/** Les cas que Maya traite déjà correctement — la seule base de comparaison honnête. */
const REFERENCE: { cas: CasQuestion; verdict: string }[] = CORPUS.map((cas) => ({
  cas,
  verdict: decide(cas.question),
})).filter(({ cas, verdict }) => {
  if (cas.attendu === 'action') return verdict === `action:${cas.intent ?? ''}` || !cas.intent;
  if (cas.attendu === 'savoir')
    return cas.articleId ? verdict === `savoir:${cas.articleId}` : verdict.startsWith('savoir:');
  return verdict === cas.attendu;
});

interface Mesure {
  nom: string;
  preserveLeSens: boolean;
  total: number;
  tenus: number;
  perdus: string[];
}

const MESURES: Mesure[] = PERTURBATIONS.map((p) => {
  const perdus: string[] = [];
  let tenus = 0;
  for (const { cas, verdict } of REFERENCE) {
    const transformee = p.appliquer(cas.question);
    // Une transformation qui ne change rien ne mesure rien : on l'ignore.
    if (transformee === cas.question) {
      tenus += 1;
      continue;
    }
    if (decide(transformee) === verdict) tenus += 1;
    else perdus.push(`« ${cas.question} » → « ${transformee} »`);
  }
  return { nom: p.nom, preserveLeSens: p.preserveLeSens, total: REFERENCE.length, tenus, perdus };
});

/**
 * Planchers GELÉS au niveau mesuré, transformation par transformation.
 *
 * ⚠️ SEPT SONT À 100 %, TROIS NE LE SONT PAS — ET C'EST LE PLUS INTÉRESSANT.
 *
 * Les transformations de FORME (accents, ponctuation, casse, espaces,
 * apostrophes) ne changent rien à ce qui est demandé : leur cible est 100 %, et
 * tout écart signifie que le moteur trébuche sur l'habillage au lieu de lire le
 * fond. Elles y sont, et elles doivent y rester.
 *
 * Les trois autres portent une DETTE CHIFFRÉE, et l'écrire vaut mieux que de
 * l'arrondir :
 *
 *  · LETTRES INVERSÉES — 73,5 %. C'était 46,1 % avant cette session : le
 *    correcteur ne connaissait pas l'inversion, la faute de frappe la plus
 *    courante au monde. Deux corrections l'ont montée à 73,5 %. Le reste tient
 *    au LEXIQUE, qui est curé (mots apicoles + mots de logique) : « faire »,
 *    « bonjour » ou « sanitaire » n'y sont pas, donc « fiare » n'a rien à quoi
 *    se raccrocher. Y verser du français général serait un autre chantier, avec
 *    son propre risque de fausses corrections.
 *  · LETTRE EN TROP — 77,5 %, même cause.
 *  · TRONQUÉE — 64,7 %, et elle n'a PAS à monter à 100 : une phrase coupée en
 *    a perdu une partie. Exiger la même réponse reviendrait à exiger qu'elle
 *    devine.
 *
 * ⚠️ ET UNE PART DE CES ÉCHECS EST IRRÉDUCTIBLE PAR CONSTRUCTION. La famille
 * « fautes » du corpus contient déjà des questions mal orthographiées (« ma
 * ruche est orfeline ») : les perturber produit une DOUBLE faute, hors de
 * portée d'un correcteur à distance 1. Le perturbateur vise en plus le mot le
 * plus LONG de chaque phrase — souvent celui qui porte le sens. C'est un test
 * plus dur que la moyenne réelle, et c'est délibéré.
 */
const PLANCHERS: Record<string, number> = {
  'sans accents': 100,
  'sans ponctuation': 100,
  'tout en minuscules': 100,
  'TOUT EN MAJUSCULES': 100,
  'apostrophe droite': 100,
  'espaces doublés': 100,
  'sans accents ni ponctuation': 100,
  // Dette chiffrée — à remonter à chaque progrès, jamais à baisser.
  'lettre en trop': 77,
  'lettres inversées': 73,
  'tronquée aux deux tiers': 64,
};

describe('perturbateur — ce que Maya tient quand la phrase est abîmée', () => {
  it('imprime la résistance au bruit', () => {
    const lignes = [
      '',
      `PERTURBATEUR — ${REFERENCE.length} cas de référence × ${PERTURBATIONS.length} transformations`,
      '='.repeat(64),
    ];
    for (const m of MESURES) {
      const pct = (m.tenus / m.total) * 100;
      const barre = '#'.repeat(Math.round(pct / 5)).padEnd(20, '.');
      lignes.push(
        `  ${m.nom.padEnd(30)} ${barre} ${m.tenus}/${m.total}  ${pct.toFixed(1)} %${m.preserveLeSens ? '' : '  (sens érodé)'}`,
      );
    }
    for (const m of MESURES.filter((x) => x.perdus.length && x.preserveLeSens)) {
      lignes.push('', `Perdus — ${m.nom}`, '-'.repeat(64));
      for (const p of m.perdus.slice(0, 12)) lignes.push(`  ${p}`);
      if (m.perdus.length > 12) lignes.push(`  … et ${m.perdus.length - 12} autres`);
    }
    console.log(lignes.join('\n'));
    expect(MESURES).toHaveLength(PERTURBATIONS.length);
  });

  it('la référence n’est pas vide (garde-fou du banc)', () => {
    // Sans ce contrôle, une référence vide rendrait toutes les mesures à 0/0,
    // donc à 100 % — le banc affirmerait une robustesse qu'il n'a pas mesurée.
    expect(REFERENCE.length).toBeGreaterThan(80);
  });

  it('chaque transformation a son plancher', () => {
    const sans = PERTURBATIONS.filter((p) => !(p.nom in PLANCHERS)).map((p) => p.nom);
    expect(sans, 'transformation non gardée par un plancher').toEqual([]);
  });

  it.each(MESURES.filter((m) => m.preserveLeSens).map((m) => [m.nom, m] as const))(
    '%s — le sens est préservé, donc la décision aussi',
    (nom, m) => {
      /**
       * Cliquet à 100 %, et c'est justifié : retirer les accents, doubler une
       * espace ou passer en majuscules ne change RIEN à ce que l'apiculteur
       * demande. Une perte ici n'est pas une nuance de compréhension, c'est le
       * moteur qui trébuche sur la forme au lieu de lire le fond.
       */
      const attendu = PLANCHERS[nom]!;
      const pct = (m.tenus / m.total) * 100;
      expect(pct, `${nom} — perdus :\n${m.perdus.slice(0, 8).join('\n')}`).toBeGreaterThanOrEqual(
        attendu,
      );
    },
  );

  it('le cliquet se RESSERRE aussi ici', () => {
    // Même principe que pour le corpus : un plancher laissé sous le niveau réel
    // autorise silencieusement une régression jusqu'à ce niveau. Le progrès a
    // été fait, personne ne l'a gravé, et il se reperd.
    const aRelever = MESURES.filter((m) => {
      const pct = (m.tenus / m.total) * 100;
      return pct - PLANCHERS[m.nom]! >= 1;
    }).map(
      (m) => `${m.nom} : ${((m.tenus / m.total) * 100).toFixed(1)} %, plancher ${PLANCHERS[m.nom]}`,
    );
    expect(aRelever, 'remonte ces planchers — un progrès qu’on n’enregistre pas se reperd').toEqual(
      [],
    );
  });

  it('tronquée aux deux tiers — on MESURE, on n’exige pas', () => {
    /**
     * ⚠️ CELLE-CI NE PEUT PAS AVOIR UN CLIQUET À 100 %, ET LE PRÉTENDRE SERAIT
     * MALHONNÊTE. « Est-ce que je peux poser les hausses maintenant » tronquée
     * donne « est-ce que je peux poser les » — la question n'est plus la même.
     * Exiger que Maya réponde pareil reviendrait à exiger qu'elle devine.
     *
     * On garde donc le NIVEAU ATTEINT comme plancher : il empêche la régression
     * sans réclamer l'impossible. C'est ce qui fait la différence entre un banc
     * qu'on lit et un banc qu'on désactive.
     */
    const m = MESURES.find((x) => x.nom === 'tronquée aux deux tiers')!;
    expect(m.tenus / m.total).toBeGreaterThanOrEqual(PLANCHERS['tronquée aux deux tiers']! / 100);
  });
});
