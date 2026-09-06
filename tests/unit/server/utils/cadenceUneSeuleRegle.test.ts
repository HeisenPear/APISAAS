// ═══════════════════════════════════════════════════════════════════════════
// « EN RETARD DE VISITE » DOIT VOULOIR DIRE LA MÊME CHOSE PARTOUT.
//
// ─── CE QUI SE JOUAIT ICI ──────────────────────────────────────────────────
// Le bon rythme de visite dépend de la SAISON : dix jours au printemps (on
// surveille l'essaimage), quatorze en été, vingt et un en automne, et l'hiver
// on n'ouvre pas les ruches du tout. `server/utils/cadence.ts` porte cette
// règle depuis toujours.
//
// Le chiffre « 21 » — la cadence d'AUTOMNE — vivait pourtant en dur à cinq
// endroits. CLAUDE.md raconte déjà l'histoire pour l'un d'eux : « une copie de
// 21 vivait ici : au printemps, le briefing du matin taisait une ruche que
// /alertes signalait au même instant ». Il en restait quatre :
//
//   · `copilote-local.ts` — la carte « chez toi » d'une réponse de savoir, qui
//     doublait le chiffre d'un « plus de 3 semaines » écrit dans la phrase
//     MONTRÉE à l'apiculteur ;
//   · `copilote-executeur.ts` — le prédicat du ciblage en LOT. Maya signalait
//     une ruche en retard sur la carte et la laissait hors du lot quand
//     l'apiculteur disait « note une visite sur toutes mes ruches en retard » ;
//   · `santePredictive.ts` — la ligne de risque de la projection à 30 jours ;
//   · `analytics/suggestions.get.ts` — où le COMMENTAIRE annonçait 21 pendant
//     que la ligne d'en dessous comparait à 30.
//
// ─── POURQUOI UNE SONDE ────────────────────────────────────────────────────
// Les recopier ici les figerait : la liste ne rétrécirait pas, mais elle ne
// GRANDIRAIT pas non plus, et la sixième copie écrite demain ne serait vue par
// personne. On balaie donc la source, avec la parade habituelle — la règle est
// une fonction appelable, à qui on présente d'abord deux sources fabriquées.
//
// ─── LES MUTATIONS QUI DOIVENT FAIRE ROUGIR ────────────────────────────────
//   · remettre `joursDepuisVisite > 21` n'importe où dans `server/` ;
//   · rendre la sonde permissive (ne plus reconnaître la forme) → le contrôle
//     positif tombe.
// ═══════════════════════════════════════════════════════════════════════════

import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { cadenceVisite, intervalleVisiteJours } from '../../../../server/utils/cadence';
import { sansCommentaires } from '../../../helpers/sansCommentaires';

/**
 * LA RÈGLE, EN FONCTION APPELABLE : une durée « depuis la dernière visite »
 * comparée à un nombre ÉCRIT EN DUR.
 *
 * On vise la forme, pas le chiffre : `> 21` aujourd'hui, `>= 14` demain. Ce
 * qu'on refuse, c'est qu'une cadence soit décidée ailleurs que dans
 * `cadence.ts` — quelle que soit la valeur choisie.
 */
export function cadencesEnDur(source: string): string[] {
  const src = sansCommentaires(source);
  const motif =
    /\b(joursDepuisVisite|daysSinceLastVisit|joursSansVisite)\b\s*(?:!==?\s*null\s*\|\|\s*[\w.]+\s*)?[<>]=?\s*(\d+)/g;
  return [...src.matchAll(motif)].map((m) => `${m[1]} … ${m[2]}`);
}

/** Les fichiers du serveur, hors le module qui DÉTIENT la règle. */
function fichiersServeur(): string[] {
  return execSync('grep -rl "" server --include=*.ts', { encoding: 'utf-8' })
    .trim()
    .split('\n')
    .filter((f) => f && !f.endsWith('utils/cadence.ts'));
}

describe('la sonde voit ce qu’elle doit voir, et rien d’autre', () => {
  it('CONTRÔLE POSITIF : elle distingue une source fautive d’une source saine', () => {
    // Sans ces deux cas, rendre la sonde aveugle donnerait une liste vide, et
    // le balayage serait « conforme » sur zéro cas — le dépôt étant propre,
    // rien ne le dirait.
    const fautive = 'const enRetard = r.joursDepuisVisite === null || r.joursDepuisVisite > 21;';
    const saine = 'const enRetard = r.joursDepuisVisite > cadenceVisite(now).intervalleJours;';
    expect(cadencesEnDur(fautive)).toHaveLength(1);
    expect(cadencesEnDur(saine)).toEqual([]);
  });

  it('elle ne se laisse pas berner par un commentaire', () => {
    // Le piège nommé dans CLAUDE.md : « le banc s'accuse lui-même », en
    // trouvant la chaîne dans la note qui EXPLIQUE la correction.
    expect(cadencesEnDur('// avant : joursDepuisVisite > 21, cinquième copie')).toEqual([]);
  });

  it('GARDE-FOU : le balayage voit bien des fichiers', () => {
    expect(fichiersServeur().length).toBeGreaterThan(50);
  });
});

describe('LA RÈGLE : la cadence se lit dans `cadence.ts`, elle ne se recopie pas', () => {
  it('aucun seuil de visite écrit en dur dans server/', () => {
    const coupables = fichiersServeur()
      .map((f) => ({ f, trouves: cadencesEnDur(readFileSync(f, 'utf-8')) }))
      .filter((x) => x.trouves.length > 0);
    expect(
      coupables.map((c) => `${c.f} → ${c.trouves.join(', ')}`),
      'un délai de visite écrit en dur est la cadence d’UNE saison figée pour ' +
        'les quatre. Au printemps on visite tous les dix jours : un « 21 » y tait ' +
        'une ruche que le socle d’alertes signale au même instant. Passe par ' +
        '`cadenceVisite(date)` ou `intervalleVisiteJours(date)`.',
    ).toEqual([]);
  });

  it('et l’hiver, personne n’invite à ouvrir une ruche', () => {
    // La cadence d'hiver n'est pas « 60 jours », c'est le REPOS. Un appelant qui
    // lirait seulement `intervalleJours` proposerait une visite en janvier.
    const janvier = new Date('2026-01-15T12:00:00Z');
    expect(cadenceVisite(janvier).repos).toBe(true);
    const avril = new Date('2026-04-15T12:00:00Z');
    expect(cadenceVisite(avril).repos).toBe(false);
    expect(intervalleVisiteJours(avril), 'le printemps est le plus serré').toBe(10);
  });
});
