import type { H3Event } from 'h3';

// ═══════════════════════════════════════════════════════════════════════════
// TRAVAIL D'APRÈS-RÉPONSE.
//
// Certaines routes doivent finir un travail secondaire sans le faire payer à
// l'appelant. Le cas qui motive ce module : le webhook d'ingestion des balances,
// appelé par des capteurs LoRa/GSM SUR BATTERIE — chaque milliseconde de
// handshake est du courant consommé, et le capteur n'a que faire du résultat.
//
// Quand la plateforme expose `waitUntil` (c'est le cas du preset Vercel), la
// tâche sort du chemin de réponse. Sinon on l'attend, mais bornée : en
// serverless, une promesse non attendue est tuée dès la réponse envoyée — la
// « laisser tourner » reviendrait à la perdre en silence.
// ═══════════════════════════════════════════════════════════════════════════

/** Plafond d'attente quand la plateforme n'offre pas de `waitUntil`. */
export const PLAFOND_APRES_REPONSE_MS = 2500;

type AvecWaitUntil = { waitUntil?: (p: Promise<unknown>) => void };

/**
 * Exécute `tache` après la réponse si la plateforme le permet, sinon l'attend
 * avec un plafond dur. Ne lève JAMAIS : le travail secondaire ne doit pas
 * pouvoir faire échouer la requête principale.
 */
export async function apresReponse(
  event: H3Event,
  tache: () => Promise<unknown>,
  label: string,
  plafondMs: number = PLAFOND_APRES_REPONSE_MS,
): Promise<void> {
  const echec = (err: unknown) =>
    console.error(`[apresReponse] « ${label} » a échoué`, {
      erreur: err instanceof Error ? err.message : String(err),
    });

  const hote = event as unknown as AvecWaitUntil;
  if (typeof hote.waitUntil === 'function') {
    hote.waitUntil(Promise.resolve().then(tache).catch(echec));
    return;
  }

  // Repli : on attend, mais pas indéfiniment. Un `Promise.race` local plutôt que
  // `dbWatchdog` — ce dernier recycle le pool de connexions, ce qui serait un
  // faux positif violent sur un simple délai réseau côté Web Push.
  let minuteur: ReturnType<typeof setTimeout> | undefined;
  try {
    await Promise.race([
      Promise.resolve().then(tache),
      new Promise<void>((resolve) => {
        minuteur = setTimeout(() => {
          console.warn(
            `[apresReponse] « ${label} » dépasse ${plafondMs} ms — abandon de l'attente`,
          );
          resolve();
        }, plafondMs);
      }),
    ]);
  } catch (err) {
    echec(err);
  } finally {
    if (minuteur) clearTimeout(minuteur);
  }
}
