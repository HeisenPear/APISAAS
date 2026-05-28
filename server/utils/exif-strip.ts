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
 * Pour PNG/WebP : on retourne le buffer tel quel (PNG embed rarement
 * du GPS, WebP idem en pratique). TODO : implementer si besoin.
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
 * Strip generique selon le MIME. Pour PNG et WebP, retourne le buffer
 * inchange (cas EXIF dans PNG/WebP rare en pratique pour le scope APIGO).
 */
export function stripExif(buf: Buffer, mime: string): Buffer {
  if (mime === 'image/jpeg') return stripJpegExif(buf);
  return buf;
}
