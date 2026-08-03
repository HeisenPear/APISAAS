import { z } from 'zod';
import {
  CAMPAGNES,
  compterCibles,
  envoyerCampagne,
  reclamerDestinataires,
} from '~~/server/utils/campagnes';

// ═══════════════════════════════════════════════════════════════════════════
// POST /api/admin/campagnes/:slug — envoie UN lot d'une campagne. Admin only.
//
// Un lot par appel (100 max) : Vercel Hobby coupe à ~10 s. `restants` dit
// combien il en reste — on rappelle la route jusqu'à ce qu'il tombe à zéro.
// L'idempotence étant en base, un appel de trop ne réexpédie rien.
// ═══════════════════════════════════════════════════════════════════════════

const bodySchema = z.object({
  /** Compte les destinataires sans rien réclamer ni envoyer. */
  dryRun: z.boolean().default(false),
  limite: z.number().int().min(1).max(100).default(100),
});

export default defineEventHandler(async (event) => {
  await requireAdmin(event);

  const modele = CAMPAGNES[getRouterParam(event, 'slug') ?? ''];
  if (!modele) return notFound('Campagne inconnue');

  // `readBody` RÉSOUT sur undefined quand le corps est vide (le .catch ne se
  // déclenche pas) — d'où le `?? {}` avant parse.
  const body = (await readBody(event).catch(() => undefined)) ?? {};
  const { dryRun, limite } = bodySchema.parse(body);

  if (dryRun) {
    return {
      data: { slug: modele.slug, sujet: modele.sujet, restants: await compterCibles(modele) },
    };
  }

  const destinataires = await reclamerDestinataires(modele, limite);
  const { envoyes, echecs } = await envoyerCampagne(modele, destinataires);

  return {
    data: {
      slug: modele.slug,
      reclames: destinataires.length,
      envoyes,
      echecs,
      restants: await compterCibles(modele),
    },
  };
});
