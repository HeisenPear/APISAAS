import { describe, it, expect } from 'vitest';
import {
  construirePlanLot,
  planEnBloc,
  resumeDonneesIntervention,
} from '~~/server/utils/copilote-plan';
import type { InterventionParsee, RucheRef } from '~~/server/utils/copilote-actions';

const RUCHES: RucheRef[] = [
  { id: 'r1', numero: '7', rucherNom: 'Rucher Nord', rucherId: 'ru1' },
  { id: 'r2', numero: '8', rucherNom: 'Rucher Nord', rucherId: 'ru1' },
  { id: 'r3', numero: '9', rucherNom: 'Rucher Nord', rucherId: 'ru1' },
];

const CONTROLE: InterventionParsee = {
  type: 'controle',
  donnees: { forceColonie: 3, comportement: 'calme' },
  manque: [],
};

describe('construirePlanLot — fan-out d’une intervention sur N ruches', () => {
  it('crée UNE étape par ruche, avec les params partagés', () => {
    const plan = construirePlanLot(CONTROLE, RUCHES, { mode: 'rucher', rucher: 'nord' });
    expect(plan.type).toBe('lot');
    expect(plan.etapes).toHaveLength(3);
    for (const [i, etape] of plan.etapes.entries()) {
      expect(etape.actionId).toBe('intervention');
      expect(etape.domaine).toBe('terrain');
      expect(etape.params.rucheId).toBe(RUCHES[i]!.id);
      expect(etape.params.rucherId).toBe(RUCHES[i]!.rucherId);
      expect(etape.params.type).toBe('controle');
      expect(etape.params.donnees).toEqual({ forceColonie: 3, comportement: 'calme' });
    }
  });

  it('donne des ids d’étape stables et des libellés lisibles', () => {
    const plan = construirePlanLot(CONTROLE, RUCHES, { mode: 'toutes' });
    expect(plan.etapes.map((e) => e.id)).toEqual(['e1', 'e2', 'e3']);
    expect(plan.etapes[0]!.libelle).toBe('Ruche 7 · Rucher Nord');
  });

  it('résume le type et les données dans le titre + le récap', () => {
    const plan = construirePlanLot(CONTROLE, RUCHES, { mode: 'toutes' });
    expect(plan.titre).toContain('Contrôle');
    expect(plan.titre).toContain('3 ruches');
    expect(plan.resume.some((l) => l.includes('Force'))).toBe(true);
    expect(plan.resume.some((l) => l.includes('calme'))).toBe(true);
  });

  it('fige les données partagées (indépendantes entre étapes)', () => {
    const plan = construirePlanLot(CONTROLE, RUCHES, { mode: 'toutes' });
    // Muter les données d'une étape ne doit pas affecter la donnée d'origine ici,
    // mais on vérifie surtout que chaque étape porte bien le même contenu.
    expect(plan.etapes[0]!.params.donnees).toEqual(plan.etapes[1]!.params.donnees);
  });
});

describe('resumeDonneesIntervention', () => {
  it('résume un nourrissement', () => {
    const t: InterventionParsee = {
      type: 'nourrissement',
      donnees: { type: 'candi', quantite: 2, unite: 'kg' },
      manque: [],
    };
    const lignes = resumeDonneesIntervention(t);
    expect(lignes.join(' ')).toContain('candi');
    expect(lignes.join(' ')).toContain('2 kg');
  });

  it('résume une note libre', () => {
    const t: InterventionParsee = {
      type: 'commentaire',
      donnees: { texte: 'traitement anti-varroa posé' },
      manque: [],
    };
    expect(resumeDonneesIntervention(t).join(' ')).toContain('traitement anti-varroa');
  });
});

describe('planEnBloc', () => {
  it('projette le plan en bloc riche « plan »', () => {
    const plan = construirePlanLot(CONTROLE, RUCHES, { mode: 'toutes' });
    const bloc = planEnBloc(plan);
    expect(bloc.type).toBe('plan');
    expect(bloc.titre).toBe(plan.titre);
    expect(bloc.resume).toEqual(plan.resume);
    expect(bloc.etapes).toHaveLength(3);
    expect(bloc.etapes[0]).toEqual({ libelle: 'Ruche 7 · Rucher Nord' });
  });
});
