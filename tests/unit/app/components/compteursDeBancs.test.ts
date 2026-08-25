import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { sansCommentaires } from '~~/tests/helpers/sansCommentaires';

/**
 * LE CHAPITRE « SES LIMITES » PRÉTENDAIT ÊTRE GARDÉ. IL NE L'ÉTAIT PAS.
 *
 * `app/components/landing/maya/MayaLimites.vue` affiche au visiteur trois
 * chiffres — « 16 score · 34 balances · 22 météo » — comme preuve que le noyau
 * de décision est couvert cas par cas. Et son commentaire affirmait :
 *
 *     « Un banc les tient à jour (tests/unit/app/pages/pageMaya.test.ts) :
 *       s'ils changent, il nomme cette page. »
 *
 * ⚠️ CE BANC N'EXISTAIT PAS. `pageMaya.test.ts` a été lu en entier : il ne
 * mentionne ni `santeScore.test.ts`, ni `balancesAlertes.test.ts`, ni
 * `alertesMeteoDecision.test.ts`. Les trois chiffres étaient exacts PAR HASARD,
 * et personne ne les tenait.
 *
 * C'est la pire forme de dette : un commentaire qui affirme une garantie
 * dispense de la vérifier. Quelqu'un lisant ce fichier aurait supprimé un cas de
 * test en toute confiance, persuadé qu'une porte l'arrêterait.
 *
 * Voici la porte annoncée.
 */

const AFFICHAGE = 'app/components/landing/maya/MayaLimites.vue';

/** Le nom montré au visiteur → le fichier de test qui le justifie. */
const SOURCES: Record<string, string> = {
  score: 'tests/unit/server/utils/santeScore.test.ts',
  balances: 'tests/unit/server/utils/balancesAlertes.test.ts',
  météo: 'tests/unit/server/utils/alertesMeteoDecision.test.ts',
};

/**
 * Compte les cas d'un fichier de test.
 *
 * ⚠️ `it.each` INTERDIT ICI, ET C'EST DÉLIBÉRÉ. Un `it.each` de 5 lignes compte
 * pour 5 cas à l'exécution mais pour un seul à la lecture : le compte statique
 * mentirait au visiteur. Plutôt que d'écrire un compteur qui devine, on vérifie
 * qu'aucun des trois fichiers n'en emploie — et le jour où l'un d'eux en aura
 * besoin, ce banc le dira au lieu d'afficher un chiffre faux.
 */
function casDeTest(fichier: string): number {
  const source = sansCommentaires(readFileSync(fichier, 'utf-8'));
  return [...source.matchAll(/^\s*it\(/gm)].length;
}

/** Les chiffres tels que la page les affiche. */
function chiffresAffiches(): Record<string, number> {
  const source = sansCommentaires(readFileSync(AFFICHAGE, 'utf-8'));
  const bloc = source.slice(source.indexOf('const BANCS'));
  const trouves: Record<string, number> = {};
  for (const m of bloc.matchAll(/\{\s*cas:\s*(\d+),\s*nom:\s*'([^']+)'\s*\}/g)) {
    trouves[m[2]!] = Number(m[1]);
  }
  return trouves;
}

describe('les compteurs de bancs affichés sur /maya', () => {
  it('la page affiche bien trois compteurs (garde-fou du banc)', () => {
    // Sans ce contrôle, un renommage de `BANCS` rendrait la table vide et le cas
    // suivant vert : le banc affirmerait une conformité qu'il n'a pas mesurée.
    const affiches = chiffresAffiches();
    expect(Object.keys(affiches).sort()).toEqual(Object.keys(SOURCES).sort());
  });

  it('aucun des trois fichiers n’emploie it.each — sinon le compte mentirait', () => {
    for (const [nom, fichier] of Object.entries(SOURCES)) {
      const source = sansCommentaires(readFileSync(fichier, 'utf-8'));
      expect(
        source,
        `${nom} (${fichier}) : un it.each rend le compte statique faux — ` +
          'compte ses cas autrement, ou retire le chiffre de la page',
      ).not.toMatch(/it\.each/);
    }
  });

  it('chaque chiffre montré au visiteur est le vrai compte de son banc', () => {
    const affiches = chiffresAffiches();
    const ecarts: string[] = [];
    for (const [nom, fichier] of Object.entries(SOURCES)) {
      const reel = casDeTest(fichier);
      if (affiches[nom] !== reel) {
        ecarts.push(`« ${affiches[nom]} ${nom} » affiché, ${reel} cas réels dans ${fichier}`);
      }
    }
    expect(
      ecarts,
      'ces chiffres sont montrés comme une PREUVE au visiteur : ils doivent être exacts',
    ).toEqual([]);
  });

  it('le fichier nomme le banc qui le garde VRAIMENT', () => {
    /**
     * La correction serait incomplète sans ça : un lecteur qui veut savoir si
     * ces chiffres sont tenus doit trouver le nom du banc dans le fichier même.
     *
     * ⚠️ J'AVAIS AUSSI ÉCRIT L'ASSERTION INVERSE — « ce fichier ne mentionne
     * plus pageMaya.test.ts » — et elle a immédiatement accusé la phrase qui
     * RÉPARE le défaut : la note explique que ce banc-là ne gardait pas les
     * compteurs, donc elle le nomme. Une règle qui interdit un mot interdit
     * aussi d'expliquer pourquoi ce mot était faux. Le dépôt s'est déjà fait
     * prendre trois fois par cette forme-là (un banc qui trouve sa cible dans
     * son propre commentaire) ; ici elle se déguisait en rigueur.
     */
    const source = readFileSync(AFFICHAGE, 'utf-8');
    expect(source, 'nomme le banc qui garde vraiment les compteurs').toContain(
      'compteursDeBancs.test.ts',
    );
  });
});
