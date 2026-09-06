import { describe, it, expect } from 'vitest';
import {
  analyserIntervention,
  lireTypeIntervention,
  TYPES_DICTABLES,
  LIBELLES_TYPES_INTERVENTION,
} from '~~/server/utils/copilote-actions';
import { classifierTour, normaliser } from '~~/server/utils/copilote-local';
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

  describe('les phrases telles qu’on les dit au rucher — AU NIVEAU DE LA BRIQUE', () => {
    /**
     * ⚠️ CE BLOC MESURE `analyserIntervention`, PAS LE PRODUIT. La route passe
     * par `classifierTour`, qui teste la MORTALITÉ avant la branche
     * intervention. Trois de ces phrases n'atteignent donc jamais la brique en
     * production — le bloc suivant les rattrape, là où le produit décide.
     *
     * On ne supprime pas ces cas pour autant : ils gardent la brique, et
     * c'est utile. Ils sont simplement NOMMÉS pour ce qu'ils sont, au lieu de
     * certifier un comportement que personne n'atteint. C'est la leçon écrite
     * en toutes lettres dans `mayaCorpus.test.ts` — « toujours mesurer là où
     * le produit décide » — et ce fichier voisin ne l'appliquait pas.
     */
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

  // ══════════════════════════════════════════════════════════════════════════
  // LÀ OÙ LE PRODUIT DÉCIDE
  //
  // ⚠️ TROIS CAS DU BLOC PRÉCÉDENT CERTIFIAIENT UNE BRANCHE JAMAIS ATTEINTE.
  // `classifierTour` — l'entrée réelle de la route — teste `analyserMortalite`
  // AVANT la branche intervention, et le mot « perdu » y compte pour « mort ».
  // « essaim perdu sur la 3 » ne produit donc PAS un essaimage non rattrapé
  // mais une PERTE de colonie, et le banc restait vert.
  //
  // ⚠️ ET C'EST UN ARBITRAGE MÉTIER, PAS UN DÉFAUT DE CODE. « essaim perdu »
  // peut vouloir dire deux choses au rucher : l'essaim est parti (la colonie
  // vit encore, couvain et cellules), ou la colonie est morte. Les deux
  // écrivent dans des tables différentes. Ce banc CONSTATE ce que le produit
  // fait aujourd'hui — il ne tranche pas. Le jour où l'apiculteur décide,
  // il rougira et nommera la décision.
  // ══════════════════════════════════════════════════════════════════════════

  describe('le chemin RÉEL de la route : classifierTour', () => {
    function decide(phrase: string) {
      const r = classifierTour([{ role: 'user', content: phrase }] as never) as {
        kind: string;
        ecriture?: { action: string; parse?: Record<string, unknown> };
      };
      return { kind: r.kind, action: r.ecriture?.action, parse: r.ecriture?.parse };
    }

    it('garde-fou : un geste sans ambiguïté arrive bien en intervention', () => {
      // Sans lui, un `classifierTour` qui rendrait toujours « mortalite »
      // satisferait les cas suivants sans rien mesurer.
      const d = decide('ruche 7, essaim récupéré');
      expect(d.kind).toBe('ecriture');
      expect(d.action, 'une capture reste une intervention').toBe('intervention');
    });

    it('⚠️ « essaim perdu » part en MORTALITÉ, pas en essaimage', () => {
      /**
       * Le constat, tel qu'il est aujourd'hui. Le bloc « brique » ci-dessus
       * jure l'inverse — il mesure une branche que la route n'atteint pas.
       */
      expect(decide('essaim perdu sur la 3').action).toBe('mortalite');
      expect(decide('ruche 2, essaim mort').action).toBe('mortalite');
      expect(decide('essaim mort dans la ruche 4').action).toBe('mortalite');
    });

    it('le numéro de la ruche n’est PAS compté comme un nombre de pertes', () => {
      /**
       * ⚠️ TROUVÉ EN VÉRIFIANT LE CONSTAT. « ruche 2 essaim mort » donnait
       * `combien: 2`, « ruche 5 colonie morte » donnait 5 : le motif cherchait
       * « <chiffre> essaim » et ramassait la désignation de la ruche.
       *
       * Une seule ruche était écrite — rien de faux en base — mais l'aperçu
       * ajoutait « *Tu m'en as annoncé 5 : je note celle-ci. Dis-moi les
       * autres numéros.* » à quelqu'un qui venait d'en déclarer UNE. Au pire
       * moment de l'année.
       */
      expect(decide('ruche 2, essaim mort').parse?.combien).toBe(1);
      expect(decide('ruche 5, colonie morte').parse?.combien).toBe(1);
      expect(decide('essaim perdu sur la 3').parse?.combien).toBe(1);
    });

    it('un vrai COMPTE, lui, se lit encore', () => {
      // Le contre-test : sans lui, « toujours 1 » satisferait le cas précédent
      // et Maya ne saurait plus enchaîner les pertes d'un hivernage difficile.
      expect(decide('j’ai perdu 5 colonies cet hiver').parse?.combien).toBe(5);
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
