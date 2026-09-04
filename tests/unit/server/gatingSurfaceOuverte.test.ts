import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { ROUTE_GATES, findMatchingGate } from '~/config/route-gates';

// ═══════════════════════════════════════════════════════════════════════════
// CE QUI RESTE OUVERT DANS UNE ZONE PAYANTE — mesuré, pas corrigé.
//
// ⚠️ CE BANC NE CACHE PAS UN DÉFAUT, IL LE COMPTE. C'est la même forme que
// « la séquence des achats en a DEUX — dette connue, et bornée à deux ».
//
// ─── CE QU'ON A CONSTATÉ ──────────────────────────────────────────────────
// `04.subscription.ts` est le SEUL endroit qui applique une porte de plan :
// aucune route ne re-vérifie la fonctionnalité dans son corps (vérifié par
// balayage — pas un seul `assertFeature` dans `server/api/`). Et le middleware
// sort en tête sur toute route absente de la table :
//
//     const gate = findMatchingGate(method, path);
//     if (!gate) return;
//
// Or, dans plusieurs zones payantes, seule la CRÉATION porte une porte. Toutes
// les opérations sur un objet existant sont ouvertes. Pour les campagnes
// groupées, par exemple, `POST /api/campagnes` exige `campagnesGroupees`, mais
// ouvrir, fermer, ajouter un produit et SAISIR UNE COMMANDE ne l'exigent pas.
// Un compte qui a créé sa campagne en payant, puis redescend en Découverte,
// garde donc toute la fonctionnalité — sauf le droit d'en créer une seconde.
//
// ─── POURQUOI CE BANC NE CORRIGE RIEN ─────────────────────────────────────
// Fermer ces routes, c'est BLOQUER UN COMPTE EXISTANT — potentiellement au
// milieu d'une campagne avec quarante commandes en cours. Ce dépôt a une règle
// pour ça : « ne jamais bloquer sans porte de sortie », et une autre qui dit
// que ce qui bloquerait un compte existant ne se tranche pas seul. C'est une
// décision de l'apiculteur, pas une correction.
//
// Ce que le banc fait, c'est empêcher la surface de GRANDIR en silence : une
// nouvelle route d'écriture ouverte dans une zone payante fera rougir le
// compteur, et celui qui l'écrira lira cette note avant de continuer.
//
// ⚠️ LA LISTE N'EST PAS UNE LISTE DE TROUS. Le découpage par zone est GROSSIER
// à dessein — il regarde le préfixe, pas la sémantique. `PUT /api/profils/me`
// apparaît parce que `logoExploitation` vit dans cette zone, alors que modifier
// son propre profil est évidemment gratuit ; `POST /api/interventions` de même,
// puisque seul le geste GROUPÉ est payant. Le compteur mesure une SURFACE, et
// c'est sa croissance qui est le signal, pas sa valeur absolue.
// ═══════════════════════════════════════════════════════════════════════════

/** Les routes d'écriture réelles, lues sur le disque. */
function routesDEcriture(): { methode: string; chemin: string }[] {
  const trouvees: { methode: string; chemin: string }[] = [];
  const descendre = (dossier: string, prefixe: string) => {
    for (const entree of readdirSync(dossier)) {
      const complet = join(dossier, entree);
      if (statSync(complet).isDirectory()) {
        descendre(complet, `${prefixe}/${entree}`);
        continue;
      }
      const m = /^(.*)\.(post|put|patch|delete)\.ts$/.exec(entree);
      if (!m) continue;
      const base = m[1] === 'index' ? prefixe : `${prefixe}/${m[1]}`;
      trouvees.push({ methode: m[2]!.toUpperCase(), chemin: base });
    }
  };
  descendre('server/api', '/api');
  // `[id]` devient un segment concret : c'est ce que verra le middleware à
  // l'exécution, et on interroge le VRAI `findMatchingGate` plutôt que d'en
  // réécrire un — un second moteur de correspondance divergerait du premier.
  return trouvees.map((r) => ({ ...r, chemin: r.chemin.replace(/\[[^\]]+\]/g, 'x') }));
}

/** La zone d'une route : `/api/<domaine>`. */
const zoneDe = (chemin: string) => chemin.split('/').slice(0, 3).join('/');

/** Les zones dont AU MOINS une porte exige une fonctionnalité payante. */
function zonesPayantes(): Set<string> {
  const zones = new Set<string>();
  for (const [motif, porte] of Object.entries(ROUTE_GATES)) {
    if (!porte.feature) continue;
    const chemin = motif.split(' ')[1];
    if (chemin) zones.add(zoneDe(chemin));
  }
  return zones;
}

/**
 * Écritures ouvertes par zone payante, hors DELETE.
 *
 * DELETE est exclu DÉLIBÉRÉMENT : effacer ses propres données doit rester
 * possible quel que soit le plan. Un compte qu'on empêche de faire le ménage
 * est un compte pris en otage — c'est l'inverse de la « porte de sortie ».
 */
function surfaceOuverte(): Record<string, string[]> {
  const payantes = zonesPayantes();
  const ouvertes: Record<string, string[]> = {};
  for (const { methode, chemin } of routesDEcriture()) {
    if (methode === 'DELETE') continue;
    const zone = zoneDe(chemin);
    if (!payantes.has(zone)) continue;
    if (findMatchingGate(methode, chemin)) continue;
    (ouvertes[zone] ??= []).push(`${methode} ${chemin}`);
  }
  for (const zone of Object.keys(ouvertes)) ouvertes[zone]!.sort();
  return ouvertes;
}

/**
 * L'état GELÉ au jour de la mesure. Chaque nombre est une dette nommée.
 *
 * Une valeur qui MONTE = une nouvelle route d'écriture ouverte dans une zone
 * payante : à gater, ou à inscrire ici avec sa raison.
 * Une valeur qui DESCEND = une porte a été posée : baisser le chiffre, sinon
 * le progrès se reperd (c'est le cliquet auto-serrant du corpus de Maya).
 */
const GELE: Record<string, number> = {
  '/api/balances': 1, // `ingest/*` — authentifié par token d'appareil, gate maison, documenté
  /**
   * 2 : `PUT /api/bons-livraison/x` et `POST /api/bons-livraison/x/email`.
   *
   * L'envoi d'un bon reste OUVERT pour la même raison que l'envoi d'une
   * facture — qui compte, lui, dans les 3 de `/api/finances` : la CRÉATION est
   * gatée (`POST /api/bons-livraison` → `bonsLivraison`), donc sans le plan il
   * n'y a aucun bon à envoyer. C'est la doctrine `MUTATION_EXISTANT` du
   * registre d'exemptions : on ne coupe pas à un compte l'accès aux documents
   * qu'il a déjà produits.
   *
   * En faire une fonctionnalité vendue à part serait une décision de
   * l'apiculteur sur le catalogue, pas un effet de bord d'un chantier.
   */
  '/api/bons-livraison': 2,
  '/api/campagnes': 7, // ⚠️ la zone la plus ouverte : tout sauf la création
  '/api/clients': 1,
  '/api/elevage': 3,
  '/api/finances': 3,
  '/api/hausses': 1,
  '/api/interventions': 5, // dont `POST /api/interventions`, gratuit à dessein
  '/api/membres': 4, // accepter/refuser une invitation : c'est le plan de L'INVITANT qui compte
  '/api/photos': 2,
  '/api/production': 1,
  '/api/profils': 2, // modifier son profil est gratuit ; seul le logo est gaté
  '/api/ruchers': 1,
  '/api/ruches': 3, // éditer une ruche est gratuit ; seuls les événements de reine sont gatés
  '/api/stocks': 1,
};

describe('la surface d’écriture ouverte dans les zones payantes', () => {
  it('le balayage voit bien des routes et des portes (garde-fou)', () => {
    /**
     * Sans ce cas, un chemin de dossier erroné rendrait zéro route, la surface
     * mesurée serait vide, et toutes les règles passeraient au vert sans avoir
     * rien mesuré. Ce dépôt s'est déjà fait prendre quatre fois par un
     * balayage vide.
     */
    expect(routesDEcriture().length, 'aucune route d’écriture trouvée').toBeGreaterThan(100);
    expect(zonesPayantes().size, 'aucune zone payante trouvée').toBeGreaterThan(8);
    expect(Object.keys(GELE).length, 'la table gelée est vide').toBeGreaterThan(8);
  });

  it('aucune route ne re-vérifie le plan dans son corps', () => {
    /**
     * ⚠️ C'EST CE QUI DONNE SON SENS À TOUT LE RESTE. Si des routes gataient
     * elles-mêmes, la table ne dirait pas toute la vérité et ce compteur
     * mesurerait un faux problème. On le CONSTATE au lieu de le supposer : le
     * middleware `04.subscription.ts` est la seule autorité de plan, et une
     * route absente de `ROUTE_GATES` passe — `if (!gate) return;`.
     *
     * Le jour où quelqu'un ajoute une vérification en route, ce cas rougira et
     * il faudra décider : ou bien la table redevient la seule source, ou bien
     * ce banc apprend à lire les deux.
     */
    const middleware = ['server/middleware/04.subscription.ts'];
    expect(middleware.length).toBe(1);
    const dansLesRoutes: string[] = [];
    const descendre = (dossier: string) => {
      for (const entree of readdirSync(dossier)) {
        const complet = join(dossier, entree);
        if (statSync(complet).isDirectory()) descendre(complet);
        else if (entree.endsWith('.ts')) {
          const code = readFileSync(complet, 'utf-8')
            .replace(/\/\*[\s\S]*?\*\//g, '')
            .split('\n')
            .filter((l: string) => !/^\s*(\/\/|\*)/.test(l))
            .join('\n');
          if (/assertFeature\(|requireFeature\(|assertPlan\(/.test(code))
            dansLesRoutes.push(complet);
        }
      }
    };
    descendre('server/api');
    expect(
      dansLesRoutes,
      'une route vérifie le plan elle-même : la table n’est plus la seule source',
    ).toEqual([]);
  });

  it.each(Object.keys(GELE))('%s — la surface ouverte ne grandit pas', (zone) => {
    const ouvertes = surfaceOuverte()[zone] ?? [];
    const attendu = GELE[zone]!;
    expect(
      ouvertes.length,
      `${zone} : ${ouvertes.length} écritures ouvertes au lieu de ${attendu}\n` +
        ouvertes.map((r) => `    · ${r}`).join('\n') +
        '\n  Si c’est voulu, inscris-le dans GELE avec sa raison. Si c’est un oubli, ' +
        'pose la porte dans `app/config/route-gates.ts`.',
    ).toBeLessThanOrEqual(attendu);
    // Cliquet auto-serrant : un progrès non enregistré se reperd.
    expect(
      ouvertes.length,
      `${zone} : la surface est descendue à ${ouvertes.length} — baisse le chiffre gelé ` +
        'à cette valeur, sinon la porte que tu viens de poser pourra être retirée sans bruit.',
    ).toBe(attendu);
  });

  it('aucune zone payante n’échappe au compteur', () => {
    /**
     * La parade au défaut « la liste qui rétrécit en silence » : si une zone
     * payante apparaît sans entrée gelée, elle serait mesurée par personne.
     */
    const nonSuivies = Object.keys(surfaceOuverte()).filter((z) => !(z in GELE));
    expect(
      nonSuivies,
      'ces zones payantes ont des écritures ouvertes et ne sont suivies par ' +
        'aucun chiffre gelé — ajoute-les à GELE',
    ).toEqual([]);
  });
});
