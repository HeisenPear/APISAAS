import { z } from 'zod';
import { serverSupabaseServiceRole } from '#supabase/server';

const ALLOWED_BUCKETS = ['interventions-photos', 'ruches-photos', 'produits-photos', 'recoltes-photos'];

const bodySchema = z.object({
  bucket: z.string().refine((b) => ALLOWED_BUCKETS.includes(b), { message: 'Bucket invalide' }),
  path: z.string().min(1),
});

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event);
  const { bucket, path } = await readValidatedBody(event, bodySchema.parse);

  if (!path.startsWith(`${user.id}/`)) {
    throw createError({ statusCode: 403, message: 'Accès refusé' });
  }

  const supabase = serverSupabaseServiceRole(event);
  const { error } = await supabase.storage.from(bucket).remove([path]);

  if (error) {
    throw createError({ statusCode: 500, message: `Erreur suppression : ${error.message}` });
  }

  return { success: true };
});
