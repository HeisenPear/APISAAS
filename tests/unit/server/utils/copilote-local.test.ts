import { describe, expect, it } from 'vitest';
import {
  classifier,
  classifierTour,
  convertirNombres,
  normaliser,
} from '../../../../server/utils/copilote-local';
import {
  analyserIntervention,
  analyserClient,
  analyserRecolteProd,
  detecterNavigation,
  memeNumero,
  extraireRucheSeule,
} from '../../../../server/utils/copilote-actions';
import { SAVOIR } from '../../../../server/utils/copilote-savoir';

type Msg = { role: 'user' | 'assistant'; content: string };
const usr = (content: string): Msg => ({ role: 'user', content });
const asst = (content: string): Msg => ({ role: 'assistant', content });

describe('classifier — intentions d’action', () => {
  it('route les questions de visite vers ruches_visiter', () => {
    expect(classifier('Quelles ruches dois-je visiter en priorité ?')).toEqual({
      kind: 'action',
      intent: 'ruches_visiter',
    });
  });

  it('route le point santé vers sante', () => {
    expect(classifier('Fais-moi un point santé de mes colonies')).toEqual({
      kind: 'action',
      intent: 'sante',
    });
  });

  it('route les stocks, finances, météo, alertes', () => {
    expect(classifier('Mes stocks sont-ils bas ?')).toMatchObject({ intent: 'stocks' });
    expect(classifier('Quel est mon chiffre d’affaires ?')).toMatchObject({ intent: 'finances' });
    expect(classifier('La météo permet-elle une visite demain ?')).toMatchObject({
      intent: 'meteo',
    });
    expect(classifier('Quelles sont mes alertes ?')).toMatchObject({ intent: 'alertes' });
  });

  it('insensible aux accents et à la casse', () => {
    expect(classifier('METEO du rucher ?')).toMatchObject({ kind: 'action', intent: 'meteo' });
    expect(classifier('mon chiffre d affaires')).toMatchObject({ intent: 'finances' });
  });
});

describe('classifier — base de savoir', () => {
  it('reconnaît une question sur le varroa', () => {
    const r = classifier('Comment traiter contre le varroa ?');
    expect(r.kind).toBe('savoir');
  });

  it('reconnaît une question sur l’essaimage', () => {
    expect(classifier("Qu'est-ce que l'essaimage ?")).toEqual({
      kind: 'savoir',
      articleId: 'essaimage',
    });
  });

  it('reconnaît une question réglementaire (déclaration de ruches)', () => {
    const r = classifier('Dois-je déclarer mes ruches chaque année ?');
    expect(r.kind).toBe('savoir');
    if (r.kind === 'savoir') expect(r.articleId).toBe('declaration-ruches');
  });

  it('chaque articleId retourné existe bien dans la base', () => {
    const ids = new Set(SAVOIR.map((a) => a.id));
    for (const q of [
      'pourquoi mon miel cristallise',
      'quand récolter le miel',
      'comment préparer hivernage',
      'le frelon asiatique attaque mes ruches',
    ]) {
      const r = classifier(q);
      if (r.kind === 'savoir') expect(ids.has(r.articleId)).toBe(true);
    }
  });
});

describe('classifier — salutations et repli', () => {
  it('détecte une salutation courte', () => {
    expect(classifier('Bonjour')).toEqual({ kind: 'salutation' });
    expect(classifier('Merci !')).toEqual({ kind: 'salutation' });
  });

  it('retombe sur inconnu pour du hors-sujet', () => {
    expect(classifier('Quelle est la capitale du Pérou ?')).toEqual({ kind: 'inconnu' });
    expect(classifier('azerty qwerty 123')).toEqual({ kind: 'inconnu' });
  });

  it('une phrase longue commençant par bonjour n’est pas qu’une salutation', () => {
    const r = classifier('Bonjour, quelles ruches dois-je visiter cette semaine ?');
    expect(r.kind).toBe('action');
  });
});

describe('base de savoir — intégrité', () => {
  it('aucun id en double', () => {
    const ids = SAVOIR.map((a) => a.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('chaque article a des mots-clés et un contenu non vide', () => {
    for (const a of SAVOIR) {
      expect(a.motsCles.length).toBeGreaterThan(0);
      expect(a.contenu.length).toBeGreaterThan(40);
    }
  });

  // Garde-fou anti « suggestion sans réponse » : toute question proposée en
  // rebond (voirAussi) DOIT être comprise par le classifieur (savoir/action),
  // jamais 'inconnu'. Empêche de suggérer une question à laquelle on ne sait
  // pas répondre — exactement le bug remonté en test.
  it('chaque suggestion voirAussi trouve une réponse', () => {
    const orphelines: string[] = [];
    for (const article of SAVOIR) {
      for (const sugg of article.voirAussi ?? []) {
        const r = classifier(sugg);
        if (r.kind === 'inconnu') orphelines.push(sugg);
      }
    }
    expect(orphelines).toEqual([]);
  });
});

describe('classifier — robustesse (synonymes & fautes de frappe)', () => {
  it('comprend les synonymes courants', () => {
    expect(classifier('Comment soigner le varroa ?').kind).toBe('savoir');
    expect(classifier('Comment écouler mon miel ?').kind).toBe('savoir');
    expect(classifier('Quels sont mes revenus cette année ?')).toMatchObject({
      intent: 'finances',
    });
  });

  it('tolère une faute de frappe sur un mot-clé long', () => {
    expect(classifier('comment traiter le varoa').kind).toBe('savoir');
    expect(classifier("comment preparer l'hivernag").kind).toBe('savoir');
  });

  it('ne sur-déclenche pas sur du charabia ou du hors-sujet', () => {
    expect(classifier('azerty qwerty 123')).toEqual({ kind: 'inconnu' });
    expect(classifier('Quelle est la capitale du Pérou ?')).toEqual({ kind: 'inconnu' });
  });
});

describe('classifier — nouvelles fiches de savoir', () => {
  it('route les nouvelles thématiques vers la bonne fiche', () => {
    expect(classifier('Comment élever des reines ?')).toMatchObject({
      articleId: 'elevage-reines',
    });
    expect(classifier('Quels types de ruches existe-t-il ?')).toMatchObject({
      articleId: 'types-ruches',
    });
    expect(classifier('Comment transhumer mes ruches ?')).toMatchObject({
      articleId: 'transhumance',
    });
    expect(classifier('Je débute en apiculture, par où commencer ?')).toMatchObject({
      articleId: 'debuter-apiculture',
    });
  });
});

describe('base de savoir — contextualisation', () => {
  it('le champ contexte ne prend que des valeurs connues', () => {
    for (const a of SAVOIR) {
      if (a.contexte !== undefined) expect(['saison', 'ruches']).toContain(a.contexte);
    }
  });

  it('au moins une fiche saison et une fiche ruches sont taguées', () => {
    expect(SAVOIR.some((art) => art.contexte === 'saison')).toBe(true);
    expect(SAVOIR.some((art) => art.contexte === 'ruches')).toBe(true);
  });
});

describe('classifier — question « méta » (capacités)', () => {
  it('reconnaît une demande sur les capacités du Copilote', () => {
    expect(classifier('Que peux-tu faire ?')).toEqual({ kind: 'capacites' });
    expect(classifier('À quoi tu sers ?')).toEqual({ kind: 'capacites' });
    expect(classifier('aide')).toEqual({ kind: 'capacites' });
  });
});

describe('classifierTour — mémoire conversationnelle', () => {
  it('reprend l’intention précédente sur un suivi elliptique (« et 2024 ? »)', () => {
    const tour = classifierTour([
      usr('Quel est mon chiffre d’affaires ?'),
      asst('…'),
      usr('et 2024 ?'),
    ]);
    expect(tour).toEqual({ kind: 'action', intent: 'finances', suivi: true });
  });

  it('approfondit une fiche de savoir sur un déictique (« détaille »)', () => {
    const tour = classifierTour([usr("Qu'est-ce que l'essaimage ?"), asst('…'), usr('détaille')]);
    expect(tour).toMatchObject({ kind: 'savoir', articleId: 'essaimage' });
  });

  it('comprend une vraie nouvelle intention même commençant par « et »', () => {
    const tour = classifierTour([
      usr('Mon chiffre d’affaires ?'),
      asst('…'),
      usr('et mes stocks ?'),
    ]);
    expect(tour).toMatchObject({ kind: 'action', intent: 'stocks', suivi: false });
  });

  it('un suivi sans contexte antérieur retombe sur inconnu', () => {
    expect(classifierTour([usr('et 2024 ?')])).toEqual({ kind: 'inconnu' });
  });

  it('garde-fous d’entrée : vide ou sans message utilisateur → capacités', () => {
    expect(classifierTour([asst('bonjour')])).toEqual({ kind: 'capacites' });
    expect(classifierTour([usr('   ')])).toEqual({ kind: 'capacites' });
  });

  it('une salutation reste une salutation', () => {
    expect(classifierTour([usr('Bonjour')])).toMatchObject({ kind: 'salutation' });
  });

  it('une question de savoir claire n’est pas transformée en clarification', () => {
    expect(classifierTour([usr('Comment traiter contre le varroa ?')])).toMatchObject({
      kind: 'savoir',
    });
  });
});

describe('actions — navigation (raccourci universel)', () => {
  it('reconnaît un raccourci avec verbe + cible', () => {
    expect(detecterNavigation(normaliser('Ouvre une nouvelle vente'))?.id).toBe('vente-nouvelle');
    expect(detecterNavigation(normaliser('Emmène-moi sur le tableau de bord'))?.id).toBe(
      'dashboard',
    );
    expect(detecterNavigation(normaliser('va à la page transhumance'))?.id).toBe('transhumance');
  });

  it('ne déclenche pas de navigation sans verbe de navigation (lecture pure)', () => {
    expect(detecterNavigation(normaliser('mes stocks sont-ils bas ?'))).toBeNull();
    expect(detecterNavigation(normaliser('quelles ruches visiter ?'))).toBeNull();
  });
});

describe('actions — analyse d’une intervention par écrit', () => {
  it('parse un contrôle avec observations', () => {
    const raw = 'Note une visite ruche 12 : reine vue, 6 cadres de couvain, pas de varroa';
    const p = analyserIntervention(normaliser(raw), raw);
    expect(p.rucheNumero).toBe('12');
    expect(p.type).toBe('controle');
    expect(p.donnees).toMatchObject({
      reineVue: true,
      couvainPresent: true,
      comportement: 'calme',
      forceColonie: 3,
    });
  });

  it('parse une note libre (commentaire) en conservant le texte', () => {
    const raw = 'note sur la ruche 7 : pailler le toit avant l’hiver';
    const p = analyserIntervention(normaliser(raw), raw);
    expect(p.rucheNumero).toBe('7');
    expect(p.type).toBe('commentaire');
    expect((p.donnees as { texte: string }).texte).toContain('pailler le toit');
  });

  it('détecte la négation (« pas de reine »)', () => {
    const raw = 'enregistre un contrôle ruche 3 : pas de reine, couvain présent';
    const p = analyserIntervention(normaliser(raw), raw);
    expect(p.type).toBe('controle');
    expect((p.donnees as { reineVue: boolean | null }).reineVue).toBe(false);
  });

  it('signale la ruche manquante', () => {
    const raw = 'note une visite : reine vue';
    const p = analyserIntervention(normaliser(raw), raw);
    expect(p.manque).toContain('ruche');
  });
});

describe('classifierTour — actions explicites vs lectures', () => {
  it('route l’écriture d’intervention vers ecriture', () => {
    const tour = classifierTour([usr('Note une visite ruche 12 : reine vue, couvain')]);
    expect(tour).toMatchObject({ kind: 'ecriture' });
    if (tour.kind === 'ecriture' && tour.ecriture.action === 'intervention') {
      expect(tour.ecriture.parse.rucheNumero).toBe('12');
      expect(tour.ecriture.parse.type).toBe('controle');
    }
  });

  it('route un raccourci vers navigation', () => {
    expect(classifierTour([usr('Ouvre une nouvelle vente')])).toMatchObject({
      kind: 'navigation',
    });
  });

  it('ne confond pas la lecture « mes interventions » avec une écriture', () => {
    expect(classifierTour([usr('Montre mes interventions récentes')])).toMatchObject({
      kind: 'action',
      intent: 'interventions',
    });
  });
});

describe('actions — écriture souple (formulations humaines)', () => {
  it('comprend des références de ruche variées', () => {
    expect(analyserIntervention(normaliser('note sur la 12 reine vue'), 'x').rucheNumero).toBe(
      '12',
    );
    expect(analyserIntervention(normaliser('controle ruche n°7 couvain'), 'x').rucheNumero).toBe(
      '7',
    );
    expect(
      analyserIntervention(normaliser('ajoute une visite ruche numero 5 reine'), 'x').rucheNumero,
    ).toBe('5');
  });

  it('détecte une écriture SANS verbe explicite (ruche + observations)', () => {
    const tour = classifierTour([usr('ruche 8 reine vue, couvain operculé, colonie forte')]);
    expect(tour).toMatchObject({ kind: 'ecriture' });
    if (tour.kind === 'ecriture' && tour.ecriture.action === 'intervention') {
      expect(tour.ecriture.parse.rucheNumero).toBe('8');
      expect(tour.ecriture.parse.donnees).toMatchObject({ couvainPresent: true, forceColonie: 4 });
    }
  });

  it('ne prend pas une QUESTION sur une ruche pour un ordre d’écriture', () => {
    expect(classifierTour([usr('La reine de la ruche 12 va bien ?')]).kind).not.toBe('ecriture');
    expect(classifierTour([usr('Comment noter une intervention ?')]).kind).not.toBe('ecriture');
  });

  it('comprend les synonymes d’observation (RAS, populeuse, pas vu la reine)', () => {
    const p = analyserIntervention(
      normaliser('enregistre ruche 4 : ras, colonie populeuse, pas vu la reine'),
      'x',
    );
    expect(p.donnees).toMatchObject({ comportement: 'calme', forceColonie: 4, reineVue: false });
  });
});

describe('classifierTour — slot-filling conversationnel', () => {
  it('complète la ruche manquante au tour suivant', () => {
    const tour = classifierTour([
      usr('note une visite : reine vue, couvain, pas de varroa'),
      asst('Sur quelle ruche ?'),
      usr('la 12'),
    ]);
    expect(tour).toMatchObject({ kind: 'ecriture' });
    if (tour.kind === 'ecriture' && tour.ecriture.action === 'intervention') {
      expect(tour.ecriture.parse.rucheNumero).toBe('12');
      expect(tour.ecriture.parse.manque).not.toContain('ruche');
      expect(tour.ecriture.parse.donnees).toMatchObject({ reineVue: true, couvainPresent: true });
    }
  });

  it('« la 12 » sans écriture précédente reste inconnu', () => {
    expect(classifierTour([usr('la 12')])).toEqual({ kind: 'inconnu' });
  });
});

describe('compréhension — nombres en toutes lettres (prêt vocal)', () => {
  it('convertit les nombres écrits', () => {
    expect(convertirNombres('ruche douze')).toBe('ruche 12');
    expect(convertirNombres('quatre vingt douze')).toBe('92');
    expect(convertirNombres('soixante et onze')).toBe('71');
    expect(convertirNombres('deux mille vingt quatre')).toBe('2024');
    expect(convertirNombres('trente cinq cadres')).toBe('35 cadres');
  });

  it('comprend « ruche douze » dans une écriture (saisie vocale)', () => {
    const tour = classifierTour([usr('note une visite ruche douze : reine vue, couvain')]);
    expect(tour).toMatchObject({ kind: 'ecriture' });
    if (tour.kind === 'ecriture' && tour.ecriture.action === 'intervention')
      expect(tour.ecriture.parse.rucheNumero).toBe('12');
  });
});

describe('compréhension — synonymes élargis', () => {
  it('mappe le vocabulaire courant vers les bons sujets', () => {
    expect(classifier('comment lutter contre les acariens').kind).toBe('savoir');
    expect(classifier('combien je gagne avec mes ruches')).toMatchObject({ intent: 'finances' });
    expect(classifier('mes abeilles sont mortes, pourquoi').kind).toBe('savoir');
  });
});

describe('compréhension — repli « vouliez-vous dire »', () => {
  it('du charabia reste inconnu', () => {
    expect(classifierTour([usr('azerty qwerty zzz')])).toEqual({ kind: 'inconnu' });
  });
});

describe('savoir — nouvelles fiches fréquentes', () => {
  it('répond aux questions ajoutées', () => {
    expect(classifier('pourquoi mes colonies se pillent')).toMatchObject({ articleId: 'pillage' });
    expect(classifier('comment marquer la reine')).toMatchObject({ articleId: 'marquage-reine' });
    expect(classifier('combien de miel par ruche').kind).toBe('savoir');
    expect(classifier('le miel peut il perimer').kind).toBe('savoir');
  });

  it('répond aux fiches de profondeur (lot 73)', () => {
    expect(classifier("c'est quoi l'operculation").kind).toBe('savoir');
    expect(classifier('a quoi sert la grille a reine').kind).toBe('savoir');
    expect(classifier("qu'est ce qu'un essaim secondaire").kind).toBe('savoir');
    expect(classifier('je me suis fait piquer').kind).toBe('savoir');
  });
});

describe('actions — écriture multi-types', () => {
  it('parse un nourrissement', () => {
    const p = analyserIntervention(normaliser('note ruche 5 : nourri 2 kg de candi'), 'x');
    expect(p.type).toBe('nourrissement');
    expect(p.donnees).toMatchObject({ type: 'candi', quantite: 2, unite: 'kg' });
  });

  it('parse une récolte', () => {
    const p = analyserIntervention(normaliser('ruche 3 récolté du miel'), 'x');
    expect(p.type).toBe('recolte');
    expect(p.donnees).toMatchObject({ typeProduit: 'miel' });
  });

  it('parse une pesée', () => {
    const p = analyserIntervention(normaliser('ruche 7 pesée 38 kg'), 'x');
    expect(p.type).toBe('pesee');
    expect(p.donnees).toMatchObject({ poidsKg: 38, typePesee: 'totale' });
  });

  it('parse un comptage varroa', () => {
    const p = analyserIntervention(normaliser('ruche 4 : 12 varroas sur 3 jours'), 'x');
    expect(p.type).toBe('varroa');
    expect(p.donnees).toMatchObject({
      sousAction: 'comptage_plancher',
      nombreVarroas: 12,
      dureeJours: 3,
    });
  });

  it('détecte une écriture de geste sans verbe explicite', () => {
    const tour = classifierTour([usr('ruche 8 nourri 1,5 litre de sirop')]);
    expect(tour).toMatchObject({ kind: 'ecriture' });
    if (tour.kind === 'ecriture' && tour.ecriture.action === 'intervention')
      expect(tour.ecriture.parse.type).toBe('nourrissement');
  });
});

describe('actions — nouveaux raccourcis de navigation', () => {
  it('ouvre les pages ajoutées', () => {
    expect(detecterNavigation(normaliser('ouvre les ordonnances'))?.id).toBe('ordonnances');
    expect(detecterNavigation(normaliser('va à l’élevage de reines'))?.id).toBe('elevage');
    expect(detecterNavigation(normaliser('ouvre les bons de livraison'))?.id).toBe(
      'bons-livraison',
    );
  });
});

describe('actions — résolution robuste des ruches', () => {
  it('memeNumero tolère zéros, préfixes et casse', () => {
    expect(memeNumero('12', '12')).toBe(true);
    expect(memeNumero('012', '12')).toBe(true);
    expect(memeNumero('R12', '12')).toBe(true);
    expect(memeNumero('n°5', '5')).toBe(true);
    expect(memeNumero('12', '13')).toBe(false);
    expect(memeNumero('A', 'B')).toBe(false);
  });

  it('extraireRucheSeule comprend les réponses de clarification', () => {
    expect(extraireRucheSeule('Ruche 3')).toBe('3');
    expect(extraireRucheSeule('la 7')).toBe('7');
    expect(extraireRucheSeule('5')).toBe('5');
    expect(extraireRucheSeule('Ruche 2 (Rucher des Tilleuls)')).toBe('2');
    expect(extraireRucheSeule('comment traiter le varroa')).toBeUndefined();
  });
});

describe('classifierTour — slot-filling ruche (clic sur suggestion)', () => {
  const ecrireSansRuche = usr('Note une visite : reine vue, couvain, pas de varroa');

  it('complète l’écriture quand on clique « Ruche 2 (Rucher des Tilleuls) »', () => {
    const d = classifierTour([
      ecrireSansRuche,
      asst('Sur quelle ruche je note ça ?'),
      usr('Ruche 2 (Rucher des Tilleuls)'),
    ]);
    expect(d.kind).toBe('ecriture');
    if (d.kind === 'ecriture' && d.ecriture.action === 'intervention') {
      expect(d.ecriture.parse.rucheNumero).toBe('2');
      expect(d.ecriture.parse.rucherIndice).toBe('des tilleuls');
      expect(d.ecriture.parse.type).toBe('controle');
    }
  });

  it('complète aussi avec un simple « la 3 »', () => {
    const d = classifierTour([ecrireSansRuche, asst('?'), usr('la 3')]);
    expect(d.kind).toBe('ecriture');
    if (d.kind === 'ecriture' && d.ecriture.action === 'intervention')
      expect(d.ecriture.parse.rucheNumero).toBe('3');
  });

  it('ne détourne PAS une vraie nouvelle question vers le slot-filling', () => {
    const d = classifierTour([
      ecrireSansRuche,
      asst('?'),
      usr('Quelles ruches visiter en priorité ?'),
    ]);
    expect(d).toMatchObject({ kind: 'action', intent: 'ruches_visiter' });
  });
});

describe('analyserIntervention — quantités décimales (bug 1,5 → 5)', () => {
  const a = (s: string) => analyserIntervention(normaliser(s), s);

  it('préserve les décimales d’un nourrissement', () => {
    const r = a('Ruche 7 : 1,5 litre de sirop');
    expect(r.type).toBe('nourrissement');
    expect((r.donnees as { quantite: number }).quantite).toBe(1.5);
  });

  it('préserve les décimales d’une pesée (37,5 kg, pas 5)', () => {
    const r = a('Ruche 4 pesée 37,5 kg');
    expect(r.type).toBe('pesee');
    expect((r.donnees as { poidsKg: number }).poidsKg).toBe(37.5);
  });

  it('détecte les réserves au pluriel', () => {
    expect((a('Ruche 1 beaucoup de réserves').donnees as { reserves: boolean }).reserves).toBe(
      true,
    );
    expect((a('Ruche 2 pas de réserves').donnees as { reserves: boolean }).reserves).toBe(false);
  });
});

describe('action — création de client (chat)', () => {
  const norm = (s: string) => normaliser(s);

  it('parse nom + email + téléphone', () => {
    const c = analyserClient(
      norm('Ajoute un client : Jean Dupont, jean@miel.fr, 06 12 34 56 78'),
      'Ajoute un client : Jean Dupont, jean@miel.fr, 06 12 34 56 78',
    );
    expect(c).not.toBeNull();
    expect(c?.nom).toBe('Jean Dupont');
    expect(c?.email).toBe('jean@miel.fr');
    expect(c?.telephone).toBe('0612345678');
    expect(c?.manque).toEqual([]);
  });

  it('nom seul suffit', () => {
    const c = analyserClient(
      norm('Nouveau client Miellerie du Sud'),
      'Nouveau client Miellerie du Sud',
    );
    expect(c?.nom).toBe('Miellerie du Sud');
    expect(c?.manque).toEqual([]);
  });

  it('ignore une simple lecture (« mes clients »)', () => {
    expect(analyserClient(norm('Montre mes clients'), 'Montre mes clients')).toBeNull();
    expect(
      analyserClient(norm('Combien de clients ai-je ?'), 'Combien de clients ai-je ?'),
    ).toBeNull();
  });

  it('classifierTour route la création de client vers ecriture/client', () => {
    const d = classifierTour([usr('Ajoute un client : Marie Martin')]);
    expect(d.kind).toBe('ecriture');
    if (d.kind === 'ecriture') {
      expect(d.ecriture.action).toBe('client');
      if (d.ecriture.action === 'client') expect(d.ecriture.parse.nom).toBe('Marie Martin');
    }
  });

  it('« crée un client » ne part PAS en navigation', () => {
    const d = classifierTour([usr('Crée un client Paul')]);
    expect(d.kind).toBe('ecriture');
  });
});

describe('action — récolte de production (chat)', () => {
  const a = (s: string) => analyserRecolteProd(normaliser(s), s);

  it('parse quantité + variété', () => {
    const r = a("J'ai récolté 25 kg de toutes fleurs");
    expect(r).not.toBeNull();
    expect(r?.quantiteKg).toBe(25);
    expect(r?.typeMiel).toBe('toutes fleurs');
  });

  it('gère les décimales et les variétés à accents', () => {
    const r = a("récolte de 12,5 kg d'acacia");
    expect(r?.quantiteKg).toBe(12.5);
    expect(r?.typeMiel).toBe('acacia');
    expect(a('extraction de 8 kg de châtaignier')?.typeMiel).toBe('châtaignier');
  });

  it('SANS quantité → pas une récolte de production (reste une intervention)', () => {
    expect(a('Ruche 2 récolté du miel')).toBeNull();
  });

  it('classifierTour route « récolté X kg » vers ecriture/recolte', () => {
    const d = classifierTour([usr("J'ai récolté 30 kg de lavande")]);
    expect(d.kind).toBe('ecriture');
    if (d.kind === 'ecriture') expect(d.ecriture.action).toBe('recolte');
  });

  it('« ruche 2 récolté du miel » reste une intervention', () => {
    const d = classifierTour([usr('Ruche 2 récolté du miel')]);
    expect(d.kind).toBe('ecriture');
    if (d.kind === 'ecriture') expect(d.ecriture.action).toBe('intervention');
  });
});
