import { describe, expect, it } from 'vitest';
import { composerBrief, type ContexteBrief } from '../../../../server/utils/maya-brief';
import { classifier } from '../../../../server/utils/copilote-local';

/**
 * Les cartes contextuelles tendent une PERCHE : « je peux t'aider à trier tout
 * ça » suivi d'une question cliquable, envoyée telle quelle au moteur.
 *
 * La règle du projet est stricte — toute suggestion émise DOIT re-router. Une
 * perche que Maya ne saurait pas comprendre serait la pire des expériences :
 * elle propose une question, l'apiculteur clique, et elle répond « je n'ai pas
 * bien saisi ». Ce banc l'interdit, sur les deux états de chaque contexte.
 */
const CONTEXTES: ContexteBrief[] = ['ruches', 'meteo', 'alertes', 'stocks', 'calendrier'];

/** Entrées minimales : aucun fait → carte « calme ». */
function briefCalme(contexte: ContexteBrief) {
  return composerBrief({
    heure: 9,
    ruches: [],
    alertes: [],
    stocks: [],
    meteo: { erreur: 'indisponible' },
    mois: 3,
    contexte,
    maintenant: Date.UTC(2026, 6, 28, 7),
  });
}

/** Une ruche jamais visitée et un stock bas → il y a matière, carte « pleine ». */
function briefCharge(contexte: ContexteBrief) {
  return composerBrief({
    heure: 9,
    ruches: [
      {
        id: 'r1',
        numero: '1',
        statut: 'active',
        scoreSante: 20,
        joursDepuisVisite: 90,
        derniereVisite: new Date(Date.UTC(2026, 3, 1)),
      } as never,
    ],
    alertes: [
      { id: 'a1', priorite: 'critique', createdAt: new Date(Date.UTC(2026, 6, 28)) } as never,
    ],
    stocks: [{ id: 's1', sousLeSeuil: true } as never],
    meteo: { erreur: 'indisponible' },
    mois: 3,
    contexte,
    maintenant: Date.UTC(2026, 6, 28, 7),
  });
}

describe('perches des cartes contextuelles', () => {
  it('en propose une dans chaque contexte, calme ou chargé', () => {
    for (const c of CONTEXTES) {
      expect(briefCalme(c).relance, `${c} calme`).toBeDefined();
      expect(briefCharge(c).relance, `${c} chargé`).toBeDefined();
    }
  });

  it('ne pose JAMAIS une question que Maya ne sait pas router', () => {
    for (const c of CONTEXTES) {
      for (const brief of [briefCalme(c), briefCharge(c)]) {
        const q = brief.relance!.question;
        const kind = classifier(q).kind;
        // « inconnu » = « je n'ai pas bien saisi ta demande » : exactement ce
        // qu'une perche ne doit jamais provoquer.
        expect(kind, `${c} → ${q}`).not.toBe('inconnu');
        expect(kind, `${c} → ${q}`).not.toBe('suggestion');
      }
    }
  });

  it('accompagne la question d’une amorce, jamais d’un ordre sec', () => {
    for (const c of CONTEXTES) {
      const { amorce, question } = briefCharge(c).relance!;
      expect(amorce.length, c).toBeGreaterThan(10);
      expect(question.length, c).toBeGreaterThan(10);
      // Le libellé du bouton EST la question envoyée : l'apiculteur doit voir
      // exactement ce qui sera demandé en son nom.
      expect(question.trim(), c).toBe(question);
    }
  });

  it('laisse le brief du jour SANS perche — ce n’est pas une carte', () => {
    const brief = composerBrief({
      heure: 9,
      ruches: [],
      alertes: [],
      stocks: [],
      meteo: { erreur: 'indisponible' },
      mois: 3,
      maintenant: Date.UTC(2026, 6, 28, 7),
    });
    expect(brief.relance).toBeUndefined();
  });
});

/**
 * LES OFFRES D'AIDE PAR CONSTAT — la même règle, un cran plus bas.
 *
 * Les items du brief CONSTATAIENT et renvoyaient vers une page : un panneau
 * indicateur, pas une assistante. Chacun porte désormais une offre — « qu'est-ce
 * qui peut leur arriver ? », « organise-moi la tournée » — qui engage Maya à
 * faire quelque chose plutôt qu'à pointer une porte.
 *
 * La règle du projet ne change pas d'un iota : une question proposée DOIT
 * re-router. Une offre que Maya ne saurait pas comprendre serait pire que pas
 * d'offre du tout — elle propose, on clique, elle répond « je n'ai pas saisi ».
 */
describe('offres d’aide portées par les items du brief', () => {
  /** Un brief matinal COMPLET : chaque famille d'item est déclenchée. */
  function briefComplet() {
    return composerBrief({
      heure: 9,
      ruches: [
        {
          id: 'r1',
          numero: '1',
          statut: 'active',
          scoreSante: 20,
          joursDepuisVisite: 90,
          derniereVisite: '2026-01-01',
        },
      ],
      alertes: [{ id: 'a1', titre: 'Essaimage', priorite: 'haute', createdAt: '2026-07-27' }],
      stocks: [{ id: 's1', nom: 'Cadres', sousLeSeuil: true }],
      meteo: {
        previsions: [
          { date: '2026-07-29', scoreVisite: 85, conditions: 'Ciel dégagé', tempMax: 22 },
        ],
      },
      mois: 6,
      maintenant: Date.UTC(2026, 6, 28, 7),
    });
  }

  it('les constats actionnables en portent une', () => {
    const avecOffre = briefComplet().items.filter((it) => it.offre);
    // Cinq familles d'item sur six ; la note de saison n'est pas un constat.
    expect(avecOffre.length, 'aucune offre dans un brief pourtant chargé').toBeGreaterThanOrEqual(
      4,
    );
  });

  it('ne propose JAMAIS une question que Maya ne sait pas router', () => {
    for (const it of briefComplet().items) {
      if (!it.offre) continue;
      const kind = classifier(it.offre.question).kind;
      expect(kind, `${it.offre.libelle} → ${it.offre.question}`).not.toBe('inconnu');
      expect(kind, `${it.offre.libelle} → ${it.offre.question}`).not.toBe('suggestion');
    }
  });

  it('le constat des colonies fragiles ouvre sur la PROJECTION', () => {
    /**
     * L'offre la plus utile du lot, et celle qui justifie le mécanisme : elle
     * mène du constat à l'anticipation. Sans elle, personne n'aurait pensé à
     * demander une projection depuis une carte de brief.
     */
    const fragile = briefComplet().items.find((it) => it.ton === 'clay' && it.to === '/ruches');
    expect(
      fragile?.offre,
      'le constat des colonies fragiles doit proposer une suite',
    ).toBeDefined();
    const c = classifier(fragile!.offre!.question);
    expect(c.kind).toBe('action');
    if (c.kind !== 'action') return;
    expect(c.intent).toBe('prediction');
  });

  it('le libellé du bouton diffère de la question — il invite, il ne récite pas', () => {
    // La perche de carte affiche la question telle quelle (l'apiculteur voit ce
    // qui part). Une offre est plus courte : elle tient à côté d'un constat, et
    // c'est le constat qui porte déjà le contexte.
    for (const it of briefComplet().items) {
      if (!it.offre) continue;
      expect(it.offre.libelle.length, it.offre.libelle).toBeGreaterThan(5);
      expect(it.offre.libelle.length, it.offre.libelle).toBeLessThanOrEqual(40);
    }
  });

  it('la note de saison ne propose rien — ce n’est pas un constat actionnable', () => {
    const saison = briefComplet().items.find((it) => it.ton === 'neutre' && !it.to);
    expect(saison, 'la note de saison doit exister').toBeDefined();
    expect(saison!.offre).toBeUndefined();
  });
});
