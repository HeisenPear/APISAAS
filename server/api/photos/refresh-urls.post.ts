import { z } from 'zod';
import { serverSupabaseServiceRole } from '#supabase/server';

const ALLOWED_BUCKETS = [
  'interventions-photos',
  'ruches-photos',
  'produits-photos',
  'recoltes-photos',
];

const bodySchema = z.object({
  bucket: z.string().refine((b) => ALLOWED_BUCKETS.includes(b), { message: 'Bucket invalide' }),
  paths: z.array(z.string()).max(50),
});

export default defineEventHandler(async (event) => {
  const user = await requireWorkspace(event);
  const { bucket, paths } = await readValidatedBody(event, bodySchema.parse);

  for (const p of paths) {
    if (!p.startsWith(`${user.id}/`)) {
      throw createError({ statusCode: 403, message: 'Accès refusé' });
    }
  }

  const supabase = serverSupabaseServiceRole(event);
  const results = await Promise.all(
    paths.map(async (path) => {
      const { data } = await supabase.storage.from(bucket).createSignedUrl(path, 7 * 24 * 60 * 60);
      return { path, url: data?.signedUrl ?? '' };
    }),
  );

  return { data: results };
});
