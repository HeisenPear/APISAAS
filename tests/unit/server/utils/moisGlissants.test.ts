import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import {
  debutDuMoisDecaleParis,
  joursDansLeMois,
  moisDecaleParis,
  partiesParis,
} from '~~/server/utils/horloge';

// ═══════════════════════════════════════════════════════════════════════════
// LES FENÊTRES GLISSANTES QUI SAUTAIENT UN MOIS.
//
// `d.setMonth(d.getMonth() + n)` NE BORNE PAS LE JOUR. Le 31 mars moins onze
// mois donne « le 31 avril », que JavaScript reporte au 1er MAI. La formule est
// juste vingt-quatre jours sur trente et un, et fausse les autres — ce qui est
// la pire des proportions : assez rare pour n'être jamais reproduit à la
// demande, assez fréquent pour être vu.
//
// TROIS ENDROITS L'ÉCRIVAIENT, et le défaut a été payé trois fois :
//
//   · les achats récurrents du 29, 30 ou 31 sautaient un mois entier — onze
//     occurrences par an au lieu de douze, et la dérive était définitive
//     puisque le cron réappliquait la formule à chaque passage ;
//   · la série « 12 derniers mois » de Maya démarrait un mois trop tard ET
//     affichait à sa droite un mois QUI N'A PAS ENCORE EU LIEU — une colonne
//     vide, forcément à zéro ;
//   · le flux iCal perdait cinq jours d'historique le 31 août.
//
// Ce banc garde la primitive ET la règle : plus personne n'écrit `setMonth`
// dans `server/`.
// ═══════════════════════════════════════════════════════════════════════════

/** Les jours où l'ancienne formule débordait, pour une fenêtre de −11 mois. */
const JOURS_PIEGES = [
  { jour: '2026-01-29', attendu: '2025-02' },
  { jour: '2026-01-30', attendu: '2025-02' },
  { jour: '2026-01-31', attendu: '2025-02' },
  { jour: '2026-03-31', attendu: '2025-04' },
  { jour: '2026-05-31', attendu: '2025-06' },
  { jour: '2026-08-31', attendu: '2025-09' },
  { jour: '2026-10-31', attendu: '2025-11' },
];

/** « AAAA-MM » d'un instant, lu à Paris. */
function moisParisDe(d: Date): string {
  const p = partiesParis(d);
  return `${p.annee}-${String(p.mois).padStart(2, '0')}`;
}

describe('décaler d’un nombre de mois', () => {
  it('le jeu de cas piégés n’est pas vide (garde-fou)', () => {
    expect(JOURS_PIEGES.length, 'aucun cas piégé : la règle ne mesure rien').toBe(7);
  });

  it.each(JOURS_PIEGES)(
    'le $jour, la fenêtre de 12 mois démarre en $attendu',
    ({ jour, attendu }) => {
      /**
       * L'ancienne formule répondait un mois plus tard sur ces sept jours-là :
       * le 31 mars, la fenêtre partait de mai 2025 au lieu d'avril 2025.
       */
      const debut = debutDuMoisDecaleParis(new Date(`${jour}T12:00:00Z`), -11);
      expect(moisParisDe(debut)).toBe(attendu);
    },
  );

  it('la douzième colonne est le mois COURANT, jamais un mois à venir', () => {
    /**
     * ⚠️ LA CONSÉQUENCE LA PLUS VISIBLE, ET LA PLUS ABSURDE : « vos 12 derniers
     * mois » se terminait sur un mois qui n'avait pas commencé. Une barre à
     * zéro, à droite, dont l'apiculteur ne pouvait rien conclure sinon que son
     * chiffre d'affaires s'était effondré.
     */
    for (const { jour } of JOURS_PIEGES) {
      const aujourdhui = new Date(`${jour}T12:00:00Z`);
      const debut = debutDuMoisDecaleParis(aujourdhui, -11);
      const derniere = debutDuMoisDecaleParis(debut, 11);
      expect(moisParisDe(derniere), `le ${jour}, la dernière colonne dépasse le mois courant`).toBe(
        moisParisDe(aujourdhui),
      );
    }
  });

  it('les douze mois d’une fenêtre sont douze mois DIFFÉRENTS et consécutifs', () => {
    const debut = debutDuMoisDecaleParis(new Date('2026-03-31T12:00:00Z'), -11);
    const mois = Array.from({ length: 12 }, (_, i) =>
      moisParisDe(debutDuMoisDecaleParis(debut, i)),
    );
    expect(new Set(mois).size, `mois obtenus : ${mois.join(', ')}`).toBe(12);
    expect(mois[0]).toBe('2025-04');
    expect(mois[11]).toBe('2026-03');
  });

  it('le décalage franchit les années, dans les deux sens', () => {
    expect(moisParisDe(debutDuMoisDecaleParis(new Date('2026-02-10T12:00:00Z'), -14))).toBe(
      '2024-12',
    );
    expect(moisParisDe(debutDuMoisDecaleParis(new Date('2026-02-10T12:00:00Z'), 25))).toBe(
      '2028-03',
    );
  });

  it('un décalage à jour constant se BORNE au lieu de déborder', () => {
    /**
     * C'est le besoin du flux iCal : « il y a six mois », pas « le premier du
     * mois d'il y a six mois ». Le 31 août moins six mois n'existe pas —
     * `setMonth` répondait le 3 mars, on répond le 28 février.
     */
    const borne = (jour: string, delta: number) =>
      moisDecaleParis(new Date(`${jour}T12:00:00Z`), delta);
    expect(partiesParis(borne('2026-08-31', -6)).jour).toBe(28);
    expect(moisParisDe(borne('2026-08-31', -6))).toBe('2026-02');
    expect(partiesParis(borne('2028-08-31', -6)).jour, '2028 est bissextile').toBe(29);
    expect(partiesParis(borne('2026-01-31', 1)).jour).toBe(28);
    expect(partiesParis(borne('2026-03-15', -6)).jour, 'un jour qui existe ne bouge pas').toBe(15);
  });

  it('joursDansLeMois connaît février, y compris les années séculaires', () => {
    expect(joursDansLeMois(2026, 2)).toBe(28);
    expect(joursDansLeMois(2028, 2)).toBe(29);
    expect(joursDansLeMois(2100, 2)).toBe(28);
    expect(joursDansLeMois(2026, 12)).toBe(31);
  });

  it('plus personne n’écrit `setMonth` dans server/', () => {
    /**
     * ⚠️ LA RÈGLE QUI FERME LA CLASSE ENTIÈRE. Corriger trois appels ne protège
     * pas du quatrième : c'est la formule elle-même qui est un piège, et elle
     * s'écrit naturellement sous les doigts. On l'interdit, et l'horloge la
     * remplace.
     *
     * Les commentaires sont blanchis : ce banc et les fichiers corrigés
     * RACONTENT le défaut, donc ils contiennent tous « setMonth ». Sans ce
     * blanchiment, la règle accuserait les fichiers réparés — le piège dans
     * lequel ce dépôt est déjà tombé six fois.
     */
    const fichiers = execSync('find server -name "*.ts"', { encoding: 'utf-8' })
      .trim()
      .split('\n')
      .filter(Boolean);
    expect(fichiers.length, 'balayage vide : la règle ne mesure rien').toBeGreaterThan(100);
    const coupables = fichiers.filter((f) => {
      const code = readFileSync(f, 'utf-8')
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .split('\n')
        .filter((l) => !/^\s*(\/\/|\*)/.test(l))
        .join('\n');
      return /\.setMonth\(/.test(code);
    });
    expect(
      coupables,
      'setMonth ne borne pas le jour : le 31 d’un mois déborde sur le suivant. ' +
        'Utilise `debutDuMoisDecaleParis` (fenêtre) ou `moisDecaleParis` (jour constant).',
    ).toEqual([]);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// ET LA CONSÉQUENCE, MESURÉE LÀ OÙ ELLE SE VOIT : LA SÉRIE DE MAYA.
// ═══════════════════════════════════════════════════════════════════════════

describe('la série 12 mois que Maya présente', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    // Le 31 mars : l'un des sept jours où l'ancienne formule débordait.
    vi.setSystemTime(new Date('2026-03-31T10:00:00Z'));
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.resetModules();
  });

  /** Un double minimal : les deux requêtes de la série, et rien d'autre. */
  function poser(ventes: { d: Date; total: string }[]) {
    let appel = 0;
    Object.assign(globalThis, {
      db: {
        select: () => ({
          from: () => ({
            where: () => Promise.resolve(appel++ === 0 ? ventes : []),
          }),
        }),
      },
    });
  }

  it('la dernière colonne est mars, pas avril (garde-fou + défaut)', async () => {
    poser([]);
    const { getSerie12Mois } = await import('~~/server/utils/copilote-data');
    const serie = await getSerie12Mois('apiculteur-1');

    expect(serie.labels.length, 'douze colonnes attendues').toBe(12);
    expect(
      serie.labels[11],
      `libellés : ${serie.labels.join(' ')} — la douzième colonne portait « avr. », ` +
        'un mois qui n’avait pas commencé',
    ).toBe('mars');
    expect(serie.labels[0]).toBe('avr.');
  });

  it('une vente du plus ancien mois de la fenêtre est bien COMPTÉE', async () => {
    /**
     * L'autre moitié du défaut, et la plus coûteuse : la fenêtre démarrant un
     * mois trop tard, tout le mois d'avril 2025 tombait hors de la requête ET
     * hors de l'index. Le chiffre d'affaires de ce mois-là disparaissait du
     * graphique sans laisser de trace.
     */
    poser([{ d: new Date('2025-04-15T09:00:00Z'), total: '1240.00' }]);
    const { getSerie12Mois } = await import('~~/server/utils/copilote-data');
    const serie = await getSerie12Mois('apiculteur-1');

    // La série arrondit à l'euro : on choisit un montant entier pour que ce
    // cas mesure la FENÊTRE, et pas l'arrondi.
    expect(serie.ca[0], 'la vente d’avril 2025 n’est comptée nulle part').toBe(1240);
    expect(
      serie.ca.reduce((s, v) => s + v, 0),
      'elle ne doit être comptée qu’une fois',
    ).toBe(1240);
  });

  it('une vente des deux dernières heures du mois reste dans SON mois', async () => {
    /**
     * ⚠️ La clé de regroupement se lisait sur le serveur. Une vente du
     * 1er juillet à 01 h 30 à Paris est horodatée 30 juin 23 h 30 UTC : elle
     * s'imputait à JUIN. Deux heures par mois, tous les mois.
     */
    poser([{ d: new Date('2025-06-30T23:30:00Z'), total: '100.00' }]); // 1er juillet à Paris
    const { getSerie12Mois } = await import('~~/server/utils/copilote-data');
    const serie = await getSerie12Mois('apiculteur-1');

    const juillet = serie.labels.indexOf('juil.');
    expect(juillet, 'juillet doit être dans la fenêtre').toBeGreaterThanOrEqual(0);
    expect(serie.ca[juillet], `répartition : ${serie.ca.join(', ')}`).toBe(100);
  });
});
