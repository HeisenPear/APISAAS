import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { sansCommentaires } from '../../helpers/sansCommentaires';

// ═══════════════════════════════════════════════════════════════════════════
// DEUX MODULES NE PEUVENT PAS EXPORTER LE MÊME NOM.
//
// Nuxt et Nitro auto-importent PAR NOM. Deux modules qui exportent
// `PushPayload` leur donnent deux chemins : ils en retiennent UN, ignorent
// l'autre, et l'annoncent dans un avertissement de build — au milieu de
// dizaines d'autres lignes, à un moment où personne ne lit. Le dépôt en
// portait SIX au moment d'écrire ce banc.
//
// ⚠️ DEUX AVAIENT DÉJÀ DIVERGÉ. Ce n'est pas une hypothèse d'école :
//
//   · `PointGeo` était `{ lat, lng }` d'un côté, `{ id, lat, lng }` de
//     l'autre. C'est la version avec `id` OBLIGATOIRE que l'auto-import
//     retenait : un composant écrivant un simple centre de carte se voyait
//     réclamer un champ qui n'a aucun sens pour lui.
//
//   · `PushPayload` avait `url`, `tag` et `priorite` obligatoires côté
//     domaine, tous OPTIONNELS côté transport. C'est la version lâche qui
//     gagnait : un appelant s'y fiant écrivait un payload incomplet sans que
//     rien ne le reprenne.
//
// Et un troisième cas montre la forme la plus sournoise : un module
// RÉEXPORTAIT trois noms de `annulationRegle.ts`. Le réexport gagnait, donc le
// module qui fait autorité sur l'annulation était le module IGNORÉ. Un
// réexport n'est pas neutre — il fabrique un second chemin.
//
// Ce banc a été validé dans les deux sens avant d'être cru : passé sur l'arbre
// d'avant les corrections il trouve exactement les six collisions signalées
// par Nuxt, ni plus ni moins ; passé sur l'arbre d'après, zéro.
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Les espaces d'auto-import, chacun avec sa raison d'être un espace.
 *
 * Le balayage est RÉCURSIF. Ce n'est pas une supposition : sur cet arbre, le
 * récursif trouve les mêmes collisions que Nuxt et aucune de plus — 841 noms
 * côté serveur, 299 côté client, zéro faux positif.
 */
const ESPACES = [
  {
    nom: 'Nitro (serveur)',
    racines: ['server/utils'],
    /** Ce que Nitro auto-importe dans les routes, les crons et les middlewares. */
    minimumDeNoms: 500,
  },
  {
    nom: 'Nuxt (client)',
    racines: ['app/composables', 'app/utils'],
    /** Composables et utilitaires partagent UN seul espace de noms côté client. */
    minimumDeNoms: 200,
  },
] as const;

/**
 * Les collisions tolérées, chacune avec sa RAISON.
 *
 * Vide aujourd'hui, et c'est voulu : aucune collision n'est acceptable sans
 * raison écrite. Une entrée fantôme — un nom inscrit ici alors qu'il n'y a
 * plus de collision — fait échouer le banc, pour que cette liste ne devienne
 * pas un cimetière qui aveugle la règle.
 */
const TOLEREES: ReadonlyArray<{ nom: string; raison: string }> = [];

/** Tous les sources d'un espace, lus sur le disque — jamais une liste recopiée. */
function sourcesDe(racines: readonly string[]): string[] {
  const trouves: string[] = [];
  const descendre = (dossier: string) => {
    for (const entree of readdirSync(dossier)) {
      if (entree === 'node_modules') continue;
      const complet = join(dossier, entree);
      if (statSync(complet).isDirectory()) descendre(complet);
      else if (/\.(ts|mts)$/.test(entree)) trouves.push(complet);
    }
  };
  for (const racine of racines) descendre(racine);
  return trouves.sort();
}

/**
 * Les noms qu'un source EXPORTE, donc ceux qu'il jette dans l'espace commun.
 *
 * Prend une CHAÎNE et non un chemin : c'est ce qui permet de tester
 * l'extracteur lui-même sur des sources fabriqués. Un extracteur qui cesse de
 * reconnaître `export interface` ne trouverait plus aucune collision et ce
 * banc passerait au vert en ne mesurant plus rien — le pire des faux verts.
 */
export function exportsDuSource(src: string): Set<string> {
  const code = sansCommentaires(src);
  const noms = new Set<string>();

  // Déclarations nommées : export const|let|var|function|class|interface|type|enum
  for (const m of code.matchAll(
    /^export\s+(?:declare\s+)?(?:async\s+)?(?:const|let|var|function|class|interface|type|enum)\s+([A-Za-z_$][\w$]*)/gm,
  )) {
    noms.add(m[1]!);
  }

  // Listes : export { a, b as c }  ·  export type { T }  ·  … from '…'
  // ⚠️ Le RÉEXPORT compte comme un export : c'est lui qui a fabriqué le second
  // chemin d'auto-import dans le défaut réel.
  for (const m of code.matchAll(/^export\s+(?:type\s+)?\{([^}]*)\}/gm)) {
    for (const morceau of m[1]!.split(',')) {
      const t = morceau.trim();
      if (!t) continue;
      const alias = t.match(/\bas\s+([A-Za-z_$][\w$]*)\s*$/);
      const nom = alias ? alias[1]! : t.replace(/^type\s+/, '').trim();
      if (/^[A-Za-z_$][\w$]*$/.test(nom) && nom !== 'default') noms.add(nom);
    }
  }
  return noms;
}

/** Les noms exportés par plus d'un module d'un même espace. */
function collisions(racines: readonly string[]): Map<string, string[]> {
  const par = new Map<string, string[]>();
  for (const fichier of sourcesDe(racines)) {
    for (const nom of exportsDuSource(readFileSync(fichier, 'utf-8'))) {
      if (!par.has(nom)) par.set(nom, []);
      par.get(nom)!.push(fichier);
    }
  }
  return new Map([...par].filter(([, fichiers]) => fichiers.length > 1));
}

describe("l'auto-import n'a jamais deux chemins pour un nom", () => {
  // ─── GARDE-FOU ────────────────────────────────────────────────────────────
  // L'extracteur est le point unique de défaillance : s'il cesse de reconnaître
  // une forme d'export, il ne trouve plus rien et TOUT passe au vert. On le
  // met à l'épreuve sur un source fabriqué qui contient chaque forme.
  it("garde-fou — l'extracteur reconnaît chaque forme d'export", () => {
    const fabrique = [
      'export const UNE_CONSTANTE = 1;',
      'export let uneVariable = 2;',
      'export function uneFonction() {}',
      'export async function uneAsync() {}',
      'export class UneClasse {}',
      'export interface UneInterface { a: number }',
      'export type UnAlias = string;',
      'export enum UnEnum { A }',
      "export { unReexport } from './ailleurs';",
      "export type { UnTypeReexporte } from './ailleurs';",
      'export { local as unAlias };',
      'export default function () {}',
      'const jamaisExporte = 3;',
    ].join('\n');

    const trouves = exportsDuSource(fabrique);
    for (const attendu of [
      'UNE_CONSTANTE',
      'uneVariable',
      'uneFonction',
      'uneAsync',
      'UneClasse',
      'UneInterface',
      'UnAlias',
      'UnEnum',
      'unReexport',
      'UnTypeReexporte',
      'unAlias',
    ]) {
      expect(trouves, `l'extracteur ne voit plus « ${attendu} »`).toContain(attendu);
    }
    expect(trouves).not.toContain('jamaisExporte');
    expect(trouves).not.toContain('default');
    expect(trouves).not.toContain('local');
  });

  // ─── GARDE-FOU ────────────────────────────────────────────────────────────
  // Un commentaire qui CITE un export ne doit pas compter : ce banc et les
  // modules corrigés racontent tous le défaut, en nommant les types en cause.
  it('garde-fou — un export cité en commentaire ne compte pas', () => {
    // ⚠️ Les pièges sont EN DÉBUT DE LIGNE, à l'intérieur des commentaires.
    // Une première version de ce cas les indentait : le motif étant ancré sur
    // `^export`, il ne les voyait pas de toute façon, et le cas restait vert
    // même en débranchant le blanchiment. Il ne gardait rien. Ce dépôt écrit de
    // longs commentaires qui CITENT du code — dont ceux des modules corrigés
    // par cette correction même.
    const commente = [
      '/**',
      'export interface PushPayload { url?: string }',
      '*/',
      '//',
      '// export const PIEGE = 1;',
      'export const VRAI = 2;',
    ].join('\n');
    const trouves = exportsDuSource(commente);
    expect(
      [...trouves],
      'un export cité dans un commentaire est compté comme un vrai export : le ' +
        'banc signalerait des collisions imaginaires, et finirait par être désactivé.',
    ).toEqual(['VRAI']);
  });

  // ─── GARDE-FOU ────────────────────────────────────────────────────────────
  // Une racine erronée rend la liste vide, donc « sans collision ». Ce faux
  // vert est déjà arrivé dans ce dépôt.
  it.each(ESPACES)('garde-fou — le balayage de $nom voit bien les modules', (espace) => {
    const fichiers = sourcesDe(espace.racines);
    expect(fichiers.length).toBeGreaterThan(20);
    const tous = new Set<string>();
    for (const f of fichiers)
      for (const n of exportsDuSource(readFileSync(f, 'utf-8'))) tous.add(n);
    expect(
      tous.size,
      `${espace.nom} n'expose que ${tous.size} noms : le balayage a perdu des modules.`,
    ).toBeGreaterThan(espace.minimumDeNoms);
  });

  // ─── LA RÈGLE ─────────────────────────────────────────────────────────────
  it.each(ESPACES)('$nom — aucun nom exporté par deux modules', (espace) => {
    const tolerees = new Set(TOLEREES.map((t) => t.nom));
    const fautes = [...collisions(espace.racines)]
      .filter(([nom]) => !tolerees.has(nom))
      .map(([nom, fichiers]) => `${nom}\n    ${fichiers.join('\n    ')}`);

    expect(
      fautes,
      `Deux modules de l'espace « ${espace.nom} » exportent le même nom.\n\n` +
        `${fautes.join('\n\n')}\n\n` +
        `L'auto-import en retiendra UN et ignorera l'autre, en silence. Ce n'est ` +
        `pas théorique : c'est ainsi que la version LÂCHE d'un payload a pris la ` +
        `place de la stricte, et que le module faisant autorité sur l'annulation ` +
        `s'est fait ignorer par un simple réexport.\n` +
        `Renommez l'un des deux, ou importez au lieu de redéfinir. Un RÉEXPORT ne ` +
        `règle rien : il fabrique justement le second chemin.`,
    ).toEqual([]);
  });

  // ─── LA LISTE DE TOLÉRANCE NE DOIT PAS POURRIR ────────────────────────────
  it('chaque collision tolérée existe encore et porte sa raison', () => {
    const reelles = new Set<string>();
    for (const espace of ESPACES)
      for (const nom of collisions(espace.racines).keys()) reelles.add(nom);

    for (const { nom, raison } of TOLEREES) {
      expect(raison.length, `« ${nom} » est toléré sans raison écrite.`).toBeGreaterThan(20);
      expect(
        reelles.has(nom),
        `« ${nom} » est inscrit comme collision tolérée, mais il n'y a plus de ` +
          `collision sur ce nom. Une liste de dispenses qui garde ses fantômes finit ` +
          `par couvrir une vraie collision homonyme. Retirez l'entrée.`,
      ).toBe(true);
    }
  });
});
