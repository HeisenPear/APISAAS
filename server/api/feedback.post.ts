import { z } from 'zod';
import { sql } from 'drizzle-orm';

const feedbackSchema = z.object({
  profilApicole: z.enum(['loisir', 'pluri-actif', 'professionnel', 'association']),
  nombreRuches: z.number().int().min(0).max(9999).optional(),
  apprecie: z.string().max(5000).optional(),
  frustre: z.string().max(5000).optional(),
  nps: z.number().int().min(1).max(10),
  emailContact: z.string().email().optional().or(z.literal('')).or(z.undefined()),
  pageSource: z.string().max(200).optional(),
});

export default defineEventHandler(async (event) => {
  let userId: string | null = null;
  try {
    const user = await requireAuth(event);
    userId = user.id;
  } catch {
    // Feedback accepté même sans session
  }

  const body = await readValidatedBody(event, feedbackSchema.parse);
  const userAgent = getHeader(event, 'user-agent') ?? null;

  await db.execute(sql`
    INSERT INTO feedbacks (user_id, profil_apicole, nombre_ruches, apprecie, frustre, nps, email_contact, page_source, user_agent)
    VALUES (
      ${userId},
      ${body.profilApicole},
      ${body.nombreRuches ?? null},
      ${body.apprecie ?? null},
      ${body.frustre ?? null},
      ${body.nps},
      ${body.emailContact || null},
      ${body.pageSource ?? null},
      ${userAgent}
    )
  `);

  return { success: true };
});
