import { eq, and, isNull } from 'drizzle-orm';
import { z } from 'zod';
import { alertes, ruchers } from '~~/server/database/schema';
import { TACHE_LABEL, type TacheFenetre } from '~~/server/utils/maya-fenetres';

/**
 * Maya — matérialise une fenêtre prédictive en alerte.
 *
 * Déterministe et sûr : on ne fait pas confiance au client pour le `type` ni
 * l'`actionUrl` (reconstruits côté serveur). On vérifie la propriété du rucher
 * et on dédoublonne sur `fenetre_<tache>:rucherId` (mêmes règles que le
 * générateur d'alertes). Gate `copiloteIa` via route-gates.
 *
 * ⚠️ IL MANQUAIT LE CONTRÔLE DE RÔLE. Cette route ÉCRIT dans l'espace du
 * PROPRIÉTAIRE (`requireWorkspace().id` vaut `ownerId`), et elle ne demandait
 * que d'y appartenir. Un membre en `lecture` — dont le contrat dit
 * explicitement « lecture = rien » — pouvait donc poser des alertes chez
 * quelqu'un d'autre.
 *
 * Sa jumelle `copilote.post.ts` porte, elle, le contrôle : « on porte le
 * contrôle de rôle sur l'action elle-même (via rolePeutEcrire) ». Deux routes
 * d'écriture voisines, une seule gardée — la forme exacte des défauts de ce
 * dépôt. `assertCanWrite` partage `resolveWorkspace` (mémoïsé sur l'événement),
 * donc la garde ne coûte aucune requête de plus.
 */
const bodySchema = z.object({
  rucherId: z.string().uuid(),
  tache: z.enum(['controle', 'recolte', 'varroa', 'nourrissement']),
  titre: z.string().min(1).max(160),
  message: z.string().min(1).max(600),
  priorite: z.enum(['basse', 'moyenne', 'haute']),
});

export default defineEventHandler(async (event) => {
  // Poser une alerte de terrain est une écriture du domaine `terrain` :
  // owner, admin, apiculteur et technicien passent ; comptable et lecture non.
  await assertCanWrite(event, 'terrain');
  const user = await requireWorkspace(event);
  const body = bodySchema.parse(await readBody(event));
  const tache = body.tache as TacheFenetre;

  // Propriété : le rucher doit appartenir à l'utilisateur.
  const [rucher] = await db
    .select({ id: ruchers.id })
    .from(ruchers)
    .where(and(eq(ruchers.id, body.rucherId), eq(ruchers.userId, user.id)));
  if (!rucher) notFound('Rucher introuvable');

  const type = `fenetre_${tache}`;

  // Déduplication : une alerte active de même type pour ce rucher existe déjà ?
  const [existante] = await db
    .select({ id: alertes.id })
    .from(alertes)
    .where(
      and(
        eq(alertes.userId, user.id),
        eq(alertes.type, type),
        eq(alertes.referenceId, body.rucherId),
        isNull(alertes.resolvedAt),
      ),
    );
  if (existante) {
    return { data: { created: false, id: existante.id, raison: 'deja_existante' } };
  }

  const [alerte] = await db
    .insert(alertes)
    .values({
      userId: user.id,
      type,
      titre: body.titre,
      message: body.message,
      priorite: body.priorite,
      referenceType: 'rucher',
      referenceId: body.rucherId,
      actionUrl: `/interventions/nouvelle?rucherId=${body.rucherId}&niveau=rucher&from=/copilote/fenetres`,
    })
    .returning({ id: alertes.id });

  return { data: { created: true, id: alerte?.id, tacheLabel: TACHE_LABEL[tache] } };
});
