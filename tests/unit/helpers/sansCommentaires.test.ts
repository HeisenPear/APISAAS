import { describe, it, expect } from 'vitest';
import { sansCommentaires } from '~~/tests/helpers/sansCommentaires';

/**
 * CE FILTRE EST DE L'OUTILLAGE DE BANC, ET C'EST EXACTEMENT POURQUOI IL EN
 * FAUT UN.
 *
 * Plusieurs bancs de ce dépôt lisent du code source pour vérifier qu'une règle
 * y est bien écrite. Quand le filtre se trompe, ils ne tombent pas en panne :
 * ils restent VERTS en ne regardant rien. C'est le pire mode d'échec possible
 * pour un test, et il s'est produit trois fois.
 */
describe('sansCommentaires — blanchir sans rien perdre d’autre', () => {
  it('efface un commentaire de bloc', () => {
    expect(sansCommentaires("/* interdit */ const a = 'garde';")).not.toMatch(/interdit/);
    expect(sansCommentaires("/* interdit */ const a = 'garde';")).toMatch(/garde/);
  });

  it('efface un commentaire de ligne', () => {
    expect(sansCommentaires("const a = 1; // interdit\nconst b = 'garde';")).not.toMatch(
      /interdit/,
    );
  });

  it('efface un commentaire HTML', () => {
    expect(sansCommentaires('<!-- interdit --><p>garde</p>')).not.toMatch(/interdit/);
  });

  it('conserve les numéros de ligne', () => {
    /**
     * Plusieurs bancs rapportent une ligne fautive à l'utilisateur. Un filtre
     * qui supprime des lignes les ferait toutes pointer à côté.
     */
    const src = 'const a = 1;\n/* deux\n   lignes */\nconst b = 2;';
    expect(sansCommentaires(src).split('\n')).toHaveLength(src.split('\n').length);
  });

  it('NE PREND PAS un motif glob pour un commentaire', () => {
    /**
     * LE DÉFAUT QUI A CASSÉ UN BANC AU MOMENT D'EXTRAIRE CE FICHIER.
     *
     * `nuxt.config.ts` contient `'/conformite/*'`. Les deux caractères `/` et
     * `*` ouvraient un faux commentaire de bloc, et tout le reste du fichier
     * était blanchi — dont la liste `ignore` que le banc SEO cherchait. Il ne
     * plantait pas : il ne trouvait plus rien.
     */
    const src = "const routes = ['/conformite/*'];\nconst ignore = ['/dashboard'];";
    const out = sansCommentaires(src);
    expect(out).toMatch(/dashboard/);
    expect(out).toMatch(/conformite/);
  });

  it('ne coupe pas une URL prise pour un commentaire de ligne', () => {
    const out = sansCommentaires("const u = 'https://apigo.fr/tarifs';");
    expect(out).toMatch(/apigo\.fr\/tarifs/);
  });

  it('gère les guillemets échappés sans perdre le fil', () => {
    // Une apostrophe échappée ne ferme pas la chaîne : la croire fermée ferait
    // basculer tout le reste du fichier dans le mauvais mode.
    const out = sansCommentaires("const a = 'l\\'ami'; /* interdit */ const b = 'garde';");
    expect(out).toMatch(/garde/);
    expect(out).not.toMatch(/interdit/);
  });

  it('traite les trois sortes de délimiteurs', () => {
    for (const [ouvre, ferme] of [
      ["'", "'"],
      ['"', '"'],
      ['`', '`'],
    ]) {
      const out = sansCommentaires(`const a = ${ouvre}/x/*${ferme}; const b = 'garde';`);
      expect(out, ouvre).toMatch(/garde/);
    }
  });

  it('un commentaire DANS une chaîne reste une chaîne', () => {
    expect(sansCommentaires("const a = '// pas un commentaire';")).toMatch(/pas un commentaire/);
  });
});
