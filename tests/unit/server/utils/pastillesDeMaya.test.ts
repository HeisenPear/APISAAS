// ═══════════════════════════════════════════════════════════════════════════
// ON CLIQUE POUR LIRE, ET MAYA PROPOSE D'ÉCRIRE.
//
// Sous chaque réponse de savoir, Maya affiche des pastilles « Voir aussi ».
// Elles ne portent pas d'identifiant : les toucher RENVOIE LEUR LIBELLÉ au
// moteur, exactement comme si l'apiculteur l'avait tapé. Le libellé est donc
// reclassé — et deux d'entre eux étaient lus comme des ORDRES :
//
//   · « Vendre son miel »     → formulaire de VENTE
//   · « Déclarer ses ruches » → création d'une RUCHE
//
// La seconde est la pire. La fiche parle de l'obligation légale de déclarer
// son cheptel chaque année sur le téléservice national ; on touche la pastille
// pour lire la règle, et Maya propose d'enregistrer une colonie de plus. Deux
// gestes n'ayant rien à voir, sous le même mot.
//
// Rien ne s'écrivait sans confirmation — l'architecture l'interdit — mais la
// promesse de la pastille était rompue : elle annonce une LECTURE.
//
// À la mesure, cinq titres de fiche sur cent dix-huit ouvraient un formulaire
// d'écriture quand on les tapait au caractère près (« Extraire et mettre le
// miel en pot », « Acheter un essaim ou une ruche peuplée », « Corps de ruche
// et hausses »). Ce n'était donc pas deux libellés malheureux, c'était une
// classe.
//
// ⚠️ LE BALAYAGE PART DE `SAVOIR`, JAMAIS D'UNE LISTE ÉCRITE ICI : une
// pastille ajoutée demain est mesurée le jour même.
// ═══════════════════════════════════════════════════════════════════════════

import { describe, expect, it } from 'vitest';
import { classifierTour } from '~~/server/utils/copilote-local';
import { SAVOIR } from '~~/server/utils/copilote-savoir';

/** Ce que ferait un clic sur une pastille portant ce libellé. */
function auClic(libelle: string) {
  return classifierTour([{ role: 'user', content: libelle }]);
}

/**
 * Une pastille est FAUTIVE si elle mène ailleurs que sur une lecture.
 *
 * · `ecriture`, `lot`, `choisir_type` : elle ouvre un formulaire — la faute
 *   qui a produit ce banc ;
 * · `inconnu`, `suggestion` : elle ne mène nulle part, ce qui est une impasse
 *   affichée comme une piste.
 *
 * `action` et `navigation` sont ACCEPTÉS : les fiches qui expliquent APIGO
 * proposent délibérément « Mes stocks » ou « Quelles alertes en cours ? », et
 * y renvoyer est le bon produit.
 */
const KINDS_FAUTIFS = ['ecriture', 'lot', 'choisir_type', 'inconnu', 'suggestion'];

function pastilleFautive(libelle: string): string | null {
  const d = auClic(libelle);
  return KINDS_FAUTIFS.includes(d.kind) ? d.kind : null;
}

/** Toutes les pastilles déclarées, dédoublonnées, avec la fiche qui les porte. */
function toutesLesPastilles(): { fiche: string; libelle: string }[] {
  const vues = new Set<string>();
  const out: { fiche: string; libelle: string }[] = [];
  for (const a of SAVOIR) {
    for (const libelle of a.voirAussi ?? []) {
      if (vues.has(libelle)) continue;
      vues.add(libelle);
      out.push({ fiche: a.id, libelle });
    }
  }
  return out;
}

describe('garde-fou : le balayage voit les pastilles, et sait en refuser une', () => {
  it('il y a bien des pastilles à mesurer', () => {
    /**
     * Sans ce cas, un `voirAussi` renommé rendrait la liste vide et les règles
     * ci-dessous seraient « vérifiées » sur zéro pastille.
     */
    expect(
      toutesLesPastilles().length,
      'aucune pastille lue — le balayage ne mesure plus rien',
    ).toBeGreaterThan(50);
  });

  it('⚠️ CONTRÔLE POSITIF — un libellé qui EST un ordre est vu fautif', () => {
    /**
     * LE CAS QUI EMPÊCHE CE BANC D'ÊTRE DÉCORATIF. Si `pastilleFautive`
     * répondait toujours « non », la règle serait verte sur le moteur d'hier,
     * celui qui ouvrait un formulaire de vente sur « Vendre son miel ».
     */
    expect(
      pastilleFautive('note un contrôle sur la ruche 3'),
      'un ordre d’écriture manifeste n’est pas détecté : le détecteur ne mesure rien',
    ).toBe('ecriture');
    expect(pastilleFautive('zqxjw plok mnbv'), 'un libellé qui ne mène nulle part').toBe('inconnu');
  });

  it('un VRAI ordre d’écriture écrit toujours', () => {
    /**
     * ⚠️ LA RÈGLE MARCHE DANS LES DEUX SENS. Le correctif fait qu'un titre de
     * fiche, au caractère près, ouvre sa fiche. Une version trop large de ce
     * garde — sur une ressemblance plutôt qu'une égalité — aurait avalé les
     * ordres réels, et Maya aurait cessé d'écrire quoi que ce soit.
     */
    const d = auClic('note un contrôle sur la ruche 3, force 4, calme');
    expect(d.kind, 'un ordre complet doit rester une écriture').toBe('ecriture');
  });
});

describe('la RÈGLE : une pastille « Voir aussi » mène à une LECTURE', () => {
  it('aucune pastille n’ouvre un formulaire ni ne tombe dans le vide', () => {
    const fautives = toutesLesPastilles()
      .map(({ fiche, libelle }) => ({ fiche, libelle, faute: pastilleFautive(libelle) }))
      .filter((x) => x.faute)
      .map((x) => `${x.fiche} :: « ${x.libelle} » → ${x.faute}`);

    expect(
      fautives,
      'Une pastille « Voir aussi » annonce une lecture. Celle qui ouvre un ' +
        'formulaire trahit ce qu’elle affiche : on touchait « Déclarer ses ruches » ' +
        'pour lire l’obligation légale annuelle, et Maya proposait de créer une colonie.',
    ).toEqual([]);
  }, 60_000);
});

describe('la RÈGLE : un TITRE de fiche, au caractère près, ouvre sa fiche', () => {
  it('les cent dix-huit titres rendent chacun leur propre fiche', () => {
    /**
     * C'est ce qui ferme la classe entière plutôt que les deux libellés
     * repérés : une pastille porte souvent un titre, et un titre est la
     * référence la plus précise possible à une fiche. Cinq d'entre eux
     * ouvraient un formulaire.
     */
    const rates = SAVOIR.map((a) => ({ a, d: auClic(a.titre) }))
      .filter(({ a, d }) => !(d.kind === 'savoir' && d.articleId === a.id))
      .map(({ a, d }) => `${a.id} :: « ${a.titre} » → ${d.kind}`);

    expect(
      rates,
      'un titre de fiche qui n’ouvre pas sa fiche rend cette fiche inatteignable ' +
        'par la référence la plus explicite qui soit',
    ).toEqual([]);
  }, 60_000);
});

describe('l’histoire : les deux pastilles qui ouvraient un formulaire', () => {
  it('« Vendre son miel » ouvre la fiche, pas le formulaire de vente', () => {
    const d = auClic('Vendre son miel');
    expect(d.kind).toBe('savoir');
    expect(d.kind === 'savoir' && d.articleId).toBe('vente-miel');
  });

  it('« Déclarer ses ruches » ouvre la fiche de l’obligation annuelle', () => {
    /**
     * Le libellé abrégé n'était le titre d'AUCUNE fiche : il a été aligné sur
     * le titre exact aux quatre endroits où il figurait.
     */
    const d = auClic('Déclarer ses ruches (obligation annuelle)');
    expect(d.kind === 'savoir' && d.articleId).toBe('declaration-ruches');
  });

  it('les trois autres titres qui ouvraient une intervention', () => {
    for (const [titre, id] of [
      ['Extraire et mettre le miel en pot', 'extraction-miel'],
      ['Acheter un essaim ou une ruche peuplée', 'acheter-essaim'],
      ['Corps de ruche et hausses', 'corps-hausses'],
    ] as const) {
      const d = auClic(titre);
      expect(d.kind === 'savoir' && d.articleId, `« ${titre} »`).toBe(id);
    }
  });
});
