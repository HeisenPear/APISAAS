// ═══════════════════════════════════════════════════════════════════════════
// UNE FACTURE SAISIE LE 1ᵉʳ JANVIER À MINUIT TRENTE ÉTAIT DATÉE DU 31 DÉCEMBRE.
//
// `new Date().toISOString()` découpé en dix rend la date UTC. Vingt-sept
// pré-remplissages de formulaire le faisaient. En France — UTC+1 l'hiver,
// UTC+2 l'été — cela veut dire qu'entre minuit et une heure (deux en été), la
// date proposée est CELLE DE LA VEILLE :
//
//   · une visite sanitaire, une déclaration de mortalité ou une ordonnance —
//     des pièces que le registre d'élevage doit dater juste — reçoivent la
//     date d'hier ;
//   · une facture saisie le 1ᵉʳ janvier à 00 h 30 est datée du 31 décembre,
//     donc rattachée à L'EXERCICE PRÉCÉDENT.
//
// C'est le profil exact des bogues de fuseau que ce dépôt connaît déjà côté
// serveur : jamais reproductible à la demande, visible seulement pour qui
// saisit à cette heure-là, et donc jamais signalé.
//
// ⚠️ CE BANC FORCE LE FUSEAU. Les tests tournent en UTC — comme les lambdas
// Vercel — et sous UTC la date locale et la date UTC sont la MÊME : un banc
// naïf y serait vert quoi qu'il arrive, sur le code d'avant comme sur celui
// d'après. On pose donc `Europe/Paris` et on VÉRIFIE que le fuseau a bien été
// pris, plutôt que de laisser la branche intéressante non traversée.
// ═══════════════════════════════════════════════════════════════════════════

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { dateDuJour, dateLocale } from '~~/app/utils/dateDuJour';

/** Le moment qui casse : 23 h 30 UTC le 31 décembre = 00 h 30 à Paris, le 1ᵉʳ janvier. */
const REVEILLON = new Date('2025-12-31T23:30:00Z');
/** L'été, le décalage est de deux heures : 22 h 30 UTC = 00 h 30 à Paris. */
const NUIT_D_ETE = new Date('2026-07-14T22:30:00Z');

const TZ_ORIGINE = process.env.TZ;
beforeAll(() => {
  process.env.TZ = 'Europe/Paris';
});
afterAll(() => {
  process.env.TZ = TZ_ORIGINE;
});

describe('garde-fou : le fuseau est bien forcé', () => {
  it('sans quoi ce banc serait vert sur le code d’avant', () => {
    /**
     * Si `process.env.TZ` n'était pas pris en compte par cette version de
     * Node, les cas suivants compareraient deux fois la même chose. On le
     * constate plutôt que de l'espérer.
     */
    expect(
      REVEILLON.getFullYear(),
      'le fuseau Europe/Paris n’a pas été pris : ce banc ne mesure rien',
    ).toBe(2026);
    expect(REVEILLON.toISOString().slice(0, 10), 'l’heure UTC, elle, est bien la veille').toBe(
      '2025-12-31',
    );
  });
});

describe('la RÈGLE : la date proposée est celle de l’apiculteur', () => {
  it('le réveillon — la facture ne bascule plus dans l’exercice précédent', () => {
    expect(dateDuJour(REVEILLON), 'à 00 h 30 le 1ᵉʳ janvier, on est le 1ᵉʳ janvier').toBe(
      '2026-01-01',
    );
    expect(
      dateDuJour(REVEILLON),
      'l’ancienne formule rendait le 31 décembre — exercice précédent',
    ).not.toBe(REVEILLON.toISOString().slice(0, 10));
  });

  it('une nuit d’été — le décalage est de deux heures', () => {
    expect(dateDuJour(NUIT_D_ETE)).toBe('2026-07-15');
    expect(dateDuJour(NUIT_D_ETE)).not.toBe(NUIT_D_ETE.toISOString().slice(0, 10));
  });

  it('en pleine journée, les deux coïncident — et c’est ce qui rendait le défaut invisible', () => {
    const midi = new Date('2026-06-10T12:00:00Z');
    expect(dateDuJour(midi)).toBe('2026-06-10');
    expect(dateDuJour(midi)).toBe(midi.toISOString().slice(0, 10));
  });

  it('les mois et les jours sont bien complétés à deux chiffres', () => {
    expect(dateDuJour(new Date('2026-03-05T10:00:00Z'))).toBe('2026-03-05');
    expect(dateLocale('2026-11-09T10:00:00Z')).toBe('2026-11-09');
  });
});

// ─── Le balayage qui empêche le retour ───────────────────────────────────────

const RACINE = 'app';
const MOTIF_FAUTIF =
  /new Date\(\)\s*\.toISOString\(\)\s*\.\s*(?:slice\(0,\s*10\)|split\('T'\)\[0\])/;

function fichiers(dir: string): string[] {
  const out: string[] = [];
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    if (statSync(p).isDirectory()) out.push(...fichiers(p));
    else if (e.endsWith('.vue') || e.endsWith('.ts')) out.push(p);
  }
  return out;
}

describe('la RÈGLE : plus aucun « aujourd’hui » en UTC dans l’interface', () => {
  it('le balayage voit bien les fichiers', () => {
    /**
     * Un chemin erroné rend la liste vide, donc la conformité « vérifiée » —
     * la forme de faux vert la plus banale de ce dépôt.
     */
    expect(
      fichiers(RACINE).length,
      'aucun fichier lu — le balayage ne mesure rien',
    ).toBeGreaterThan(200);
  });

  it('⚠️ CONTRÔLE POSITIF — le motif reconnaît bien la formule d’hier', () => {
    /**
     * Sans lui, un motif qui ne correspondrait à RIEN rendrait la règle verte
     * pour toujours. On lui donne la ligne exacte qui a été retirée.
     */
    expect(MOTIF_FAUTIF.test('  dateTransaction: new Date().toISOString().slice(0, 10),')).toBe(
      true,
    );
    expect(MOTIF_FAUTIF.test("const today = new Date().toISOString().split('T')[0]!;")).toBe(true);
  });

  it('⚠️ CONTRÔLE NÉGATIF — relire une date STOCKÉE reste permis', () => {
    /**
     * Une valeur date-seule est rangée à MINUIT UTC (cf. `jourUtc`) : la
     * relire par `toISOString()` rend le bon jour des deux côtés, et la
     * passer en local la décalerait d'un jour. Ces appels-là sont JUSTES.
     * La différence tient en un mot : `new Date()` sans argument signifie
     * « maintenant », donc « chez l'apiculteur ».
     */
    expect(MOTIF_FAUTIF.test('new Date(recolte.dateRecolte).toISOString().slice(0, 10)')).toBe(
      false,
    );
    expect(MOTIF_FAUTIF.test('d.toISOString().slice(0, 10)')).toBe(false);
  });

  it('aucun fichier de l’interface ne propose la date UTC', () => {
    const fautifs = fichiers(RACINE)
      .filter((f) => !f.endsWith('utils/dateDuJour.ts'))
      .filter((f) => MOTIF_FAUTIF.test(readFileSync(f, 'utf-8')));

    expect(
      fautifs,
      'Un formulaire qui propose la date UTC date d’hier tout ce qui est saisi ' +
        'après minuit — y compris les pièces que le registre d’élevage doit dater ' +
        'juste, et les factures dont l’exercice dépend.',
    ).toEqual([]);
  });
});
