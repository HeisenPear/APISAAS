import { asc } from 'drizzle-orm';
import { floraisonsReferentiel } from '~~/server/database/schema';

export default defineEventHandler(async () => {
  const rows = await db.select().from(floraisonsReferentiel).orderBy(asc(floraisonsReferentiel.moisDebut));
  return { data: rows };
});
