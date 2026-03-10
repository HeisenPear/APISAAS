import { eq } from 'drizzle-orm';
import { profils } from '~~/server/database/schema';
import { serverSupabaseServiceRole } from '#supabase/server';

/**
 * Détecte le type MIME d'une image par magic bytes (pas par header client)
 * Protège contre les attaques de type spoofing / polyglot
 */
function detectImageMime(buf: Buffer): string | null {
  // JPEG: FF D8 FF
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'image/jpeg';
  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) return 'image/png';
  // WebP: RIFF....WEBP
  if (buf[0] === 0x52 && buf[1] === 0x49 && buf[8] === 0x57 && buf[9] === 0x45) return 'image/webp';
  return null;
}

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

  const EXT_MAP: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
  };
  const ext = EXT_MAP[mime] ?? 'jpg';
  const path = `logos/${user.id}/logo.${ext}`;

  const supabase = serverSupabaseServiceRole(event);
  const { error } = await supabase.storage.from('apiculture').upload(path, logoField.data, {
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
