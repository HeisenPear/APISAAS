import { eq } from 'drizzle-orm';
import { profils } from '~~/server/database/schema';
import { z } from 'zod';

const bodySchema = z.object({
  visite_requise: z.boolean(),
  sante_critique: z.boolean(),
  stock_bas: z.boolean(),
  facture_retard: z.boolean(),
});

export default defineEventHandler(async (event) => {
  const user = await requireWorkspace(event);
  const body = bodySchema.parse(await readBody(event));

  await db
    .update(profils)
    .set({ pushNotifPrefs: body, updatedAt: new Date() })
    .where(eq(profils.id, user.id));

  return { data: body };
});
