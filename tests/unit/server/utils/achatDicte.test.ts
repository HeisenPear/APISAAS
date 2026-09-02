import { describe, it, expect, vi, beforeEach } from 'vitest';
import { valeursLiees } from '../../../helpers/fauxDb';

/**
 * L'ACHAT ÉTAIT LA MOITIÉ MANQUANTE DE LA COMPTABILITÉ.
 *
 * Maya savait préparer une vente ; elle ne savait rien enregistrer de ce qui
 * SORT. Mesuré avant correction, trois formulations, trois issues fausses :
 *
 *   « j'ai acheté 200 euros de candi »  → une FICHE de savoir sur le candi
 *   « dépense 45 euros de carburant »   → « je n'ai pas compris »
 *   « note un achat de 200 euros »      → « sur quelle ruche ? »
 *
 * Un apiculteur qui ne saisit pas ses charges croit gagner ce qu'il a dépensé.
 *
 * ⚠️ CE BANC GARDE AUTANT CE QUI NE DOIT PAS BOUGER. Un analyseur de dépense
 * qui réclame trop vole les LECTURES (« combien j'ai dépensé »), la NAVIGATION
 * (« ouvre mes achats »), les PENSE-BÊTES (« rappel acheter des cadres » — le
 * cas que l'anti-corpus a fait tomber au premier essai) et sa voisine la
 * VENTE. Les cas « doit survivre » sont la moitié du travail.
 */

/** Le refus de plan, pilotable : `null` = laisse passer, une phrase = refuse. */
let refusCourant: string | null = null;
vi.mock('~~/server/utils/copilote-gating', () => ({
  refusDePlan: () => Promise.resolve(refusCourant),
}));

/**
 * ⚠️ TOUT PASSE PAR `classifierTour`, PAS PAR `analyserAchat` DIRECTEMENT.
 * Un analyseur qui reconnaît parfaitement une phrase que le classifieur donne
 * à quelqu'un d'autre ne sert à rien : c'est le trajet complet qu'il faut
 * mesurer, pas le maillon. C'est d'ailleurs comme ça que « facture d'achat »
 * s'est révélé partir chez la VENTE.
 */
const { previsualiserAchat, insererAchatTx, annulerAchatTx } =
  await import('~~/server/utils/copilote-actions');
const { classifierTour } = await import('~~/server/utils/copilote-local');
const { CATEGORIES_ACHAT, CATEGORIES_ACHAT_IDS } = await import('~~/app/config/categories-achat');
const { MAYA_ACTIONS } = await import('~~/app/config/maya-actions');

const t = (...tours: string[]) =>
  classifierTour(tours.map((content) => ({ role: 'user' as const, content })));

/** Analyse une phrase comme le fait `classifierTour` (normalisée + brute). */
const a = (phrase: string) => {
  const c = t(phrase);
  return c.kind === 'ecriture' && c.ecriture.action === 'achat' ? c.ecriture.parse : null;
};

beforeEach(() => {
  refusCourant = null;
});

describe('la dépense s’enregistre, au lieu de servir une fiche', () => {
  // ─── GARDE-FOU ────────────────────────────────────────────────────────────
  it('garde-fou — le catalogue déclare bien une action « achat » qui écrit', () => {
    // Si ce cas tombe, tout le reste du banc mesure du vide : les phrases
    // seraient classées ailleurs et les assertions ne verraient jamais d'achat.
    expect(MAYA_ACTIONS.achat, 'l’action a disparu du catalogue').toBeDefined();
    expect(MAYA_ACTIONS.achat.ecrit, 'l’action est redevenue un squelette').toBe(true);
    expect(MAYA_ACTIONS.achat.autonomie, 'une dépense ne s’écrit jamais sans accord').toBe(
      'jamais',
    );
  });

  it('les trois formulations mesurées avant correction écrivent maintenant', () => {
    const candi = a("j'ai achete 200 euros de candi");
    expect(candi, '« 200 euros de candi » repart sur une fiche de savoir').not.toBeNull();
    expect(candi!.montantUnitaireTtc).toBe(200);
    expect(candi!.designation).toMatch(/candi/);
    expect(candi!.manque).toEqual([]);

    const carburant = a('depense 45 euros de carburant');
    expect(carburant, '« dépense 45 euros » n’est toujours pas comprise').not.toBeNull();
    expect(carburant!.montantUnitaireTtc).toBe(45);

    // Un PAIEMENT raconté est une dépense — c'est le mot le plus naturel quand
    // on relit son relevé bancaire, et le seul des trois familles de mots à
    // n'être ni « achat » ni « dépense ».
    const paye = a("j'ai paye 45 euros de carburant");
    expect(paye, '« j’ai payé » n’est plus reconnu comme une dépense').not.toBeNull();
    expect(paye!.montantUnitaireTtc).toBe(45);
    expect(paye!.categorie).toBe('transport');

    const nu = a('note un achat de 200 euros');
    expect(nu, '« note un achat » repart sur « sur quelle ruche ? »').not.toBeNull();
    // Le montant est là, la désignation manque : Maya doit DEMANDER, pas inventer.
    expect(nu!.montantUnitaireTtc).toBe(200);
    expect(nu!.manque).toContain('designation');
  });

  it('un montant global reste global — la quantité vaut 1', () => {
    /**
     * ⚠️ LE PIÈGE EST ICI, ET IL COÛTE UN FACTEUR CINQ CENTS. « 200 euros de
     * pots de 500 g » : prendre le premier nombre venu pour une quantité
     * donnait 500 × 200 €. Un nombre introduit par « de » ET suivi d'une unité
     * de mesure décrit un CONTENANT, jamais un compte.
     */
    const p = a("j'ai achete 200 euros de pots de 500 g");
    expect(p).not.toBeNull();
    expect(p!.quantite, 'la contenance a été prise pour une quantité').toBe(1);
    expect(p!.montantUnitaireTtc).toBe(200);

    /**
     * ⚠️ LE CAS CI-DESSUS NE GARDE PAS CE QU'IL A L'AIR DE GARDER, ET LA
     * MUTATION L'A DIT : forcer « tout montant est unitaire » le laissait VERT,
     * parce que le seul nombre restant y est justement une contenance, écartée
     * par l'autre règle. Il faut donc un nombre qui, lui, PASSERAIT — le titre
     * d'un sirop. Sans la règle du prix unitaire annoncé, cette phrase
     * facturerait 50 × 120 € = 6 000 €.
     */
    const sirop = a("j'ai achete 120 euros de sirop 50 50");
    expect(sirop).not.toBeNull();
    expect(sirop!.quantite, 'un nombre du LIBELLÉ est devenu une quantité').toBe(1);
    expect(sirop!.montantUnitaireTtc).toBe(120);
  });

  it('un prix unitaire annoncé se lit comme unitaire', () => {
    const p = a("j'ai achete 10 hausses a 25 euros");
    expect(p).not.toBeNull();
    expect(p!.quantite, 'les dix hausses ont disparu').toBe(10);
    expect(p!.montantUnitaireTtc).toBe(25);
  });

  it('la catégorie se déduit des mots, et JAMAIS par défaut', () => {
    expect(a("j'ai achete 200 euros de candi")!.categorie).toBe('nourrissement');
    expect(a("j'ai achete 45 euros de carburant")!.categorie).toBe('transport');
    expect(a("j'ai achete 80 euros d apivar")!.categorie).toBe('traitement');
    expect(a("j'ai achete 60 euros de pots")!.categorie).toBe('emballage');
    // Rien de reconnaissable → NON catégorisée. Ranger d'office dans « autre »
    // aurait l'air d'un classement alors que c'est un aveu d'ignorance.
    expect(a("j'ai achete 30 euros de bidule")!.categorie).toBeUndefined();
  });

  it('CHAQUE catégorie du catalogue reste atteignable', () => {
    /**
     * ⚠️ CE CAS ITÈRE SUR LA SOURCE DE VÉRITÉ, PAS SUR UNE LISTE RECOPIÉE.
     * Une catégorie ajoutée à `categories-achat.ts` entre ici toute seule ; et
     * un mot capté par une catégorie déclarée AVANT elle (l'ordre de la table
     * est celui de la reconnaissance) la rendrait inatteignable — c'est la
     * « couverture qui s'arrête juste avant » de CLAUDE.md, appliquée aux
     * catégories.
     */
    expect(CATEGORIES_ACHAT_IDS.length, 'le catalogue s’est vidé').toBeGreaterThan(5);
    const orphelines: string[] = [];
    for (const id of CATEGORIES_ACHAT_IDS) {
      const mots = CATEGORIES_ACHAT[id].mots;
      // « autre » n'a AUCUN mot, et c'est une déclaration : le fourre-tout du
      // formulaire ne se devine pas. Le cas suivant garde cette intention.
      if (mots.length === 0) continue;
      const atteinte = mots.some((mot) => a(`j'ai achete 10 euros de ${mot}`)?.categorie === id);
      if (!atteinte) orphelines.push(id);
    }
    expect(
      orphelines,
      'ces catégories ne sont plus atteignables : un mot d’une catégorie déclarée ' +
        'avant elles capte toutes leurs phrases, et le menu propose donc un choix ' +
        'que Maya ne peut jamais faire',
    ).toEqual([]);
  });

  it('« autre » ne se devine jamais', () => {
    expect(
      CATEGORIES_ACHAT.autre.mots,
      'donner des mots à « autre » ferait passer un aveu d’ignorance pour un classement',
    ).toEqual([]);
  });
});

describe('ce que la dépense ne doit PAS voler', () => {
  it('un pense-bête reste un pense-bête', () => {
    /**
     * ⚠️ LE CAS QUI A FAIT TOMBER MA PREMIÈRE VERSION. L'anti-corpus tient un
     * cliquet DUR à zéro écriture non demandée ; « rappel acheter des cadres »
     * devenait « Combien t'a coûté rappel cadres ? ». Un infinitif annonce une
     * intention ; seul un participe passé raconte un fait.
     */
    expect(a('rappel acheter des cadres'), 'le pense-bête est devenu une charge').toBeNull();
    expect(a('il faut acheter du candi')).toBeNull();
    expect(a("je dois payer l'assurance")).toBeNull();

    /**
     * ⚠️ LES TROIS PHRASES CI-DESSUS NE GARDAIENT PAS LA GARDE D'INTENTION, ET
     * LA MUTATION L'A DIT : en la retirant, le banc restait VERT. Aucune ne
     * porte de montant, donc l'AUTRE règle (« sans fait raconté, il faut un
     * montant ») suffisait à les écarter — la garde d'intention n'était
     * traversée par personne. La forme « le balayage vide » de CLAUDE.md,
     * déplacée dans un cas de test : vert, et vide.
     *
     * Un pense-bête CHIFFRÉ, lui, ne peut être arrêté que par elle. Et c'est
     * la forme la plus naturelle : on note un budget avant de le dépenser.
     */
    expect(
      a('rappel acheter 200 euros de cadres'),
      'un pense-bête CHIFFRÉ est devenu une charge — la garde d’intention ne sert plus',
    ).toBeNull();
    expect(
      a("il faudra payer 450 euros d'assurance en janvier"),
      'une dépense À VENIR a été inscrite comme faite',
    ).toBeNull();
  });

  it('une lecture reste une lecture', () => {
    expect(a("combien j'ai depense ce mois"), 'une question est devenue une charge').toBeNull();
    expect(a('montre mes achats')).toBeNull();
    expect(a('liste mes depenses')).toBeNull();

    /**
     * ⚠️ AUCUNE DES TROIS CI-DESSUS N'ATTEINT LA GARDE DE LECTURE, ET LA
     * MUTATION L'A DIT — en la retirant, le banc restait VERT. Deux raisons,
     * et elles sont instructives :
     *
     *   · « combien … » est capté EN AMONT par `INTERRO_INFO`, ancré au début
     *     de phrase : `classifierTour` n'entre même pas dans la détection
     *     d'écriture. Le cas mesure le garde-fou du classifieur, pas le mien ;
     *   · les deux autres n'ont ni participe passé ni montant, donc la règle
     *     « sans fait raconté, il faut un montant » les écarte avant.
     *
     * Il faut donc une lecture qui PORTE un montant, et une dont le mot
     * interrogatif n'ouvre pas la phrase — c'est d'ailleurs comme ça qu'on
     * parle.
     */
    expect(
      a('montre mes achats de plus de 100 euros'),
      'une demande de LISTE chiffrée est devenue une charge de 100 €',
    ).toBeNull();
    expect(
      a("je veux savoir combien j'ai paye cette annee"),
      'une question posée au milieu de la phrase est devenue une charge',
    ).toBeNull();
  });

  it('une navigation reste une navigation', () => {
    const c = t('ouvre mes achats');
    expect(c.kind, 'la navigation vers les achats a été volée').not.toBe('ecriture');
  });

  it('la vente n’est pas volée par la dépense', () => {
    const c = t("j'ai vendu 12 pots a 8 euros");
    expect(c.kind).toBe('ecriture');
    if (c.kind !== 'ecriture') return;
    expect(c.ecriture.action, 'la dépense a mangé la vente').toBe('vente');
  });

  it('« facture d’achat » est une DÉPENSE, pas une vente', () => {
    /**
     * ⚠️ C'EST L'ORDRE QUI DÉCIDE, PAS L'ANALYSEUR SEUL. Le mot « facture »
     * appartient au vocabulaire de la vente ; avec un marqueur
     * d'enregistrement, elle réclame la phrase. Passer une dépense
     * fournisseur en facture CLIENT inscrit une recette là où il y a une
     * charge — le double de l'erreur sur le résultat de l'exercice.
     */
    const c = t("note une facture d'achat de 200 euros de cadres");
    expect(c.kind).toBe('ecriture');
    if (c.kind !== 'ecriture') return;
    expect(c.ecriture.action, 'une charge a été inscrite en recette').toBe('achat');
  });
});

describe('le montant dicté est un TTC', () => {
  it('l’aperçu affiche exactement le montant donné, pas 20 % de plus', async () => {
    /**
     * ⚠️ TRAITER LES 200 € COMME UN HT AURAIT ÉCRIT 240 €. Maya aurait
     * répondu « c'est noté, 200 € » pendant que le tableau de bord affichait
     * 240 : un chiffre annoncé qui n'est pas celui qu'on enregistre — la
     * classe de défaut que `statutsFacture.ts` vient de fermer sur le chiffre
     * d'affaires. L'apiculteur lit le total de son ticket, qui est un TTC.
     */
    const p = a("j'ai achete 200 euros de candi")!;
    const vue = await previsualiserAchat('u1', p);
    expect(vue.ok).toBe(true);
    if (!vue.ok) return;
    expect(vue.apercu, 'le total affiché n’est pas le montant dicté').toContain(
      'Total : **200,00 €** TTC',
    );
    // La ventilation exacte, aux centimes — 200 / 1,2 = 166,67 + 33,33.
    expect(vue.apercu).toContain('166,67 € HT');
    expect(vue.apercu).toContain('33,33 € de TVA');
    expect(vue.apercu, 'le TTC a été gonflé de la TVA').not.toMatch(/240/);
    // La ventilation est MONTRÉE : le taux par défaut (20 %) doit pouvoir être
    // corrigé, donc il ne doit pas passer inaperçu.
    expect(vue.apercu).toMatch(/TVA/);
    expect(vue.apercu).toMatch(/HT/);
  });

  it('un prix unitaire totalise AU CENTIME, sans en perdre quatre', async () => {
    /**
     * ⚠️ LE CHEMIN NAÏF PERDAIT QUATRE CENTIMES, ET ÇA SE VOYAIT. Remonter le
     * TTC UNITAIRE vers un HT unitaire puis multiplier donnait, pour
     * « 10 hausses à 25 € » : 25 / 1,2 = 20,83 arrondi, × 10 = 208,30,
     * + TVA = 249,96 €. L'apiculteur lisait un nombre qu'il n'avait pas dit.
     * On totalise donc EN TTC d'abord, et on redescend une seule fois.
     */
    const p = a("j'ai achete 10 hausses a 25 euros")!;
    expect(p.quantite).toBe(10);
    const vue = await previsualiserAchat('u1', p);
    expect(vue.ok).toBe(true);
    if (!vue.ok) return;
    expect(vue.apercu, 'des centimes se sont évaporés à l’arrondi').toContain(
      'Total : **250,00 €** TTC',
    );
  });

  it('une saisie incomplète ne plante jamais — elle demande', async () => {
    const sansQuoi = await previsualiserAchat('u1', { quantite: 1, manque: ['designation'] });
    expect(sansQuoi.ok).toBe(false);
    if (sansQuoi.ok) return;
    expect(sansQuoi.message).toMatch(/achet/i);

    const sansCombien = await previsualiserAchat('u1', {
      designation: 'candi',
      quantite: 1,
      manque: ['montant'],
    });
    expect(sansCombien.ok).toBe(false);
    if (sansCombien.ok) return;
    expect(sansCombien.message).toMatch(/candi/);
  });
});

// ─── Le double de transaction : `insert`/`delete`, que `fauxDb` ne couvre pas ─

interface Ecrit {
  table: string;
  valeurs: Record<string, unknown>;
}

function fauxExec(
  lignes: Record<string, unknown[]> = {},
  suppriméesRendues = [{ id: 'achat-cree' }],
) {
  const inserts: Ecrit[] = [];
  const suppressions: { valeurs: string[] }[] = [];
  const exec = {
    select() {
      let table = '';
      const m = {
        from(tb: { _: { name: string } }) {
          table = tb._?.name ?? '';
          return m;
        },
        where() {
          return m;
        },
        orderBy() {
          return m;
        },
        limit() {
          return m;
        },
        then(res: (v: unknown[]) => unknown) {
          return Promise.resolve(lignes[table] ?? []).then(res);
        },
      };
      return m;
    },
    insert(tb: { _: { name: string } }) {
      const table = tb._?.name ?? '';
      const m = {
        values(v: Record<string, unknown>) {
          inserts.push({ table, valeurs: v });
          return m;
        },
        returning() {
          return Promise.resolve([{ id: 'achat-cree' }]);
        },
      };
      return m;
    },
    delete() {
      const m = {
        where(cond: unknown) {
          suppressions.push({ valeurs: valeursLiees(cond) });
          return m;
        },
        returning() {
          return Promise.resolve(suppriméesRendues);
        },
      };
      return m;
    },
  };
  return { exec, inserts, suppressions };
}

describe('ce qui part vraiment en base', () => {
  it('la dépense est PAYÉE, jamais un brouillon', async () => {
    /**
     * ⚠️ LES QUATRE LECTURES DE CHARGES DU PRODUIT EXCLUENT LES BROUILLONS —
     * dashboard, trésorerie, et les deux pages d'analyse. Une dépense en
     * brouillon aurait été « notée » et invisible partout : un zéro déguisé en
     * confirmation. C'est l'inverse du choix fait pour la vente, dont le
     * brouillon protège une séquence légale de numéros.
     */
    const { exec, inserts } = fauxExec();
    const r = await insererAchatTx(
      exec as never,
      'u1',
      { designation: 'candi', quantite: 1, montantUnitaireTtc: 200, categorie: 'nourrissement' },
      'pro',
    );
    expect(r.ok, r.texte).toBe(true);
    expect(inserts.length, 'rien n’a été inséré').toBe(1);
    const v = inserts[0]!.valeurs;
    expect(v.statut, 'la dépense est repassée en brouillon, donc invisible').toBe('payee');
    expect(v.type).toBe('achat');
    expect(v.userId, 'la dépense a changé de propriétaire').toBe('u1');
    expect(v.categorie).toBe('nourrissement');
    // Le TTC dicté se retrouve à l'euro près dans le total ÉCRIT.
    // Aux CENTIMES, pas « à peu près » : c'est le nombre qui part en comptabilité.
    expect(v.total, 'le TTC écrit n’est pas celui qui a été dicté').toBe('200.00');
    expect(v.sousTotal, 'le HT n’a pas été rétro-calculé').toBe('166.67');
    expect(v.tva).toBe('33.33');
    // Le total de la LIGNE est le sous-total : une seule ligne, donc aucun
    // écart d'allocation possible entre l'en-tête et son détail.
    const ligne = (v.lignes as { total: number }[])[0]!;
    expect(ligne.total, 'la ligne et l’en-tête ont divergé').toBe(166.67);
    // Une dépense porte un numéro (AC-…), contrairement au brouillon de vente.
    expect(String(v.numero)).toMatch(/^AC-/);
  });

  it('un refus de plan n’écrit RIEN — comportement, pas message', async () => {
    /**
     * Le test du refus ne peut pas se contenter de lire la phrase rendue : un
     * refus qui écrit quand même serait vert. On compte les insertions.
     */
    refusCourant = 'La comptabilité des achats arrive avec le plan Pro (Réglages › Abonnement).';
    const { exec, inserts } = fauxExec();
    const r = await insererAchatTx(
      exec as never,
      'u1',
      { designation: 'candi', quantite: 1, montantUnitaireTtc: 200 },
      'starter',
    );
    expect(r.ok).toBe(false);
    expect(inserts.length, 'le plan refuse et la ligne part quand même').toBe(0);
    expect(r.texte, 'un refus doit nommer sa porte de sortie').toMatch(/Abonnement/);
  });

  it('l’annulation est bornée au propriétaire ET au type', async () => {
    /**
     * L'identifiant vient du journal d'annulation. Un journal corrompu ne doit
     * pas pouvoir faire supprimer une FACTURE de vente par la porte des
     * dépenses — ce dépôt n'a pas de RLS côté serveur, chaque suppression
     * porte ses propres bornes.
     */
    const { exec, suppressions } = fauxExec();
    const n = await annulerAchatTx(exec as never, 'u1', 'achat-cree');
    expect(n, 'l’annulation doit RÉPONDRE combien de lignes sont parties').toBe(1);
    expect(suppressions.length).toBe(1);
    const v = suppressions[0]!.valeurs;
    expect(v, 'la suppression n’est plus bornée au propriétaire').toContain('u1');
    expect(v, 'la suppression n’est plus bornée au type « achat »').toContain('achat');
  });

  it('une annulation qui ne défait RIEN répond zéro', async () => {
    /**
     * ⚠️ CE CAS EXISTE PARCE QUE `annulerRessourceTx` ÉTAIT `Promise<void>`,
     * et que l'appelant ANNONÇAIT « j'ai défait les 20 actions » en comptant
     * le journal, jamais les lignes supprimées. Toute ligne déjà disparue
     * était comptée comme défaite. La signature `Promise<number>` ne ferme le
     * défaut que si quelqu'un vérifie le cas où il n'y a rien à défaire — le
     * cas où le nombre PROMIS et le nombre MESURÉ divergent.
     */
    const { exec } = fauxExec({}, []);
    const n = await annulerAchatTx(exec as never, 'u1', 'deja-disparu');
    expect(n, 'l’annulation annonce une suppression qui n’a pas eu lieu').toBe(0);
  });
});
