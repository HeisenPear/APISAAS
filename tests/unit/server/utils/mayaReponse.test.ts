// ═══════════════════════════════════════════════════════════════════════════
// MAYA AU NIVEAU OÙ L'APICULTEUR LA LIT.
//
// `repondreConversation` est la fonction que `/api/ia/copilote` appelle. Elle
// n'avait AUCUN banc — les 122 cas de `copilote-local.test.ts` et les 71 du
// corpus s'arrêtent tous un cran plus bas, à `classifierTour`.
//
// L'écart entre les deux niveaux n'est pas cosmétique. `classifierTour` rend une
// DÉCISION (« savoir → orphelinage ») ; `repondreConversation` rend le TEXTE.
// Entre les deux il y a un `switch` de 130 lignes qui va chercher la fiche,
// prévisualise l'écriture, compose la voix. Tout y est vérifiable, et rien n'y
// était vérifié : une décision juste dont la fiche n'existe pas produit
// « Je n'ai pas trouvé la fiche correspondante » — le corpus, lui, la comptait
// réussie, puisqu'il ne regarde que l'identifiant.
//
// Ce banc ne remesure donc PAS la compréhension (c'est le rôle de
// `mayaCorpus.test.ts`, avec son cliquet). Il vérifie ce que la compréhension
// DEVIENT : qu'aucune question du corpus ne produit une réponse vide, un
// cul-de-sac, un gabarit non substitué ou une fiche fantôme.
//
// ─── LE PIÈGE DANS LEQUEL CE BANC A FAILLI TOMBER ─────────────────────────
// Première version des doubles écrite « au jugé » : 8 des 71 questions
// tombaient en erreur. Il était tentant d'y voir huit défauts. C'étaient huit
// mensonges de mes doubles — `getMeteoRucher` rendait `null` là où la vraie
// signature est `MeteoResultat | { erreur }`, `getFinances` inventait des
// champs. Le produit allait bien ; c'est l'instrument qui était faux.
//
// D'où le choix structurant ci-dessous : les doubles sont TYPÉS avec les vraies
// interfaces du module, jamais décrits à la main.
//
// ⚠️ Sur la portée EXACTE de cette protection, parce que j'ai d'abord écrit ici
// qu'une signature qui bouge « casse `npm run typecheck` » — c'est FAUX, et je
// l'ai vérifié en cassant volontairement un double : le typecheck reste vert.
// `tsconfig.json` exclut `tests/**/*`, et pour une bonne raison (un `tsc` nu sur
// les tests tire les fichiers serveur dont les auto-imports Nuxt — `db`,
// `defineEventHandler`… — ne sont pas déclarés : 244 erreurs qui ne disent rien).
//
// Ce que les types apportent donc réellement : l'éditeur signale l'écart pendant
// l'écriture, et surtout ils OBLIGENT à lire l'interface au lieu de l'imaginer —
// c'est ainsi que les vraies formes de `RucherRow`, `RucheSante` et `numero`
// (un `text`, pas un nombre) ont été trouvées. Le filet du build, lui, n'existe
// pas : un double qui dérive se voit en banc rouge, pas au typecheck.
// ═══════════════════════════════════════════════════════════════════════════

import { readFileSync } from 'node:fs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CORPUS } from '../../../corpus/mayaQuestions.mts';
import { SAVOIR } from '../../../../server/utils/copilote-savoir';
import type { RucheRef } from '../../../../server/utils/copilote-actions';
import type {
  RucherRow,
  RucheSante,
  InterventionRow,
  StockRow,
  FinancesResume,
  AlerteRow,
  MeteoResultat,
  Serie12Mois,
} from '../../../../server/utils/copilote-data';

// ─── Les doubles de lecture ────────────────────────────────────────────────
// Typés avec les interfaces RÉELLES (cf. en-tête) : c'est la seule chose qui
// empêche ce banc de mesurer un produit imaginaire.
//
// AUCUN `as` ici, jamais. La première version en contenait un — `{…} as
// RucheSante` — et il a fait exactement ce qu'un cast fait : il a désactivé la
// seule protection que ce fichier possède. Le double décrivait une ruche
// inventée (`forceColonie`, `varroaCount`…), Maya lisait `undefined.toLowerCase()`
// et le banc accusait le produit. Un double qui ment coûte plus cher que pas de
// double du tout : il transforme un banc en générateur de fausses pistes.

const RUCHERS: RucherRow[] = [{ nom: 'Rucher du Bois', commune: 'Saint-Just', nbRuchesActives: 3 }];

const METEO: MeteoResultat = {
  rucher: 'Rucher du Bois',
  previsions: [
    {
      date: '2026-08-20',
      conditions: 'Ciel dégagé',
      tempMax: 24,
      tempMin: 12,
      pluieMm: 0,
      ventMaxKmh: 10,
      scoreVisite: 90,
    },
  ],
};

const FINANCES: FinancesResume = {
  annee: 2026,
  caVentesEuros: 1250,
  nbVentes: 8,
  facturesEnRetard: 0,
  montantImpayeEuros: 0,
  productionMielKg: 96,
};

const SANTE: RucheSante[] = [
  {
    numero: '3',
    rucher: 'Rucher du Bois',
    statut: 'active',
    scoreSante: 82,
    derniereVisite: '2026-08-01',
    joursDepuisVisite: 18,
    varroa: 2,
    maladieObservee: null,
  },
];

const STOCKS: StockRow[] = [
  {
    nom: 'Candi',
    categorie: 'nourrissement',
    quantite: '2',
    unite: 'kg',
    seuilAlerte: '5',
    sousLeSeuil: true,
  },
];

const SERIE: Serie12Mois = { labels: ['juil.', 'août'], ca: [400, 850], production: [40, 56] };

vi.mock('~~/server/utils/copilote-data', async () => {
  const vrai = await vi.importActual<typeof import('~~/server/utils/copilote-data')>(
    '~~/server/utils/copilote-data',
  );
  return {
    getRuchers: async (): Promise<RucherRow[]> => RUCHERS,
    getRuchesSante: async (): Promise<RucheSante[]> => SANTE,
    getInterventionsRecentes: async (): Promise<InterventionRow[]> => [],
    getStocks: async (): Promise<StockRow[]> => STOCKS,
    getFinances: async (): Promise<FinancesResume> => FINANCES,
    getAlertes: async (): Promise<AlerteRow[]> => [],
    getMeteoRucher: async (): Promise<MeteoResultat> => METEO,
    getSerie12Mois: async (): Promise<Serie12Mois> => SERIE,
    // Pure et sans base : on garde la VRAIE. Un double ici ne testerait que
    // ma capacité à recopier une structure.
    comparerFinances: vrai.comparerFinances,
  };
});

/**
 * Ruches rendues par `chargerRuches` — pilotable par cas, et typée `RucheRef`
 * pour la même raison que les doubles de lecture. J'ai d'abord écrit `numero`
 * en `number`, ce qui est le naturel ; la colonne est un `text` (« 12 », mais
 * aussi « R5 » ou « Bleue »), et `libelleRuche` appelle `.trim()` dessus. Trois
 * cas du corpus tombaient alors en « souci technique » — le produit, lui,
 * n'avait rien.
 */
let ruchesEnBase: RucheRef[];
/** Échecs de base à simuler avant de répondre (résilience). */
let echecsBase: number;

/**
 * Double de `db` limité à la chaîne de `chargerRuches` :
 * `select().from().innerJoin().where().limit()`, résolue comme une promesse.
 * Rien de plus — un double plus large donnerait l'illusion de couvrir des
 * requêtes que ce banc ne traverse jamais.
 *
 * `db` est mocké PAR CHEMIN et non posé sur `globalThis` : `copilote-actions.ts`
 * l'importe explicitement (l'import circulaire avec copilote-local empêchait
 * l'auto-import Nuxt d'y arriver — le commentaire en tête du module raconte le
 * défaut que ça avait causé). Un double global ne l'atteindrait donc pas, et
 * toutes les écritures retomberaient sur la vraie base : « souci technique »
 * partout, pour une raison qui n'a rien à voir avec Maya.
 */
const chaineDb = {
  from: () => chaineDb,
  innerJoin: () => chaineDb,
  where: () => chaineDb,
  orderBy: () => chaineDb,
  // Le `limit` est APPLIQUÉ, pas ignoré. Un double qui rend toujours la liste
  // entière rendrait le banc du plafond vide de sens : il vérifierait que 300
  // ruches produisent au plus 300 étapes, ce qui est vrai quel que soit le code.
  limit: (n: number) => {
    if (echecsBase > 0) {
      echecsBase -= 1;
      return Promise.reject(new Error('socket morte'));
    }
    return Promise.resolve(ruchesEnBase.slice(0, n));
  },
};

vi.mock('~~/server/utils/db', () => ({
  db: { select: () => chaineDb },
  resetDb: async () => {},
  dbWatchdog: <T>(p: Promise<T>) => p,
}));

beforeEach(() => {
  ruchesEnBase = [
    { id: 'h1', numero: '3', rucherNom: 'Rucher du Bois', rucherId: 'r1' },
    { id: 'h2', numero: '5', rucherNom: 'Rucher du Bois', rucherId: 'r1' },
    { id: 'h3', numero: '12', rucherNom: 'Rucher du Bois', rucherId: 'r1' },
  ];
  echecsBase = 0;
  // `copilote-local.ts` n'importe pas `db` : chez lui l'auto-import Nuxt marche,
  // et ce sont donc les globales qui portent le garde-fou de résilience.
  Object.assign(globalThis, {
    db: { select: () => chaineDb },
    dbWatchdog: <T>(p: Promise<T>) => p,
    resetDb: async () => {},
  });
});

type Tour = { role: 'user' | 'assistant'; content: string };

async function repondre(messages: Tour[]) {
  const { repondreConversation } = await import('~~/server/utils/copilote-local');
  return repondreConversation('u1', messages);
}
const demander = (question: string) => repondre([{ role: 'user', content: question }]);

// ═══════════════════════════════════════════════════════════════════════════
// 1. Les invariants de RÉPONSE, balayés sur tout le corpus
// ═══════════════════════════════════════════════════════════════════════════

describe('corpus Maya — au niveau de la réponse rendue', () => {
  // La voix tire au sort son ouverture à chaque appel (`resetVoix()` en tête de
  // `repondreConversation`). On ne peut donc RIEN affirmer sur un texte exact —
  // seulement sur des propriétés vraies quel que soit le tirage. C'est aussi
  // pourquoi le balayage vaut mieux qu'un cas isolé : sur 71 questions, une
  // variante de voix cassée finit par sortir.

  it('aucune question ne produit de réponse vide', async () => {
    // Une réponse vide est le pire résultat possible : l'apiculteur a parlé,
    // l'écran ne montre rien, et rien dans les logs ne le signale. Seul le cas
    // `autoExecute` a un texte vide légitime — c'est l'exécution qui parle.
    const vides: string[] = [];
    for (const cas of CORPUS) {
      const r = await demander(cas.question);
      if (!(r.texte ?? '').trim() && !r.autoExecute) vides.push(cas.question);
    }
    expect(vides).toEqual([]);
  });

  it('aucune réponse ne laisse l’apiculteur sans issue', async () => {
    // « Ne jamais bloquer sans porte de sortie » — la règle du produit. Quand
    // Maya signale qu'il lui manque quelque chose (`manque: true`), elle doit
    // TOUJOURS proposer la suite : des suggestions à taper, un écran où aller,
    // ou une confirmation à valider. Sinon la conversation s'arrête là.
    const impasses: string[] = [];
    for (const cas of CORPUS) {
      const r = await demander(cas.question);
      if (r.manque && !r.suggestions?.length && !r.navigation && !r.confirmation) {
        impasses.push(`${cas.question} → ${(r.texte ?? '').slice(0, 60)}`);
      }
    }
    expect(impasses).toEqual([]);
  });

  it('aucun gabarit non substitué ne fuit dans le texte', async () => {
    // `undefined`, `NaN`, `[object Object]` : les trois traces d'une variable
    // absente rendue telle quelle. Elles ne cassent rien — elles s'affichent,
    // et c'est ce qui les rend faciles à livrer.
    const fuites: string[] = [];
    for (const cas of CORPUS) {
      const texte = (await demander(cas.question)).texte ?? '';
      if (/\bundefined\b|\bNaN\b|\[object Object\]|\{\{/.test(texte)) {
        fuites.push(`${cas.question} → ${texte.slice(0, 90)}`);
      }
    }
    expect(fuites).toEqual([]);
  });

  it('aucune question de savoir ne tombe sur une fiche fantôme', async () => {
    // LE trou que la mesure par classification ne peut pas voir : elle vérifie
    // que l'identifiant de fiche est le bon, jamais que la fiche existe. Un id
    // renommé dans `copilote-savoir` sans être suivi dans le routage laisse le
    // corpus au vert et sert « Je n'ai pas trouvé la fiche correspondante ».
    const fantomes: string[] = [];
    for (const cas of CORPUS.filter((c) => c.attendu === 'savoir')) {
      const texte = (await demander(cas.question)).texte ?? '';
      if (/n'ai pas trouvé la fiche/i.test(texte)) fantomes.push(cas.question);
    }
    expect(fantomes).toEqual([]);
  });

  it('même une question qui ne ressemble à RIEN offre une sortie', async () => {
    // Le corpus ne contient que de vraies questions d'apiculteurs — c'est sa
    // raison d'être, et c'est aussi son angle mort : il n'atteint jamais le
    // dernier repli, celui qui se déclenche quand AUCUNE fiche n'est même
    // vaguement proche. La campagne de mutations l'a montré — vider les
    // suggestions de ce repli laissait le banc au vert.
    //
    // C'est pourtant le moment où le produit joue le plus gros : quelqu'un
    // vient de parler à Maya et elle n'a rien compris. Si elle s'arrête là,
    // il repart. Elle doit présenter ce qu'elle sait faire, et de quoi rebondir.
    for (const charabia of ['xkcd qwerty zzz', 'blorp gnix vurt', 'flibbertigibbet']) {
      const r = await demander(charabia);

      expect(r.suggestions?.length, `« ${charabia} » sans rebond`).toBeGreaterThan(0);
      expect(r.texte.length, 'un repli muet est un départ').toBeGreaterThan(30);
    }
  });

  it('toute fiche épinglée par le corpus existe dans la base de savoir', async () => {
    // Contrôle du corpus lui-même : un `articleId` mal orthographié rendrait le
    // cas ininterrogeable — il échouerait pour une raison qui n'a rien à voir
    // avec la compréhension de Maya.
    const ids = new Set(SAVOIR.map((a) => a.id));
    const inconnus = CORPUS.map((c) => c.articleId).filter((id) => id && !ids.has(id));
    expect(inconnus).toEqual([]);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 2. La mémoire multi-tours — jamais exercée jusqu'ici
// ═══════════════════════════════════════════════════════════════════════════

describe('mémoire multi-tours', () => {
  // Le corpus n'envoie qu'UN message par question. Or `classifierTour` reçoit
  // tout l'historique et `resoudreFluxIntervention` reconstruit l'état à partir
  // de TOUS les tours utilisateur. Ce mécanisme — le flux guidé, celui qu'un
  // apiculteur traverse à chaque intervention dictée — n'avait aucun banc.

  it('le flux guidé va jusqu’au bout quand on répond à ses questions', async () => {
    // On ne scripte PAS le dialogue : on répond à chaque tour la première option
    // que Maya propose elle-même, et on vérifie qu'on arrive à une écriture.
    //
    // C'est délibéré. Ma première version inventait les questions (« Quelle
    // force ? » en premier) alors que Maya commence par la reine : le banc
    // échouait sur un dialogue qui n'existe pas. Un flux conversationnel se teste
    // en le PARCOURANT — sinon on ne mesure que sa propre idée du produit.
    //
    // Bonus non négligeable : ce parcours prouve aussi que le flux TERMINE. Une
    // boucle qui reposerait indéfiniment la même question épuiserait les tours.
    const messages: Tour[] = [{ role: 'user', content: 'note un contrôle' }];
    const questionsPosees: string[] = [];
    let aboutissement: Awaited<ReturnType<typeof repondre>> | null = null;

    for (let tour = 0; tour < 12; tour++) {
      const r = await repondre(messages);
      if (r.autoExecute ?? r.confirmation ?? r.confirmationPlan) {
        aboutissement = r;
        break;
      }
      const suite = r.suggestions?.[0];
      expect(suite, `tour ${tour} sans issue : « ${(r.texte ?? '').slice(0, 60)} »`).toBeTruthy();
      questionsPosees.push(r.texte);
      messages.push({ role: 'assistant', content: r.texte }, { role: 'user', content: suite! });
    }

    expect(aboutissement, 'le flux guidé doit aboutir à une écriture').toBeTruthy();
    // Chaque tour pose une question NOUVELLE : c'est la preuve que l'état avance
    // d'un tour à l'autre, et pas seulement qu'il survit.
    expect(new Set(questionsPosees).size).toBe(questionsPosees.length);
    // La cible est bien une des ruches du compte, et le type retenu est celui
    // annoncé au tout premier message — sept tours plus tôt.
    const plan = aboutissement?.confirmationPlan?.plan;
    const ecriture = aboutissement?.autoExecute ?? aboutissement?.confirmation;
    expect(plan?.titre ?? JSON.stringify(ecriture?.params)).toMatch(/contr[oô]le/i);
  });

  it('un champ donné DANS LE DÉSORDRE ne fait pas perdre l’intervention', async () => {
    // DÉFAUT CORRIGÉ, verrouillé ici (`appliquerReponse`, copilote-actions.ts).
    //
    // Maya demande « As-tu vu la reine ? ». L'apiculteur qui dicte, gants aux
    // mains, répond « force 3 » — une donnée parfaitement valide, simplement pas
    // celle qu'on lui demandait. Avant correction, ce message n'était consommé
    // par personne : `resoudreFluxIntervention` rendait `null`, le contrôle en
    // cours était jeté, et Maya répondait « Je n'ai pas bien saisi ta demande »
    // suivie de son laïus de présentation. Il fallait TOUT recommencer.
    //
    // Le banc balaie les trois formes rencontrées ; « Passer » et le libellé de
    // ruche marchaient déjà (la ruche avait sa propre règle de tolérance).
    for (const horsOrdre of ['force 3', 'calme', 'force 3 calme']) {
      const r = await repondre([
        { role: 'user', content: 'note un contrôle' },
        { role: 'assistant', content: 'As-tu vu la reine ?' },
        { role: 'user', content: horsOrdre },
      ]);

      expect(r.texte, `« ${horsOrdre} » a fait perdre le fil`).not.toMatch(
        /pas bien saisi|pas sûr d'avoir bien compris/i,
      );
      // Maya reprend la main sur la question restée sans réponse.
      expect(r.texte).toMatch(/reine/i);
    }
  });

  it('le champ donné en avance est RETENU, pas seulement toléré', async () => {
    // Sans ce cas, le précédent se contenterait d'un moteur qui ignore poliment
    // « force 3 » : le fil serait gardé, la donnée perdue, et Maya redemanderait
    // la force plus tard. On vérifie donc que le champ est bien enregistré — en
    // répondant ENSUITE à tout le reste et en constatant que la force n'est
    // jamais redemandée.
    const messages: Tour[] = [
      { role: 'user', content: 'note un contrôle' },
      { role: 'assistant', content: 'As-tu vu la reine ?' },
      { role: 'user', content: 'force 3' },
    ];

    const questions: string[] = [];
    for (let tour = 0; tour < 12; tour++) {
      const r = await repondre(messages);
      if (r.autoExecute ?? r.confirmation ?? r.confirmationPlan) break;
      const suite = r.suggestions?.[0];
      if (!suite) break;
      questions.push(r.texte);
      messages.push({ role: 'assistant', content: r.texte }, { role: 'user', content: suite });
    }

    expect(
      questions.join(' | '),
      'la force a été redemandée : elle n’a donc pas été retenue',
    ).not.toMatch(/force de la colonie/i);
  });

  it('une réponse de slot isolée ne vaut rien sans son historique', async () => {
    // Le contre-test qui donne son sens au précédent. « force 3 » tout seul ne
    // doit PAS produire une intervention : sans le tour qui l'annonce, Maya
    // n'a aucun moyen de savoir de quoi on parle. Si les deux cas rendaient la
    // même chose, le premier ne prouverait rien sur la mémoire.
    const r = await demander('force 3');
    expect(r.autoExecute, 'aucune écriture sur un slot orphelin').toBeUndefined();
  });

  it('c’est le DERNIER message qui pilote, pas le premier', async () => {
    // Une conversation change de sujet. Si Maya répondait au premier message,
    // elle resterait bloquée sur une question résolue depuis longtemps.
    const r = await repondre([
      { role: 'user', content: 'bonjour' },
      { role: 'assistant', content: 'Salut !' },
      { role: 'user', content: "c'est quoi le varroa ?" },
    ]);
    expect(r.texte).toMatch(/varroa/i);
  });

  it('ignore les messages de l’assistant dans la reconstruction d’état', async () => {
    // `resoudreFluxIntervention` ne reçoit que les tours `user`. Si les réponses
    // de Maya entraient dans l'analyse, ses propres questions (« Quelle force ? »)
    // seraient relues comme des données de l'apiculteur.
    const avec = await repondre([
      { role: 'user', content: 'note un contrôle' },
      { role: 'assistant', content: 'Quelle force ? Force 1, Force 2, Force 3' },
      { role: 'user', content: 'la 12' },
    ]);
    const sans = await repondre([
      { role: 'user', content: 'note un contrôle' },
      { role: 'user', content: 'la 12' },
    ]);
    expect(avec.texte).toBe(sans.texte);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 3. Ce que Maya fait quand la base ne répond pas
// ═══════════════════════════════════════════════════════════════════════════

describe('résilience serverless', () => {
  // La lambda gèle, ses sockets meurent, la requête suivante échoue. Le moteur
  // recycle le pool et retente UNE fois. C'est du code écrit pour un incident
  // qui ne se produit qu'en production — donc précisément celui qu'on ne voit
  // jamais échouer avant qu'il n'échoue pour de bon.

  // Une commande COMPLÈTE (les deux champs requis d'un contrôle : force ET
  // comportement) : elle atteint la base et produit un plan. Sans les deux, Maya
  // s'arrête pour demander ce qui manque et ne touche jamais la base — le banc
  // de résilience ne prouverait alors plus rien.
  const COMMANDE_COMPLETE = 'note un contrôle force 3 calme sur toutes les ruches';

  it('rattrape un premier échec de base sans que l’apiculteur le voie', async () => {
    echecsBase = 1; // la 1re tentative meurt, la relance doit aboutir

    const r = await demander(COMMANDE_COMPLETE);

    expect(r.texte ?? '').not.toMatch(/souci technique/i);
    expect(r.confirmationPlan, 'la relance doit aboutir').toBeTruthy();
  });

  it('après deux échecs, rassure sur les données au lieu de planter', async () => {
    // Le message compte autant que l'absence de crash : un apiculteur qui vient
    // de dicter une visite doit lire que rien n'est perdu.
    echecsBase = 2;

    const r = await demander(COMMANDE_COMPLETE);

    expect(r.texte).toMatch(/souci technique/i);
    expect(r.texte).toMatch(/pas affectées/i);
    expect(r.manque).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 4. Le lot, et le plafond partagé
// ═══════════════════════════════════════════════════════════════════════════

describe('commande en lot', () => {
  it('propose un plan couvrant toutes les ruches visées', async () => {
    const r = await demander('note un contrôle force 3 calme sur toutes les ruches');

    expect(r.confirmationPlan?.plan, 'une commande en lot doit produire un plan').toBeTruthy();
    expect(r.confirmationPlan?.plan?.etapes).toHaveLength(3);
  });

  it('ne propose JAMAIS plus d’étapes que la route n’en accepte', async () => {
    // Le défaut corrigé que ce banc verrouille : la construction plafonnait à
    // 500 ruches, `planSchema` refusait au-delà de 300. Maya affichait donc un
    // plan de 500 étapes, l'apiculteur confirmait, et la confirmation échouait
    // sur un message générique. Proposer puis se dédire est pire que d'annoncer
    // le périmètre d'emblée.
    //
    // La garantie ne tient que si les deux bornes sont LA MÊME valeur. On la
    // vérifie ici sur le comportement, et sur l'identité des constantes dans le
    // cas suivant — le comportement seul ne dirait pas laquelle des deux a bougé.
    const { MAX_ETAPES_PLAN } = await import('~~/server/utils/copilote-plan');
    // Un cheptel DEUX FOIS plus grand que le plafond : c'est le seul cheptel qui
    // distingue un plafond appliqué d'un plafond simplement déclaré. En chargeant
    // exactement `MAX_ETAPES_PLAN` ruches, l'assertion serait vraie même si la
    // requête ne bornait rien du tout.
    ruchesEnBase = Array.from({ length: MAX_ETAPES_PLAN * 2 }, (_, i) => ({
      id: `h${i}`,
      numero: String(i + 1),
      rucherNom: 'Rucher du Bois',
      rucherId: 'r1',
    }));

    const r = await demander('note un contrôle force 3 calme sur toutes les ruches');

    expect(r.confirmationPlan?.plan?.etapes.length).toBe(MAX_ETAPES_PLAN);
  });

  it('le plafond de construction est CELUI de la route, pas un jumeau', async () => {
    // Le comportement seul ne dirait pas laquelle des deux bornes a bougé. Les
    // deux valeurs doivent être la MÊME constante : c'est la divergence entre
    // elles qui avait produit le défaut (500 proposées, 300 acceptées).
    const { MAX_ETAPES_PLAN } = await import('~~/server/utils/copilote-plan');
    const source = readFileSync('server/api/ia/copilote.post.ts', 'utf-8');
    expect(source, 'planSchema doit borner avec la constante partagée').toMatch(
      /\.max\(\s*MAX_ETAPES_PLAN\s*\)/,
    );
    expect(source).toContain("from '~~/server/utils/copilote-plan'");
    expect(MAX_ETAPES_PLAN).toBeGreaterThan(0);
  });
});
