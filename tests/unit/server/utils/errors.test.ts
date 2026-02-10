import { describe, it, expect } from 'vitest';
import { H3Error } from 'h3';
import {
  notFound,
  forbidden,
  badRequest,
  unauthorized,
  conflict,
  tooManyRequests,
  internalError,
} from '~/server/utils/errors';

describe('server/utils/errors', () => {
  describe('notFound', () => {
    it('throws an H3Error with statusCode 404', () => {
      expect(() => notFound()).toThrowError();
      try {
        notFound();
      } catch (error: unknown) {
        const h3Error = error as H3Error;
        expect(h3Error).toBeInstanceOf(H3Error);
        expect(h3Error.statusCode).toBe(404);
        expect(h3Error.statusMessage).toBe('Not Found');
      }
    });

    it('uses the default message when none is provided', () => {
      try {
        notFound();
      } catch (error: unknown) {
        const h3Error = error as H3Error;
        expect(h3Error.message).toBe('Ressource introuvable');
      }
    });

    it('accepts a custom message', () => {
      try {
        notFound('Ruche non trouvee');
      } catch (error: unknown) {
        const h3Error = error as H3Error;
        expect(h3Error.message).toBe('Ruche non trouvee');
      }
    });
  });

  describe('forbidden', () => {
    it('throws an H3Error with statusCode 403', () => {
      expect(() => forbidden()).toThrowError();
      try {
        forbidden();
      } catch (error: unknown) {
        const h3Error = error as H3Error;
        expect(h3Error).toBeInstanceOf(H3Error);
        expect(h3Error.statusCode).toBe(403);
        expect(h3Error.statusMessage).toBe('Forbidden');
      }
    });

    it('uses the default message when none is provided', () => {
      try {
        forbidden();
      } catch (error: unknown) {
        const h3Error = error as H3Error;
        expect(h3Error.message).toBe('Acces interdit');
      }
    });

    it('accepts a custom message', () => {
      try {
        forbidden('Pas le proprietaire');
      } catch (error: unknown) {
        const h3Error = error as H3Error;
        expect(h3Error.message).toBe('Pas le proprietaire');
      }
    });
  });

  describe('badRequest', () => {
    it('throws an H3Error with statusCode 400', () => {
      expect(() => badRequest()).toThrowError();
      try {
        badRequest();
      } catch (error: unknown) {
        const h3Error = error as H3Error;
        expect(h3Error).toBeInstanceOf(H3Error);
        expect(h3Error.statusCode).toBe(400);
        expect(h3Error.statusMessage).toBe('Bad Request');
      }
    });

    it('uses the default message when none is provided', () => {
      try {
        badRequest();
      } catch (error: unknown) {
        const h3Error = error as H3Error;
        expect(h3Error.message).toBe('Requete invalide');
      }
    });

    it('accepts a custom message', () => {
      try {
        badRequest('Champ nom obligatoire');
      } catch (error: unknown) {
        const h3Error = error as H3Error;
        expect(h3Error.message).toBe('Champ nom obligatoire');
      }
    });
  });

  describe('unauthorized', () => {
    it('throws an H3Error with statusCode 401', () => {
      expect(() => unauthorized()).toThrowError();
      try {
        unauthorized();
      } catch (error: unknown) {
        const h3Error = error as H3Error;
        expect(h3Error).toBeInstanceOf(H3Error);
        expect(h3Error.statusCode).toBe(401);
        expect(h3Error.statusMessage).toBe('Unauthorized');
      }
    });

    it('uses the default message when none is provided', () => {
      try {
        unauthorized();
      } catch (error: unknown) {
        const h3Error = error as H3Error;
        expect(h3Error.message).toBe('Authentification requise');
      }
    });
  });

  describe('conflict', () => {
    it('throws an H3Error with statusCode 409', () => {
      expect(() => conflict()).toThrowError();
      try {
        conflict();
      } catch (error: unknown) {
        const h3Error = error as H3Error;
        expect(h3Error).toBeInstanceOf(H3Error);
        expect(h3Error.statusCode).toBe(409);
        expect(h3Error.statusMessage).toBe('Conflict');
      }
    });
  });

  describe('tooManyRequests', () => {
    it('throws an H3Error with statusCode 429', () => {
      expect(() => tooManyRequests()).toThrowError();
      try {
        tooManyRequests();
      } catch (error: unknown) {
        const h3Error = error as H3Error;
        expect(h3Error).toBeInstanceOf(H3Error);
        expect(h3Error.statusCode).toBe(429);
        expect(h3Error.statusMessage).toBe('Too Many Requests');
      }
    });
  });

  describe('internalError', () => {
    it('throws an H3Error with statusCode 500', () => {
      expect(() => internalError()).toThrowError();
      try {
        internalError();
      } catch (error: unknown) {
        const h3Error = error as H3Error;
        expect(h3Error).toBeInstanceOf(H3Error);
        expect(h3Error.statusCode).toBe(500);
        expect(h3Error.statusMessage).toBe('Internal Server Error');
      }
    });

    it('uses the default message when none is provided', () => {
      try {
        internalError();
      } catch (error: unknown) {
        const h3Error = error as H3Error;
        expect(h3Error.message).toBe('Erreur interne du serveur');
      }
    });
  });
});
