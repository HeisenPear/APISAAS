// ═══════════════════════════════════════════════════════════════════════════
// UNITÉ DE POIDS D'UNE BALANCE — apprise à la connexion, puis appliquée.
//
// Le normaliseur devinait l'unité à la MAGNITUDE : au-delà de 1000, des
// grammes. Hypothèse juste tant que la ruche est sur le plateau… et fausse
// exactement quand elle n'y est plus : 0,3 kg envoyé en grammes vaut 300, sous
// le seuil, donc relu 300 kg. L'angle mort tombait pile sur le VOL.
//
// Plutôt que de demander l'unité à l'apiculteur — qui ne la connaît pas
// forcément — on la LIT sur les premiers relevés, quand la ruche est encore
// là et que la lecture est sans ambiguïté. Ensuite elle est mémorisée et
// s'applique quoi qu'il arrive au poids.
//
// Stocké dans `balances.config` (jsonb déjà existant) → aucune migration.
// ═══════════════════════════════════════════════════════════════════════════

import { sql } from 'drizzle-orm';
import { deduireUnitePoids, valeursPoidsBrutes, type UnitePoids } from './normaliser';

/** Clé de `balances.config` portant l'unité. */
export const CLE_UNITE = 'unitePoids';
/** Clé indiquant que l'unité a été DEDUITE et non choisie par l'apiculteur. */
export const CLE_UNITE_APPRISE = 'unitePoidsApprise';

export interface UniteConfig {
  unite: UnitePoids | null;
  /** `true` si déduite automatiquement — l'apiculteur peut donc la corriger. */
  apprise: boolean;
}

/** Lit l'unité mémorisée sur une balance. PURE. */
export function lireUniteConfig(config: unknown): UniteConfig {
  const c = (config ?? {}) as Record<string, unknown>;
  const u = c[CLE_UNITE];
  return {
    unite: u === 'kg' || u === 'g' ? u : null,
    apprise: c[CLE_UNITE_APPRISE] === true,
  };
}

/**
 * Mémorise l'unité sur la balance. Fusion jsonb (`||`) pour ne pas écraser les
 * autres réglages que `config` pourrait porter.
 */
export async function memoriserUnitePoids(
  balanceId: string,
  unite: UnitePoids,
  apprise: boolean,
): Promise<void> {
  await withDbRetry(
    () =>
      db.execute(sql`
        UPDATE balances
        SET config = coalesce(config, '{}'::jsonb)
                     || jsonb_build_object(
                          ${CLE_UNITE}::text, ${unite}::text,
                          ${CLE_UNITE_APPRISE}::text, ${apprise}
                        ),
            updated_at = now()
        WHERE id = ${balanceId}
      `),
    'balances:memoriserUnite',
  );
}

/**
 * Efface l'unité mémorisée : la balance repart en apprentissage automatique au
 * prochain lot reçu.
 */
export async function oublierUnitePoids(balanceId: string): Promise<void> {
  await withDbRetry(
    () =>
      db.execute(sql`
        UPDATE balances
        SET config = coalesce(config, '{}'::jsonb) - ${CLE_UNITE}::text - ${CLE_UNITE_APPRISE}::text,
            updated_at = now()
        WHERE id = ${balanceId}
      `),
    'balances:oublierUnite',
  );
}

/**
 * Unité à appliquer à ce lot, apprise au passage si la balance ne la connaît
 * pas encore.
 *
 * BEST-EFFORT sur l'écriture : si la mémorisation échoue, on applique quand
 * même l'unité déduite au lot courant. Perdre une mesure parce qu'on n'a pas su
 * ranger un réglage serait un mauvais échange.
 */
export async function resoudreUnitePoids(
  balance: { id: string; config: unknown },
  corpsBrut: unknown,
): Promise<UnitePoids | null> {
  const { unite } = lireUniteConfig(balance.config);
  if (unite) return unite;

  const apprise = deduireUnitePoids(valeursPoidsBrutes(corpsBrut));
  if (!apprise) return null;

  try {
    await memoriserUnitePoids(balance.id, apprise, true);
  } catch (err) {
    console.error('[balances/unite] mémorisation échouée', err);
  }
  return apprise;
}
