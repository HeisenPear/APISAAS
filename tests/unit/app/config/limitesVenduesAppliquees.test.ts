// ═══════════════════════════════════════════════════════════════════════════
// UNE LIMITE VENDUE DOIT RESTREINDRE QUELQUE CHOSE.
//
// Le catalogue déclare dix limites chiffrées. Deux endroits les montrent à un
// prospect : la page tarifs et le tableau comparatif des fonctionnalités. Un
// troisième — le serveur — est censé les appliquer.
//
// Rien ne reliait ces trois endroits. C'est ainsi que `photosStorageMb` a vécu :
// annoncé sur la page tarifs (50 Mo en Découverte, 20 Go en Expert), compté
// NULLE PART. Un compte gratuit pouvait téléverser sans fin, et la promesse
// « 20 Go » de l'Expert ne valait rien puisque le plancher était déjà infini.
// C'est corrigé (`photos/upload.post.ts`), mais rien n'empêchait que ça
// recommence à la limite suivante.
//
// ─── L'INVARIANT ───────────────────────────────────────────────────────────
// VENDUE ⟹ APPLIQUÉE. Si un chiffre est montré à quelqu'un qui hésite à payer,
// il doit correspondre à une restriction réelle. Le sens inverse est permis :
// une limite appliquée sans être affichée est un garde-fou technique, pas une
// promesse commerciale.
//
// ─── CE QUE CE BANC NE FAIT PAS ────────────────────────────────────────────
// Il ne touche pas au catalogue et n'exige d'appliquer aucune limite qui ne
// l'est pas aujourd'hui. Appliquer `alertesActives` (3 en Découverte) RETIRERAIT
// à des comptes existants quelque chose dont ils disposent — ce serait changer
// ce que le plan offre, pas corriger un défaut. Les limites ni vendues ni
// appliquées sont donc INVENTORIÉES, pas « réparées » : le cliquet interdit
// seulement qu'une troisième s'ajoute en silence.
// ═══════════════════════════════════════════════════════════════════════════

import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { PLAN_CONFIGS, type PlanLimits } from '../../../../app/config/plans';

/** Toutes les clés de limite, lues du catalogue lui-même (jamais recopiées). */
const CLES = Object.keys(PLAN_CONFIGS.decouverte.limites) as (keyof PlanLimits)[];

const VITRINES = ['app/pages/tarifs.vue', 'app/pages/fonctionnalites.vue'] as const;
const sourceVitrines = VITRINES.map((f) => readFileSync(f, 'utf-8')).join('\n');
const sourceGates = readFileSync('app/config/route-gates.ts', 'utf-8');

/**
 * Fichiers serveur susceptibles d'appliquer une limite en direct. Le gros du
 * travail passe par `ROUTE_GATES` (`getLimit(plan, gate.limit)` dans le
 * middleware d'abonnement) ; ceux-ci sont les applications spécifiques.
 */
const APPLICATIONS_DIRECTES = [
  'server/api/photos/upload.post.ts',
  'server/api/ruches/index.post.ts',
  'server/middleware/06.verrou-ruches.ts',
  'server/utils/quotaRuches.ts',
]
  .map((f) => readFileSync(f, 'utf-8'))
  .join('\n');

/**
 * La limite est-elle MONTRÉE à un prospect ? Deux écritures existent :
 * `limites.photosStorageMb` (page tarifs) et `key: 'photosStorageMb'` (catalogue
 * du tableau comparatif). On exige l'une des deux plutôt que la simple présence
 * du mot : « clients » ou « balances » apparaissent dans ces pages pour des
 * raisons qui n'ont rien à voir avec une limite chiffrée.
 *
 * Le OU entre les deux vitrines est VOULU, et la campagne de mutations l'a
 * confirmé : retirer le stockage photos d'une seule des deux pages ne fait rien
 * tomber, et c'est juste — il reste annoncé sur l'autre, donc toujours vendu.
 * Seul le retrait des deux le sort de la promesse commerciale.
 */
function estVendue(cle: string): boolean {
  return new RegExp(`limites\\.${cle}\\b|key:\\s*'${cle}'`).test(sourceVitrines);
}

/** La limite restreint-elle réellement une route ? */
function estAppliquee(cle: string): boolean {
  return (
    new RegExp(`limit:\\s*'${cle}'`).test(sourceGates) ||
    new RegExp(`getLimit\\([^)]*'${cle}'`).test(APPLICATIONS_DIRECTES)
  );
}

describe('limites du catalogue — vendues et appliquées', () => {
  it('le catalogue est bien lu (garde-fou du banc lui-même)', () => {
    // Si `limites` était renommé, tout le reste passerait au vert sur une liste
    // vide — un banc qui ne mesure rien est pire qu'un banc absent.
    expect(CLES.length).toBeGreaterThanOrEqual(10);
    expect(CLES).toContain('photosStorageMb');
  });

  it('TOUTE limite affichée à un prospect restreint réellement quelque chose', () => {
    // L'invariant qui compte. Un chiffre sur la page tarifs est un engagement :
    // s'il ne borne rien, le plan supérieur vend du vide.
    const venduesSansEffet = CLES.filter((c) => estVendue(c) && !estAppliquee(c));
    expect(venduesSansEffet).toEqual([]);
  });

  it('la détection repère bien la limite qui avait causé le défaut', () => {
    // Contre-test de l'outil de mesure : si `estVendue` ou `estAppliquee`
    // rendaient `false` par accident (motif trop strict, chemin erroné), le cas
    // précédent serait vide et donc vert. On épingle le cas connu dans les deux
    // sens — c'est LUI qui a été vendu sans être appliqué.
    expect(estVendue('photosStorageMb'), 'annoncé sur la page tarifs').toBe(true);
    expect(estAppliquee('photosStorageMb'), 'appliqué à l’envoi de photos').toBe(true);
  });

  it('aucune limite morte ne s’ajoute en silence', () => {
    // CLIQUET, sur le modèle de `PLAFOND_A_ARBITRER`. Deux limites ne sont ni
    // montrées ni appliquées ; elles sont connues et assumées :
    //
    //  · `alertesActives` — 3 en Découverte, illimité ailleurs. L'appliquer
    //    retirerait à des comptes existants ce dont ils disposent aujourd'hui.
    //    Le gating des alertes existe, mais il porte sur la DIFFUSION par type
    //    (alertesGating.ts), jamais sur un nombre.
    //  · `iaQuestionsParMois` — réservé au mode Claude, abandonné au profit du
    //    moteur déterministe. Le commentaire du catalogue le dit déjà candidat
    //    à la suppression.
    //
    // Cette liste ne doit pas s'allonger. Une limite ajoutée au catalogue sert
    // à quelque chose ou n'a pas lieu d'être.
    const mortes = CLES.filter((c) => !estVendue(c) && !estAppliquee(c));
    expect(mortes.sort()).toEqual(['alertesActives', 'iaQuestionsParMois']);
  });

  it('les limites appliquées sans être affichées restent des garde-fous connus', () => {
    // Le sens permis de l'invariant, tenu à l'inventaire pour qu'il reste un
    // choix et non un oubli : ces deux-là bornent une route sans rien promettre
    // sur la page tarifs.
    const silencieuses = CLES.filter((c) => !estVendue(c) && estAppliquee(c));
    expect(silencieuses.sort()).toEqual(['balances', 'templatesIntervention']);
  });
});
