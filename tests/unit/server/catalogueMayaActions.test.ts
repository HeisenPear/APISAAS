import { describe, it, expect } from 'vitest';
import { readFileSync, globSync } from 'node:fs';
import { MAYA_ACTIONS, ACTIONS_IDS, ACTION_DOMAINE } from '~/config/maya-actions';
import { ROUTE_GATES } from '~/config/route-gates';
import { DOMAINES_ECRITURE } from '~/config/roles';
import { domaineDeLEvenement } from '~/config/evenements-donnees';

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
    /**
     * `route: null` est une DÉCLARATION, pas un oubli — mais c'est aussi une
     * trappe commode. Ce cas la tient FERMÉE en nommant celles qui y ont droit :
     * en ajouter une demande de venir ici, donc de le décider.
     *
     *   · `intervention` — son gating vit dans `dispatchHandler`, par catégorie
     *     (`recolte` → production, `reine` → moduleReine) plus le plafond de
     *     cheptel sur `division`. Une route unique n'existe pas.
     *   · `mortalite` — DÉLIBÉRÉMENT non gatée. On ne fait pas payer un
     *     apiculteur pour enregistrer que ses colonies sont mortes ; le geste
     *     RÉDUIT son cheptel, donc le gater reviendrait à lui interdire de
     *     descendre sous son propre plafond. `PUT /api/ruches/*` n'a d'ailleurs
     *     aucune porte non plus : le choix a été pris là-bas avant ici.
     */
    const sansRoute = ACTIONS_IDS.filter((id) => MAYA_ACTIONS[id].route === null);
    expect(sansRoute.sort()).toEqual(['intervention', 'mortalite']);
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
      /**
       * ⚠️ LES CLÉS SE COMPTENT PAR OBJET, PAS PAR FICHIER — ET C'EST UNE
       * CORRECTION, PAS UN ASSOUPLISSEMENT.
       *
       * La règle ramassait les clés nues du fichier ENTIER. Dans un module de
       * quatre mille lignes, trois champs sans aucun rapport ont fini par
       * suffire : un `recolte:` de barème ligne 1020, un `rucher:` d'annotation
       * de type ligne 3933, un `mortalite: true` de champ JSONB ligne 4457.
       * Trois mille lignes d'écart, aucun registre — et le banc criait quand
       * même. Une règle qui crie à tort finit désactivée, et c'est ainsi qu'on
       * perd un vrai garde.
       *
       * Un registre est UN objet. On compte donc les clés d'un même objet, en
       * appariant les accolades — c'est exact, là où la fenêtre de proximité
       * n'aurait été qu'une heuristique de plus.
       */
      for (let i = 0; i < code.length; i++) {
        if (code[i] !== '{') continue;
        let profondeur = 0;
        let fin = i;
        for (; fin < code.length; fin++) {
          if (code[fin] === '{') profondeur++;
          else if (code[fin] === '}') {
            profondeur--;
            if (profondeur === 0) break;
          }
        }
        const corps = code.slice(i + 1, fin);
        // Les objets IMBRIQUÉS sont retirés : leurs clés appartiennent à eux,
        // et seront comptées à leur tour par la boucle englobante.
        const direct = corps.replace(/\{[^{}]*\}/g, ' ');
        const clesNues = new Set(
          [...direct.matchAll(/(?<!['"])\b([a-z]+)\s*:/g)]
            .map((x) => x[1]!)
            .filter((x) => (ACTIONS_IDS as string[]).includes(x)),
        );
        if (clesNues.size >= 3) {
          fautes.push(`${f} — objet clé par { ${[...clesNues].join(', ')} }`);
        }
      }
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

// ═══════════════════════════════════════════════════════════════════════════
// CE QUE CHAQUE ACTION INVALIDE PARLE BIEN D'ELLE
//
// ⚠️ `invalide` N'ÉTAIT CONFRONTÉ À RIEN, ET LA MESURE EST SANS APPEL. Le
// catalogue exigeait un plancher NON VIDE, fait de noms CONNUS du bus — et
// s'arrêtait là. Mis à l'épreuve : `recolte`, `stock`, `vente`, `achat` et
// `mortalite` pouvaient TOUTES déclarer `['client:created']` d'un seul coup, et
// les 2 469 bancs du dépôt restaient verts.
//
// À l'écran : l'apiculteur dicte « 18 kg de toutes fleurs », Maya répond
// « c'est noté », la page Production ne bouge pas — et c'est la liste des
// clients qui se recharge.
//
// Un seul banc rougissait, `repercussionLot`, et par ACCIDENT : il code en dur
// deux attentes littérales, et n'exerce que quatre actions sur neuf. C'est « la
// couverture qui s'arrête juste avant », en grandeur nature.
// ═══════════════════════════════════════════════════════════════════════════

describe('le plancher d’invalidation parle de la ressource de l’action', () => {
  it('garde-fou : chaque action déclare une ressource et un plancher', () => {
    // Sans ce contrôle, un catalogue vidé passerait les deux cas suivants.
    for (const id of ACTIONS_IDS) {
      expect(MAYA_ACTIONS[id].ressource, id).toBeTruthy();
      if (MAYA_ACTIONS[id].ecrit) expect(MAYA_ACTIONS[id].invalide.length, id).toBeGreaterThan(0);
    }
    expect(ACTIONS_IDS.length).toBeGreaterThan(5);
  });

  it('au moins un événement du plancher NOMME la ressource de l’action', () => {
    /**
     * ⚠️ « AU MOINS UN », ET C'EST VOULU. Une action touche légitimement
     * plusieurs domaines — créer une ruche change aussi le compte de son
     * rucher, une mortalité écrit une intervention. Ce qu'on interdit, c'est
     * qu'AUCUN des événements ne parle de ce que l'action fabrique.
     */
    const menteuses: string[] = [];
    for (const id of ACTIONS_IDS) {
      const action = MAYA_ACTIONS[id];
      if (!action.ecrit) continue;
      const domaines = action.invalide.map(domaineDeLEvenement);
      if (!domaines.includes(action.ressource)) {
        menteuses.push(
          `${id} : ressource « ${action.ressource} », plancher « ${domaines.join(', ')} »`,
        );
      }
    }
    expect(
      menteuses,
      'Ces actions déclarent rafraîchir un écran qui n’a rien à voir avec ce ' +
        'qu’elles écrivent. L’apiculteur dicte, Maya répond « c’est noté », et ' +
        'la page qu’il regarde ne bouge pas.',
    ).toEqual([]);
  });

  it('la RESSOURCE est celle que la route de l’action nomme', () => {
    /**
     * ⚠️ LE SECOND VERROU, et il rend le mensonge coûteux. `ressource` seule
     * serait un mot posé à la main, qu'un copier-coller entre deux entrées
     * voisines suffirait à fausser. Confrontée à la ROUTE — que l'action
     * possède déjà, et dont dépend son gating — mentir demande de mentir DEUX
     * fois, dans deux champs qui se contredisent.
     *
     * Les actions sans route (`intervention`, `mortalite`) en sont dispensées
     * PAR RÈGLE, pas par nom : elles n'ont pas de route unique, ce que leur
     * champ `route: null` déclare déjà et que le banc de gating garde.
     */
    const ecarts: string[] = [];
    for (const id of ACTIONS_IDS) {
      const { route, ressource } = MAYA_ACTIONS[id];
      if (!route) continue;
      const dernier = route.split('/').pop() ?? '';
      const singulier = dernier.replace(/s$/, '');
      if (singulier !== ressource) {
        ecarts.push(
          `${id} : route « ${route} » dit « ${singulier} », le catalogue dit « ${ressource} »`,
        );
      }
    }
    expect(ecarts).toEqual([]);
  });
});
