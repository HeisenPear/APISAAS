/**
 * Injecte une série de mesures RÉALISTES dans une balance connectée, via son
 * webhook d'ingestion.
 *
 * À quoi ça sert :
 *  - tester la chaîne complète sans posséder de balance physique ;
 *  - remplir une balance de démonstration avant de montrer le produit ;
 *  - reproduire un scénario (essaimage, récolte) pour vérifier les alertes.
 *
 * Le simulateur reproduit la physique d'une vraie colonie (rythme circadien,
 * miellée selon la météo, évaporation nocturne du nectar, régulation du couvain
 * à 35 °C, décharge de batterie, transmissions manquées). Il est partagé avec
 * la suite de tests : `tests/helpers/simulateurRuche.ts`.
 *
 * Chaque point est envoyé tour à tour dans l'un des trois formats du marché
 * (BEEP, TTN/LoRaWAN, capteur en grammes) pour éprouver le normaliseur.
 *
 * Usage :
 *   npx tsx scripts/simuler-balance.mts --token=<ingestToken> [options]
 *
 * Options :
 *   --token=…      OBLIGATOIRE. Visible sur la fiche de la balance (/balances/:id)
 *   --base=…       URL cible (défaut : http://localhost:3000)
 *   --jours=30     durée simulée
 *   --debut=…      date ISO de départ (défaut : il y a `jours` jours)
 *   --essaimage=11 index du jour où un essaim part, `-` pour aucun
 *   --recolte=24   index du jour de récolte, `-` pour aucune
 *   --vol=20       index du jour où la ruche est volée (aucun par défaut)
 *   --pas=60       minutes entre deux mesures
 *
 * Exemple :
 *   npx tsx scripts/simuler-balance.mts --token=abc… --base=https://apigo.fr --jours=45
 */
import {
  simulerRuche,
  enveloppeBeep,
  enveloppeTtn,
  enveloppeGrammes,
  type PointSimule,
} from '../tests/helpers/simulateurRuche.mjs';

interface Args {
  [k: string]: string | undefined;
}
const args: Args = Object.fromEntries(
  process.argv
    .slice(2)
    .filter((a) => a.startsWith('--'))
    .map((a) => {
      const [k, ...v] = a.slice(2).split('=');
      return [k!, v.join('=') || 'true'];
    }),
);

const token = args.token;
if (!token) {
  console.error('✗ --token=<ingestToken> est obligatoire (fiche de la balance).');
  process.exit(1);
}

const base = (args.base ?? 'http://localhost:3000').replace(/\/$/, '');
const jours = Number(args.jours ?? 30);
const pasMinutes = Number(args.pas ?? 60);
const nombreOuNull = (v: string | undefined, defaut: number | null) =>
  v === '-' ? null : v === undefined ? defaut : Number(v);

// Par défaut la série se termine AUJOURD'HUI : c'est ce qu'on veut pour une
// démo, et ça évite qu'une balance paraisse muette depuis des semaines.
const debut =
  args.debut ?? new Date(Date.now() - jours * 24 * 3600 * 1000).toISOString().slice(0, 19) + 'Z';

const { points, meteoJour, tare } = simulerRuche({
  debut,
  jours,
  pasMinutes,
  poidsInitialBrut: 42,
  tare: 22,
  essaimageLeJour: nombreOuNull(args.essaimage, Math.floor(jours * 0.37)),
  recolteLeJour: nombreOuNull(args.recolte, Math.floor(jours * 0.8)),
  // Pas de vol par défaut : c'est un scénario qu'on demande explicitement.
  volLeJour: nombreOuNull(args.vol, null),
});

console.log(`Cible      : ${base}`);
console.log(`Série      : ${points.length} points · ${jours} j · 1 mesure/${pasMinutes} min`);
console.log(`Tare       : ${tare} kg (à renseigner sur la fiche pour un poids net juste)`);
console.log(
  `Météo      : ${meteoJour.filter((m) => m === 'beau').length} beaux · ` +
    `${meteoJour.filter((m) => m === 'mitige').length} mitigés · ` +
    `${meteoJour.filter((m) => m === 'pluie').length} pluvieux`,
);
const evts = points.filter((p) => p.evenement);
console.log(
  `Événements : ${evts.length ? evts.map((p) => `${p.ts.slice(0, 10)} ${p.evenement}`).join(' | ') : 'aucun'}`,
);
console.log('');

function habiller(p: PointSimule, i: number): Record<string, unknown> {
  const m = i % 3;
  if (m === 0) return enveloppeBeep(p);
  if (m === 1) return enveloppeTtn(p);
  return enveloppeGrammes(p);
}

const LOT = 120; // la route accepte jusqu'à 500 mesures ; on reste prudent
let recues = 0,
  enregistrees = 0,
  doublons = 0,
  ignorees = 0,
  erreurs = 0;

for (let i = 0; i < points.length; i += LOT) {
  const corps = points.slice(i, i + LOT).map((p, k) => habiller(p, i + k));
  try {
    const r = await fetch(`${base}/api/balances/ingest/${token}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(corps),
    });
    const j = (await r.json()) as Record<string, number | undefined> & { message?: string };
    if (!r.ok) {
      erreurs++;
      console.error(`  ✗ HTTP ${r.status} — ${j.message ?? JSON.stringify(j).slice(0, 160)}`);
      // 404 = token inconnu, 402 = plan insuffisant : inutile d'insister.
      if (r.status === 404 || r.status === 402) break;
    } else {
      recues += j.recues ?? 0;
      enregistrees += j.enregistrees ?? 0;
      doublons += j.doublons ?? 0;
      ignorees += j.ignorees ?? 0;
      process.stdout.write(`\r  envoyé ${Math.min(i + LOT, points.length)}/${points.length}…`);
    }
  } catch (e) {
    erreurs++;
    console.error('\n  ✗ réseau :', (e as Error).message);
  }
}

console.log(
  `\n\nRésultat : reçues=${recues} · enregistrées=${enregistrees} · doublons=${doublons} · ignorées=${ignorees} · erreurs=${erreurs}`,
);
if (erreurs === 0 && enregistrees > 0) {
  console.log('→ Ouvrez la fiche de la balance : courbe, variations et alertes doivent être là.');
}
process.exit(erreurs > 0 ? 1 : 0);
