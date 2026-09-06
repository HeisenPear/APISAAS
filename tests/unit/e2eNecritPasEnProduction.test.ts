import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { sansCommentaires } from '../helpers/sansCommentaires';

// ═══════════════════════════════════════════════════════════════════════════
// UN E2E QUI ÉCRIT, ÉCRIT CHEZ DE VRAIS CLIENTS.
//
// ⚠️ CE DÉPÔT N'A PAS DE BASE DE TEST. Le `.env` de référence porte la
// PRODUCTION, et le déploiement de PRÉVERSION — celui que la CI exerce à
// chaque commit poussé — tape la même base. Un parcours Playwright qui crée un
// rucher, une facture ou un sujet de forum ne salit pas un bac à sable : il
// laisse un objet dans l'exploitation d'un apiculteur qui paie.
//
// ─── CE QUE CE BANC CONSTATE, ET QU'IL FAUT TENIR ─────────────────────────
// Mesuré au moment de l'écrire : les HUIT parcours e2e du dépôt sont en
// lecture seule. Aucun n'envoie de POST, PUT, PATCH ni DELETE. C'est un état
// SAIN, et rien ne le gardait — ce fichier est ce qui l'empêche de se perdre
// au prochain parcours ajouté.
//
// ⚠️ CE N'EST PAS UNE INTERDICTION DÉFINITIVE. Le jour où un parcours
// authentifié devient nécessaire, la discipline est écrite depuis longtemps :
// objets préfixés « E2E — », nettoyés en `afterEach`. Il faudra alors inscrire
// le fichier dans `PARCOURS_QUI_ECRIVENT` avec sa raison — et ce banc vérifiera
// qu'il porte bien les deux. Ce qu'on interdit, c'est l'écriture par
// INADVERTANCE.
// ═══════════════════════════════════════════════════════════════════════════

const DOSSIER = 'tests/e2e';

/**
 * Les parcours autorisés à écrire, avec leur raison. VIDE aujourd'hui, et
 * c'est le constat qu'on veut tenir.
 *
 * Une entrée ici DOIT porter la discipline complète : préfixe « E2E — » sur
 * tout objet créé, et nettoyage en `afterEach`. Le cas plus bas l'exige.
 */
const PARCOURS_QUI_ECRIVENT: Record<string, string> = {};

/**
 * Ce qui ENVOIE une écriture au serveur.
 *
 * ⚠️ LE MOTIF VISE L'APPEL, PAS LE MOT. Chercher « POST » dans le fichier
 * trouverait le mot dans une phrase (« aucun POST »), et le banc s'accuserait
 * lui-même — le piège tombé six fois dans ce dépôt. On vise donc `.post(`,
 * `.delete(`, ou un `method:` explicite, sur un source dont les commentaires
 * ont été BLANCHIS.
 *
 * `page.goto()` et `request.get()` ne sont pas des écritures : un GET sur une
 * route de lecture ne change rien.
 */
const ECRITURE =
  /\.(post|put|patch|delete|fetch)\s*\(|method\s*:\s*['"`](POST|PUT|PATCH|DELETE)['"`]/i;

/** Les parcours du dossier, commentaires blanchis. */
function parcours(): { nom: string; code: string }[] {
  return readdirSync(DOSSIER)
    .filter((f) => f.endsWith('.spec.ts'))
    .sort()
    .map((nom) => ({
      nom,
      code: sansCommentaires(readFileSync(join(DOSSIER, nom), 'utf-8')),
    }));
}

const PARCOURS = parcours();

describe('les parcours e2e n’écrivent pas dans la base de production', () => {
  it('le balayage voit bien les parcours (garde-fou)', () => {
    /**
     * Sans ce cas, un dossier renommé rendrait la liste vide et la règle
     * suivante serait verte en ne regardant rien. Ce dépôt s'est fait prendre
     * quatre fois par un balayage vide.
     */
    expect(PARCOURS.length, 'aucun parcours e2e trouvé').toBeGreaterThan(5);
    expect(PARCOURS.map((p) => p.nom)).toContain('public-pages.spec.ts');
  });

  it('AUCUN parcours n’envoie d’écriture, sauf ceux qui le déclarent', () => {
    const fautifs = PARCOURS.filter(
      (p) => ECRITURE.test(p.code) && !(p.nom in PARCOURS_QUI_ECRIVENT),
    ).map((p) => p.nom);

    expect(
      fautifs,
      `Ces parcours e2e envoient une écriture : ${fautifs.join(', ')}.\n` +
        'La préversion tape la base de PRODUCTION — cette écriture atterrit chez un ' +
        'apiculteur qui paie. Rends le parcours en lecture seule, ou inscris-le dans ' +
        'PARCOURS_QUI_ECRIVENT avec sa raison, en préfixant tout objet créé de « E2E — » ' +
        'et en le nettoyant dans un `afterEach`.',
    ).toEqual([]);
  });

  it('un parcours autorisé à écrire porte le préfixe ET le nettoyage', () => {
    /**
     * La liste est vide aujourd'hui : ce cas ne mesure donc rien pour l'instant.
     * Il est écrit MAINTENANT parce que le jour où quelqu'un y ajoutera une
     * entrée, il aura autre chose en tête que cette discipline — et c'est
     * précisément ce jour-là qu'elle compte.
     */
    for (const [nom, raison] of Object.entries(PARCOURS_QUI_ECRIVENT)) {
      const p = PARCOURS.find((x) => x.nom === nom);
      expect(p, `${nom} est déclaré mais n'existe plus`).toBeDefined();
      expect(raison.length, `${nom} est autorisé à écrire sans raison écrite`).toBeGreaterThan(40);
      expect(p!.code, `${nom} écrit sans préfixer ses objets de « E2E — »`).toContain('E2E — ');
      expect(p!.code, `${nom} écrit sans nettoyer derrière lui`).toContain('afterEach');
    }
  });

  it('contrôle positif : la sonde distingue une écriture d’une lecture', () => {
    /**
     * ⚠️ SANS CE CAS, LE DÉPÔT ÉTANT PROPRE, NEUTRALISER LA SONDE DONNERAIT
     * EXACTEMENT LE MÊME VERT QUE LA RESPECTER. C'est le principe de
     * `scripts/controle-sonde.mjs` : on présente deux sources FABRIQUÉES et on
     * exige qu'elles soient distinguées.
     */
    const ecrit = [
      "await page.request.post('/api/forum/sujets', { data: { titre: 'x' } });",
      "await request.fetch('/api/x', { method: 'DELETE' });",
      "await page.request.delete('/api/forum/messages/1');",
    ];
    const lit = [
      "await page.goto('/forum');",
      "const r = await page.request.get('/forum');",
      "await expect(page.getByRole('heading')).toBeVisible();",
    ];

    for (const ligne of ecrit) {
      expect(ECRITURE.test(ligne), `écriture non détectée : ${ligne}`).toBe(true);
    }
    for (const ligne of lit) {
      expect(ECRITURE.test(ligne), `lecture prise pour une écriture : ${ligne}`).toBe(false);
    }
  });

  it('une phrase qui PARLE d’un POST ne compte pas comme un POST', () => {
    /**
     * Le piège « le banc s'accuse lui-même », en version anticipée : le
     * parcours du forum explique dans son en-tête qu'il « n'envoie aucun
     * POST ». Un motif appliqué au source brut l'aurait accusé pour la phrase
     * qui affirme exactement le contraire.
     */
    const source = [
      '/**',
      ' * Ce parcours est en lecture seule : aucun POST, aucun DELETE.',
      ' */',
      "await page.goto('/forum');",
    ].join('\n');
    expect(ECRITURE.test(sansCommentaires(source))).toBe(false);
  });
});
