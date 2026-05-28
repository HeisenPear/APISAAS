import { eq } from 'drizzle-orm';
import { profils } from '~~/server/database/schema';
import { serverSupabaseServiceRole } from '#supabase/server';
import { detectImageMime, IMAGE_MIME_EXTENSIONS } from '~~/server/utils/image-mime';
import { stripExif } from '~~/server/utils/exif-strip';

/**
 * POST /api/profils/logo
 * Upload du logo apiculteur vers Supabase Storage
 * Multipart/form-data: field "logo" (image max 2MB)
 */
export default defineEventHandler(async (event) => {
  const user = await requireAuth(event);

  const formData = await readMultipartFormData(event);
  if (!formData) badRequest('FormData manquant');

  const logoField = formData.find((f) => f.name === 'logo');
  if (!logoField?.data) badRequest('Champ "logo" manquant');

  const maxSize = 2 * 1024 * 1024; // 2 MB
  if (logoField.data.length > maxSize) badRequest('Logo trop volumineux (max 2 MB)');

  // Validate by magic bytes (not client-supplied MIME) — prevents MIME spoofing
  const magic = detectImageMime(logoField.data);
  if (!magic) badRequest('Format non supporté (JPEG, PNG, WebP uniquement)');
  const mime = magic;

  const ext = IMAGE_MIME_EXTENSIONS[mime] ?? 'jpg';
  const path = `logos/${user.id}/logo.${ext}`;

  // EXIF stripping pour ne pas exposer les metadonnees (GPS du lieu de prise, etc.)
  const cleaned = stripExif(Buffer.from(logoField.data), mime);

  const supabase = serverSupabaseServiceRole(event);
  const { error } = await supabase.storage.from('apiculture').upload(path, cleaned, {
    contentType: mime,
    upsert: true,
  });

  if (error) throw createError({ statusCode: 500, message: `Upload échoué : ${error.message}` });

  const {
    data: { publicUrl },
  } = supabase.storage.from('apiculture').getPublicUrl(path);

  // Ajouter cache-bust
  const logoUrl = `${publicUrl}?v=${Date.now()}`;

  await db.update(profils).set({ logoUrl, updatedAt: new Date() }).where(eq(profils.id, user.id));

  return { data: { logoUrl } };
});
