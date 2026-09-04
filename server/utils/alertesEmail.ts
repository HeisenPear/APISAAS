import { sql } from 'drizzle-orm';
import { sendAlerteUrgenteEmail } from '~~/server/utils/email';
import { estUrgent, peutRecevoir } from '~~/server/utils/alertesGating';
import { emailUrgentActif } from '~~/server/utils/alertesCategories';
import { lienDesinscriptionEmail } from '~~/server/utils/notifToken';
import type { Plan } from '~~/app/config/plans';

// ═══════════════════════════════════════════════════════════════════════════
// EMAILS D'URGENCE — canal de secours garanti (en PLUS du push).
// N'envoie QUE pour les alertes NOUVELLES du run (mêmes données que le push),
// filtrées : urgent + diffusable au plan + préférence email active. Anti-doublon
// par (user, type) via claim atomique JSONB (fenêtre 12 h) — le pattern de
// welcomeEmail.ts : deux chemins concurrents (cron 8 h, dashboard, cron urgences)
// ne peuvent pas envoyer deux fois le même type dans la fenêtre.
// ═══════════════════════════════════════════════════════════════════════════

export interface AlerteEmailCandidate {
  type: string;
  titre?: string | null;
  message?: string | null;
  actionUrl?: string | null;
}

/**
 * Envoie les emails d'urgence pour un utilisateur. `brut` = préférences brutes
 * (pushNotifPrefs, non normalisées — on y lit `email_urgent`). Renvoie le nombre
 * d'emails effectivement partis. Best-effort : n'émet jamais d'exception.
 */
export async function envoyerEmailsUrgents(
  userId: string,
  plan: Plan,
  brut: Record<string, unknown> | null | undefined,
  nouvelles: AlerteEmailCandidate[],
): Promise<number> {
  if (!emailUrgentActif(brut)) return 0;

  // Une alerte représentative par type urgent diffusable (dédup intra-run).
  const parType = new Map<string, AlerteEmailCandidate>();
  for (const a of nouvelles) {
    if (estUrgent(a.type) && peutRecevoir(plan, a.type) && !parType.has(a.type)) {
      parType.set(a.type, a);
    }
  }
  if (parType.size === 0) return 0;

  let envoyes = 0;
  for (const [type, a] of parType) {
    // Claim atomique : ne renvoie une ligne que si aucun email de ce type n'a
    // été envoyé depuis > 12 h. Le marqueur est posé AVANT l'envoi (on préfère
    // un email manqué à un doublon).
    const rows = (await db
      .execute(
        sql`
        UPDATE profils
        SET preferences = jsonb_set(
              coalesce(preferences, '{}'::jsonb),
              array['lastEmailUrgent', ${type}]::text[],
              to_jsonb(now()::text),
              true
            )
        WHERE id = ${userId}
          AND (
            preferences #>> array['lastEmailUrgent', ${type}]::text[] IS NULL
            OR (preferences #>> array['lastEmailUrgent', ${type}]::text[])::timestamptz
               < now() - interval '12 hours'
          )
        RETURNING email, prenom
      `,
      )
      .catch(() => [])) as unknown as Array<{ email: string; prenom: string | null }>;

    const u = rows[0];
    if (!u?.email) continue;

    const envoi = await sendAlerteUrgenteEmail({
      to: u.email,
      prenom: u.prenom || 'apiculteur·rice',
      type,
      titre: a.titre || 'Alerte APIGO',
      message: a.message || '',
      actionUrl: a.actionUrl || '/alertes',
      unsubscribeUrl: lienDesinscriptionEmail(userId),
    });
    /**
     * ⚠️ CE COMPTEUR NE COMPTAIT RIEN. `sendAlerteUrgenteEmail` rendait `true`
     * inconditionnellement dès que la clé d'API existait — le SDK Resend ne
     * lève jamais d'exception, il rend `{ data, error }`. « 4 emails d'urgence
     * envoyés » pouvait donc désigner quatre refus. Sur des alertes de secours
     * (météo dangereuse, sanitaire critique), c'est exactement le chiffre qu'on
     * ne veut pas voir mentir.
     *
     * Le marqueur anti-doublon reste posé AVANT l'envoi et n'est PAS relevé en
     * cas d'échec : c'est le choix d'origine, assumé — mieux vaut un email
     * d'urgence manqué qu'un doublon toutes les douze heures. Le refus part au
     * journal pour qu'il soit au moins visible.
     */
    if (envoi.ok) envoyes++;
    else console.error(`[alerte:email] ${type} refusée — ${envoi.code} : ${envoi.technique}`);
  }
  return envoyes;
}
