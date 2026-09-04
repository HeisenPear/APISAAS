// ═══════════════════════════════════════════════════════════════════════════
// UNE PASTILLE QUE MAYA TEND DOIT MENER QUELQUE PART.
//
// ─── CE QUI SE JOUAIT ICI ──────────────────────────────────────────────────
// Chaque réponse de Maya peut porter des `suggestions` : des pastilles
// cliquables affichées sous sa bulle (`CopiloteMessage.vue`, l. 211-228). Un
// clic renvoie le LIBELLÉ tel quel au moteur, comme si l'apiculteur l'avait
// tapé. Une pastille que le moteur ne sait pas router produit donc, d'un seul
// geste, « je n'ai pas bien saisi ta demande » — Maya se contredit elle-même
// dans le tour suivant.
//
// La règle existait déjà, à deux endroits — et aucun des deux ne pouvait
// attraper une pastille OUBLIÉE :
//
//   · `propositionsMaya.test.ts` ne regarde que les cartes contextuelles ;
//   · `mayaSuggestionsRoutage.test.ts` tient un INVENTAIRE écrit à la main de
//     treize libellés, dont il épingle la cible exacte. C'est plus fort que ce
//     banc-ci sur les treize qu'il liste — et parfaitement aveugle aux autres.
//     C'est « la liste qui rétrécit en silence » : le jour où une pastille est
//     ajoutée sans être inscrite, elle n'est mesurée par personne.
//
// Les deux bancs se complètent donc : l'inventaire dit OÙ chaque libellé doit
// atterrir, celui-ci dit qu'AUCUN n'est laissé de côté. Et il y en avait un de
// cassé, à l'endroit le plus coûteux :
//
//   `case 'lots'` et `case 'balances'`, sur le chemin de REFUS DE PLAN
//   (`copilote-local.ts`, l. 4117 et 4136) proposaient « Ma production ».
//   Or il n'existe aucun intent `production` (`IntentId`, l. 514-529) et aucune
//   fiche de savoir ne la capte : la pastille se classe `inconnu`. Elle ne
//   figurait pas dans l'inventaire des treize.
//
// Autrement dit : l'apiculteur demande ses lots, sa formule ne les couvre pas,
// Maya le lui dit poliment et lui tend une porte de sortie — et cette porte-là
// donnait sur un mur. C'est exactement ce que « ne jamais bloquer sans porte de
// sortie » cherche à empêcher, retourné contre lui-même.
//
// ─── POURQUOI UNE SONDE, ET PAS UNE LISTE ──────────────────────────────────
// Les libellés sont des littéraux disséminés dans un fichier de 4 000 lignes.
// Les RECOPIER ici produirait « la liste qui rétrécit en silence » : une
// pastille ajoutée demain ne serait jamais mesurée. On balaie donc la SOURCE.
//
// Et parce qu'une sonde peut devenir aveugle sans que rien ne tombe (« la sonde
// aveugle à une majuscule »), elle est ici une FONCTION APPELABLE, à qui l'on
// présente d'abord des sources FABRIQUÉES — une qui la viole, une qui la
// respecte — avant de la lâcher sur le vrai fichier. C'est le contrôle positif
// de `scripts/controle-sonde.mjs`, transposé à un banc.
//
// ─── LES MUTATIONS QUI DOIVENT FAIRE ROUGIR ────────────────────────────────
//   · remettre « Ma production » dans l'une des deux pastilles de refus ;
//   · rendre la sonde permissive (ne plus suivre les crochets, ne lire que la
//     première ligne) → le contrôle positif tombe ;
//   · vider `SOURCES` → le garde-fou de volume tombe.
// ═══════════════════════════════════════════════════════════════════════════

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { classifierTour } from '../../../../server/utils/copilote-local';
import { sansCommentaires } from '../../../helpers/sansCommentaires';

const RACINE = join(dirname(fileURLToPath(import.meta.url)), '../../../..');

/**
 * ⚠️ LE MOTEUR SE LIT PAR `classifierTour`, PAS PAR `classifier`.
 *
 * `repondreConversation` — la seule porte d'entrée du chat
 * (`copilote-local.ts`, l. 3427) — appelle `classifierTour`. `classifier` est
 * une couche PLUS BASSE, qui ne connaît ni la navigation ni l'écriture : elle
 * range « ouvre un nouvel achat » en `inconnu` alors que le produit l'ouvre
 * très bien. Mesurer avec elle aurait produit quatre fausses accusations —
 * vérifié en comparant les deux sur les mêmes libellés.
 */
function routeBien(libelle: string): boolean {
  const d = classifierTour([{ role: 'user', content: libelle }]);
  return d.kind !== 'inconnu';
}

/**
 * LA RÈGLE, EN FONCTION APPELABLE : les libellés de pastille ÉCRITS EN DUR dans
 * une source.
 *
 * ⚠️ « ÉCRIT EN DUR » N'EST PAS UNE COMMODITÉ D'ANALYSE, C'EST LA FRONTIÈRE DE
 * LA RÈGLE. Deux choses très différentes passent par le champ `suggestions` :
 *
 *   · une QUESTION que Maya propose (« Fais-moi un point santé ») — elle
 *     repart au moteur, elle doit donc router. C'est le sujet de ce banc ;
 *   · une VALEUR DE CHAMP tirée des données de l'apiculteur (le nom d'une de
 *     ses ruches, d'un de ses stocks — `copilote-actions.ts`, l. 2022-2047).
 *     Elle répond à une question déjà posée par Maya dans un flux guidé ; la
 *     router serait un contresens, et l'exiger produirait des accusations
 *     absurdes sur le nom des ruchers de quelqu'un.
 *
 * Ne retenir que les littéraux sépare les deux SANS dispense écrite à la main :
 * une valeur de données n'est jamais un littéral. C'est « dispenser par règle,
 * jamais par fichier ».
 */
export function suggestionsLitterales(source: string): string[] {
  const src = sansCommentaires(source);
  const out: string[] = [];
  const cle = /suggestions\s*:\s*\[/g;
  let m: RegExpExecArray | null;

  while ((m = cle.exec(src))) {
    // On repart du crochet ouvrant et on suit la profondeur : un tableau de
    // pastilles peut contenir un `...(cond ? ['X'] : [])`, donc des crochets
    // imbriqués. S'arrêter au premier `]` en perdrait la moitié.
    let i = m.index + m[0].length;
    let profondeur = 1;
    let chaine: "'" | '"' | '`' | null = null;
    let courante = '';

    for (; i < src.length && profondeur > 0; i++) {
      const c = src[i]!;
      if (chaine) {
        if (c === '\\') {
          courante += src[i + 1] ?? '';
          i++;
          continue;
        }
        if (c === chaine) {
          // Seules les chaînes simples/doubles portent un libellé figé ; un
          // gabarit `${...}` est par construction une valeur de données.
          if (chaine !== '`') out.push(courante);
          chaine = null;
          courante = '';
          continue;
        }
        courante += c;
        continue;
      }
      if (c === "'" || c === '"' || c === '`') {
        chaine = c;
        courante = '';
        continue;
      }
      if (c === '[') profondeur++;
      else if (c === ']') profondeur--;
    }
  }
  return out;
}

/**
 * Les fichiers qui tendent des pastilles FIGÉES. `copilote-actions.ts` en fait
 * partie : il en pose une seule en dur (« Crée un rucher les Tilleuls »,
 * l. 4150), le reste de ses suggestions étant des noms de ruches et de stocks
 * — que la règle ci-dessus laisse passer d'elle-même.
 */
const SOURCES = ['server/utils/copilote-local.ts', 'server/utils/copilote-actions.ts'];

describe('la sonde voit ce qu’elle doit voir, et rien d’autre', () => {
  it('CONTRÔLE POSITIF : elle distingue une source fautive d’une source saine', () => {
    // Sans ces deux cas fabriqués, rendre la sonde permissive ne ferait rien
    // tomber sur un dépôt propre — elle ne verrait plus rien à reprocher, et le
    // banc entier resterait vert. C'est le piège nommé dans CLAUDE.md :
    // « une règle enfermée dans son `it` ne se vérifie que sur un dépôt sale ».
    const fautive = `
      return { texte: 'x', suggestions: ['Une pastille qui ne route nulle part'] };
    `;
    const saine = `
      return { texte: 'x', suggestions: ['Fais-moi un point santé'] };
    `;
    expect(suggestionsLitterales(fautive)).toEqual(['Une pastille qui ne route nulle part']);
    expect(suggestionsLitterales(saine)).toEqual(['Fais-moi un point santé']);
    expect(routeBien('Une pastille qui ne route nulle part')).toBe(false);
    expect(routeBien('Fais-moi un point santé')).toBe(true);
  });

  it('elle suit les crochets imbriqués d’un tableau conditionnel', () => {
    // La forme réelle du `case 'stocks'` : `...(sousSeuil ? ['…'] : [])`.
    // S'arrêter au premier `]` aurait tu tout ce qui suit le conditionnel —
    // « la couverture qui s'arrête juste avant », en une ligne de code.
    const src = `
      suggestions: [
        ...(bas ? ['Ouvre un nouvel achat'] : []),
        'Mes stocks',
      ],
    `;
    expect(suggestionsLitterales(src)).toEqual(['Ouvre un nouvel achat', 'Mes stocks']);
  });

  it('elle ignore une valeur tirée des données, et un libellé de commentaire', () => {
    // Deux fausses accusations évitées : le nom d'une ruche n'est pas une
    // question, et une note explicative n'est pas du code.
    const src = `
      // suggestions: ['Ceci est un exemple mort']
      suggestions: rows.map((r) => r.nom),
      suggestions: [\`Ruche \${n}\`],
    `;
    expect(suggestionsLitterales(src)).toEqual([]);
  });
});

describe('toute pastille figée mène quelque part', () => {
  const trouvees = SOURCES.flatMap((rel) =>
    suggestionsLitterales(readFileSync(join(RACINE, rel), 'utf8')).map((libelle) => ({
      libelle,
      rel,
    })),
  );

  it('GARDE-FOU : le balayage voit bien des pastilles', () => {
    // « Le balayage vide » : un chemin fautif rendrait zéro pastille, et la
    // conformité serait « vérifiée » sur rien du tout.
    expect(
      trouvees.length,
      'la sonde ne trouve plus aucune pastille — le chemin des sources est-il juste ?',
    ).toBeGreaterThan(20);
  });

  it('LA RÈGLE : aucune ne se classe « je n’ai pas compris »', () => {
    const muettes = [
      ...new Set(trouvees.filter((t) => !routeBien(t.libelle)).map((t) => t.libelle)),
    ];
    expect(
      muettes,
      `Maya tend ces pastilles et ne saurait pas y répondre : ${muettes.join(' · ')}\n` +
        `Un clic dessus donne « je n'ai pas bien saisi ta demande ». Reformule le ` +
        `libellé jusqu'à ce qu'il se classe, ou retire-le.`,
    ).toEqual([]);
  });
});
