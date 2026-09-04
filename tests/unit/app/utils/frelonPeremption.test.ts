// ═══════════════════════════════════════════════════════════════════════════
// UN SIGNALEMENT DE FRELON SUR LEQUEL PLUS PERSONNE NE DONNE DE NOUVELLES.
//
// ─── LES TROIS DÉFAUTS, ENSEMBLE ───────────────────────────────────────────
// La décroissance de fiabilité existait (`DECAY_JOURS = 75`) mais n'avait
// AUCUNE HORLOGE : `recomputeSignalement()` n'était appelé que sur un vote. Un
// signalement que personne ne touchait gardait son score à vie. Et quand elle
// s'appliquait, elle était fausse de trois façons :
//
//   1. elle ne se déclenchait QUE si `confirmations === 0` — une seule
//      confirmation la désactivait POUR TOUJOURS ;
//   2. elle était plafonnée à −40, donc ne pouvait jamais atteindre zéro ;
//   3. elle mesurait l'âge depuis `createdAt`, jamais depuis le dernier signe
//      de vie — confirmer un nid ne le rajeunissait pas.
//
// Cumulés : un nid confirmé une fois puis oublié pendant DEUX ANS s'affichait
// à 62/100 sur la carte, présenté à l'apiculteur comme une information fiable.
// Ces chiffres sont calculés plus bas, pas supposés.
//
// ─── POURQUOI « PÉRIMÉ » N'EST PAS UN STATUT ───────────────────────────────
// Ajouter une cinquième valeur à `FrelonStatut` aurait cassé en silence ce qui
// l'indexe : `statsFrelon` fait `s[n.statut] += 1` sur un objet à quatre clés,
// et un statut inconnu y produit `NaN` — le compteur affiché à l'apiculteur
// devient vide sans qu'aucune erreur ne remonte. Un cas ci-dessous le prouve.
//
// ─── MUTATIONS QUI DOIVENT FAIRE ROUGIR ────────────────────────────────────
//   · remettre la garde `v.confirmations === 0` sur la décroissance ;
//   · remettre le plafond `Math.min(40, …)` ;
//   · faire compter `dernierSigneDeVie` depuis la création seule ;
//   · faire compter les infirmations comme un signe de vie.
// ═══════════════════════════════════════════════════════════════════════════

import { describe, expect, it } from 'vitest';
import {
  DECAY_JOURS,
  PEREMPTION_JOURS,
  dernierSigneDeVie,
  estPerime,
  scoreFiabilite,
  messageDeSilence,
  silenceEnJours,
} from '~~/app/utils/frelonFiabilite';
import { statsFrelon } from '~~/app/utils/frelon';
import type { FrelonStatut } from '~~/app/config/frelon';

const AUCUN = { confirmations: 0, infirmations: 0, destructions: 0 };
const CONFIRME_UNE_FOIS = { confirmations: 1, infirmations: 0, destructions: 0 };

describe('la décroissance mesure le SILENCE, pas l’âge', () => {
  it('GARDE-FOU : un signalement tout frais garde un score plein', () => {
    // Sans lui, une décroissance devenue trop agressive effacerait la carte
    // entière et les règles suivantes seraient « vérifiées » sur du vide.
    expect(scoreFiabilite(AUCUN, 0, 0)).toBe(50);
    expect(scoreFiabilite(CONFIRME_UNE_FOIS, 0, 0)).toBe(62);
  });

  it('LE DÉFAUT EXACT : un nid confirmé puis oublié deux ans finit par tomber', () => {
    // Avant : la garde `confirmations === 0` désactivait la décroissance dès la
    // première confirmation, et le score restait à 62/100 indéfiniment.
    const deuxAns = 730;
    expect(scoreFiabilite(CONFIRME_UNE_FOIS, 0, 0)).toBe(62);
    expect(scoreFiabilite(CONFIRME_UNE_FOIS, 0, deuxAns)).toBe(0);
  });

  it('le plafond de −40 a disparu : un abandon peut atteindre zéro', () => {
    // Avant : `Math.min(40, …)` empêchait de descendre sous 10/100 pour un
    // auteur neutre — c'est-à-dire d'être reconnaissable comme périmé.
    const tresVieux = DECAY_JOURS * 10;
    expect(scoreFiabilite(AUCUN, 0, tresVieux)).toBe(0);
  });

  it('la décroissance est PROGRESSIVE, pas un interrupteur', () => {
    const scores = [0, 30, 60, 90].map((j) => scoreFiabilite(AUCUN, 0, j));
    for (let i = 1; i < scores.length; i++) {
      expect(scores[i]!, `à ${[0, 30, 60, 90][i]} jours`).toBeLessThan(scores[i - 1]!);
    }
  });

  it('une infirmation pèse toujours plus qu’une confirmation', () => {
    // L'asymétrie anti-faux d'origine ne doit pas avoir été emportée.
    expect(scoreFiabilite({ ...AUCUN, infirmations: 1 }, 0, 0)).toBeLessThan(
      scoreFiabilite(AUCUN, 0, 0),
    );
    expect(scoreFiabilite({ ...AUCUN, confirmations: 1 }, 0, 0)).toBeGreaterThan(
      scoreFiabilite(AUCUN, 0, 0),
    );
  });
});

describe('dernierSigneDeVie — ce qui compte comme « il est toujours là »', () => {
  const CREATION = new Date('2026-01-10T08:00:00Z');
  const PLUS_TARD = new Date('2026-06-10T08:00:00Z');
  const AVANT = new Date('2025-12-01T08:00:00Z');

  it('GARDE-FOU : sans confirmation, c’est la date de création', () => {
    expect(dernierSigneDeVie(CREATION, null).toISOString()).toBe(CREATION.toISOString());
    expect(dernierSigneDeVie(CREATION, undefined).toISOString()).toBe(CREATION.toISOString());
  });

  it('LA RÈGLE : une confirmation plus récente rajeunit le signalement', () => {
    expect(dernierSigneDeVie(CREATION, PLUS_TARD).toISOString()).toBe(PLUS_TARD.toISOString());
  });

  it('une confirmation ANTÉRIEURE ne vieillit rien', () => {
    // Défensif : l'horodatage vient de la base, mais un import ou un
    // rattrapage pourrait poser une date antérieure. `greatest`, jamais
    // « la dernière valeur trouvée ».
    expect(dernierSigneDeVie(CREATION, AVANT).toISOString()).toBe(CREATION.toISOString());
  });

  it('le silence ne devient jamais négatif', () => {
    // Une horloge serveur en retard sur la base produirait sinon un score
    // BONIFIÉ par le futur.
    expect(silenceEnJours(PLUS_TARD, CREATION)).toBe(0);
  });

  it('le silence se compte en jours pleins', () => {
    const dix = new Date(CREATION.getTime() + 10 * 86_400_000);
    expect(silenceEnJours(CREATION, dix)).toBeCloseTo(10, 6);
  });
});

describe('la péremption', () => {
  it('GARDE-FOU : un signalement récent n’est pas périmé', () => {
    expect(estPerime(0)).toBe(false);
    expect(estPerime(PEREMPTION_JOURS - 1)).toBe(false);
  });

  it('LA RÈGLE : au-delà du seuil, il quitte la carte', () => {
    expect(estPerime(PEREMPTION_JOURS)).toBe(true);
    expect(estPerime(PEREMPTION_JOURS + 365)).toBe(true);
  });

  it('le seuil couvre une saison entière — un nid est ANNUEL', () => {
    // Un nid de frelon asiatique est fondé au printemps et déserté après les
    // premières gelées. Un seuil trop court effacerait des nids encore actifs
    // que personne n'a pris le temps de reconfirmer ; trop long, la carte
    // garderait des nids morts depuis deux hivers.
    expect(PEREMPTION_JOURS).toBeGreaterThanOrEqual(90);
    expect(PEREMPTION_JOURS).toBeLessThanOrEqual(365);
  });
});

describe('on annonce la disparition avant qu’elle n’arrive', () => {
  it('GARDE-FOU : un signalement frais ne dit RIEN', () => {
    // La carte reste silencieuse quand tout va bien. Sans ce cas, un message
    // permanent passerait pour un avertissement utile.
    expect(messageDeSilence(0)).toBeNull();
    expect(messageDeSilence(PEREMPTION_JOURS - 40)).toBeNull();
  });

  it('LA RÈGLE : à l’approche du seuil, il nomme l’échéance ET le geste', () => {
    // Un nid qui s'efface sans prévenir est une information perdue :
    // l'apiculteur qui le croise chaque semaine n'a aucune raison de le
    // confirmer s'il ignore qu'il va partir.
    const m = messageDeSilence(PEREMPTION_JOURS - 14);
    expect(m).not.toBeNull();
    expect(m!, 'l’échéance').toMatch(/semaine/);
    expect(m!, 'la sortie de secours').toMatch(/confirmez-le/i);
  });

  it('une fois périmé, il le dit au passé', () => {
    expect(messageDeSilence(PEREMPTION_JOURS + 10)).toMatch(/a quitté la carte/);
  });

  it('jamais « dans 0 semaine » ni un pluriel fautif', () => {
    // Le compte à rebours passe par tous les jours du dernier mois : aucun ne
    // doit produire une phrase bancale.
    for (let j = PEREMPTION_JOURS - 30; j < PEREMPTION_JOURS; j++) {
      const m = messageDeSilence(j)!;
      expect(m, `à ${j} jours`).not.toMatch(/dans 0 /);
      expect(m, `à ${j} jours`).not.toMatch(/1 semaines/);
    }
  });
});

describe('pourquoi « périmé » n’est PAS une valeur d’énumération', () => {
  it('un statut inconnu casserait le compteur, en silence', () => {
    // C'est la raison de la conception, et elle se mesure : `statsFrelon` fait
    // `s[n.statut] += 1` sur un objet aux quatre clés connues. Un cinquième
    // statut y produit `NaN` — le total affiché à l'apiculteur devient vide,
    // sans qu'aucune erreur ne remonte nulle part.
    const avecInconnu = statsFrelon([{ statut: 'perime' as unknown as FrelonStatut }]);
    expect(
      Number.isNaN((avecInconnu as unknown as Record<string, number>).perime),
      'si ce cas devient FAUX, `statsFrelon` a été rendu robuste — la péremption ' +
        'peut alors redevenir un statut, et ce commentaire doit être réécrit.',
    ).toBe(true);
  });

  it('les quatre statuts connus, eux, se comptent bien', () => {
    const s = statsFrelon([
      { statut: 'a_verifier' },
      { statut: 'confirme' },
      { statut: 'confirme' },
      { statut: 'rejete' },
      { statut: 'detruit' },
    ]);
    expect(s).toMatchObject({ total: 5, a_verifier: 1, confirme: 2, rejete: 1, detruit: 1 });
    expect(s.actifs, 'ni détruit ni rejeté').toBe(3);
  });
});
