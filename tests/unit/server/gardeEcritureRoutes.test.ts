import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

// ═══════════════════════════════════════════════════════════════════════════
// TOUTE ROUTE QUI ÉCRIT DIT QUI A LE DROIT D'ÉCRIRE.
//
// L'isolation entre exploitations de cette application ne repose PAS sur la
// RLS : `db.ts` ouvre une connexion service-role qui la contourne. Elle repose
// sur deux choses écrites à la main dans chaque route — le scoping `ownerId`,
// et le contrôle de RÔLE. Il n'existait aucune règle pour la seconde.
//
// ⚠️ LE DÉFAUT QUI A PRODUIT CE BANC. `server/api/ia/fenetres-alerte.post.ts`
// écrit une alerte dans l'espace du PROPRIÉTAIRE et ne demandait que d'y
// appartenir : un membre en `lecture` — dont le contrat dit noir sur blanc
// « lecture = rien » — pouvait poser des alertes chez quelqu'un d'autre. Sa
// jumelle `copilote.post.ts`, elle, portait le contrôle et le documentait.
// Deux routes d'écriture voisines, une seule gardée.
//
// La règle est structurelle : une route d'écriture appelle `assertCanWrite`,
// ou `requireAdmin`, ou figure ci-dessous avec sa RAISON. Une 157ᵉ route
// écrite demain tombera dessus au lieu de rejouer le défaut.
// ═══════════════════════════════════════════════════════════════════════════

/** Le code d'un fichier, commentaires blanchis. */
function codeSeul(chemin: string): string {
  /**
   * Ce banc et les routes corrigées RACONTENT le défaut : leurs commentaires
   * contiennent « assertCanWrite ». Sans blanchiment, une route non gardée qui
   * se contenterait d'en PARLER passerait pour gardée — septième fois que ce
   * dépôt tomberait dans ce piège.
   */
  return readFileSync(chemin, 'utf-8')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .split('\n')
    .filter((l) => !/^\s*(\/\/|\*)/.test(l))
    .join('\n');
}

/** Les routes d'écriture réelles, lues sur le disque. */
function routesDEcriture(): string[] {
  const trouvees: string[] = [];
  const descendre = (dossier: string) => {
    for (const entree of readdirSync(dossier)) {
      const complet = join(dossier, entree);
      if (statSync(complet).isDirectory()) descendre(complet);
      else if (/\.(post|put|patch|delete)\.ts$/.test(entree)) trouvees.push(complet);
    }
  };
  descendre('server/api');
  return trouvees.sort();
}

/**
 * Les routes qui écrivent SANS `assertCanWrite`, chacune avec sa raison.
 *
 * ⚠️ LA RAISON EST OBLIGATOIRE ET VÉRIFIÉE. Chaque entrée a été lue avant
 * d'être inscrite ; aucune n'est là « en attendant ». Le préfixe couvre un
 * dossier entier quand la raison vaut pour tout le dossier — et le banc exige
 * alors que chaque fichier du dossier porte bien la garde annoncée.
 */
const DISPENSES: { prefixe: string; motif: string; garde?: RegExp }[] = [
  {
    prefixe: 'server/api/admin/',
    motif: 'espace d’administration : la garde est `requireAdmin`, pas le rôle d’espace',
    garde: /requireAdmin\(/,
  },
  {
    prefixe: 'server/api/public/',
    motif: 'routes publiques par construction (démo, commande invitée par jeton)',
  },
  {
    prefixe: 'server/api/stripe/',
    motif: 'facturation personnelle : un membre gère SON abonnement, pas celui de l’espace',
  },
  {
    prefixe: 'server/api/push/',
    motif: 'abonnement aux notifications de SON propre appareil',
  },
  {
    prefixe: 'server/api/frelon/',
    motif: 'signalements communautaires : la donnée appartient à son auteur, pas à un espace',
  },
  {
    prefixe: 'server/api/floraisons/observations/',
    motif: 'observations partagées avec la communauté, écrites sous `auteurId`, anti-flood maison',
  },
  {
    prefixe: 'server/api/membres/',
    motif:
      'gestion des membres : gardée par `ownerId` (inviter, modifier, retirer) ou action ' +
      'propre de l’invité (accepter, refuser) — le rôle d’espace n’a pas de sens ici',
  },
  {
    prefixe: 'server/api/calendrier/tokens',
    motif: 'jeton de calendrier personnel, scopé sur l’utilisateur authentifié',
  },
  {
    prefixe: 'server/api/balances/ingest/',
    motif:
      'authentifiée par un jeton d’APPAREIL, pas par une session : elle vérifie elle-même ' +
      'le plan du propriétaire de la balance (déjà documenté dans `route-gates.ts`)',
  },
  {
    prefixe: 'server/api/profils/',
    motif: 'écrit sur SON propre profil (`profils.id = user.id`), jamais sur celui de l’espace',
  },
  {
    prefixe: 'server/api/auth/',
    motif: 'inscription : il n’y a pas encore d’espace de travail à garder',
  },
  {
    prefixe: 'server/api/alertes/',
    motif:
      'préférences de notification personnelles, et régénération IDEMPOTENTE des alertes de ' +
      'l’espace — un recalcul, pas une donnée saisie ; le refuser casserait le tableau de ' +
      'bord d’un membre en lecture',
  },
  {
    prefixe: 'server/api/ia/copilote.post.ts',
    motif:
      'Maya porte le contrôle sur l’ACTION et non sur la route (`rolePeutEcrire(user.role, ' +
      'domaine)`), parce qu’un même appel peut être une lecture ou une écriture',
    garde: /rolePeutEcrire\(/,
  },
  {
    prefixe: 'server/api/feedback.post.ts',
    motif: 'retour utilisateur, accepté même sans session',
  },
  {
    prefixe: 'server/api/track.post.ts',
    motif: 'télémétrie produit, aucune donnée d’exploitation',
  },
  {
    prefixe: 'server/api/security/csp-report.post.ts',
    motif: 'rapport de violation CSP envoyé par le NAVIGATEUR : aucune session',
  },
  {
    prefixe: 'server/api/notif/unsubscribe-email.post.ts',
    motif: 'désabonnement par jeton depuis un e-mail : pas de session, c’est le but',
  },
];

const dispensePour = (chemin: string) => DISPENSES.find((d) => chemin.startsWith(d.prefixe));

describe('toute route d’écriture nomme qui a le droit d’écrire', () => {
  const routes = routesDEcriture();

  it('le balayage voit bien des routes (garde-fou)', () => {
    /**
     * Sans ce cas, un chemin erroné rendrait zéro route et la règle serait
     * « conforme » sans avoir rien mesuré. Ce dépôt s'est déjà fait prendre
     * quatre fois par un balayage vide.
     */
    expect(routes.length, 'aucune route d’écriture trouvée').toBeGreaterThan(140);
    expect(DISPENSES.length, 'la table des dispenses est vide').toBeGreaterThan(10);
  });

  it('chaque dispense porte un motif écrit', () => {
    /**
     * Une dispense sans raison est un oubli déguisé en décision. On exige un
     * motif assez long pour être une phrase, pas un mot.
     */
    for (const d of DISPENSES) {
      expect(
        d.motif.length,
        `${d.prefixe} : motif trop court pour être une raison`,
      ).toBeGreaterThan(30);
      expect(
        routes.some((r) => r.startsWith(d.prefixe)),
        `dispense obsolète : plus aucune route d’écriture sous ${d.prefixe}`,
      ).toBe(true);
    }
  });

  it('aucune route d’écriture n’est sans garde ni dispense', () => {
    const nues = routes.filter((r) => !/assertCanWrite\(/.test(codeSeul(r)) && !dispensePour(r));
    expect(
      nues,
      'ces routes ÉCRIVENT sans contrôle de rôle : un membre en `lecture` y passerait. ' +
        'Ajoute `assertCanWrite(event, domaine)`, ou inscris-les dans DISPENSES avec leur raison.',
    ).toEqual([]);
  });

  it('les dispenses qui annoncent une garde la portent vraiment', () => {
    /**
     * ⚠️ SANS CE CAS, LA TABLE SERAIT DÉCLARATIVE. Dire « les routes admin sont
     * gardées par requireAdmin » ne les garde pas : on le CONSTATE, fichier par
     * fichier. C'est ce qui transforme une dispense en fait vérifié.
     */
    const defaillantes: string[] = [];
    for (const d of DISPENSES) {
      if (!d.garde) continue;
      for (const r of routes.filter((r) => r.startsWith(d.prefixe))) {
        if (!d.garde.test(codeSeul(r))) defaillantes.push(`${r} (attendu : ${d.garde})`);
      }
    }
    expect(defaillantes, 'dispense accordée sur une garde qui n’est pas là').toEqual([]);
  });
});
