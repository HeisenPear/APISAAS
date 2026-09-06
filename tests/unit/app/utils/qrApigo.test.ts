import { describe, expect, it } from 'vitest';
import { analyserQrApigo } from '../../../../app/utils/qrApigo';

// ═══════════════════════════════════════════════════════════════════════════
// QR APIGO — le scanner auto-détecté ouvre UNIQUEMENT des routes de l'app. On
// verrouille le cas nominal (ruche/lot) ET la sécurité (un QR étranger ne
// navigue nulle part).
// ═══════════════════════════════════════════════════════════════════════════

describe('analyserQrApigo — QR de l’app', () => {
  it('URL de ruche (avec ?scan=1) → route /ruches/:id', () => {
    expect(analyserQrApigo('https://apigo.fr/ruches/abc-123?scan=1')).toEqual({
      path: '/ruches/abc-123',
      type: 'ruche',
    });
  });

  it('URL de lot → route /production/lots/:numero', () => {
    expect(analyserQrApigo('https://apigo.fr/production/lots/2026-04')).toEqual({
      path: '/production/lots/2026-04',
      type: 'lot',
    });
  });

  it('chemin relatif accepté', () => {
    expect(analyserQrApigo('/ruches/xyz')?.type).toBe('ruche');
  });

  it('l’hôte n’importe pas — seul le chemin reconnu compte', () => {
    expect(analyserQrApigo('http://localhost:3000/ruches/42?scan=1')).toEqual({
      path: '/ruches/42',
      type: 'ruche',
    });
  });
});

describe('analyserQrApigo — sécurité (ne navigue pas vers l’inconnu)', () => {
  it('QR étranger (autre site) → null', () => {
    expect(analyserQrApigo('https://exemple.com/promo')).toBeNull();
  });

  it('route APIGO non gérée → null (on n’ouvre que ruche/lot)', () => {
    expect(analyserQrApigo('https://apigo.fr/parametres')).toBeNull();
  });

  it('texte quelconque / vide → null', () => {
    expect(analyserQrApigo('bonjour')).toBeNull();
    expect(analyserQrApigo('')).toBeNull();
    expect(analyserQrApigo('   ')).toBeNull();
  });
});
