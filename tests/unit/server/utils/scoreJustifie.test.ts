// ═══════════════════════════════════════════════════════════════════════════
// « CHAQUE POINT RETIRÉ EST JUSTIFIÉ. RIEN N'EST OPAQUE. »
//
// C'est la quatrième des limites que `/maya` affiche comme un engagement. Le
// code la contredisait DEUX FOIS, et la seconde était la plus trompeuse :
//
//   · les cellules royales retiraient 5 points sans pousser de raison ;
//   · un transvasement récent en retirait 5 de plus, en silence lui aussi.
//
// Une colonie transvasée il y a quinze jours et saine par ailleurs voyait son
// score tomber de 95 à 90 — et, comme `raisons` restait vide, le repli de fin
// y écrivait « Colonie en bon état ». L'apiculteur lisait donc, sous un score
// amputé, la phrase qui dit que tout va bien.
//
// ⚠️ ON GARDE LA RÈGLE, PAS LES DEUX CAS. Une liste de pénalités recopiée à
// côté divergerait au prochain facteur ajouté — et c'est exactement ainsi que
// ces deux-là sont nés. Le balayage part de la SOURCE : chaque branche du
// calcul qui touche `base` doit pousser au moins une raison.
// ═══════════════════════════════════════════════════════════════════════════

import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { computeHiveScore } from '~~/server/utils/santeScore';
import { sansCommentaires } from '../../../helpers/sansCommentaires';

const SOURCE = 'server/utils/santeScore.ts';

/** Une colonie saine : rien ne doit lui retirer de point. */
function saine() {
  return {
    rucheId: 'r1',
    numero: '1',
    rucherId: 'ru1',
    statut: 'active',
    qualiteReine: 'bonne',
    dateVisite: new Date().toISOString(),
    forceColonie: 5,
    couvain: 5,
    reserves: 5,
    reineVue: true,
    varroa: 0,
    comportement: 'calme',
    signeEssaimage: false,
    maladieObservee: null,
  };
}

describe('garde-fou : une colonie saine ne perd rien', () => {
  it('le score plein, et aucune pénalité inventée', () => {
    /**
     * Sans ce cas, un calcul qui retirerait des points partout satisferait les
     * suivants tout en affolant l'apiculteur sur un cheptel qui va bien.
     */
    const r = computeHiveScore(saine() as never);
    expect(r.score, 'une colonie saine doit tenir son score').toBeGreaterThan(85);
    expect(r.raisons, 'et n’avoir rien à se reprocher').toEqual(['Colonie en bon état']);
  });
});

describe('les deux pénalités qui ne disaient rien', () => {
  it('les CELLULES ROYALES se justifient', () => {
    const r = computeHiveScore({ ...saine(), celluleRoyale: true } as never);
    expect(r.raisons.join(' '), 'cinq points partaient sans un mot').toMatch(/cellules? royales?/i);
    expect(r.raisons, 'et surtout pas « Colonie en bon état » sous un score amputé').not.toContain(
      'Colonie en bon état',
    );
  });

  it('le TRANSVASEMENT récent se justifie', () => {
    const r = computeHiveScore({
      ...saine(),
      evenements: [{ type: 'transvasement', date: new Date().toISOString() }],
    } as never);
    expect(r.raisons.join(' ')).toMatch(/transvasement/i);
    expect(r.raisons).not.toContain('Colonie en bon état');
  });
});

describe('la RÈGLE : aucune pénalité muette', () => {
  it('chaque branche qui retire des points pousse une raison', () => {
    /**
     * ⚠️ LE BALAYAGE PART DE LA SOURCE, PAS D'UNE LISTE. Une énumération des
     * pénalités écrite ici divergerait au prochain facteur ajouté — et c'est
     * précisément comme ça que les deux muettes sont nées.
     *
     * On lit les `base -= …` du calcul et, pour chacun, on exige un
     * `raisons.push` dans le même bloc. Le bloc, c'est ce qui sépare deux
     * pénalités : on remonte du `base -=` jusqu'à l'accolade ouvrante la plus
     * proche, et on redescend jusqu'à sa fermante.
     */
    const code = sansCommentaires(readFileSync(SOURCE, 'utf-8'));
    const penalites = [...code.matchAll(/base -= /g)].map((m) => m.index!);

    expect(
      penalites.length,
      'aucune pénalité lue — le calcul a changé de forme et ce banc ne mesure plus rien',
    ).toBeGreaterThan(4);

    const muettes: string[] = [];
    for (const i of penalites) {
      // Le bloc englobant : de l'accolade ouvrante précédente à sa fermante.
      const debut = code.lastIndexOf('{', i);
      let profondeur = 0;
      let fin = debut;
      for (; fin < code.length; fin++) {
        if (code[fin] === '{') profondeur++;
        else if (code[fin] === '}') {
          profondeur--;
          if (profondeur === 0) break;
        }
      }
      const bloc = code.slice(debut, fin);
      if (!bloc.includes('raisons.push')) {
        muettes.push(
          code
            .slice(i, i + 60)
            .split('\n')[0]!
            .trim(),
        );
      }
    }

    expect(
      muettes,
      '« Chaque point retiré d’un score est justifié. Rien n’est opaque. » — ' +
        'une pénalité muette fait tomber le score sous une phrase qui dit que tout va bien.',
    ).toEqual([]);
  });
});

describe('l’écran ne coupe plus les raisons en silence', () => {
  it('la carte de score déplie au-delà de l’aperçu', () => {
    /**
     * ⚠️ `.slice(0, 5)` COUPAIT SANS LE DIRE. Un hivernage difficile aligne
     * vite plus de cinq facteurs ; les suivants disparaissaient de l'écran
     * même dont la page jure que rien n'y est opaque.
     */
    const carte = readFileSync('app/components/ui/SanteScoreCard.vue', 'utf-8');
    expect(carte, 'la coupe silencieuse doit avoir disparu').not.toMatch(/raisons\.slice\(0, 5\)/);
    expect(carte, 'et un dépliage doit exister').toMatch(/raisonsCachees/);
  });
});
