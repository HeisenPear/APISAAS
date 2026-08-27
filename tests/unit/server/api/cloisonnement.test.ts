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
// Il ne couvre pas non plus la seconde chaîne de propriété du dépôt : les
// campagnes groupées sont rattachées à `organisations.ownerId` et non à un
// `userId` de ligne. Leurs routes vérifient bien `eq(organisations.ownerId,
// ownerId)`, mais cette famille mériterait sa propre règle.
// ═══════════════════════════════════════════════════════════════════════════

import { describe, expect, it } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

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
/** Une valeur de portée : la colonne est ÉCRITE dans la ligne insérée. */
const VALEUR = /\buserId:/;

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

describe('toute route touchant une table cloisonnée connaît son propriétaire', () => {
  const dispensees = new Set(AUTRE_CLOISONNEMENT.map((d) => d.chemin));

  it('garde-fou — le prédicat n’est pas confondu avec une valeur écrite', () => {
    // Le défaut réel : `accepter.post.ts` passait parce qu'il ÉCRIVAIT
    // `userId: user.id` dans un `set()`, pendant que son `where` ne filtrait
    // que sur l'identifiant de la ligne.
    const valeurEcrite = ".set({ userId: user.id, statut: 'acceptee' })";
    expect(VALEUR.test(valeurEcrite)).toBe(true);
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
