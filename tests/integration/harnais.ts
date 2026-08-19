// ═══════════════════════════════════════════════════════════════════════════
// HARNAIS DES TESTS DE HANDLERS — contre une VRAIE base Postgres.
//
// Ce que les bancs unitaires ne peuvent pas voir : le SQL réel, les clés
// étrangères, les contraintes d'unicité, les politiques RLS, et surtout le
// comportement des handlers qui écrivent. C'est là que vivent les défauts du
// 3 août (un quota qui compte différemment selon la porte d'entrée) et celui
// du rattrapage (des colonnes plates laissées nulles).
//
// ── POURQUOI PAS UN SIMPLE « ROLLBACK » AUTOUR DE CHAQUE TEST ──────────────
//
// C'est la technique habituelle, et elle NE MARCHE PAS ici. Les handlers
// n'acceptent pas de transaction injectée : ils appellent le singleton `db` et
// ouvrent LEUR PROPRE transaction (six sites rien que dans les écritures de
// Maya — `executerActionClient`, `executerPlan`, `annulerPlan`…). Une
// transaction ouverte par le test ne les englobe pas : leurs écritures
// COMMITENT pour de bon, hors de toute portée annulable.
//
// L'isolation ne peut donc pas venir de la transaction. Elle vient du
// LOCATAIRE : tout, dans ce schéma, est scopé par `user_id`. On travaille sur
// un compte éphémère, et on le supprime à la fin — les cascades emportent
// l'intégralité de ce qui a été créé. Rien ne traîne, rien ne touche aux
// autres comptes.
//
// ── DEUX RÉGIMES, ET LA RAISON DE LES SÉPARER ─────────────────────────────
//
//   LECTURE  — n'écrit rien. Sûr contre n'importe quelle base, production
//              comprise. Vérifie les invariants sur les données RÉELLES :
//              aucun compte gratuit au-dessus de son plafond, aucune visite
//              orpheline de ses colonnes plates, etc.
//
//   ÉCRITURE — crée un compte éphémère et exécute les handlers pour de vrai.
//              Exige une base explicitement autorisée, via la MÊME clé que
//              `scripts/garde-base.ts` : le dépôt a déjà tranché la question,
//              on ne réinvente pas une seconde convention à côté.
// ═══════════════════════════════════════════════════════════════════════════

import { randomUUID } from 'node:crypto';
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import { eq, sql } from 'drizzle-orm';
import * as schema from '~~/server/database/schema';
import { profils } from '~~/server/database/schema';
import { analyserCible, type CibleBase } from '~~/scripts/garde-base';
import type { Plan } from '~~/app/config/plans';

/** Clé d'autorisation d'écriture — identique à celle de `scripts/garde-base.ts`. */
const CLE_AUTORISATION = 'APIGO_AUTORISE_ECRITURE_BASE';

/**
 * `DATABASE_URL_TEST` d'abord : elle permet de viser une base jetable sans
 * toucher au `.env` du poste, qui porte la production.
 */
export function urlBase(): string | null {
  return process.env.DATABASE_URL_TEST || process.env.DATABASE_URL || null;
}

export function cible(): CibleBase | null {
  const url = urlBase();
  return url ? analyserCible(url) : null;
}

/** Description SANS identifiants — pour les journaux et les messages de saut. */
export function decrireCible(): string {
  const c = cible();
  if (!c) return 'aucune base configurée';
  return `${c.base} @ ${c.hote}${c.locale ? ' (locale)' : ''}`;
}

let _client: ReturnType<typeof postgres> | undefined;
let _db: ReturnType<typeof drizzle<typeof schema>> | undefined;

export function baseDeTest() {
  if (_db) return _db;
  const url = urlBase();
  if (!url) throw new Error('Aucune base : renseignez DATABASE_URL_TEST ou DATABASE_URL.');
  // `max: 2` — un harnais ne doit pas consommer le pool d'une base partagée.
  _client = postgres(url, { max: 2, prepare: false });
  _db = drizzle(_client, { schema });
  return _db;
}

export async function fermerBase(): Promise<void> {
  await _client?.end({ timeout: 5 });
  _client = undefined;
  _db = undefined;
}

/** Y a-t-il une base à interroger ? Sert à sauter proprement, pas à échouer. */
export function baseDisponible(): boolean {
  return urlBase() !== null;
}

/**
 * L'écriture est-elle autorisée sur cette cible ?
 *
 * Une base LOCALE est jetable par nature. Toute base distante exige un geste
 * conscient — la même variable que `db:push` et `db:seed`. On ne suppose
 * jamais qu'une base distante est un bac à sable parce que son nom le
 * laisserait croire.
 */
export function ecritureAutorisee(): { ok: boolean; raison: string } {
  const c = cible();
  if (!c) return { ok: false, raison: 'aucune base configurée' };
  if (c.locale) return { ok: true, raison: 'base locale' };
  if (process.env[CLE_AUTORISATION] === 'oui') {
    return { ok: true, raison: `base distante explicitement autorisée (${CLE_AUTORISATION}=oui)` };
  }
  return {
    ok: false,
    raison:
      `écriture refusée sur ${c.base} @ ${c.hote} — base distante sans autorisation. ` +
      `Relancez avec ${CLE_AUTORISATION}=oui si c'est bien voulu.`,
  };
}

export interface CompteEphemere {
  id: string;
  email: string;
  plan: Plan;
}

/**
 * Crée un compte de test isolé, exécute le scénario, puis SUPPRIME le compte.
 *
 * La suppression est le vrai mécanisme d'isolation : les clés étrangères sont
 * en cascade sur `user_id`, donc effacer le profil emporte ruchers, ruches,
 * interventions, clients, stocks — tout ce que le scénario a pu créer, y
 * compris ce qu'un handler a écrit dans sa propre transaction.
 *
 * Le `finally` est non négociable : un test qui échoue doit nettoyer autant
 * qu'un test qui passe, sinon la base se remplit de comptes fantômes.
 */
export async function avecCompteEphemere<T>(
  plan: Plan,
  scenario: (compte: CompteEphemere) => Promise<T>,
): Promise<T> {
  const garde = ecritureAutorisee();
  if (!garde.ok) throw new Error(`avecCompteEphemere : ${garde.raison}`);

  const db = baseDeTest();
  const id = randomUUID();
  // Préfixe reconnaissable ET domaine réservé aux tests (RFC 2606) : si un
  // compte survit malgré tout à un crash, on sait au premier regard ce que
  // c'est et on peut le balayer sans hésiter.
  const email = `harnais+${id}@example.invalid`;

  await db.insert(profils).values({ id, email, plan, nom: 'Harnais', prenom: 'Test' });

  try {
    return await scenario({ id, email, plan });
  } finally {
    await db.delete(profils).where(eq(profils.id, id));
  }
}

/**
 * Balaie les comptes de harnais laissés par un crash antérieur. À appeler en
 * ouverture de campagne : un compte oublié fausserait les invariants de
 * lecture (« un compte Découverte avec 40 ruches » qui serait le nôtre).
 */
export async function balayerComptesOrphelins(): Promise<number> {
  if (!ecritureAutorisee().ok) return 0;
  const db = baseDeTest();
  // SUR L'E-MAIL, jamais sur le nom.
  //
  // La première version filtrait `nom = 'Harnais'` — un champ que n'importe
  // quel apiculteur peut saisir. Un client nommé « Harnais », ou dont le nom
  // aurait été mis à cette valeur par erreur, aurait été SUPPRIMÉ avec tout
  // son cheptel en cascade. Un utilitaire de ménage n'a pas le droit de se
  // tromper de cible.
  //
  // Le motif d'e-mail est, lui, réservé : `example.invalid` est un domaine
  // que la RFC 2606 garantit inexistant, et le préfixe est posé par ce
  // fichier seul. Aucun compte réel ne peut y correspondre.
  const supprimes = await db
    .delete(profils)
    .where(sql`${profils.email} LIKE 'harnais+%@example.invalid'`)
    .returning({ id: profils.id });
  return supprimes.length;
}
