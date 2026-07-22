import { describe, expect, it } from 'vitest';
import { classifier } from '~~/server/utils/copilote-local';
import { CORPUS, FAMILLES, type CasQuestion } from '../../../corpus/mayaQuestions.mts';

// ═══════════════════════════════════════════════════════════════════════════
// BANC DE MESURE DE MAYA.
//
// Le moteur est déterministe et sans accès base : il se mesure. Sans chiffre de
// départ, « améliorer la compréhension » n'est pas vérifiable — on croit avancer.
//
// Ce fichier a DEUX rôles :
//  1. imprimer un rapport lisible (`npm run mesurer:maya`) qui dit où ça coince ;
//  2. tenir un CLIQUET anti-régression : le score ne doit jamais redescendre.
//
// Un échec du corpus n'est PAS un bug du corpus : c'est le travail qui reste.
// ═══════════════════════════════════════════════════════════════════════════

interface Resultat {
  cas: CasQuestion;
  obtenu: string;
  detail: string;
  ok: boolean;
  /** Compris mais mal orienté — pas la même maladie qu'un « rien compris ». */
  partiel: boolean;
}

function evaluer(cas: CasQuestion): Resultat {
  const c = classifier(cas.question);
  const detail = c.kind === 'action' ? c.intent : c.kind === 'savoir' ? c.articleId : '';
  const base = { cas, obtenu: c.kind, detail };

  if (c.kind !== cas.attendu) {
    return { ...base, ok: false, partiel: c.kind !== 'inconnu' };
  }
  if (cas.intent && c.kind === 'action' && c.intent !== cas.intent) {
    return { ...base, ok: false, partiel: true };
  }
  if (cas.articleId && c.kind === 'savoir' && c.articleId !== cas.articleId) {
    return { ...base, ok: false, partiel: true };
  }
  return { ...base, ok: true, partiel: false };
}

const RESULTATS = CORPUS.map(evaluer);
const REUSSIS = RESULTATS.filter((r) => r.ok);

/**
 * Plancher FIGÉ, relevé le 22/07/2026 sur 42 questions.
 *
 * Il doit être écrit en dur : le déduire de `REUSSIS.length` reviendrait à
 * comparer la mesure à elle-même — le test passerait toujours, y compris en
 * pleine régression. À REMONTER à chaque progrès du moteur ; c'est un cliquet,
 * jamais un objectif atteint.
 *
 * Historique : 29 (état initial) → 30 (retrait du déclencheur météo « temps »
 * nu, qui détournait « combien de temps vit une abeille »).
 */
const PLANCHER_REUSSITE = 30;

describe('corpus Maya — rapport', () => {
  it('imprime où la compréhension coince', () => {
    const pct = (n: number) => `${((n / RESULTATS.length) * 100).toFixed(1)} %`;
    const lignes: string[] = [
      '',
      `CORPUS MAYA — ${RESULTATS.length} questions`,
      '='.repeat(56),
      `  compris et bien orienté  : ${REUSSIS.length}/${RESULTATS.length}  (${pct(REUSSIS.length)})`,
      `  compris mais mal orienté : ${RESULTATS.filter((r) => r.partiel).length}`,
      `  pas compris du tout      : ${RESULTATS.filter((r) => !r.ok && !r.partiel).length}`,
      '',
      'Par famille',
      '-'.repeat(56),
    ];

    for (const f of FAMILLES) {
      const sous = RESULTATS.filter((r) => r.cas.famille === f);
      const ok = sous.filter((r) => r.ok).length;
      const barre = '#'.repeat(Math.round((ok / sous.length) * 20)).padEnd(20, '.');
      lignes.push(`  ${f.padEnd(12)} ${barre} ${ok}/${sous.length}`);
    }

    const echecs = RESULTATS.filter((r) => !r.ok);
    if (echecs.length > 0) {
      lignes.push('', `Échecs (${echecs.length})`, '-'.repeat(56));
      for (const r of echecs) {
        const cible = r.cas.intent ?? r.cas.articleId ?? r.cas.attendu;
        lignes.push(
          '',
          `  « ${r.cas.question} »`,
          `    famille : ${r.cas.famille}`,
          `    attendu : ${r.cas.attendu}${cible !== r.cas.attendu ? ` → ${cible}` : ''}`,
          `    obtenu  : ${r.obtenu}${r.detail ? ` → ${r.detail}` : ''}`,
        );
        if (r.cas.note) lignes.push(`    enjeu   : ${r.cas.note}`);
      }
    }

    console.log(lignes.join('\n'));
    expect(RESULTATS).toHaveLength(CORPUS.length);
  });
});

describe('corpus Maya — cliquet', () => {
  it('la compréhension ne régresse jamais', () => {
    expect(REUSSIS.length).toBeGreaterThanOrEqual(PLANCHER_REUSSITE);
  });

  it('aucune question du corpus n’est en double', () => {
    const vues = new Set(CORPUS.map((c) => c.question.toLowerCase().trim()));
    expect(vues.size).toBe(CORPUS.length);
  });

  it('toute action attendue précise son intention', () => {
    // Sans intention, un « action » réussi ne prouve rien : il pourrait viser
    // n'importe quel écran.
    for (const c of CORPUS.filter((x) => x.attendu === 'action')) {
      if (!c.note) expect(c.intent, `« ${c.question} » sans intent ni note`).toBeTruthy();
    }
  });
});
