import type Anthropic from '@anthropic-ai/sdk';
import { eq, and, desc, gte, sql, isNull } from 'drizzle-orm';
import {
  ruchers,
  ruches,
  interventions,
  stocks,
  transactions,
  alertes,
  recoltes,
} from '~~/server/database/schema';
import { computeScore } from '~~/server/utils/santeScore';
import { scoreVisite, wmo } from '~~/server/utils/meteo';

/**
 * Copilote APIGO — boucle agentique côté serveur.
 *
 * Le modèle n'accède JAMAIS à la base : il appelle des outils en lecture
 * seule, tous scopés sur le userId de la session. Les réponses sont
 * streamées (callbacks onText/onTool) vers la route SSE.
 */

export const COPILOTE_MODEL = 'claude-opus-4-8';
const MAX_ITERATIONS = 6;

const SYSTEM_PROMPT = `Tu es le Copilote APIGO, l'assistant intelligent d'un logiciel français de gestion apicole.
Tu aides un apiculteur ou une apicultrice à piloter son exploitation en t'appuyant sur SES données réelles, que tu consultes via les outils fournis.

Règles :
- Consulte les outils avant d'affirmer quoi que ce soit sur l'exploitation — n'invente jamais une donnée.
- Si une donnée est absente (aucune ruche, aucun stock…), dis-le simplement et propose l'action correspondante dans APIGO.
- Réponds en français, de façon claire et directe. Utilise des listes quand ça aide. Dates au format français, unités métriques, montants en euros.
- Reste dans le domaine : apiculture, exploitation de l'utilisateur, réglementation apicole française, utilisation d'APIGO. Décline poliment le reste.
- Santé des colonies : tu peux orienter (varroa, force, réserves) mais rappelle qu'un diagnostic sanitaire relève du vétérinaire ou du TSA ; les maladies réglementées (loque américaine, etc.) imposent une déclaration à la DDPP.
- Sois concis : l'utilisateur est souvent sur mobile, au rucher.`;

// ─── Définition des outils ───────────────────────────────────────────────────

export const COPILOTE_TOOLS: Anthropic.Tool[] = [
  {
    name: 'etat_ruchers',
    description:
      "Vue d'ensemble des ruchers de l'utilisateur : nom, commune, nombre de ruches actives. À appeler en premier pour situer l'exploitation.",
    input_schema: { type: 'object', properties: {}, additionalProperties: false },
  },
  {
    name: 'etat_ruches',
    description:
      'État détaillé des ruches : numéro, rucher, statut, date de la dernière visite de contrôle, jours écoulés depuis, score de santé 0-100 (basé sur force, couvain, réserves, varroa). Utiliser pour prioriser les visites ou analyser une ruche.',
    input_schema: {
      type: 'object',
      properties: {
        rucherNom: { type: 'string', description: 'Filtrer sur un rucher (nom exact ou partiel)' },
      },
      additionalProperties: false,
    },
  },
  {
    name: 'interventions_recentes',
    description:
      'Dernières interventions enregistrées (visites, traitements, nourrissements, récoltes…) avec date, type et ruche concernée.',
    input_schema: {
      type: 'object',
      properties: {
        limite: { type: 'integer', description: 'Nombre max (défaut 15, max 30)' },
      },
      additionalProperties: false,
    },
  },
  {
    name: 'etat_stocks',
    description:
      "Stocks de l'exploitation (miel, matériel, nourrissement, traitements) : quantités, unités, seuils d'alerte et articles sous le seuil.",
    input_schema: { type: 'object', properties: {}, additionalProperties: false },
  },
  {
    name: 'resume_finances',
    description:
      "Résumé financier d'une année : chiffre d'affaires des ventes, nombre de factures, factures en retard de paiement et montant impayé, production de miel récoltée (kg).",
    input_schema: {
      type: 'object',
      properties: {
        annee: { type: 'integer', description: 'Année (défaut : année en cours)' },
      },
      additionalProperties: false,
    },
  },
  {
    name: 'alertes_actives',
    description:
      "Alertes actives de l'exploitation (visites en retard, santé critique, stocks bas, factures en retard) avec priorité.",
    input_schema: { type: 'object', properties: {}, additionalProperties: false },
  },
  {
    name: 'meteo_rucher',
    description:
      'Prévisions météo 5 jours pour un rucher (température, pluie, vent) avec un score de conditions de visite 0-100 par jour. Utiliser pour planifier les visites.',
    input_schema: {
      type: 'object',
      properties: {
        rucherNom: { type: 'string', description: 'Nom du rucher (exact ou partiel)' },
      },
      additionalProperties: false,
    },
  },
];

/** Libellés affichés dans le chat pendant que l'outil tourne */
export const TOOL_LABELS: Record<string, string> = {
  etat_ruchers: 'Consulte vos ruchers…',
  etat_ruches: 'Examine vos ruches…',
  interventions_recentes: 'Relit vos interventions…',
  etat_stocks: 'Vérifie vos stocks…',
  resume_finances: 'Analyse vos finances…',
  alertes_actives: 'Passe en revue vos alertes…',
  meteo_rucher: 'Regarde la météo…',
};

// ─── Exécution des outils (lecture seule, scopée userId) ────────────────────

type ToolInput = Record<string, unknown>;

export async function executeCopiloteTool(
  userId: string,
  name: string,
  input: ToolInput,
): Promise<string> {
  try {
    const result = await dbWatchdog(runTool(userId, name, input), `copilote:${name}`, 10_000);
    return JSON.stringify(result);
  } catch (err) {
    return JSON.stringify({
      erreur: `L'outil ${name} n'a pas pu répondre (${err instanceof Error ? err.message : 'erreur inconnue'}). Réponds avec les informations déjà obtenues.`,
    });
  }
}

async function runTool(userId: string, name: string, input: ToolInput): Promise<unknown> {
  switch (name) {
    case 'etat_ruchers': {
      const rows = await db
        .select({
          nom: ruchers.nom,
          commune: ruchers.commune,
          nbRuchesActives: sql<number>`(select count(*)::int from ruches r where r.rucher_id = ${ruchers.id} and r.statut = 'active')`,
        })
        .from(ruchers)
        .where(eq(ruchers.userId, userId));
      return { ruchers: rows, total: rows.length };
    }

    case 'etat_ruches': {
      const rows = (await db.execute(sql`
        SELECT r.numero, rc.nom AS rucher, r.statut, r.qualite_reine,
          li.date_visite, li.force_colonie, li.couvain, li.reserves,
          li.reine_vue, li.varroa, li.comportement, li.signe_essaimage, li.maladie_observee
        FROM ruches r
        JOIN ruchers rc ON rc.id = r.rucher_id
        LEFT JOIN LATERAL (
          SELECT i.date_visite,
            COALESCE((i.donnees->>'force_colonie')::int, i.force_colonie) AS force_colonie,
            CASE WHEN i.donnees->>'reine_vue' IS NOT NULL THEN (i.donnees->>'reine_vue')::bool ELSE i.reine_vue END AS reine_vue,
            CASE WHEN i.donnees->>'couvain_present' IS NOT NULL THEN CASE WHEN (i.donnees->>'couvain_present')::bool THEN 4 ELSE 1 END ELSE i.couvain END AS couvain,
            CASE WHEN i.donnees->>'reserves_presentes' IS NOT NULL THEN CASE WHEN (i.donnees->>'reserves_presentes')::bool THEN 4 ELSE 1 END ELSE i.reserves END AS reserves,
            COALESCE(i.donnees->>'comportement', i.comportement) AS comportement,
            i.varroa, i.signe_essaimage, i.maladie_observee
          FROM interventions i
          WHERE i.ruche_id = r.id AND i.type = 'controle'
          ORDER BY i.date_visite DESC LIMIT 1
        ) li ON true
        WHERE r.user_id = ${userId} AND r.statut != 'vendue'
        ORDER BY rc.nom, r.numero
        LIMIT 200
      `)) as unknown as Array<{
        numero: string;
        rucher: string;
        statut: string;
        qualite_reine: string | null;
        date_visite: string | null;
        force_colonie: number | null;
        couvain: number | null;
        reserves: number | null;
        reine_vue: boolean | null;
        varroa: number | null;
        comportement: string | null;
        signe_essaimage: boolean | null;
        maladie_observee: string | null;
      }>;

      const filtre = typeof input.rucherNom === 'string' ? input.rucherNom.toLowerCase() : null;
      const ruchesOut = rows
        .filter((r) => !filtre || r.rucher.toLowerCase().includes(filtre))
        .map((r) => {
          const score = computeScore({
            rucheId: '',
            numero: r.numero,
            rucherId: '',
            statut: r.statut,
            qualiteReine: r.qualite_reine,
            dateVisite: r.date_visite,
            forceColonie: r.force_colonie,
            couvain: r.couvain,
            reserves: r.reserves,
            reineVue: r.reine_vue,
            varroa: r.varroa,
            comportement: r.comportement,
            signeEssaimage: r.signe_essaimage,
            maladieObservee: r.maladie_observee,
          });
          const jours = r.date_visite
            ? Math.floor((Date.now() - new Date(r.date_visite).getTime()) / 86400000)
            : null;
          return {
            numero: r.numero,
            rucher: r.rucher,
            statut: r.statut,
            scoreSante: score,
            derniereVisite: r.date_visite?.slice(0, 10) ?? null,
            joursDepuisVisite: jours,
            varroa: r.varroa,
            maladieObservee: r.maladie_observee,
          };
        });
      return { ruches: ruchesOut, total: ruchesOut.length };
    }

    case 'interventions_recentes': {
      const limite = Math.min(Math.max(Number(input.limite) || 15, 1), 30);
      const rows = await db
        .select({
          date: interventions.dateVisite,
          type: interventions.type,
          rucheNumero: ruches.numero,
          notes: interventions.notes,
        })
        .from(interventions)
        .leftJoin(ruches, eq(interventions.rucheId, ruches.id))
        .where(eq(interventions.userId, userId))
        .orderBy(desc(interventions.dateVisite))
        .limit(limite);
      return {
        interventions: rows.map((r) => ({
          date: r.date instanceof Date ? r.date.toISOString().slice(0, 10) : r.date,
          type: r.type,
          ruche: r.rucheNumero,
          notes: r.notes ? String(r.notes).slice(0, 200) : null,
        })),
      };
    }

    case 'etat_stocks': {
      const rows = await db
        .select({
          nom: stocks.nom,
          categorie: stocks.categorie,
          quantite: stocks.quantite,
          unite: stocks.unite,
          seuilAlerte: stocks.seuilAlerte,
        })
        .from(stocks)
        .where(eq(stocks.userId, userId))
        .limit(100);
      return {
        stocks: rows.map((s) => ({
          ...s,
          sousLeSeuil:
            s.seuilAlerte != null && s.quantite != null
              ? Number(s.quantite) <= Number(s.seuilAlerte)
              : false,
        })),
      };
    }

    case 'resume_finances': {
      const annee = Number(input.annee) || new Date().getFullYear();
      const debut = new Date(`${annee}-01-01T00:00:00Z`);
      const fin = new Date(`${annee + 1}-01-01T00:00:00Z`);
      const [ventes] = await db
        .select({
          ca: sql<number>`coalesce(sum(${transactions.total}::numeric), 0)::float`,
          nb: sql<number>`count(*)::int`,
        })
        .from(transactions)
        .where(
          and(
            eq(transactions.userId, userId),
            eq(transactions.type, 'vente'),
            gte(transactions.dateTransaction, debut),
            sql`${transactions.dateTransaction} < ${fin}`,
          ),
        );
      const [impayes] = await db
        .select({
          nb: sql<number>`count(*)::int`,
          montant: sql<number>`coalesce(sum(${transactions.total}::numeric), 0)::float`,
        })
        .from(transactions)
        .where(
          and(
            eq(transactions.userId, userId),
            eq(transactions.type, 'vente'),
            eq(transactions.statut, 'envoyee'),
            sql`${transactions.dateEcheance} < now()`,
          ),
        );
      const [prod] = await db
        .select({
          kg: sql<number>`coalesce(sum(${recoltes.quantiteKg}::numeric), 0)::float`,
        })
        .from(recoltes)
        .where(
          and(
            eq(recoltes.userId, userId),
            gte(recoltes.dateRecolte, debut),
            sql`${recoltes.dateRecolte} < ${fin}`,
          ),
        );
      return {
        annee,
        caVentesEuros: ventes?.ca ?? 0,
        nbVentes: ventes?.nb ?? 0,
        facturesEnRetard: impayes?.nb ?? 0,
        montantImpayeEuros: impayes?.montant ?? 0,
        productionMielKg: prod?.kg ?? 0,
      };
    }

    case 'alertes_actives': {
      const rows = await db
        .select({
          type: alertes.type,
          titre: alertes.titre,
          message: alertes.message,
          priorite: alertes.priorite,
        })
        .from(alertes)
        .where(and(eq(alertes.userId, userId), isNull(alertes.resolvedAt), eq(alertes.lue, false)))
        .orderBy(desc(alertes.createdAt))
        .limit(20);
      return { alertes: rows, total: rows.length };
    }

    case 'meteo_rucher': {
      const tous = await db
        .select({
          nom: ruchers.nom,
          latitude: ruchers.latitude,
          longitude: ruchers.longitude,
        })
        .from(ruchers)
        .where(eq(ruchers.userId, userId));
      const filtre = typeof input.rucherNom === 'string' ? input.rucherNom.toLowerCase() : null;
      const rucher =
        (filtre ? tous.find((r) => r.nom.toLowerCase().includes(filtre)) : tous[0]) ?? null;
      if (!rucher) return { erreur: 'Aucun rucher trouvé.' };
      if (!rucher.latitude || !rucher.longitude)
        return { erreur: `Le rucher ${rucher.nom} n'a pas de coordonnées GPS.` };

      const url = `https://api.open-meteo.com/v1/forecast?latitude=${rucher.latitude}&longitude=${rucher.longitude}&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,wind_speed_10m_max&timezone=Europe%2FParis&forecast_days=5`;
      const meteo = (await $fetch(url, { timeout: 8000 })) as {
        daily: {
          time: string[];
          weather_code: number[];
          temperature_2m_max: number[];
          temperature_2m_min: number[];
          precipitation_sum: number[];
          wind_speed_10m_max: number[];
        };
      };
      const jours = meteo.daily.time.map((date, i) => ({
        date,
        conditions: wmo(meteo.daily.weather_code[i] ?? 0).label,
        tempMax: meteo.daily.temperature_2m_max[i],
        tempMin: meteo.daily.temperature_2m_min[i],
        pluieMm: meteo.daily.precipitation_sum[i],
        ventMaxKmh: meteo.daily.wind_speed_10m_max[i],
        scoreVisite: scoreVisite(
          meteo.daily.temperature_2m_max[i] ?? 0,
          meteo.daily.precipitation_sum[i] ?? 0,
          meteo.daily.wind_speed_10m_max[i] ?? 0,
          meteo.daily.weather_code[i] ?? 0,
        ),
      }));
      return { rucher: rucher.nom, previsions: jours };
    }

    default:
      return { erreur: `Outil inconnu : ${name}` };
  }
}

// ─── Boucle agentique streamée ───────────────────────────────────────────────

export interface CopiloteCallbacks {
  onText: (delta: string) => void;
  onTool: (name: string, label: string) => void;
}

export async function runCopilote(
  client: Anthropic,
  userId: string,
  history: Anthropic.MessageParam[],
  cb: CopiloteCallbacks,
): Promise<void> {
  const messages: Anthropic.MessageParam[] = [...history];

  for (let i = 0; i < MAX_ITERATIONS; i++) {
    const stream = client.messages.stream({
      model: COPILOTE_MODEL,
      max_tokens: 8000,
      thinking: { type: 'adaptive' },
      // 'medium' : bon équilibre qualité/latence pour un chat interactif
      output_config: { effort: 'medium' },
      system: SYSTEM_PROMPT,
      tools: COPILOTE_TOOLS,
      messages,
    });

    stream.on('text', (delta) => cb.onText(delta));

    const message = await stream.finalMessage();

    if (message.stop_reason === 'refusal') {
      cb.onText(
        'Je ne peux pas répondre à cette demande. Reformulez ou posez une autre question sur votre exploitation.',
      );
      return;
    }

    if (message.stop_reason !== 'tool_use') return; // end_turn / max_tokens → terminé

    const toolUses = message.content.filter(
      (b): b is Anthropic.ToolUseBlock => b.type === 'tool_use',
    );
    messages.push({ role: 'assistant', content: message.content });

    const results: Anthropic.ToolResultBlockParam[] = [];
    for (const tu of toolUses) {
      cb.onTool(tu.name, TOOL_LABELS[tu.name] ?? `Utilise ${tu.name}…`);
      const out = await executeCopiloteTool(userId, tu.name, (tu.input ?? {}) as ToolInput);
      results.push({ type: 'tool_result', tool_use_id: tu.id, content: out });
    }
    messages.push({ role: 'user', content: results });
  }

  cb.onText(
    '\n\n_(Réponse interrompue : trop d’étapes — reposez la question de façon plus ciblée.)_',
  );
}
