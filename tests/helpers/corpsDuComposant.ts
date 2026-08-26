import { readFileSync } from 'node:fs';
import { sansCommentaires } from './sansCommentaires';

/**
 * Le GABARIT et le SCRIPT d'un composant, commentaires blanchis, style exclu.
 *
 * ⚠️ POURQUOI CE FICHIER EXISTE, ET CE QU'IL RÉPARE.
 *
 * `sansCommentaires` suit l'état des chaînes — obligatoire en JavaScript, où
 * `'/conformite/*'` ouvrirait sinon un faux commentaire de bloc. Mais un
 * gabarit Vue n'est pas du JavaScript : son TEXTE est en français, et le
 * français est plein d'apostrophes droites.
 *
 *     <p>Suivez l'état de vos ruches</p>       ← ce ' ouvre une « chaîne »
 *     ...
 *     // ⚠️ cette ligne cite « Assistant apicole » pour l'interdire
 *
 * L'apostrophe de « l'état » ouvre une chaîne qui court jusqu'à la suivante ;
 * entre les deux, un commentaire n'est plus reconnu comme tel, et son contenu
 * est lu comme du code. Un banc de vocabulaire s'accuse alors lui-même en
 * trouvant, dans la note qui interdit un mot, le mot interdit.
 *
 * C'EST ARRIVÉ. Le banc `mayaUnSeulNom` a dénoncé `LandingComparison.vue` pour
 * une occurrence qui vivait dans un commentaire `//` expliquant précisément
 * pourquoi ce mot ne devait plus servir. Sixième fois que ce dépôt se fait
 * prendre par cette famille de piège — d'où l'extraction ici.
 *
 * LA RÉPARATION tient au découpage : on traite chaque section avec l'outil qui
 * la comprend.
 *   · `<template>` → les commentaires HTML par expression régulière (ils ne
 *     s'imbriquent pas, la règle est exacte) et RIEN d'autre : aucun analyseur
 *     de chaînes n'a affaire à du texte français ;
 *   · `<script>`   → `sansCommentaires`, qui est chez lui ;
 *   · `<style>`    → écarté (il ne porte pas de promesse au client).
 */
export function corpsDuComposant(fichier: string): string {
  const source = readFileSync(fichier, 'utf-8');

  const debutT = source.indexOf('<template>');
  const finT = source.lastIndexOf('</template>');
  const gabarit =
    debutT >= 0 && finT > debutT
      ? source.slice(debutT, finT + '</template>'.length).replace(/<!--[\s\S]*?-->/g, ' ')
      : '';

  const debutS = source.search(/<script[^>]*>/);
  let script = '';
  if (debutS >= 0) {
    const ouvrant = source.slice(debutS).match(/<script[^>]*>/)![0];
    const finS = source.indexOf('</script>', debutS);
    if (finS > debutS) {
      script = sansCommentaires(source.slice(debutS + ouvrant.length, finS));
    }
  }

  // Un `.ts` pur n'a ni template ni script : on le blanchit tel quel.
  if (!gabarit && !script) return sansCommentaires(source);

  return `${gabarit}\n${script}`;
}
