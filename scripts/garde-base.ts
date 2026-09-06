/**
 * GARDE-FOU DES SCRIPTS QUI ÉCRIVENT DANS LA BASE.
 *
 * `npm run db:seed` et `npm run db:push` lisent `DATABASE_URL` dans
 * l'environnement. Or dans ce dépôt, `.env` porte la base de PRODUCTION — celle
 * des clients qui paient. Rien n'empêchait donc de semer des données de
 * démonstration au milieu de leurs ruchers, ou de laisser `drizzle-kit push`
 * modifier leur schéma sans confirmation.
 *
 * (Et un `.env.test` ne protège de rien : le seul qui ait existé ici ne
 * différait de `.env` que par le bloc Stripe — même DATABASE_URL, donc même
 * base de production. Le mot « test » dans un nom de fichier n'est pas une
 * garantie ; le fichier d'environnement de référence du dépôt est `.env`.)
 *
 * PRINCIPE : rien n'est codé en dur — aucun nom d'hôte, aucun identifiant de
 * projet. On distingue seulement une base LOCALE d'une base distante, et toute
 * base distante exige une autorisation EXPLICITE, donnée à la commande. Le geste
 * devient conscient au lieu d'être un réflexe.
 *
 *     APIGO_AUTORISE_ECRITURE_BASE=oui npm run db:seed
 */

const CLE_AUTORISATION = 'APIGO_AUTORISE_ECRITURE_BASE';

/** Hôtes considérés comme locaux — une base jetable, sans client derrière. */
const HOTES_LOCAUX = new Set(['localhost', '127.0.0.1', '::1', '0.0.0.0', 'host.docker.internal']);

export interface CibleBase {
  hote: string;
  base: string;
  locale: boolean;
}

/** Lit l'URL sans jamais exposer les identifiants qu'elle contient. */
export function analyserCible(url: string): CibleBase | null {
  try {
    const u = new URL(url);
    const hote = u.hostname;
    return {
      hote,
      base: u.pathname.replace(/^\//, '') || '(défaut)',
      locale: HOTES_LOCAUX.has(hote) || hote.endsWith('.local'),
    };
  } catch {
    return null;
  }
}

/**
 * Arrête le processus si l'on s'apprête à écrire dans une base distante sans
 * autorisation explicite. Rend la cible pour que l'appelant puisse l'annoncer.
 */
export function exigerAutorisation(operation: string): CibleBase {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error(`✗ ${operation} : DATABASE_URL n'est pas définie.`);
    process.exit(1);
  }

  const cible = analyserCible(url);
  if (!cible) {
    console.error(`✗ ${operation} : DATABASE_URL est illisible (ce n'est pas une URL valide).`);
    process.exit(1);
  }

  console.log(`→ ${operation}`);
  console.log(`  base : ${cible.base} sur ${cible.hote}${cible.locale ? ' (locale)' : ''}`);

  if (cible.locale) return cible;

  if (process.env[CLE_AUTORISATION] !== 'oui') {
    console.error('');
    console.error(`✗ REFUSÉ — « ${cible.hote} » n'est pas une base locale.`);
    console.error('');
    console.error("  Cette commande ÉCRIT dans la base. Si c'est la production, elle touche les");
    console.error('  données de vrais clients — et rien ne les restaure ensuite.');
    console.error('');
    console.error('  Si vous savez ce que vous faites :');
    console.error(`    ${CLE_AUTORISATION}=oui npm run <commande>`);
    console.error('');
    process.exit(1);
  }

  console.log(`  autorisation explicite reçue (${CLE_AUTORISATION}=oui)`);
  return cible;
}

// Exécuté directement (`tsx scripts/garde-base.ts`) : sert de préalable aux
// commandes npm qui ne peuvent pas appeler la garde elles-mêmes, comme
// `drizzle-kit push`.
if (process.argv[1]?.includes('garde-base')) {
  exigerAutorisation(process.env.APIGO_OPERATION ?? 'écriture dans la base');
}
