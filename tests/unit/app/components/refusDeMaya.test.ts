// ═══════════════════════════════════════════════════════════════════════════
// UN REFUS DE MAYA NOMME TOUJOURS SA PORTE DE SORTIE.
//
// ⚠️ IL Y EN AVAIT DEUX RENDUS, ET LA PORTE MANQUAIT DU CÔTÉ LE PLUS REGARDÉ.
//
// `POST /api/ia/copilote` est gaté sur `copiloteIa`, faux en Découverte : le
// serveur répond 402 `PLAN_REQUIRED` avec une phrase qui nomme la formule,
// mais pas l'endroit où l'on change.
//
// La page `/copilote` compensait — titre, phrase, bouton « Voir les plans ».
// La BULLE, montée sur toutes les pages, n'affichait qu'un cadenas et la
// phrase nue. Un compte Découverte cliquait l'une des trois amorces qu'elle
// lui tend, voyait sa question DISPARAÎTRE du fil, et restait devant un encart
// miel sans rien de cliquable.
//
// Le défaut n'est pas le bouton oublié : c'est le refus rendu DEUX FOIS. Ce
// banc garde donc la règle, pas le composant — il refuse qu'une surface
// remette son propre rendu.
// ═══════════════════════════════════════════════════════════════════════════

import { execSync } from 'node:child_process';
import { describe, expect, it } from 'vitest';
import { corpsDuComposant } from '../../../helpers/corpsDuComposant';

const REFUS = 'app/components/ia/CopiloteRefus.vue';

/**
 * Le GABARIT seul, commentaires blanchis.
 *
 * ⚠️ LE SCRIPT NE COMPTE PAS ICI, et les confondre sur-accuserait. Toute
 * surface qui appelle `useCopilote()` déstructure `erreur` dans son script,
 * qu'elle l'affiche ou non : chercher le mot dans le corps entier ferait
 * tomber le banc sur des pages qui ne rendent aucun refus.
 * `corpsDuComposant` rend « gabarit + script » collés ; on reprend la part
 * gauche, jusqu'à la fermeture du gabarit.
 */
function gabaritSeul(corps: string): string {
  const fin = corps.lastIndexOf('</template>');
  return fin >= 0 ? corps.slice(0, fin) : '';
}

function gabaritDe(fichier: string): string {
  return gabaritSeul(corpsDuComposant(fichier));
}

/** Les surfaces qui affichent une erreur du copilote. */
function surfacesDuCopilote(): string[] {
  const fichiers = execSync('grep -rl "useCopilote" app --include=*.vue', { encoding: 'utf-8' })
    .trim()
    .split('\n')
    .filter(Boolean);
  return fichiers;
}

describe('garde-fou : le balayage voit bien les surfaces de Maya', () => {
  it('au moins deux surfaces utilisent le copilote', () => {
    /**
     * Sans ce cas, un motif de recherche cassé rendrait la liste vide et toute
     * la conformité « vérifiée » sur rien — « le balayage vide » de CLAUDE.md.
     * Il en faut DEUX : c'est précisément parce qu'il y en a deux que la porte
     * a pu n'exister que d'un côté.
     */
    const s = surfacesDuCopilote();
    expect(s.length, `balayage : ${s.join(', ')}`).toBeGreaterThanOrEqual(2);
  });
});

describe('contrôle positif : le découpage gabarit/script sépare bien', () => {
  it('un `erreur` qui ne vit QUE dans le script ne compte pas', () => {
    /**
     * ⚠️ SANS CE CAS, LE RÉTRÉCISSEMENT AU GABARIT DORT. Les deux surfaces
     * d'aujourd'hui rendent toutes deux le refus, donc regarder le corps entier
     * donne exactement le même vert — une mutation qui supprime le découpage ne
     * fait rien tomber. Or une troisième page pourrait déstructurer `erreur`
     * sans jamais l'afficher (pour la journaliser, par exemple) : la
     * sur-accuser la ferait ajouter un encart dont personne ne veut.
     */
    const corps = '<template>\n  <p>Bonjour</p>\n</template>\nconst { erreur } = useCopilote();';
    expect(/\berreur\b/.test(gabaritSeul(corps)), 'le script ne doit pas compter').toBe(false);
    expect(/\berreur\b/.test(corps), 'et le corps entier, lui, le contient bien').toBe(true);
  });

  it('un `erreur` AFFICHÉ, lui, compte', () => {
    // Le contre-test : sans lui, un `gabaritSeul` qui rendrait toujours '' —
    // donc ne verrait plus rien — satisferait le cas précédent.
    const corps =
      '<template>\n  <p v-if="erreur">{{ erreur.message }}</p>\n</template>\nconst x = 1;';
    expect(/\berreur\b/.test(gabaritSeul(corps))).toBe(true);
  });
});

describe('aucune surface ne remet son propre rendu du refus', () => {
  it('toute surface qui affiche `erreur` passe par le composant partagé', () => {
    /**
     * ⚠️ ON GARDE LA RÈGLE, PAS LE COMPOSANT. Exiger « la bulle contient un
     * lien vers /tarifs » aurait laissé la porte de la PAGE dériver à son tour,
     * et la prochaine surface naître sans rien. On exige que le refus soit
     * rendu à UN SEUL endroit.
     */
    const fautives: string[] = [];
    for (const f of surfacesDuCopilote()) {
      const gabarit = gabaritDe(f);
      if (!/\berreur\b/.test(gabarit)) continue;
      if (!/CopiloteRefus/.test(gabarit)) fautives.push(f);
    }

    expect(
      fautives,
      'cette surface rend le refus elle-même : c’est ainsi que la bulle s’est ' +
        'retrouvée sans bouton pendant que la page en avait un. Un refus se rend ' +
        'par `IaCopiloteRefus`, une fois.',
    ).toEqual([]);
  });

  it('le composant partagé porte bien une issue vers les formules', () => {
    /**
     * Le contre-test du précédent : sans lui, un `CopiloteRefus` vidé de son
     * bouton satisferait la règle « une seule surface » tout en remurant la
     * porte partout à la fois — en pire, puisque des deux côtés.
     */
    expect(gabaritDe(REFUS), 'le refus doit mener quelque part').toMatch(/to="\/tarifs"/);
  });

  it('une panne RÉSEAU n’envoie PAS l’apiculteur payer un abonnement', () => {
    /**
     * ⚠️ LA MOITIÉ QU'ON OUBLIE. `useCopilote` pose aussi « Connexion
     * interrompue » — sans code. Proposer « Voir les plans » là-dessus ferait
     * payer une formule pour un tunnel : le pire conseil possible, celui qui
     * envoie chercher au mauvais endroit ET coûte de l'argent.
     *
     * On lit le script du composant : la liste des codes qui ouvrent l'issue
     * doit exister, et ne contenir que des codes de FORMULE.
     */
    const corps = corpsDuComposant(REFUS);
    const codes = [...corps.matchAll(/'([A-Z_]{4,})'/g)].map((m) => m[1]!);
    expect(codes.length, 'aucun code lu — le rendu a dû changer de forme').toBeGreaterThan(0);
    for (const c of codes) {
      expect(
        /PLAN|QUOTA|LIMIT/.test(c),
        `« ${c} » ouvre la porte des formules sans être un mur de formule`,
      ).toBe(true);
    }
  });

  it('un refus SANS phrase en propose une quand même', () => {
    /**
     * ⚠️ `message` EST OPTIONNEL dans `ErreurApi`, et un mur muet est la pire
     * forme du refus que ce dépôt proscrit. Le composant doit porter un repli.
     */
    const corps = corpsDuComposant(REFUS);
    expect(corps, 'un repli de phrase doit exister').toMatch(/message\?\.trim\(\)\s*\|\|/);
    expect(corps, 'et il doit dire OÙ aller').toMatch(/Abonnement/);
  });
});
