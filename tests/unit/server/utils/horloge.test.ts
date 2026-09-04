import { describe, it, expect } from 'vitest';
import { execSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import {
  anneeParis,
  dateParis,
  decalageParisMinutes,
  heureMinuteParis,
  heureParis,
  jourDuMoisParis,
  jourUtc,
  memeJourParis,
  minuitParis,
  moisParis,
  partiesParis,
  partiesParisOuNull,
} from '~~/server/utils/horloge';

// Toutes les dates sont écrites en UTC explicite (suffixe Z) : c'est le seul
// moyen de tester le fuseau Paris sans dépendre du TZ de la machine qui exécute
// les tests (CI en UTC, poste de dev en Europe/Paris).

describe('partiesParis', () => {
  it('lit les composantes dans le fuseau de Paris, pas celui du serveur', () => {
    // 23 h 30 UTC le 15 janvier = 00 h 30 le 16 janvier à Paris (CET, UTC+1).
    const p = partiesParis(new Date('2026-01-15T23:30:00Z'));
    expect(p).toEqual({ annee: 2026, mois: 1, jour: 16, heure: 0, minute: 30 });
  });

  it('lève sur une date invalide', () => {
    expect(() => partiesParis(new Date('n’importe quoi'))).toThrow();
  });
});

describe('partiesParisOuNull', () => {
  it('renvoie null sur une date invalide au lieu de lever', () => {
    expect(partiesParisOuNull(new Date('n’importe quoi'))).toBeNull();
  });

  it('renvoie les composantes sur une date valide', () => {
    expect(partiesParisOuNull(new Date('2026-06-15T10:00:00Z'))?.heure).toBe(12);
  });
});

describe('accesseurs', () => {
  it('anneeParis bascule à minuit heure de Paris, pas à minuit UTC', () => {
    // 31 décembre 23 h 30 UTC = 1er janvier 00 h 30 à Paris : l'année a changé
    // à Paris alors que getFullYear() sur un serveur en UTC dirait encore 2025.
    const reveillon = new Date('2025-12-31T23:30:00Z');
    expect(anneeParis(reveillon)).toBe(2026);
    expect(moisParis(reveillon)).toBe(1);
    expect(jourDuMoisParis(reveillon)).toBe(1);
  });

  it('heureParis rend une heure 0-23', () => {
    expect(heureParis(new Date('2026-06-15T22:00:00Z'))).toBe(0); // minuit, pas 24
    expect(heureParis(new Date('2026-06-15T10:00:00Z'))).toBe(12);
  });

  it('dateParis rend le jour civil parisien au format AAAA-MM-JJ', () => {
    expect(dateParis(new Date('2026-08-18T22:30:00Z'))).toBe('2026-08-19');
    expect(dateParis(new Date('2026-01-05T09:00:00Z'))).toBe('2026-01-05');
  });

  it('heureMinuteParis rend HH:MM sur 24 h', () => {
    expect(heureMinuteParis(new Date('2026-08-18T06:05:00Z'))).toBe('08:05');
    expect(heureMinuteParis(new Date('2026-01-15T23:30:00Z'))).toBe('00:30');
  });
});

describe('memeJourParis', () => {
  it('compare le jour civil de PARIS', () => {
    // Les deux instants tombent le 15 janvier pour un serveur en UTC, mais le
    // premier est déjà le 16 à Paris. C'est exactement le bug que produisait
    // `a.toDateString() === b.toDateString()` sur l'annonce des rendez-vous.
    const soir = new Date('2026-01-15T23:30:00Z'); // 16 janvier 00 h 30 à Paris
    const midi = new Date('2026-01-15T12:00:00Z'); // 15 janvier 13 h 00 à Paris
    expect(memeJourParis(soir, midi)).toBe(false);
    expect(memeJourParis(midi, new Date('2026-01-15T07:00:00Z'))).toBe(true);
  });
});

describe('decalageParisMinutes', () => {
  it('suit la bascule vers l’heure d’été (29 mars 2026, 02 h → 03 h)', () => {
    expect(decalageParisMinutes(new Date('2026-03-29T00:30:00Z'))).toBe(60); // CET
    expect(decalageParisMinutes(new Date('2026-03-29T01:30:00Z'))).toBe(120); // CEST
    expect(heureParis(new Date('2026-03-29T00:30:00Z'))).toBe(1);
    expect(heureParis(new Date('2026-03-29T01:30:00Z'))).toBe(3); // 02 h n'existe pas
  });

  it('suit le retour à l’heure d’hiver (25 octobre 2026, 03 h → 02 h)', () => {
    expect(decalageParisMinutes(new Date('2026-10-25T00:30:00Z'))).toBe(120); // CEST
    expect(decalageParisMinutes(new Date('2026-10-25T01:30:00Z'))).toBe(60); // CET
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// LA RÈGLE QUI FAIT DE CE MODULE UNE AUTORITÉ, ET PAS UNE BOÎTE À OUTILS.
//
// `horloge.ts` a été écrit pour une raison précise, inscrite en tête du
// fichier : « une fenêtre saisonnière qui s'ouvre le 1er mars s'ouvrait en
// réalité le 28 février à 23 h ». Il a corrigé six helpers… et vingt-huit
// autres lectures du calendrier dans le fuseau du SERVEUR ont continué de
// vivre à côté, dont les fenêtres saisonnières de Maya elles-mêmes.
//
// C'est le défaut de fond de ce dépôt : corriger des APPELS ne ferme pas une
// classe. Seule une règle la ferme.
// ═══════════════════════════════════════════════════════════════════════════

/** Le code d'un fichier, commentaires blanchis. */
function codeSeul(chemin: string): string {
  return readFileSync(chemin, 'utf-8')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .split('\n')
    .filter((l) => !/^\s*(\/\/|\*)/.test(l))
    .join('\n');
}

/**
 * Les `new Date(a, m, j)` — construction par COMPOSANTES — d'un fichier.
 *
 * ⚠️ CETTE FORME N'ÉTAIT PAS DANS LA LISTE, ET ELLE A LE MÊME DÉFAUT QUE LES
 * CINQ AUTRES. Le constructeur à plusieurs arguments interprète les
 * composantes dans le fuseau de qui EXÉCUTE : UTC sur Vercel, Paris sur un
 * poste de développement. Une borne « depuis le 1ᵉʳ janvier » n'y tombe donc
 * pas au même instant selon la machine.
 *
 * Trois routes la portaient. Deux ont été corrigées en leur temps et gardent
 * chacune un commentaire qui le raconte ; `production/stats.get.ts` avait été
 * oubliée — la troisième sœur, encore. Une règle écrite trois fois finit par
 * ne l'être que deux, et c'est précisément ce qu'un balayage sait empêcher.
 *
 * `Date.UTC(a, m, j)` reste permis : il DIT dans quel fuseau il construit,
 * comme les variantes `getUTC*`. Aucun test explicite ne l'exclut — ses
 * virgules sont imbriquées dans un appel, donc le comptage de premier niveau
 * suffit. Une garde `if (/Date\.UTC/)` avait d'abord été ajoutée « au cas
 * où » : la mutation a montré qu'elle ne servait à rien, et une garde qu'on
 * ne peut pas voir échouer est du bruit qui inspire une fausse confiance. Le
 * cas fabriqué, lui, reste — il documente la permission.
 *
 * On compte les virgules de PREMIER NIVEAU. Une première version prenait
 * `new Date(jourUtc(a, 12, 31).getTime() + n)` pour une construction par
 * composantes — la virgule appartenait à `jourUtc` — et une virgule finale de
 * mise en forme sur un appel multiligne comptait aussi.
 */
function datesParComposantes(chemin: string): string[] {
  const code = codeSeul(chemin);
  const trouvees: string[] = [];
  for (const m of code.matchAll(/new Date\(/g)) {
    const ouvrante = m.index! + m[0].length - 1;
    let profondeur = 0;
    let fin = ouvrante;
    for (; fin < code.length; fin++) {
      const c = code[fin]!;
      if ('([{'.includes(c)) profondeur++;
      else if (')]}'.includes(c)) {
        profondeur--;
        if (profondeur === 0) break;
      }
    }
    const args = code.slice(ouvrante + 1, fin);
    let p = 0;
    for (let k = 0; k < args.length; k++) {
      const c = args[k]!;
      if ('([{'.includes(c)) p++;
      else if (')]}'.includes(c)) p--;
      else if (c === ',' && p === 0 && args.slice(k + 1).trim() !== '') {
        trouvees.push(`new Date(${args.replace(/\s+/g, ' ').slice(0, 60)})`);
        break;
      }
    }
  }
  return trouvees;
}

/**
 * Qui a le DROIT de lire le calendrier hors de Paris — et POUR QUELLE LECTURE.
 *
 * ⚠️ LA DISPENSE EST PAR RÈGLE, PAS PAR FICHIER, ET CE N'EST PAS DU ZÈLE.
 * La première version dispensait `dashboard/production` en bloc, pour une
 * raison qui ne concernait que son découpage hebdomadaire. Elle couvrait donc
 * aussi, sans le dire, un `getFullYear()` parfaitement corrigeable qui vivait
 * trois lignes plus haut — et qui a effectivement survécu au balayage.
 *
 * Une dispense qui couvre plus large que son motif est un trou, pas une
 * exception.
 */
const DISPENSES: { fichier: string; regles: string[]; motif: string }[] = [
  {
    fichier: 'server/utils/horloge.ts',
    regles: ['getFullYear', 'getMonth', 'getDay', 'getHours', 'setFullYear'],
    motif: 'c’est l’implémentation : elle DOIT lire les composantes brutes',
  },
  {
    fichier: 'server/api/dashboard/production.get.ts',
    regles: ['getDay', 'getMonth'],
    motif:
      'le découpage hebdomadaire recopie en JavaScript ce que fait ' +
      "`date_trunc('week')` côté Postgres, qui tourne en UTC. Corriger un seul des " +
      'deux côtés ferait diverger la clé et la valeur : la barre afficherait 0. Le ' +
      "corriger demande de passer la requête en `AT TIME ZONE 'Europe/Paris'` — un " +
      'changement de comportement d’un widget, pas une substitution d’appel. Dette ' +
      'nommée, pas oubliée.',
  },
];

/** Ce fichier est-il dispensé de CETTE règle ? */
function estDispense(fichier: string, regle: string): boolean {
  return DISPENSES.some((d) => d.fichier === fichier && d.regles.includes(regle));
}

describe('personne ne lit le calendrier dans le fuseau du serveur', () => {
  const fichiers = execSync('find server -name "*.ts"', { encoding: 'utf-8' })
    .trim()
    .split('\n')
    .filter(Boolean)
    .sort();

  it('le balayage voit bien des fichiers (garde-fou)', () => {
    expect(fichiers.length, 'balayage vide : la règle ne mesure rien').toBeGreaterThan(100);
    // Et les dispenses désignent des fichiers qui EXISTENT : une dispense sur
    // un fichier renommé serait une porte laissée ouverte sur rien.
    for (const d of DISPENSES) {
      expect(fichiers, `dispense obsolète : ${d.fichier}`).toContain(d.fichier);
      expect(
        d.regles.length,
        `${d.fichier} : une dispense sans règle ne dispense rien`,
      ).toBeGreaterThan(0);
      expect(d.motif.length, `${d.fichier} : une dispense sans motif est un oubli`).toBeGreaterThan(
        40,
      );
    }
  });

  it.each([
    ['getFullYear', /\.getFullYear\(/],
    ['getMonth', /\.getMonth\(/],
    ['getDay', /\.getDay\(/],
    ['getHours', /\.getHours\(/],
    ['setFullYear', /\.setFullYear\(/],
  ])('%s ne s’appelle plus nulle part dans server/', (nom, motif) => {
    /**
     * ⚠️ CES CINQ-LÀ, ET PAS `getDate`. `setDate(getDate() ± n)` est une
     * arithmétique de JOURS, et elle est juste : JavaScript reporte
     * correctement d'un mois à l'autre. Ce sont les lectures de POSITION dans
     * le calendrier — quelle année, quel mois, quel jour de la semaine, quelle
     * heure — qui répondent dans le fuseau du serveur et se trompent de bord
     * aux deux heures qui bordent chaque minuit parisien.
     *
     * `setFullYear` s'y ajoute pour une autre raison : comme `setMonth`, il ne
     * borne pas le jour. Un 29 février plus un an donnait un 1er mars — sur la
     * DDM imprimée sur une étiquette de pot.
     *
     * Les variantes explicites (`getUTCFullYear`, `getUTCMonth`…) restent
     * permises : elles DISENT dans quel fuseau elles lisent.
     */
    const coupables = fichiers.filter((f) => !estDispense(f, nom) && motif.test(codeSeul(f)));
    expect(
      coupables,
      `${nom} lit dans le fuseau du SERVEUR — UTC sur Vercel. Passe par ` +
        '`horloge.ts` (anneeParis, moisParis, partiesParis…), ou par la variante ' +
        'getUTC* si le fuseau UTC est vraiment ce que tu veux.',
    ).toEqual([]);
  });
});

describe('personne ne CONSTRUIT une date par composantes dans server/', () => {
  const fichiers = execSync('find server -name "*.ts"', { encoding: 'utf-8' })
    .trim()
    .split('\n')
    .filter(Boolean)
    .sort();

  it('garde-fou : le détecteur voit bien la forme fautive, et pas les autres', () => {
    /**
     * ⚠️ SANS CE CAS, LA RÈGLE SERAIT VERTE POUR TOUJOURS DÈS QUE LE DÉPÔT EST
     * PROPRE. On donne au détecteur la ligne exacte qui a été retirée, puis
     * les trois formes qui doivent RESTER permises.
     */
    const fabrique = (src: string) => {
      const f = `${tmpdir()}/horloge-sonde-${src.length}.ts`;
      writeFileSync(f, src, 'utf-8');
      return datesParComposantes(f);
    };
    expect(fabrique('const d = new Date(annee, 0, 1);'), 'la forme fautive').toHaveLength(1);
    expect(fabrique('const d = new Date(Date.UTC(2026, 0, 1));'), 'Date.UTC est explicite').toEqual(
      [],
    );
    expect(
      fabrique('const d = new Date(jourUtc(a, 12, 31).getTime() + 86_399_000);'),
      'la virgule appartient à `jourUtc`',
    ).toEqual([]);
    expect(
      fabrique('const d = new Date(\n  a ?? b ?? c,\n);'),
      'virgule finale de mise en forme',
    ).toEqual([]);
  });

  it('aucune route ne pose sa borne dans le fuseau de la machine', () => {
    const coupables = fichiers
      .flatMap((f) => datesParComposantes(f).map((d) => `${f} :: ${d}`))
      .filter((x) => !x.startsWith('server/utils/horloge.ts'));
    expect(
      coupables,
      'Le constructeur à plusieurs arguments interprète les composantes dans le ' +
        'fuseau de qui EXÉCUTE — UTC sur Vercel, Paris en développement. Passe par ' +
        '`jourUtc` pour une VALEUR date-seule, `minuitParis` pour une BORNE.',
    ).toEqual([]);
  });
});

describe('borne à Paris, valeur en UTC', () => {
  it('jourUtc pose un jour qui se lit PAREIL des deux côtés', () => {
    /**
     * ⚠️ LA DISTINCTION QUI A COÛTÉ UNE RÉGRESSION. Un correctif a posé les
     * échéances d'achat récurrent à minuit À PARIS — 23 h 00 UTC la veille. Ce
     * dépôt stocke ses dates-seules à minuit UTC et les relit en UTC : une
     * échéance du 1er du mois se relisait dans le mois PRÉCÉDENT, et la
     * projection de trésorerie avançait la charge d'un mois.
     */
    const premierMars = jourUtc(2026, 3, 1);
    expect(premierMars.toISOString()).toBe('2026-03-01T00:00:00.000Z');
    expect(premierMars.getUTCMonth() + 1, 'lu par le serveur').toBe(3);
    expect(partiesParis(premierMars).mois, 'lu par l’apiculteur').toBe(3);
    expect(partiesParis(premierMars).jour).toBe(1);
  });

  it('minuitParis, lui, tombe la VEILLE en UTC — c’est voulu, pour une borne', () => {
    /**
     * Ce n'est pas un défaut : une borne « depuis le 1er mars » doit s'ouvrir
     * quand le mois s'ouvre POUR L'APICULTEUR. Le cas existe pour que personne
     * ne « corrige » `minuitParis` en croyant réparer quelque chose — les deux
     * fonctions répondent à deux besoins, et les confondre casse l'un ou
     * l'autre.
     */
    expect(minuitParis(2026, 3, 1).toISOString()).toBe('2026-02-28T23:00:00.000Z');
    expect(minuitParis(2026, 7, 1).toISOString(), 'heure d’été : deux heures').toBe(
      '2026-06-30T22:00:00.000Z',
    );
    // Et la propriété qui fait qu'une telle borne trie quand même juste des
    // valeurs date-seule : elle tombe APRÈS minuit UTC du jour précédent.
    expect(minuitParis(2026, 3, 1).getTime()).toBeGreaterThan(jourUtc(2026, 2, 28).getTime());
    expect(minuitParis(2026, 3, 1).getTime()).toBeLessThan(jourUtc(2026, 3, 1).getTime());
  });
});
