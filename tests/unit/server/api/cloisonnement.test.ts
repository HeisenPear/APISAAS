// ═══════════════════════════════════════════════════════════════════════════
// CLOISONNEMENT — la couverture inverse des 267 routes privées.
//
// ─── POURQUOI CE BANC EXISTE ──────────────────────────────────────────────
// Ce dépôt a une particularité qu'on oublie vite : la RLS de Supabase NE
// PROTÈGE RIEN côté serveur. `server/utils/db.ts` ouvre une connexion
// `postgres.js` directe, sans `set_config('request.jwt.claims')` ni
// `SET LOCAL role` — les politiques ne s'appliquent qu'au client du navigateur.
//
// L'isolation entre exploitations repose donc ENTIÈREMENT sur les
// `eq(table.userId, ownerId)` écrits à la main, route par route. Une seule
// omission, et un apiculteur lit — ou modifie — le rucher d'un autre. Aucune
// couche en dessous ne le rattrapera.
//
// Tester chaque route une par une coûterait des semaines et vieillirait mal.
// Ce banc prend l'autre bout : il balaie l'arborescence et exige des
// propriétés de chaque fichier. Il couvre donc les routes qui n'existent pas
// encore.
//
// ─── ⚠️ CE QUI A ÉTÉ CORRIGÉ DANS CE BANC LUI-MÊME ────────────────────────
// La liste des tables cloisonnées était ÉCRITE À LA MAIN : vingt-huit noms
// recopiés. Le schéma en portait CINQUANTE ET UN. Vingt-trois tables
// échappaient donc au balayage — dont `mouvementsBancaires` et
// `connexionsBancaires` (les données de banque), `membres`, `auditLog`,
// `mesuresBalance`, et TOUS les satellites d'intervention (`divisions`,
// `essaimages`, `traitementsVarroa`, `evenementsSanitaires`…). Une table
// ajoutée au schéma n'entrait jamais dans la liste, et personne ne le voyait.
//
// C'est mot pour mot la forme de faux vert que CLAUDE.md nomme « la couverture
// qui s'arrête juste avant ». La parade est la même : ITÉRER SUR LA SOURCE DE
// VÉRITÉ. La liste se dérive maintenant de `schema.ts`.
//
// Deuxième correction, même famille : la règle acceptait qu'un fichier
// MENTIONNE `userId` n'importe où. `accepter.post.ts` passait grâce à
// `userId: user.id` — une VALEUR ÉCRITE dans un `set()`, pas un prédicat de
// portée — pendant que son `where` ne filtrait que sur l'identifiant. Le mot
// au lieu de l'appel, encore. On distingue désormais :
//   · `from` / `update` / `delete` ont un WHERE → un PRÉDICAT est exigé ;
//   · `insert` n'en a pas → c'est la VALEUR écrite qui cloisonne.
//
// ─── CE QU'IL PROUVE, ET CE QU'IL NE PROUVE PAS ───────────────────────────
// Il prouve qu'aucune route privée n'oublie de s'authentifier, et qu'aucune
// route touchant une table cloisonnée n'ignore la notion de propriétaire —
// avec la bonne forme selon qu'elle lit ou qu'elle insère.
//
// Il ne prouve PAS que le prédicat porte sur LA BONNE requête quand une route
// en fait plusieurs. Cette finesse-là relève des bancs d'intégration sur
// locataires éphémères (`tests/integration/`), qui écrivent réellement et
// vérifient qu'un compte ne voit pas les données d'un autre.
//
// La SECONDE chaîne de propriété du dépôt a désormais ses propres règles, en
// bas de ce fichier : les campagnes groupées ne portent pas de `userId` de
// ligne, elles remontent à `organisations.ownerId` par une jointure. Vérifiée
// route par route avant d'écrire la règle : les dix-sept routes concernées
// étaient déjà correctes. Le banc n'y corrige rien, il empêche d'y régresser —
// c'est la chaîne la plus facile à casser, puisqu'un produit ou une commande
// se retrouve par son seul identifiant, à deux ou trois niveaux du
// propriétaire.
// ═══════════════════════════════════════════════════════════════════════════

import { describe, expect, it } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { sansCommentaires } from '../../../helpers/sansCommentaires';

const RACINE = 'server/api';
const SCHEMA = 'server/database/schema.ts';

/**
 * Primitives qui établissent l'identité de l'appelant ou son espace de travail.
 * `requireMFA` compte : c'est la plus forte, elle exige une session 2FA.
 */
const AUTH =
  /\b(requireAuth|requireAdmin|requireMFA|requireWorkspace|resolveWorkspace|resolveOwnerId|assertCanWrite)\b/;

/**
 * Routes PUBLIQUES par conception. Chacune doit avoir une raison, et cette
 * raison est écrite ici — une liste d'exemptions sans justification devient
 * vite l'endroit où l'on range ce qu'on n'a pas su protéger.
 */
const PUBLIQUES: { prefixe: string; raison: string }[] = [
  { prefixe: 'server/api/public/', raison: 'campagnes et commandes servies sur jeton public' },
  { prefixe: 'server/api/cron/', raison: 'tâches planifiées, authentifiées par un secret de cron' },
  { prefixe: 'server/api/stripe/webhook', raison: 'appelé par Stripe, vérifié par signature' },
  {
    prefixe: 'server/api/balances/ingest/',
    raison: 'balances connectées, authentifiées par jeton',
  },
  { prefixe: 'server/api/security/csp-report', raison: 'rapports émis par le navigateur' },
  { prefixe: 'server/api/track', raison: 'télémétrie anonyme' },
  { prefixe: 'server/api/feedback', raison: 'retour utilisateur, ouvert volontairement' },
  { prefixe: 'server/api/notif/unsubscribe-email', raison: 'désinscription sur jeton signé' },
  {
    prefixe: 'server/api/auth/',
    raison: 'on ne peut pas exiger d’être connecté pour se connecter',
  },
  { prefixe: 'server/api/push/vapid-key', raison: 'clé publique, destinée à être publique' },
  { prefixe: 'server/api/calendrier/', raison: 'flux .ics servi sur jeton' },
];

/**
 * Routes cloisonnées AUTREMENT que par le propriétaire, chacune avec sa raison.
 *
 * ⚠️ La raison est obligatoire et vérifiée, et une entrée qui ne correspond
 * plus à une route en faute fait échouer le banc : une liste de dispenses qui
 * garde ses fantômes finit par couvrir un vrai trou.
 */
const AUTRE_CLOISONNEMENT: { chemin: string; raison: string }[] = [
  {
    chemin: 'server/api/membres/accepter.post.ts',
    raison:
      "l'acteur est l'INVITÉ, pas le propriétaire : la ligne se retrouve par l'e-mail du " +
      'profil authentifié. Filtrer sur `userId` serait ici le mauvais critère — la colonne ' +
      "est justement vide tant que l'invitation n'est pas acceptée.",
  },
  {
    chemin: 'server/api/membres/refuser.post.ts',
    raison:
      "même chose que sa jumelle `accepter` : l'invité supprime SA propre invitation en " +
      "attente, identifiée par l'e-mail de son profil authentifié.",
  },
];

/**
 * Les tables dont chaque ligne appartient à une exploitation — DÉRIVÉES du
 * schéma, jamais recopiées. Une table qui déclare une colonne `userId` est
 * cloisonnée par construction ; c'est la seule définition qui ne peut pas
 * prendre du retard sur le schéma.
 */
function tablesCloisonnees(): Set<string> {
  const src = readFileSync(SCHEMA, 'utf-8');
  const trouvees = new Set<string>();
  const declaration = /export const (\w+) = pgTable\(/g;

  for (const m of src.matchAll(declaration)) {
    const suite = src.slice(m.index);
    // Le corps s'arrête au prochain export de premier niveau.
    const fin = suite.slice(1).search(/\nexport (const|type|interface) /);
    const corps = fin === -1 ? suite : suite.slice(0, fin + 1);
    if (/\buserId: /.test(corps)) trouvees.add(m[1]!);
  }
  return trouvees;
}

const CLOISONNEES = tablesCloisonnees();

/** Les accès qui portent un WHERE : le cloisonnement doit y être un PRÉDICAT. */
const ACCES_FILTRE = /\.(?:from|update|delete)\((\w+)\)/g;
/** L'insertion n'a pas de WHERE : c'est la VALEUR écrite qui cloisonne. */
const ACCES_INSERT = /\.insert\((\w+)\)/g;

/** Un prédicat de portée : la colonne est COMPARÉE, pas seulement nommée. */
const PREDICAT = /eq\(\s*\w+\.userId\b|inArray\(\s*\w+\.userId\b|\bownerId\b/;
/**
 * Une valeur de portée : la colonne est ÉCRITE, et écrite avec une IDENTITÉ.
 *
 * ⚠️ ELLE S'EST ÉCRITE `/\buserId:/` D'ABORD, ET LA MUTATION L'A DIT. Retirer
 * `userId: user.id` de l'insertion de `copilote.post.ts` laissait le banc
 * VERT : trente lignes plus bas, le fichier déclare un paramètre
 * `userId: string` — une ANNOTATION DE TYPE, que le motif comptait comme une
 * valeur écrite. Le mot au lieu de l'appel, dans la règle même qui venait
 * d'être écrite pour fermer ce piège ailleurs.
 *
 * Exiger une identité à droite du deux-points refuse l'annotation et tolère
 * les deux formes réelles du dépôt : l'objet littéral, et le tableau construit
 * plus haut puis passé à `.values(...)`.
 */
const VALEUR = /\buserId:\s*(?:ownerId|user\.id|userId|[A-Za-z_$][\w$]*\.(?:id|userId|ownerId))/;

interface Route {
  chemin: string;
  source: string;
  publique: boolean;
}

function listerRoutes(dossier = RACINE, sortie: Route[] = []): Route[] {
  for (const entree of readdirSync(dossier).sort()) {
    const chemin = join(dossier, entree);
    if (statSync(chemin).isDirectory()) {
      listerRoutes(chemin, sortie);
    } else if (entree.endsWith('.ts')) {
      sortie.push({
        chemin,
        source: readFileSync(chemin, 'utf-8'),
        publique: PUBLIQUES.some((p) => chemin.startsWith(p.prefixe)),
      });
    }
  }
  return sortie;
}

const ROUTES = listerRoutes();
const PRIVEES = ROUTES.filter((r) => !r.publique);

/** Les tables cloisonnées qu'une route lit ou mute, et celles qu'elle insère. */
function tablesTouchees(source: string) {
  const filtrees = new Set<string>();
  const inserees = new Set<string>();
  for (const m of source.matchAll(ACCES_FILTRE)) {
    if (m[1] && CLOISONNEES.has(m[1])) filtrees.add(m[1]);
  }
  for (const m of source.matchAll(ACCES_INSERT)) {
    if (m[1] && CLOISONNEES.has(m[1])) inserees.add(m[1]);
  }
  return { filtrees, inserees };
}

describe('le balayage voit réellement les routes', () => {
  it('trouve l’arborescence complète', () => {
    // Sans ce garde, un `server/api` déplacé rendrait les invariants suivants
    // vrais sur un ensemble vide — verts, et sans aucun sens.
    expect(ROUTES.length).toBeGreaterThan(250);
    expect(PRIVEES.length).toBeGreaterThan(200);
  });

  it('chaque exemption porte une justification écrite', () => {
    for (const { prefixe, raison } of PUBLIQUES) {
      expect(raison.length, `${prefixe} sans raison`).toBeGreaterThan(15);
    }
    for (const { chemin, raison } of AUTRE_CLOISONNEMENT) {
      expect(raison.length, `${chemin} sans raison`).toBeGreaterThan(40);
    }
  });

  it('aucune exemption ne pointe dans le vide', () => {
    // Une exemption dont le chemin n'existe plus est un trou en puissance :
    // elle sera reprise telle quelle et couvrira un jour autre chose.
    for (const { prefixe } of PUBLIQUES) {
      const couvre = ROUTES.some((r) => r.chemin.startsWith(prefixe));
      expect(couvre, `${prefixe} ne correspond à aucune route`).toBe(true);
    }
    for (const { chemin } of AUTRE_CLOISONNEMENT) {
      expect(
        ROUTES.some((r) => r.chemin === chemin),
        `${chemin} ne correspond à aucune route`,
      ).toBe(true);
    }
  });
});

describe('la liste des tables cloisonnées se dérive du schéma', () => {
  it('garde-fou — la dérivation lit vraiment le schéma', () => {
    // Elle était écrite à la main et s'était arrêtée à 28 noms sur 51.
    expect(
      CLOISONNEES.size,
      'la dérivation ne trouve presque aucune table : le format de `schema.ts` a changé, ' +
        'et toutes les règles qui suivent deviennent vides de sens.',
    ).toBeGreaterThan(45);
    for (const attendue of [
      'ruches',
      'ruchers',
      'transactions',
      'mouvementsBancaires',
      'membres',
    ]) {
      expect(CLOISONNEES, `« ${attendue} » devrait être reconnue cloisonnée`).toContain(attendue);
    }
  });

  it('garde-fou — elle n’avale pas les tables partagées', () => {
    // Une dérivation trop large rendrait la règle bruyante, puis désactivée.
    for (const partagee of ['floraisonsReferentiel', 'profils', 'codesPromo']) {
      expect(
        CLOISONNEES,
        `« ${partagee} » n'a pas de colonne \`userId\` : la dérivation la classe à tort ` +
          'comme cloisonnée.',
      ).not.toContain(partagee);
    }
  });
});

describe('toute route privée s’authentifie', () => {
  it('aucune ne fait l’impasse', () => {
    const nues = PRIVEES.filter((r) => !AUTH.test(r.source)).map((r) => r.chemin);
    expect(nues, `routes sans primitive d'authentification :\n  ${nues.join('\n  ')}`).toEqual([]);
  });
});

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * LE `WHERE` D'UNE ÉCRITURE, PRIS ISOLÉMENT.
 *
 * ⚠️ CE QUE LES RÈGLES CI-DESSOUS NE VOIENT PAS, ET QUI A COÛTÉ DEUX DÉFAUTS.
 * Elles testent le FICHIER ENTIER : il suffit qu'une requête, n'importe
 * laquelle, porte un prédicat de portée pour que toute la route soit réputée
 * cloisonnée. L'en-tête de ce banc l'annonce honnêtement depuis le début — mais
 * l'annoncer n'est pas le fermer.
 *
 * `convertir.post.ts` et `facturer-groupe.post.ts` en sont la démonstration :
 * leur `select` d'ouverture filtrait bien sur le propriétaire, et leur écriture
 * finale ne filtrait que sur l'identifiant de ligne. Deux routes vertes, deux
 * `UPDATE` non cloisonnés, trouvés à la main par une relecture.
 *
 * Une ÉCRITURE est justiciable d'une règle plus stricte qu'une lecture :
 *   · c'est là que le dégât est irréversible — lire la donnée d'un autre est
 *     grave, la modifier l'est davantage ;
 *   · sa forme est LOCALE et donc analysable : `.update(t)` … `.where(…)` se
 *     tient en une seule chaîne d'appels, là où un `select` peut joindre,
 *     sous-requêter, ou valider son parent trente lignes plus haut.
 *
 * On extrait donc le `where` de chaque écriture, et lui seul.
 * ═══════════════════════════════════════════════════════════════════════════
 */

/** Le `.where(…)` qui suit une écriture, parenthèses équilibrées. */
export function wheresDEcriture(source: string): Array<{ table: string; where: string }> {
  const code = sansCommentaires(source);
  const trouves: Array<{ table: string; where: string }> = [];

  for (const m of code.matchAll(/\.(?:update|delete)\(\s*(\w+)\s*\)/g)) {
    const table = m[1]!;
    const apres = code.slice(m.index! + m[0].length);
    // La chaîne d'appels s'arrête au premier `;` de premier niveau.
    const finChaine = (() => {
      let profondeur = 0;
      for (let i = 0; i < apres.length; i++) {
        const c = apres[i];
        if (c === '(') profondeur++;
        else if (c === ')') profondeur--;
        else if (c === ';' && profondeur <= 0) return i;
      }
      return apres.length;
    })();
    const chaine = apres.slice(0, finChaine);

    const debutWhere = chaine.search(/\.where\s*\(/);
    if (debutWhere === -1) {
      // Une écriture SANS `where` : le cas le plus grave, on le rend tel quel.
      trouves.push({ table, where: '' });
      continue;
    }
    let i = chaine.indexOf('(', debutWhere);
    let profondeur = 0;
    let fin = chaine.length;
    for (; i < chaine.length; i++) {
      if (chaine[i] === '(') profondeur++;
      else if (chaine[i] === ')') {
        profondeur--;
        if (profondeur === 0) {
          fin = i + 1;
          break;
        }
      }
    }
    trouves.push({ table, where: resoudre(code, chaine.slice(debutWhere, fin)) });
  }
  return trouves;
}

/**
 * Un `where` peut être bâti PLUS HAUT et passé par son nom :
 *
 *     const cible = and(eq(t.id, id), eq(t.userId, ownerId));
 *     await db.update(t).set({ … }).where(cible);
 *
 * C'est une bonne pratique — la condition est écrite une fois et réutilisée par
 * les deux écritures de la route — et la sonde doit la suivre, sinon elle
 * dénonce le code le plus soigné du dépôt. On remplace donc chaque nom simple
 * par sa définition, une seule fois : suffisant pour toutes les formes réelles,
 * et sans risque de boucle.
 */
function resoudre(code: string, where: string): string {
  const definitionDe = (nom: string) =>
    code.match(new RegExp(`\\b(?:const|let|var)\\s+${nom}\\s*=\\s*([^;]+);`))?.[1];

  // Forme 1 — le nom seul : `.where(cible)`.
  const seul = where.match(/^\.where\s*\(\s*([A-Za-z_$][\w$]*)\s*\)$/)?.[1];
  if (seul) {
    const def = definitionDe(seul);
    if (def) return `.where(${def})`;
  }

  // Forme 2 — l'étalement d'un tableau bâti au fil des filtres facultatifs :
  // `const conditions = [eq(t.userId, ownerId)]` puis `conditions.push(...)`.
  return where.replace(/\.{3}([A-Za-z_$][\w$]*)/g, (tout, nom) => definitionDe(nom) ?? tout);
}

describe('le `where` d’une ÉCRITURE porte lui-même le propriétaire', () => {
  it('CONTRÔLE POSITIF : la sonde isole le bon `where`', () => {
    // Le défaut RÉEL de `convertir.post.ts`, réduit à sa forme.
    const fautif = `
      const [bl] = await db.select().from(bonsLivraison)
        .where(and(eq(bonsLivraison.id, id), eq(bonsLivraison.userId, ownerId))).limit(1);
      await db.update(bonsLivraison).set({ statut: 'facture' }).where(eq(bonsLivraison.id, id));
    `;
    const sain = fautif.replace(
      '.where(eq(bonsLivraison.id, id));',
      '.where(and(eq(bonsLivraison.id, id), eq(bonsLivraison.userId, ownerId)));',
    );

    const [ecritureFautive] = wheresDEcriture(fautif);
    expect(ecritureFautive?.table).toBe('bonsLivraison');
    expect(
      PREDICAT.test(ecritureFautive!.where),
      'la sonde attrape le `where` du SELECT au lieu de celui de l’UPDATE : elle mesurerait ' +
        'exactement le contraire de ce qu’elle promet.',
    ).toBe(false);
    expect(PREDICAT.test(wheresDEcriture(sain)[0]!.where)).toBe(true);
  });

  it('CONTRÔLE POSITIF : elle SUIT un `where` bâti dans une variable', () => {
    /**
     * ⚠️ SANS CELA, LA SONDE DÉNONCE LE CODE LE PLUS SOIGNÉ. Écrire la
     * condition une fois et la réutiliser pour les deux écritures d'une route
     * est une bonne pratique — c'est ce que font les deux routes d'envoi. Une
     * sonde aveugle à cette forme produirait des fautes imaginaires, et
     * finirait désactivée.
     */
    const source = `
      const cible = and(eq(transactions.id, id), eq(transactions.userId, ownerId));
      await db.update(transactions).set({ statut: 'envoyee' }).where(cible);
    `;
    const [ecriture] = wheresDEcriture(source);
    expect(PREDICAT.test(ecriture!.where)).toBe(true);
  });

  it('CONTRÔLE POSITIF : elle suit aussi un TABLEAU de conditions étalé', () => {
    // `alertes/supprimer.post.ts` : la condition de propriétaire OUVRE le
    // tableau, les filtres facultatifs s'y ajoutent ensuite. Sans cette forme,
    // la sonde dénonce une route parfaitement cloisonnée.
    const source = `
      const conditions = [eq(alertes.userId, ownerId)];
      if (scope === 'lues') conditions.push(eq(alertes.lue, true));
      await db.delete(alertes).where(and(...conditions));
    `;
    expect(PREDICAT.test(wheresDEcriture(source)[0]!.where)).toBe(true);
  });

  it('CONTRÔLE POSITIF : une écriture SANS `where` est vue', () => {
    // `.update(t).set(...)` sans filtre touche TOUTE la table.
    const nu = 'await db.update(ruches).set({ statut: 4 });';
    expect(wheresDEcriture(nu)).toEqual([{ table: 'ruches', where: '' }]);
  });

  it('elle ne se laisse pas berner par un commentaire', () => {
    const source = '// avant : .update(ruches).set({}).where(eq(ruches.id, id))\nconst x = 1;';
    expect(wheresDEcriture(source)).toEqual([]);
  });

  it('GARDE-FOU : le balayage voit bien des écritures', () => {
    const total = PRIVEES.reduce(
      (n, r) => n + wheresDEcriture(r.source).filter((e) => CLOISONNEES.has(e.table)).length,
      0,
    );
    expect(total, 'aucune écriture trouvée : la règle porterait sur zéro cas').toBeGreaterThan(60);
  });

  it('LA RÈGLE : aucune écriture ne filtre sans son propriétaire', () => {
    const dispensees = new Set(AUTRE_CLOISONNEMENT.map((d) => d.chemin));
    const fautives: string[] = [];
    for (const route of PRIVEES) {
      if (dispensees.has(route.chemin)) continue;
      for (const { table, where } of wheresDEcriture(route.source)) {
        if (!CLOISONNEES.has(table)) continue;
        if (!PREDICAT.test(where)) {
          fautives.push(`${route.chemin} → .update/delete(${table}) ${where || '(SANS where !)'}`);
        }
      }
    }
    expect(
      fautives,
      'Ces écritures ne comparent pas la colonne du propriétaire DANS LEUR PROPRE `where`. ' +
        "Qu'une autre requête du fichier le fasse ne protège rien : c'est ce `where`-là qui " +
        'part en base. La RLS ne rattrapera pas — `db.ts` ouvre une connexion service-role ' +
        `qui la contourne.\n  ${fautives.join('\n  ')}`,
    ).toEqual([]);
  });
});

describe('toute route touchant une table cloisonnée connaît son propriétaire', () => {
  const dispensees = new Set(AUTRE_CLOISONNEMENT.map((d) => d.chemin));

  it('garde-fou — le prédicat n’est pas confondu avec une valeur écrite', () => {
    // Le défaut réel : `accepter.post.ts` passait parce qu'il ÉCRIVAIT
    // `userId: user.id` dans un `set()`, pendant que son `where` ne filtrait
    // que sur l'identifiant de la ligne.
    const valeurEcrite = ".set({ userId: user.id, statut: 'acceptee' })";
    expect(VALEUR.test(valeurEcrite)).toBe(true);
    expect(
      VALEUR.test('  userId: string,'),
      "une ANNOTATION DE TYPE est comptée comme une valeur écrite : c'est ce qui a laissé " +
        'passer une insertion dépouillée de son propriétaire.',
    ).toBe(false);
    expect(
      PREDICAT.test(valeurEcrite),
      'une valeur écrite est comptée comme un prédicat de portée : la règle laisserait ' +
        'passer exactement le défaut qui l’a fait naître.',
    ).toBe(false);

    const predicat = 'where(eq(ruches.userId, ownerId))';
    expect(PREDICAT.test(predicat), 'la règle ne reconnaît plus un vrai prédicat').toBe(true);
  });

  it('celles qui LISENT ou MUTENT portent un prédicat de portée', () => {
    const fautives: string[] = [];
    for (const route of PRIVEES) {
      if (dispensees.has(route.chemin)) continue;
      const { filtrees } = tablesTouchees(route.source);
      if (filtrees.size > 0 && !PREDICAT.test(route.source)) {
        fautives.push(`${route.chemin} → ${[...filtrees].sort().join(', ')}`);
      }
    }
    expect(
      fautives,
      "Ces routes lisent ou modifient des données d'exploitation sans jamais COMPARER la " +
        `colonne du propriétaire.\n  ${fautives.join('\n  ')}\n\n` +
        'La RLS ne rattrapera pas : `db.ts` ouvre une connexion service-role qui la ' +
        'contourne. Un `where` manquant, et un apiculteur voit le rucher d’un autre.',
    ).toEqual([]);
  });

  it('celles qui INSÈRENT écrivent la colonne du propriétaire', () => {
    const fautives: string[] = [];
    for (const route of PRIVEES) {
      if (dispensees.has(route.chemin)) continue;
      const { filtrees, inserees } = tablesTouchees(route.source);
      // Une route qui lit aussi est déjà couverte par la règle précédente.
      if (filtrees.size === 0 && inserees.size > 0 && !VALEUR.test(route.source)) {
        fautives.push(`${route.chemin} → ${[...inserees].sort().join(', ')}`);
      }
    }
    expect(
      fautives,
      "Ces routes insèrent dans une table cloisonnée sans écrire `userId`. Une insertion n'a " +
        `pas de \`where\` : la valeur écrite EST le cloisonnement.\n  ${fautives.join('\n  ')}`,
    ).toEqual([]);
  });

  it('chaque dispense correspond encore à une route réellement en faute', () => {
    for (const { chemin } of AUTRE_CLOISONNEMENT) {
      const route = PRIVEES.find((r) => r.chemin === chemin);
      expect(route, `${chemin} n'est plus une route privée`).toBeDefined();
      const { filtrees } = tablesTouchees(route!.source);
      expect(
        filtrees.size > 0 && !PREDICAT.test(route!.source),
        `${chemin} porte désormais un prédicat de portée : la dispense ne sert plus à rien ` +
          'et masquerait une future régression sur cette route. Retirez-la.',
      ).toBe(true);
    }
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// LA SECONDE CHAÎNE : LES CAMPAGNES GROUPÉES.
//
// Ces tables n'ont pas de `userId`. La propriété remonte par jointure :
//
//     commandesGroupees.campagneId  ─┐
//     produitsCampagne.campagneId   ─┴→ campagnesCommande.organisationId
//                                         → organisations.ownerId
//
// C'est la chaîne la plus facile à casser, et pour une raison mécanique : un
// produit ou une commande se retrouve par son SEUL identifiant, à deux ou
// trois niveaux du propriétaire. La forme sûre — celle que portent les trois
// routes concernées — vérifie d'abord la campagne, puis contraint la mutation
// par l'identifiant de l'objet ET celui de la campagne validée. Écrire
// seulement `eq(produitsCampagne.id, prodId)` suffirait à laisser un
// apiculteur modifier le produit d'une campagne qui n'est pas la sienne.
//
// Ces commandes portent des noms, des e-mails et des téléphones de clients.
// ═══════════════════════════════════════════════════════════════════════════

const CHAINE_ORGANISATION = [
  'organisations',
  'campagnesCommande',
  'produitsCampagne',
  'commandesGroupees',
];
/** Les tables de la chaîne qu'on ne peut atteindre que par jointure. */
const ENFANTS_DE_CAMPAGNE = ['produitsCampagne', 'commandesGroupees'];

const ANCRE_ORGANISATION = /organisations\.ownerId/;
const MUTATION = /\.(update|delete)\((\w+)\)/g;
const ACCES_CHAINE = /\.(?:from|insert|update|delete)\((\w+)\)/g;

/** Le corps d'un ordre de mutation : du `.update(`/`.delete(` à son `.returning(`. */
function ordreDeMutation(source: string, depuis: number): string {
  const apres = source.slice(depuis, depuis + 700);
  const fin = apres.indexOf('.returning(');
  return fin === -1 ? apres : apres.slice(0, fin);
}

describe('la chaîne de propriété des campagnes groupées', () => {
  const concernees = PRIVEES.filter((r) =>
    [...r.source.matchAll(ACCES_CHAINE)].some((m) => m[1] && CHAINE_ORGANISATION.includes(m[1])),
  );

  const mutationsProfondes = concernees.flatMap((route) =>
    [...route.source.matchAll(MUTATION)]
      .filter((m) => m[2] && ENFANTS_DE_CAMPAGNE.includes(m[2]))
      .map((m) => ({ route, table: m[2]!, verbe: m[1]!, index: m.index! })),
  );

  it('garde-fou — le balayage voit la chaîne', () => {
    // Sans lui, un renommage de table rendrait les deux règles suivantes
    // vraies sur un ensemble vide.
    expect(concernees.length, 'aucune route de campagne trouvée').toBeGreaterThan(12);
    expect(
      mutationsProfondes.length,
      'aucune mutation sur un objet profond : la règle la plus importante ne mesure rien',
    ).toBeGreaterThan(2);
  });

  it('garde-fou — la fenêtre s’arrête à la fin de l’ordre SQL', () => {
    // ⚠️ Sur les routes réelles, courtes, la découpe ne change rien : la
    // mutation POURRAIT être lue avec tout le fichier et la règle passerait
    // quand même. Élargir la fenêtre laisse donc le banc vert, et c'est
    // honnête de le dire. On éprouve donc la découpe sur un cas FABRIQUÉ —
    // sans quoi elle ne serait gardée par rien, et une route qui nommerait
    // `campagneId` ailleurs dans son fichier passerait un jour pour contrainte
    // alors que son `where` ne l'est pas.
    const fabrique = [
      'await db.update(produitsCampagne).set(v).where(eq(produitsCampagne.id, p)).returning();',
      'await db.select().from(x).where(eq(produitsCampagne.campagneId, campagneId));',
    ].join('\n');
    expect(
      ordreDeMutation(fabrique, 0),
      "la fenêtre déborde sur l'ordre SUIVANT : un `campagneId` mentionné ailleurs dans le " +
        'fichier ferait passer une mutation non contrainte.',
    ).not.toContain('campagneId');
  });

  it('garde-fou — la règle reconnaît un `where` sur le seul identifiant', () => {
    const fabrique =
      '.update(produitsCampagne).set(v).where(eq(produitsCampagne.id, prodId)).returning()';
    const bloc = ordreDeMutation(fabrique, 0);
    expect(
      /produitsCampagne\.campagneId/.test(bloc),
      'la règle accepte une mutation contrainte par le seul identifiant de ligne — ' +
        "c'est exactement le défaut qu'elle doit refuser.",
    ).toBe(false);
  });

  it('chaque route remonte jusqu’au propriétaire de l’organisation', () => {
    const fautives = concernees
      .filter((r) => !ANCRE_ORGANISATION.test(r.source))
      // La création d'une organisation n'a pas de propriétaire à vérifier :
      // elle en ÉCRIT un. C'est la distinction insert/prédicat déjà posée.
      .filter((r) => !/ownerId: ownerId|ownerId: user\.id/.test(r.source))
      .map((r) => r.chemin);

    expect(
      fautives,
      'Ces routes touchent une campagne groupée sans jamais remonter à ' +
        `\`organisations.ownerId\`.\n  ${fautives.join('\n  ')}\n\n` +
        "Ces tables n'ont pas de `userId` : la jointure EST le cloisonnement.",
    ).toEqual([]);
  });

  it('toute mutation d’un objet profond est contrainte par sa campagne', () => {
    const fautives = mutationsProfondes
      .filter(({ route, table, index }) => {
        const bloc = ordreDeMutation(route.source, index);
        return !new RegExp(`${table}\\.campagneId`).test(bloc);
      })
      .map(({ route, table, verbe }) => `${route.chemin} → .${verbe}(${table})`);

    expect(
      fautives,
      'Ces mutations portent sur un produit ou une commande sans contraindre la campagne ' +
        `à laquelle il appartient.\n  ${fautives.join('\n  ')}\n\n` +
        "Vérifier la campagne PUIS muter par le seul identifiant de l'objet ne prouve rien : " +
        "l'objet peut appartenir à une autre campagne. Le `where` doit porter les deux.",
    ).toEqual([]);
  });
});
