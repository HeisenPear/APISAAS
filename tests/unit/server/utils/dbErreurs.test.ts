import { describe, expect, it } from 'vitest';
import { codeErreurBase, isDeadConnectionError } from '~/server/utils/db';

/**
 * Le code d'erreur de la base, et rien d'autre — mais c'est LUI qui décide si
 * l'on recycle le pool de connexions.
 *
 * Pourquoi ce banc existe : la couche base n'était couverte par AUCUN test (les
 * 938 autres sont des tests purs, aucun ne touche à `server/utils/db`). Or
 * Drizzle enveloppe les erreurs du driver depuis la 0.44 — `DrizzleQueryError`
 * n'expose pas `.code`, il pousse l'erreur d'origine dans `.cause`. La lecture
 * naïve `err.code` aurait alors renvoyé `undefined` en toute discrétion :
 * `dbWatchdog` n'aurait plus recyclé le pool, `withDbRetry` n'aurait plus
 * relancé, et les 504 de l'incident CONNECTION_DESTROYED seraient revenus.
 *
 * Ni le typecheck (le code casse le type) ni le build ne l'auraient vu.
 */

/** Reproduit l'enveloppe de Drizzle ≥ 0.44 : le code part dans `cause`. */
function commeDrizzle(origine: unknown): Error {
  const e = new Error('Failed query: select * from ruches\nparams: ');
  (e as Error & { cause?: unknown }).cause = origine;
  return e;
}

describe('code d’erreur de la base', () => {
  it('le lit à la racine (driver nu, drizzle 0.38)', () => {
    expect(codeErreurBase({ code: 'CONNECTION_DESTROYED' })).toBe('CONNECTION_DESTROYED');
    expect(codeErreurBase({ code: '23505' })).toBe('23505');
  });

  it('le retrouve DANS LA CAUSE (drizzle ≥ 0.44)', () => {
    expect(codeErreurBase(commeDrizzle({ code: 'CONNECTION_DESTROYED' }))).toBe(
      'CONNECTION_DESTROYED',
    );
    expect(codeErreurBase(commeDrizzle({ code: '23505' }))).toBe('23505');
  });

  it('descend plusieurs niveaux de causes', () => {
    expect(codeErreurBase(commeDrizzle(commeDrizzle({ code: '08P01' })))).toBe('08P01');
  });

  it('ne boucle pas sur une chaîne de causes circulaire', () => {
    const a = new Error('a') as Error & { cause?: unknown };
    const b = new Error('b') as Error & { cause?: unknown };
    a.cause = b;
    b.cause = a;
    expect(codeErreurBase(a)).toBeUndefined();
  });

  it('rend undefined quand il n’y a pas de code, sans jamais lever', () => {
    expect(codeErreurBase(null)).toBeUndefined();
    expect(codeErreurBase(undefined)).toBeUndefined();
    expect(codeErreurBase('juste un texte')).toBeUndefined();
    expect(codeErreurBase(new Error('sans code'))).toBeUndefined();
    // Un `code` non textuel (certains drivers mettent un nombre) ne doit pas
    // remonter tel quel : les comparaisons se font sur des chaînes.
    expect(codeErreurBase({ code: 42 })).toBeUndefined();
  });
});

describe('détection d’une connexion morte', () => {
  it('reconnaît les codes du pooler, enveloppés ou non', () => {
    for (const code of ['CONNECTION_DESTROYED', 'CONNECTION_CLOSED', 'CONNECTION_ENDED', '08P01']) {
      expect(isDeadConnectionError({ code }), code).toBe(true);
      expect(isDeadConnectionError(commeDrizzle({ code })), `${code} enveloppé`).toBe(true);
    }
  });

  it('ne confond pas une erreur métier avec une connexion morte', () => {
    // Recycler le pool sur une violation d'unicité serait une réaction absurde,
    // et coûteuse : toutes les connexions chaudes seraient jetées.
    expect(isDeadConnectionError({ code: '23505' })).toBe(false);
    expect(isDeadConnectionError(commeDrizzle({ code: '23505' }))).toBe(false);
    expect(isDeadConnectionError(new Error('timeout applicatif'))).toBe(false);
    expect(isDeadConnectionError(null)).toBe(false);
  });
});
