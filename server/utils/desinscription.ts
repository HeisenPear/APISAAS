import { sql } from 'drizzle-orm';
import { verifierDesinscription } from '~~/server/utils/notifToken';

// ═══════════════════════════════════════════════════════════════════════════
// Désinscription email par CATÉGORIE (RGPD) — logique partagée GET/POST.
//
// Le GET rend une page de confirmation (lien cliqué dans un mail) ; le POST
// sert le « one-click » RFC 8058 que Gmail et Yahoo attendent des expéditeurs
// de masse. Les deux appliquent exactement la même coupure, d'où ce module.
// ═══════════════════════════════════════════════════════════════════════════

export type CategorieDesinscription = 'urgent' | 'marketing';

interface Categorie {
  cle: string;
  libelle: string;
  /** Ce qui reste actif après la coupure — rassure sans mentir. */
  reste: string;
}

const CATEGORIES: Record<CategorieDesinscription, Categorie> = {
  urgent: {
    cle: 'email_urgent',
    libelle: "emails d'alerte urgente",
    reste: 'Les notifications push (si activées) restent actives.',
  },
  marketing: {
    cle: 'email_marketing',
    libelle: "emails d'actualité et de conseils",
    reste:
      'Les emails liés à votre compte (facture, sécurité, alertes sanitaires) continuent de vous parvenir : ils ne sont pas commerciaux.',
  },
};

/**
 * Résout la catégorie demandée. L'absence de paramètre vaut `urgent` : les
 * liens des emails d'alerte DÉJÀ partis en boîte n'en portent pas, et doivent
 * continuer de fonctionner — un lien de désinscription qui casse est une
 * infraction, pas un détail.
 */
export function resoudreCategorie(brut: unknown): CategorieDesinscription {
  return brut === 'marketing' ? 'marketing' : 'urgent';
}

export function libelleCategorie(cat: CategorieDesinscription): Categorie {
  return CATEGORIES[cat];
}

/**
 * Applique la désinscription. Renvoie `false` si le token est invalide —
 * l'appelant décide alors quoi rendre (page d'erreur ou 200 silencieux).
 */
export async function appliquerDesinscription(
  userId: string,
  token: string,
  cat: CategorieDesinscription,
): Promise<boolean> {
  if (!verifierDesinscription(userId, token)) return false;

  const cle = CATEGORIES[cat].cle;
  await db
    .execute(
      sql`
      UPDATE profils
      SET push_notif_prefs = coalesce(push_notif_prefs, '{}'::jsonb)
            || jsonb_build_object(${cle}::text, false)
      WHERE id = ${userId}
    `,
    )
    .catch(() => {});

  return true;
}
