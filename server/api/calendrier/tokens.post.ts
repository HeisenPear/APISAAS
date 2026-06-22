import { z } from 'zod';
import { tokensCalendrier } from '~~/server/database/schema';
import { randomBytes } from 'node:crypto';

const schema = z.object({
  scope: z.enum(['all', 'interventions', 'recoltes', 'traitements']).default('all'),
});

export default defineEventHandler(async (event) => {
  const user = await requireWorkspace(event);
  const body = await readValidatedBody(event, schema.parse);

  const token = randomBytes(32).toString('hex');

  const [created] = await db
    .insert(tokensCalendrier)
    .values({
      userId: user.id,
      token,
      scope: body.scope,
    })
    .returning();

  return { data: created };
});
