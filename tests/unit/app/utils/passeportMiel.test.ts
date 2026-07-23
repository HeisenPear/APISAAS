import { describe, it, expect } from 'vitest';
import {
  encoderPasseport,
  decoderPasseport,
  type PasseportMiel,
} from '../../../../app/utils/passeportMiel';

const complet: PasseportMiel = {
  v: 1,
  lot: 'L-2026-07',
  prod: 'Rucher des Acacias — Éliot G.',
  miels: ['Acacia', 'Tilleul'],
  origine: 'Veigné (37), France',
  recolte: 'juin–août 2026',
  pot: '2026-09',
  ddm: '2028-09',
  eau: 17.4,
  eco: { s: 82, n: 'A' },
};

describe('passeportMiel — encodage/décodage', () => {
  it('fait un aller-retour fidèle (accents & caractères spéciaux compris)', () => {
    const round = decoderPasseport(encoderPasseport(complet));
    expect(round).toEqual(complet);
  });

  it('produit une chaîne sûre dans une URL (base64url, pas de +/=)', () => {
    const s = encoderPasseport(complet);
    expect(s).not.toMatch(/[+/=]/);
  });

  it('accepte un passeport minimal (juste le lot)', () => {
    const s = encoderPasseport({ v: 1, lot: 'L-1' });
    expect(decoderPasseport(s)).toEqual({ v: 1, lot: 'L-1' });
  });

  it('renvoie null sur une entrée absente ou illisible', () => {
    expect(decoderPasseport(null)).toBeNull();
    expect(decoderPasseport('')).toBeNull();
    expect(decoderPasseport('pas-du-base64-valide!!')).toBeNull();
  });

  it('rejette une version inconnue ou un lot manquant', () => {
    const mauvaiseVersion = encoderPasseport({ ...complet, v: 2 as unknown as 1 });
    expect(decoderPasseport(mauvaiseVersion)).toBeNull();
    const sansLot = encoderPasseport({ ...complet, lot: '' });
    expect(decoderPasseport(sansLot)).toBeNull();
  });
});
