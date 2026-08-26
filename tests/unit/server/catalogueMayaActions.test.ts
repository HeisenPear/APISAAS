import { describe, it, expect } from 'vitest';
import { readFileSync, globSync } from 'node:fs';
import { MAYA_ACTIONS, ACTIONS_IDS, ACTION_DOMAINE } from '~/config/maya-actions';
import { ROUTE_GATES } from '~/config/route-gates';
import { DOMAINES_ECRITURE } from '~/config/roles';

/**
 * AJOUTER UNE ACTION À MAYA DEMANDAIT DE TOUCHER SEIZE REGISTRES DANS SIX
 * FICHIERS — ET HUIT PASSAIENT EN SILENCE.
 *
 * TypeScript n'en attrapait que six : les `switch` exhaustifs et deux
 * `Record<…>`. Les huit autres se taisaient, et DEUX ÉTAIENT DES TROUS DE
 * SÉCURITÉ.
 *
 *  · `ROUTE_EQUIVALENTE` définissait son propre type de clés
 *    (`keyof typeof`). Oublier d'y inscrire une action ne produisait AUCUNE
 *    erreur : elle sortait du type, et devenait NON GATÉE. Une écriture qui
 *    échappe au plan d'abonnement, en silence, pendant que la page tarifs
 *    reste exacte. Un type qui se dérive de la liste qu'il garde ne garde
 *    rien — il s'adapte à l'oubli.
 *  · Le balayage RBAC « rôles × actions » itérait sur une liste RECOPIÉE dans
 *    son propre fichier de test, sous un commentaire qui affirmait le
 *    contraire. Une action nouvelle passait au vert sans avoir jamais été
 *    testée.
 *
 * Ce banc ne vérifie pas que les cinq actions d'aujourd'hui sont correctes. Il
 * vérifie des propriétés qui restent vraies quand le produit grandit : chaque
 * action a un domaine valide, une porte explicite, et traverse tous les
 * registres qui la concernent.
 */

const lire = (f: string): string => readFileSync(f, 'utf-8');

describe('le catalogue des actions de Maya', () => {
  it('le catalogue est non vide (garde-fou du banc)', () => {
    expect(ACTIONS_IDS.length).toBeGreaterThan(3);
    expect(ACTIONS_IDS).toContain('intervention');
  });

  it('chaque action déclare un domaine RBAC qui existe', () => {
    for (const id of ACTIONS_IDS) {
      expect(DOMAINES_ECRITURE, `${id} : domaine inconnu`).toContain(ACTION_DOMAINE[id]);
    }
  });

  it('chaque action déclare sa porte — même quand c’est « aucune »', () => {
    /**
     * LA RÈGLE QUI FERME LE TROU. Le champ `route` est obligatoire ; `null` est
     * une déclaration explicite, pas une absence. On vérifie ici que toute
     * route nommée EXISTE vraiment dans le catalogue des portes : une route
     * mal orthographiée rendrait l'action non gatée exactement comme un oubli.
     */
    const inconnues = ACTIONS_IDS.filter((id) => {
      const r = MAYA_ACTIONS[id].route;
      return r !== null && !(r in ROUTE_GATES);
    });
    expect(
      inconnues,
      'cette action pointe une route qui n’a pas de porte : elle ne serait gatée par rien',
    ).toEqual([]);
  });

  it('une action sans porte le dit dans le catalogue, pas ailleurs', () => {
    // Une seule action a le droit d'être `route: null` aujourd'hui, et son
    // commentaire dit pourquoi (son gating vit dans `dispatchHandler`). Si la
    // liste enfle, quelqu'un s'en sert comme d'une trappe.
    const sansRoute = ACTIONS_IDS.filter((id) => MAYA_ACTIONS[id].route === null);
    expect(sansRoute).toEqual(['intervention']);
  });

  it('l’autonomie n’est accordée qu’à ce qui sait se défaire', () => {
    /**
     * `auto ⟹ annulable`, en une assertion sur les DONNÉES. L'autonomie se
     * justifie par une seule promesse — « ce que j'écris seule, tu peux le
     * défaire d'un clic ». Une action qui écrit sans savoir se défaire ferait
     * mentir le bouton « Annuler ».
     */
    for (const id of ACTIONS_IDS) {
      if (MAYA_ACTIONS[id].autonomie !== 'jamais') {
        expect(MAYA_ACTIONS[id].ecrit, `${id} : autonome mais n’écrit pas`).toBe(true);
        expect(
          MAYA_ACTIONS[id].autonomie,
          `${id} : l’autonomie doit rester conditionnée à l’annulabilité`,
        ).toBe('si-annulable');
      }
    }
  });

  it('AUCUN registre ne recopie la liste des actions', () => {
    /**
     * ⚠️ LE CAS QUI GARDE LA CORRECTION ELLE-MÊME. Rien n'empêche de réécrire
     * « juste pour ce cas-là » une liste des cinq chaînes — c'est exactement
     * comme ça que les seize registres sont nés. On cherche donc le MOTIF :
     * une énumération littérale qui contient au moins trois des identifiants.
     */
    const FICHIERS = [
      'server/utils/copilote-actions.ts',
      'server/utils/copilote-gating.ts',
      'server/utils/copilote-local.ts',
      'server/utils/copilote-executeur.ts',
      'server/api/ia/copilote.post.ts',
      'app/composables/useCopilote.ts',
      'tests/unit/server/api/mayaRoute.test.ts',
      ...globSync('tests/unit/server/utils/copilote*.test.ts'),
    ];
    const fautes: string[] = [];
    for (const f of FICHIERS) {
      const code = lire(f)
        .replace(/\/\*[\s\S]*?\*\//g, ' ')
        .replace(/\/\/[^\n]*/g, ' ');
      // (a) Une SUITE de littéraux — `'a' | 'b' | 'c'` ou `['a', 'b']`.
      for (const m of code.matchAll(/(?:'[a-z]+'\s*[|,]\s*)+'[a-z]+'/g)) {
        const cites = [...m[0].matchAll(/'([a-z]+)'/g)]
          .map((x) => x[1]!)
          .filter((x) => (ACTIONS_IDS as string[]).includes(x));
        if (cites.length >= 2) fautes.push(`${f} — « ${m[0]} »`);
      }
      /**
       * (b) Un OBJET dont les CLÉS sont des actions.
       *
       * ⚠️ LA MUTATION A DÉMASQUÉ CE TROU. La règle (a) ne cherchait que des
       * chaînes citées, et dans un objet littéral les clés sont NUES :
       * `{ intervention: 'terrain', recolte: 'terrain', … }` passait comme une
       * lettre à la poste. C'est pourtant la forme exacte qu'avaient trois des
       * registres d'origine. La rétro-recherche négative écarte les `case
       * 'intervention':` d'un switch, qui sont légitimes.
       */
      const clesNues = new Set(
        [...code.matchAll(/(?<!['"])\b([a-z]+)\s*:/g)]
          .map((x) => x[1]!)
          .filter((x) => (ACTIONS_IDS as string[]).includes(x)),
      );
      if (clesNues.size >= 3) fautes.push(`${f} — objet clé par { ${[...clesNues].join(', ')} }`);
    }
    expect(
      fautes,
      'dérive la liste de `ACTIONS_IDS` : une action ajoutée doit traverser tous les registres',
    ).toEqual([]);
  });

  it('le balayage RBAC ITÈRE le catalogue, il ne le recopie pas', () => {
    /**
     * ⚠️ RÈGLE CIBLÉE, PARCE QUE LA RÈGLE GÉNÉRALE NE SUFFIT PAS — vérifié par
     * mutation. En réduisant la liste à DEUX actions (`['intervention',
     * 'recolte']`), aucun motif ne se déclenchait, et le balayage « exhaustif »
     * ne couvrait plus que deux combinaisons sur vingt-cinq. Un balayage qui
     * rétrécit en silence est pire qu'un balayage absent : il rassure.
     */
    const banc = lire('tests/unit/server/api/mayaRoute.test.ts');
    expect(banc, 'le balayage doit lire le catalogue').toContain('ACTIONS_IDS');
    expect(banc, 'la liste balayée doit ÊTRE le catalogue, pas un extrait').toMatch(
      /const ACTIONS[^=]*=\s*ACTIONS_IDS\s*;/,
    );
  });

  it('le miroir client est un IMPORT, pas une copie', () => {
    // Deux listes de cinq chaînes dans deux fichiers, qui devaient rester
    // identiques par discipline. Le catalogue ne contient que des données : il
    // traverse la frontière client/serveur sans emporter le serveur avec lui.
    const client = lire('app/composables/useCopilote.ts');
    expect(client, 'le type d’action doit venir du catalogue').toMatch(
      /export type \{[^}]*ActionId[^}]*\} from '~\/config\/maya-actions'/,
    );
  });
});
