/**
 * Compression d'images côté client avant upload Supabase Storage.
 * Réduit la taille des photos d'intervention et logos à 500 KB max.
 */
import imageCompression from 'browser-image-compression';

export async function compressImage(file: File): Promise<File> {
  return imageCompression(file, {
    maxSizeMB: 0.5, // 500 KB max
    maxWidthOrHeight: 1920, // Full HD max
    useWebWorker: true,
  });
}
