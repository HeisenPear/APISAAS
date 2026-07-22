import { z } from 'zod';
import type { H3Event } from 'h3';
import { chargerBalance } from '~~/server/utils/balances/acces';
import { parserCsvBalance } from '~~/server/utils/balances/csv';
import { enregistrerMesures } from '~~/server/utils/balances/enregistrer';
import { evaluerAlertesLot } from '~~/server/utils/balances/alertes';
import { deduireUnitePoids } from '~~/server/utils/balances/normaliser';
import { lireUniteConfig, memoriserUnitePoids } from '~~/server/utils/balances/unite';

// 900 ko : le middleware 05.body-size plafonne les routes non-upload à 1 Mo.
// Pour accepter de gros historiques, ajouter `/api/balances` à UPLOAD_PATHS.
const corpsSchema = z.object({
  contenu: z.string().min(1).max(900_000),
  nomFichier: z.string().max(255).optional(),
});

/** Accepte indifféremment un corps JSON `{ contenu }` ou un envoi multipart. */
async function lireFichier(event: H3Event): Promise<{ contenu: string; nomFichier?: string }> {
  const type = getHeader(event, 'content-type') ?? '';
  if (!type.includes('multipart/form-data')) {
    return readValidatedBody(event, corpsSchema.parse);
  }
  const parties = (await readMultipartFormData(event)) ?? [];
  const fichier = parties.find((p) => p.filename) ?? parties.find((p) => p.name === 'contenu');
  if (!fichier) return badRequest('Aucun fichier reçu');
  return corpsSchema.parse({
    contenu: fichier.data.toString('utf-8'),
    nomFichier: fichier.filename,
  });
}

/**
 * POST /api/balances/:id/import — import du CSV exporté depuis le cloud d'une
 * marque fermée (Optibee, Bee2Beep, Label Abeille, API&CO, Capaz). Idempotent :
 * ré-importer le même fichier ne crée aucun doublon.
 */
export default defineEventHandler(async (event) => {
  await requireAuth(event);
  const { ownerId } = await assertCanWrite(event, 'terrain');
  const id = getRouterParam(event, 'id');
  if (!id) return badRequest('ID manquant');
  uuidSchema.parse(id);

  const balance = await chargerBalance(ownerId, id);
  if (!balance) return notFound('Balance introuvable');

  const { contenu, nomFichier } = await lireFichier(event);

  // Unité du fichier : celle déjà connue de la balance, sinon apprise ici.
  let unitePoids = lireUniteConfig(balance.config).unite;
  let parse = parserCsvBalance(contenu, { unitePoids });
  if (!unitePoids) {
    const apprise = deduireUnitePoids(parse.poidsBruts);
    if (apprise) {
      await memoriserUnitePoids(balance.id, apprise, true).catch(() => {});
      unitePoids = apprise;
      // Seul « g » change le résultat : « kg » revient à la déduction par
      // magnitude qu'on vient déjà d'appliquer. On ne relit donc le fichier
      // que dans ce cas.
      if (apprise === 'g') parse = parserCsvBalance(contenu, { unitePoids: apprise });
    }
  }
  if (parse.mesures.length === 0) {
    return {
      data: {
        importees: 0,
        doublons: 0,
        ignorees: parse.ignorees,
        lignesLues: parse.lignesLues,
        separateur: parse.separateur,
        colonnes: parse.colonnes,
        nomFichier: nomFichier ?? null,
        periode: null,
      },
    };
  }

  const res = await enregistrerMesures(balance, parse.mesures, 'csv');

  // On n'alerte que sur la donnée FRAÎCHE du fichier : réimporter un historique
  // de saison passée ne doit pas réveiller six alertes périmées. Le tri par
  // fraîcheur est fait mesure par mesure dans `evaluerAlertesLot`, donc un CSV
  // qui mêle vieilles et récentes alerte bien sur les récentes.
  if (res.enregistrees.length > 0) {
    try {
      await evaluerAlertesLot(balance, res.enregistrees);
    } catch (err) {
      console.error('[balances/import] détection d’alertes échouée', err);
    }
  }

  const dates = parse.mesures.map((m) => m.mesureeAt.getTime());
  return {
    data: {
      importees: res.enregistrees.length,
      doublons: res.doublons,
      ignorees: parse.ignorees,
      lignesLues: parse.lignesLues,
      separateur: parse.separateur,
      colonnes: parse.colonnes,
      nomFichier: nomFichier ?? null,
      periode: {
        debut: new Date(Math.min(...dates)).toISOString(),
        fin: new Date(Math.max(...dates)).toISOString(),
      },
    },
  };
});
