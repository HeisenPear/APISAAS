// ═══════════════════════════════════════════════════════════════════════════
// UN INTERRUPTEUR QUE PERSONNE NE LIT EST UN MENSONGE POLI.
//
// ─── CE QUI SE JOUAIT ICI ──────────────────────────────────────────────────
// La fenêtre de réglages de Maya (`MayaPresenceSettings.vue`) offre une section
// « Ce que Maya surveille » avec trois bascules :
//
//     Alertes critiques · Briefing du matin · Dictée vocale
//
// Elles s'enregistrent bien — `toggleSurveillance` écrit dans `localStorage`, et
// la position choisie revient à la visite suivante. C'est justement ce qui
// rendait le défaut invisible : tout AVAIT L'AIR de marcher.
//
// ⚠️ AUCUNE N'ÉTAIT LUE. Un balayage du dépôt ne trouvait `surveillance` que
// dans le magasin (qui l'écrit) et dans la fenêtre (qui l'affiche). Éteindre
// « Dictée vocale » laissait le micro à sa place ; éteindre « Briefing du
// matin » laissait Maya faire son point tous les matins.
//
// C'est le même défaut que l'événement que personne n'écoute, vu de l'autre
// bout : « brancher l'émetteur n'est que la moitié du travail ».
//
// ─── POURQUOI UN BALAYAGE, ET PAS TROIS CAS ────────────────────────────────
// Écrire « briefing est lu », « dictee est lu » en toutes lettres laisserait la
// QUATRIÈME bascule, celle qu'on ajoutera un jour, aussi morte que les trois
// premières — « la liste qui rétrécit en silence ». La liste des bascules est
// donc DÉRIVÉE du type `MayaSurveillance`, et toute clé qui n'est pas
// explicitement déclarée non branchée doit avoir un lecteur.
//
// ─── LES MUTATIONS QUI DOIVENT FAIRE ROUGIR ────────────────────────────────
//   · retirer `maya.dicteeAutorisee` de la bulle ou de la page Maya ;
//   · remettre `maya.proactif` à la place de `maya.briefingActif` au tableau
//     de bord ;
//   · ajouter une clé à `MayaSurveillance` sans la brancher ni la déclarer.
// ═══════════════════════════════════════════════════════════════════════════

import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { sansCommentaires } from '../../helpers/sansCommentaires';
import { corpsDuComposant } from '../../helpers/corpsDuComposant';

const MAGASIN = 'app/stores/maya.ts';

/**
 * Les bascules, LUES DANS LE TYPE — jamais recopiées.
 *
 * On prend le corps de l'interface `MayaSurveillance` : une clé ajoutée demain
 * entre d'office dans le balayage.
 */
export function basculesDeclarees(source: string): string[] {
  const src = sansCommentaires(source);
  const debut = src.indexOf('interface MayaSurveillance');
  if (debut < 0) return [];
  const bloc = src.slice(debut, src.indexOf('}', debut));
  return [...bloc.matchAll(/^\s*(\w+)\s*:\s*boolean/gm)].map((m) => m[1]!);
}

/**
 * LES BASCULES QU'ON SAIT NON BRANCHÉES, ET POURQUOI.
 *
 * ⚠️ UNE DISPENSE SE MOTIVE, SINON ELLE SE PROPAGE. Celle-ci ne dit pas « ce
 * fichier est difficile » : elle dit qu'il existe DÉJÀ un réglage serveur qui
 * fait le travail, et que brancher un second interrupteur local dessus
 * créerait deux vérités concurrentes.
 *
 * `alertes` promet « Maya te prévient même en pause » — des notifications
 * poussées. Elles sont commandées par `profils.pushNotifPrefs`
 * (`/api/alertes/notif-prefs`), qui fonctionne. Décider lequel des deux fait
 * autorité — ou retirer l'un des deux — est une décision de produit, pas une
 * correction de code.
 */
const NON_BRANCHEES = ['alertes'];

/** Les fichiers qui pourraient lire une bascule (tout sauf le magasin). */
function lecteursPossibles(): string[] {
  return execSync(
    'grep -rl "useMayaStore\\|maya\\." app/components app/pages app/composables app/layouts ' +
      '--include=*.vue --include=*.ts',
    { encoding: 'utf-8' },
  )
    .trim()
    .split('\n')
    .filter(Boolean);
}

/** Le texte utile d'un fichier : commentaires blanchis, gabarit compris. */
function texteUtile(fichier: string): string {
  return fichier.endsWith('.vue')
    ? corpsDuComposant(fichier)
    : sansCommentaires(readFileSync(fichier, 'utf-8'));
}

describe('la sonde voit ce qu’elle doit voir', () => {
  it('CONTRÔLE POSITIF : elle lit le type, et ne s’invente pas de bascules', () => {
    // Sans ces deux sources fabriquées, rendre la sonde aveugle (un motif qui ne
    // matche plus rien) donnerait une liste vide, et tout le balayage serait
    // « conforme » sur zéro cas.
    expect(basculesDeclarees('interface MayaSurveillance {\n  toto: boolean;\n}')).toEqual([
      'toto',
    ]);
    expect(
      basculesDeclarees('interface Autre {\n  toto: boolean;\n}'),
      'un autre type ne doit pas être confondu',
    ).toEqual([]);
  });

  it('GARDE-FOU : elle trouve bien les trois bascules du produit', () => {
    const cles = basculesDeclarees(readFileSync(MAGASIN, 'utf-8'));
    expect(cles).toEqual(expect.arrayContaining(['alertes', 'briefing', 'dictee']));
    expect(cles.length).toBeGreaterThanOrEqual(3);
  });

  it('GARDE-FOU : le balayage voit bien des fichiers', () => {
    expect(lecteursPossibles().length).toBeGreaterThan(5);
  });
});

describe('LA RÈGLE : une bascule offerte à l’apiculteur commande quelque chose', () => {
  it('chaque bascule branchée a une vue dédiée dans le magasin', () => {
    /**
     * ⚠️ ON VISE LA VUE, PAS LE MOT. Chercher « briefing » dans le dépôt le
     * trouverait dans la fenêtre de réglages, qui ne fait que l'AFFICHER — le
     * défaut d'origine, exactement. On exige donc que le magasin expose une
     * lecture dérivée (`briefingActif`, `dicteeAutorisee`), et qu'un écran
     * l'emploie : c'est la seule forme qui distingue « lu » de « montré ».
     */
    const magasin = sansCommentaires(readFileSync(MAGASIN, 'utf-8'));
    const branchees = basculesDeclarees(readFileSync(MAGASIN, 'utf-8')).filter(
      (k) => !NON_BRANCHEES.includes(k),
    );
    expect(
      branchees.length,
      'aucune bascule branchée : le balayage mesure du vide',
    ).toBeGreaterThan(0);

    const vues = [...magasin.matchAll(/const (\w+) = computed\(\(\) =>([^;]*)\);/g)];
    for (const cle of branchees) {
      const vue = vues.find(([, , corps]) => corps!.includes(`surveillance.value.${cle}`));
      expect(
        vue,
        `la bascule « ${cle} » n'a pas de vue dans le magasin : elle est écrite ` +
          `dans localStorage et relue par personne. L'apiculteur la bascule, et rien ` +
          `ne change.`,
      ).toBeDefined();
    }
  });

  it('chaque vue du magasin est EMPLOYÉE par un écran', () => {
    const magasin = sansCommentaires(readFileSync(MAGASIN, 'utf-8'));
    const branchees = basculesDeclarees(readFileSync(MAGASIN, 'utf-8')).filter(
      (k) => !NON_BRANCHEES.includes(k),
    );
    const fichiers = lecteursPossibles().map((f) => ({ f, texte: texteUtile(f) }));

    for (const cle of branchees) {
      const m = magasin.match(
        new RegExp(
          `const (\\w+) = computed\\(\\(\\) =>[^;]*surveillance\\.value\\.${cle}[^;]*\\);`,
        ),
      );
      const nomDeLaVue = m?.[1];
      expect(nomDeLaVue, `pas de vue pour « ${cle} »`).toBeDefined();

      const employeurs = fichiers.filter(
        ({ f, texte }) => f !== MAGASIN && texte.includes(`maya.${nomDeLaVue}`),
      );
      expect(
        employeurs.map((e) => e.f),
        `« ${nomDeLaVue} » (bascule « ${cle} ») n'est employée nulle part. Une vue ` +
          `dérivée que personne ne lit ne vaut pas mieux que la bascule morte ` +
          `qu'elle remplace.`,
      ).not.toEqual([]);
    }
  });

  it('TOUT écran qui montre le micro respecte la bascule, pas seulement un', () => {
    /**
     * ⚠️ LA RÈGLE PRÉCÉDENTE S'ARRÊTAIT JUSTE AVANT. Elle exige qu'AU MOINS UN
     * écran emploie la vue — et une mutation l'a prouvé : débrancher la bulle
     * la laissait VERTE, parce que la page Maya et le réveil vocal, eux,
     * l'employaient toujours. Or le micro s'affiche à DEUX endroits, et c'est
     * celui qu'on oublie qui rouvre le microphone d'un apiculteur qui l'a
     * refusé.
     *
     * La liste des écrans est DÉRIVÉE : tout `.vue` qui rend `dicteeSupportee`
     * montre le micro. Un troisième écran ajouté demain entre d'office.
     */
    const montrentLeMicro = lecteursPossibles().filter(
      (f) => f.endsWith('.vue') && texteUtile(f).includes('dicteeSupportee'),
    );
    expect(
      montrentLeMicro.length,
      'plus aucun écran ne rend le micro — le balayage mesure du vide',
    ).toBeGreaterThanOrEqual(2);

    const oublies = montrentLeMicro.filter((f) => !texteUtile(f).includes('dicteeAutorisee'));
    expect(
      oublies,
      'ces écrans affichent le micro sans regarder la bascule « Dictée vocale ». ' +
        'L’apiculteur l’éteint, et le bouton reste là.',
    ).toEqual([]);
  });

  it('les trois blocs du tableau de bord lisent LA MÊME condition', () => {
    /**
     * ⚠️ TROIS GARDES POUR UNE SEULE QUESTION, ET ILS ONT DIVERGÉ. Le point du
     * jour, le bilan du soir et le titre « Bonjour Antoine » se répondent :
     * quand Maya salue, le titre s'efface pour ne pas empiler deux bonjours.
     * Ils lisaient pourtant des conditions différentes.
     *
     *  · Couper « Briefing du matin » masquait la carte — mais pas le titre,
     *    qui restait effacé au nom d'une Maya devenue muette : la page
     *    s'ouvrait sans AUCUNE salutation.
     *  · Le bilan du soir ne vérifiait pas `copiloteIa` : un compte Découverte,
     *    qui n'a pas Maya, recevait son bilan de la journée quand même — le
     *    défaut déjà corrigé sur la carte du matin, resté ouvert sur sa jumelle.
     *
     * On exige donc UN SEUL symbole, et qu'il soit celui qui compose les deux
     * gardes. Un quatrième bloc ajouté demain avec sa propre condition tombe.
     */
    const page = corpsDuComposant('app/pages/dashboard.vue');
    const gardes = [...page.matchAll(/v-if="(!?\w+)(?: &&[^"]*)?"/g)]
      .map((m) => m[1]!.replace('!', ''))
      .filter((n) => /^maya/i.test(n));
    expect(
      gardes.length,
      'aucun garde Maya trouvé : le balayage mesure du vide',
    ).toBeGreaterThanOrEqual(3);
    expect(
      [...new Set(gardes)],
      'les blocs proactifs de Maya doivent lire la MÊME condition — sinon couper ' +
        'un réglage masque l’un sans démasquer l’autre.',
    ).toEqual(['mayaParle']);

    const source = sansCommentaires(readFileSync('app/pages/dashboard.vue', 'utf-8'));
    expect(source, 'et cette condition compose les deux gardes').toMatch(
      /const mayaParle = computed\(\(\) => maya\.briefingActif && aAcces\('copiloteIa'\)\)/,
    );
  });

  it('la dispense de « alertes » reste NOMMÉE, jamais silencieuse', () => {
    // Le jour où quelqu'un branche `alertes`, ce cas rougit et il faudra retirer
    // la dispense EN NOMMANT ce qui la rend inutile — c'est exactement le
    // contrôle qu'on veut d'une exception.
    const magasin = sansCommentaires(readFileSync(MAGASIN, 'utf-8'));
    for (const cle of NON_BRANCHEES) {
      expect(
        magasin.includes(`surveillance.value.${cle}`),
        `« ${cle} » est maintenant branchée : retire-la de NON_BRANCHEES.`,
      ).toBe(false);
    }
  });
});
