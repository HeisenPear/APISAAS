// ═══════════════════════════════════════════════════════════════════════════
// CE QU'ON MET DANS LA BOUCHE DE MAYA DOIT EXISTER DANS SON MOTEUR.
//
// ⚠️ UN CALCUL QUI N'EXISTE NULLE PART A ÉTÉ VENDU PENDANT DES SEMAINES.
//
// Le chapitre 05 faisait dire à Maya, dans une VRAIE bulle du produit :
// « J'ai calculé le délai avant récolte — 12 juin. » Aucun calcul de ce genre
// n'existe dans son chemin. Les slots d'un traitement demandent le produit, le
// numéro de lot et le dosage ; l'aperçu ne liste que la ruche, le type et les
// champs saisis. Le champ `delaiAttenteJours` du référentiel n'a qu'UN lecteur
// dans tout le dépôt : le formulaire d'ordonnance, saisi à la main, hors de Maya.
//
// L'apiculteur retenait de la page que Maya répond à la question de conformité
// qui l'inquiète, souscrivait, dictait son traitement — et n'entendait plus
// jamais parler de la date.
//
// ⚠️ ET LE CHAPITRE NE PORTAIT PAS LA MENTION « Exemple » que porte son voisin.
// Un fil dessiné dans les vraies bulles du produit se lit comme une capture
// d'écran : ce qu'il montre est pris pour ce que Maya fait.
// ═══════════════════════════════════════════════════════════════════════════

import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { corpsDuComposant } from '../../../helpers/corpsDuComposant';
import { sansCommentaires } from '../../../helpers/sansCommentaires';

/** Les chapitres qui dessinent un fil de discussion dans les bulles du produit. */
function chapitresAvecFil(): string[] {
  return execSync('grep -rl "bulle-maya\\|maya-msg-in\\|act-primaire" app/components/landing', {
    encoding: 'utf-8',
  })
    .trim()
    .split('\n')
    .filter(Boolean);
}

describe('garde-fou : le balayage voit bien des chapitres', () => {
  it('au moins deux chapitres dessinent un fil', () => {
    // Sans lui, un motif cassé rendrait la liste vide et toute la conformité
    // « vérifiée » sur rien.
    expect(chapitresAvecFil().length).toBeGreaterThanOrEqual(2);
  });
});

describe('un fil dessiné dans les bulles du produit se signale comme EXEMPLE', () => {
  it('chaque chapitre qui montre une conversation porte la mention', () => {
    const muets = chapitresAvecFil().filter((f) => !/Exemple/i.test(corpsDuComposant(f)));
    expect(
      muets,
      'un fil dessiné dans les vraies bulles se lit comme une capture d’écran : ' +
        'sans mention, ce qu’il montre est pris pour ce que Maya fait.',
    ).toEqual([]);
  });
});

describe('aucune capacité inventée dans la bouche de Maya', () => {
  it('« délai avant récolte » ne doit revenir NULLE PART sur la landing', () => {
    /**
     * ⚠️ LA RÈGLE EST NOMMÉE, PAS GÉNÉRIQUE — et son motif est écrit. Maya ne
     * calcule aucun délai d'attente : le champ `delaiAttenteJours` du
     * référentiel n'est lu que par le formulaire d'ordonnance. Le jour où le
     * moteur saura le faire, ce cas rougira et il faudra le retirer EN
     * NOMMANT la fonction qui le rend vrai — c'est exactement le contrôle
     * qu'on veut.
     */
    const source = execSync('grep -rl "" app/components/landing --include=*.vue', {
      encoding: 'utf-8',
    })
      .trim()
      .split('\n')
      .filter(Boolean);

    expect(source.length, 'balayage vide').toBeGreaterThan(5);

    const fautifs = source.filter((f) => /délai avant récolte/i.test(corpsDuComposant(f)));
    expect(
      fautifs,
      'Maya ne calcule aucun délai d’attente avant récolte — le seul lecteur de ' +
        '`delaiAttenteJours` est le formulaire d’ordonnance, saisi à la main.',
    ).toEqual([]);
  });

  it('et le moteur ne le calcule toujours pas — sinon ce banc doit changer', () => {
    /**
     * ⚠️ LE CONTRE-TEST DU PRÉCÉDENT. Sans lui, implémenter le calcul
     * laisserait l'interdiction en place et empêcherait d'en parler. On lit la
     * VÉRITÉ : combien de fichiers, hors le formulaire d'ordonnance, lisent le
     * délai d'attente du référentiel ?
     */
    /**
     * ⚠️ ON BLANCHIT LES COMMENTAIRES AVANT DE COMPTER, et l'oublier a fait
     * tomber ce banc dans la minute : le commentaire de `MayaParle.vue` qui
     * EXPLIQUE la correction cite forcément le nom du champ. Le banc
     * s'accusait lui-même — la forme de faux vert tombée six fois ici.
     */
    const lecteurs = execSync(
      'grep -rl "delaiAttenteJours" app server --include=*.ts --include=*.vue || true',
      { encoding: 'utf-8' },
    )
      .trim()
      .split('\n')
      .filter(Boolean)
      .filter((f) => !f.endsWith('app/config/medicaments-apicoles.ts'))
      .filter((f) =>
        f.endsWith('.vue')
          ? /delaiAttenteJours/.test(corpsDuComposant(f))
          : /delaiAttenteJours/.test(sansCommentaires(readFileSync(f, 'utf-8'))),
      );

    expect(
      lecteurs,
      'un lecteur de plus est apparu : si c’est le moteur de Maya, la phrase de ' +
        'la landing redevient vraie et ce banc doit être rouvert en le nommant.',
    ).toEqual(['app/pages/conformite/ordonnances.vue']);
  });
});
