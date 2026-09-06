#!/usr/bin/env node
/**
 * Audit de mise en page — détecte ce que l'œil finit par voir mais qu'aucun
 * banc ne regarde : chevauchements de texte, débordements, coupures.
 *
 * Pourquoi un DÉTECTEUR et pas une relecture : le défaut signalé sur /maya
 * (la jauge sous le texte) était invisible au code — il n'apparaît qu'une fois
 * les textes rendus, à une largeur donnée, après le défilement qui déclenche
 * les révélations. Trois conditions qu'aucune lecture de source ne réunit.
 *
 * Usage : node scripts/audit-mise-en-page.mjs [url-de-base]
 *
 * Sans argument, le script BÂTIT SON PROPRE SERVEUR à partir de `.output`
 * (`npm run build:e2e` au préalable) et l'arrête en sortant. C'est ce qui le
 * rend utilisable en CI sans orchestration externe — et ce qui évite qu'il
 * reste, comme il l'a été, un outil qu'on ne lance qu'à la main : les huit
 * défauts de contraste qu'il a trouvés dataient tous de commits verts.
 */
import { chromium, devices } from '@playwright/test';
import { spawn } from 'node:child_process';
import { get, Agent } from 'node:http';
import { SONDE } from './sonde-mise-en-page.mjs';
// Extraite pour être testable : `scripts/controle-styles.mjs` la met en échec
// exprès sur une feuille lente. Le défaut qu'elle corrige était PROBABILISTE —
// 5 chargements sur 12 mesuraient une page sans style — donc invérifiable par
// une exécution verte de l'audit.
import { attendreLaFeuilleDeStyle } from './attendre-styles.mjs';

const PORT = Number(process.env.PORT_AUDIT ?? 4180);
const FOURNI = process.argv[2];
const BASE = FOURNI ?? `http://127.0.0.1:${PORT}`;
const CHROME = process.env.PLAYWRIGHT_CHROMIUM_PATH || undefined;

/**
 * Démarre `.output/server/index.mjs`, comme `verifier-ssr.mjs`, avec les mêmes
 * deux pièges déjà payés là-bas : les variables Supabase ne sont lues au
 * démarrage que sous le préfixe `NUXT_PUBLIC_`, et une requête vers 127.0.0.1
 * part dans le proxy sortant si on ne lui impose pas un agent explicite.
 */
async function demarrerServeur() {
  const serveur = spawn(process.execPath, ['.output/server/index.mjs'], {
    env: {
      ...process.env,
      PORT: String(PORT),
      NUXT_PUBLIC_SUPABASE_URL: 'http://127.0.0.1:9/factice',
      NUXT_PUBLIC_SUPABASE_KEY: 'cle-factice-audit-mise-en-page',
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  let journal = '';
  serveur.stdout.on('data', (d) => (journal += d));
  serveur.stderr.on('data', (d) => (journal += d));

  const repond = () =>
    new Promise((r) => {
      get({ host: '127.0.0.1', port: PORT, path: '/', agent: new Agent() }, (rep) => {
        rep.resume();
        r(Boolean(rep.statusCode));
      }).on('error', () => r(false));
    });

  for (let i = 0; i < 120; i++) {
    if (await repond()) return serveur;
    await new Promise((r) => setTimeout(r, 250));
  }
  serveur.kill();
  throw new Error('le serveur bâti n’a jamais répondu\n' + journal);
}

const serveur = FOURNI ? null : await demarrerServeur();

const ECRANS = [
  { nom: 'mobile-390', viewport: { width: 390, height: 844 } },
  { nom: 'mobile-360', viewport: { width: 360, height: 740 } },
  { nom: 'tablette-768', viewport: { width: 768, height: 1024 } },
  { nom: 'portable-1280', viewport: { width: 1280, height: 800 } },
  { nom: 'large-1680', viewport: { width: 1680, height: 1050 } },
];
/**
 * Les pages publiques, celles qu'un visiteur non connecté peut atteindre.
 *
 * `/notre-histoire` a été ajoutée après coup : son bouton de conversion portait
 * exactement le défaut blanc-sur-ambre corrigé ailleurs, et l'audit ne pouvait
 * pas le voir — la page n'était pas dans la liste. Une page absente d'ici est
 * une page sans filet.
 */
/**
 * LES PAGES QU'UN INCONNU PEUT ATTEINDRE SANS COMPTE.
 *
 * Il y en a 24 dans le dépôt ; cette porte n'en gardait que 6. Les absentes
 * étaient pourtant les pages d'ACQUISITION — comparatifs, lexique, cas d'usage,
 * blog : celles qu'on découvre depuis un moteur de recherche, le plus souvent
 * sur un téléphone, et qui forment la première impression du produit.
 *
 * Restent volontairement dehors : les pages qui exigent un état (`/confirm`,
 * `/reset-password`, `/onboarding`, `/p`) — sans jeton valide elles affichent
 * une erreur, et mesurer la mise en page d'une erreur n'apprend rien.
 *
 * `/offline` est dehors pour une raison différente et plus amusante : elle se
 * SABORDE quand on l'ouvre avec du réseau. Son `onMounted` renvoie vers le
 * tableau de bord dès que la connexion est là — comportement voulu, une page
 * « vous êtes hors-ligne » n'a rien à faire devant quelqu'un qui est en ligne.
 * Un navigateur d'audit a forcément du réseau : elle n'est pas mesurable ici.
 *
 * `/demo` est dehors pour une troisième raison : elle lit les créneaux de démo
 * en base. Le serveur bâti que cette porte démarre n'a pas de `DATABASE_URL`,
 * la page reste donc suspendue sur son chargement. L'auditer supposerait une
 * base — ce que cette porte refuse par principe, pour rester exécutable
 * partout et sans secret.
 */
/**
 * LES PAGES DU PRODUIT — CELLES QUI VIVENT DERRIÈRE LA CONNEXION.
 *
 * ⚠️ C'EST LA MOITIÉ DU LOGICIEL, ET ELLE N'A JAMAIS ÉTÉ MESURÉE. Les deux
 * débordements signalés par l'apiculteur (« la carte mellifère dépasse à
 * droite », « des éléments débordent sur la page ruche ») sont tous les deux
 * ici : aucun n'était visible depuis les 18 pages publiques.
 *
 * ⚠️ ET ON LES MESURE SANS JAVASCRIPT, DÉLIBÉRÉMENT.
 *
 * Sans session, `onboarding.global.ts` renvoie ces pages vers /login — mais
 * CÔTÉ CLIENT uniquement : le rendu serveur, lui, produit la page entière
 * (shell, en-têtes, grilles, états vides). Couper le JavaScript fige donc
 * exactement ce que le serveur envoie, sans redirection, sans base de données
 * et SANS AUCUN IDENTIFIANT — ce qui est la seule façon d'exécuter cette porte
 * en CI, sur un dépôt public, sans jamais approcher la base de production.
 *
 * CE QUE ÇA NE VOIT PAS, et qu'il faut savoir avant de conclure : tout ce qui
 * naît après l'hydratation — la carte Leaflet, les listes remplies par API, les
 * modales. La structure, elle, est là : c'est elle qui déborde.
 */
const PAGES_APP = [
  // Le quotidien
  '/dashboard',
  '/ruches',
  '/ruches/nouveau',
  '/ruchers',
  '/ruchers/nouveau',
  '/hausses',
  '/interventions',
  '/interventions/nouvelle',
  '/interventions/groupe',
  '/tournee',
  '/calendrier',
  '/alertes',
  '/meteo',
  // Cartes et terrain — les deux pages signalées en font partie
  '/floraisons',
  '/frelon',
  '/transhumance',
  '/transhumance/carte',
  '/transhumance/emplacements',
  '/transhumance/plans/nouveau',
  '/balances',
  '/balances/nouvelle',
  // Production et traçabilité
  '/production',
  '/production/recoltes',
  '/production/tracabilite',
  '/stocks',
  '/stocks/alertes',
  // Élevage
  '/elevage',
  '/elevage/reines',
  '/elevage/greffage',
  '/elevage/lignees',
  // `/elevage/registre` est dehors : la page redirige en dur vers
  // `/exports/registre`, qui est déjà auditée. La mesurer reviendrait à
  // mesurer deux fois la même chose en croyant en couvrir deux.
  // Argent
  '/finances',
  '/finances/ventes',
  '/finances/achats',
  '/finances/reglements',
  '/finances/tresorerie',
  '/finances/rapports',
  '/finances/bons-livraison',
  '/clients',
  // Conformité — pages opposables, jamais relues
  '/conformite/mortalites',
  '/conformite/ordonnances',
  '/conformite/veterinaires',
  '/conformite/visites-sanitaires',
  '/declarations/napi',
  '/exports',
  '/exports/bilan',
  '/exports/registre',
  // Maya, l'assistance et la communauté
  '/copilote',
  '/copilote/fenetres',
  '/communaute',
  '/guide',
  '/outils',
  '/analytics',
  // Association
  '/association',
  '/association/campagnes',
  '/association/campagnes/nouvelle',
  '/association/communaute',
  '/association/parametres',
  // Réglages — dont l'écran d'abonnement, la porte de sortie de tout blocage
  '/parametres',
  '/parametres/abonnement',
  '/parametres/equipe',
  '/parametres/facturation',
];

/**
 * ⚠️ LES CINQ PAGES D'ADMINISTRATION SONT VOLONTAIREMENT DEHORS.
 *
 * `app/middleware/admin.ts` les renvoie vers /dashboard côté SERVEUR quand le
 * visiteur n'est pas administrateur — c'est-à-dire toujours, ici. Les mesurer
 * reviendrait à mesurer /dashboard cinq fois de plus en croyant auditer
 * l'administration. Elles n'auront de filet que le jour où cette porte saura
 * ouvrir une session, et c'est écrit ici pour qu'on ne les rajoute pas par
 * inadvertance.
 */

/**
 * Les pages du produit sont mesurées à TROIS largeurs, pas cinq : le téléphone
 * étroit où tout se resserre, la tablette où les grilles basculent, et le
 * portable où vivent les tableaux. Les 68 pages × 5 largeurs coûtaient trois
 * fois le temps de la porte pour deux largeurs qui n'ont jamais rien trouvé de
 * neuf — et une porte trop lente cesse d'être lancée.
 */
const ECRANS_APP = ECRANS.filter((e) =>
  ['mobile-360', 'tablette-768', 'portable-1280'].includes(e.nom),
);

const PAGES = [
  '/',
  '/maya',
  '/tarifs',
  '/fonctionnalites',
  '/notre-histoire',
  '/faq',
  // Acquisition / SEO
  '/alternative-beekube',
  '/meilleur-logiciel-apiculture',
  '/utilisations',
  '/lexique-apicole',
  '/conformite',
  '/blog',
  /**
   * ⚠️ `/forum` EST MESURÉ COMME UNE PAGE PUBLIQUE, PARCE QU'IL EN EST UNE.
   * C'est la première page du produit à porter le chrome marketing pour un
   * visiteur et la barre latérale pour un apiculteur connecté
   * (`ForumChrome.vue`) : c'est ici, sans session, qu'on mesure la première des
   * deux. Sans base, la page rend son état d'erreur — et un état d'erreur est
   * une mise en page comme une autre, avec ses débordements et ses contrastes.
   */
  '/forum',
  // Entrée dans le produit
  '/login',
  '/register',
  // Mentions légales : peu lues, jamais regardées, et pourtant opposables.
  '/cgu',
  '/cgv',
  '/mentions-legales',
  '/politique-confidentialite',
];

/** Injecté dans la page : tout le repérage se fait côté navigateur. */

const nav = await chromium.launch({ executablePath: CHROME });
let total = 0;
const rapport = [];

/**
 * ⚠️ LES SCÉNARIOS TOURNENT EN PARALLÈLE, ET C'EST UNE NÉCESSITÉ.
 *
 * En passant de 6 à 17 pages, la porte est montée à 85 scénarios. En série,
 * chacun ouvre un contexte, déroule la page deux fois et sonde à chaque arrêt :
 * la porte dépassait dix minutes, c'est-à-dire le seuil au-delà duquel on
 * cesse de la lancer avant de pousser. Une porte qu'on contourne ne garde plus
 * rien.
 *
 * Le parallélisme est borné : chaque contexte est un vrai navigateur, et en
 * ouvrir trop rend les mesures de temps instables — or les révélations au
 * défilement dépendent de délais. Quatre est le compromis tenu.
 */
/**
 * `AUDIT_PORTEE=publiques` ou `produit` restreint la porte à une moitié. En CI
 * on lance tout ; sur un poste, quand on travaille sur les pages du produit,
 * attendre les 90 scénarios publics à chaque essai est ce qui fait qu'on cesse
 * de lancer la porte.
 */
const PORTEE = process.env.AUDIT_PORTEE ?? 'tout';
const SCENARIOS = [
  ...(PORTEE === 'produit'
    ? []
    : ECRANS.flatMap((ecran) => PAGES.map((chemin) => ({ ecran, chemin, sansJs: false })))),
  ...(PORTEE === 'publiques'
    ? []
    : ECRANS_APP.flatMap((ecran) => PAGES_APP.map((chemin) => ({ ecran, chemin, sansJs: true })))),
];
const CONCURRENCE = Number(process.env.AUDIT_CONCURRENCE ?? 4);

async function mesurer({ ecran, chemin, sansJs }) {
  const ctx = await nav.newContext({
    ...(ecran.nom.startsWith('mobile') ? devices['iPhone 14'] : {}),
    viewport: ecran.viewport,
    reducedMotion: 'no-preference',
    // Voir PAGES_APP : couper le JavaScript est ce qui rend les pages
    // connectées mesurables sans session, sans base et sans identifiant.
    // (Playwright continue d'évaluer SES propres injections : la sonde
    // tourne, seuls les scripts de la page sont gelés.)
    javaScriptEnabled: !sansJs,
  });
  // Consentement déjà donné : on audite la page telle que la voit un visiteur
  // qui revient, sans le bandeau posé par-dessus tout.
  await ctx.addInitScript(() => {
    try {
      localStorage.setItem('apigo_analytics_consent', 'denied');
    } catch {
      /* stockage indisponible : le bandeau restera, il est filtré par ailleurs */
    }
  });
  const page = await ctx.newPage();
  try {
    /**
     * ⚠️ `load` ATTEND LES SOUS-RESSOURCES EXTERNES, ET CERTAINES NE VIENNENT
     * JAMAIS. Les pages de cartographie demandent leurs tuiles à OpenStreetMap ;
     * derrière un proxy qui les refuse, l'attente va au bout de son délai — la
     * porte est passée de deux à huit minutes sur ces pages-là sans rien
     * mesurer de plus. Sans JavaScript, RIEN ne change après le DOM : pas
     * d'hydratation, pas de révélation, pas de tuile posée. `domcontentloaded`
     * suffit, et rend la mesure indépendante du réseau.
     */
    await page.goto(BASE + chemin, { waitUntil: sansJs ? 'domcontentloaded' : 'load' });
    /**
     * ⚠️ PAS `page.addStyleTag` — IL NE REND JAMAIS LA MAIN SANS JAVASCRIPT.
     *
     * Playwright l'implémente en faisant exécuter du script à la PAGE ; avec
     * `javaScriptEnabled: false`, l'appel reste suspendu indéfiniment. Chacun
     * des 201 scénarios du produit mourait ainsi sur le délai de 120 s : la
     * porte annonçait « page non mesurable » sur des pages parfaitement saines,
     * et prenait six heures au lieu de six minutes.
     *
     * `page.evaluate`, lui, passe par l'injection de Playwright et fonctionne
     * dans les deux modes — c'est la même feuille de style, posée autrement.
     */
    // AVANT toute mesure, et avant même la feuille de confort ci-dessous : sans
    // le style du site, il n'y a rien à mesurer. Posé aussi en mode JavaScript
    // — `load` l'y garantit déjà, mais une garantie tacite finit par sauter.
    await attendreLaFeuilleDeStyle(page, `${chemin} @${ecran.nom}`);

    await page.evaluate(() => {
      const style = document.createElement('style');
      style.textContent = 'html{scroll-behavior:auto !important}';
      document.head.appendChild(style);
    });

    /**
     * Une page qui se redirige elle-même après hydratation détruit le contexte
     * d'exécution en plein milieu des mesures. Playwright remonte alors
     * « Execution context was destroyed » — sans dire QUELLE page, ni à quelle
     * largeur. Une porte de CI qui échoue sans nommer sa cause coûte une
     * demi-heure à chaque fois ; on préfère la nommer.
     */
    const arrivee = new URL(page.url()).pathname;
    if (arrivee !== chemin) {
      throw new Error(
        `${chemin} (${ecran.nom}) redirige vers ${arrivee} : cette page n'est pas mesurable ` +
          `telle quelle. La retirer de PAGES, ou lui donner l'état qui la stabilise.`,
      );
    }

    /**
     * ⚠️ ON SONDE À CHAQUE ÉCRAN, PAS UNE FOIS EN HAUT.
     *
     * Le rognage à la fenêtre est indispensable pour ne comparer que ce qui est
     * réellement affiché — mais il a un revers que j'ai failli ne pas voir :
     * sondée depuis le haut de page, TOUT ce qui est plus bas a une hauteur
     * visible nulle, donc est ignoré. L'audit déclarait « propre » des pages
     * dont il n'avait regardé que le premier écran.
     *
     * Premier passage : on déroule pour déclencher les révélations.
     * Second passage : on redescend écran par écran et on sonde à chaque arrêt.
     */
    /**
     * ⚠️ ON NE DÉFILE PAS TOUJOURS LA FENÊTRE — et là où ce n'est pas elle,
     * l'audit ne regardait que le premier écran sans le savoir.
     *
     * Les pages publiques défilent sur la fenêtre. Le shell applicatif, non :
     * `app/layouts/default.vue:53` met le défilement sur
     * `<main class="app-content … overflow-y-auto">`, et la fenêtre y est
     * FIGÉE (`h-[100dvh]` + `overflow-hidden` au-dessus). Appeler
     * `window.scrollTo` sur ces pages ne déplace rien : la sonde repasserait
     * dix fois sur le même écran en croyant descendre.
     *
     * On identifie donc le vrai défileur, une fois, et on s'adresse à lui.
     */
    /**
     * ⚠️ ON NE CHERCHE PLUS « LE » DÉFILEUR — ON LES POUSSE TOUS LES DEUX.
     *
     * La détection d'avant choisissait entre la fenêtre et `main.app-content`
     * en comparant leurs hauteurs UNE fois, juste après `domcontentloaded`.
     * Elle se trompait quand la mise en page n'était pas encore posée : sur
     * `/association/communaute` à 360 px, elle retenait la fenêtre avec
     * `h = 740`, la boucle ne faisait qu'UN arrêt, et le débordement des deux
     * boutons — à 1 140 px du haut — n'était jamais regardé. La porte
     * annonçait « aucun débordement » sur une page qui en avait un. C'est la
     * CI, sur une machine plus lente, qui l'a rattrapé.
     *
     * Une attente (`document.fonts.ready` + deux trames) a été essayée puis
     * retirée : sans JavaScript de page, `requestAnimationFrame` ne rend pas
     * toujours la main dans un navigateur sans tête, et chaque scénario
     * mourait sur son délai.
     *
     * Faire défiler un élément qui ne défile pas ne coûte rien. On pousse donc
     * la fenêtre ET le contenu applicatif, et on prend la hauteur la plus
     * grande des deux : plus de choix, donc plus de mauvais choix.
     */
    const defiler = (y) =>
      page.evaluate((v) => {
        window.scrollTo(0, v);
        document.querySelector('main.app-content')?.scrollTo(0, v);
      }, y);

    const hauteurUtile = () =>
      page.evaluate(() =>
        Math.max(
          document.body.scrollHeight,
          document.documentElement.scrollHeight,
          document.querySelector('main.app-content')?.scrollHeight ?? 0,
        ),
      );

    const h = await hauteurUtile();

    const vh = ecran.viewport.height;
    const pas = Math.floor(vh * 0.75);

    // La passe de chauffe n'a de sens qu'avec du JavaScript : elle déclenche
    // les révélations au défilement. Sans lui, rien ne se révèle — et la
    // refaire coûterait deux secondes par page sur 68 pages.
    if (!sansJs) {
      for (let y = 0; y < h; y += pas) {
        await defiler(y);
        await page.waitForTimeout(90);
      }
      await page.waitForTimeout(1200);
    }

    const t = [];
    const vues = new Set();
    for (let y = 0; y < h; y += pas) {
      await defiler(y);
      await page.waitForTimeout(sansJs ? 40 : 160);
      for (const trouvaille of await page.evaluate(SONDE, { sansJs })) {
        // Un même défaut est vu depuis deux arrêts voisins : on le compte une fois.
        const cle = trouvaille.genre + '|' + trouvaille.coupables.join('|');
        if (vues.has(cle)) continue;
        vues.add(cle);
        t.push(trouvaille);
      }
    }
    /**
     * ⚠️ ET ON VÉRIFIE QU'ON A BIEN PARCOURU LA PAGE.
     *
     * Une hauteur sous-estimée ne se voit nulle part : la boucle s'arrête tôt,
     * la sonde ne trouve rien, et la porte annonce « propre ». C'est la panne
     * la plus coûteuse d'un détecteur — elle rassure. On re-mesure donc la
     * hauteur APRÈS coup : si la page était plus longue que ce qu'on a
     * parcouru, le scénario n'a pas fait son travail et le dit.
     */
    const attendu = await hauteurUtile();
    if (attendu > h + vh * 0.5) {
      t.push({
        genre: 'couverture-incomplete',
        detail:
          `la page fait ${attendu} px de haut, la sonde n'en a parcouru que ${h} — ` +
          'tout ce qui est plus bas n’a PAS été mesuré',
        coupables: [],
      });
    }

    if (t.length) {
      rapport.push({ ecran: ecran.nom, chemin, trouvailles: t, sansJs });
      total += t.length;
    }
  } finally {
    // Un contexte laissé ouvert par un scénario qui échoue tient un vrai
    // navigateur en mémoire : sur 294 scénarios, la machine finit par ramer
    // et les mesures de temps deviennent fausses.
    await ctx.close().catch(() => {});
  }
}

// File d'attente partagée : chaque ouvrier prend le scénario suivant dès qu'il
// se libère, plutôt qu'un découpage en tranches égales — les pages n'ont pas
// du tout le même coût, et une tranche lente ferait attendre les autres.
const DEPART = Date.now();
let curseur = 0;
let faits = 0;

/**
 * ⚠️ UN SCÉNARIO QUI ÉCHOUE NE DOIT PAS EMPORTER LES 293 AUTRES.
 *
 * C'est arrivé au premier passage élargi : une page a levé, `Promise.all` a
 * rejeté, le navigateur s'est fermé sous les pieds des autres ouvriers, et le
 * seul message survivant était « Target page, context or browser has been
 * closed » — qui ne nomme ni la page fautive ni sa largeur. Vingt-cinq minutes
 * de mesures perdues pour une page.
 *
 * Un échec devient donc une TROUVAILLE comme une autre : la porte reste rouge,
 * mais elle dit laquelle, et elle rend tout le reste.
 */
const DELAI_SCENARIO = Number(process.env.AUDIT_DELAI_MS ?? 120_000);
const avecDelai = (promesse, libelle) =>
  new Promise((resoudre, rejeter) => {
    const minuteur = setTimeout(
      () => rejeter(new Error(`${libelle} : aucune réponse en ${DELAI_SCENARIO} ms`)),
      DELAI_SCENARIO,
    );
    promesse.then(resoudre, rejeter).finally(() => clearTimeout(minuteur));
  });

await Promise.all(
  Array.from({ length: Math.min(CONCURRENCE, SCENARIOS.length) }, async () => {
    for (let i = curseur++; i < SCENARIOS.length; i = curseur++) {
      const sc = SCENARIOS[i];
      const libelle = `${sc.chemin} (${sc.ecran.nom}${sc.sansJs ? ', rendu serveur' : ''})`;
      const debut = Date.now();
      try {
        await avecDelai(mesurer(sc), libelle);
      } catch (err) {
        rapport.push({
          ecran: sc.ecran.nom,
          chemin: sc.chemin,
          sansJs: sc.sansJs,
          trouvailles: [
            {
              genre: 'page-non-mesurable',
              detail: String(err?.message ?? err).slice(0, 300),
              coupables: [],
            },
          ],
        });
        total++;
      }
      faits++;
      // Un scénario anormalement long est un signal, pas du bruit : c'est
      // ainsi qu'on a trouvé les pages de cartographie qui attendaient des
      // tuiles OpenStreetMap qu'un proxy refusait.
      const duree = Date.now() - debut;
      if (duree > 20_000) process.stderr.write(`   ⏱ ${libelle} : ${Math.round(duree / 1000)} s\n`);
      // Sur la sortie d'erreur : une porte muette pendant plusieurs minutes
      // passe pour bloquée, et on la tue avant qu'elle ait rendu.
      if (faits % 25 === 0) {
        const min = ((Date.now() - DEPART) / 60_000).toFixed(1);
        process.stderr.write(`   … ${faits}/${SCENARIOS.length} scénarios (${min} min)\n`);
      }
    }
  }),
);
await nav.close();
// Le serveur bâti ici n'appartient qu'à ce script : il meurt avec lui, quel
// que soit le chemin de sortie.
serveur?.kill();

if (!total) {
  console.log(
    `✓ ${SCENARIOS.length} scénarios (${PAGES.length} pages publiques × ${ECRANS.length} largeurs, ` +
      `${PAGES_APP.length} pages du produit × ${ECRANS_APP.length} largeurs) : ` +
      'aucun chevauchement, aucun débordement',
  );
  process.exit(0);
}

console.log(`✖ ${total} anomalie(s) de mise en page\n`);
for (const bloc of rapport) {
  console.log(`── ${bloc.chemin}  @${bloc.ecran}${bloc.sansJs ? '  (rendu serveur seul)' : ''}`);
  const parGenre = {};
  for (const t of bloc.trouvailles) (parGenre[t.genre] ??= []).push(t);
  for (const [genre, liste] of Object.entries(parGenre)) {
    console.log(`   ${genre} (${liste.length})`);
    if (genre === 'contraste-insuffisant') {
      // Un couple de couleurs = une correction. On compte les occurrences.
      const parCouple = {};
      for (const t of liste) (parCouple[t.detail] ??= []).push(t.coupables[0]);
      for (const [couple, els] of Object.entries(parCouple).sort(
        (a, b) => b[1].length - a[1].length,
      )) {
        console.log(`      ${couple}  ×${els.length}`);
        console.log(`         p.ex. ${els[0]}`);
      }
      continue;
    }
    for (const t of liste.slice(0, 5)) {
      console.log(`      ${t.detail}`);
      for (const c of t.coupables) console.log(`         ${c}`);
    }
    if (liste.length > 5) console.log(`      … ${liste.length - 5} de plus`);
  }
  console.log();
}
process.exit(1);
