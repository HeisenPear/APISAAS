import { describe, expect, it } from 'vitest';
import {
  identifierFournisseur,
  rendreFicheFournisseur,
  FOURNISSEURS,
  identifierProduitParMarque,
  rendreFicheProduit,
  viseFicheProduit,
  viseVarroacide,
  VARROACIDES,
} from '~~/server/utils/copilote-produits';

// ═══════════════════════════════════════════════════════════════════════════
// Sur le terrain, l'apiculteur nomme une MARQUE — « Apivar », pas « amitraze ».
// Nommer un produit doit suffire à obtenir sa fiche. Ce banc verrouille cette
// porte d'entrée, et surtout la frontière avec le moteur de recommandation :
// nommer ≠ demander quoi choisir.
// ═══════════════════════════════════════════════════════════════════════════

describe('reconnaissance par marque', () => {
  const CAS: Array<[string, string]> = [
    ['apivar', 'apivar'],
    ['apitraz', 'apivar'],
    ['apistan', 'apistan'],
    ['apiguard', 'thymol'],
    ['apilife var', 'thymol'],
    ['thymovar', 'thymol'],
    ['maqs', 'formique'],
    ['api-bioxal', 'oxalique'],
    ['api bioxal', 'oxalique'],
    ['oxybee', 'oxalique'],
    ['varromed', 'oxalique'],
  ];

  it.each(CAS)('« %s » identifie le produit %s', (phrase, attendu) => {
    expect(identifierProduitParMarque(phrase)?.id).toBe(attendu);
  });

  it('reconnaît la marque au milieu d’une phrase', () => {
    expect(identifierProduitParMarque('j ai pose des lanieres apivar hier')?.id).toBe('apivar');
  });

  it('ne confond pas « apilife var » avec un mot contenant « var »', () => {
    // « var » seul (varroa, Var…) ne doit pas déclencher le thymol.
    expect(identifierProduitParMarque('comptage varroa')).toBeNull();
  });

  it('ne trouve rien quand aucune marque n’est citée', () => {
    expect(identifierProduitParMarque('je vais nourrir mes ruches')).toBeNull();
  });

  it('préfère la marque la plus longue', () => {
    // « apilife var » (thymol) doit gagner, pas une sous-chaîne plus courte.
    expect(identifierProduitParMarque('traitement apilife var')?.id).toBe('thymol');
  });
});

describe('frontière fiche / recommandation', () => {
  it('nommer un produit donne une FICHE, pas un classement', () => {
    expect(viseFicheProduit('apivar')).toBe(true);
    expect(viseVarroacide('apivar')).toBe(false);
  });

  it('demander quoi choisir garde le moteur de recommandation', () => {
    expect(viseVarroacide('quel varroacide en aout')).toBe(true);
    expect(viseFicheProduit('quel varroacide en aout')).toBe(false);
  });

  it('une question de choix CITANT une marque reste une question de choix', () => {
    expect(viseVarroacide('je traite avec apivar ou apiguard')).toBe(true);
    expect(viseFicheProduit('je traite avec apivar ou apiguard')).toBe(false);
  });
});

describe('contenu de la fiche', () => {
  const fiche = rendreFicheProduit(identifierProduitParMarque('apivar')!);

  it('dit ce que c’est et comment on l’applique', () => {
    expect(fiche).toContain('amitraze');
    expect(fiche).toContain('lanières');
  });

  it('énonce les interdits plutôt que de les taire', () => {
    expect(fiche).toContain('hausses posées');
    expect(fiche).toMatch(/bio/);
  });

  it('rappelle le cadre réglementaire quand le produit a une AMM', () => {
    expect(fiche).toContain('ordonnance vétérinaire');
    expect(fiche).toContain('registre');
  });

  it('propose la suite au lieu de clore — c’est une assistante, pas une notice', () => {
    expect(fiche).toMatch(/Ce que je peux faire pour toi/);
    expect(fiche.trimEnd()).toMatch(/\?$/);
  });

  it('chaque produit de la base produit une fiche exploitable', () => {
    for (const p of VARROACIDES) {
      const f = rendreFicheProduit(p);
      expect(f.length).toBeGreaterThan(200);
      expect(f).toContain(p.molecule);
      // Une fiche sans période serait inutilisable sur le terrain.
      expect(f).toMatch(/\*\*Quand\*\*/);
    }
  });
});

describe('intégrité de la base produits', () => {
  it('chaque produit porte au moins une marque et une forme', () => {
    for (const p of VARROACIDES) {
      expect(p.marques.length).toBeGreaterThan(0);
      expect(p.forme.length).toBeGreaterThan(0);
    }
  });

  it('les marques sont normalisées (minuscules, sans accent)', () => {
    for (const p of VARROACIDES) {
      for (const m of p.marques) {
        expect(m).toBe(m.toLowerCase());
        expect(m).not.toMatch(/[éèêàùôîï]/);
      }
    }
  });

  it('aucune marque n’est revendiquée par deux produits', () => {
    const vues = new Map<string, string>();
    for (const p of VARROACIDES) {
      for (const m of p.marques) {
        expect(vues.has(m), `« ${m} » revendiqué par ${vues.get(m)} et ${p.id}`).toBe(false);
        vues.set(m, p.id);
      }
    }
  });
});

describe('enseignes d’approvisionnement', () => {
  const CAS: Array<[string, string]> = [
    ['icko', 'icko'],
    ['j ai commande chez icko', 'icko'],
    ['la jocondienne', 'jocondienne'],
    ['thomas apiculture', 'thomas'],
    ['naturapi', 'naturapi'],
    ['apiculture.net', 'apiculture-net'],
    ['lerouge', 'lerouge'],
  ];

  it.each(CAS)('« %s » identifie l’enseigne %s', (phrase, attendu) => {
    expect(identifierFournisseur(phrase)?.id).toBe(attendu);
  });

  it('ne trouve rien quand aucune enseigne n’est citée', () => {
    expect(identifierFournisseur('je vais poser des hausses')).toBeNull();
  });

  it('assume ce qu’elle ignore au lieu d’inventer un catalogue', () => {
    const f = rendreFicheFournisseur(FOURNISSEURS[0]!);
    expect(f).toContain('Ce que je ne sais pas');
    expect(f).toMatch(/ni leur catalogue|ni leurs prix/);
  });

  it('bascule vers ce qu’APIGO sait réellement faire, et relance', () => {
    const f = rendreFicheFournisseur(FOURNISSEURS[0]!);
    expect(f).toMatch(/enregistrer un achat/);
    expect(f.trimEnd()).toMatch(/\?$/);
  });

  it('aucun alias n’est revendiqué par deux enseignes', () => {
    const vus = new Map<string, string>();
    for (const f of FOURNISSEURS) {
      for (const a of f.alias) {
        expect(vus.has(a), `« ${a} » revendiqué par ${vus.get(a)} et ${f.id}`).toBe(false);
        vus.set(a, f.id);
      }
    }
  });
});
