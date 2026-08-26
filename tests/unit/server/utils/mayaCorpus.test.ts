import { describe, expect, it } from 'vitest';
import { classifierTour, normaliser } from '~~/server/utils/copilote-local';
import { SAVOIR } from '~~/server/utils/copilote-savoir';
import { CORPUS, FAMILLES, type CasQuestion } from '../../../corpus/mayaQuestions.mts';

// ═══════════════════════════════════════════════════════════════════════════
// BANC DE MESURE DE MAYA.
//
// Le moteur est déterministe et sans accès base : il se mesure. Sans chiffre de
// départ, « améliorer la compréhension » n'est pas vérifiable — on croit avancer.
//
// Ce fichier a DEUX rôles :
//  1. imprimer un rapport lisible (`npm run mesurer:maya`) qui dit où ça coince ;
//  2. tenir un CLIQUET anti-régression : le score ne doit jamais redescendre.
//
// Un échec du corpus n'est PAS un bug du corpus : c'est le travail qui reste.
// ═══════════════════════════════════════════════════════════════════════════

interface Resultat {
  cas: CasQuestion;
  obtenu: string;
  detail: string;
  ok: boolean;
  /** Compris mais mal orienté — pas la même maladie qu'un « rien compris ». */
  partiel: boolean;
}

function evaluer(cas: CasQuestion): Resultat {
  // On mesure `classifierTour` et NON `classifier` : c'est lui que la route
  // `/api/ia/copilote` appelle. Mesurer la brique interne donnait une image
  // fausse — les phrases déclaratives (« j'ai récolté 18 kilos ») y paraissaient
  // mal comprises alors que la couche conversation les traduit correctement en
  // ÉCRITURE. Toujours mesurer là où le produit décide.
  const c = classifierTour([{ role: 'user', content: cas.question }]);
  const detail =
    c.kind === 'action'
      ? c.intent
      : c.kind === 'savoir'
        ? c.articleId
        : c.kind === 'ecriture'
          ? (c.ecriture.action ?? '')
          : '';
  const base = { cas, obtenu: c.kind, detail };

  if (c.kind !== cas.attendu) {
    return { ...base, ok: false, partiel: c.kind !== 'inconnu' };
  }
  if (cas.intent && c.kind === 'action' && c.intent !== cas.intent) {
    return { ...base, ok: false, partiel: true };
  }
  if (cas.articleId && c.kind === 'savoir' && c.articleId !== cas.articleId) {
    return { ...base, ok: false, partiel: true };
  }
  return { ...base, ok: true, partiel: false };
}

const RESULTATS = CORPUS.map(evaluer);
const REUSSIS = RESULTATS.filter((r) => r.ok);

/**
 * Plancher FIGÉ, relevé le 22/07/2026 sur 42 questions.
 *
 * Il doit être écrit en dur : le déduire de `REUSSIS.length` reviendrait à
 * comparer la mesure à elle-même — le test passerait toujours, y compris en
 * pleine régression. À REMONTER à chaque progrès du moteur ; c'est un cliquet,
 * jamais un objectif atteint.
 *
 * Historique : 29 (état initial) → 30 (retrait du déclencheur météo « temps »
 * nu) → 32 (correction orthographique élargie aux mots de 4 lettres +
 * « orpheline » au lexique) → 36 (détection de la santé sur les formulations de
 * débutant, du chiffre d'affaires, et des capacités) → 37 (mots-clés du savoir
 * pondérés par leur pouvoir discriminant) → 39 (banc rebranché sur
 * `classifierTour`, l'entrée réellement appelée en production, + corpus corrigé
 * sur un cas trop ambigu) → 40 (fin de mot exigée dans les déclencheurs +
 * navigation qui cède devant une intention) → 42 (déduplication phonétique
 * avant la règle du s intervocalique + fiche « orpheline » enrichie des mots
 * du débutant) → 43 (« je vois pas la reine, elle est morte » : la perte de
 * reine mappée sur l'orphelinage AVANT que « morte → mortalité » ne l'envoie sur
 * les maladies) → 61 (VAGUE 2 : +18 cas durs, tous résolus — « piquent »
 * rapatrié sur la piqûre, pillage/mortalités-hiver/transhumance départagés des
 * égalités, seuil varroa distingué du protocole, « traitmen » réparé, et une
 * DÉLIBÉRATION « récolter ou attendre le beau temps » qui raisonne au lieu
 * d'ouvrir la météo) → 71 (VAGUE 3 : les FONCTIONNALITÉS de la mise à jour.
 * Le corpus n'en couvrait aucune, et la base de savoir non plus — 105 fiches,
 * zéro sur les balances, le passeport, l'éco-score ou les lots. Maya était
 * muette sur ce que la note de patch lui attribue. Cinq fiches écrites, dix cas
 * ajoutés, et un mécanisme d'EXCLUSION créé au passage : le déclencheur `score`
 * de l'intention santé capturait l'éco-score du miel, deux notions sans rapport.
 * Le corpus a aussi attrapé une faute de ma part — « teneur en eau » recopié
 * dans la fiche des lots alors qu'une fiche lui est dédiée, ce qui mettait deux
 * fiches en concurrence sur le même terrain) → 86 (VAGUE 4 : ce qu'on dit
 * vraiment sur le terrain — le vocabulaire de métier employé sans explication,
 * les questions en trois mots, la dictée sans ponctuation. Le corpus plafonnait
 * à 71/71 : un instrument qui affiche 100 % ne mesure plus rien, il ne peut plus
 * que constater une régression. Les quinze nouveaux cas ont fait tomber SIX
 * échecs d'un coup, et derrière eux cinq défauts distincts : deux questions
 * lues comme des ordres d'écriture, un mot-clé fourre-tout qui accaparait toutes
 * les questions sur les hausses, des mots-clés dupliqués entre deux fiches, et
 * un double comptage silencieux dans le calcul de score).
 */
const PLANCHER_REUSSITE = 102;

/**
 * ⚠️ UN PLANCHER GLOBAL SEUL DEVIENT AVEUGLE EN GRANDISSANT, ET C'EST LE VRAI
 * DANGER DE CET INSTRUMENT.
 *
 * Le cliquet global protège un TOTAL. À 102 questions il empêche de descendre
 * sous 102 — mais le jour où le corpus en comptera 300, un plancher resté à 102
 * laissera passer une chute de 300 à 103 sans un mot. Pire : une famille peut
 * s'effondrer entièrement pendant qu'une autre grandit, et la somme ne bouge
 * pas. On mesurerait alors une moyenne, jamais une capacité.
 *
 * Chaque famille porte donc son propre plancher, GELÉ à son niveau du jour.
 * C'est ce qui permet d'ajouter cent questions dont quarante échouent : le
 * reste devient une dette CHIFFRÉE par famille, au lieu d'un blocage qui
 * découragerait d'enrichir le corpus.
 */
const PLANCHER_PAR_FAMILLE: Record<string, number> = {
  debutant: 19,
  pro: 26,
  dictee: 10,
  fautes: 13,
  'multi-faits': 6,
  produits: 12,
  gestes: 8,
  'anti-ordre': 8,
};

describe('corpus Maya — rapport', () => {
  it('imprime où la compréhension coince', () => {
    const pct = (n: number) => `${((n / RESULTATS.length) * 100).toFixed(1)} %`;
    const lignes: string[] = [
      '',
      `CORPUS MAYA — ${RESULTATS.length} questions`,
      '='.repeat(56),
      `  compris et bien orienté  : ${REUSSIS.length}/${RESULTATS.length}  (${pct(REUSSIS.length)})`,
      `  compris mais mal orienté : ${RESULTATS.filter((r) => r.partiel).length}`,
      `  pas compris du tout      : ${RESULTATS.filter((r) => !r.ok && !r.partiel).length}`,
      '',
      'Par famille',
      '-'.repeat(56),
    ];

    for (const f of FAMILLES) {
      const sous = RESULTATS.filter((r) => r.cas.famille === f);
      const ok = sous.filter((r) => r.ok).length;
      const barre = '#'.repeat(Math.round((ok / sous.length) * 20)).padEnd(20, '.');
      lignes.push(`  ${f.padEnd(12)} ${barre} ${ok}/${sous.length}`);
    }

    const echecs = RESULTATS.filter((r) => !r.ok);
    if (echecs.length > 0) {
      lignes.push('', `Échecs (${echecs.length})`, '-'.repeat(56));
      for (const r of echecs) {
        const cible = r.cas.intent ?? r.cas.articleId ?? r.cas.attendu;
        lignes.push(
          '',
          `  « ${r.cas.question} »`,
          `    famille : ${r.cas.famille}`,
          `    attendu : ${r.cas.attendu}${cible !== r.cas.attendu ? ` → ${cible}` : ''}`,
          `    obtenu  : ${r.obtenu}${r.detail ? ` → ${r.detail}` : ''}`,
        );
        if (r.cas.note) lignes.push(`    enjeu   : ${r.cas.note}`);
      }
    }

    console.log(lignes.join('\n'));
    expect(RESULTATS).toHaveLength(CORPUS.length);
  });
});

describe('corpus Maya — cliquet', () => {
  it('la compréhension ne régresse jamais', () => {
    expect(REUSSIS.length).toBeGreaterThanOrEqual(PLANCHER_REUSSITE);
  });

  it('aucune FAMILLE ne régresse, même si le total progresse', () => {
    // Une famille peut s'effondrer pendant qu'une autre grandit : la somme ne
    // bouge pas, et l'instrument ne dit rien. C'est arrivé pendant cette
    // session — deux fiches de savoir en concurrence ont fait tomber
    // « debutant » de 19 à 18 et « dictee » de 10 à 9 au moment même où
    // « anti-ordre » montait de 4 à 6. Le total, lui, était stable.
    const chutes: string[] = [];
    for (const [famille, plancher] of Object.entries(PLANCHER_PAR_FAMILLE)) {
      const sous = RESULTATS.filter((r) => r.cas.famille === famille);
      const ok = sous.filter((r) => r.ok).length;
      if (ok < plancher) chutes.push(`${famille} : ${ok}/${sous.length}, plancher ${plancher}`);
    }
    expect(chutes, 'une capacité a été perdue en silence').toEqual([]);
  });

  it('toute famille du corpus a son plancher', () => {
    // Sans ça, une famille NOUVELLE échapperait au cliquet : elle serait
    // mesurée dans le rapport et gardée par personne — exactement le trou que
    // les planchers par famille sont censés fermer.
    const sansPlancher = FAMILLES.filter((f) => !(f in PLANCHER_PAR_FAMILLE));
    expect(sansPlancher, 'famille non gardée par un plancher').toEqual([]);
  });

  it('le cliquet se RESSERRE : un progrès non enregistré est signalé', () => {
    /**
     * ⚠️ LE CLIQUET QUI NE SE RESSERRE PAS FINIT PAR NE PLUS RIEN TENIR.
     *
     * Un plancher laissé sous le niveau réel autorise silencieusement une
     * régression jusqu'à ce niveau. Le progrès a été fait, personne ne l'a
     * gravé, et il se reperdra sans qu'un test bronche. Ce cas exige donc de
     * REMONTER le plancher dès qu'une famille le dépasse — c'est le seul moyen
     * qu'un gain acquis reste acquis.
     */
    const aRelever: string[] = [];
    for (const [famille, plancher] of Object.entries(PLANCHER_PAR_FAMILLE)) {
      const ok = RESULTATS.filter((r) => r.cas.famille === famille && r.ok).length;
      if (ok > plancher) aRelever.push(`${famille} : ${ok} réussis, plancher encore à ${plancher}`);
    }
    expect(aRelever, 'remonte ces planchers — un progrès qu’on n’enregistre pas se reperd').toEqual(
      [],
    );

    if (REUSSIS.length > PLANCHER_REUSSITE) {
      expect(`PLANCHER_REUSSITE = ${REUSSIS.length}`, 'remonte aussi le plancher global').toBe(
        `PLANCHER_REUSSITE = ${PLANCHER_REUSSITE}`,
      );
    }
  });

  it('ANTI-ORDRE : jamais une écriture non demandée — cliquet DUR', () => {
    /**
     * LE SEUL CLIQUET DE CE FICHIER QUI NE SE NÉGOCIE PAS.
     *
     * Les autres tolèrent une dette chiffrée : une question mal comprise est un
     * travail à faire. Celui-ci n'admet aucun écart, parce que son erreur n'est
     * pas de la même nature. « Elle n'a pas compris » se rattrape en reformulant.
     * « Elle a enregistré ce que je n'ai pas demandé » laisse une intervention
     * fantôme dans un registre d'élevage — un document légal — et fausse le score
     * de santé de la colonie.
     *
     * Depuis que Maya écrit dix gestes au lieu de six, cette surface a doublé.
     * Le cliquet est donc posé sur le RÉSULTAT, pas sur un pourcentage : zéro
     * écriture parasite, sur chacune de ces phrases, toujours.
     */
    const parasites = RESULTATS.filter(
      (r) =>
        r.cas.famille === 'anti-ordre' && r.cas.attendu !== 'ecriture' && r.obtenu === 'ecriture',
    ).map((r) => `« ${r.cas.question} » → écriture ${r.detail}`);
    expect(parasites, 'Maya écrirait quelque chose que personne ne lui a demandé').toEqual([]);
  });

  it('aucune question du corpus n’est en double', () => {
    const vues = new Set(CORPUS.map((c) => c.question.toLowerCase().trim()));
    expect(vues.size).toBe(CORPUS.length);
  });

  it('toute action attendue précise son intention', () => {
    // Sans intention, un « action » réussi ne prouve rien : il pourrait viser
    // n'importe quel écran.
    for (const c of CORPUS.filter((x) => x.attendu === 'action')) {
      if (!c.note) expect(c.intent, `« ${c.question} » sans intent ni note`).toBeTruthy();
    }
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// HYGIÈNE DE LA BASE DE SAVOIR
//
// Le score d'un article est la somme de ses mots-clés retrouvés dans la
// question. Deux écritures d'un MÊME concept comptent donc deux fois, et
// l'article gagne un avantage que personne n'a décidé.
// ═══════════════════════════════════════════════════════════════════════════

describe('base de savoir — hygiène des mots-clés', () => {
  it('aucune fiche ne compte deux fois le même mot-clé', () => {
    // Cinq cas trouvés à l'écriture de la vague 4, dont quatre copiés-collés à
    // l'identique et un plus sournois : « faux bourdon » et « faux-bourdon ».
    // La normalisation transforme le trait d'union en espace, les deux
    // produisent les mêmes jetons — le concept pesait double. C'est ce qui
    // faisait gagner la fiche de biologie générale contre celle qui
    // diagnostique, sur « j'ai des faux bourdons partout ».
    const doublons: string[] = [];
    for (const article of SAVOIR) {
      const vus = new Map<string, string>();
      for (const cle of article.motsCles) {
        const forme = normaliser(cle);
        const deja = vus.get(forme);
        if (deja) doublons.push(`${article.id} : « ${deja} » ≡ « ${cle} »`);
        else vus.set(forme, cle);
      }
    }
    expect(doublons).toEqual([]);
  });

  it('le partage d’expressions entre fiches ne s’étend pas', () => {
    // CLIQUET, et j'ai dû revoir mon jugement pour l'écrire.
    //
    // Je l'avais posé en interdiction : deux fiches ne doivent pas déclarer la
    // même expression, sinon le classement se joue à l'ordre du tableau plutôt
    // qu'à la pertinence. La mesure a répondu 16 partages — et en les lisant,
    // la plupart sont LÉGITIMES. « acide oxalique » appartient autant à la
    // fiche du produit qu'à celle du traitement varroa ; « levé-cadre » à la
    // fiche de l'outil comme à celle de l'équipement du débutant. C'est une
    // relation entre une fiche générale et sa spécialisée, pas une erreur.
    //
    // Le défaut que j'avais corrigé était d'une autre nature : deux fiches de
    // MÊME niveau — « beaucoup de mâles » figurait mot pour mot dans celle qui
    // diagnostique et dans celle de biologie générale, sans qu'aucune ne soit
    // le cas particulier de l'autre. Cette distinction-là, je ne sais pas la
    // faire tenir dans une règle automatique.
    //
    // Donc : pas d'interdiction, un plafond. Il empêche la liste de s'allonger
    // sans que personne ne regarde, et c'est tout ce que ce banc peut honnêtement
    // promettre.
    //
    // Les mots-clés d'UN SEUL mot sont exclus : « varroa » a de bonnes raisons
    // de figurer dans plusieurs fiches, et leur poids est déjà pondéré par leur
    // pouvoir discriminant. Ce sont les EXPRESSIONS, qui valent 4 points
    // chacune, dont le partage pèse sur le calcul.
    const proprietaires = new Map<string, string[]>();
    for (const article of SAVOIR) {
      for (const cle of article.motsCles) {
        const forme = normaliser(cle);
        if (forme.split(' ').filter(Boolean).length < 2) continue;
        proprietaires.set(forme, [...(proprietaires.get(forme) ?? []), article.id]);
      }
    }
    const partages = [...proprietaires.entries()]
      .filter(([, ids]) => ids.length > 1)
      .map(([forme, ids]) => `« ${forme} » : ${ids.join(' + ')}`);
    expect(partages.length, partages.join('\n')).toBeLessThanOrEqual(16);
  });
});
