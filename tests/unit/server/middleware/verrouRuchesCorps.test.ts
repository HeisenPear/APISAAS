import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { doitLireLeCorps } from '~~/server/middleware/06.verrou-ruches';

/**
 * LE VERROU DE CHEPTEL SE CONTOURNAIT EN OMETTANT UN EN-TÊTE.
 *
 * Le middleware n'inspectait le corps que si `Content-Type` contenait
 * `application/json`. Un en-tête absent ne le contient pas : `candidats`
 * restait vide, le middleware sortait, et les quinze routes qui nomment la
 * ruche DANS LE CORPS (POST /api/interventions, /bulk, /mortalites,
 * /ruches/deplacer, /hausses/generer…) redevenaient libres.
 *
 * Or h3 se moque de l'en-tête pour PARSER. Son `readBody` teste
 * `application/json`, puis form-urlencoded, puis `text/`, et finit sur un
 * `else` qui parse le JSON quand même. La route lisait donc parfaitement un
 * corps que le verrou avait décidé d'ignorer.
 *
 * Sur un compte Découverte au-delà de son plafond, la même requête POST
 * renvoyait 402 avec l'en-tête et 201 sans. Il suffisait d'omettre une ligne
 * pour écrire sur des ruches que le plan déclare inaccessibles.
 *
 * ⚠️ CE BANC NE TESTE PAS « LES BONS TYPES SONT ACCEPTÉS ». Il teste la
 * propriété qui manquait : DEVANT UN TYPE QU'ON NE CONNAÎT PAS, ON REGARDE.
 * C'est la forme « je ne sais pas ⇒ j'inspecte », par opposition à « je ne sais
 * pas ⇒ je laisse passer » qui a déjà coûté deux compteurs de plafond dans ce
 * dépôt.
 */
describe('le verrou de cheptel inspecte le corps qu’il ne comprend pas', () => {
  it('l’en-tête ABSENT ne désarme plus le verrou', () => {
    // Le cas exact du contournement : h3 parse, le verrou doit regarder.
    expect(doitLireLeCorps(undefined)).toBe(true);
    expect(doitLireLeCorps('')).toBe(true);
  });

  it('un type inconnu ou exotique fait REGARDER, jamais passer', () => {
    for (const t of [
      'application/x-www-form-urlencoded',
      'text/plain',
      'application/json; charset=utf-8',
      'APPLICATION/JSON',
      'application/vnd.api+json',
      'n’importe quoi',
    ]) {
      expect(doitLireLeCorps(t), t).toBe(true);
    }
  });

  it('le multipart reste la SEULE exception, et pour une raison technique', () => {
    /**
     * Ce n'est pas une faveur : un corps multipart se lit en flux avec
     * `readMultipartFormData`, et le consommer dans le middleware priverait la
     * route du sien. C'est la seule raison admise de ne pas regarder.
     */
    expect(doitLireLeCorps('multipart/form-data; boundary=----abc')).toBe(false);
    expect(doitLireLeCorps('MULTIPART/FORM-DATA')).toBe(false);
  });

  it('le middleware APPELLE ce prédicat, il ne rejuge pas l’en-tête', () => {
    /**
     * ⚠️ ON EXIGE L'APPEL, PAS LE MOT. Une mutation l'a déjà démontré ailleurs
     * dans ce dépôt : le nom d'une fonction survit dans la ligne d'import et
     * garde l'assertion verte alors que l'appel a disparu. Et surtout : rien
     * n'empêche quelqu'un de remettre un test d'en-tête « juste pour ce
     * cas-là » — c'est exactement comme ça que le défaut est né.
     */
    const source = readFileSync('server/middleware/06.verrou-ruches.ts', 'utf-8')
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .split('\n')
      .filter((l) => !/^\s*(\/\/|\*)/.test(l))
      .join('\n');

    expect(source, 'le middleware doit APPELER doitLireLeCorps').toMatch(/doitLireLeCorps\(\s*\w/);
    expect(
      source,
      'un test positif sur application/json est revenu : c’est le défaut d’origine',
    ).not.toMatch(/includes\(\s*['"]application\/json/);
  });
});
