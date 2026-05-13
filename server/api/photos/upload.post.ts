import { serverSupabaseServiceRole } from '#supabase/server';

const ALLOWED_BUCKETS = ['interventions-photos', 'ruches-photos', 'produits-photos', 'recoltes-photos'] as const;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_SIZE = 5 * 1024 * 1024;

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event);

  const formData = await readFormData(event);
  const file = formData.get('file') as File | null;
  const bucket = formData.get('bucket') as string | null;
  const entityId = formData.get('entityId') as string | null;

  if (!file || !bucket || !entityId) {
    throw createError({ statusCode: 400, message: 'Fichier, bucket et entityId requis' });
  }
  if (!(ALLOWED_BUCKETS as readonly string[]).includes(bucket)) {
    throw createError({ statusCode: 400, message: 'Bucket invalide' });
  }
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw createError({ statusCode: 400, message: 'Format accepté : JPEG, PNG ou WebP' });
  }
  if (file.size > MAX_SIZE) {
    throw createError({ statusCode: 400, message: 'Taille maximale : 5 Mo' });
  }

  const supabase = serverSupabaseServiceRole(event);
  const ext = file.name.split('.').pop() ?? 'webp';
  const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const path = `${user.id}/${entityId}/${fileName}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error: uploadError } = await supabase.storage
    .from(bucket)
    .upload(path, buffer, { contentType: file.type, upsert: false });

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
