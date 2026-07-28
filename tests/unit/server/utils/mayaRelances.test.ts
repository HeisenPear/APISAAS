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
