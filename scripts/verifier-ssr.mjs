#!/usr/bin/env node
/**
 * Vérifie que les pages publiques se rendent VRAIMENT côté serveur.
 *
 * POURQUOI CE SCRIPT EXISTE
 *
 * `npm run build` ne rend aucune page en local (le prérendu échoue en silence,
 * faute de variables Supabase). Une directive enregistrée par un plugin
 * `.client` passe donc les quatre portes de la CI sans broncher — et met la
 * page d'accueil en 500 dès le déploiement, parce que le rendu serveur appelle
 * `getSSRProps` sur CHAQUE directive d'un gabarit, et le lit sur `undefined`
 * quand elle n'existe pas côté serveur.
 *
 * C'est arrivé. Ce script est le filet.
 *
 * DEUX PIÈGES QUI M'ONT COÛTÉ DU TEMPS, ÉVITÉS ICI
 *
 *  · Le préfixe des variables. `@nuxtjs/supabase` lit `SUPABASE_URL` au BUILD ;
 *    au démarrage du serveur bâti, seul le nom de surcharge Nuxt fonctionne —
 *    `NUXT_PUBLIC_SUPABASE_URL`. Avec l'autre, la page reste en 500 sur un
 *    message trompeur : « URL and Key are required ».
 *
 *  · Le proxy sortant. `curl` vers 127.0.0.1 part dans le proxy de l'agent et
 *    n'arrive jamais. D'où `noProxy` sur l'agent HTTP.
 *
 * Les valeurs injectées ici sont FACTICES et le restent : on ne teste pas la
 * base, on teste que le gabarit se rend. Aucune requête ne sort.
 */
import { spawn } from 'node:child_process';
import { get, Agent } from 'node:http';

const PORT = Number(process.env.PORT_VERIF ?? 4173);
/**
 * Les routes vérifiées, et ce que leur HTML SERVEUR doit contenir.
 *
 * ⚠️ `doitContenir` EXISTE À CAUSE DU FORUM, ET IL AURAIT ATTRAPÉ MON PROPRE
 * DÉFAUT. La première version des pages du forum chargeait ses données dans
 * `onMounted` : dans un navigateur, tout paraissait juste — la liste s'affiche,
 * les fils s'ouvrent. Mais `onMounted` ne s'exécute PAS au rendu serveur, donc
 * le HTML envoyé à un moteur de recherche ne contenait qu'un squelette. Un
 * forum public qui n'est pas indexable n'a aucune raison d'être public.
 *
 * Un code 200 ne dit rien de tout ça : la page vide répond 200. Il faut donc
 * exiger qu'un morceau de la page SOIT LÀ, dans le HTML du serveur.
 *
 * ⚠️ CE MORCEAU NE DOIT PAS DÉPENDRE DE LA BASE. Ce script tourne avec des
 * variables FACTICES et sans base : exiger le titre d'un vrai sujet le rendrait
 * rouge en CI pour une bonne raison qui n'est pas la sienne. On vise la coquille
 * propre à la page — son `<h1>` — qui n'existe que si le gabarit s'est rendu.
 */
const ROUTES = [
  { chemin: '/' },
  { chemin: '/maya' },
  { chemin: '/tarifs' },
  { chemin: '/fonctionnalites' },
  {
    chemin: '/forum',
    doitContenir: /<h1[^>]*>\s*Forum\s*</,
    pourquoi:
      'le forum est public POUR être indexable : son gabarit doit se rendre côté serveur, ' +
      'pas seulement après hydratation',
    /**
     * ⚠️ CE SECOND MOTIF EXISTE PARCE QUE LE PREMIER NE SUFFISAIT PAS, ET LA
     * MUTATION L'A PROUVÉ. Passer le chargement en `{ server: false }` — c'est
     * à dire revenir exactement au défaut d'origine, des données chargées côté
     * client seulement — laissait `<h1>Forum</h1>` en place : il vient de
     * l'en-tête statique de la page, pas de ses données. Le cas restait VERT.
     *
     * MESURÉ, sur les deux builds : la variante client-seul sert au robot
     * « Personne n'a encore ouvert de sujet » — l'état VIDE, rendu sans que
     * personne n'ait interrogé quoi que ce soit. Un forum plein qui se déclare
     * désert dans le HTML indexé : précisément le mensonge que
     * `etatsDErreur.test.ts` interdit aux écrans, ici échappé jusqu'à Google.
     *
     * Ce harnais tourne SANS base (c'est écrit en tête). Un chargement qui part
     * vraiment côté serveur échoue donc, et la page rend son état d'erreur.
     * C'est ça qu'on exige : la preuve que le serveur a ATTENDU une réponse.
     * Avec une base, ce serait la liste ; sans, c'est « Réessayer ». Dans les
     * deux cas, ce n'est jamais l'état vide.
     */
    interdit: /Personne n’a encore ouvert de sujet/,
    pourquoiPasCa:
      'le HTML servi annonce un forum VIDE sans avoir rien chargé — les données ne partent ' +
      'donc pas au rendu serveur (un `server: false`, ou un retour à `onMounted`)',
  },
];

/** Ce qui ne doit JAMAIS se retrouver dans le HTML servi. */
/**
 * ⚠️ `rev` DOIT ÊTRE UN JETON DE CLASSE ENTIER, pas une sous-chaîne.
 *
 * Écrit `\brev\b`, le motif attrapait `class="rev-ligne"` — le masque
 * typographique du titre, une classe statique parfaitement légitime qui ne
 * cache rien côté serveur. Le tiret est un bord de mot pour `\b`. Un garde qui
 * crie au loup finit par être désactivé, ce qui est pire que pas de garde.
 */
const INTERDITS = [
  {
    motif: /class="(?:[^"]*\s)?rev(?:\s[^"]*)?"/,
    quoi: 'la classe .rev (opacité 0) — contenu masqué pour les moteurs',
  },
  {
    motif: /style="[^"]*translate3d/,
    quoi: 'un translate3d figé — la parallaxe a fui dans le rendu serveur',
  },
];

function interroger(route) {
  return new Promise((resoudre) => {
    // Agent explicite : sans lui, Node peut router 127.0.0.1 par le proxy sortant.
    get({ host: '127.0.0.1', port: PORT, path: route, agent: new Agent() }, (rep) => {
      let corps = '';
      rep.on('data', (c) => (corps += c));
      rep.on('end', () => resoudre({ code: rep.statusCode, corps }));
    }).on('error', () => resoudre({ code: 0, corps: '' }));
  });
}

const serveur = spawn(process.execPath, ['.output/server/index.mjs'], {
  env: {
    ...process.env,
    PORT: String(PORT),
    NUXT_PUBLIC_SUPABASE_URL: 'http://127.0.0.1:9/factice',
    NUXT_PUBLIC_SUPABASE_KEY: 'cle-factice-verification-ssr',
  },
  stdio: ['ignore', 'pipe', 'pipe'],
});

let journal = '';
serveur.stdout.on('data', (d) => (journal += d));
serveur.stderr.on('data', (d) => (journal += d));

const fin = (code) => {
  serveur.kill();
  process.exit(code);
};

async function attendre() {
  for (let i = 0; i < 120; i++) {
    const { code } = await interroger('/');
    if (code) return true;
    await new Promise((r) => setTimeout(r, 250));
  }
  return false;
}

const echecs = [];

if (!(await attendre())) {
  console.error('✖ le serveur bâti n’a jamais répondu\n' + journal);
  fin(1);
}

for (const { chemin, doitContenir, pourquoi, interdit, pourquoiPasCa } of ROUTES) {
  const { code, corps } = await interroger(chemin);
  if (code !== 200) {
    echecs.push(`${chemin} → ${code}`);
    continue;
  }
  for (const { motif, quoi } of INTERDITS) {
    if (motif.test(corps)) echecs.push(`${chemin} → ${quoi}`);
  }
  if (doitContenir && !doitContenir.test(corps)) {
    echecs.push(`${chemin} → absent du HTML serveur : ${pourquoi}`);
  }
  if (interdit && interdit.test(corps)) {
    echecs.push(`${chemin} → présent dans le HTML serveur : ${pourquoiPasCa}`);
  }
  console.log(`  ✓ ${chemin}`);
}

/**
 * ⚠️ UNE SEULE ERREUR SERVEUR EST TOLÉRÉE, ET C'EST CELLE QUE CE SCRIPT CRÉE
 * LUI-MÊME.
 *
 * Ce harnais démarre sans base : c'est écrit en tête, et c'est voulu — on teste
 * que le gabarit se rend, pas que la base répond. Les quatre pages marketing ne
 * s'en apercevaient pas, n'appelant aucune API au rendu serveur. `/forum` est la
 * PREMIÈRE de cette liste à charger ses données côté serveur : son appel échoue
 * donc ici, forcément, sur l'absence de `DATABASE_URL`.
 *
 * Ce que ça prouve est utile, et c'est pour ça qu'on ne se contente pas de
 * l'ignorer : la page a quand même répondu 200 AVEC son `<h1>` (le cas
 * `doitContenir` ci-dessus l'a vérifié). Autrement dit, une base indisponible
 * en production ne met pas le forum en 500 — elle affiche son état d'erreur.
 *
 * ⚠️ LE FILTRE EST EXACT, PAS APPROXIMATIF. Tolérer « toute erreur sur une route
 * d'API » rendrait ce garde aveugle à ce pour quoi il existe : une directive
 * `.client` lue au rendu serveur, un `undefined` dans un gabarit, une page en
 * 500. Seul ce message-là passe.
 */
const ERREUR_SANS_BASE = /DATABASE_URL environment variable is not configured/;
const erreurs = (journal.match(/\[server-error\][^\n]*/g) ?? []).filter(
  (ligne) => !ERREUR_SANS_BASE.test(ligne),
);
if (erreurs.length) {
  echecs.push(
    `${erreurs.length} erreur(s) de rendu dans le journal du serveur :\n     ` +
      erreurs.slice(0, 5).join('\n     '),
  );
}

if (echecs.length) {
  console.error('\n✖ rendu serveur :\n' + echecs.map((e) => `   ${e}`).join('\n'));
  console.error('\n--- journal ---\n' + journal.slice(0, 4000));
  fin(1);
}

console.log(`\n✓ ${ROUTES.length} routes rendues côté serveur, sans erreur ni contenu masqué`);
fin(0);
