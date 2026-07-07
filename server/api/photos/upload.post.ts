import { z } from 'zod';
import { eq, sql } from 'drizzle-orm';
import { serverSupabaseServiceRole } from '#supabase/server';
import { detectImageMime, IMAGE_MIME_EXTENSIONS } from '~~/server/utils/image-mime';
import { stripExif } from '~~/server/utils/exif-strip';
import { profils } from '~~/server/database/schema';
import { isAdminEmail } from '~~/app/config/admin';
import { getLimit, getPlanConfig } from '~~/app/config/plans';
import type { Plan } from '~~/app/config/plans';

const ALLOWED_BUCKETS = [
  'interventions-photos',
  'ruches-photos',
  'produits-photos',
  'recoltes-photos',
] as const;
const MAX_SIZE = 5 * 1024 * 1024;
const uuidSchema = z.string().uuid();
const bucketSchema = z.enum(ALLOWED_BUCKETS);

/** Octets déjà stockés par l'utilisateur, tous buckets photos confondus. */
async function getStorageUsedBytes(userId: string): Promise<number> {
  const rows = (await db.execute(sql`
    SELECT coalesce(sum((metadata->>'size')::bigint), 0)::bigint AS used
    FROM storage.objects
    WHERE bucket_id IN ('interventions-photos','ruches-photos','produits-photos','recoltes-photos')
      AND name LIKE ${userId + '/%'}
  `)) as unknown as Array<{ used: string | number }>;
  return Number(rows[0]?.used ?? 0);
}

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event);
  const { ownerId } = await assertCanWrite(event);

  const formData = await readFormData(event);
  const file = formData.get('file') as File | null;
  const bucketRaw = formData.get('bucket');
  const entityIdRaw = formData.get('entityId');

  if (!file || !bucketRaw || !entityIdRaw) {
    throw createError({ statusCode: 400, message: 'Fichier, bucket et entityId requis' });
  }

  const bucketParse = bucketSchema.safeParse(bucketRaw);
  if (!bucketParse.success) {
    throw createError({ statusCode: 400, message: 'Bucket invalide' });
  }
  const bucket = bucketParse.data;

  // Validation stricte UUID — empeche path traversal / injection dans le storage path
  const entityParse = uuidSchema.safeParse(entityIdRaw);
  if (!entityParse.success) {
    throw createError({ statusCode: 400, message: 'entityId invalide (UUID requis)' });
  }
  const entityId = entityParse.data;

  if (file.size > MAX_SIZE) {
    throw createError({ statusCode: 400, message: 'Taille maximale : 5 Mo' });
  }

  // Quota de stockage du plan (photosStorageMb) — jamais appliqué auparavant
  if (!isAdminEmail(user.email)) {
    const [profil] = await db
      .select({ plan: profils.plan })
      .from(profils)
      .where(eq(profils.id, ownerId))
      .limit(1);
    const plan = (profil?.plan ?? 'decouverte') as Plan;
    const maxMb = getLimit(plan, 'photosStorageMb');
    if (maxMb !== Infinity) {
      const usedBytes = await getStorageUsedBytes(ownerId);
      if (usedBytes + file.size > maxMb * 1024 * 1024) {
        throw createError({
          statusCode: 402,
          statusMessage: 'Quota photos atteint',
          data: {
            code: 'LIMIT_REACHED',
            limit: 'photosStorageMb',
            current: Math.round(usedBytes / 1024 / 1024),
            max: maxMb,
            currentPlan: plan,
            message: `Stockage photos plein (${maxMb} Mo sur le plan ${getPlanConfig(plan).label}). Supprimez des photos ou passez au plan supérieur.`,
          },
        });
      }
    }
  }

  const rawBuffer = Buffer.from(await file.arrayBuffer());

  // Validation par magic bytes — ne pas faire confiance au Content-Type client
  const detectedMime = detectImageMime(rawBuffer);
  if (!detectedMime) {
    throw createError({ statusCode: 400, message: 'Format accepté : JPEG, PNG ou WebP' });
  }

  // EXIF stripping — empeche la fuite de GPS / device / date dans les photos
  // (les ruchers sont des lieux personnels, on ne veut pas leak les coordonnees)
  const buffer = stripExif(rawBuffer, detectedMime);

  const ext = IMAGE_MIME_EXTENSIONS[detectedMime] ?? 'jpg';
  const supabase = serverSupabaseServiceRole(event);
  const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const path = `${ownerId}/${entityId}/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from(bucket)
    .upload(path, buffer, { contentType: detectedMime, upsert: false });

  if (uploadError) {
    throw createError({ statusCode: 500, message: `Erreur upload : ${uploadError.message}` });
  }

  const { data: urlData } = await supabase.storage
    .from(bucket)
    .createSignedUrl(path, 7 * 24 * 60 * 60);

  return {
    data: {
      url: urlData?.signedUrl ?? '',
      path,
      name: file.name,
      size: file.size,
      uploadedAt: new Date().toISOString(),
    },
  };
});
