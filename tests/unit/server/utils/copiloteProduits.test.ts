import { describe, expect, it } from 'vitest';
import {
  lireCriteres,
  lireCriteresNourrissement,
  lireUsageRuche,
  recommanderNourrissement,
  recommanderRuche,
  viseTypeRuche,
  recommanderVarroacide,
  rendreRecommandation,
  viseVarroacide,
  VARROACIDES,
} from '~~/server/utils/copilote-produits';

// ═══════════════════════════════════════════════════════════════════════════
// Le cœur du cap produit : « pas la suggestion intelligente mais le calcul
// informatif d'après la question ». Donc chaque décision doit être prouvable.
// ═══════════════════════════════════════════════════════════════════════════

describe('lireCriteres', () => {
  it('lit un mois nommé', () => {
    expect(lireCriteres('je traite en decembre').mois).toBe(12);
  });

  it('lit une saison quand la date n’est pas donnée', () => {
    expect(lireCriteres('je traite apres la recolte').mois).toBe(8);
    expect(lireCriteres('traitement d hiver').mois).toBe(12);
  });

  it('n’utilise le mois courant que si la question dit « maintenant »', () => {
    expect(lireCriteres('quel varroacide', 3).mois).toBeUndefined();
    expect(lireCriteres('je traite maintenant', 3).mois).toBe(3);
  });

  it('lit le couvain, la température, le bio et les hausses', () => {
    const c = lireCriteres('traitement bio sans couvain il fait 12 degres hausses posees');
    expect(c).toMatchObject({ sansCouvain: true, temperature: 12, bio: true, haussesPosees: true });
  });

  it('ne devine RIEN quand la question ne dit rien', () => {
    expect(lireCriteres('quel varroacide choisir')).toEqual({});
  });
});

describe('recommanderVarroacide', () => {
  it('refuse de trancher sans le moindre critère', () => {
    // Sans contrainte, un classement serait une opinion déguisée en calcul.
    expect(recommanderVarroacide({})).toBeNull();
  });

  it('en bio, écarte les molécules de synthèse en le disant', () => {
    const r = recommanderVarroacide({ bio: true })!;
    expect(r.retenus.map((p) => p.id)).not.toContain('apivar');
    expect(r.ecartes.find((e) => e.produit.id === 'apivar')?.motif).toMatch(/biologique/);
  });

  it('hausses posées : ne garde que ce qui ne passe pas dans le miel', () => {
    const r = recommanderVarroacide({ haussesPosees: true })!;
    expect(r.retenus.map((p) => p.id)).toEqual(['formique']);
    expect(r.ecartes.every((e) => /miel/.test(e.motif))).toBe(true);
  });

  it('décembre sans couvain désigne l’acide oxalique', () => {
    const r = recommanderVarroacide({ mois: 12, sansCouvain: true })!;
    expect(r.retenus.map((p) => p.id)).toEqual(['oxalique']);
  });

  it('12 °C écarte le thymol, qui en demande 15', () => {
    const r = recommanderVarroacide({ mois: 8, temperature: 12 })!;
    expect(r.retenus.map((p) => p.id)).not.toContain('thymol');
    expect(r.ecartes.find((e) => e.produit.id === 'thymol')?.motif).toMatch(/15 °C/);
  });

  it('30 °C écarte l’acide formique, dangereux pour la reine au-delà de 29', () => {
    const r = recommanderVarroacide({ mois: 8, temperature: 30 })!;
    expect(r.ecartes.find((e) => e.produit.id === 'formique')?.motif).toMatch(/29 °C/);
  });

  it('assume de ne rien retenir plutôt que de proposer à côté', () => {
    // Bio + hausses posées + plein hiver : aucune combinaison valable.
    const r = recommanderVarroacide({ bio: true, haussesPosees: true, mois: 12 })!;
    expect(r.retenus).toHaveLength(0);
    expect(rendreRecommandation(r)).toMatch(/aucun varroacide/i);
  });

  it('chaque écarté porte TOUJOURS un motif lisible', () => {
    const r = recommanderVarroacide({ mois: 12, sansCouvain: true, bio: true })!;
    for (const e of r.ecartes) {
      expect(e.motif.length).toBeGreaterThan(5);
      expect(e.motif).not.toMatch(/undefined|NaN/);
    }
  });
});

describe('rendreRecommandation', () => {
  it('expose les critères lus ET les motifs d’exclusion', () => {
    const texte = rendreRecommandation(recommanderVarroacide({ mois: 12, sansCouvain: true })!);
    expect(texte).toMatch(/décembre/);
    expect(texte).toMatch(/sans couvain/);
    expect(texte).toMatch(/Écartés, et pourquoi/);
    // Le déterminisme est un argument de confiance : on le revendique.
    expect(texte).toMatch(/mes règles/);
    // Les deux constantes réglementaires ne disparaissent jamais.
    expect(texte).toMatch(/AMM/);
    expect(texte).toMatch(/alterner/);
  });
});

describe('viseVarroacide', () => {
  it('reconnaît une demande de choix', () => {
    expect(viseVarroacide('quel varroacide choisir')).toBe(true);
    expect(viseVarroacide('tu me conseilles quoi contre le varroa en bio')).toBe(true);
    expect(viseVarroacide('je traite le varroa avec quoi')).toBe(true);
  });

  it('ignore une question qui ne demande aucun choix', () => {
    expect(viseVarroacide('le varroa c est quoi')).toBe(false);
    expect(viseVarroacide('quel type de ruche')).toBe(false);
  });
});

describe('base produits', () => {
  it('aucun doublon d’identifiant', () => {
    expect(new Set(VARROACIDES.map((p) => p.id)).size).toBe(VARROACIDES.length);
  });

  it('tout produit porte une remarque utile', () => {
    for (const p of VARROACIDES) expect(p.remarque.length).toBeGreaterThan(20);
  });
});

// ─── Nourrissement ──────────────────────────────────────────────────────────

describe('recommanderNourrissement', () => {
  it('refuse de trancher sans critère', () => {
    expect(recommanderNourrissement({})).toBeNull();
  });

  it('en septembre, oriente vers le sirop lourd', () => {
    const r = recommanderNourrissement({ mois: 9 })!;
    expect(r.retenus.map((p) => p.id)).toEqual(['sirop-lourd']);
  });

  it('par grand froid, écarte les liquides au profit du candi', () => {
    const r = recommanderNourrissement({ mois: 12, temperature: 4 })!;
    expect(r.retenus.map((p) => p.id)).toEqual(['candi']);
  });

  it('distingue stimuler et constituer des réserves', () => {
    expect(recommanderNourrissement({ but: 'stimuler' })!.retenus.map((p) => p.id)).toEqual([
      'sirop-leger',
      'pate-proteinee',
    ]);
    expect(recommanderNourrissement({ but: 'reserves' })!.retenus.map((p) => p.id)).toEqual([
      'sirop-lourd',
    ]);
  });

  it('lit l’objectif dans la question', () => {
    expect(lireCriteresNourrissement('je veux relancer la ponte').but).toBe('stimuler');
    expect(lireCriteresNourrissement('constituer les reserves avant l hiver').but).toBe('reserves');
    expect(lireCriteresNourrissement('elle est a court, urgence').but).toBe('depanner');
    expect(lireCriteresNourrissement('je nourris avec quoi').but).toBeUndefined();
  });
});

// ─── Types de ruches ────────────────────────────────────────────────────────

describe('recommanderRuche', () => {
  it('ne recommande pas sans usage : sans usage, on définit, on ne conseille pas', () => {
    expect(recommanderRuche(undefined)).toBeNull();
  });

  it('pour transhumer, désigne la Langstroth', () => {
    expect(recommanderRuche('transhumance')!.retenus.map((r) => r.id)).toEqual(['langstroth']);
  });

  it('pour ménager le dos, désigne l’horizontale', () => {
    expect(recommanderRuche('menager-le-dos')!.retenus.map((r) => r.id)).toEqual(['kenyane']);
  });

  it('dit franchement la limite de chaque écartée', () => {
    for (const e of recommanderRuche('transhumance')!.ecartes) {
      expect(e.motif.length).toBeGreaterThan(10);
    }
  });

  it('lit l’usage dans la question', () => {
    expect(lireUsageRuche('quelle ruche pour la transhumance')).toBe('transhumance');
    expect(lireUsageRuche('j ai mal au dos, quelle ruche')).toBe('menager-le-dos');
    expect(lireUsageRuche('quelle ruche pour debuter')).toBe('debuter');
    expect(lireUsageRuche('quelle ruche')).toBeUndefined();
  });

  it('viseTypeRuche ignore une simple définition', () => {
    expect(viseTypeRuche('quel type de ruche pour la transhumance')).toBe(true);
    expect(viseTypeRuche('c est quoi une hausse')).toBe(false);
  });
});
