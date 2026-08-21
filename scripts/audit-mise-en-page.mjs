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
const SONDE = () => {
  /**
   * Un ancêtre `fixed` ou `sticky` recouvre le contenu PAR CONSTRUCTION :
   * bandeau de consentement, en-tête collant, bouton flottant. Les signaler
   * noierait les vrais défauts sous du bruit, et un détecteur qui crie au loup
   * finit par être ignoré.
   */
  const dansSurcouche = (el) => {
    for (let n = el; n && n !== document.body; n = n.parentElement) {
      const p = getComputedStyle(n).position;
      if (p === 'fixed' || p === 'sticky') return true;
    }
    return false;
  };

  /**
   * Rectangle RÉELLEMENT visible : la boîte de l'élément, rognée par chacun de
   * ses ancêtres qui coupe, puis par la fenêtre.
   *
   * ⚠️ SANS CE CALCUL, LE DÉTECTEUR EST INUTILISABLE. La landing embarque un
   * simulateur d'application multi-écrans (WebMockup) : les écrans inactifs
   * restent dans le DOM, rognés hors du cadre. Leurs boîtes chevauchent
   * allègrement celles de l'écran actif — soixante « anomalies » par page, dont
   * pas une n'est visible à l'œil. Comparer des boîtes non rognées revient à
   * auditer une mise en page qui n'existe pas.
   */
  const rectVisible = (el) => {
    let r = el.getBoundingClientRect();
    let x1 = r.left;
    let y1 = r.top;
    let x2 = r.right;
    let y2 = r.bottom;
    for (let n = el.parentElement; n && n !== document.documentElement; n = n.parentElement) {
      const cs = getComputedStyle(n);
      if (!/hidden|clip|auto|scroll/.test(cs.overflow + cs.overflowX + cs.overflowY)) continue;
      const c = n.getBoundingClientRect();
      x1 = Math.max(x1, c.left);
      y1 = Math.max(y1, c.top);
      x2 = Math.min(x2, c.right);
      y2 = Math.min(y2, c.bottom);
    }
    x1 = Math.max(x1, 0);
    y1 = Math.max(y1, 0);
    x2 = Math.min(x2, window.innerWidth);
    y2 = Math.min(y2, window.innerHeight);
    return { left: x1, top: y1, right: x2, bottom: y2, width: x2 - x1, height: y2 - y1 };
  };

  /**
   * Les rectangles d'un élément, UNE LIGNE À LA FOIS.
   *
   * ⚠️ LE FAUX POSITIF QUE CE CALCUL SUPPRIME, ET QUI A FAILLI ME FAIRE
   * « CORRIGER » DU CODE SAIN.
   *
   * `getBoundingClientRect()` d'un élément INLINE qui passe à la ligne renvoie
   * l'UNION de ses lignes : un rectangle qui couvre toute la largeur de la
   * colonne sur deux hauteurs de ligne — y compris les endroits où l'élément
   * n'a rien écrit. Deux liens qui se suivent dans un même paragraphe ont donc
   * des unions qui se recouvrent presque toujours, alors qu'à l'écran ils ne se
   * touchent pas.
   *
   * Mesuré sur `/register` à 390 px : le lien « Conditions Générales » occupe
   * (228→302, y 594) puis (75→233, y 614) ; « Politique de confidentialité »
   * occupe (273→333, y 614) puis (75→197, y 634). Aucune paire de lignes ne se
   * croise — les unions, elles, se recouvraient à 44 %.
   *
   * `getClientRects()` rend une boîte par ligne. On rogne chacune comme
   * `rectVisible` le fait, et on compare des lignes à des lignes.
   */
  const rognages = (el) => {
    const coupes = [];
    for (let n = el.parentElement; n && n !== document.documentElement; n = n.parentElement) {
      const cs = getComputedStyle(n);
      if (!/hidden|clip|auto|scroll/.test(cs.overflow + cs.overflowX + cs.overflowY)) continue;
      coupes.push(n.getBoundingClientRect());
    }
    return coupes;
  };

  const lignesVisibles = (el) => {
    const coupes = rognages(el);
    const out = [];
    for (const r of el.getClientRects()) {
      let x1 = r.left;
      let y1 = r.top;
      let x2 = r.right;
      let y2 = r.bottom;
      for (const c of coupes) {
        x1 = Math.max(x1, c.left);
        y1 = Math.max(y1, c.top);
        x2 = Math.min(x2, c.right);
        y2 = Math.min(y2, c.bottom);
      }
      x1 = Math.max(x1, 0);
      y1 = Math.max(y1, 0);
      x2 = Math.min(x2, window.innerWidth);
      y2 = Math.min(y2, window.innerHeight);
      if (x2 - x1 > 0 && y2 - y1 > 0) {
        out.push({ left: x1, top: y1, right: x2, bottom: y2, width: x2 - x1, height: y2 - y1 });
      }
    }
    // Un élément sans boîte de ligne (remplacé, ou entièrement rogné) garde sa
    // boîte englobante : mieux vaut le mesurer approximativement que pas du tout.
    return out.length ? out : [rectVisible(el)];
  };

  /**
   * L'élément est-il CE QU'ON VOIT à cet endroit ?
   *
   * `display`, `visibility` et `opacity` ne suffisent pas. Une carte qui se
   * retourne pose son recto et son verso au même endroit, tous deux « visibles »
   * au sens du style — seul `backface-visibility` en cache un. Idem d'un bloc
   * recouvert par un autre. Le pointage tranche tout ça d'un coup : si le
   * navigateur ne désigne pas cet élément (ou l'un des siens) au centre de sa
   * boîte, ce n'est pas lui que le visiteur voit.
   */
  const pointe = (el, v) => {
    const cible = document.elementFromPoint((v.left + v.right) / 2, (v.top + v.bottom) / 2);
    if (!cible) return false;
    return cible === el || el.contains(cible) || cible.contains(el);
  };

  /**
   * Visibilité DANS LE DOCUMENT, indépendante du défilement.
   *
   * ⚠️ À ne pas confondre avec `visible()`, qui répond « est-ce affiché ICI,
   * maintenant ». Certaines propriétés sont structurelles — « la page a un seul
   * h1 », « les niveaux de titre s'enchaînent » — et n'ont rien à voir avec la
   * position de la fenêtre. Les mesurer avec le test de fenêtre m'a fait
   * signaler « 0 h1 » sur quatre pages qui en ont un : sondées depuis le bas,
   * leur titre était simplement hors champ.
   */
  const dansLeDocument = (el) => {
    const cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden') return false;
    if (Number(cs.opacity) < 0.05) return false;
    const r = el.getBoundingClientRect();
    return r.width > 1 && r.height > 1;
  };

  const visible = (el) => {
    const s = getComputedStyle(el);
    if (s.display === 'none' || s.visibility === 'hidden') return false;
    if (Number(s.opacity) < 0.05) return false;
    const v = rectVisible(el);
    if (v.width <= 1 || v.height <= 1) return false;
    return pointe(el, v);
  };
  /** Élément « feuille de texte » : il porte du texte et aucun enfant n'en porte. */
  const feuillesTexte = () =>
    [...document.querySelectorAll('body *')].filter((el) => {
      if (el.closest('[aria-hidden="true"]')) return false;
      if (dansSurcouche(el)) return false;
      if (!visible(el)) return false;
      const t = (el.textContent ?? '').trim();
      if (t.length < 2) return false;
      return ![...el.children].some((c) => (c.textContent ?? '').trim().length > 1);
    });

  const decrire = (el) => {
    const cls = (el.className?.baseVal ?? el.className ?? '').toString().slice(0, 70);
    return `<${el.tagName.toLowerCase()}${cls ? ` class="${cls}"` : ''}> « ${(el.textContent ?? '')
      .trim()
      .slice(0, 45)} »`;
  };

  const trouvailles = [];

  // 1. Débordement horizontal du document — la page « bave » sur le côté.
  const de = document.documentElement;
  if (de.scrollWidth > de.clientWidth + 1) {
    const coupables = [...document.querySelectorAll('body *')]
      .filter((el) => {
        if (!visible(el) || dansSurcouche(el)) return false;
        const r = el.getBoundingClientRect();
        return r.right > de.clientWidth + 2 || r.left < -2;
      })
      .slice(0, 6)
      .map(decrire);
    trouvailles.push({
      genre: 'debordement-page',
      detail: `scrollWidth ${de.scrollWidth} > ${de.clientWidth}`,
      coupables,
    });
  }

  // 2. Chevauchement de deux textes sans lien de parenté.
  const feuilles = feuillesTexte();
  const boites = feuilles.map((el) => ({ el, lignes: lignesVisibles(el) }));
  for (let i = 0; i < boites.length; i++) {
    for (let j = i + 1; j < boites.length; j++) {
      const a = boites[i];
      const b = boites[j];
      if (a.el.contains(b.el) || b.el.contains(a.el)) continue;

      // On retient le PIRE croisement ligne à ligne. Deux textes se chevauchent
      // dès qu'une de leurs lignes en recouvre une autre ; l'union des boîtes,
      // elle, ne dit rien de ce qui est réellement superposé à l'écran.
      let pire = null;
      for (const ra of a.lignes) {
        for (const rb of b.lignes) {
          const x = Math.min(ra.right, rb.right) - Math.max(ra.left, rb.left);
          const y = Math.min(ra.bottom, rb.bottom) - Math.max(ra.top, rb.top);
          if (x <= 2 || y <= 2) continue;
          const plusPetite = Math.min(ra.width * ra.height, rb.width * rb.height);
          const taux = (x * y) / plusPetite;
          if (!pire || taux > pire.taux) pire = { taux, x, y };
        }
      }
      if (!pire) continue;
      // Un empilement volontaire (onglets, temps d'une scène) se recouvre
      // ENTIÈREMENT ; on ne signale que les recouvrements partiels, qui sont
      // toujours des accidents.
      if (pire.taux > 0.12 && pire.taux < 0.92) {
        trouvailles.push({
          genre: 'chevauchement-texte',
          detail: `${Math.round(pire.taux * 100)} % de recouvrement (${Math.round(pire.x)}×${Math.round(pire.y)} px)`,
          coupables: [decrire(a.el), decrire(b.el)],
        });
      }
    }
  }

  // 3. Texte qui déborde de son parent rogné — donc coupé à l'écran.
  for (const el of feuilles) {
    const p = el.parentElement;
    if (!p) continue;
    const sp = getComputedStyle(p);
    if (!/hidden|clip/.test(sp.overflow + sp.overflowY + sp.overflowX)) continue;
    const r = el.getBoundingClientRect();
    const rp = p.getBoundingClientRect();
    const deborde = Math.max(r.bottom - rp.bottom, rp.top - r.top, r.right - rp.right, rp.left - r.left);
    // Une coupure PARTIELLE est un défaut ; un texte entièrement hors cadre est
    // un écran inactif de carrousel, parfaitement légitime.
    const v = rectVisible(el);
    const partVisible = (v.width * v.height) / Math.max(1, r.width * r.height);
    if (partVisible < 0.15 || partVisible > 0.97) continue;
    if (deborde > 3) {
      trouvailles.push({
        genre: 'texte-rogne',
        detail: `dépasse de ${Math.round(deborde)} px un parent en overflow:hidden`,
        coupables: [decrire(el)],
      });
    }
  }

  // 4. Contraste du texte (WCAG 2.1). Un texte trop pâle n'est pas un détail de
  //    style : c'est du contenu que certains visiteurs ne lisent pas.
  const canal = (c) => {
    const v = c / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  };
  const lum = ([r, g, b]) => 0.2126 * canal(r) + 0.7152 * canal(g) + 0.0722 * canal(b);
  /**
   * Résout N'IMPORTE QUELLE syntaxe de couleur CSS en sRGB, via le navigateur.
   *
   * ⚠️ NE PAS revenir à une expression régulière. Tailwind v4 émet du
   * `oklch(0.444 0.011 73.639)` : lus comme du RGB, ces trois nombres donnaient
   * des rapports de contraste de 1,10:1 sur des textes parfaitement lisibles.
   * Un audit qui invente des défauts est pire qu'un audit absent — on passe la
   * journée à corriger des couleurs qui allaient bien.
   *
   * Le canvas, lui, applique le même moteur de couleur que le rendu.
   */
  const pinceau = document.createElement('canvas').getContext('2d', { willReadFrequently: true });
  pinceau.canvas.width = 1;
  pinceau.canvas.height = 1;
  const lire = (c) => {
    if (!c || c === 'transparent') return null;
    pinceau.clearRect(0, 0, 1, 1);
    pinceau.fillStyle = '#000';
    pinceau.fillStyle = c; // refusée ⇒ reste '#000', on ne peut pas conclure
    if (pinceau.fillStyle === '#000000' && !/^#0{3,8}$|black|rgba?\(0, ?0, ?0/.test(c)) return null;
    pinceau.fillRect(0, 0, 1, 1);
    const [r, g, b, a] = pinceau.getImageData(0, 0, 1, 1).data;
    return { rgb: [r, g, b], a: a / 255 };
  };
  /** Fond effectif : on remonte jusqu'au premier ancêtre réellement opaque. */
  const fondDe = (el) => {
    for (let n = el; n; n = n.parentElement) {
      const cs = getComputedStyle(n);
      // Un dégradé ou une image : on ne sait pas conclure, on s'abstient.
      if (cs.backgroundImage && cs.backgroundImage !== 'none') return null;
      const f = lire(cs.backgroundColor);
      if (f && f.a >= 0.95) return f.rgb;
      if (f && f.a > 0.05) return null; // semi-transparent : indécidable
    }
    return [255, 255, 255];
  };

  /** #f5a623 (--honey) et #fe9a00 (ambre-500 de Tailwind), les deux miels du produit. */
  const MIELS = [
    [245, 166, 35],
    [254, 154, 0],
  ];

  for (const el of feuilles) {
    const cs = getComputedStyle(el);
    const av = lire(cs.color);
    if (!av || av.a < 0.95) continue;
    const fond = fondDe(el);
    if (!fond) continue;
    const l1 = lum(av.rgb);
    const l2 = lum(fond);
    const ratio = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
    const px = parseFloat(cs.fontSize);
    const gras = Number(cs.fontWeight) >= 700;
    const grand = px >= 24 || (gras && px >= 18.66);
    const seuil = grand ? 3 : 4.5;
    /**
     * DEUX EXCEPTIONS NOMMÉES, ET DEUX SEULEMENT. Toutes deux sont des choix
     * assumés contre la mesure, pas des oublis — c'est écrit ici pour que
     * personne ne les « corrige » sans savoir qu'un aller-retour a déjà eu lieu.
     *
     * ── 1 ── Le blanc sur le miel de marque.
     *
     * Le miel (#f5a623, et son voisin ambre-500 #fe9a00) est une couleur
     * claire ; du blanc dessus donne 2,03:1. Ça a été mesuré, corrigé en texte
     * sombre (8,39:1), montré — et refusé : le rendu ne convenait pas. La
     * décision assumée est donc « bouton miel, texte blanc ».
     *
     * Il n'y a pas de troisième voie : garder le blanc en fonçant le fond ne
     * passe le seuil qu'à ~64 % de la luminosité du miel (#9d6a16), où le
     * bouton n'est plus miel mais brun.
     *
     * L'exception est écrite ICI plutôt que par une désactivation du contrôle,
     * et elle est étroite : ce couple de couleurs précis, rien d'autre. Tout
     * autre défaut de contraste continue de faire échouer la CI — y compris du
     * blanc sur un miel qui aurait dérivé.
     */
    const estBlanc = av.rgb.every((c) => c >= 250);
    const fondMielDeMarque = MIELS.some((m) => m.every((c, i) => Math.abs(c - fond[i]) <= 2));
    if (ratio < seuil && estBlanc && fondMielDeMarque) continue;

    /**
     * ── 2 ── Le miel de marque en couleur de TEXTE, sur les GRANDS titres.
     *
     * « Parce que chaque abeille / compte chez APIGO » : la seconde ligne est en
     * miel, c'est la signature visuelle de la page d'accueil. Sur le crème, elle
     * donne 1,94:1 là où le grand texte exige 3. Le miel assombri (--honey-deep,
     * 5,39:1) passait le seuil mais rendait le titre brun — refusé.
     *
     * L'exception est bornée au GRAND TEXTE (≥ 24 px, ou ≥ 18,66 px en gras).
     * En petit corps, le miel reste interdit et l'audit continue de le refuser :
     * c'est ce qui avait fait remonter l'onglet du simulateur à 8,5 px et
     * l'étiquette de balance à 11 px, deux vrais défauts de lisibilité corrigés
     * avec --honey-deep. Une signature de titre est un choix graphique ; un
     * libellé de 8 px illisible n'en est pas un.
     */
    const texteMielDeMarque = MIELS.some((m) => m.every((c, i) => Math.abs(c - av.rgb[i]) <= 2));
    if (ratio < seuil && texteMielDeMarque && grand) continue;
    if (ratio < seuil) {
      trouvailles.push({
        genre: 'contraste-insuffisant',
        // La clé de regroupement est le COUPLE de couleurs : cent éléments
        // partagent en général trois couples, et c'est le couple qu'on corrige.
        detail: `${ratio.toFixed(2)}:1 (min ${seuil}) · rgb(${av.rgb.join(',')}) sur rgb(${fond.join(',')}) · ${px}px`,
        coupables: [decrire(el)],
      });
    }
  }

  // 5. Éléments actionnables SANS NOM ACCESSIBLE.
  //    Un bouton sans libellé ni aria-label est annoncé « bouton » par un
  //    lecteur d'écran, et rien de plus. À la souris on devine par l'icône ; au
  //    clavier ou à la voix, on ne peut ni le nommer ni le comprendre.
  const nomAccessible = (el) => {
    const aria = el.getAttribute('aria-label');
    if (aria && aria.trim()) return aria.trim();
    const par = el.getAttribute('aria-labelledby');
    if (par) {
      const cible = document.getElementById(par);
      if (cible && (cible.textContent ?? '').trim()) return cible.textContent.trim();
    }
    const titre = el.getAttribute('title');
    if (titre && titre.trim()) return titre.trim();
    const txt = (el.textContent ?? '').trim();
    if (txt) return txt;
    // Une image porteuse à l'intérieur peut nommer le contrôle.
    const img = el.querySelector('img[alt]:not([alt=""])');
    return img ? img.getAttribute('alt') : '';
  };

  for (const el of document.querySelectorAll('button, a[href], [role="button"]')) {
    if (dansSurcouche(el)) continue;
    if (!visible(el)) continue;
    if (el.getAttribute('aria-hidden') === 'true') continue;
    if (!nomAccessible(el)) {
      trouvailles.push({
        genre: 'sans-nom-accessible',
        detail: `<${el.tagName.toLowerCase()}> actionnable sans libellé, aria-label ni title`,
        coupables: [decrire(el)],
      });
    }
  }

  // 6. Images sans alternative textuelle.
  for (const img of document.querySelectorAll('img')) {
    if (!visible(img)) continue;
    if (img.getAttribute('alt') === null && img.getAttribute('aria-hidden') !== 'true') {
      trouvailles.push({
        genre: 'image-sans-alt',
        detail: `src « ${(img.getAttribute('src') ?? '').slice(-48)} »`,
        coupables: [decrire(img)],
      });
    }
  }

  // 7. Hiérarchie des titres.
  //    Un niveau sauté (h2 → h4) casse la navigation par titres, qui est LA
  //    façon dont on parcourt une page longue avec un lecteur d'écran.
  /**
   * ⚠️ UN TITRE N'EST PAS FORCÉMENT UNE BALISE Hn.
   *
   * `role="heading" aria-level="1"` est un titre de niveau 1 à part entière pour
   * l'accessibilité. La page d'accueil s'en sert délibérément : le bloc mobile
   * porte le vrai <h1> (l'indexation est mobile-first) et le bloc desktop, qui
   * ne s'affiche jamais en même temps, prend le rôle — de cette façon le DOM ne
   * contient jamais deux <h1>.
   *
   * En ne lisant que les balises, mon détecteur a signalé « 0 h1 » sur la page
   * la plus importante du site, alors qu'elle en a exactement un et que le
   * choix est commenté dans le code. Corriger le détecteur, pas la page.
   */
  const niveauTitre = (el) => {
    if (/^H[1-6]$/.test(el.tagName)) return Number(el.tagName[1]);
    const n = Number(el.getAttribute('aria-level'));
    return Number.isInteger(n) && n >= 1 && n <= 6 ? n : null;
  };

  const titres = [...document.querySelectorAll('h1, h2, h3, h4, h5, h6, [role="heading"]')]
    .filter((h) => niveauTitre(h) !== null && dansLeDocument(h) && !dansSurcouche(h))
    // Ordre du document : un titre pris deux fois par le sélecteur fausserait
    // la détection de niveau sauté.
    .filter((h, i, t) => t.indexOf(h) === i);
  const h1 = titres.filter((h) => niveauTitre(h) === 1);
  if (h1.length !== 1) {
    trouvailles.push({
      genre: 'titres-h1',
      detail: `${h1.length} <h1> visible(s) — il en faut exactement un`,
      coupables: h1.slice(0, 3).map(decrire),
    });
  }
  let precedent = 0;
  for (const h of titres) {
    const n = niveauTitre(h);
    if (precedent && n > precedent + 1) {
      trouvailles.push({
        genre: 'niveau-de-titre-saute',
        detail: `h${precedent} suivi d'un h${n}`,
        coupables: [decrire(h)],
      });
    }
    precedent = n;
  }

  return trouvailles;
};

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
const SCENARIOS = ECRANS.flatMap((ecran) => PAGES.map((chemin) => ({ ecran, chemin })));
const CONCURRENCE = Number(process.env.AUDIT_CONCURRENCE ?? 4);

async function mesurer({ ecran, chemin }) {
    const ctx = await nav.newContext({
      ...(ecran.nom.startsWith('mobile') ? devices['iPhone 14'] : {}),
      viewport: ecran.viewport,
      reducedMotion: 'no-preference',
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
    await page.goto(BASE + chemin, { waitUntil: 'load' });
    await page.addStyleTag({ content: 'html{scroll-behavior:auto !important}' });

    /**
     * Une page qui se redirige elle-même après hydratation détruit le contexte
     * d'exécution en plein milieu des mesures. Playwright remonte alors
     * « Execution context was destroyed » — sans dire QUELLE page, ni à quelle
     * largeur. Une porte de CI qui échoue sans nommer sa cause coûte une
     * demi-heure à chaque fois ; on préfère la nommer.
     */
    const arrivee = new URL(page.url()).pathname;
    if (arrivee !== chemin) {
      await ctx.close();
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
    const h = await page.evaluate(() => document.body.scrollHeight);
    const vh = ecran.viewport.height;
    const pas = Math.floor(vh * 0.75);

    for (let y = 0; y < h; y += pas) {
      await page.evaluate((v) => window.scrollTo(0, v), y);
      await page.waitForTimeout(90);
    }
    await page.waitForTimeout(1200);

    const t = [];
    const vues = new Set();
    for (let y = 0; y < h; y += pas) {
      await page.evaluate((v) => window.scrollTo(0, v), y);
      await page.waitForTimeout(160);
      for (const trouvaille of await page.evaluate(SONDE)) {
        // Un même défaut est vu depuis deux arrêts voisins : on le compte une fois.
        const cle = trouvaille.genre + '|' + trouvaille.coupables.join('|');
        if (vues.has(cle)) continue;
        vues.add(cle);
        t.push(trouvaille);
      }
    }
    if (t.length) {
      rapport.push({ ecran: ecran.nom, chemin, trouvailles: t });
      total += t.length;
    }
    await ctx.close();
}

// File d'attente partagée : chaque ouvrier prend le scénario suivant dès qu'il
// se libère, plutôt qu'un découpage en tranches égales — les pages n'ont pas
// du tout le même coût, et une tranche lente ferait attendre les autres.
let curseur = 0;
await Promise.all(
  Array.from({ length: Math.min(CONCURRENCE, SCENARIOS.length) }, async () => {
    for (let i = curseur++; i < SCENARIOS.length; i = curseur++) {
      await mesurer(SCENARIOS[i]);
    }
  }),
);
await nav.close();
// Le serveur bâti ici n'appartient qu'à ce script : il meurt avec lui, quel
// que soit le chemin de sortie.
serveur?.kill();

if (!total) {
  console.log(`✓ ${ECRANS.length} largeurs × ${PAGES.length} pages : aucun chevauchement, aucun débordement`);
  process.exit(0);
}

console.log(`✖ ${total} anomalie(s) de mise en page\n`);
for (const bloc of rapport) {
  console.log(`── ${bloc.chemin}  @${bloc.ecran}`);
  const parGenre = {};
  for (const t of bloc.trouvailles) (parGenre[t.genre] ??= []).push(t);
  for (const [genre, liste] of Object.entries(parGenre)) {
    console.log(`   ${genre} (${liste.length})`);
    if (genre === 'contraste-insuffisant') {
      // Un couple de couleurs = une correction. On compte les occurrences.
      const parCouple = {};
      for (const t of liste) (parCouple[t.detail] ??= []).push(t.coupables[0]);
      for (const [couple, els] of Object.entries(parCouple).sort((a, b) => b[1].length - a[1].length)) {
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
