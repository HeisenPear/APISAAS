import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import {
  annulationAutorisee,
  annulationExpiree,
  FENETRE_ANNULATION_MS,
  TYPES_ANNULABLES,
} from '~~/server/utils/annulationRegle';

/**
 * « ANNULER » NE DOIT JAMAIS MENTIR.
 *
 * Le dépôt avait deux annulations, et l'asymétrie était du mauvais côté :
 *
 *   · LE LOT — types relus en base, fenêtre de 24 h, refus en bloc de tout ce
 *     qui écrit hors du hub. Quinze lignes de commentaire pour l'expliquer.
 *   · L'ACTION SEULE — un DELETE nu. Rien.
 *
 * Or l'action seule est la SEULE à s'exécuter en autonomie. Le chemin le mieux
 * gardé était celui qui demandait une confirmation ; celui qui écrivait tout
 * seul n'avait aucun filet.
 *
 * ⚠️ UNE PRÉCISION QUE J'AVAIS FAUSSE. Je croyais que le comptage varroa
 * orphelin continuait d'alimenter le SCORE DE SANTÉ. Non : `computeHiveScore`
 * lit la colonne plate `interventions.varroa`, pas la table `comptages_varroa`.
 * Ce qui lit vraiment l'orphelin, c'est le détecteur d'alerte varroa, la frise
 * de la ruche et l'export RGPD. Le défaut est réel ; sa portée n'était pas
 * celle que j'annonçais.
 */

const T0 = new Date('2026-05-01T08:00:00Z');
const dans = (ms: number) => new Date(T0.getTime() + ms);

describe('la règle d’annulation, partagée par les deux chemins', () => {
  it('accepte un type réversible dans la fenêtre', () => {
    expect(annulationAutorisee(['controle'], T0, dans(60_000))).toEqual({ ok: true });
  });

  it('refuse un type qui écrit hors du hub, même à l’instant', () => {
    const v = annulationAutorisee(['varroa'], T0, dans(1_000));
    expect(v.ok).toBe(false);
    expect(v.ok === false && v.motif).toContain('varroa');
  });

  it('refuse un type INCONNU plutôt que de supposer', () => {
    // La colonne `type` est nullable en base. Une ligne sans type ne peut pas
    // être déclarée réversible : on refuse par défaut, jamais l'inverse.
    for (const types of [[null], [undefined], ['type_invente']]) {
      expect(annulationAutorisee(types, T0, dans(1_000)).ok, JSON.stringify(types)).toBe(false);
    }
  });

  it('refuse le lot entier dès qu’UNE ligne est irréversible', () => {
    // Un lot ne se défait qu'ENTIÈREMENT : une annulation partielle laisserait
    // la base dans un état que personne n'a demandé.
    const v = annulationAutorisee(['controle', 'controle', 'division'], T0, dans(1_000));
    expect(v.ok).toBe(false);
    expect(v.ok === false && v.motif).toContain('division');
  });

  it('refuse au-delà de 24 heures, accepte à 23 h 59', () => {
    expect(annulationAutorisee(['controle'], T0, dans(FENETRE_ANNULATION_MS - 1)).ok).toBe(true);
    expect(annulationAutorisee(['controle'], T0, dans(FENETRE_ANNULATION_MS + 1)).ok).toBe(false);
  });

  it('une date illisible ferme la porte au lieu de l’ouvrir', () => {
    expect(annulationExpiree('pas une date', T0)).toBe(true);
    expect(annulationAutorisee(['controle'], 'pas une date', T0).ok).toBe(false);
  });

  it('le refus de TYPE passe avant le refus de FENÊTRE', () => {
    /**
     * L'ordre n'est pas cosmétique : le refus de type APPREND quelque chose
     * (« ça a créé des données ailleurs »), celui de fenêtre dit seulement
     * « trop tard ». Sur une intervention vieille ET irréversible, la phrase
     * utile est la première.
     */
    const v = annulationAutorisee(['varroa'], T0, dans(FENETRE_ANNULATION_MS * 2));
    expect(v.ok).toBe(false);
    expect(v.ok === false && v.motif).toContain('varroa');
    expect(v.ok === false && v.motif).not.toContain('24 heures');
  });

  it('le refus garde toujours une porte de sortie', () => {
    // Ne jamais bloquer sans dire quoi faire — la règle de tout le produit.
    for (const v of [
      annulationAutorisee(['varroa'], T0, dans(1_000)),
      annulationAutorisee(['controle'], T0, dans(FENETRE_ANNULATION_MS * 2)),
    ]) {
      expect(v.ok).toBe(false);
      expect(v.ok === false && v.motif).toMatch(/journal des interventions|dans l’application/);
    }
  });

  it('la liste blanche reste petite et explicite', () => {
    // Si elle enfle, quelqu'un s'en sert comme d'une trappe. Chaque ajout doit
    // être un choix argumenté : le handler du type n'écrit QUE dans le hub.
    expect([...TYPES_ANNULABLES].sort()).toEqual(['commentaire', 'controle', 'nourrissement']);
  });

  it('les DEUX chemins passent par cette règle, aucun ne garde la sienne', () => {
    /**
     * ⚠️ LE CAS QUI GARDE LA CORRECTION. Rien n'empêche de remettre un DELETE
     * nu « juste pour ce cas-là » — c'est exactement comme ça que le second
     * chemin est né sans filet.
     */
    const seule = readFileSync('server/utils/copilote-actions.ts', 'utf-8');
    const lot = readFileSync('server/utils/copilote-executeur.ts', 'utf-8');
    // ⚠️ ON REGARDE LE CORPS DE LA FONCTION, PAS LE FICHIER. La version
    // naïve — « le fichier contient annulationAutorisee » — restait VERTE
    // quand on retirait l'appel : la chaîne survivait dans la ligne d'import.
    // Une mutation l'a démasquée. Le comportement, lui, est observé dans
    // `annulerActionSeule.test.ts`.
    const corps = seule.slice(
      seule.indexOf('export async function annulerActionIntervention'),
      seule.indexOf('export function annulerAction('),
    );
    expect(corps.length, 'annulerActionIntervention est introuvable').toBeGreaterThan(200);
    expect(corps, 'l’annulation d’une action seule doit appeler la règle').toContain(
      'annulationAutorisee(',
    );
    expect(lot, 'l’annulation d’un lot doit appeler la règle').toContain('annulationAutorisee');
    expect(lot, 'la règle ne doit plus être redéclarée chez un appelant').not.toMatch(
      /const TYPES_ANNULABLES = new Set/,
    );
  });

  it('la phrase de succès du lot n’a pas deux propositions collées', () => {
    // « C'est annulé J'ai défait les 20 actions » — sur le message qui clôt un
    // geste destructeur, c'est le pire endroit pour paraître cassé.
    const lot = readFileSync('server/utils/copilote-executeur.ts', 'utf-8');
    expect(lot).not.toContain('C’est annulé J’ai défait');
  });
});
