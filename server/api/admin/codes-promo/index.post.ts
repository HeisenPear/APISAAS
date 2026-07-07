import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { codesPromo } from '~~/server/database/schema';
import { useStripe } from '~~/server/utils/stripe';

const schema = z.object({
  code: z
    .string()
    .trim()
    .min(3)
    .max(40)
    .regex(/^[A-Za-z0-9_-]+$/, 'Lettres, chiffres, tiret ou underscore uniquement'),
  sponsorNom: z.string().trim().min(1).max(120),
  typeSponsoring: z.enum(['ambassadeur', 'syndicat', 'magasin']),
  reductionPourcent: z.number().int().min(1).max(100),
  dureeMois: z.number().int().min(1).max(36),
  maxRedemptions: z.number().int().min(1).max(100000).optional(),
  notes: z.string().trim().max(500).optional(),
});

export default defineEventHandler(async (event) => {
  await requireAdmin(event);
  const body = await readValidatedBody(event, schema.parse);
  const stripe = useStripe();
  const code = body.code.toUpperCase();

  const [existing] = await db
    .select({ id: codesPromo.id })
    .from(codesPromo)
    .where(eq(codesPromo.code, code))
    .limit(1);
  if (existing) throw createError({ statusCode: 409, message: 'Ce code existe déjà.' });

  // 1) Coupon Stripe : −X % pendant N mois
  const coupon = await stripe.coupons.create({
    percent_off: body.reductionPourcent,
    duration: 'repeating',
    duration_in_months: body.dureeMois,
    name: `${body.sponsorNom} · -${body.reductionPourcent}%`,
    metadata: { sponsor: body.sponsorNom, type: body.typeSponsoring },
  });

  // 2) Promotion code Stripe = le code saisi par le client au paiement
  let promo;
  try {
    promo = await stripe.promotionCodes.create({
      coupon: coupon.id,
      code,
      ...(body.maxRedemptions ? { max_redemptions: body.maxRedemptions } : {}),
      metadata: { sponsor: body.sponsorNom, type: body.typeSponsoring },
    });
  } catch {
    await stripe.coupons.del(coupon.id).catch(() => {});
    throw createError({ statusCode: 409, message: 'Ce code est déjà utilisé sur Stripe.' });
  }

  try {
    const [created] = await db
      .insert(codesPromo)
      .values({
        code,
        sponsorNom: body.sponsorNom,
        typeSponsoring: body.typeSponsoring,
        reductionPourcent: body.reductionPourcent,
        dureeMois: body.dureeMois,
        stripeCouponId: coupon.id,
        stripePromotionCodeId: promo.id,
        maxRedemptions: body.maxRedemptions ?? null,
        notes: body.notes ?? null,
      })
      .returning();
    return { data: created };
  } catch {
    // Rollback Stripe : pas de coupon/code orphelin si l'enregistrement DB échoue
    await stripe.promotionCodes.update(promo.id, { active: false }).catch(() => {});
    await stripe.coupons.del(coupon.id).catch(() => {});
    throw createError({
      statusCode: 500,
      message: "Échec de l'enregistrement du code — aucune ressource Stripe conservée. Réessayez.",
    });
  }
});
