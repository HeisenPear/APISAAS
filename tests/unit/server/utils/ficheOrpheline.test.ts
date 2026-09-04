// ═══════════════════════════════════════════════════════════════════════════
// UNE FICHE DE SAVOIR QUE SES PROPRES MOTS-CLÉS N'ATTEIGNENT PAS EST MORTE —
// ET SA LISTE DE MOTS-CLÉS EST UN MENSONGE.
//
// Ce banc existe à cause d'un conseil dangereux, resté invisible des mois.
//
// La fiche `frelon-europeen` porte le binôme latin « vespa crabro » dans ses
// mots-clés. Mais `SYNONYMES` contenait `crabro: 'frelon'`, et
// `appliquerSynonymes` court AVANT la recherche : le terme le plus précis du
// domaine était détruit avant d'avoir pu être comparé. Le point partait au mot
// nu « frelon », qui n'appartenait alors qu'à la fiche de l'espèce INVASIVE.
//
// Résultat : « vespa crabro », « frelon brun », « gros frelon jaune » — et
// jusqu'à la question qu'on pose vraiment au rucher, « c'est un frelon
// européen ou asiatique ? » — servaient toutes muselières, harpes électriques
// et « destruction des nids par des professionnels », pour une espèce
// indigène qu'une colonie forte supporte très bien. La fiche écrite exprès
// pour ce cas — « détruire son nid n'est pas une obligation » — était
// INATTEIGNABLE : aucune formulation ne la rendait.
//
// Le corpus ne pouvait pas l'attraper : il mesure les questions qu'on a pensé
// à écrire. Ici, ce sont les mots-clés du dépôt LUI-MÊME qui accusaient le
// moteur, et personne ne les faisait parler. C'est ce que ce banc fait :
// il retourne le fichier de savoir contre le moteur.
//
// ⚠️ LE BALAYAGE PART DE `SAVOIR`, JAMAIS D'UNE LISTE ÉCRITE ICI. Une fiche
// ajoutée demain est mesurée le jour même ; une liste recopiée l'aurait
// laissée passer — c'est la forme de faux vert qui a le plus coûté ici.
// ═══════════════════════════════════════════════════════════════════════════

import { describe, expect, it } from 'vitest';
import { classifierTour } from '~~/server/utils/copilote-local';
import { SAVOIR, type ArticleSavoir } from '~~/server/utils/copilote-savoir';

/**
 * Les deux formes sous lesquelles un apiculteur pose un mot-clé : le mot seul
 * (barre de recherche, dictée courte) et la question qui l'entoure.
 *
 * ⚠️ LES DEUX, ET C'EST UNE CONCESSION MOTIVÉE. « suivi des stocks » ouvre —
 * à raison — la PAGE des stocks : la navigation gagne, et c'est le bon
 * produit. Exiger le mot nu condamnerait donc une fiche parfaitement saine,
 * et la seule issue serait de la dispenser à la main. On préfère mesurer ce
 * qui compte vraiment : la fiche est-elle atteignable par UNE formulation de
 * l'un de ses propres mots ? « c'est quoi un seuil d'alerte ? » la rend.
 */
function formulations(cle: string): string[] {
  return [cle, `c est quoi ${cle} ?`, `explique moi ${cle}`];
}

/**
 * La fiche gagne-t-elle sur cette formulation ?
 *
 * ⚠️ `savoir` OU `clarification`, ET RIEN D'AUTRE.
 *
 * · `clarification` compte : elle NOMME la fiche et la met à un geste. C'est
 *   ce qui arrive, à dessein, sur le mot nu « frelon » — il appartient
 *   vraiment aux deux espèces, et demander laquelle est la bonne réponse.
 * · `suggestion` NE compte PAS, et c'est ce qui donne sa force à ce banc.
 *   Le repli « près du but » liste les fiches à ≥ 2 points d'une question
 *   INCOMPRISE : presque toute fiche y figure sur son propre mot-clé.
 *   L'accepter aurait rendu ce balayage vert quoi qu'il arrive — y compris
 *   le jour du frelon.
 */
function atteintPar(phrase: string, fiche: Pick<ArticleSavoir, 'id' | 'titre'>): boolean {
  const d = classifierTour([{ role: 'user', content: phrase }]);
  if (d.kind === 'savoir') return d.articleId === fiche.id;
  if (d.kind === 'clarification') return d.titres.includes(fiche.titre);
  return false;
}

/** Les mots-clés de la fiche qui la rendent effectivement, sous une forme au moins. */
function clesQuiAtteignent(fiche: ArticleSavoir): string[] {
  return fiche.motsCles.filter((cle) => formulations(cle).some((p) => atteintPar(p, fiche)));
}

/**
 * La même question, mais en s'arrêtant au premier mot-clé qui gagne.
 *
 * ⚠️ CE N'EST PAS UNE OPTIMISATION GRATUITE : le balayage complet fait
 * 118 fiches × ~14 mots-clés × 3 formulations, soit près de cinq mille
 * classifications. Sans sortie anticipée il dépasse le délai de Vitest —
 * et un banc qui expire est un banc qu'on finit par désactiver.
 */
function estAtteignable(fiche: ArticleSavoir): boolean {
  return fiche.motsCles.some((cle) => formulations(cle).some((p) => atteintPar(p, fiche)));
}

describe('garde-fou : le balayage voit bien le savoir, et sait dire NON', () => {
  it('le corpus de fiches est là', () => {
    /**
     * Sans ce cas, un import cassé rendrait `SAVOIR` vide et la règle
     * ci-dessous serait « vérifiée » sur zéro fiche. C'est le balayage vide,
     * la forme de faux vert la plus banale de ce dépôt.
     */
    expect(SAVOIR.length, 'aucune fiche lue — le balayage ne mesure plus rien').toBeGreaterThan(
      100,
    );
    expect(
      SAVOIR.every((a) => a.motsCles.length > 0),
      'une fiche sans mot-clé passerait la règle par forfait',
    ).toBe(true);
  });

  it('une fiche réellement atteignable est vue atteignable', () => {
    const varroa = SAVOIR.find((a) => a.id === 'traitement-varroa');
    expect(varroa, 'la fiche témoin a changé d’identifiant').toBeDefined();
    expect(clesQuiAtteignent(varroa!).length).toBeGreaterThan(0);
  });

  it('⚠️ CONTRÔLE POSITIF — une fiche dont les mots sont volés est vue ORPHELINE', () => {
    /**
     * LE CAS QUI EMPÊCHE CE BANC D'ÊTRE DÉCORATIF. Si `atteintPar` répondait
     * « oui » à tout — un `kind === 'savoir'` sans comparer l'identifiant,
     * par exemple — la règle ci-dessous serait verte sur n'importe quel
     * moteur, y compris celui qui envoyait les crabro chez l'invasive.
     *
     * On fabrique donc une fiche dont les mots-clés appartiennent, en fait,
     * à quelqu'un d'autre : « mes stocks » ouvre la page des stocks,
     * « vespa velutina » rend la fiche du frelon asiatique. Une seule
     * réponse est acceptable : orpheline.
     */
    const fantome = {
      id: 'fiche-fantome-qui-n-existe-pas',
      titre: 'Fiche fantôme',
      motsCles: ['mes stocks', 'vespa velutina', 'varroa'],
    } as ArticleSavoir;
    expect(
      clesQuiAtteignent(fantome),
      'le détecteur répond « atteignable » à une fiche que RIEN ne rend : il ne mesure rien',
    ).toEqual([]);
  });
});

describe('la RÈGLE : aucune fiche orpheline', () => {
  it('chaque fiche de savoir est rendue par au moins un de ses propres mots-clés', () => {
    const orphelines = SAVOIR.filter((a) => !estAtteignable(a)).map(
      (a) => `${a.id} — « ${a.titre} » (${a.motsCles.length} mots-clés, aucun ne la rend)`,
    );

    expect(
      orphelines,
      'Une fiche que ses propres mots-clés n’atteignent pas est du texte mort : ' +
        'personne ne la lira jamais, et le moteur répond à sa place — parfois par ' +
        'le contraire. C’est ainsi que « vespa crabro » a conseillé pendant des mois ' +
        'la destruction payante des nids d’une espèce indigène et protégée.',
    ).toEqual([]);
  });
});

describe('l’histoire : les deux frelons ne se confondent plus', () => {
  const EUROPEEN = 'frelon-europeen';
  const ASIATIQUE = 'frelon-asiatique';

  function fiche(phrase: string): string {
    const d = classifierTour([{ role: 'user', content: phrase }]);
    if (d.kind === 'savoir') return d.articleId;
    if (d.kind === 'clarification') return `clarification: ${d.titres.join(' | ')}`;
    return d.kind;
  }

  it('le binôme latin de l’INDIGÈNE n’est plus réécrit', () => {
    /**
     * Le défaut exact : `crabro: 'frelon'` détruisait le terme le plus précis
     * du domaine avant la recherche.
     */
    expect(fiche('vespa crabro'), 'le binôme latin doit rendre l’espèce qu’il désigne').toBe(
      EUROPEEN,
    );
  });

  it('les mots de terrain de l’indigène rendent sa fiche', () => {
    for (const p of ['frelon brun', 'gros frelon jaune', 'frelon local', 'frelon europeen']) {
      expect(fiche(p), `« ${p} » désigne l’espèce indigène`).toBe(EUROPEEN);
    }
  });

  it('la question qu’on pose VRAIMENT au rucher ne tranche pas à notre place', () => {
    /**
     * « C'est un frelon européen ou asiatique ? » est la question de
     * l'apiculteur qui vient de voir l'insecte. Y répondre par la fiche de
     * l'invasive, c'est répondre « asiatique » à quelqu'un qui demande
     * comment distinguer — et l'envoyer commander une destruction.
     */
    const r = fiche('c est un frelon europeen ou asiatique');
    expect(r, 'on doit soit départager, soit servir la fiche qui compare').not.toBe(ASIATIQUE);
  });

  it('l’INVASIVE, elle, reste servie sur ce qui la désigne', () => {
    /**
     * ⚠️ LE GATING MARCHE DANS LES DEUX SENS. Un correctif qui aurait fait
     * disparaître la fiche asiatique aurait été pire que le défaut : c'est
     * elle qui coûte des colonies.
     */
    expect(fiche('vespa velutina')).toBe(ASIATIQUE);
    expect(fiche('museliere')).toBe(ASIATIQUE);
    expect(fiche('comment proteger mes ruches des frelons')).toBe(ASIATIQUE);
  });

  it('le mot NU appartient aux deux — on demande, on ne devine pas', () => {
    /**
     * « frelon » seul est ambigu et doit le rester. Le retirer d'une des deux
     * fiches faisait tomber « frelon » en INCOMPRIS : on aurait échangé un
     * mauvais conseil contre pas de conseil du tout.
     */
    expect(fiche('frelon')).toMatch(/^clarification: /);
    expect(fiche('les frelons attaquent mes ruches')).toMatch(/^clarification: /);
  });
});
