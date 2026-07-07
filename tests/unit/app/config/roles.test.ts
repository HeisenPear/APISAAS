import { describe, it, expect } from 'vitest';
import {
  rolePeutEcrire,
  estRoleRestreint,
  ROLE_DEFS,
  ROLES_RESTREINTS,
} from '../../../../app/config/roles';

describe('rolePeutEcrire', () => {
  it('owner / admin / apiculteur ont accès complet', () => {
    for (const role of ['owner', 'admin', 'apiculteur'] as const) {
      expect(rolePeutEcrire(role, 'terrain')).toBe(true);
      expect(rolePeutEcrire(role, 'commerce')).toBe(true);
    }
  });

  it('technicien : terrain seulement', () => {
    expect(rolePeutEcrire('technicien', 'terrain')).toBe(true);
    expect(rolePeutEcrire('technicien', 'commerce')).toBe(false);
  });

  it('comptable : commerce seulement', () => {
    expect(rolePeutEcrire('comptable', 'commerce')).toBe(true);
    expect(rolePeutEcrire('comptable', 'terrain')).toBe(false);
  });

  it('lecture : aucune écriture', () => {
    expect(rolePeutEcrire('lecture', 'terrain')).toBe(false);
    expect(rolePeutEcrire('lecture', 'commerce')).toBe(false);
  });
});

describe('rôles restreints (Expert)', () => {
  it('technicien / comptable / lecture sont restreints', () => {
    expect(estRoleRestreint('technicien')).toBe(true);
    expect(estRoleRestreint('comptable')).toBe(true);
    expect(estRoleRestreint('lecture')).toBe(true);
  });
  it('admin / apiculteur ne le sont pas', () => {
    expect(estRoleRestreint('admin')).toBe(false);
    expect(estRoleRestreint('apiculteur')).toBe(false);
  });
  it('ROLE_DEFS et ROLES_RESTREINTS sont cohérents', () => {
    const restreintsDefs = ROLE_DEFS.filter((d) => d.restreint).map((d) => d.value);
    expect(restreintsDefs.sort()).toEqual([...ROLES_RESTREINTS].sort());
  });
});
