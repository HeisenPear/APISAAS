// ═══════════════════════════════════════════════════════════════════════════
// UNE FICHE DONT UNE AUTRE RÉCLAME LA MAJORITÉ DES MOTS-CLÉS EST CAPTURÉE —
// ET PERSONNE NE LE VOIT, PARCE QU'ELLE RÉPOND. MAL, MAIS ELLE RÉPOND.
//
// Deux défauts de la même famille ont mené à ce banc. Aucun des deux n'était
// visible : le corpus mesure les questions qu'on a pensé à écrire, et l'audit
// des fiches orphelines ne voit que celles qui ne rendent RIEN. Ici les fiches
// rendaient quelque chose — le contenu d'une voisine.
//
//   · `exces-males` — « pourquoi autant de mâles ? », qui est le signal d'une
//     colonie en train de perdre sa reine (bourdonneuse, ponte de faux-bourdons)
//     — perdait ses ONZE mots-clés, tous, au profit de la fiche de biologie
//     générale. L'apiculteur qui décrivait le symptôme recevait un cours sur
//     les castes. Un commentaire de la fiche voisine affirmait pourtant que le
//     problème était réglé : on avait retiré les expressions concurrentes, pas
//     le doublon `male` + `males` qui les battait.
//
//   · `frelon-europeen` — quatre de ses six mots-clés, dont le binôme latin
//     « vespa crabro », servaient la fiche de l'espèce INVASIVE : muselières,
//     harpes électriques, destruction payante des nids, pour une espèce
//     indigène qu'une colonie forte supporte très bien.
//
// LA RÈGLE : qu'AUCUNE fiche ne voie la majorité stricte de ses mots-clés
// partir vers une seule et même autre fiche. Une fiche spécialisée qui gagne
// sur un mot précis, c'est sain — « acide oxalique » doit rendre la fiche de
// l'acide oxalique. Une fiche qui prend la MAJORITÉ des mots d'une autre, c'est
// une capture : la seconde n'existe plus.
//
// ⚠️ LE BALAYAGE PART DE `SAVOIR`, JAMAIS D'UNE LISTE ÉCRITE ICI.
// ═══════════════════════════════════════════════════════════════════════════

import { describe, expect, it } from 'vitest';
import { classifierTour } from '~~/server/utils/copilote-local';
import { SAVOIR, type ArticleSavoir } from '~~/server/utils/copilote-savoir';

/** La fiche que le moteur rend pour cette phrase, ou null s'il ne rend pas de fiche. */
function ficheRendue(phrase: string): string | null {
  const d = classifierTour([{ role: 'user', content: phrase }]);
  return d.kind === 'savoir' ? d.articleId : null;
}

/**
 * Le ravisseur d'une fiche : l'autre fiche qui réclame la majorité stricte de
 * ses mots-clés, s'il en existe une.
 *
 * ⚠️ « MAJORITÉ STRICTE », ET C'EST CE QUI DISTINGUE LA CAPTURE DE LA
 * SPÉCIALISATION. Sur les 118 fiches, 55 mots-clés partent aujourd'hui vers
 * une voisine et c'est très souvent le bon produit : « acide oxalique » est un
 * mot-clé de `traitement-varroa` et doit rendre `acide-oxalique`. Exiger zéro
 * fuite condamnerait toute fiche générale à ne jamais renvoyer vers une fiche
 * précise. La majorité, elle, ne se justifie jamais : elle dit que la fiche
 * examinée a cessé d'exister.
 *
 * ⚠️ UNE CLARIFICATION N'EST PAS UNE CAPTURE. Quand les deux fiches sont
 * proposées, la nôtre est nommée et reste à un geste — c'est le bon
 * comportement sur « plein de faux bourdons », qui est réellement ambigu.
 */
function ravisseur(
  fiche: Pick<ArticleSavoir, 'id' | 'motsCles'>,
): { id: string; n: number } | null {
  const par = new Map<string, number>();
  for (const cle of fiche.motsCles) {
    const rendue = ficheRendue(cle);
    if (rendue && rendue !== fiche.id) par.set(rendue, (par.get(rendue) ?? 0) + 1);
  }
  for (const [id, n] of par) {
    if (n * 2 > fiche.motsCles.length) return { id, n };
  }
  return null;
}

describe('garde-fou : le balayage voit le savoir, et sait crier', () => {
  it('le corpus de fiches est là et chaque fiche a des mots-clés', () => {
    expect(SAVOIR.length, 'aucune fiche lue — le balayage ne mesure rien').toBeGreaterThan(100);
    expect(
      SAVOIR.filter((a) => a.motsCles.length === 0),
      'une fiche sans mot-clé n’a pas de majorité à perdre : elle passerait par forfait',
    ).toEqual([]);
  });

  it('⚠️ CONTRÔLE POSITIF — une fiche entièrement volée est vue CAPTURÉE', () => {
    /**
     * LE CAS QUI EMPÊCHE CE BANC D'ÊTRE DÉCORATIF. Si `ficheRendue` renvoyait
     * toujours l'identifiant demandé — ou si `ravisseur` comparait une fiche à
     * elle-même — la règle ci-dessous serait verte sur n'importe quel moteur,
     * y compris celui qui envoyait les « vespa crabro » chez l'invasive.
     *
     * On fabrique donc une fiche dont TOUS les mots-clés appartiennent, en
     * fait, à une seule autre : ceux de la fiche du frelon asiatique. Une
     * seule réponse est acceptable : capturée par elle.
     */
    const fantome = {
      id: 'fiche-fantome-qui-n-existe-pas',
      motsCles: ['vespa velutina', 'museliere', 'harpe electrique', 'nid de frelon asiatique'],
    };
    const r = ravisseur(fantome);
    expect(
      r,
      'le détecteur ne voit pas une fiche dont RIEN ne lui revient : il ne mesure rien',
    ).not.toBeNull();
    expect(r!.id).toBe('frelon-asiatique');
  });

  it('la tolérance aux fautes de frappe fonctionne toujours', () => {
    /**
     * ⚠️ SANS CE CAS, ON POURRAIT « RÉPARER » LES CAPTURES EN COUPANT LE
     * CORRECTEUR. Les captures corrigées plus bas venaient d'un rapprochement
     * approché trop lourd ; le désactiver aurait tout mis au vert en cassant
     * ce qui marche.
     *
     * ⚠️ ET LE PREMIER TÉMOIN CHOISI NE MESURAIT PAS ÇA. « varoa » passe par
     * le correcteur d'orthographe (`copilote-orthographe.ts`), qui le corrige
     * AVANT la recherche : couper `distanceMax1` le laissait rendre sa fiche,
     * donc le cas restait VERT sur un moteur amputé. Vu à la mutation. Les
     * quatre mots ci-dessous ont été mesurés comme n'étant rattrapés QUE par
     * `distanceMax1` — ils tombent en « inconnu » dès qu'on la coupe.
     */
    expect(ficheRendue('ascosphrose'), 'mycose du couvain, une lettre manquante').toBe(
      'ascosphere',
    );
    expect(ficheRendue('operculaton')).toBe('operculation');
    expect(ficheRendue('chataigner')).toBe('miellee-chataignier');
    expect(ficheRendue('buckast'), 'une race d’abeille mal tapée').toBe('races-abeilles');
  });
});

describe('la RÈGLE : aucune fiche capturée par une autre', () => {
  it('aucune fiche ne perd la majorité de ses mots-clés au profit d’une seule voisine', () => {
    const captures = SAVOIR.map((a) => ({ a, r: ravisseur(a) }))
      .filter(({ r }) => r !== null)
      .map(({ a, r }) => `${a.id} — ${r!.n}/${a.motsCles.length} de ses mots-clés vont à ${r!.id}`);

    expect(
      captures,
      'Une fiche capturée n’a pas disparu de l’écran : elle a été REMPLACÉE. ' +
        'L’apiculteur pose sa question, reçoit une réponse, et ne sait pas qu’elle ' +
        'répond à autre chose. C’est ainsi que « pourquoi autant de mâles ? » — le ' +
        'signe d’une colonie qui perd sa reine — recevait un cours sur les castes.',
    ).toEqual([]);
  }, 60_000);
});

describe('l’histoire : les deux captures réparées', () => {
  it('le DIAGNOSTIC de l’excès de mâles n’est plus remplacé par le cours de biologie', () => {
    /**
     * `male` et `males` produisent le même jeton après racinisation, et chacun
     * ajoutait son poids : `ouvrieres-faux-bourdons` encaissait 10 points là
     * où une autre fiche en avait 5 — assez pour prendre les ONZE mots-clés
     * de `exces-males`.
     *
     * On n'exige pas que `exces-males` GAGNE : la question est réellement
     * ambiguë entre le cours de biologie et le diagnostic, et proposer les
     * deux est le bon produit. On exige que le diagnostic soit AU MOINS nommé.
     *
     * ⚠️ CE QUI RESTE, ET QUI N'EST PAS ICI. Les formulations en « faux
     * bourdons » (« trop de faux bourdons », « plein de faux bourdons »)
     * partent encore, SEULES, à la fiche de biologie : son titre — « Ouvrières
     * et faux-bourdons » — lui rend deux points de bonus sur les mots que son
     * mot-clé « faux bourdon » vient déjà d'encaisser. Le corriger a été
     * essayé et MESURÉ : ne créditer le titre que sur les mots qu'aucun
     * mot-clé n'a payés répare ces phrases mais fait tomber six autres
     * questions du corpus (dictée, fautes, multi-faits). Peser les expressions
     * selon leur longueur les répare aussi, et n'en coûte qu'une — mais une
     * de trop pour un cliquet dur. La dette est donc écrite ici plutôt que
     * troquée contre une régression ailleurs.
     */
    for (const p of [
      'pourquoi autant de males',
      'trop de males',
      'beaucoup de males',
      'plein de males',
      'males en exces',
    ]) {
      const d = classifierTour([{ role: 'user', content: p }]);
      const nomme =
        (d.kind === 'savoir' && d.articleId === 'exces-males') ||
        (d.kind === 'clarification' &&
          d.titres.some((t) => t.toLowerCase().includes('beaucoup de mâles')));
      expect(nomme, `« ${p} » ne propose plus le diagnostic de la colonie bourdonneuse`).toBe(true);
    }
  });

  it('un mot APPROCHÉ ne bat plus une expression EXACTE', () => {
    /**
     * « noire » est à une lettre de « boire », mot-clé propre à `eau-rucher`
     * donc pesé au maximum : il battait l'expression « abeille noire » de la
     * fiche des races. On demandait la race indigène, on recevait un cours sur
     * les points d'eau.
     */
    expect(ficheRendue('abeille noire'), 'la race indigène, pas l’abreuvoir').toBe(
      'races-abeilles',
    );
    expect(ficheRendue('quelle race d abeille choisir')).toBe('races-abeilles');
  });

  it('la teneur en eau du miel n’est plus prise par l’abreuvoir', () => {
    /**
     * Même mécanique que « abeille noire », autre victime : « eau » n'appartient
     * qu'à `eau-rucher`, donc il pesait 6 — le maximum — et raflait toute
     * question contenant le mot. La fiche du réfractomètre est désormais
     * proposée.
     */
    const d = classifierTour([{ role: 'user', content: 'pourcentage d eau dans le miel' }]);
    const nomme =
      (d.kind === 'savoir' && d.articleId === 'miel-teneur-eau') ||
      (d.kind === 'clarification' &&
        d.titres.some((t) => t.toLowerCase().includes('teneur en eau')));
    expect(nomme, 'la teneur en eau du miel n’est même pas proposée').toBe(true);
  });

  /**
   * ⚠️ CE QUE CE BANC NE COUVRE PAS, ET POURQUOI C'EST ÉCRIT PLUTÔT QUE TU.
   *
   * La pénalité répare les cas où une correspondance EXACTE existait et se
   * faisait battre. Quand le rapprochement approché est le SEUL indice, il
   * gagne encore : « un cadre cassé » rend la fiche des castes (« casse » ≈
   * « caste »), « j'ai monté une hausse » celle du rôle de la reine
   * (« monte » ≈ « ponte »), « entrée large » celle du comptage varroa
   * (« large » ≈ « lange »).
   *
   * Le seul remède serait de savoir que « casse » EST un mot français — donc
   * un lexique général, que ce dépôt refuse délibérément (cf. la note du
   * perturbateur : « y verser du français général serait un autre chantier,
   * avec son propre risque de fausses corrections »). Monter le plancher de
   * longueur à 6 les ferait disparaître au prix de deux questions du
   * perturbateur. Aucun des deux ne se décide dans un banc.
   */
});
