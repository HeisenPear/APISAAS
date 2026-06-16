import { describe, expect, it } from 'vitest';
import {
  estActionAuto,
  memeNumero,
  extraireRuche,
  extraireRucheSeule,
  estActionEcriture,
  analyserIntervention,
} from '../../../../server/utils/copilote-actions';
import { normaliser } from '../../../../server/utils/copilote-local';

/** Raccourci : prépare l'entrée comme le fait la route (normalisée). */
const n = (s: string) => normaliser(s);

describe('estActionAuto — autonomie hybride', () => {
  it('intervention est exécutée en autonomie', () => {
    expect(estActionAuto('intervention')).toBe(true);
  });
  it('le sensible (vente, client, stock, récolte) reste en confirmation', () => {
    expect(estActionAuto('vente')).toBe(false);
    expect(estActionAuto('client')).toBe(false);
    expect(estActionAuto('stock')).toBe(false);
    expect(estActionAuto('recolte')).toBe(false);
  });
});

describe('memeNumero — tolérance de numéro de ruche', () => {
  it('égalité stricte', () => expect(memeNumero('7', '7')).toBe(true));
  it('zéros de tête : « 012 » = « 12 »', () => expect(memeNumero('012', '12')).toBe(true));
  it('préfixe lettre : « R5 » = « 5 »', () => expect(memeNumero('R5', '5')).toBe(true));
  it('numéros différents', () => expect(memeNumero('7', '8')).toBe(false));
});

describe('extraireRuche — référence de ruche tolérante', () => {
  it('« ruche 12 »', () => expect(extraireRuche('ruche 12')).toBe('12'));
  it('« la 12 »', () => expect(extraireRuche('sur la 12')).toBe('12'));
  it('« ruche n°7 »', () => expect(extraireRuche('ruche n°7')).toBe('7'));
  it('nombre en lettres : « ruche douze »', () => expect(extraireRuche('ruche douze')).toBe('12'));
  it('forme compacte « r12 »', () => expect(extraireRuche('r12 reine vue')).toBe('12'));
});

describe('estActionEcriture — ordre d’écriture vs question', () => {
  it('verbe + ruche → écriture', () => {
    expect(estActionEcriture(n('note ruche 12 reine vue, couvain'))).toBe(true);
  });
  it('ruche + observations sans verbe → écriture implicite', () => {
    expect(estActionEcriture(n('ruche 12 reine vue, couvain operculé'), false)).toBe(true);
  });
  it('une question n’est pas un ordre', () => {
    expect(estActionEcriture(n('comment va la reine de la 12 ?'), true)).toBe(false);
  });
});

describe('analyserIntervention — détection du type', () => {
  it('contrôle : observations → type controle + ruche résolue', () => {
    const p = analyserIntervention(
      n('ruche 12 reine vue, couvain operculé'),
      'ruche 12 reine vue, couvain operculé',
    );
    expect(p.type).toBe('controle');
    expect(p.rucheNumero).toBe('12');
    expect(p.manque).not.toContain('ruche');
    expect(p.donnees.reineVue).toBe(true);
    expect(p.donnees.couvainPresent).toBe(true);
  });

  it('note libre sans ruche → type commentaire + ruche manquante', () => {
    const p = analyserIntervention(n('rappel acheter des cadres'), 'rappel acheter des cadres');
    expect(p.type).toBe('commentaire');
    expect(p.manque).toContain('ruche');
  });

  it('nourrissement', () => {
    const p = analyserIntervention(
      n('nourri la 5 avec 1,5 litre de sirop'),
      'nourri la 5 avec 1,5 litre de sirop',
    );
    expect(p.type).toBe('nourrissement');
    expect(p.rucheNumero).toBe('5');
  });

  it('comptage varroa', () => {
    const p = analyserIntervention(
      n('comptage varroa ruche 3 : 12 varroas'),
      'comptage varroa ruche 3 : 12 varroas',
    );
    expect(p.type).toBe('varroa');
    expect(p.rucheNumero).toBe('3');
  });

  it('pesée', () => {
    const p = analyserIntervention(n('pesée ruche 7 : 37,5 kg'), 'pesée ruche 7 : 37,5 kg');
    expect(p.type).toBe('pesee');
    expect(p.rucheNumero).toBe('7');
  });

  it('négation prioritaire : « pas de couvain » → couvain absent', () => {
    const p = analyserIntervention(
      n('ruche 4 reine vue mais pas de couvain'),
      'ruche 4 reine vue mais pas de couvain',
    );
    expect(p.type).toBe('controle');
    expect(p.donnees.couvainPresent).toBe(false);
  });
});

describe('extraireRucheSeule — slot-filling (réponse « la 12 »)', () => {
  it('« la 12 » → 12', () => expect(extraireRucheSeule('la 12')).toBe('12'));
  it('« ruche 7 » → 7', () => expect(extraireRucheSeule('ruche 7')).toBe('7'));
  it('un message qui n’est pas une ruche → undefined', () => {
    expect(extraireRucheSeule('merci beaucoup')).toBeUndefined();
  });
});
