import { describe, it, expect } from 'vitest';
import {
  analyserIntervention,
  lireTypeIntervention,
  TYPES_DICTABLES,
  LIBELLES_TYPES_INTERVENTION,
} from '~~/server/utils/copilote-actions';
import { normaliser } from '~~/server/utils/copilote-local';
import { CATEGORIES_INTERVENTION } from '~/types/interventions';
import { TYPES_ANNULABLES } from '~~/server/utils/annulationRegle';

/**
 * « ELLE ME RENVOIE VERS LA PAGE » — QUATRE GESTES DE SAISON EN MOINS.
 *
 * Maya savait dicter SIX types d'intervention sur les treize du produit. Pour
 * les sept autres elle ne pouvait qu'ouvrir `/interventions/nouvelle` — c'est
 * littéralement le « elle me renvoie vers la page concernée » signalé.
 *
 * Quatre d'entre eux ne demandaient qu'un slot simple, et ce sont les plus
 * fréquents du printemps : l'essaim qu'on récupère, la division qu'on fait dans
 * la foulée, la hausse qu'on pose, le plancher qu'on nettoie. Les faire changer
 * de page au moment où l'apiculteur a les mains dans la ruche était exactement
 * ce qu'on voulait supprimer.
 *
 * ⚠️ LES TROIS RESTANTS NE SONT PAS OUBLIÉS, ILS SONT REPORTÉS, et ce banc le
 * DIT au lieu de le taire : `deplacement`, `empilement` et `transvasement`
 * demandent chacun de résoudre une SECONDE entité (un rucher ou une ruche de
 * destination, par identifiant). Le mécanisme de slot ne sait pas encore le
 * faire ; l'inventer à la va-vite produirait des écritures sur la mauvaise
 * ruche. Le cas « ce qui reste à faire » ci-dessous tient le compte.
 */

const n = (s: string) => normaliser(s);

describe('les gestes que Maya sait écrire depuis sa fenêtre', () => {
  it('le catalogue est cohérent (garde-fou du banc)', () => {
    expect(TYPES_DICTABLES.length).toBeGreaterThan(5);
    // Un type dictable est forcément une vraie catégorie du produit.
    for (const t of TYPES_DICTABLES) expect(CATEGORIES_INTERVENTION).toContain(t);
  });

  it('les quatre gestes de saison sont dictables', () => {
    for (const t of ['essaimage', 'division', 'materiel', 'sanitaire']) {
      expect(TYPES_DICTABLES, `${t} devrait être dictable`).toContain(t);
    }
  });

  it('ce qui reste à faire est COMPTÉ, pas tu', () => {
    /**
     * Le contraire d'un banc qui se félicite. Trois types demandent une seconde
     * entité résolue par identifiant ; tant que le mécanisme de slot ne sait pas
     * le faire, ils restent hors dictée. Le jour où l'un d'eux devient
     * dictable, ce cas casse et il faudra le retirer de la liste — c'est-à-dire
     * constater le progrès, au lieu de le laisser passer inaperçu.
     */
    const restants = CATEGORIES_INTERVENTION.filter((c) => !TYPES_DICTABLES.includes(c));
    expect([...restants].sort()).toEqual(['deplacement', 'empilement', 'transvasement']);
  });

  it('les chips proposées suivent les types dictables', () => {
    // La liste était écrite à la main, et restée à six pendant que le produit
    // en comptait treize. Elle se dérive.
    expect(LIBELLES_TYPES_INTERVENTION.length).toBe(TYPES_DICTABLES.length);
    expect(LIBELLES_TYPES_INTERVENTION).toContain('Matériel');
  });

  describe('les phrases telles qu’on les dit au rucher', () => {
    const CAS: [string, string, Record<string, unknown>][] = [
      ['ruche 7, essaim récupéré', 'essaimage', { essaimRecupere: true }],
      ['essaim perdu sur la 3', 'essaimage', { essaimRecupere: false }],
      ['j’ai divisé la ruche 12 en 3', 'division', { nombreDivisions: 3 }],
      [
        'ruche 4, j’ai posé 2 hausses',
        'materiel',
        { elements: [{ element: 'hausses', quantite: 2 }] },
      ],
      [
        'ruche 9, j’ai ajouté un nourrisseur',
        'materiel',
        { elements: [{ element: 'nourrisseurs', quantite: 1 }] },
      ],
      ['ruche 5, nettoyé le plancher', 'sanitaire', { typeEvenement: 'nettoyer_plancher' }],
      ['ruche 2, essaim mort', 'sanitaire', { typeEvenement: 'essaim_mort' }],
    ];

    it.each(CAS)('« %s » → %s', (phrase, type, attendu) => {
      const p = analyserIntervention(n(phrase), phrase);
      expect(p.type, phrase).toBe(type);
      for (const [k, v] of Object.entries(attendu)) {
        expect(p.donnees[k], `${phrase} → ${k}`).toEqual(v);
      }
    });
  });

  describe('ce qu’elle ne doit PAS prendre pour une intervention', () => {
    /**
     * ⚠️ CES CAS SONT LA MOITIÉ DU TRAVAIL, ET LE BANC EXISTANT M'A DÉJÀ REPRIS
     * ICI. Ma première version déclenchait « matériel » sur le seul mot
     * « cadres » — et « rappel acheter des cadres » devenait une intervention.
     * Nommer un objet n'est pas poser cet objet : sans le geste, on transforme
     * une liste de courses en écriture dans la base.
     */
    const NOTES: string[] = [
      'rappel acheter des cadres',
      'penser à commander des hausses',
      'il faudrait des nourrisseurs pour la saison',
    ];

    it.each(NOTES)('« %s » reste une note', (phrase) => {
      const p = analyserIntervention(n(phrase), phrase);
      expect(p.type, phrase).toBe('commentaire');
    });
  });

  it('« essaim mort » est un geste SANITAIRE, pas un essaimage', () => {
    // Deux gestes que le même mot désigne, et qui n'ont rien à voir : l'un
    // enregistre une capture, l'autre une perte. Se tromper d'ordre de test,
    // c'est enregistrer une bonne nouvelle à la place d'une mauvaise.
    expect(lireTypeIntervention(n('essaim mort dans la ruche 4'))).toBe('sanitaire');
    expect(lireTypeIntervention(n('essaim récupéré ce matin'))).toBe('essaimage');
  });

  it('aucun des nouveaux gestes ne s’écrit en autonomie', () => {
    /**
     * Leurs handlers remplissent des tables satellites (`essaimages`,
     * `divisions`, `mouvements_materiel`, `evenements_sanitaires`) que
     * l'annulation ne sait pas défaire. Ils passent donc par « Confirmer » —
     * ce qui est exactement le contrat demandé : elle fait tout depuis sa
     * fenêtre, elle a juste besoin de la validation.
     */
    for (const t of ['essaimage', 'division', 'materiel', 'sanitaire']) {
      expect(TYPES_ANNULABLES.has(t), `${t} ne doit pas être déclaré annulable`).toBe(false);
    }
  });
});
