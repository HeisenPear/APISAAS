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
  analyserStock,
  detecterNavigation,
  memeNumero,
  extraireRucheSeule,
  lireTypeIntervention,
  lireForce,
  lireComportement,
  lireTypeNourriture,
  lireUnite,
  lireProduitRecolte,
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
  it('parse un contrôle avec observations (ne devine PAS force/comportement)', () => {
    const raw = 'Note une visite ruche 12 : reine vue, 6 cadres de couvain, pas de varroa';
    const p = analyserIntervention(normaliser(raw), raw);
    expect(p.rucheNumero).toBe('12');
    expect(p.type).toBe('controle');
    // Seules les observations DITES sont renseignées…
    expect(p.donnees).toMatchObject({ reineVue: true, couvainPresent: true });
    // …les champs requis non écrits restent à demander (flux guidé).
    expect(p.donnees).not.toHaveProperty('forceColonie');
    expect(p.manque).toEqual(expect.arrayContaining(['forceColonie', 'comportement']));
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

describe('flux guidé — proposer une intervention puis demander les champs', () => {
  it('« fais une intervention » (sans détail) → propose le type', () => {
    expect(classifierTour([usr('fais une intervention')])).toEqual({ kind: 'choisir_type' });
    expect(classifierTour([usr('je veux noter une intervention')])).toEqual({
      kind: 'choisir_type',
    });
    expect(classifierTour([usr('ajoute une intervention')])).toEqual({ kind: 'choisir_type' });
  });

  it('après le choix du type, demande le premier champ manquant', () => {
    const tour = classifierTour([
      usr('fais une intervention'),
      asst('Quel type ?'),
      usr('Contrôle'),
    ]);
    expect(tour).toMatchObject({ kind: 'ecriture' });
    if (tour.kind === 'ecriture' && tour.ecriture.action === 'intervention') {
      const p = tour.ecriture.parse;
      expect(p.type).toBe('controle');
      expect(p.manque[0]).toBe('reineVue');
      expect(p.manque).toEqual(expect.arrayContaining(['forceColonie', 'comportement', 'ruche']));
    }
  });

  it('séquence contrôle complète → enregistrable (manque vide)', () => {
    const tour = classifierTour([
      usr('fais une intervention'),
      asst('?'),
      usr('Contrôle'),
      asst('?'),
      usr('Reine vue'),
      asst('?'),
      usr('Couvain présent'),
      asst('?'),
      usr('Réserves OK'),
      asst('?'),
      usr('Force 4'),
      asst('?'),
      usr('Calme'),
      asst('?'),
      usr('Ruche 7'),
    ]);
    expect(tour).toMatchObject({ kind: 'ecriture' });
    if (tour.kind === 'ecriture' && tour.ecriture.action === 'intervention') {
      const p = tour.ecriture.parse;
      expect(p.rucheNumero).toBe('7');
      expect(p.manque).toEqual([]);
      expect(p.donnees).toMatchObject({
        reineVue: true,
        couvainPresent: true,
        reserves: true,
        forceColonie: 4,
        comportement: 'calme',
      });
    }
  });

  it('saute les champs déjà écrits (« si la personne ne l’écrit pas »)', () => {
    const tour = classifierTour([usr('note un contrôle ruche 7 : reine vue, force 4, calme')]);
    expect(tour).toMatchObject({ kind: 'ecriture' });
    if (tour.kind === 'ecriture' && tour.ecriture.action === 'intervention') {
      const p = tour.ecriture.parse;
      expect(p.donnees).toMatchObject({ reineVue: true, forceColonie: 4, comportement: 'calme' });
      expect(p.manque).toEqual(expect.arrayContaining(['couvainPresent', 'reserves']));
      expect(p.manque).not.toContain('forceColonie');
      expect(p.manque).not.toContain('ruche');
    }
  });

  it('peut passer un champ optionnel (« Passer »)', () => {
    const tour = classifierTour([
      usr('fais une intervention'),
      asst('?'),
      usr('Contrôle'),
      asst('?'),
      usr('Passer'),
    ]);
    if (tour.kind === 'ecriture' && tour.ecriture.action === 'intervention') {
      const p = tour.ecriture.parse;
      expect(p.donnees).toMatchObject({ reineVue: null });
      expect(p.manque).not.toContain('reineVue');
      expect(p.manque[0]).toBe('couvainPresent');
    }
  });

  it('nourrissement guidé : type puis quantité+unité d’un coup', () => {
    const tour = classifierTour([
      usr('fais une intervention'),
      asst('?'),
      usr('Nourrissement'),
      asst('?'),
      usr('Candi'),
      asst('?'),
      usr('2 kg'),
      asst('?'),
      usr('la 3'),
    ]);
    if (tour.kind === 'ecriture' && tour.ecriture.action === 'intervention') {
      const p = tour.ecriture.parse;
      expect(p.type).toBe('nourrissement');
      expect(p.donnees).toMatchObject({ type: 'candi', quantite: 2, unite: 'kg' });
      expect(p.rucheNumero).toBe('3');
      expect(p.manque).toEqual([]);
    }
  });

  it('« fais un nourrissement » → flux nourrissement direct (sans choisir_type)', () => {
    const tour = classifierTour([usr('fais un nourrissement')]);
    expect(tour).toMatchObject({ kind: 'ecriture' });
    if (tour.kind === 'ecriture' && tour.ecriture.action === 'intervention') {
      expect(tour.ecriture.parse.type).toBe('nourrissement');
      expect(tour.ecriture.parse.manque[0]).toBe('type');
    }
  });

  it('garde-fou : une question pendant le flux n’est pas prise pour une valeur', () => {
    const tour = classifierTour([
      usr('fais une intervention'),
      asst('?'),
      usr('Contrôle'),
      asst('?'),
      usr('c’est quoi le varroa ?'),
    ]);
    expect(tour.kind).not.toBe('ecriture');
  });

  it('changer d’avis (navigation) en plein flux ne reste pas bloqué sur le type', () => {
    const tour = classifierTour([
      usr('fais une intervention'),
      asst('?'),
      usr('montre mes ruchers'),
    ]);
    expect(tour.kind).not.toBe('choisir_type');
    expect(tour.kind).not.toBe('ecriture');
  });

  it('une LECTURE pendant le choix du type n’est pas prise pour un type', () => {
    const tour = classifierTour([
      usr('fais une intervention'),
      asst('?'),
      usr('montre mes récoltes'),
    ]);
    expect(tour.kind).not.toBe('ecriture'); // pas une intervention de récolte vide
  });

  it('refuse une quantité nulle (redemande au lieu d’un échec Zod)', () => {
    const tour = classifierTour([
      usr('fais une intervention'),
      asst('?'),
      usr('Nourrissement'),
      asst('?'),
      usr('Candi'),
      asst('?'),
      usr('0 kg'),
    ]);
    if (tour.kind === 'ecriture' && tour.ecriture.action === 'intervention') {
      expect(tour.ecriture.parse.manque).toContain('quantite');
      expect(tour.ecriture.parse.donnees).not.toHaveProperty('quantite');
    }
  });

  it('arrondit un comptage de varroas décimal (Zod .int())', () => {
    const tour = classifierTour([
      usr('fais une intervention'),
      asst('?'),
      usr('Comptage varroa'),
      asst('?'),
      usr('12.5'),
      asst('?'),
      usr('la 3'),
    ]);
    if (tour.kind === 'ecriture' && tour.ecriture.action === 'intervention') {
      expect(tour.ecriture.parse.donnees).toMatchObject({ nombreVarroas: 13 });
      expect(tour.ecriture.parse.manque).toEqual([]);
    }
  });

  it('résout une ruche NOMMÉE en réponse (« Ruche royal »)', () => {
    const tour = classifierTour([
      usr('note une visite : reine vue, couvain, force 3, calme, réserves ok'),
      asst('Sur quelle ruche ?'),
      usr('Ruche royal'),
    ]);
    expect(tour).toMatchObject({ kind: 'ecriture' });
    if (tour.kind === 'ecriture' && tour.ecriture.action === 'intervention') {
      expect(tour.ecriture.parse.rucheLabel).toContain('royal');
      expect(tour.ecriture.parse.manque).not.toContain('ruche');
    }
  });
});

describe('flux guidé — extracteurs de valeurs (chips)', () => {
  it('lit le type d’intervention depuis les chips', () => {
    expect(lireTypeIntervention(normaliser('Contrôle'))).toBe('controle');
    expect(lireTypeIntervention(normaliser('Comptage varroa'))).toBe('varroa');
    expect(lireTypeIntervention(normaliser('Pesée'))).toBe('pesee');
    expect(lireTypeIntervention(normaliser('Récolte'))).toBe('recolte');
    expect(lireTypeIntervention(normaliser('Note libre'))).toBe('commentaire');
  });

  it('lit force / comportement / nourriture / unité / produit', () => {
    expect(lireForce(normaliser('Force 3'))).toBe(3);
    expect(lireForce('4')).toBe(4);
    expect(lireForce(normaliser('colonie forte'))).toBe(4);
    expect(lireComportement(normaliser('Agressive'))).toBe('agressive');
    expect(lireTypeNourriture(normaliser('Pâte protéique'))).toBe('pate_proteique');
    expect(lireTypeNourriture(normaliser('Sirop de glucose'))).toBe('sirop_glucose');
    expect(lireUnite(normaliser('litres'))).toBe('litres');
    expect(lireProduitRecolte(normaliser('Pollen'))).toBe('pollen');
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

  it('« parle-moi des abeilles » → aperçu biologie (et non le fallback capacités)', () => {
    expect(classifier('parle moi des abeilles')).toMatchObject({
      kind: 'savoir',
      articleId: 'abeilles-generalites',
    });
    // …sans détourner les questions précises :
    expect(classifier('comment naît une abeille').articleId).toBe('cycle-developpement');
  });

  it('comprend l’intention d’apprendre (« explique-moi », « dis m’en plus »)', () => {
    expect(classifier('explique moi les abeilles').kind).toBe('savoir');
    expect(classifier('dis m en plus sur l essaimage').kind).toBe('savoir');
    expect(classifier('parle moi du varroa').kind).toBe('savoir');
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

describe('action — mouvement de stock (chat)', () => {
  const a = (s: string) => analyserStock(normaliser(s), s);

  it('entrée : exige le mot « stock », garde le numéro de l’article', () => {
    const r = a('Ajoute 12 Pot 500g au stock');
    expect(r?.type).toBe('entree');
    expect(r?.quantite).toBe(12);
    expect(r?.articleQuery).toContain('500g'); // le « 500 » de l'article n'est pas effacé
  });

  it('sortie : un verbe de consommation suffit', () => {
    const r = a("J'ai utilisé 3 cadres");
    expect(r?.type).toBe('sortie');
    expect(r?.quantite).toBe(3);
  });

  it('« ajoute 2 kg de candi ruche 3 » n’est PAS un mouvement de stock', () => {
    expect(a('Ajoute 2 kg de candi ruche 3')).toBeNull(); // pas de « stock » + vise une ruche
  });

  it('une simple lecture (« montre mon stock ») n’est pas un mouvement', () => {
    expect(a('Montre mon stock')).toBeNull();
  });

  it('classifierTour : « j’ai utilisé 3 cadres » → ecriture/stock', () => {
    const d = classifierTour([usr("J'ai utilisé 3 cadres")]);
    expect(d.kind).toBe('ecriture');
    if (d.kind === 'ecriture') expect(d.ecriture.action).toBe('stock');
  });
});

describe('robustesse — audit compréhension (régressions)', () => {
  it('salutations naturelles longues + variantes vocales', () => {
    expect(classifier('bonne nuit mon ami').kind).toBe('salutation');
    expect(classifier('merci beaucoup de tout').kind).toBe('salutation');
    expect(classifier('merciiii').kind).toBe('salutation'); // lettres répétées
    expect(classifier('parfait').kind).toBe('salutation');
    expect(classifier('salutations').kind).toBe('salutation');
    // …mais une salutation SUIVIE d'une vraie demande part en action :
    expect(classifier('bonjour quelles ruches visiter')).toMatchObject({
      kind: 'action',
      intent: 'ruches_visiter',
    });
  });

  it('savoir : formulations naturelles désormais couvertes', () => {
    expect(classifier("comment évaluer la force d'une colonie").kind).toBe('savoir');
    expect(classifier("que faire si ma reine s'en va").kind).toBe('savoir');
    expect(classifier('mes colonies disparaissent').kind).toBe('savoir');
    expect(classifier('comment féconder une reine').kind).toBe('savoir');
  });

  it('intents : banque/finances, santé non générique, alertes, anti-faux-positif', () => {
    expect(classifier("j'ai combien en banque")).toMatchObject({ intent: 'finances' });
    expect(classifier('comment vont les stocks')).toMatchObject({ intent: 'stocks' });
    expect(classifier('comment vont mes ruches')).toMatchObject({ intent: 'sante' });
    expect(classifier('quoi de neuf')).toMatchObject({ intent: 'alertes' });
    expect(classifier('ca va bien cette semaine')).not.toMatchObject({ intent: 'finances' });
  });

  it('navigation : trigger multi-mots prioritaire', () => {
    expect(detecterNavigation(normaliser('ouvre visite sanitaire'))?.id).toBe('visites-sanitaires');
    expect(detecterNavigation(normaliser('nouvelle perte de colonie'))?.id).toBe('mortalite');
  });

  it('écritures annexes : « note » ≠ client, « mets » = entrée stock, refus du 0', () => {
    const t = classifierTour([usr('note un client Pierre')]);
    if (t.kind === 'ecriture') expect(t.ecriture.action).not.toBe('client');
    const s = analyserStock(normaliser('mets 2 kg de sirop au stock'), 'x');
    expect(s).toMatchObject({ type: 'entree', quantite: 2 });
    expect(analyserStock(normaliser('ajoute 0 kg au stock'), 'x')).toBeNull();
    expect(
      analyserClient(normaliser('ajoute un client 123456'), 'ajoute un client 123456').nom,
    ).toBeUndefined();
  });

  it('nourrissement : pas de type deviné, « sirop candi » = sirop sucré', () => {
    const p1 = analyserIntervention(normaliser('nourri 1 litre'), 'nourri 1 litre');
    expect(p1.donnees).not.toHaveProperty('type');
    expect(p1.manque).toContain('type');
    const p2 = analyserIntervention(
      normaliser('nourri 2 litres de sirop candi ruche 5'),
      'nourri 2 litres de sirop candi ruche 5',
    );
    expect(p2.donnees).toMatchObject({ type: 'sirop_sucre' });
    expect(analyserRecolteProd(normaliser('récolté quarante-deux kg de miel'), 'x')).toMatchObject({
      quantiteKg: 42,
    });
  });

  it('flux guidé : nombres en lettres + question = interruption', () => {
    const varroa = classifierTour([
      usr('fais une intervention'),
      asst('?'),
      usr('Comptage varroa'),
      asst('?'),
      usr('quarante deux'),
      asst('?'),
      usr('la 3'),
    ]);
    if (varroa.kind === 'ecriture' && varroa.ecriture.action === 'intervention') {
      expect(varroa.ecriture.parse.donnees).toMatchObject({ nombreVarroas: 42 });
    }
    const q = classifierTour([
      usr('fais une intervention'),
      asst('?'),
      usr('Contrôle'),
      asst('?'),
      usr('elle est agressive ?'),
    ]);
    expect(q.kind).not.toBe('ecriture'); // la question n'est pas avalée comme réponse
  });
});
