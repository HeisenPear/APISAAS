/**
 * Supprime les segments EXIF d'un buffer JPEG sans re-encoder l'image.
 *
 * Pourquoi : les photos prises par smartphone contiennent par defaut :
 *   - Coordonnees GPS exactes du lieu de prise (rucher = info personnelle)
 *   - Marque, modele et numero de serie du device
 *   - Date et heure precises
 *   - Logiciel utilise
 *
 * Toutes ces metadonnees sont stockees dans des segments JPEG dits "APPn"
 * (APP1 = EXIF, APP2 = ICC profile, etc.). On ne touche pas a l'image
 * elle-meme (segments SOS / EOI), on retire juste les metadonnees.
 *
 * Format JPEG :
 *   - 0xFFD8       : SOI (Start Of Image)
 *   - 0xFFE0..0xFFEF : APP0 a APP15 (metadata)
 *   - 0xFFDB, FFC0… : tables et image data
 *   - 0xFFD9       : EOI (End Of Image)
 *
 * Pour PNG/WebP : on retire aussi les chunks de metadonnees (PNG : eXIf/tEXt/
 * zTXt/iTXt/tIME ; WebP : chunks EXIF et XMP du conteneur RIFF) — cf.
 * stripPngMeta / stripWebpMeta ci-dessous.
 */
export function stripJpegExif(buf: Buffer): Buffer {
  // Verifier SOI
  if (buf.length < 4 || buf[0] !== 0xff || buf[1] !== 0xd8) {
    return buf; // pas un JPEG valide — ne pas alterer
  }

  const out: number[] = [0xff, 0xd8]; // SOI
  let i = 2;

  while (i < buf.length - 1) {
    // Doit etre un marqueur 0xFFxx
    if (buf[i] !== 0xff) {
      // Pas un marqueur — on est dans la data image, on copie le reste
      out.push(...buf.subarray(i));
      break;
    }

    const marker = buf[i + 1];

    // Marqueurs sans payload (RST, SOI, EOI, TEM)
    if (marker === 0xd9) {
      // EOI : on copie et on sort
      out.push(0xff, 0xd9);
      break;
    }
    if ((marker !== undefined && marker >= 0xd0 && marker <= 0xd7) || marker === 0x01) {
      out.push(0xff, marker);
      i += 2;
      continue;
    }

    // Marqueur avec payload : les 2 octets suivants donnent la longueur
    if (i + 4 > buf.length) {
      out.push(...buf.subarray(i));
      break;
    }
    const segLength = buf.readUInt16BE(i + 2); // inclut les 2 octets de longueur eux-memes

    // Segments APPn = 0xFFE0 a 0xFFEF → on les SKIP (EXIF, JFIF si on est strict, etc.)
    // On garde APP0 (JFIF) pour compatibilite max — c'est juste un marker basique
    const isAppSegment = marker !== undefined && marker >= 0xe1 && marker <= 0xef;
    // Aussi : COM (commentaire) = 0xFE
    const isCommentSegment = marker === 0xfe;

    if (isAppSegment || isCommentSegment) {
      // Skip ce segment
      i += 2 + segLength;
      continue;
    }

    // Garder ce segment
    if (marker !== undefined) {
      out.push(0xff, marker);
    }
    const segEnd = i + 2 + segLength;
    out.push(...buf.subarray(i + 2, segEnd));
    i = segEnd;
  }

  return Buffer.from(out);
}

/**
 * Strip des chunks de metadonnees PNG (eXIf, tEXt, zTXt, iTXt, tIME) sans
 * re-encoder l'image. Fail-safe : retourne le buffer d'origine a la moindre
 * anomalie de parsing (jamais de corruption).
 */
function stripPngMeta(buf: Buffer): Buffer {
  try {
    const SIG = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
    if (buf.length < 8) return buf;
    for (let k = 0; k < 8; k++) if (buf[k] !== SIG[k]) return buf;
    const STRIP = new Set(['eXIf', 'tEXt', 'zTXt', 'iTXt', 'tIME']);
    const parts: Buffer[] = [buf.subarray(0, 8)];
    let i = 8;
    while (i + 8 <= buf.length) {
      const len = buf.readUInt32BE(i);
      const type = buf.toString('latin1', i + 4, i + 8);
      const end = i + 12 + len; // length(4) + type(4) + data(len) + crc(4)
      if (end > buf.length) return buf; // tronque → fail-safe
      if (!STRIP.has(type)) parts.push(buf.subarray(i, end));
      i = end;
      if (type === 'IEND') break;
    }
    return Buffer.concat(parts);
  } catch {
    return buf;
  }
}

/**
 * Strip des chunks EXIF / XMP d'un conteneur WebP (RIFF) sans re-encoder.
 * Fail-safe : retourne le buffer d'origine a la moindre anomalie.
 */
function stripWebpMeta(buf: Buffer): Buffer {
  try {
    if (buf.length < 12) return buf;
    if (buf.toString('latin1', 0, 4) !== 'RIFF' || buf.toString('latin1', 8, 12) !== 'WEBP')
      return buf;
    const STRIP = new Set(['EXIF', 'XMP ']);
    const parts: Buffer[] = [];
    let i = 12;
    let stripped = false;
    while (i + 8 <= buf.length) {
      const fourcc = buf.toString('latin1', i, i + 4);
      const size = buf.readUInt32LE(i + 4);
      const padded = i + 8 + size + (size % 2); // chunks alignes sur 2 octets
      if (i + 8 + size > buf.length) return buf; // tronque → fail-safe
      if (STRIP.has(fourcc)) stripped = true;
      else parts.push(buf.subarray(i, Math.min(padded, buf.length)));
      i = padded;
    }
    if (!stripped) return buf; // rien a retirer
    const body = Buffer.concat(parts);
    const out = Buffer.alloc(12 + body.length);
    out.write('RIFF', 0, 'latin1');
    out.writeUInt32LE(4 + body.length, 4); // taille = 'WEBP' + chunks restants
    out.write('WEBP', 8, 'latin1');
    body.copy(out, 12);
    return out;
  } catch {
    return buf;
  }
}

/**
 * Strip generique selon le MIME. JPEG : retire les segments APPn/COM.
 * PNG / WebP : retire les chunks de metadonnees. Sinon : buffer inchange.
 */
export function stripExif(buf: Buffer, mime: string): Buffer {
  if (mime === 'image/jpeg') return stripJpegExif(buf);
  if (mime === 'image/png') return stripPngMeta(buf);
  if (mime === 'image/webp') return stripWebpMeta(buf);
  return buf;
}
