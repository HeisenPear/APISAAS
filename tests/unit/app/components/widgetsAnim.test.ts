import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { WIDGET_CATALOG } from '~/config/widgets';
import { PLAN_CONFIGS, PLANS } from '~/config/plans';
import { COLONNES, type WidgetMini } from '~/components/ui/webmockup/widgets-mini';

/**
 * L'animation de widgets de la page d'accueil annonce un NOMBRE, affiche des
 * NOMS et attribue des PLANS. Les trois viennent du produit réel — et aucun
 * des trois ne doit être cru sur parole.
 *
 * Le nombre est particulièrement traître : les raccourcis ne sont pas écrits à
 * la main mais dérivés de la navigation (`NAV_SECTIONS.flatMap`). On ne peut
 * donc pas le compter en lisant le fichier — il faut exécuter le catalogue.
 * C'est aussi pour ça qu'il bougera sans que personne n'y pense : ajouter une
 * entrée de menu ajoute un widget.
 *
 * CE QUE CE BANC A CHANGÉ DEPUIS SA PREMIÈRE VERSION. Il lisait le `.vue` À LA
 * REGEX (`/\{ nom: '([^']+)'/`). Un banc qui interroge du texte source valide
 * du texte source : il serait resté vert en ne trouvant plus rien le jour où
 * les données ont quitté le gabarit — c'est-à-dire aujourd'hui. Les neuf
 * entrées vivent désormais dans un module ; on les importe et on les compare à
 * des objets, pas à des graphies.
 */
const SOURCE_ANIM = readFileSync('app/components/ui/webmockup/WmWidgetsAnim.vue', 'utf-8');
const SOURCE_MINI = readFileSync('app/components/ui/webmockup/WmWidgetMini.vue', 'utf-8');

const MONTRES: WidgetMini[] = COLONNES.flat();
/** Les apostrophes typographiques ne doivent pas décider d'un échec. */
const nettoyer = (s: string) => s.replace(/[’']/g, "'");

/** Le premier plan de la grille tarifaire qui déverrouille cette fonctionnalité. */
function planQuiDeverrouille(feature: string | undefined): string {
  if (!feature) return 'Découverte';
  for (const p of PLANS) {
    const features = PLAN_CONFIGS[p].features as unknown as Record<string, boolean>;
    if (features[feature]) return p;
  }
  return 'aucun';
}

describe('WmWidgetsAnim — ce qu’elle annonce existe', () => {
  it('le geste reste DANS une colonne — sinon rien ne s’anime', () => {
    /**
     * LE DÉFAUT QUE CE BANC EXISTE POUR EMPÊCHER, ET QUI A DURÉ.
     *
     * Il y a un `TransitionGroup` PAR colonne (il est à l'intérieur du `v-for`
     * des colonnes). Or il n'anime que les déplacements INTERNES à son
     * instance : une carte qui change de colonne n'est pas déplacée pour lui,
     * elle est détruite d'un côté et recréée de l'autre. Elle se téléportait.
     *
     * Le code tirait pourtant DEUX colonnes différentes à chaque geste, avec
     * une ligne qui écartait explicitement le cas `b === a` — c'est-à-dire le
     * seul que Vue sait animer. Aucun réglage de durée n'aurait pu le corriger.
     */
    const geste = SOURCE_ANIM.slice(
      SOURCE_ANIM.indexOf('function unGeste'),
      SOURCE_ANIM.indexOf('function composer'),
    );
    expect(geste, 'la fonction de geste est introuvable').toBeTruthy();
    expect(
      geste,
      'le geste ne doit plus tirer une seconde colonne : le déplacement inter-colonnes ne s’anime pas',
    ).not.toMatch(/%\s*colonnes\.value\.length/);
    // Les deux extrémités de l'échange doivent viser la MÊME colonne.
    const echanges = [...geste.matchAll(/copie\[(\w+)\]!\[/g)].map((m) => m[1]);
    expect(echanges.length, 'un échange à deux extrémités est attendu').toBeGreaterThanOrEqual(3);
    expect(new Set(echanges).size, `deux colonnes distinctes : ${echanges.join(', ')}`).toBe(1);
  });

  it('le décollage est TERMINÉ avant que la carte ne parte', () => {
    /**
     * L'inversion qui rendait la montée invisible : la carte changeait de place
     * à 480 ms alors que sa propre transition durait 520 ms. Elle était coupée
     * avant sa fin — et comme `--ease-out-expo` termine 90 % du chemin en
     * 130 ms, les 3 px de levée se lisaient comme une secousse.
     *
     * L'invariant est donc un ORDRE : la durée du décollage doit tenir dans le
     * délai qui précède la mutation.
     */
    const nombre = (nom: string): number => {
      const m = SOURCE_ANIM.match(new RegExp(`const ${nom} = (\\d+);`));
      expect(m, `constante ${nom} introuvable`).toBeTruthy();
      return Number(m![1]);
    };
    const decollage = nombre('DECOLLAGE');
    const prise = nombre('PRISE');
    expect(decollage, 'un décollage de moins de 200 ms ne se perçoit pas').toBeGreaterThanOrEqual(
      200,
    );
    expect(prise, 'sans palier immobile, la prise en main ne se lit pas').toBeGreaterThan(0);

    /**
     * ⚠️ CE QUE CE BANC VÉRIFIE VRAIMENT — ET MA PREMIÈRE VERSION NE VÉRIFIAIT
     * RIEN.
     *
     * J'avais écrit `decollage <= decollage + prise`. C'est vrai par
     * construction : la mutation l'a confirmé en restant verte. Un test qui ne
     * peut pas échouer donne l'illusion d'un garde là où il n'y en a aucun.
     *
     * L'invariant réel est un COUPLAGE : le délai avant que la carte ne parte
     * doit être EXPRIMÉ à partir des deux durées, pas recopié en dur. Tant
     * qu'il l'est, le décollage se termine forcément avant le départ — et
     * changer une durée ne peut plus désynchroniser l'autre, ce qui est
     * exactement le défaut d'origine (520 ms de transition, départ à 480).
     */
    expect(
      SOURCE_ANIM,
      'le départ doit être calé sur DECOLLAGE + PRISE, jamais sur un nombre écrit à la main',
    ).toMatch(/plusTard\([\s\S]*?\}, DECOLLAGE \+ PRISE\)/);

    // Et le repli du CSS ne doit pas dépasser la durée du script : si la
    // propriété personnalisée n'était pas appliquée, on retomberait sur une
    // valeur plus longue que le délai — le défaut d'origine, à nouveau.
    const repli = SOURCE_ANIM.match(/var\(--wa-decollage,\s*(\d+)ms\)/);
    expect(repli, 'le repli du décollage est introuvable').toBeTruthy();
    expect(
      Number(repli![1]),
      'le repli CSS dépasse la durée du script : décollage coupé si la variable manque',
    ).toBeLessThanOrEqual(decollage);
  });

  it('la carte soulevée a SA transition, elle n’hérite plus', () => {
    // Sans règle propre, `.wa-saisie` reprenait celle de `.wa-carte` — donc une
    // durée qui ne correspondait à rien dans la chorégraphie.
    const saisie = SOURCE_ANIM.slice(SOURCE_ANIM.indexOf('.wa-saisie {'));
    const bloc = saisie.slice(0, saisie.indexOf('}'));
    expect(bloc, 'aucune transition propre sur .wa-saisie').toMatch(/transition:\s*transform/);
    expect(bloc, 'la levée doit dépasser 3 px pour se voir').toMatch(
      /translateY\(-([4-9]|\d{2,})px\)/,
    );
  });

  it('les durées ne sont écrites qu’UNE fois', () => {
    /**
     * Le décollage coupé venait d'une duplication : 520 ms dans le CSS, 480 ms
     * dans le script, et personne pour les rapprocher. Le CSS lit désormais des
     * propriétés personnalisées posées par le script — une seule déclaration,
     * donc aucune dérive possible.
     */
    expect(SOURCE_ANIM, 'le gabarit doit exposer les durées au CSS').toMatch(
      /'--wa-vol':\s*`\$\{VOL\}ms`/,
    );
    expect(SOURCE_ANIM, 'le vol doit LIRE la variable, pas un nombre recopié').toMatch(
      /transition:\s*transform var\(--wa-vol/,
    );
    expect(SOURCE_ANIM, 'le décollage doit lire sa variable').toMatch(/var\(--wa-decollage/);
  });

  it('le total affiché est celui du catalogue', () => {
    const m = SOURCE_ANIM.match(/const TOTAL_WIDGETS = (\d+);/);
    expect(m, 'TOTAL_WIDGETS introuvable dans le composant').not.toBeNull();
    expect(
      Number(m![1]),
      `Le catalogue compte ${WIDGET_CATALOG.length} widgets. Les raccourcis étant ` +
        'dérivés de NAV_SECTIONS, ce nombre change dès qu’on touche à la navigation — ' +
        'mettre à jour WmWidgetsAnim.vue.',
    ).toBe(WIDGET_CATALOG.length);
  });

  it('chaque widget montré existe vraiment dans le catalogue', () => {
    /**
     * S'ils étaient inventés, la page d'accueil promettrait des widgets que le
     * produit n'a pas — l'erreur exacte commise cinq fois sur la page Maya.
     */
    expect(MONTRES.length, 'aucun widget dans COLONNES').toBeGreaterThanOrEqual(9);

    const connus = new Set(WIDGET_CATALOG.map((w) => nettoyer(w.label)));
    const inventes = MONTRES.map((w) => w.nom).filter((n) => !connus.has(nettoyer(n)));
    expect(
      inventes,
      'widget(s) affiché(s) sur la page d’accueil mais absent(s) du catalogue',
    ).toEqual([]);
  });

  it('le plan annoncé est celui qui déverrouille vraiment le widget', () => {
    /**
     * Plus exigeant que la version précédente, qui ne distinguait que
     * « libre » de « verrouillé ». Annoncer Starter pour un widget réservé au
     * plan Pro, c'est vendre un plan pour une fonctionnalité qu'il n'ouvre pas.
     */
    const parLabel = new Map(WIDGET_CATALOG.map((w) => [nettoyer(w.label), w]));
    const faux: string[] = [];

    for (const w of MONTRES) {
      const reel = parLabel.get(nettoyer(w.nom));
      if (!reel) continue; // couvert par le banc précédent
      const attendu = planQuiDeverrouille(reel.feature);
      // Le catalogue nomme les plans en minuscules ; l'affichage les capitalise.
      if (attendu.toLowerCase() !== w.plan.toLowerCase()) {
        faux.push(`${w.nom} : annoncé « ${w.plan} », déverrouillé par « ${attendu} »`);
      }
    }
    expect(faux, 'un verrou de plan annoncé ne correspond pas au produit').toEqual([]);
  });

  it('les trois paliers sont représentés — sinon la démonstration ne montre rien', () => {
    // La grille sert à faire comprendre qu'il existe des paliers. Si les neuf
    // widgets choisis étaient tous gratuits, elle n'illustrerait plus rien.
    const plans = new Set(MONTRES.map((w) => w.plan));
    expect([...plans].sort()).toEqual(['Découverte', 'Pro', 'Starter']);
  });
});

describe('WmWidgetMini — chaque genre est réellement dessiné', () => {
  it('tout genre présent dans les données a une branche dans le gabarit', () => {
    /**
     * Le gabarit se terminait par un `v-else`. Un genre ajouté sans branche
     * était donc rendu en fil d'activité : une carte plausible, aux mauvaises
     * données, qui ne se remarque pas. Les branches sont maintenant toutes
     * explicites — et ce banc vérifie qu'aucune ne manque.
     */
    const genres = [...new Set(MONTRES.map((w) => w.genre))];
    const orphelins = genres.filter((g) => !SOURCE_MINI.includes(`w.genre === '${g}'`));
    expect(
      orphelins,
      'genre(s) présent(s) dans widgets-mini.ts mais sans branche dans WmWidgetMini.vue : ' +
        'la carte ne rendrait rien',
    ).toEqual([]);
  });

  it('le barème de couleurs de la jauge est celui de SanteScore', () => {
    /**
     * La miniature de santé recopie un seuil métier (70 / 40). Recopié une
     * fois, il dérive : c'est ce qui s'est produit avec `--honey-deep`, écrit
     * en dur dans dix-neuf fichiers. Ici on ne peut pas partager la fonction
     * (elle est locale au widget réel), alors on verrouille l'égalité.
     */
    const reel = readFileSync('app/components/dashboard/SanteScore.vue', 'utf-8');
    const seuils = (src: string) =>
      [...src.matchAll(/score >= (\d+)\) return '(var\(--status-[a-z]+\))'/g)].map(
        (m) => `${m[1]}:${m[2]}`,
      );
    const attendus = seuils(reel);
    expect(attendus.length, 'barème introuvable dans SanteScore.vue').toBeGreaterThanOrEqual(2);
    expect(seuils(SOURCE_MINI), 'la miniature de santé a dérivé du vrai barème').toEqual(attendus);
  });

  it('les scores affichés couvrent au moins deux paliers du barème', () => {
    // Une jauge toute verte ne montre pas que le produit sait alerter.
    const sante = MONTRES.find((w) => w.genre === 'sante');
    expect(sante, 'aucune carte de santé dans la grille').toBeDefined();
    if (sante?.genre !== 'sante') return;
    const tous = [sante.score, ...sante.ruchers.map((r) => r.score)];
    const paliers = new Set(tous.map((s) => (s >= 70 ? 'bon' : s >= 40 ? 'moyen' : 'faible')));
    expect(paliers.size, 'tous les scores tombent dans le même palier').toBeGreaterThanOrEqual(2);
  });
});
