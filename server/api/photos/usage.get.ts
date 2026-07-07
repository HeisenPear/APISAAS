import { serverSupabaseServiceRole } from '#supabase/server';

const BUCKETS = [
  'interventions-photos',
  'ruches-photos',
  'produits-photos',
  'recoltes-photos',
] as const;

export default defineEventHandler(async (event) => {
  await requireAuth(event);
  const ownerId = await resolveOwnerId(event);
  const supabase = serverSupabaseServiceRole(event);

  let totalBytes = 0;

  for (const bucket of BUCKETS) {
    const { data: folders } = await supabase.storage
      .from(bucket)
      .list(`${ownerId}/`, { limit: 1000 });

    if (!folders) continue;

    for (const folder of folders) {
      if (folder.id !== null) {
        totalBytes += folder.metadata?.size ?? 0;
        continue;
      }
      const { data: files } = await supabase.storage
        .from(bucket)
        .list(`${ownerId}/${folder.name}/`, { limit: 200 });
      if (files) {
        totalBytes += files.reduce((sum, f) => sum + (f.metadata?.size ?? 0), 0);
      }
    }
  }

  return {
    data: {
      usedBytes: totalBytes,
      usedMb: Math.round(totalBytes / 1024 / 1024),
    },
  };
});
