import { describe, expect, it } from 'vitest';
import {
  classifier,
  ficheProduitOuEnseigne,
  normaliser,
} from '../../../../server/utils/copilote-local';

/**
 * Le savoir « marques et enseignes » doit ARRIVER JUSQU'À L'APICULTEUR.
 *
 * Le piège vécu : `copilote-produits.ts` reconnaissait parfaitement Apivar,
 * Apiguard ou ICKO, ses propres bancs passaient au vert — et rien n'appelait
 * ces fonctions. Le moteur ne les servait donc jamais : du code mort validé par
 * des tests. Ce banc-ci teste le CHAÎNON qui manquait, pas la connaissance.
 *
 * Deux gardes complémentaires :
 *  1. la fiche est bien rendue pour une marque / une enseigne citée seule ;
 *  2. la classification de ces phrases retombe bien dans l'une des deux
 *     branches où le moteur va la chercher (`savoir` ou `inconnu`). Si un jour
 *     elle en produisait une troisième, ce banc casse — au lieu de laisser la
 *     réponse redevenir silencieusement muette.
 */
const BRANCHES_COUVERTES = ['savoir', 'inconnu'];

const MARQUES = [
  'c’est quoi l’Apivar ?',
  'Apitraz',
  'parle moi d’Apiguard',
  'Api-Bioxal c’est quoi ?',
];
const ENSEIGNES = ['ICKO', 'la Jocondienne', 'Thomas Apiculture', 'c’est quoi Naturapi ?'];

describe('fiches produits & enseignes — le chaînon jusqu’à la réponse', () => {
  it('rend une fiche quand une MARQUE est citée', () => {
    for (const q of MARQUES) {
      const fiche = ficheProduitOuEnseigne(normaliser(q));
      expect(fiche, q).not.toBeNull();
      expect(fiche!.texte.length, q).toBeGreaterThan(200);
      expect(fiche!.manque, q).toBe(false);
      // Une fiche qui n'invite à rien est un cul-de-sac : elle doit toujours
      // proposer la suite, c'est la demande produit (« pousser à la discussion »).
      expect(fiche!.texte, q).toContain('?');
    }
  });

  it('rend une fiche quand une ENSEIGNE est citée, en avouant ce qu’elle ignore', () => {
    for (const q of ENSEIGNES) {
      const fiche = ficheProduitOuEnseigne(normaliser(q));
      expect(fiche, q).not.toBeNull();
      // Ni catalogue, ni prix, ni stock : le dire est la règle du projet —
      // jamais de donnée inventée.
      expect(fiche!.texte, q).toContain('Ce que je ne sais pas');
      expect(fiche!.texte, q).toContain('?');
    }
  });

  it('ne se déclenche pas sur une question de CHOIX, qui appelle un calcul', () => {
    // « Quel traitement contre le varroa ? » doit rester une recommandation
    // calculée d'après la saison et la colonie, pas une fiche produit.
    expect(ficheProduitOuEnseigne(normaliser('quel traitement contre le varroa ?'))).toBeNull();
    expect(ficheProduitOuEnseigne(normaliser('comment vont mes ruches ?'))).toBeNull();
  });

  it('classe ces phrases dans une branche où le moteur va chercher la fiche', () => {
    for (const q of [...MARQUES, ...ENSEIGNES]) {
      expect(BRANCHES_COUVERTES, q).toContain(classifier(q).kind);
    }
  });
});
