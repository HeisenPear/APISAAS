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
const ROUTES = ['/', '/maya', '/tarifs', '/fonctionnalites'];

/** Ce qui ne doit JAMAIS se retrouver dans le HTML servi. */
const INTERDITS = [
  { motif: /class="[^"]*\brev\b[^"]*"/, quoi: 'la classe .rev (opacité 0) — contenu masqué pour les moteurs' },
  { motif: /style="[^"]*translate3d/, quoi: 'un translate3d figé — la parallaxe a fui dans le rendu serveur' },
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

for (const route of ROUTES) {
  const { code, corps } = await interroger(route);
  if (code !== 200) {
    echecs.push(`${route} → ${code}`);
    continue;
  }
  for (const { motif, quoi } of INTERDITS) {
    if (motif.test(corps)) echecs.push(`${route} → ${quoi}`);
  }
  console.log(`  ✓ ${route}`);
}

const erreurs = (journal.match(/\[server-error\]/g) ?? []).length;
if (erreurs) echecs.push(`${erreurs} erreur(s) de rendu dans le journal du serveur`);

if (echecs.length) {
  console.error('\n✖ rendu serveur :\n' + echecs.map((e) => `   ${e}`).join('\n'));
  console.error('\n--- journal ---\n' + journal.slice(0, 4000));
  fin(1);
}

console.log(`\n✓ ${ROUTES.length} routes rendues côté serveur, sans erreur ni contenu masqué`);
fin(0);
