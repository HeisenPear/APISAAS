import { describe, it, expect } from 'vitest';
import { execSync } from 'node:child_process';
import { corpsDuComposant } from '../../../helpers/corpsDuComposant';

/**
 * UN COMPOSABLE NUXT APPELÉ DEPUIS UN RAPPEL DU NAVIGATEUR TIENT À UN FIL.
 *
 * ⚠️ CE BANC A FAILLI RACONTER UNE HISTOIRE FAUSSE, ET LA VRAIE EST PLUS UTILE.
 *
 * En réparant le réveil vocal j'ai mis `useToast().add({…})` dans `r.onerror`,
 * puis je me suis corrigé en annonçant un plantage : `useToast()` passe par
 * `useState()`, donc par `useNuxtApp()`, qui se termine bien par
 * `throw new Error('[nuxt] instance unavailable')`. Sauf que ce `throw` ne part
 * PAS côté navigateur. Lecture faite des sources de Nuxt :
 *
 *   · `getNuxtAppCtx` crée son contexte avec `asyncContext: … && import.meta.server`
 *     — donc `false` sur le client, pas d'AsyncLocalStorage ;
 *   · côté client, `callWithNuxt` fait `nuxtAppCtx.set(nuxt)`, ce qui pose
 *     l'instance en SINGLETON dans une variable de fermeture ;
 *   · `unset()` n'est appelé nulle part dans le code client.
 *
 * Le contexte est donc disponible partout dans la page, y compris depuis un
 * rappel appelé par le navigateur. Le code d'origine fonctionnait.
 *
 * ALORS POURQUOI CE BANC ? Parce que ce qui le faisait fonctionner est un détail
 * d'implémentation non documenté, et qu'il tombe dans trois cas réels : si
 * `experimental.asyncContext` est activé, au rendu serveur, et en `multiApp`.
 * Un code juste par accident finit par cesser de l'être, et l'échec serait
 * alors une exception dans un gestionnaire d'erreur — l'endroit où l'on regarde
 * en dernier. La forme sûre coûte une ligne et existe déjà dans ce dépôt :
 * `useNotifications` et `usePostAction` résolvent le composable pendant le
 * setup et n'appellent plus que la fonction rendue.
 *
 * LA RÈGLE EST VOLONTAIREMENT LARGE : aucun `useXxx(` dans un corps de
 * gestionnaire. Pas de liste de composables « à risque » à tenir à jour — une
 * telle liste dériverait, et c'est le piège que CLAUDE.md interdit. Hisser
 * l'appel dans le setup est toujours correct, donc la règle ne coûte rien.
 */

/** Le corps `{…}` qui suit `depart`, par comptage d'accolades. */
function corpsDuGestionnaire(src: string, depart: number): string | null {
  const debut = src.indexOf('{', depart);
  if (debut < 0) return null;
  let niveau = 0;
  for (let i = debut; i < src.length; i++) {
    if (src[i] === '{') niveau++;
    else if (src[i] === '}') {
      niveau--;
      if (niveau === 0) return src.slice(debut, i + 1);
    }
  }
  return null;
}

/** `x.onerror = (e) => {` / `x.onload = async () => {` / `x.onend = fn => {` */
const GESTIONNAIRE = /\.\s*on[a-z]+\s*=\s*(?:async\s*)?(?:\([^)]*\)|[A-Za-z_$][\w$]*)\s*=>/g;
/** Tout appel de composable : `useToast(`, `useState(`, `useRoute(`… */
const APPEL_COMPOSABLE = /\buse[A-Z][A-Za-z0-9]*\s*\(/g;

const FICHIERS = execSync("find app server -type f \\( -name '*.ts' -o -name '*.vue' \\) | sort", {
  encoding: 'utf-8',
  maxBuffer: 8 * 1024 * 1024,
})
  .trim()
  .split('\n')
  .filter(Boolean);

interface Trouvaille {
  fichier: string;
  gestionnaire: string;
  appel: string;
}

function balayer(): { gestionnaires: number; fautes: Trouvaille[] } {
  let gestionnaires = 0;
  const fautes: Trouvaille[] = [];
  for (const fichier of FICHIERS) {
    const src = corpsDuComposant(fichier);
    GESTIONNAIRE.lastIndex = 0;
    for (const m of src.matchAll(GESTIONNAIRE)) {
      const corps = corpsDuGestionnaire(src, m.index + m[0].length);
      if (!corps) continue;
      gestionnaires++;
      for (const appel of corps.matchAll(APPEL_COMPOSABLE)) {
        fautes.push({
          fichier,
          gestionnaire: m[0].trim(),
          appel: appel[0].replace(/\s*\($/, ''),
        });
      }
    }
  }
  return { gestionnaires, fautes };
}

describe('aucun composable Nuxt appelé depuis un gestionnaire d’événement', () => {
  const { gestionnaires, fautes } = balayer();

  it('le balayage voit bien des fichiers (garde-fou)', () => {
    // ⚠️ SANS CE CAS, LE BANC S'AUTO-CONGRATULE. Un `find` qui ne rend rien, un
    // chemin de travail changé, une extension renommée : la liste des fautes
    // serait vide et le banc annoncerait une conformité qu'il n'a pas mesurée.
    // Ce dépôt s'est déjà fait avoir par un balayage vide.
    expect(FICHIERS.length, 'aucun fichier balayé').toBeGreaterThan(200);
  });

  it('le balayage trouve bien des gestionnaires (deuxième garde-fou)', () => {
    // Le premier garde-fou ne suffit pas : on peut lire 400 fichiers et ne
    // reconnaître AUCUN gestionnaire si l'expression régulière casse. La
    // conformité serait alors vraie par vacuité — l'exact défaut « le balayage
    // vide » de CLAUDE.md, une marche plus loin.
    expect(
      gestionnaires,
      'aucun gestionnaire reconnu : la règle ne mesure plus rien',
    ).toBeGreaterThan(25);
  });

  it('aucun `useXxx()` dans un corps de gestionnaire', () => {
    const lisible = fautes.map(
      (f) =>
        `${f.fichier} · ${f.gestionnaire} → ${f.appel}() lèvera « [nuxt] instance unavailable »`,
    );
    expect(
      lisible,
      'un composable Nuxt résolu depuis un rappel du navigateur ne tient que par un singleton ' +
        'non documenté (il jetterait sous asyncContext, au rendu serveur ou en multiApp) : ' +
        'capture-le en tête du setup (`const toast = useToast()`) et n’appelle que la fonction rendue',
    ).toEqual([]);
  });
});
