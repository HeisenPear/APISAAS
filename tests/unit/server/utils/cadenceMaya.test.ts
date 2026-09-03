// ═══════════════════════════════════════════════════════════════════════════
// MAYA DIT LE MÊME SEUIL DE VISITE QUE LE RESTE DE L'APPLICATION.
//
// ⚠️ ELLE EN DISAIT UN AUTRE, ET C'ÉTAIT LA PROMESSE CENTRALE D'UN CHAPITRE.
//
// `/maya` vend la cadence saisonnière comme l'argument du chapitre « Comment
// elle raisonne » : « un retard de visite qui se compte en saison, pas en jours
// fixes : dix jours au printemps quand ça essaime, vingt et un à l'automne ».
//
// Le socle d'alertes, la tournée et la feuille de route du jour lisaient bien
// `intervalleVisiteJours()`. Maya, elle, portait sa propre constante — vingt et
// un jours, en toute saison — et une copie de cette constante vivait dans le
// briefing du matin. Le 15 mai, une ruche non vue depuis quatorze jours levait
// « visite requise » dans `/alertes` pendant que Maya répondait « toutes tes
// ruches ont été visitées il y a moins de 21 jours, rien d'urgent ». Elle
// contredisait sa propre application, en plein pic d'essaimage.
//
// ⚠️ ET LE BANC EXISTANT ÉTAIT VERT. `pageMaya.test.ts` vérifiait que
// `cadence.ts` vaut bien 10 au printemps, et que la PAGE le dit. Jamais que
// MAYA s'en sert. Deux vérifications justes, et le trou entre les deux.
// ═══════════════════════════════════════════════════════════════════════════

import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { blocsRuchesVisiter, rendreRuchesVisiter } from '~~/server/utils/copilote-local';
import { intervalleVisiteJours } from '~~/server/utils/cadence';
import { sansCommentaires } from '../../../helpers/sansCommentaires';

/**
 * La phrase rassurante, telle qu'elle est ÉCRITE dans le produit — apostrophe
 * droite comprise. Le texte français de ce dépôt en est plein, et une
 * apostrophe typographique dans un banc fait passer un `not.toContain` à vide.
 */
const RIEN_DURGENT = "Rien d'urgent";

/** 15 mai : printemps, seuil réel de dix jours. */
const PRINTEMPS = new Date('2026-05-15T09:00:00Z');
/** 15 octobre : automne, seuil réel de vingt et un jours. */
const AUTOMNE = new Date('2026-10-15T09:00:00Z');

function ruche(joursDepuisVisite: number | null) {
  return {
    id: 'r1',
    numero: '3',
    rucher: 'Les Tilleuls',
    statut: 'active' as const,
    joursDepuisVisite,
    derniereVisite: '2026-05-01',
    scoreSante: 80,
    maladieObservee: null,
  };
}

describe('garde-fou : les saisons ne donnent PAS le même seuil', () => {
  it('printemps et automne diffèrent — sinon ce banc ne mesure rien', () => {
    /**
     * Sans ce cas, un `cadence.ts` aplati à une valeur unique rendrait tous les
     * cas suivants verts tout en supprimant la règle qu'ils gardent.
     */
    expect(intervalleVisiteJours(PRINTEMPS)).toBe(10);
    expect(intervalleVisiteJours(AUTOMNE)).toBe(21);
  });
});

describe('la réponse de Maya suit la saison', () => {
  it('AU PRINTEMPS, une ruche à 14 jours est à visiter', () => {
    /**
     * ⚠️ LE DÉFAUT EXACT. Quatorze jours dépassent le seuil de printemps (dix)
     * mais pas la constante de vingt et un : Maya annonçait « rien d'urgent »
     * sur la ruche que `/alertes` signalait au même instant.
     */
    const texte = rendreRuchesVisiter([ruche(14)], PRINTEMPS);
    expect(texte, 'Maya doit voir ce que son propre socle d’alertes voit').toContain('à visiter');
    /**
     * ⚠️ L'APOSTROPHE EST DROITE DANS LA SOURCE, et je l'avais écrite
     * typographique : `not.toContain` passait alors à vide — il ne mesurait
     * rien. On vise la chaîne exacte du produit, et une mutation le vérifie.
     */
    expect(texte, 'et ne surtout pas rassurer').not.toContain(RIEN_DURGENT);
  });

  it('EN AUTOMNE, la même ruche à 14 jours ne l’est pas', () => {
    // Le contre-test : sans lui, « tout est urgent » satisferait le cas
    // précédent et noierait l'apiculteur sous des visites inutiles.
    const texte = rendreRuchesVisiter([ruche(14)], AUTOMNE);
    expect(texte).toContain(RIEN_DURGENT);
  });

  it('le seuil ÉNONCÉ est celui de la saison, pas un chiffre fixe', () => {
    // Un refus, une bonne nouvelle : la phrase doit dire le vrai chiffre.
    // Annoncer « moins de 21 jours » un 15 mai serait mentir à l'apiculteur
    // sur la règle même qu'on vient de lui appliquer.
    expect(rendreRuchesVisiter([ruche(2)], PRINTEMPS)).toContain('moins de 10 jours');
    expect(rendreRuchesVisiter([ruche(2)], AUTOMNE)).toContain('moins de 21 jours');
  });

  it('les BLOCS suivent la saison, eux aussi', () => {
    /**
     * Le texte et le tableau sont deux chemins distincts, et ils partaient de la
     * même constante. Corriger l'un sans l'autre donnerait une réponse qui
     * annonce une ruche à visiter au-dessus d'un tableau vide.
     */
    expect(blocsRuchesVisiter([ruche(14)], PRINTEMPS).length).toBeGreaterThan(0);
    expect(blocsRuchesVisiter([ruche(14)], AUTOMNE)).toEqual([]);
  });
});

describe('aucun seuil de visite ne se réécrit ailleurs', () => {
  it('garde-fou : le balayage voit bien les fichiers du serveur', () => {
    const fichiers = execSync('find server -name "*.ts"', { encoding: 'utf-8' })
      .trim()
      .split('\n')
      .filter(Boolean);
    expect(fichiers.length, 'le balayage est vide — le chemin a dû bouger').toBeGreaterThan(40);
  });

  it('la cadence ne se recopie NULLE PART hors de `cadence.ts`', () => {
    /**
     * ⚠️ C'EST LA RÈGLE, PAS LE SYMPTÔME. Corriger les deux copies ne coûte
     * rien ; les empêcher de revenir, si. Un troisième chemin qui reposerait
     * son propre « 21 » rouvrirait exactement le même trou, et il faudrait
     * qu'un apiculteur le signale depuis son rucher pour qu'on le sache.
     *
     * On interdit donc de NOMMER un seuil de visite hors de sa source.
     */
    const fichiers = execSync('find server app -name "*.ts" -o -name "*.vue"', {
      encoding: 'utf-8',
    })
      .trim()
      .split('\n')
      .filter(Boolean)
      .filter((f) => !f.endsWith('server/utils/cadence.ts'));

    const fautifs: string[] = [];
    for (const f of fichiers) {
      // Les commentaires sont blanchis : celui qui EXPLIQUE la correction cite
      // forcément le nom qu'on interdit. Le banc s'accuserait lui-même.
      const code = sansCommentaires(readFileSync(f, 'utf-8'));
      for (const m of code.matchAll(
        /\b(?:const|let|var)\s+([A-Za-z_]*(?:SEUIL|INTERVALLE)[A-Za-z_]*)/g,
      )) {
        if (/VISITE|CADENCE/i.test(m[1]!)) fautifs.push(`${f} — ${m[1]}`);
      }
    }

    expect(
      fautifs,
      'un seuil de visite se LIT dans `cadence.ts`, il ne se repose pas : deux tables ' +
        'pour une seule règle finissent toujours par diverger, et c’est la divergence ' +
        'qui fait dire à Maya le contraire de ses propres alertes.',
    ).toEqual([]);
  });
});
