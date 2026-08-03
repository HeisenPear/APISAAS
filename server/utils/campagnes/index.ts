import { sql } from 'drizzle-orm';
import { sendLotCampagne } from '~~/server/utils/email';
import { lienDesinscriptionEmail } from '~~/server/utils/notifToken';
import { rendreCompteVide } from './a-compte-vide';
import { rendreUneRuche } from './b-une-ruche';
import { rendreCheptelReel } from './c-cheptel-reel';
import type { DestinataireCampagne, ModeleCampagne } from './types';

// Pas de ré-export des types ici : Nitro auto-importe déjà `./types`, et le
// doublon ferait diverger deux chemins d'import pour un même symbole.

/**
 * Cheptel réellement saisi, en sous-requête corrélée sur la ligne `profils`
 * courante. On compte les ruches SANS filtre de statut : quelqu'un qui vient
 * de perdre son cheptel reste un apiculteur équipé, pas un compte vide.
 *
 * ⚠️ Segmenter sur le PLAFOND DU PLAN plutôt que sur ce compte serait faux :
 * le dry-run du 03/08 a trouvé des comptes Découverte (plafond : 1 ruche) à
 * 12 et 80 colonies. Le plan dit ce qui est ouvert, pas ce qui est là.
 */
export const nbRuches = sql`(SELECT count(*) FROM ruches r WHERE r.user_id = profils.id)`;

/**
 * Registre des campagnes. Le slug est la clé d'idempotence stockée en base —
 * le renommer réexpédierait à tout le monde.
 *
 * ⚠️ Les trois relances de fin de récoltes PARTITIONNENT le plan Découverte
 * selon le cheptel réellement saisi : 0 ruche, exactement 1, puis 2 et plus.
 * Aucun apiculteur ne peut donc en recevoir deux — c'est vérifié par le banc
 * `segmentsExclusifs`, pas seulement par relecture.
 */
export const CAMPAGNES: Record<string, ModeleCampagne> = {
  'relance-2026-compte-vide': {
    slug: 'relance-2026-compte-vide',
    // Ni prix ni promesse : le seul but est d'obtenir une RÉPONSE de quelqu'un
    // qui n'a jamais rien saisi. Un objet humble ouvre mieux qu'une relance.
    sujet: 'On a dû rater quelque chose',
    plans: ['decouverte'],
    segment: sql`${nbRuches} = 0`,
    segmentLibelle: 'compte ouvert, aucune ruche saisie',
    rendu: rendreCompteVide,
  },

  'relance-2026-une-ruche': {
    slug: 'relance-2026-une-ruche',
    // L'objet fait lire MAINTENANT tout en ancrant le moment d'après. Un objet
    // qui reporte la lecture (« à lire fin août ») parie sur un retour qui,
    // le plus souvent, n'arrive jamais.
    sujet: 'À lire maintenant pour être prêt dès la fin des récoltes',
    plans: ['decouverte'],
    segment: sql`${nbRuches} = 1`,
    segmentLibelle: 'exactement 1 ruche',
    rendu: rendreUneRuche,
  },

  'relance-2026-cheptel-reel': {
    slug: 'relance-2026-cheptel-reel',
    sujet: 'Vos deux mois de Pro n’ont jamais été utilisés',
    plans: ['decouverte'],
    // `NOT trial_used` n'est PAS un raffinement de ciblage : l'objet et le
    // corps affirment que l'essai n'a jamais servi. Retirer cette condition
    // rendrait le mail mensonger pour une partie des destinataires.
    segment: sql`${nbRuches} >= 2 AND NOT coalesce(trial_used, false)`,
    segmentLibelle: 'cheptel réel (2+ ruches), essai jamais utilisé',
    rendu: rendreCheptelReel,
  },
};

/**
 * Conditions d'éligibilité, partagées par le comptage et la réclamation —
 * factorisées pour qu'un compteur ne puisse JAMAIS annoncer un volume que
 * l'envoi ne servira pas (ou l'inverse).
 *
 * `coalesce(..., 'true') <> 'false'` : l'absence de préférence vaut opt-IN.
 * Ces emails ne sont pas des prospections à froid — ce sont des comptes
 * existants —, mais tout `false` explicite est définitivement respecté.
 */
function conditionsCible(modele: ModeleCampagne) {
  const plans = sql.join(
    modele.plans.map((p) => sql`${p}`),
    sql`, `,
  );
  const segment = modele.segment ? sql` AND (${modele.segment})` : sql``;
  return sql`
    plan::text IN (${plans})
    AND email IS NOT NULL AND email <> ''
    AND coalesce(push_notif_prefs->>'email_marketing', 'true') <> 'false'
    AND (preferences->'campagnes'->>${modele.slug}) IS NULL${segment}
  `;
}

/** Nombre de destinataires restant à servir (pour le dry-run et le reliquat). */
export async function compterCibles(modele: ModeleCampagne): Promise<number> {
  const rows = (await db.execute(sql`
    SELECT count(*)::int AS n FROM profils WHERE ${conditionsCible(modele)}
  `)) as unknown as { n: number }[];
  return rows[0]?.n ?? 0;
}

/**
 * Réclame atomiquement un lot de destinataires.
 *
 * Le marqueur est posé PAR la requête qui sélectionne : deux appels
 * concurrents (deux onglets admin, un retry Vercel) ne peuvent pas servir le
 * même apiculteur deux fois. `FOR UPDATE SKIP LOCKED` fait que le second
 * appel prend les suivants au lieu d'attendre.
 *
 * Marquer AVANT d'envoyer, c'est préférer un mail jamais parti à un doublon —
 * même arbitrage que l'email de bienvenue. Les échecs réels sont ensuite
 * rendus par `libererDestinataires`, ce qui referme la fenêtre.
 */
export async function reclamerDestinataires(
  modele: ModeleCampagne,
  limite: number,
): Promise<DestinataireCampagne[]> {
  return (await db.execute(sql`
    WITH cibles AS (
      SELECT id FROM profils
      WHERE ${conditionsCible(modele)}
      ORDER BY created_at
      LIMIT ${limite}
      FOR UPDATE SKIP LOCKED
    )
    UPDATE profils p
    SET preferences = coalesce(p.preferences, '{}'::jsonb) || jsonb_build_object(
          'campagnes',
          coalesce(p.preferences->'campagnes', '{}'::jsonb)
            || jsonb_build_object(${modele.slug}::text, now()::text)
        )
    FROM cibles c
    WHERE p.id = c.id
    RETURNING p.id, p.email, p.prenom
  `)) as unknown as DestinataireCampagne[];
}

/**
 * Retire le marqueur des destinataires dont l'envoi a échoué, pour qu'un
 * prochain appel les reprenne. Sans ça, une adresse rejetée par Resend serait
 * marquée « servie » et l'apiculteur ne recevrait jamais rien.
 */
export async function libererDestinataires(modele: ModeleCampagne, ids: string[]): Promise<void> {
  if (!ids.length) return;
  const liste = sql.join(
    ids.map((id) => sql`${id}`),
    sql`, `,
  );
  await db.execute(sql`
    UPDATE profils
    SET preferences = jsonb_set(
          preferences,
          '{campagnes}',
          (preferences->'campagnes') - ${modele.slug}::text
        )
    WHERE id::text IN (${liste})
      AND preferences->'campagnes' IS NOT NULL
  `);
}

/**
 * Envoie le lot et relibère les échecs. Renvoie de quoi piloter l'envoi
 * depuis l'admin sans avoir à deviner ce qui s'est passé.
 */
export async function envoyerCampagne(
  modele: ModeleCampagne,
  destinataires: DestinataireCampagne[],
): Promise<{ envoyes: number; echecs: number }> {
  if (!destinataires.length) return { envoyes: 0, echecs: 0 };

  const { envoyes, echecs } = await sendLotCampagne(
    destinataires.map((d) => {
      const lien = lienDesinscriptionEmail(d.id, 'marketing');
      return {
        to: d.email,
        subject: modele.sujet,
        html: modele.rendu(d, lien),
        unsubscribeUrl: lien,
      };
    }),
  );

  const idsEnEchec = echecs
    .map((e) => destinataires[e.index]?.id)
    .filter((id): id is string => !!id);

  if (idsEnEchec.length) {
    console.error('[campagnes] envois en échec, destinataires relibérés', {
      slug: modele.slug,
      echecs: echecs.map((e) => e.message),
    });
    await libererDestinataires(modele, idsEnEchec);
  }

  return { envoyes, echecs: idsEnEchec.length };
}
