import { describe, it, expect } from 'vitest';
import { readFileSync, globSync } from 'node:fs';
import { PLANS, PLAN_CONFIGS } from '~/config/plans';
import { sansCommentaires } from '~~/tests/helpers/sansCommentaires';

/**
 * LES MAQUETTES DE LA PAGE D'ACCUEIL MONTRAIENT UNE APPLICATION QUI N'EXISTE PAS.
 *
 * Quatre écrans simulés, quatre inventions — et pas des détails de décor :
 *
 *  1. `WmScreenAnalytics` affichait un onglet « Score prédictif IA », des notes
 *     SUR 10, et « infestation probable à 78 % sous 15 jours ». Le produit note
 *     sur CENT (`clamp(n, 0, 100)`), le prédictif vit sur la fiche ruche, et
 *     `santePredictive.ts` ne calcule AUCUNE probabilité — il rend un score, une
 *     tendance, des risques, une urgence. Ce « 78 % » ne pourra jamais être tenu.
 *  2. La barre du téléphone montrait Accueil · Visites · Ruchers · Élevage ·
 *     Finances. La vraie est Aujourd'hui · Ruchers · [Maya · Créer] · Tournée ·
 *     Plus — le bouton Maya central, l'élément le plus identitaire du produit,
 *     manquait purement et simplement.
 *  3. Maya proposait « Planifier demain », « Modifier », « Plus tard »,
 *     « Enregistrer », « Voir les 3 ruches ». L'UI réelle n'a que
 *     « Confirmer » / « Annuler ».
 *  4. L'index de sélection s'affichait sans son badge, alors qu'il est réservé
 *     au plan Expert — le commentaire du fichier l'interdisait lui-même.
 *
 * ⚠️ CE BANC NE RECOPIE RIEN. Chaque règle relit la SOURCE DE VÉRITÉ (le
 * composant réel, le fichier de plans, le moteur) : le jour où le produit
 * change, c'est le banc qui casse, pas la promesse faite au client.
 */

const MAQUETTES = [
  'app/components/ui/PhoneMockup.vue',
  'app/components/ui/WebMockup.vue',
  ...globSync('app/components/ui/webmockup/*.vue'),
  ...globSync('app/components/landing/**/*.vue'),
].sort();

const lire = (f: string): string => readFileSync(f, 'utf-8');

/**
 * Le gabarit et le script d'un fichier, COMMENTAIRES BLANCHIS.
 *
 * ⚠️ SANS ÇA, CE BANC S'ACCUSE LUI-MÊME — il l'a fait à la première exécution.
 * Chaque correction porte au-dessus d'elle la note qui CITE le mensonge
 * réparé (« notes sur 10 », « probable à 78 % »). Une règle qui interdit une
 * chaîne interdit aussi d'expliquer pourquoi cette chaîne était fausse : le
 * dépôt s'est déjà fait prendre quatre fois par cette forme-là.
 *
 * Les commentaires HTML sont retirés par expression régulière AVANT le
 * blanchiment général : dans un gabarit français, une apostrophe droite
 * (« Aujourd'hui ») ouvre une fausse chaîne pour l'analyseur de
 * `sansCommentaires`, qui pourrait alors rater un `<!-- … -->` situé après.
 */
const corps = (f: string): string =>
  sansCommentaires(lire(f).replace(/<!--[\s\S]*?-->/g, ' ')).split('<style')[0] ?? '';

/** Les apostrophes typographiques et droites doivent se comparer. */
const normaliser = (s: string): string => s.replace(/[’‘]/g, "'").replace(/\s+/g, ' ').trim();

/** Le contenu textuel d'un fragment de gabarit, balises retirées. */
const texteDe = (fragment: string): string =>
  normaliser(fragment.replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' '));

describe('les maquettes montrées au visiteur', () => {
  it('le balayage voit bien les maquettes (garde-fou du banc)', () => {
    // Sans ce contrôle, un chemin erroné rendrait toutes les listes vides et
    // tous les cas suivants verts : le banc affirmerait une conformité qu'il
    // n'a jamais mesurée.
    expect(MAQUETTES.length).toBeGreaterThan(20);
    expect(MAQUETTES).toContain('app/components/ui/PhoneMockup.vue');
    expect(MAQUETTES).toContain('app/components/ui/webmockup/WmScreenAnalytics.vue');
  });

  it('aucune maquette ne note SUR 10 — le produit note sur 100', () => {
    /**
     * La source de vérité : `computeHiveScore` borne à `clamp(n, 0, 100)`, et
     * l'index de sélection s'affiche `unite="/100"`. Une note sur 10 dans une
     * maquette promet une autre échelle que celle que l'apiculteur verra.
     */
    const moteur = lire('server/utils/santeScore.ts');
    expect(moteur, 'le score doit rester borné à 100').toMatch(/clamp\(n[^)]*,\s*max\s*=\s*100\)/);

    // On cherche un NOMBRE suivi de « /10 » non suivi d'un autre chiffre —
    // « 8,2/10 », « 82 / 10 ». Interdire la chaîne « 10 » serait absurde :
    // les maquettes ont des `text-[10px]` et des `gap-10` parfaitement légitimes.
    const fautes: string[] = [];
    for (const f of MAQUETTES) {
      const gabarit = corps(f);
      for (const m of gabarit.matchAll(/(\d(?:[.,]\d+)?)\s*\/\s*10(?!\d)/g)) {
        fautes.push(`${f} — « ${m[0]} »`);
      }
      for (const m of gabarit.matchAll(/\bsur\s+10\b(?!\d)/gi)) {
        fautes.push(`${f} — « ${m[0]} »`);
      }
    }
    expect(fautes, 'le produit note sur 100 partout').toEqual([]);
  });

  it('la barre du téléphone simulé est celle de BottomNav.vue', () => {
    /**
     * ⚠️ POURQUOI ELLE AVAIT DÉRIVÉ, ET POURQUOI CE BANC EXISTE. La barre
     * servait aussi de sélecteur de diapos : chaque écran ajouté au simulateur
     * y ajoutait son onglet, jusqu'à décrire une navigation imaginaire. Le
     * pilotage est passé aux points ; il reste à empêcher le retour.
     */
    const reelle = lire('app/components/ui/BottomNav.vue');
    const attendus = [...reelle.matchAll(/bottom-nav-label">([^<]*)</g)].map((m) => {
      const brut = m[1] ?? '';
      // Le libellé de la bulle centrale est un ternaire : on prend l'état
      // fermé, c'est-à-dire la branche « sinon ».
      const ternaire = brut.match(/\{\{[^}]*:\s*'([^']+)'\s*\}\}/);
      return normaliser(ternaire?.[1] ?? brut);
    });
    expect(attendus.length, 'BottomNav doit exposer ses libellés').toBe(5);

    const maquette = lire('app/components/ui/PhoneMockup.vue');
    const nav = maquette.slice(
      maquette.indexOf('<nav class="phone-nav"'),
      maquette.indexOf('</nav>'),
    );
    const montres = [...nav.matchAll(/<span>([^<]+)<\/span>/g)].map((m) => normaliser(m[1] ?? ''));

    expect(montres, 'la maquette doit montrer la VRAIE barre, dans le VRAI ordre').toEqual(
      attendus,
    );
    expect(nav, 'la bulle centrale porte le vrai logo, pas un glyphe').toContain('IaMayaMark');
  });

  it('les boutons d’action des maquettes Maya existent dans le produit', () => {
    /**
     * `CopiloteMessage.vue` est le seul endroit où Maya demande un accord. On
     * en extrait les libellés de boutons — aujourd'hui « Confirmer »,
     * « Annuler », « Confirmer tout », « Tout annuler » — et on exige que les
     * maquettes n'en montrent pas d'autres.
     *
     * ⚠️ Les puces sous une réponse NE SONT PAS des actions : ce sont les
     * questions suivantes (`message.suggestions`). Une maquette qui y met un
     * verbe décrit un geste que l'apiculteur cherchera sans le trouver.
     */
    const reel = lire('app/components/ia/CopiloteMessage.vue');
    const vrais = new Set<string>();
    for (const bloc of reel.split('<button').slice(1)) {
      const interieur = bloc.slice(0, bloc.indexOf('</button>'));
      const libelle = texteDe(interieur.slice(interieur.indexOf('>') + 1));
      // On ignore les libellés dynamiques (`{{ s }}`) : ce sont les puces.
      if (libelle && !libelle.includes('{{')) vrais.add(libelle);
    }
    expect(vrais.size, 'CopiloteMessage doit exposer ses libellés').toBeGreaterThan(2);

    // Les classes d'action des maquettes Maya — leur propre vocabulaire.
    const CLASSES = /class="(?:act-primaire|act-secondaire|puce-primaire|puce-neutre)"/;
    const fautes: string[] = [];
    for (const f of MAQUETTES) {
      const gabarit = corps(f);
      for (const bloc of gabarit.split('<span').slice(1)) {
        if (!CLASSES.test(`<span${bloc.slice(0, bloc.indexOf('>') + 1)}`)) continue;
        const libelle = texteDe(bloc.slice(bloc.indexOf('>') + 1, bloc.indexOf('</span>')));
        if (libelle && !vrais.has(libelle)) fautes.push(`${f} — « ${libelle} »`);
      }
    }
    expect(fautes, `le produit n'offre que : ${[...vrais].join(' · ')}`).toEqual([]);
  });

  it('aucune maquette n’annonce une probabilité que rien ne calcule', () => {
    /**
     * `santePredictive.ts` rend `scorePrediction30j` (0–100), `tendance`,
     * `risques`, `suggestions`, `urgence`. Pas un seul pourcentage de
     * survenue. « Infestation probable à 78 % sous 15 jours » était une
     * précision inventée — la plus coûteuse des inventions, parce qu'elle est
     * la plus crédible.
     */
    const moteur = lire('server/utils/santePredictive.ts');
    expect(moteur, 'le moteur ne doit pas produire de probabilité').not.toMatch(
      /probabilite|probabilité/i,
    );

    const MOTIFS = [
      /probable\s+à\s+\d+\s*%/gi,
      /risque[^.]{0,40}\d+\s*%/gi,
      /\d+\s*%\s*(?:d['’]ici|sous\s+\d+\s*(?:jours?|semaines?))/gi,
    ];
    const fautes: string[] = [];
    for (const f of MAQUETTES) {
      const gabarit = corps(f);
      for (const motif of MOTIFS) {
        for (const m of gabarit.matchAll(motif)) fautes.push(`${f} — « ${normaliser(m[0])} »`);
      }
    }
    expect(
      fautes,
      'ce que Maya ne sait pas calculer, la maquette ne peut pas le promettre',
    ).toEqual([]);
  });

  it('l’index de sélection ne s’affiche jamais sans son badge de plan', () => {
    /**
     * `selectionAvancee` n'est vrai que sur un seul plan. On le VÉRIFIE ici au
     * lieu de l'écrire : si un jour la fonction descend d'un cran, ce cas dira
     * lequel montrer, et la maquette suivra.
     */
    const ouvrants = PLANS.filter((p) => PLAN_CONFIGS[p].features.selectionAvancee);
    expect(ouvrants, 'la sélection avancée doit rester ouverte par un seul plan').toHaveLength(1);
    const plan = ouvrants[0]!;
    const etiquette = plan.charAt(0).toUpperCase() + plan.slice(1);

    const fautes: string[] = [];
    for (const f of MAQUETTES) {
      const gabarit = corps(f);
      if (!/index\s*(?:de sélection|\/100)/i.test(gabarit)) continue;
      if (!gabarit.includes(etiquette)) fautes.push(f);
    }
    expect(
      fautes,
      `montrer l'index de sélection sans dire « ${etiquette} », c'est promettre un écran que le visiteur n'aura pas`,
    ).toEqual([]);
  });
});
