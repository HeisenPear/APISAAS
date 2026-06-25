import { sql } from 'drizzle-orm';
import { z } from 'zod';
import { ruches, ruchers, clients } from '~~/server/database/schema';

const searchSchema = z.object({
  q: z.string().min(1).max(100),
});

/**
 * GET /api/search?q=xxx
 * Recherche globale dans ruches (numéro, nom), ruchers (nom), clients (nom)
 */
export default defineEventHandler(async (event) => {
  // Espace partagé : un membre recherche dans les données du propriétaire.
  const ownerId = await resolveOwnerId(event);
  const { q } = await getValidatedQuery(event, searchSchema.parse);
  const pattern = `%${escapeIlike(q)}%`;

  const [ruchesResults, ruchersResults, clientsResults] = await Promise.all([
    db
      .select({ id: ruches.id, numero: ruches.numero, type: ruches.type, statut: ruches.statut })
      .from(ruches)
      .where(sql`${ruches.userId} = ${ownerId} AND ${ruches.numero} ILIKE ${pattern}`)
      .limit(5),
    db
      .select({ id: ruchers.id, nom: ruchers.nom, commune: ruchers.commune })
      .from(ruchers)
      .where(sql`${ruchers.userId} = ${ownerId} AND ${ruchers.nom} ILIKE ${pattern}`)
      .limit(5),
    db
      .select({ id: clients.id, nom: clients.nom, entreprise: clients.entreprise })
      .from(clients)
      .where(
        sql`${clients.userId} = ${ownerId} AND (${clients.nom} ILIKE ${pattern} OR ${clients.entreprise} ILIKE ${pattern})`,
      )
      .limit(5),
  ]);

  return {
    data: {
      ruches: ruchesResults.map((r) => ({
        ...r,
        _type: 'ruche' as const,
        _url: `/ruches/${r.id}`,
      })),
      ruchers: ruchersResults.map((r) => ({
        ...r,
        _type: 'rucher' as const,
        _url: `/ruchers/${r.id}`,
      })),
      clients: clientsResults.map((c) => ({
        ...c,
        _type: 'client' as const,
        _url: `/finances/clients`,
      })),
    },
  };
});
