/**
 * La SONDE — tout ce qui se mesure DANS la page, une fois rendue.
 *
 * Ce corps est sérialisé et exécuté par le navigateur (`page.evaluate`) : il ne
 * doit RIEN emprunter au module. Il vit dans son propre fichier pour une seule
 * raison — permettre à `controle-sonde.mjs` de l'appeler sur des cas fabriqués,
 * et donc de prouver que chaque règle sait encore voir ce qu'elle prétend voir.
 *
 * ⚠️ POURQUOI CE CONTRÔLE EXISTE. Trois versions successives de la règle
 * « débordement dans un conteneur » sont restées MUETTES sur un cas fabriqué
 * exprès pour les déclencher (`getBoundingClientRect`, puis `getClientRects`,
 * toutes deux aveugles au texte qui sort de sa propre boîte). Une porte verte
 * qui ne mesure rien coûte plus cher qu'une porte absente : elle rassure.
 */
export const SONDE = (options = {}) => {
  /**
   * `sansJs` : la page est mesurée telle que le SERVEUR l'envoie, sans
   * hydratation. Deux règles perdent leur sens dans cet état, et une seule
   * s'en sert (cf. plus bas, `titres-h1`).
   */
  const sansJs = options.sansJs === true;

  /**
   * ⚠️ SANS HYDRATATION, ON NE JUGE QUE LE CONTENU DE LA PAGE.
   *
   * La coquille applicative — barre latérale, en-tête, tiroir mobile — dépend
   * du JavaScript pour son état : sans lui, `<aside>` se déplie à 2 048 px de
   * large et ses variables de couleur ne sont pas posées, ce qui donne du
   * blanc sur blanc. Ce ne sont pas des défauts du produit, ce sont des
   * artefacts de la mesure ; les rapporter ferait exactement ce que ce fichier
   * passe son temps à éviter — une porte qu'on finit par ignorer.
   *
   * La coquille est couverte ailleurs : par les 18 pages publiques, mesurées
   * AVEC JavaScript, et par les bancs Playwright qui ouvrent le tiroir.
   * Ici, on regarde ce que la page met dans `main.app-content`.
   */
  const racine = sansJs
    ? (document.querySelector('main.app-content') ?? document.body)
    : document.body;
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
    [...racine.querySelectorAll('*')].filter((el) => {
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

  /**
   * 1 bis. DÉBORDEMENT À L'INTÉRIEUR D'UN CONTENEUR QUI ROGNE.
   *
   * ⚠️ LA RÈGLE CI-DESSOUS EST STRUCTURELLEMENT AVEUGLE DÈS QU'UNE PAGE VIT
   * DANS LE SHELL APPLICATIF, ET C'EST LA MOITIÉ DU PRODUIT.
   *
   * `app/layouts/default.vue` coupe `overflow-x` à TROIS niveaux (l. 2, 31 et
   * 53). `document.documentElement.scrollWidth` ne peut donc jamais dépasser
   * son `clientWidth` : la règle 1 ne peut RIEN rapporter sur une page du
   * produit, quoi qu'il arrive. Elle ne fonctionne sur les 18 pages publiques
   * que parce que celles-ci sont en `layout: false` — et c'est exactement
   * pourquoi les débordements signalés par l'apiculteur, tous les deux
   * derrière la connexion, ont traversé des mois de commits verts.
   *
   * Et ce n'est pas un détail cosmétique : `overflow-x-hidden` ne PRÉVIENT pas
   * le débordement, il le MASQUE. Le contenu trop large existe toujours, mais
   * il devient inatteignable — on ne peut même pas défiler jusqu'à lui. C'est
   * précisément le symptôme rapporté sur la carte de floraison : « tout dépasse
   * à droite », sans moyen d'y accéder.
   *
   * On mesure donc chaque conteneur qui rogne, et pas seulement le document.
   */
  for (const conteneur of [racine, ...racine.querySelectorAll('*')]) {
    const cs = getComputedStyle(conteneur);
    /**
     * ⚠️ SEULS `hidden` ET `clip` PERDENT LE CONTENU.
     *
     * Mon premier jet retenait aussi `auto` et `scroll` — et dénonçait donc le
     * remède en même temps que le mal : un tableau enveloppé dans un conteneur
     * défilant est le BON motif, son contenu reste à portée de doigt. Ce qu'on
     * traque, c'est le contenu qu'on ne peut pas atteindre, pas le contenu
     * qu'il faut faire glisser.
     */
    const perd = /hidden|clip/.test(cs.overflowX);
    if (!perd) continue;
    if (conteneur.scrollWidth <= conteneur.clientWidth + 1) continue;
    if (conteneur.clientWidth === 0) continue;

    /**
     * ⚠️ ON NE RETIENT QUE CE QU'ON PERD : du TEXTE ou une COMMANDE.
     *
     * Premier jet : tout élément dépassant. La porte a aussitôt dénoncé les
     * cercles flous en `pointer-events-none absolute -right-20` que les cartes
     * posent délibérément hors cadre pour être rognés — c'est le dessin voulu,
     * pas un défaut. Un détecteur qui crie sur la décoration finit ignoré, et
     * ce fichier en a déjà fait l'expérience (cf. `dansSurcouche`).
     *
     * Le symptôme réel est « je ne peux pas atteindre ce contenu » : il ne
     * concerne que ce qui se lit ou se clique. Une décoration rognée ne se
     * perd pas — elle n'a rien à donner.
     */
    const boite = conteneur.getBoundingClientRect();
    // Le rognage a lieu au bord de la boîte de PADDING, pas de la bordure.
    const bordD = boite.right - parseFloat(cs.borderRightWidth || '0');
    const bordG = boite.left + parseFloat(cs.borderLeftWidth || '0');

    /**
     * ⚠️ ON MESURE LE CONTENU, PAS LES BOÎTES — ET J'AI MIS TROIS TENTATIVES
     * À COMPRENDRE POURQUOI.
     *
     * Version précédente : « un descendant dont `scrollWidth > clientWidth` ».
     * Elle a dénoncé la carte « Réforme 2026 » de l'accueil, dont RIEN n'est
     * coupé : le panneau porte un cercle flou en `pointer-events-none absolute
     * -right-10`, posé hors cadre exprès pour être rogné. Ce cercle gonfle le
     * `scrollWidth` du panneau de 40 px, et la mesure accusait le panneau — au
     * lieu de la décoration, qui, elle, n'a rien à donner.
     *
     * Mesurer les boîtes ne peut pas trancher ce cas : la boîte d'un parent ne
     * dit pas QUI dépasse. On descend donc jusqu'au contenu lui-même —
     * l'étendue de chaque nœud de texte, et les éléments qu'on regarde ou
     * qu'on clique. Un cercle décoratif n'en fait pas partie ; un mot coupé,
     * si. C'est exactement le symptôme rapporté : « tout dépasse à droite »,
     * sans moyen d'y accéder.
     */
    const decoratif = (el) => {
      for (let n = el; n && n !== conteneur.parentElement; n = n.parentElement) {
        if (getComputedStyle(n).pointerEvents === 'none') return true;
        if (n.getAttribute?.('aria-hidden') === 'true') return true;
      }
      return false;
    };
    /**
     * Une troncature à l'ellipse (`text-overflow: ellipsis`) coupe elle aussi
     * du texte — mais c'est une décision de mise en page, signalée à l'œil par
     * les points de suspension. On ne la compte pas : sinon la porte rapporte
     * chaque libellé tronqué du produit et devient illisible.
     */
    const tronqueVolontairement = (el) => {
      for (let n = el; n && n !== conteneur.parentElement; n = n.parentElement) {
        if (getComputedStyle(n).textOverflow === 'ellipsis') return true;
      }
      return false;
    };

    /**
     * ⚠️ ET SURTOUT : CE QUI DÉFILE N'EST PAS PERDU.
     *
     * La barre d'onglets de l'espace Finances vit dans un `overflow-x-auto` :
     * « Prévisionnel » commence bien au-delà du bord de l'écran, et pourtant
     * il suffit de faire glisser pour l'atteindre. C'est le BON motif — celui
     * qu'on recommande ailleurs dans ce fichier. Le dénoncer reviendrait à
     * exiger qu'on le remplace par un rognage, c'est-à-dire à transformer le
     * remède en maladie.
     *
     * On remonte donc du contenu jusqu'au conteneur rogné : si un ancêtre
     * intermédiaire défile réellement (`scrollWidth > clientWidth`), le
     * contenu reste à portée de doigt.
     */
    const atteignableParDefilement = (el) => {
      for (let n = el; n && n !== conteneur; n = n.parentElement) {
        const st = getComputedStyle(n);
        if (/auto|scroll/.test(st.overflowX) && n.scrollWidth > n.clientWidth + 1) return true;
      }
      return false;
    };

    const perdus = [];
    const noter = (el, rects) => {
      if (atteignableParDefilement(el)) return;
      for (const r of rects) {
        if (r.width < 1 || r.height < 1) continue;
        // Entièrement hors cadre : écran inactif de carrousel, pas une coupure.
        if (r.right <= bordG + 2 || r.left >= bordD - 2) continue;
        if (r.right > bordD + 2 || r.left < bordG - 2) {
          perdus.push(el);
          return;
        }
      }
    };

    /**
     * L'étendue d'un nœud de texte rend une boîte PAR LIGNE, même dans un
     * bloc — contrairement à `getClientRects()` sur l'élément, qui rend la
     * boîte de bordure et reste donc muet quand c'est le texte qui sort.
     */
    const marcheur = document.createTreeWalker(conteneur, NodeFilter.SHOW_TEXT);
    const plage = document.createRange();
    for (let n = marcheur.nextNode(); n; n = marcheur.nextNode()) {
      const parent = n.parentElement;
      if (!parent || !(n.nodeValue ?? '').trim()) continue;
      if (!visible(parent) || dansSurcouche(parent)) continue;
      if (decoratif(parent) || tronqueVolontairement(parent)) continue;
      plage.selectNodeContents(n);
      noter(parent, plage.getClientRects());
    }

    const ATTEIGNABLE =
      'a,button,input,select,textarea,[role="button"],[tabindex],img,svg,video,canvas';
    for (const el of conteneur.querySelectorAll(ATTEIGNABLE)) {
      if (!visible(el) || dansSurcouche(el) || decoratif(el)) continue;
      noter(el, [el.getBoundingClientRect()]);
    }

    const coupables = [...new Set(perdus)]
      // Un ancêtre et son enfant dépassent ensemble : on ne garde que le plus
      // profond, sinon un seul défaut se rapporte cinq fois.
      .filter((el, _i, tous) => !tous.some((autre) => autre !== el && el.contains(autre)))
      .slice(0, 6)
      .map(decrire);
    // Sans coupable identifiable, on ne rapporte rien : un conteneur qui défile
    // volontairement (carrousel, tableau enveloppé) est légitime, et c'est ce
    // qui distingue les deux — un défilement voulu a ses éléments DANS la boîte
    // à un moment donné.
    if (!coupables.length) continue;

    trouvailles.push({
      genre: 'debordement-dans-conteneur',
      detail: `${decrire(conteneur)} : scrollWidth ${conteneur.scrollWidth} > clientWidth ${conteneur.clientWidth}`,
      coupables,
    });
  }

  // 1. Débordement horizontal du document — la page « bave » sur le côté.
  const de = document.documentElement;
  /**
   * Sans hydratation, cette règle ne peut rien dire d'utile : le tiroir mobile
   * de la coquille est rendu déplié et gonfle `scrollWidth` du document à
   * 2 000 px, alors que le shell le rogne à trois niveaux dès que le
   * JavaScript s'exécute. C'est `debordement-dans-conteneur`, scopé au contenu
   * de la page, qui fait le travail dans ce mode.
   */
  if (!sansJs && de.scrollWidth > de.clientWidth + 1) {
    const coupables = [...racine.querySelectorAll('*')]
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
    const deborde = Math.max(
      r.bottom - rp.bottom,
      rp.top - r.top,
      r.right - rp.right,
      rp.left - r.left,
    );
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

  const titres = [...racine.querySelectorAll('h1, h2, h3, h4, h5, h6, [role="heading"]')]
    .filter((h) => niveauTitre(h) !== null && dansLeDocument(h) && !dansSurcouche(h))
    // Ordre du document : un titre pris deux fois par le sélecteur fausserait
    // la détection de niveau sauté.
    .filter((h, i, t) => t.indexOf(h) === i);
  const h1 = titres.filter((h) => niveauTitre(h) === 1);
  /**
   * ⚠️ PAS DE VERDICT SUR LE TITRE PRINCIPAL SANS HYDRATATION.
   *
   * Derrière la connexion, le serveur rend l'état d'ATTENTE : l'aperçu flouté
   * d'une porte d'abonnement (`/clients`), un squelette de chargement, une
   * coquille en attente de profil. Le `<h1>` de ces pages existe bel et bien
   * dans le gabarit — il n'apparaît qu'une fois les données là. Le signaler
   * ferait rougir la porte sur cinq pages parfaitement correctes, et une porte
   * qui accuse à tort finit ignorée.
   *
   * La règle garde toute sa valeur là où elle compte : les 18 pages publiques,
   * mesurées avec JavaScript, celles qu'un moteur de recherche lit.
   */
  if (!sansJs && h1.length !== 1) {
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
