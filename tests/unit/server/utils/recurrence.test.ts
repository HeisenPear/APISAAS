import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { prochaineEcheance, joursDansLeMois } from '~~/server/utils/recurrence';
import { partiesParis } from '~~/server/utils/horloge';

/**
 * UN ACHAT MENSUEL DATÉ DU 29, 30 OU 31 SAUTAIT UN MOIS ENTIER.
 *
 * Les deux endroits qui calculaient l'échéance — la route et le cron —
 * écrivaient la même ligne : `base.setMonth(base.getMonth() + 1)`. `setMonth`
 * ne borne pas le jour : « le 31 février » est reporté au 3 MARS. Février
 * n'avait donc AUCUNE occurrence.
 *
 * La charge manquait alors dans le journal des achats, dans le résultat du
 * mois, dans la TVA déductible et dans la projection de trésorerie. Onze
 * occurrences au lieu de douze sur l'année, sans un message. Et la dérive était
 * DÉFINITIVE : le cron réappliquait la même formule à chaque passage.
 *
 * ⚠️ CE BANC NE TESTE PAS « LE MOIS SUIVANT ». Il teste les six dates qui
 * cassaient, nommément — parce qu'un mois de 31 jours suivi d'un mois de 31
 * jours marchait très bien, et que c'est ce qui a permis au défaut de vivre.
 */

/** Le jour/mois/année tels qu'un apiculteur français les lit. */
const lu = (d: Date) => {
  const p = partiesParis(d);
  return `${String(p.jour).padStart(2, '0')}/${String(p.mois).padStart(2, '0')}/${p.annee}`;
};

/** Minuit à Paris ce jour-là — la façon dont les échéances sont posées. */
const paris = (iso: string) => new Date(`${iso}T00:00:00+01:00`);

describe('la prochaine échéance ne saute jamais un mois', () => {
  it('les six dates qui cassaient tombent maintenant juste', () => {
    /**
     * Chaque ligne a été MESURÉE sur l'ancienne formule avant d'être corrigée.
     * La colonne du milieu est ce que `setMonth(+1)` produisait vraiment.
     */
    const cas: [string, string, string][] = [
      ['2026-01-31', '03/03/2026', '28/02/2026'],
      ['2026-03-31', '01/05/2026', '30/04/2026'],
      ['2026-05-31', '01/07/2026', '30/06/2026'],
      ['2026-08-31', '01/10/2026', '30/09/2026'],
      ['2026-01-30', '02/03/2026', '28/02/2026'],
      ['2026-01-29', '01/03/2026', '28/02/2026'],
    ];
    for (const [origine, ancienFaux, attendu] of cas) {
      const obtenu = lu(prochaineEcheance(paris(origine), 'mensuel'));
      expect(obtenu, `${origine} : l’ancienne formule donnait ${ancienFaux}`).toBe(attendu);
    }
  });

  it('un mois normal reste un mois normal (garde-fou)', () => {
    // Sans ce cas, une fonction qui rendrait toujours le dernier jour du mois
    // passerait toutes les assertions ci-dessus.
    expect(lu(prochaineEcheance(paris('2026-01-15'), 'mensuel'))).toBe('15/02/2026');
    expect(lu(prochaineEcheance(paris('2026-06-01'), 'mensuel'))).toBe('01/07/2026');
    expect(lu(prochaineEcheance(paris('2026-12-15'), 'mensuel'))).toBe('15/01/2027');
  });

  it('L’ANCRE tient le jour d’origine — sinon le 31 est perdu pour toujours', () => {
    /**
     * ⚠️ LE CAS QUI DISTINGUE UNE VRAIE CORRECTION D'UNE DEMI-CORRECTION.
     *
     * Borner au dernier jour du mois suffit à ne plus SAUTER février. Mais sans
     * ancre, la suite dérive : 31 janv → 28 fév → 28 mars → 28 avr… et le 31
     * ne revient jamais. On rejoue donc l'année entière, comme le cron le fera.
     */
    const ancre = paris('2026-01-31');
    let courante = ancre;
    const suite: string[] = [];
    for (let i = 0; i < 5; i++) {
      courante = prochaineEcheance(courante, 'mensuel', ancre);
      suite.push(lu(courante));
    }
    expect(suite).toEqual([
      '28/02/2026',
      '31/03/2026',
      '30/04/2026',
      '31/05/2026',
      '30/06/2026',
    ]);
  });

  it('l’annuel borne le 29 février au lieu de glisser au 1er mars', () => {
    // Même famille : `setFullYear(+1)` sur un 29 février donnait un 1er mars.
    expect(lu(prochaineEcheance(paris('2028-02-29'), 'annuel'))).toBe('28/02/2029');
    expect(lu(prochaineEcheance(paris('2026-07-14'), 'annuel'))).toBe('14/07/2027');
  });

  it('le compte de jours du mois est juste, années bissextiles comprises', () => {
    expect(joursDansLeMois(2026, 2)).toBe(28);
    expect(joursDansLeMois(2028, 2)).toBe(29); // bissextile
    expect(joursDansLeMois(2100, 2)).toBe(28); // séculaire non bissextile
    expect(joursDansLeMois(2026, 12)).toBe(31);
  });

  it('l’échéance tombe à minuit À PARIS, pas sur le serveur', () => {
    /**
     * Les lambdas Vercel tournent en UTC. Une échéance construite avec
     * `Date.UTC` tomberait le 1er du mois à 00 h 00 UTC, soit le 1er à 01 h ou
     * 02 h à Paris — et toute lecture du JOUR côté Paris resterait juste, mais
     * la borne d'un « avant le 1er » ne le serait plus. On vérifie l'aller-retour.
     */
    for (const iso of ['2026-01-15', '2026-06-15']) {
      const p = partiesParis(prochaineEcheance(paris(iso), 'mensuel'));
      expect([p.heure, p.minute], iso).toEqual([0, 0]);
    }
  });

  it('les DEUX appelants passent par cette règle, aucun ne recalcule', () => {
    /**
     * ⚠️ C'EST LA COPIE QUI A CRÉÉ LE DÉFAUT : la même ligne fautive écrite à
     * deux endroits. Rien n'empêche de la réécrire « juste pour ce cas-là ».
     * On exige l'APPEL — le nom seul survivrait dans une ligne d'import.
     */
    for (const f of ['server/api/finances/achats.post.ts', 'server/crons/achats-recurrents.ts']) {
      const code = readFileSync(f, 'utf-8')
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .split('\n')
        .filter((l) => !/^\s*(\/\/|\*)/.test(l))
        .join('\n');
      expect(code, `${f} doit APPELER prochaineEcheance`).toMatch(/prochaineEcheance\(\s*\w/);
      expect(code, `${f} ne doit plus décaler le mois lui-même`).not.toMatch(
        /setMonth\(\s*\w+\.getMonth\(\)\s*\+\s*1\s*\)/,
      );
      expect(code, `${f} ne doit plus décaler l’année lui-même`).not.toMatch(
        /setFullYear\(\s*\w+\.getFullYear\(\)\s*\+\s*1\s*\)/,
      );
    }
  });
});
