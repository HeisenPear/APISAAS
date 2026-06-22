import { describe, it, expect } from 'vitest';
import {
  domainForPath,
  memberWriteBlocked,
  workspaceLabel,
  type WorkspaceRole,
} from '../../../../server/utils/workspace';

describe('domainForPath', () => {
  it('classe les routes finance', () => {
    expect(domainForPath('/api/finances/ventes')).toBe('finance');
    expect(domainForPath('/api/clients/abc')).toBe('finance');
    expect(domainForPath('/api/bons-livraison')).toBe('finance');
  });
  it('classe les routes tech', () => {
    expect(domainForPath('/api/ruches/abc')).toBe('tech');
    expect(domainForPath('/api/interventions')).toBe('tech');
    expect(domainForPath('/api/production/recoltes')).toBe('tech');
  });
  it('classe les routes compte', () => {
    expect(domainForPath('/api/membres/inviter')).toBe('account');
    expect(domainForPath('/api/subscription/usage')).toBe('account');
    expect(domainForPath('/api/profils/me')).toBe('account');
  });
  it('classe le reste en other', () => {
    expect(domainForPath('/api/meteo/abc')).toBe('other');
    expect(domainForPath('/api/ia/copilote')).toBe('other');
  });
});

describe('memberWriteBlocked', () => {
  const cases: Array<[WorkspaceRole, Record<string, boolean>]> = [
    // admin : écrit tout (tech + finance + other) ; account jamais bloqué ici
    ['admin', { tech: false, finance: false, other: false, account: false }],
    // apiculteur : terrain oui, finances non
    ['apiculteur', { tech: false, finance: true, other: false, account: false }],
    // comptable : lecture seule → toute écriture bloquée (sauf account, géré en amont)
    ['comptable', { tech: true, finance: true, other: true, account: false }],
  ];

  for (const [role, expected] of cases) {
    it(`applique les bonnes règles pour ${role}`, () => {
      for (const [domain, blocked] of Object.entries(expected)) {
        expect(memberWriteBlocked(role, domain as 'tech' | 'finance' | 'other' | 'account')).toBe(
          blocked,
        );
      }
    });
  }

  it('bloque un rôle inconnu par sécurité', () => {
    expect(memberWriteBlocked('inconnu' as WorkspaceRole, 'tech')).toBe(true);
  });
});

describe('workspaceLabel', () => {
  it('priorise prénom + nom', () => {
    expect(workspaceLabel('Jean', 'Rucher', 'j@ex.fr')).toBe('Jean Rucher');
  });
  it('retombe sur l’email puis un libellé par défaut', () => {
    expect(workspaceLabel(null, null, 'j@ex.fr')).toBe('j@ex.fr');
    expect(workspaceLabel(null, null, null)).toBe('Exploitation');
  });
});
