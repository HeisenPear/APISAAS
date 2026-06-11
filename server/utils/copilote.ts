import type Anthropic from '@anthropic-ai/sdk';
import {
  getRuchers,
  getRuchesSante,
  getInterventionsRecentes,
  getStocks,
  getFinances,
  getAlertes,
  getMeteoRucher,
} from '~~/server/utils/copilote-data';

/**
 * Mode Copilote « avancé » (Claude) — DORMANT par défaut.
 *
 * N'est utilisé que si NUXT_COPILOTE_MODE=claude ET le plan le permet
 * (réservé Expert, cf. route). Réutilise le module copilote-data (mêmes
 * accès lecture seule scopés userId que le moteur local). Coût API à la
 * charge de l'exploitant — d'où l'activation explicite. Le moteur par
 * défaut, gratuit, est copilote-local.ts.
 */

export const COPILOTE_MODEL = 'claude-opus-4-8';
const MAX_ITERATIONS = 6;

const SYSTEM_PROMPT = `Tu es le Copilote APIGO, l'assistant intelligent d'un logiciel français de gestion apicole.
Tu aides un apiculteur à piloter son exploitation en t'appuyant sur SES données réelles, consultées via les outils fournis.

Règles :
- Consulte les outils avant d'affirmer quoi que ce soit sur l'exploitation — n'invente jamais une donnée.
- Si une donnée est absente, dis-le et propose l'action correspondante dans APIGO.
- Réponds en français, clair et concis (l'utilisateur est souvent sur mobile, au rucher). Dates en français, unités métriques, euros.
- Reste dans le domaine apicole, l'exploitation de l'utilisateur, la réglementation apicole française et l'usage d'APIGO. Décline poliment le reste.
- Sanitaire : tu orientes (varroa, force, réserves) mais rappelles qu'un diagnostic relève du vétérinaire/TSA ; les maladies réglementées (loque américaine…) imposent une déclaration DDPP.`;

export const COPILOTE_TOOLS: Anthropic.Tool[] = [
  {
    name: 'etat_ruchers',
    description:
      "Vue d'ensemble des ruchers : nom, commune, nombre de ruches actives. À appeler en premier pour situer l'exploitation.",
    input_schema: { type: 'object', properties: {}, additionalProperties: false },
  },
  {
    name: 'etat_ruches',
    description:
      'État détaillé des ruches : numéro, rucher, statut, dernière visite, jours écoulés, score de santé 0-100. Pour prioriser les visites ou analyser la santé.',
    input_schema: {
      type: 'object',
      properties: { rucherNom: { type: 'string', description: 'Filtrer sur un rucher' } },
      additionalProperties: false,
    },
  },
  {
    name: 'interventions_recentes',
    description:
      'Dernières interventions (visites, traitements, récoltes…) avec date, type, ruche.',
    input_schema: {
      type: 'object',
      properties: { limite: { type: 'integer', description: 'Nombre max (défaut 15, max 30)' } },
      additionalProperties: false,
    },
  },
  {
    name: 'etat_stocks',
    description: "Stocks (miel, matériel, nourrissement, traitements) avec seuils d'alerte.",
    input_schema: { type: 'object', properties: {}, additionalProperties: false },
  },
  {
    name: 'resume_finances',
    description:
      "Résumé financier d'une année : CA des ventes, nombre de factures, impayés, production de miel (kg).",
    input_schema: {
      type: 'object',
      properties: { annee: { type: 'integer', description: 'Année (défaut : en cours)' } },
      additionalProperties: false,
    },
  },
  {
    name: 'alertes_actives',
    description:
      'Alertes actives (visites en retard, santé critique, stocks bas, factures) avec priorité.',
    input_schema: { type: 'object', properties: {}, additionalProperties: false },
  },
  {
    name: 'meteo_rucher',
    description:
      'Prévisions météo 5 jours pour un rucher avec score de conditions de visite 0-100 par jour.',
    input_schema: {
      type: 'object',
      properties: { rucherNom: { type: 'string', description: 'Nom du rucher' } },
      additionalProperties: false,
    },
  },
];

export const TOOL_LABELS: Record<string, string> = {
  etat_ruchers: 'Consulte vos ruchers…',
  etat_ruches: 'Examine vos ruches…',
  interventions_recentes: 'Relit vos interventions…',
  etat_stocks: 'Vérifie vos stocks…',
  resume_finances: 'Analyse vos finances…',
  alertes_actives: 'Passe en revue vos alertes…',
  meteo_rucher: 'Regarde la météo…',
};

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
      erreur: `L'outil ${name} n'a pas pu répondre (${err instanceof Error ? err.message : 'erreur'}).`,
    });
  }
}

function runTool(userId: string, name: string, input: ToolInput): Promise<unknown> {
  switch (name) {
    case 'etat_ruchers':
      return getRuchers(userId);
    case 'etat_ruches':
      return getRuchesSante(userId, input.rucherNom as string | undefined);
    case 'interventions_recentes':
      return getInterventionsRecentes(userId, Number(input.limite) || 15);
    case 'etat_stocks':
      return getStocks(userId);
    case 'resume_finances':
      return getFinances(userId, input.annee ? Number(input.annee) : undefined);
    case 'alertes_actives':
      return getAlertes(userId);
    case 'meteo_rucher':
      return getMeteoRucher(userId, input.rucherNom as string | undefined);
    default:
      return Promise.resolve({ erreur: `Outil inconnu : ${name}` });
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
      output_config: { effort: 'medium' },
      system: SYSTEM_PROMPT,
      tools: COPILOTE_TOOLS,
      messages,
    });

    stream.on('text', (delta) => cb.onText(delta));
    const message = await stream.finalMessage();

    if (message.stop_reason === 'refusal') {
      cb.onText(
        'Je ne peux pas répondre à cette demande. Posez une autre question sur votre exploitation.',
      );
      return;
    }
    if (message.stop_reason !== 'tool_use') return;

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

  cb.onText('\n\n_(Réponse interrompue : trop d’étapes — reposez la question plus précisément.)_');
}
