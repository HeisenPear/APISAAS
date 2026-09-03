import { describe, expect, it } from 'vitest';
import {
  alertesDuControle,
  alertesLeveesPar,
  FORCE_COLONIE_CRITIQUE,
} from '../../../../server/utils/alertesControle';
import { annulationAutorisee, TYPES_ANNULABLES } from '../../../../server/utils/annulationRegle';

// ═══════════════════════════════════════════════════════════════════════════
// UN CONTRÔLE QUI LÈVE UNE ALERTE NE SE DÉFAIT PAS.
//
// ⚠️ LA RÈGLE SE CONTREDISAIT ELLE-MÊME. `annulationRegle.ts` déclare : « ne
// sont réversibles que les types dont le handler n'écrit QUE dans le hub ». Et
// sa liste blanche contenait `controle`, dont le gestionnaire lève deux alertes
// dans la table `alertes`.
//
// Vécu : « ruche 3, j'ai vu des cellules royales » est une phrase DICTABLE.
// `controle` étant annulable, Maya l'écrivait en AUTONOMIE, levait une alerte
// « risque d'essaimage imminent » en priorité haute, et proposait « Annuler ».
// Le clic supprimait la visite et laissait l'alerte — rattachée à une visite
// qui n'existait plus, sans aucun moyen de faire le lien.
// ═══════════════════════════════════════════════════════════════════════════

const T0 = new Date('2026-06-01T10:00:00Z');
const dans = (ms: number) => new Date(T0.getTime() + ms);

describe('garde-fou : un contrôle ORDINAIRE ne lève rien', () => {
  it('ne rend aucune alerte sur une visite sans souci', () => {
    // Sans ce cas, une fonction qui lèverait TOUJOURS une alerte rendrait les
    // cas de refus ci-dessous vacuement verts — et surtout, elle ferait
    // repasser par « Confirmer » le geste le plus fréquent de la saison.
    expect(alertesDuControle({})).toEqual([]);
    expect(alertesDuControle({ celluleRoyale: false, forceColonie: 4 })).toEqual([]);
    expect(alertesLeveesPar('controle', { celluleRoyale: false, forceColonie: 3 })).toBe(0);
  });
});

describe('ce qui lève une alerte', () => {
  it('des cellules royales', () => {
    const a = alertesDuControle({ celluleRoyale: true });
    expect(a).toHaveLength(1);
    expect(a[0]!.type).toBe('cellule_royale');
    expect(a[0]!.priorite).toBe('haute');
  });

  it('une colonie au seuil critique, et pas juste au-dessus', () => {
    // La borne est INCLUSIVE. Le gestionnaire écrivait `<= 1` ; recopier « < 1 »
    // dans la règle d'annulation aurait rendu défaisable exactement le cas que
    // le gestionnaire alerte.
    expect(alertesLeveesPar('controle', { forceColonie: FORCE_COLONIE_CRITIQUE })).toBe(1);
    expect(alertesLeveesPar('controle', { forceColonie: FORCE_COLONIE_CRITIQUE + 1 })).toBe(0);
  });

  it('les deux à la fois', () => {
    expect(alertesDuControle({ celluleRoyale: true, forceColonie: 1 })).toHaveLength(2);
  });

  it('aucun AUTRE type ne lève d’alerte par ce chemin', () => {
    // La question est posée au TYPE : les règles n'ont pas à savoir lesquels ont
    // des effets de bord. Le jour où un deuxième type en lève, il s'inscrit dans
    // `alertesControle` et les deux règles suivent sans être touchées.
    for (const type of ['nourrissement', 'commentaire', 'varroa', null, undefined]) {
      expect(alertesLeveesPar(type, { celluleRoyale: true, forceColonie: 1 }), String(type)).toBe(
        0,
      );
    }
  });
});

describe('⚠️ l’annulation refuse ce qu’elle ne saurait défaire entièrement', () => {
  it('un contrôle ORDINAIRE reste annulable', () => {
    // Le contre-test, et il compte autant que le refus : sans lui, refuser TOUS
    // les contrôles satisferait les cas suivants tout en cassant le geste le
    // plus fréquent de la saison.
    expect(TYPES_ANNULABLES.has('controle')).toBe(true);
    expect(
      annulationAutorisee(
        [{ type: 'controle', celluleRoyale: false, forceColonie: 3 }],
        T0,
        dans(60_000),
      ),
    ).toEqual({ ok: true });
  });

  it('un contrôle avec CELLULES ROYALES est refusé', () => {
    const v = annulationAutorisee([{ type: 'controle', celluleRoyale: true }], T0, dans(60_000));
    expect(v.ok).toBe(false);
  });

  it('un contrôle sur une COLONIE TRÈS FAIBLE est refusé', () => {
    const v = annulationAutorisee([{ type: 'controle', forceColonie: 1 }], T0, dans(60_000));
    expect(v.ok).toBe(false);
  });

  it('CHACUN des trois refus est une PHRASE qui nomme sa porte de sortie', () => {
    /**
     * ⚠️ ON BALAIE LES TROIS REFUS, PAS CELUI QU'ON VIENT D'ÉCRIRE. Une
     * mutation l'a exigé : remplacer la première phrase du motif par un cri
     * technique (« ALERTE_ORPHELINE ») laissait le cas vert, parce qu'il ne
     * regardait qu'une longueur et deux mots-clés. Un refus qui commence par un
     * identifiant en majuscules est exactement ce que la règle produit
     * interdit — « le refus est une PHRASE, jamais un code » — et l'apiculteur,
     * lui, lit la première ligne.
     *
     * Les trois sont produits ICI, en appelant la vraie fonction : ajouter un
     * quatrième refus demain le fera entrer dans ce balayage tout seul.
     */
    const refus = [
      annulationAutorisee([{ type: 'controle', celluleRoyale: true }], T0, dans(60_000)),
      annulationAutorisee([{ type: 'varroa' }], T0, dans(60_000)),
      annulationAutorisee([{ type: 'controle' }], T0, dans(48 * 3600_000)),
    ];

    expect(
      refus.every((v) => !v.ok),
      'les trois cas doivent bien refuser, sinon ce balayage ne mesure rien',
    ).toBe(true);

    for (const v of refus) {
      if (v.ok) continue;
      expect(v.motif.length, 'un refus court est un mur').toBeGreaterThan(80);
      // Un mot tout en majuscules de six lettres ou plus, ou avec un souligné :
      // c'est un identifiant, pas du français.
      expect(v.motif, `cri technique dans « ${v.motif.slice(0, 40)}… »`).not.toMatch(
        /[A-Z]{6,}|[a-zA-Z]+_[a-zA-Z]+|celluleRoyale|forceColonie/,
      );
      // Une porte de sortie : où aller pour reprendre la main.
      expect(v.motif, `aucune porte de sortie dans « ${v.motif.slice(0, 40)}… »`).toMatch(
        /Alertes|journal des interventions|dans l’application/,
      );
    }
  });

  it('un LOT dont UNE seule visite a alerté est refusé EN ENTIER', () => {
    // Le lot ne se défait qu'entièrement : une annulation partielle laisserait
    // la base dans un état que personne n'a demandé.
    const v = annulationAutorisee(
      [
        { type: 'controle', celluleRoyale: false, forceColonie: 4 },
        { type: 'controle', celluleRoyale: true },
        { type: 'controle', celluleRoyale: false, forceColonie: 3 },
      ],
      T0,
      dans(60_000),
    );
    expect(v.ok).toBe(false);
  });

  it('l’ancienne forme — un simple type — marche toujours', () => {
    // Les deux chemins d'annulation ont migré, mais la règle reste appelable
    // avec un type nu : un troisième appelant ne doit pas se casser dessus.
    expect(annulationAutorisee(['controle'], T0, dans(60_000))).toEqual({ ok: true });
    expect(annulationAutorisee(['varroa'], T0, dans(60_000)).ok).toBe(false);
    expect(annulationAutorisee([null], T0, dans(60_000)).ok, 'inconnu = refus').toBe(false);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// LE GESTIONNAIRE ET LES DEUX RÈGLES LISENT LA MÊME LISTE
//
// ⚠️ TROIS LECTEURS, UNE SEULE SOURCE — et c'est la seule chose qui empêche le
// défaut de revenir. Tant que le gestionnaire décidait dans son coin, la règle
// d'annulation pouvait déclarer `controle` réversible sans jamais voir qu'il
// écrivait ailleurs. Le jour où quelqu'un ajoutera un seuil, il le fera dans
// `alertesControle` — ou ce banc tombera.
// ═══════════════════════════════════════════════════════════════════════════

describe('le gestionnaire dérive ses alertes, il ne les réécrit pas', () => {
  it('exécution réelle : ce qu’il crée correspond à ce que la règle mesure', async () => {
    const { handleControle } = await import('../../../../server/services/interventions/controle');

    /** Ce que le gestionnaire a réellement demandé à `createAlerte`. */
    const creees: { type: string }[] = [];
    const tx = {
      update: () => ({ set: () => ({ where: async () => {} }) }),
      insert: () => ({
        values: (v: { type?: string }) => {
          creees.push({ type: v.type ?? '?' });
          return { returning: async () => [{ id: 'a1' }] };
        },
      }),
    };

    const donnees = { celluleRoyale: true, forceColonie: 1 };
    const res = await handleControle(
      tx as never,
      {
        userId: 'u1',
        rucheId: 'r1',
        inspectionId: 'i1',
        donnees,
      } as never,
    );

    // Ce que la RÈGLE croit qu'il a levé…
    const attendu = alertesLeveesPar('controle', donnees);
    // …doit être ce qu'il a VRAIMENT écrit, et ce qu'il annonce à la bulle.
    expect(attendu).toBe(2);
    expect(creees.length, 'la base doit recevoir exactement ce que la règle compte').toBe(attendu);
    expect(res.alerts?.length, 'et la bulle de Maya aussi').toBe(attendu);
  });

  it('aucune alerte créée sur un contrôle ordinaire', async () => {
    const { handleControle } = await import('../../../../server/services/interventions/controle');
    const creees: unknown[] = [];
    const tx = {
      update: () => ({ set: () => ({ where: async () => {} }) }),
      insert: () => ({
        values: (v: unknown) => {
          creees.push(v);
          return { returning: async () => [{ id: 'a1' }] };
        },
      }),
    };
    const res = await handleControle(
      tx as never,
      {
        userId: 'u1',
        rucheId: 'r1',
        inspectionId: 'i1',
        donnees: { celluleRoyale: false, forceColonie: 4 },
      } as never,
    );
    expect(creees).toEqual([]);
    expect(res.alerts ?? []).toEqual([]);
  });
});
