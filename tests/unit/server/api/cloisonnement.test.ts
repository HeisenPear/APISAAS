// ═══════════════════════════════════════════════════════════════════════════
// CLOISONNEMENT — la couverture inverse des 288 routes.
//
// ─── POURQUOI CE BANC EXISTE ──────────────────────────────────────────────
// Ce dépôt a une particularité qu'on oublie vite : la RLS de Supabase NE
// PROTÈGE RIEN côté serveur. `server/utils/db.ts` ouvre une connexion
// `postgres.js` directe, sans `set_config('request.jwt.claims')` ni
// `SET LOCAL role` — les politiques ne s'appliquent qu'au client du navigateur.
//
// L'isolation entre exploitations repose donc ENTIÈREMENT sur les
// `eq(table.userId, ownerId)` écrits à la main, route par route, 288 fois. Une
// seule omission, et un apiculteur lit — ou modifie — le rucher d'un autre.
// Aucune couche en dessous ne le rattrapera.
//
// Tester 288 routes une par une coûterait des semaines et vieillirait mal. Ce
// banc prend l'autre bout : il balaie l'arborescence et exige deux propriétés
// de chaque fichier. Il couvre donc les routes qui n'existent pas encore.
//
// ─── CE QU'IL PROUVE, ET CE QU'IL NE PROUVE PAS ───────────────────────────
// Il prouve qu'aucune route privée n'oublie de s'authentifier, et qu'aucune
// route touchant une table cloisonnée n'ignore complètement la notion de
// propriétaire. C'est la classe de défaut la plus grave et la plus facile à
// commettre — un copier-coller de route qui perd son `where`.
//
// Il ne prouve PAS que chaque requête filtre CORRECTEMENT : mentionner
// `userId` quelque part ne dit pas qu'il est appliqué à la bonne requête. Cette
// finesse-là relève des bancs d'intégration sur locataires éphémères
// (`tests/integration/`), qui écrivent réellement et vérifient qu'un compte ne
// voit pas les données d'un autre. Les deux se complètent : celui-ci est
// exhaustif et grossier, ceux-là sont fins et ponctuels.
// ═══════════════════════════════════════════════════════════════════════════

import { describe, expect, it } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const RACINE = 'server/api';

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

/** Tables dont chaque ligne appartient à UNE exploitation. */
const TABLES_CLOISONNEES = new Set([
  'ruches',
  'ruchers',
  'interventions',
  'recoltes',
  'stocks',
  'transactions',
  'clients',
  'alertes',
  'balances',
  'hausses',
  'lignees',
  'reinesElevage',
  'mortalites',
  'ordonnances',
  'veterinaires',
  'visitesSanitaires',
  'plansTranshumance',
  'emplacements',
  'conditionnements',
  'mouvementsStock',
  'declarationsNapi',
  'templatesIntervention',
  'previsionsTresorerie',
  'bonsLivraison',
  'planExecutions',
  'tokensCalendrier',
  'comptagesVarroa',
  'pesees',
]);

const TABLE_VISEE = /\.(?:from|insert|update|delete)\((\w+)\)/g;
const PORTEE = /\b(userId|ownerId)\b/;

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

describe('le balayage voit réellement les routes', () => {
  it('trouve l’arborescence complète', () => {
    // Sans ce garde, un `server/api` déplacé rendrait les deux invariants
    // suivants vrais sur un ensemble vide — verts, et sans aucun sens.
    expect(ROUTES.length).toBeGreaterThan(250);
    expect(PRIVEES.length).toBeGreaterThan(200);
  });

  it('chaque exemption porte une justification écrite', () => {
    for (const { prefixe, raison } of PUBLIQUES) {
      expect(raison.length, `${prefixe} sans raison`).toBeGreaterThan(15);
    }
  });

  it('aucune exemption ne pointe dans le vide', () => {
    // Une exemption dont le chemin n'existe plus est un trou en puissance :
    // elle sera reprise telle quelle et couvrira un jour autre chose.
    for (const { prefixe } of PUBLIQUES) {
      const couvre = ROUTES.some((r) => r.chemin.startsWith(prefixe));
      expect(couvre, `${prefixe} ne correspond à aucune route`).toBe(true);
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
  it('aucune n’ignore la notion d’espace', () => {
    const fautives: string[] = [];

    for (const route of PRIVEES) {
      const visees = new Set<string>();
      for (const m of route.source.matchAll(TABLE_VISEE)) {
        if (m[1] && TABLES_CLOISONNEES.has(m[1])) visees.add(m[1]);
      }
      if (visees.size > 0 && !PORTEE.test(route.source)) {
        fautives.push(`${route.chemin} → ${[...visees].sort().join(', ')}`);
      }
    }

    expect(
      fautives,
      `routes touchant des données d'exploitation sans jamais nommer le propriétaire :\n  ${fautives.join('\n  ')}`,
    ).toEqual([]);
  });
});
