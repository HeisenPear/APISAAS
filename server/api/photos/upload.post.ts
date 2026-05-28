import { z } from 'zod';
import { serverSupabaseServiceRole } from '#supabase/server';
import { detectImageMime, IMAGE_MIME_EXTENSIONS } from '~~/server/utils/image-mime';

const ALLOWED_BUCKETS = [
  'interventions-photos',
  'ruches-photos',
  'produits-photos',
  'recoltes-photos',
] as const;
const MAX_SIZE = 5 * 1024 * 1024;
const uuidSchema = z.string().uuid();
const bucketSchema = z.enum(ALLOWED_BUCKETS);

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event);

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

  const buffer = Buffer.from(await file.arrayBuffer());

  // Validation par magic bytes — ne pas faire confiance au Content-Type client
  const detectedMime = detectImageMime(buffer);
  if (!detectedMime) {
    throw createError({ statusCode: 400, message: 'Format accepté : JPEG, PNG ou WebP' });
  }

  const ext = IMAGE_MIME_EXTENSIONS[detectedMime] ?? 'jpg';
  const supabase = serverSupabaseServiceRole(event);
  const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const path = `${user.id}/${entityId}/${fileName}`;

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
