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

import { mount } from '@vue/test-utils';
import { readFileSync } from 'node:fs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { computed, ref } from 'vue';
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
  /**
   * ⚠️ ON MONTE, ON NE LIT PAS. Une première version cherchait
   * `raisons.slice(0, 5)` dans la source : déplacer la coupe de trois lignes —
   * du gabarit vers le `computed` — la laissait VERTE. C'est la coupe qu'il
   * faut mesurer, pas sa position.
   */
  const SEPT = [
    'Reine âgée',
    'Réserves faibles',
    'Varroa élevé',
    'Couvain irrégulier',
    'Comportement agressif',
    'Cellules royales observées — risque d’essaimage',
    'Transvasement récent — colonie en réinstallation',
  ];

  /**
   * Les auto-imports de Nuxt sont, sous Vitest, des identifiants libres : le
   * composant appelle `ref` et `computed` sans les importer.
   */
  beforeEach(() => {
    vi.stubGlobal('ref', ref);
    vi.stubGlobal('computed', computed);
  });
  afterEach(() => vi.unstubAllGlobals());

  async function monterCarte() {
    const Carte = (await import('~~/app/components/ui/SanteScoreCard.vue')).default;
    return mount(Carte, {
      props: {
        scoreData: {
          score: 62,
          niveau: 'Moyen',
          couleur: '#F5A623',
          confiance: 'haute',
          raisons: SEPT,
        },
      },
      global: { stubs: { UIcon: true, NuxtLink: true } },
    });
  }

  it('garde-fou : elle affiche bien un aperçu des raisons', async () => {
    // Sans lui, une carte qui n'afficherait RIEN satisferait le cas suivant.
    const c = await monterCarte();
    expect(c.text(), 'l’aperçu doit montrer les premières raisons').toContain('Reine âgée');
  });

  it('les raisons au-delà de l’aperçu sont ATTEIGNABLES', async () => {
    /**
     * ⚠️ `.slice(0, 5)` COUPAIT SANS LE DIRE. Un hivernage difficile aligne
     * vite plus de cinq facteurs ; les suivants disparaissaient de l'écran
     * même dont la page jure que rien n'y est opaque — et les deux qu'on
     * vient d'ajouter sont justement les dernières de la liste.
     */
    const c = await monterCarte();
    const bouton = c.find('button');
    expect(bouton.exists(), 'rien ne signale qu’il en reste').toBe(true);
    await bouton.trigger('click');
    for (const r of SEPT) {
      expect(c.text(), `« ${r} » reste invisible`).toContain(r);
    }
  });
});
