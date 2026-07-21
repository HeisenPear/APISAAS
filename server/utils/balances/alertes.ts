// ═══════════════════════════════════════════════════════════════════════════
// ALERTES BALANCE — détection (pure) + création dans la table `alertes`.
//
// C'est la raison d'être commerciale d'une balance connectée : la donnée brute
// n'a d'intérêt que si elle prévient. Six règles :
//   balance_essaimage    chute brutale en pleine journée   → sante
//   balance_vol          chute vers ~0 hors récolte        → sante
//   balance_miellee      gain rapide soutenu               → production
//   balance_hausse_pleine seuil de récolte atteint         → production
//   balance_batterie     batterie faible                   → gestion
//   balance_muette       plus de mesure depuis N heures    → gestion
//
// La logique de seuil est PURE (`detecterAlertesBalance`) et testée sans base ;
// tout ce qui touche la DB est isolé plus bas.
// ═══════════════════════════════════════════════════════════════════════════

import { and, eq, gte, inArray, isNull, lte, sql } from 'drizzle-orm';
import { alertes, recoltes } from '~~/server/database/schema';
import type { CategorieNotif } from '~~/server/utils/alertesCategories';
import type { PrioriteAlerte } from '~~/server/utils/alertesPush';
import { versNombre } from './enregistrer';

export type TypeAlerteBalance =
  | 'balance_essaimage'
  | 'balance_vol'
  | 'balance_miellee'
  | 'balance_hausse_pleine'
  | 'balance_batterie'
  | 'balance_muette';

/**
 * ⚠️ À FUSIONNER dans `CATEGORIE_PAR_TYPE` (server/utils/alertesCategories.ts) :
 * ce fichier étant hors du périmètre de ce lot, la table vit ici en attendant.
 * Sans cette fusion, `categorieDeType()` classera ces 6 types en « sante » par
 * défaut — les 4 mal classés ne respecteraient donc pas la préférence de
 * notification choisie par l'utilisateur.
 */
export const CATEGORIES_ALERTES_BALANCE: Record<TypeAlerteBalance, CategorieNotif> = {
  balance_essaimage: 'sante',
  balance_vol: 'sante',
  balance_miellee: 'production',
  balance_hausse_pleine: 'production',
  balance_batterie: 'gestion',
  balance_muette: 'gestion',
};

export const TYPES_ALERTE_BALANCE = Object.keys(CATEGORIES_ALERTES_BALANCE) as TypeAlerteBalance[];

// ─── Seuils ─────────────────────────────────────────────────────────────────

export interface SeuilsBalance {
  /** Chute (kg) entre deux mesures consécutives au-delà de laquelle on suspecte un essaimage. */
  variationKg: number;
  /** Poids net déclenchant « hausse pleine, récolte à prévoir ». `null` = règle désactivée. */
  poidsRecolteKg: number | null;
  /** Batterie faible (%). */
  batteriePct: number;
  /** Silence toléré avant de considérer la balance muette (heures). */
  silenceHeures: number;
}

/**
 * Valeurs par défaut, surchargeables balance par balance.
 * - 1,5 kg : un essaim primaire emporte 1,5 à 3 kg d'abeilles ; en dessous on
 *   confondrait avec l'envol de butineuses par temps chaud.
 * - 12 h : deux relevés manqués sur un capteur à 4-6 h de cadence.
 */
export const SEUILS_BALANCE_DEFAUT: SeuilsBalance = {
  variationKg: 1.5,
  poidsRecolteKg: null,
  batteriePct: 20,
  silenceHeures: 12,
};

/** Gain sur 24 h à partir duquel on parle de miellée. */
export const SEUIL_MIELLEE_KG = 2;
/** Fenêtre horaire (Europe/Paris) des départs d'essaim. */
export const HEURE_ESSAIMAGE_DEBUT = 10;
export const HEURE_ESSAIMAGE_FIN = 17;
/** En dessous de ce poids net, une ruche n'est plus sur la balance. */
export const SEUIL_VOL_POIDS_KG = 5;
/** Chute minimale pour parler de vol (et non d'un capteur qui déraille). */
export const SEUIL_VOL_CHUTE_KG = 10;

export interface SourceSeuils {
  seuilVariationKg?: string | number | null;
  seuilPoidsRecolteKg?: string | number | null;
  seuilBatteriePct?: number | null;
  seuilSilenceHeures?: number | null;
}

/** Seuils effectifs d'une balance (colonnes `decimal` → nombres). */
export function resoudreSeuils(b: SourceSeuils): SeuilsBalance {
  return {
    variationKg: versNombre(b.seuilVariationKg) ?? SEUILS_BALANCE_DEFAUT.variationKg,
    poidsRecolteKg: versNombre(b.seuilPoidsRecolteKg),
    batteriePct: b.seuilBatteriePct ?? SEUILS_BALANCE_DEFAUT.batteriePct,
    silenceHeures: b.seuilSilenceHeures ?? SEUILS_BALANCE_DEFAUT.silenceHeures,
  };
}

// ─── Détection (pure) ───────────────────────────────────────────────────────

export interface ContexteBalance {
  balanceId: string;
  nomBalance: string;
  /** Heure locale Europe/Paris (0-23) de la mesure. */
  heureLocale: number;
  poidsNetKg: number | null;
  variationKg: number | null;
  variation24hKg: number | null;
  batteriePct: number | null;
  /** Une récolte a été enregistrée autour de cette mesure → ni vol ni essaimage. */
  recolteRecente: boolean;
  /** Ancienneté de la dernière mesure au moment du contrôle (heures). `null` = non évalué. */
  heuresDepuisDerniereMesure: number | null;
}

export interface DetectionBalance {
  type: TypeAlerteBalance;
  priorite: PrioriteAlerte;
  titre: string;
  message: string;
}

/** « 2.5 » → « 2,5 » (libellés en français). */
function kg(n: number): string {
  return `${Math.abs(n).toFixed(1).replace('.', ',')} kg`;
}

/**
 * Applique les six règles. Fonction PURE : aucune I/O, l'appelant fournit tout
 * le contexte (dont `recolteRecente` et `heureLocale`, qui demandent une requête
 * et un fuseau horaire).
 */
export function detecterAlertesBalance(
  ctx: ContexteBalance,
  seuils: SeuilsBalance,
): DetectionBalance[] {
  const out: DetectionBalance[] = [];
  const nom = ctx.nomBalance;

  // Chutes exprimées en positif (kg perdus).
  const chute = ctx.variationKg !== null && ctx.variationKg < 0 ? -ctx.variationKg : 0;
  const chute24 = ctx.variation24hKg !== null && ctx.variation24hKg < 0 ? -ctx.variation24hKg : 0;

  // ── Vol : la ruche n'est plus là. Prioritaire sur l'essaimage (une ruche
  // volée n'est pas un essaim) et neutralisé par une récolte récente.
  const vol =
    !ctx.recolteRecente &&
    ctx.poidsNetKg !== null &&
    ctx.poidsNetKg <= SEUIL_VOL_POIDS_KG &&
    Math.max(chute, chute24) >= SEUIL_VOL_CHUTE_KG;

  if (vol) {
    out.push({
      type: 'balance_vol',
      priorite: 'critique',
      titre: `${nom} : disparition de la ruche`,
      message: `Le poids est tombé à ${kg(ctx.poidsNetKg ?? 0)} après une chute de ${kg(
        Math.max(chute, chute24),
      )}, sans récolte enregistrée. Vérifie le rucher au plus vite.`,
    });
  }

  // ── Essaimage : chute brutale, en pleine journée, hors récolte.
  const enJournee =
    ctx.heureLocale >= HEURE_ESSAIMAGE_DEBUT && ctx.heureLocale <= HEURE_ESSAIMAGE_FIN;
  if (!vol && !ctx.recolteRecente && enJournee && chute >= seuils.variationKg) {
    out.push({
      type: 'balance_essaimage',
      priorite: 'haute',
      titre: `${nom} : chute brutale de ${kg(chute)}`,
      message: `Perte de ${kg(chute)} en pleine journée (seuil : ${kg(
        seuils.variationKg,
      )}). Signature classique d'un départ d'essaim — contrôle la colonie.`,
    });
  }

  // ── Miellée en cours.
  if (ctx.variation24hKg !== null && ctx.variation24hKg >= SEUIL_MIELLEE_KG) {
    out.push({
      type: 'balance_miellee',
      priorite: 'basse',
      titre: `${nom} : miellée en cours (+${kg(ctx.variation24hKg)}/24 h)`,
      message: `La colonie a pris ${kg(
        ctx.variation24hKg,
      )} en 24 h. Pense à poser une hausse si ce n'est pas déjà fait.`,
    });
  }

  // ── Hausse pleine : seuil de récolte atteint.
  if (
    seuils.poidsRecolteKg !== null &&
    ctx.poidsNetKg !== null &&
    ctx.poidsNetKg >= seuils.poidsRecolteKg
  ) {
    out.push({
      type: 'balance_hausse_pleine',
      priorite: 'moyenne',
      titre: `${nom} : seuil de récolte atteint`,
      message: `Poids net de ${kg(ctx.poidsNetKg)} (seuil : ${kg(
        seuils.poidsRecolteKg,
      )}). La hausse est prête à être récoltée.`,
    });
  }

  // ── Batterie faible.
  if (ctx.batteriePct !== null && ctx.batteriePct <= seuils.batteriePct) {
    out.push({
      type: 'balance_batterie',
      priorite: ctx.batteriePct <= 5 ? 'haute' : 'moyenne',
      titre: `${nom} : batterie à ${ctx.batteriePct} %`,
      message: `Sous le seuil de ${seuils.batteriePct} %. Prévois le remplacement pour ne pas perdre le suivi.`,
    });
  }

  // ── Balance muette.
  if (
    ctx.heuresDepuisDerniereMesure !== null &&
    ctx.heuresDepuisDerniereMesure >= seuils.silenceHeures
  ) {
    const h = Math.floor(ctx.heuresDepuisDerniereMesure);
    out.push({
      type: 'balance_muette',
      priorite: 'moyenne',
      titre: `${nom} : plus de mesure depuis ${h} h`,
      message: `Aucune donnée reçue depuis ${h} h (seuil : ${seuils.silenceHeures} h). Réseau, batterie ou capteur à vérifier.`,
    });
  }

  return out;
}

/**
 * ANTI-DOUBLON (partie pure) : on ne recrée jamais une alerte d'un type déjà
 * actif (= non résolu) sur cette balance. Sans ça, une balance qui mesure
 * toutes les 15 min produirait 96 alertes « batterie faible » par jour.
 */
export function filtrerNouvelles(
  detections: DetectionBalance[],
  typesDejaActifs: Iterable<string>,
): DetectionBalance[] {
  const actifs = new Set(typesDejaActifs);
  return detections.filter((d) => !actifs.has(d.type));
}

// ─── Persistance ────────────────────────────────────────────────────────────

type AlerteInsert = typeof alertes.$inferInsert;

const FMT_HEURE_PARIS = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'Europe/Paris',
  hour: '2-digit',
  hourCycle: 'h23',
});

/** Heure locale (0-23) d'un instant, fuseau Europe/Paris. */
export function heureParis(d: Date): number {
  const n = Number(FMT_HEURE_PARIS.format(d));
  return Number.isFinite(n) ? n : 12;
}

/** Une détection → une ligne de la table `alertes`. */
export function versAlerte(userId: string, balanceId: string, d: DetectionBalance): AlerteInsert {
  return {
    userId,
    type: d.type,
    titre: d.titre,
    message: d.message,
    priorite: d.priorite,
    referenceType: 'balance',
    referenceId: balanceId,
    actionUrl: `/balances/${balanceId}`,
    lue: false,
  };
}

export interface BalanceAlertable extends SourceSeuils {
  id: string;
  userId: string;
  nom: string;
  statut: string;
  rucheId: string | null;
  rucherId: string | null;
}

export interface MesureAlertable {
  mesureeAt: Date;
  poidsNetKg: number | null;
  variationKg: number | null;
  variation24hKg: number | null;
  batteriePct: number | null;
}

/**
 * Une récolte a-t-elle été saisie autour de cette mesure ? Une récolte fait
 * chuter le poids de plusieurs dizaines de kilos : sans ce garde-fou, chaque
 * récolte déclencherait une fausse alerte « essaimage » ou « vol ».
 * Fenêtre large (48 h avant → 24 h après) car la saisie est souvent différée.
 */
export async function aRecolteRecente(
  balance: Pick<BalanceAlertable, 'userId' | 'rucheId' | 'rucherId'>,
  instant: Date,
): Promise<boolean> {
  const debut = new Date(instant.getTime() - 48 * 3600 * 1000);
  const fin = new Date(instant.getTime() + 24 * 3600 * 1000);
  const portee = balance.rucheId
    ? eq(recoltes.rucheId, balance.rucheId)
    : balance.rucherId
      ? eq(recoltes.rucherId, balance.rucherId)
      : undefined;

  const rows = await withDbRetry(
    () =>
      db
        .select({ n: sql<number>`count(*)::int` })
        .from(recoltes)
        .where(
          and(
            eq(recoltes.userId, balance.userId),
            gte(recoltes.dateRecolte, debut),
            lte(recoltes.dateRecolte, fin),
            portee,
          ),
        ),
    'balances:recolteRecente',
  );
  return (rows[0]?.n ?? 0) > 0;
}

/**
 * Détecte et CRÉE les alertes d'une balance à partir de sa dernière mesure.
 * Anti-doublon : une alerte du même type encore NON RÉSOLUE sur la même balance
 * n'est jamais recréée. Auto-résolution : une mesure qui arrive éteint
 * `balance_muette`, une batterie remontée éteint `balance_batterie`.
 *
 * Retourne les alertes réellement créées (pour un éventuel push immédiat).
 */
export async function evaluerAlertesBalance(
  balance: BalanceAlertable,
  mesure: MesureAlertable,
  opts: { heuresDepuisDerniereMesure?: number | null } = {},
): Promise<AlerteInsert[]> {
  const seuils = resoudreSeuils(balance);
  const recolteRecente = await aRecolteRecente(balance, mesure.mesureeAt);

  const detections = detecterAlertesBalance(
    {
      balanceId: balance.id,
      nomBalance: balance.nom,
      heureLocale: heureParis(mesure.mesureeAt),
      poidsNetKg: mesure.poidsNetKg,
      variationKg: mesure.variationKg,
      variation24hKg: mesure.variation24hKg,
      batteriePct: mesure.batteriePct,
      recolteRecente,
      heuresDepuisDerniereMesure: opts.heuresDepuisDerniereMesure ?? null,
    },
    seuils,
  );

  // Auto-résolution : la balance parle de nouveau ; la batterie est repassée
  // au-dessus du seuil. Sans ça, l'alerte resterait active pour toujours et
  // bloquerait (anti-doublon) une future alerte légitime.
  const aResoudre: TypeAlerteBalance[] = ['balance_muette'];
  if (mesure.batteriePct !== null && mesure.batteriePct > seuils.batteriePct) {
    aResoudre.push('balance_batterie');
  }
  await resoudreAlertesBalance(balance.userId, balance.id, aResoudre);

  if (detections.length === 0) return [];

  const actives = await withDbRetry(
    () =>
      db
        .select({ type: alertes.type })
        .from(alertes)
        .where(
          and(
            eq(alertes.userId, balance.userId),
            eq(alertes.referenceType, 'balance'),
            eq(alertes.referenceId, balance.id),
            isNull(alertes.resolvedAt),
            inArray(
              alertes.type,
              detections.map((d) => d.type),
            ),
          ),
        ),
    'balances:alertesActives',
  );

  const nouvelles = filtrerNouvelles(
    detections,
    actives.map((a) => a.type),
  ).map((d) => versAlerte(balance.userId, balance.id, d));

  if (nouvelles.length === 0) return [];
  await withDbRetry(() => db.insert(alertes).values(nouvelles), 'balances:insertAlertes');
  return nouvelles;
}

/** Marque résolues les alertes actives de ces types pour une balance. */
export async function resoudreAlertesBalance(
  userId: string,
  balanceId: string,
  types: TypeAlerteBalance[],
): Promise<void> {
  if (types.length === 0) return;
  await withDbRetry(
    () =>
      db
        .update(alertes)
        .set({ resolvedAt: new Date(), updatedAt: new Date() })
        .where(
          and(
            eq(alertes.userId, userId),
            eq(alertes.referenceType, 'balance'),
            eq(alertes.referenceId, balanceId),
            isNull(alertes.resolvedAt),
            inArray(alertes.type, types),
          ),
        ),
    'balances:resoudreAlertes',
  );
}

/**
 * Balances devenues MUETTES — à appeler depuis le cron quotidien (aucune mesure
 * n'arrive plus, donc rien ne peut déclencher la détection côté ingestion).
 * Même signature `dejaExiste` que les autres builders (`alertesCore`,
 * `alertesSaison`) pour se brancher tel quel dans `/api/cron/alertes`.
 */
export async function construireAlertesBalancesMuettes(
  userId: string,
  dejaExiste: (type: string, referenceId?: string) => boolean,
  maintenant: Date = new Date(),
): Promise<AlerteInsert[]> {
  const rows = (await withDbRetry(
    () =>
      db.execute(sql`
        SELECT id, nom, derniere_mesure_at, seuil_silence_heures
        FROM balances
        WHERE user_id = ${userId} AND statut = 'active' AND derniere_mesure_at IS NOT NULL
      `),
    'balances:muettes',
  )) as unknown as Array<{
    id: string;
    nom: string;
    derniere_mesure_at: string | Date;
    seuil_silence_heures: number | null;
  }>;

  const out: AlerteInsert[] = [];
  for (const r of rows) {
    if (dejaExiste('balance_muette', r.id)) continue;
    const seuil = r.seuil_silence_heures ?? SEUILS_BALANCE_DEFAUT.silenceHeures;
    const derniere = new Date(r.derniere_mesure_at);
    const heures = (maintenant.getTime() - derniere.getTime()) / 3_600_000;
    if (heures < seuil) continue;
    const [detection] = detecterAlertesBalance(
      {
        balanceId: r.id,
        nomBalance: r.nom,
        heureLocale: heureParis(maintenant),
        poidsNetKg: null,
        variationKg: null,
        variation24hKg: null,
        batteriePct: null,
        recolteRecente: false,
        heuresDepuisDerniereMesure: heures,
      },
      { ...SEUILS_BALANCE_DEFAUT, silenceHeures: seuil },
    );
    if (detection) out.push(versAlerte(userId, r.id, detection));
  }
  return out;
}
