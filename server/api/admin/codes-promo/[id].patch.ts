import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { codesPromo } from '~~/server/database/schema';
import { useStripe } from '~~/server/utils/stripe';

const schema = z.object({ actif: z.boolean() });

/** Active / désactive un code promo (et son promotion code Stripe). */
export default defineEventHandler(async (event) => {
  await requireAdmin(event);
  const id = getRouterParam(event, 'id');
  if (!id) throw createError({ statusCode: 400, message: 'ID manquant' });
  const body = await readValidatedBody(event, schema.parse);

  const [row] = await db.select().from(codesPromo).where(eq(codesPromo.id, id)).limit(1);
  if (!row) throw createError({ statusCode: 404, message: 'Code introuvable' });

  // Le coupon reste ; on (dés)active seulement le promotion code côté Stripe.
  await useStripe().promotionCodes.update(row.stripePromotionCodeId, { active: body.actif });

  const [updated] = await db
    .update(codesPromo)
    .set({ actif: body.actif, updatedAt: new Date() })
    .where(eq(codesPromo.id, id))
    .returning();

  return { data: updated };
});
