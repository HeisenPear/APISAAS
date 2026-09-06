import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { sansCommentaires } from '~~/tests/helpers/sansCommentaires';
import {
  classifier,
  bilanClients,
  rendreClients,
  blocsClients,
  bilanLots,
  rendreLots,
  blocsLots,
} from '~~/server/utils/copilote-local';
import { MARQUEURS_CERTITUDE } from '~~/server/utils/maya-consequences';
import { refusDeLecture } from '~~/server/utils/copilote-gating';
import { ROUTE_GATES } from '~~/app/config/route-gates';
import { PLANS, hasFeature } from '~~/app/config/plans';
import type { ClientRow, LotRow, LotsData } from '~~/server/utils/copilote-data';

const MAINTENANT = new Date('2026-06-15T09:00:00Z');
const ilYaJours = (j: number) => new Date(MAINTENANT.getTime() - j * 86_400_000).toISOString();

function client(p: Partial<ClientRow> = {}): ClientRow {
  return {
    nom: 'Épicerie du Pré',
    type: 'professionnel',
    nbVentes: 3,
    caEuros: 450,
    derniereVente: ilYaJours(30),
    impayeEuros: 0,
    nbImpayees: 0,
    ...p,
  };
}

function lot(p: Partial<LotRow> = {}): LotRow {
  return {
    numeroLot: 'L2026-01',
    typeMiel: 'acacia',
    quantiteKg: 42,
    derniereRecolte: '2026-06-01T00:00:00Z',
    nbRecoltes: 2,
    teneurEauPct: 17.5,
    hmfMgKg: null,
    conditionne: true,
    nombrePots: 100,
    ...p,
  };
}

const lots = (l: LotRow[], kgSansLot = 0, nbRecoltesSansLot = 0): LotsData => ({
  lots: l,
  kgSansLot,
  nbRecoltesSansLot,
});

describe('l’impayé a UNE définition, celle du reste du produit', () => {
  /**
   * LE DÉFAUT QUE CE BANC EXISTE POUR EMPÊCHER, ET QUI ÉTAIT EN PRODUCTION.
   *
   * `getFinances` ne comptait comme impayée qu'une facture `envoyee` dont
   * l'échéance était dépassée. Mais `en_retard` est un statut que l'apiculteur
   * pose lui-même, et que TOUT le reste du produit compte comme ouvert —
   * `factures-ouvertes.get.ts`, les suggestions de rapprochement bancaire et la
   * fiche client font tous `IN ('envoyee', 'en_retard')`. L'échéance étant de
   * plus nullable, une facture marquée en retard sans date était invisible deux
   * fois : Maya annonçait « 0 impayé » pendant que la page Ventes en affichait.
   *
   * Le banc se lit sur la SOURCE parce que la requête est du SQL : aucun test
   * unitaire ne peut l'exécuter sans base. C'est une vérification faible, mais
   * elle attrape exactement la régression qui s'était produite — quelqu'un qui
   * réécrit la clause en oubliant un des deux cas.
   */
  const SOURCE = sansCommentaires(readFileSync('server/utils/copilote-data.ts', 'utf-8'));

  /**
   * ⚠️ CHAQUE LECTEUR EST DÉCOUPÉ AVANT D'ÊTRE LU.
   *
   * Ma première version cherchait `en_retard` dans le FICHIER ENTIER. Elle
   * passait même en retirant le statut de `getFinances`, puisque `getClients`
   * le contient aussi — vérifié par mutation, et c'était précisément le bug que
   * ce banc devait verrouiller. Un test qui ne regarde pas le bon endroit est
   * un test vert qui ne garantit rien.
   */
  function corpsDe(fonction: string): string {
    const debut = SOURCE.indexOf(`export async function ${fonction}`);
    expect(debut, `${fonction} introuvable`).toBeGreaterThan(-1);
    const suite = SOURCE.indexOf('\nexport ', debut + 1);
    return SOURCE.slice(debut, suite === -1 ? undefined : suite);
  }

  it('compte les factures explicitement marquées « en retard »', () => {
    expect(
      corpsDe('getFinances'),
      'getFinances doit reconnaître le statut en_retard, comme le reste du produit',
    ).toMatch(/'en_retard'/);
  });

  it('compte aussi les factures envoyées dont l’échéance est passée', () => {
    // L'autre moitié de la règle — celle de `statutEffectif` sur la page Ventes.
    const corps = corpsDe('getFinances');
    expect(corps).toMatch(/'envoyee'/);
    expect(corps).toMatch(/dateEcheance/);
  });

  it('la lecture des clients applique la même définition', () => {
    expect(corpsDe('getClients')).toMatch(/'envoyee',\s*'en_retard'/);
  });
});

describe('bilanClients — qui achète, qui doit, qui s’est tu', () => {
  it('sépare ceux qui ont commandé de ceux qui n’ont jamais rien pris', () => {
    const b = bilanClients(
      [client(), client({ nom: 'Prospect', nbVentes: 0, caEuros: 0, derniereVente: null })],
      MAINTENANT,
    );
    expect(b.clients).toHaveLength(2);
    expect(b.acheteurs.map((c) => c.nom)).toEqual(['Épicerie du Pré']);
  });

  it('ne déclare dormant qu’au-delà d’un cycle complet', () => {
    /**
     * La vente de miel est saisonnière : un client qui commande une fois l'an,
     * à la récolte, est un BON client. Une fenêtre courte les signalerait tous
     * chaque printemps et l'alerte perdrait son sens — c'est le silence de plus
     * d'un an qui n'est plus explicable par la saison.
     */
    const b = bilanClients(
      [
        client({ nom: 'Annuel', derniereVente: ilYaJours(300) }),
        client({ nom: 'Perdu', derniereVente: ilYaJours(400) }),
      ],
      MAINTENANT,
    );
    expect(b.dormants.map((c) => c.nom)).toEqual(['Perdu']);
  });

  it('un client qui n’a JAMAIS commandé n’est pas un client dormant', () => {
    // Il n'a rien à réactiver : le confondre avec un client perdu enverrait
    // relancer quelqu'un qui n'est jamais venu.
    const b = bilanClients([client({ nbVentes: 0, derniereVente: null })], MAINTENANT);
    expect(b.dormants).toEqual([]);
  });

  it('additionne les impayés et retient qui les porte', () => {
    const b = bilanClients(
      [client({ impayeEuros: 120, nbImpayees: 1 }), client({ nom: 'Bon payeur' })],
      MAINTENANT,
    );
    expect(b.impayeEuros).toBe(120);
    expect(b.debiteurs).toHaveLength(1);
  });

  it('sans chiffre d’affaires, la concentration est nulle — pas zéro', () => {
    // Une division par zéro maquillée en « 0 % » ferait dire à Maya qu'aucun
    // client ne pèse, là où il n'y a simplement rien à mesurer.
    const b = bilanClients([client({ nbVentes: 0, caEuros: 0 })], MAINTENANT);
    expect(b.concentration).toBeNull();
  });
});

describe('rendreClients — la dépendance se dit au conditionnel', () => {
  it('n’annonce jamais une conséquence commerciale au futur de l’indicatif', () => {
    /**
     * La même règle de langage que la projection sanitaire, appliquée au
     * commerce : « vous allez perdre ce client » est une promesse que rien ne
     * garantit. Le jour où elle ne se réalise pas, l'apiculteur cesse de croire
     * le reste.
     */
    const b = bilanClients(
      [
        client({ nom: 'Gros', caEuros: 5000, impayeEuros: 300, nbImpayees: 2 }),
        client({ nom: 'Petit', caEuros: 200, derniereVente: ilYaJours(500) }),
        client({ nom: 'Autre', caEuros: 150 }),
      ],
      MAINTENANT,
    );
    const texte = rendreClients(b);
    expect(texte).toMatch(/%\s*de ton chiffre d’affaires/);
    for (const ligne of texte.split('\n').filter((l) => l.trim())) {
      expect(MARQUEURS_CERTITUDE.test(ligne), ligne).toBe(false);
    }
  });

  it('ne parle pas de dépendance sur un carnet équilibré', () => {
    const equilibre = bilanClients(
      [
        client({ nom: 'A', caEuros: 400 }),
        client({ nom: 'B', caEuros: 350 }),
        client({ nom: 'C', caEuros: 300 }),
      ],
      MAINTENANT,
    );
    expect(rendreClients(equilibre)).not.toMatch(/de ton chiffre d’affaires/);
  });

  it('À DEUX CLIENTS, la dépendance ne veut rien dire — et n’est pas dite', () => {
    /**
     * CE CAS A ÉTÉ TROUVÉ PAR LE BANC, PAS PAR MOI.
     *
     * Mon premier seuil était « le plus gros pèse ≥ 50 % ». Avec deux acheteurs
     * à 500 € chacun, il se déclenchait : Maya annonçait une dépendance sur un
     * partage exactement moitié-moitié. Avec deux clients, le plus gros pèse au
     * moins 50 % par construction — la phrase n'apprend rien. Il en faut trois
     * pour que « plus de la moitié » signifie « plus que tous les autres
     * réunis ».
     */
    const deux = bilanClients(
      [client({ nom: 'A', caEuros: 500 }), client({ nom: 'B', caEuros: 500 })],
      MAINTENANT,
    );
    expect(rendreClients(deux)).not.toMatch(/de ton chiffre d’affaires/);

    const deuxDesequilibres = bilanClients(
      [client({ nom: 'A', caEuros: 950 }), client({ nom: 'B', caEuros: 50 })],
      MAINTENANT,
    );
    expect(rendreClients(deuxDesequilibres)).not.toMatch(/de ton chiffre d’affaires/);
  });

  it('un client unique n’est pas une dépendance à signaler', () => {
    // Il pèse 100 % par construction : le dire n'apprend rien et ferait passer
    // un débutant avec son premier client pour une entreprise en danger.
    const seul = bilanClients([client({ nom: 'Unique', caEuros: 500 })], MAINTENANT);
    expect(rendreClients(seul)).not.toMatch(/de ton chiffre d’affaires/);
  });

  it('aucun client : oriente vers la saisie au lieu de rester vide', () => {
    expect(rendreClients(bilanClients([], MAINTENANT))).toMatch(/client/i);
  });
});

describe('blocsClients — comparer suppose au moins deux acheteurs', () => {
  it('pas de classement avec un seul acheteur', () => {
    const b = bilanClients([client()], MAINTENANT);
    expect(blocsClients(b).some((x) => x.type === 'graphe')).toBe(false);
  });

  it('classement dès deux acheteurs', () => {
    const b = bilanClients(
      [client({ nom: 'A', caEuros: 900 }), client({ nom: 'B', caEuros: 300 })],
      MAINTENANT,
    );
    const g = blocsClients(b).find((x) => x.type === 'graphe');
    expect(g).toBeDefined();
    if (g?.type !== 'graphe') return;
    expect(g.serie.map((p) => p.label)).toEqual(['A', 'B']);
  });

  it('les tableaux ont autant de cellules que de colonnes', () => {
    const b = bilanClients(
      [
        client({ impayeEuros: 90, nbImpayees: 1 }),
        client({ nom: 'Dormant', derniereVente: ilYaJours(500) }),
      ],
      MAINTENANT,
    );
    const tableaux = blocsClients(b).filter((x) => x.type === 'tableau');
    expect(tableaux.length).toBeGreaterThanOrEqual(2);
    for (const t of tableaux) {
      if (t.type !== 'tableau') continue;
      for (const l of t.lignes) expect(l.length, t.titre).toBe(t.colonnes.length);
    }
  });

  it('aucun client, aucune figure', () => {
    expect(blocsClients(bilanClients([], MAINTENANT))).toEqual([]);
  });
});

describe('bilanLots — le seuil vient de la réglementation, pas d’ici', () => {
  it('tolère la callune plus haut que les autres miels', () => {
    /**
     * L'INVARIANT QUI INTERDIT DE RECOPIER « 20 ».
     *
     * La directive 2001/110/CE plafonne la teneur en eau à 20 %, SAUF pour la
     * bruyère callune, tolérée à 23 %. Écrire le seuil ici déclarerait non
     * conforme un miel de bruyère parfaitement légal. Le verdict est donc rendu
     * par `evaluerQualiteMiel`, seul dépositaire des seuils — ce banc vérifie
     * que la nuance survit au passage.
     */
    const b = bilanLots(
      lots([
        lot({ numeroLot: 'ACACIA', typeMiel: 'acacia', teneurEauPct: 22 }),
        lot({ numeroLot: 'CALLUNE', typeMiel: 'callune', teneurEauPct: 22 }),
      ]),
    );
    expect(b.nonConformes.map((n) => n.lot.numeroLot)).toEqual(['ACACIA']);
    expect(b.nonConformes[0]!.seuil).toBe(20);
  });

  it('un lot jamais analysé n’est pas un lot non conforme', () => {
    // Absence de mesure ≠ mesure mauvaise. Confondre les deux ferait suspecter
    // tout le stock d'un apiculteur qui n'a pas de réfractomètre.
    const b = bilanLots(lots([lot({ teneurEauPct: null })]));
    expect(b.nonConformes).toEqual([]);
  });

  it('relève les lots récoltés mais jamais mis en pot', () => {
    const b = bilanLots(
      lots([lot({ numeroLot: 'A' }), lot({ numeroLot: 'B', conditionne: false })]),
    );
    expect(b.nonConditionnes.map((l) => l.numeroLot)).toEqual(['B']);
  });

  it('remonte les kilos SANS numéro de lot — le vrai trou de traçabilité', () => {
    const b = bilanLots(lots([lot()], 12.5, 2));
    expect(b.kgSansLot).toBe(12.5);
    expect(b.nbRecoltesSansLot).toBe(2);
  });
});

describe('rendreLots — dire le risque réel, et seulement lui', () => {
  it('nomme le miel intraçable et pourquoi c’en est un problème', () => {
    const t = rendreLots(bilanLots(lots([], 30, 3)));
    expect(t).toMatch(/numéro de lot/i);
    expect(t).toMatch(/contrôle|retour client/i);
  });

  it('ne déclare JAMAIS un miel périmé', () => {
    /**
     * LA FICHE DE SAVOIR DU PRODUIT LE DIT NOIR SUR BLANC : le miel n'a pas de
     * DLC, il reste consommable après sa DDM, son goût évolue simplement.
     * Annoncer un lot « périmé » serait faux — et Maya se contredirait
     * elle-même deux questions plus loin, ce qui est pire qu'une simple erreur.
     */
    const t = rendreLots(
      bilanLots(
        lots([
          lot({ derniereRecolte: '2019-06-01T00:00:00Z', conditionne: false }),
          lot({ numeroLot: 'VIEUX', derniereRecolte: '2018-06-01T00:00:00Z' }),
        ]),
        5,
        1,
      ),
    );
    expect(t).not.toMatch(/périmé|perime|impropre|à jeter|DLC/i);
  });

  it('cite le seuil qu’il applique, plutôt qu’un verdict opaque', () => {
    const t = rendreLots(bilanLots(lots([lot({ typeMiel: 'acacia', teneurEauPct: 22 })])));
    expect(t).toMatch(/22 %/);
    expect(t).toMatch(/20 %/);
    expect(t).toMatch(/fermenter/i);
  });

  it('rien du tout : oriente vers la saisie des récoltes', () => {
    expect(rendreLots(bilanLots(lots([])))).toMatch(/récolte/i);
  });
});

describe('blocsLots — les figures ne mentent pas sur ce qu’elles comptent', () => {
  it('pas de graphe avec un seul lot pesé', () => {
    expect(blocsLots(bilanLots(lots([lot()]))).some((b) => b.type === 'graphe')).toBe(false);
  });

  it('graphe dès deux lots pesés', () => {
    const b = blocsLots(
      bilanLots(lots([lot({ numeroLot: 'A' }), lot({ numeroLot: 'B', quantiteKg: 20 })])),
    );
    const g = b.find((x) => x.type === 'graphe');
    expect(g).toBeDefined();
    if (g?.type !== 'graphe') return;
    expect(g.serie.map((p) => p.label)).toEqual(['A', 'B']);
  });

  it('un lot sans quantité ne compte pas comme pesé', () => {
    const b = blocsLots(
      bilanLots(lots([lot({ numeroLot: 'A' }), lot({ numeroLot: 'B', quantiteKg: null })])),
    );
    expect(b.some((x) => x.type === 'graphe')).toBe(false);
  });

  it('les tableaux ont autant de cellules que de colonnes', () => {
    const b = blocsLots(
      bilanLots(
        lots([
          lot({ numeroLot: 'A', typeMiel: 'acacia', teneurEauPct: 24 }),
          lot({ numeroLot: 'B', conditionne: false }),
        ]),
      ),
    );
    const tableaux = b.filter((x) => x.type === 'tableau');
    expect(tableaux.length).toBeGreaterThanOrEqual(2);
    for (const t of tableaux) {
      if (t.type !== 'tableau') continue;
      for (const l of t.lignes) expect(l.length, t.titre).toBe(t.colonnes.length);
    }
  });

  it('aucune récolte, aucune figure', () => {
    expect(blocsLots(bilanLots(lots([])))).toEqual([]);
  });
});

describe('classifier et gating du commerce', () => {
  it.each(['mes clients', 'qui me doit de l’argent ?', 'mes impayés'])('%s → clients', (q) => {
    const c = classifier(q);
    expect(c.kind, q).toBe('action');
    if (c.kind !== 'action') return;
    expect(c.intent).toBe('clients');
  });

  it.each(['mes lots', 'la traçabilité de mes lots', 'mes conditionnements'])('%s → lots', (q) => {
    const c = classifier(q);
    expect(c.kind, q).toBe('action');
    if (c.kind !== 'action') return;
    expect(c.intent).toBe('lots');
  });

  it.each(['comment marche mon lot ?', 'à quoi sert mes lots ?', 'je peux suivre mes clients ?'])(
    '%s ne déclenche AUCUN inventaire',
    (q) => {
      // La liste d'exclusions partagée vaut aussi pour le commerce : une question
      // de FORME interrogative ne reçoit jamais une liste de factures.
      expect(classifier(q).kind, q).not.toBe('action');
    },
  );

  it.each(['clients', 'lots'] as const)('%s suit exactement ROUTE_GATES', (lecture) => {
    const route = lecture === 'clients' ? 'POST /api/clients' : 'GET /api/production/lots/*';
    const feature = ROUTE_GATES[route]?.feature;
    expect(feature, `${route} doit rester gatée`).toBeTruthy();
    for (const p of PLANS) {
      expect(refusDeLecture(p, lecture) !== null, `${p}/${lecture}`).toBe(!hasFeature(p, feature!));
    }
  });

  it('chaque refus parle de SA capacité et nomme la sortie', () => {
    const rc = refusDeLecture('decouverte', 'clients')!;
    const rl = refusDeLecture('decouverte', 'lots')!;
    expect(rc).toMatch(/client/i);
    expect(rc).toMatch(/Abonnement/i);
    expect(rc).toMatch(/En attendant/i);
    expect(rl).toMatch(/traçabilité|lots/i);
    expect(rl).toMatch(/Abonnement/i);
    // Et aucun ne doit vendre le sujet de l'autre.
    expect(rl).not.toMatch(/qu’ils achètent/);
  });
});
