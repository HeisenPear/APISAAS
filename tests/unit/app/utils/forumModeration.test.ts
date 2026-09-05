import { describe, it, expect } from 'vitest';
import {
  SEUIL_MASQUAGE,
  SIGNALEMENTS_RETABLIS_AVANT_SUSPENSION,
  FORUM_MAX_MESSAGES_PAR_JOUR,
  FORUM_MAX_SUJETS_PAR_JOUR,
  FORUM_MAX_SIGNALEMENTS_PAR_JOUR,
  statutMessage,
  peutSignaler,
  refusTropDeMessages,
  REFUS_SIGNALEMENT_SUSPENDU,
} from '../../../../app/utils/forumModeration';
import { MOTIFS_ABUS, TEXTE_MESSAGE_MASQUE } from '../../../../app/config/forum';

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * LA MODÉRATION DU FORUM — DES RÈGLES PURES, ET LES CHIFFRES DE L'APICULTEUR.
 *
 * Le forum est la PREMIÈRE surface de ce produit où du texte écrit par un
 * inconnu est lu par un autre inconnu. Tout ce qui décide du sort d'un message
 * vit donc ici, en fonctions pures — pas dans une route, pas dans un écran.
 *
 * ⚠️ DEUX DE CES NOMBRES SONT DES DÉCISIONS, PAS DES CONSTANTES. Le seuil de
 * masquage (3 comptes distincts) et le caractère DÉFINITIF de la suspension du
 * droit de signaler ont été tranchés par l'apiculteur. Ce banc les fige : les
 * changer doit être un geste conscient, qui fait rougir un cas nommé.
 * ═══════════════════════════════════════════════════════════════════════════
 */
describe('les chiffres tranchés par l’apiculteur', () => {
  it('GARDE-FOU : les seuils sont des nombres exploitables', () => {
    // Sans ce cas, une constante devenue `undefined` par un renommage ferait
    // passer toutes les comparaisons ci-dessous (`x >= undefined` est faux).
    for (const [nom, v] of Object.entries({
      SEUIL_MASQUAGE,
      SIGNALEMENTS_RETABLIS_AVANT_SUSPENSION,
      FORUM_MAX_MESSAGES_PAR_JOUR,
      FORUM_MAX_SUJETS_PAR_JOUR,
      FORUM_MAX_SIGNALEMENTS_PAR_JOUR,
    })) {
      expect(Number.isInteger(v), `${nom} n’est plus un entier`).toBe(true);
      expect(v, `${nom} doit être strictement positif`).toBeGreaterThan(0);
    }
  });

  it('le masquage se déclenche à TROIS comptes distincts', () => {
    /**
     * Décision de l'apiculteur. La faire bouger sans le lui demander changerait
     * la modération de tout le forum : plus bas, deux personnes qui s'entendent
     * font taire n'importe qui ; plus haut, sur une communauté jeune, le seuil
     * n'est jamais atteint et le masquage devient décoratif.
     */
    expect(SEUIL_MASQUAGE).toBe(3);
  });

  it('le droit de signaler se perd après TROIS signalements rétablis', () => {
    expect(SIGNALEMENTS_RETABLIS_AVANT_SUSPENSION).toBe(3);
  });
});

describe('le sort d’un message', () => {
  it('GARDE-FOU : les trois issues sont atteignables', () => {
    // Un `statutMessage` qui rendrait toujours la même chose ferait passer
    // toutes les règles ci-dessous.
    expect(statutMessage({ signalements: 0 })).toBe('visible');
    expect(statutMessage({ signalements: SEUIL_MASQUAGE })).toBe('masque');
    expect(statutMessage({ signalements: 0, supprime: true })).toBe('supprime');
  });

  it('un signalement de moins que le seuil ne masque pas', () => {
    // La frontière exacte : c'est là que se joue « deux personnes suffisent-elles ».
    expect(statutMessage({ signalements: SEUIL_MASQUAGE - 1 })).toBe('visible');
    expect(statutMessage({ signalements: SEUIL_MASQUAGE })).toBe('masque');
  });

  it('LA SUPPRESSION PRIME sur les signalements', () => {
    /**
     * Un message retiré par son auteur puis signalé trois fois repasserait
     * « masqué » si on regardait les signalements d'abord — donc réapparaîtrait
     * dans les écrans qui listent les messages masqués en attente d'arbitrage,
     * alors que son auteur l'a explicitement effacé. On ne ressuscite pas ce
     * que quelqu'un a retiré.
     */
    expect(statutMessage({ signalements: 99, supprime: true })).toBe('supprime');
  });
});

describe('le droit de signaler', () => {
  it('GARDE-FOU : les deux issues sont atteignables', () => {
    expect(peutSignaler({ signalementsRetablis: 0 })).toBe(true);
    expect(peutSignaler({ signalementsRetablis: SIGNALEMENTS_RETABLIS_AVANT_SUSPENSION })).toBe(
      false,
    );
  });

  it('la suspension est DÉFINITIVE — rien ne l’éteint tout seul', () => {
    /**
     * Décision de l'apiculteur. Une expiration implicite (au bout de N jours)
     * rendrait sa décision inopérante sans que personne ne s'en aperçoive : le
     * compte retrouverait son droit un matin, sans geste ni trace.
     */
    const suspendu = { signalementsRetablis: 42 };
    expect(peutSignaler(suspendu)).toBe(false);
    expect(
      peutSignaler({ ...suspendu, suspensionLevee: true }),
      'seule une levée EXPLICITE rend le droit',
    ).toBe(true);
  });
});

describe('les refus sont des phrases, jamais des codes', () => {
  it('le refus de signalement dit à qui s’adresser', () => {
    /**
     * Un refus qui s'arrête au « non » laisse l'apiculteur devant un mur. Ici
     * ce qui débloque n'est pas une formule payante mais une décision humaine :
     * la phrase doit donc nommer la porte de sortie.
     */
    expect(REFUS_SIGNALEMENT_SUSPENDU).toMatch(/Réglages/);
    expect(REFUS_SIGNALEMENT_SUSPENDU, 'aucun identifiant technique').not.toMatch(
      /[A-Z_]{4,}|signalementsRetablis/,
    );
  });

  it('le refus d’anti-flood NOMME le chiffre', () => {
    const phrase = refusTropDeMessages(FORUM_MAX_MESSAGES_PAR_JOUR);
    expect(phrase).toContain(String(FORUM_MAX_MESSAGES_PAR_JOUR));
    expect(phrase, 'aucun identifiant technique').not.toMatch(/MAX_[A-Z_]+/);
  });

  it('le message masqué explique, il ne disparaît pas en silence', () => {
    /**
     * Un trou muet dans un fil le rend incompréhensible : les réponses qui
     * suivent citent un message que plus personne ne voit.
     */
    expect(TEXTE_MESSAGE_MASQUE.length, 'la mention doit dire quelque chose').toBeGreaterThan(30);
    expect(TEXTE_MESSAGE_MASQUE).toMatch(/relu|arbitr/i);
  });
});

describe('les motifs de signalement', () => {
  it('GARDE-FOU : la liste n’est pas vide et chaque motif est utilisable', () => {
    expect(MOTIFS_ABUS.length).toBeGreaterThan(2);
    for (const m of MOTIFS_ABUS) {
      expect(m.label.length, `« ${m.value} » n’a pas de libellé lisible`).toBeGreaterThan(3);
      expect(m.couleur, `« ${m.value} » n’a pas de couleur`).toMatch(/^#[0-9a-f]{6}$/i);
    }
  });

  it('le danger sanitaire est un motif à part entière', () => {
    /**
     * Propre à ce produit : un conseil qui propage une maladie ou recommande un
     * traitement interdit ne relève pas de la politesse, il coûte des colonies.
     * Le noyer dans « autre » le rendrait invisible à l'arbitrage.
     */
    expect(MOTIFS_ABUS.map((m) => m.value)).toContain('danger_sanitaire');
  });

  it('les valeurs sont uniques — un doublon rendrait un motif inatteignable', () => {
    const valeurs = MOTIFS_ABUS.map((m) => m.value);
    expect(new Set(valeurs).size).toBe(valeurs.length);
  });
});
