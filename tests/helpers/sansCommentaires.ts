/**
 * Blanchit les commentaires d'un source, en CONSERVANT les numéros de ligne.
 *
 * Extrait ici après avoir été recopié dans quatre bancs — et après m'avoir
 * piégé une fois de plus : un banc du commerce cherchait `'en_retard'` dans le
 * corps d'une fonction, et le trouvait dans la note explicative écrite juste
 * au-dessus. Le code pouvait disparaître, le banc restait vert.
 *
 * TROIS MODES D'ÉCHEC, DONT DEUX DÉJÀ TOMBÉS DANS CE DÉPÔT :
 *
 * 1. Exclure le fichier entier dès qu'il cite la valeur cherchée — ce qui
 *    aveuglait `main.css`, précisément le fichier où une couleur a le plus de
 *    chances d'être touchée.
 * 2. Exclure les LIGNES commençant par `/*`, `*` ou `//` — mais un bloc CSS
 *    multi-ligne a des lignes de continuation qui commencent par du texte, et
 *    elles étaient lues comme du code. Il fallait compenser par un mot magique,
 *    qui aurait cessé de marcher à la première note rédigée autrement.
 * 3. Ignorer les CHAÎNES — celui-ci m'a coûté un banc au moment d'extraire ce
 *    fichier. `nuxt.config.ts` contient `'/conformite/*'` : les deux caractères
 *    `/` et `*` d'un motif glob ouvraient un faux commentaire de bloc, et tout
 *    le reste du fichier — dont la liste `ignore` que le banc cherchait — était
 *    blanchi. Suivre l'état des chaînes est donc obligatoire, pas un luxe.
 *
 * ⚠️ Limite connue et assumée : les littéraux d'expression régulière ne sont pas
 * suivis. Un `/https:\/\//` écrit hors chaîne serait mal lu. Aucun des fichiers
 * inspectés par les bancs n'en contient, et distinguer une division d'une
 * regex demande un vrai analyseur.
 */
export function sansCommentaires(src: string): string {
  let out = '';
  let bloc = false; // dans /* … */
  let html = false; // dans <!-- … -->
  let chaine: "'" | '"' | '`' | null = null;

  for (let i = 0; i < src.length; i++) {
    const c = src[i]!;
    const deux = src.slice(i, i + 2);

    // ── Dans une chaîne : tout est recopié tel quel ──────────────────────────
    if (chaine) {
      out += c;
      if (c === '\\') {
        // Échappement : le caractère suivant ne peut pas fermer la chaîne.
        if (i + 1 < src.length) out += src[i + 1];
        i++;
        continue;
      }
      if (c === chaine) chaine = null;
      continue;
    }

    if (bloc) {
      if (deux === '*/') {
        bloc = false;
        out += '  ';
        i++;
        continue;
      }
      out += c === '\n' ? '\n' : ' ';
      continue;
    }

    if (html) {
      if (src.slice(i, i + 3) === '-->') {
        html = false;
        out += '   ';
        i += 2;
        continue;
      }
      out += c === '\n' ? '\n' : ' ';
      continue;
    }

    // ── Hors chaîne et hors commentaire ──────────────────────────────────────
    if (deux === '/*') {
      bloc = true;
      out += '  ';
      i++;
      continue;
    }
    if (src.slice(i, i + 4) === '<!--') {
      html = true;
      out += '    ';
      i += 3;
      continue;
    }
    if (deux === '//') {
      // Jusqu'à la fin de la ligne. Une URL n'est plus concernée : `https://…`
      // vit dans une chaîne, donc dans la branche ci-dessus.
      while (i < src.length && src[i] !== '\n') {
        out += ' ';
        i++;
      }
      out += '\n';
      continue;
    }
    if (c === "'" || c === '"' || c === '`') {
      chaine = c;
      out += c;
      continue;
    }
    out += c;
  }
  return out;
}
