// ═══════════════════════════════════════════════════════════════════════════
// LE DERNIER MÈTRE — l'écriture de Maya atteint-elle VRAIMENT le reste de
// l'application ?
//
// ⚠️ CE BANC EST COMPORTEMENTAL, ET C'EST TOUT SON INTÉRÊT.
//
// La version précédente cherchait `estEvenementDonnees(` dans la source de
// `useCopilote.ts`. CLAUDE.md appelle ça « le mot au lieu de l'appel », et ce
// dépôt s'est déjà fait avoir : la chaîne survit dans l'`import` même quand
// l'appel disparaît. Ici, on branche le VRAI bus, on pousse un VRAI flux SSE,
// et on regarde ce qui arrive chez l'abonné — c'est-à-dire chez la liste des
// ruchers, la jauge de plan et la barre latérale.
//
// Le défaut gardé : Maya écrit côté serveur, sans repasser par les composables
// de domaine qui, eux, émettent sur le bus. Elle était le SEUL producteur
// d'écritures du dépôt à ne rien invalider. L'apiculteur sur /ruchers dictait
// « ajoute une ruche » et la carte du rucher gardait son ancien compte.
// ═══════════════════════════════════════════════════════════════════════════

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getCurrentInstance, onUnmounted, ref } from 'vue';
import { useDataBus } from '../../../../app/composables/useDataBus';
import { useCopilote } from '../../../../app/composables/useCopilote';
import type { DataEvent } from '../../../../app/config/evenements-donnees';

/** Ce que le faux serveur renverra, une trame SSE par entrée. */
let tramesDuServeur: Record<string, unknown>[];
/** Ce que le bus a réellement reçu. */
let recus: DataEvent[];
/** Les désabonnements à passer en fin de cas. */
let coupures: (() => void)[];

/** Fabrique un corps de réponse SSE à partir des trames. */
function corpsSse(trames: Record<string, unknown>[]): ReadableStream<Uint8Array> {
  const encodeur = new TextEncoder();
  return new ReadableStream({
    start(controller) {
      for (const t of trames) {
        controller.enqueue(encodeur.encode(`data: ${JSON.stringify(t)}\n\n`));
      }
      controller.close();
    },
  });
}

/**
 * S'abonne à TOUS les événements que ce banc peut voir passer.
 *
 * ⚠️ ON S'ABONNE LARGEMENT, ET C'EST DÉLIBÉRÉ. S'abonner exactement à ce qu'on
 * attend rendrait le banc incapable de voir une émission FAUSSE — il ne dirait
 * que « l'attendu est arrivé », jamais « autre chose est arrivé en plus ».
 */
function ecouter(evenements: DataEvent[]): void {
  const { on } = useDataBus();
  for (const e of evenements) {
    coupures.push(on(e, () => recus.push(e)));
  }
}

const TOUS_LES_ATTENDUS: DataEvent[] = [
  'ruche:created',
  'ruche:updated',
  'ruche:deleted',
  'rucher:created',
  'rucher:updated',
  'intervention:created',
  'intervention:deleted',
  'client:created',
  'client:deleted',
  'vente:created',
  'achat:created',
  'stock:mouvement',
  'stock:updated',
  'alerte:created',
];

beforeEach(() => {
  tramesDuServeur = [];
  recus = [];
  coupures = [];
  sessionStorage.clear();

  // Les composables résolvent leurs dépendances par auto-import Nuxt : sous
  // Vitest ce sont des identifiants libres, donc des globales. On câble le VRAI
  // bus — on veut l'intégration, pas un double qui confirmerait ce qu'il reçoit.
  vi.stubGlobal('ref', ref);
  vi.stubGlobal('getCurrentInstance', getCurrentInstance);
  vi.stubGlobal('onUnmounted', onUnmounted);
  vi.stubGlobal('useDataBus', useDataBus);
  vi.stubGlobal('navigateTo', vi.fn());
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => ({ ok: true, body: corpsSse(tramesDuServeur) }) as unknown as Response),
  );
});

afterEach(() => {
  coupures.forEach((c) => c());
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

/** Joue un tour complet et rend ce que le bus a reçu. */
async function tour(trames: Record<string, unknown>[]): Promise<DataEvent[]> {
  tramesDuServeur = [...trames, { type: 'done' }];
  ecouter(TOUS_LES_ATTENDUS);
  const copilote = useCopilote();
  await copilote.envoyer('ajoute une ruche');
  return recus;
}

// ═══════════════════════════════════════════════════════════════════════════
// 1. Le garde-fou
// ═══════════════════════════════════════════════════════════════════════════

describe('garde-fou : le harnais voit bien passer les événements', () => {
  it('un abonné reçoit ce que le bus émet', () => {
    // Sans ce cas, un bus muet (un `emit` cassé, un abonnement qui ne prend
    // pas) rendrait TOUS les cas suivants vacuement verts : « rien reçu, rien
    // attendu ». C'est la forme « le balayage vide » de CLAUDE.md.
    ecouter(['ruche:created']);
    useDataBus().emit('ruche:created');
    expect(recus).toEqual(['ruche:created']);
  });

  it('le faux serveur produit bien un flux lisible', async () => {
    const copilote = useCopilote();
    tramesDuServeur = [{ type: 'text', delta: 'Bonjour' }, { type: 'done' }];
    await copilote.envoyer('salut');
    expect(copilote.messages.value.at(-1)?.content).toBe('Bonjour');
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 2. Une écriture de Maya se répercute
// ═══════════════════════════════════════════════════════════════════════════

describe('ce que le serveur invalide arrive sur le bus', () => {
  it('« ajoute une ruche » réveille les écrans du cheptel', async () => {
    const vus = await tour([
      { type: 'text', delta: 'C’est noté.' },
      { type: 'invalider', evenements: ['ruche:created', 'rucher:updated'] },
    ]);
    expect(vus).toContain('ruche:created');
    expect(vus).toContain('rucher:updated');
  });

  it('transmet TOUS les événements, pas seulement le premier', async () => {
    // Piège concret : une boucle qui `break` au premier, ou un `emit` unique.
    // Une division crée une intervention ET une ruche ; n'en émettre qu'un
    // laisse la ruche née d'une dictée invisible de la jauge de plan.
    const vus = await tour([
      { type: 'invalider', evenements: ['intervention:created', 'ruche:created'] },
    ]);
    expect(vus.sort()).toEqual(['intervention:created', 'ruche:created']);
  });

  it('n’émet RIEN quand le serveur n’invalide rien', async () => {
    // Une question sans écriture (« combien de ruches ai-je ? ») ne doit faire
    // recharger aucune liste : le rechargement gratuit fait clignoter l'écran
    // et coûte une requête par abonné.
    const vus = await tour([{ type: 'text', delta: 'Tu as 12 ruches.' }]);
    expect(vus).toEqual([]);
  });

  it('IGNORE un nom d’événement inconnu, et le dit', async () => {
    // ⚠️ `emit` sur une clé inconnue est un NO-OP PARFAIT : pas d'erreur, pas
    // de rafraîchissement, rien dans les journaux. Une faute de frappe côté
    // serveur serait donc indétectable en production. On exige une trace.
    const avertir = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const vus = await tour([{ type: 'invalider', evenements: ['ruche:cree', 'ruche:created'] }]);
    expect(vus).toEqual(['ruche:created']);
    expect(avertir).toHaveBeenCalledWith(expect.stringContaining('inconnu'), 'ruche:cree');
  });

  it('survit à une valeur qui n’est même pas une chaîne', async () => {
    // Le flux SSE est du JSON : rien ne garantit à l'exécution que c'est bien
    // un tableau de chaînes. Un `null` ou un nombre ne doit pas faire tomber
    // le tour entier — la réponse de Maya, elle, est déjà affichée.
    const avertir = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const vus = await tour([
      { type: 'invalider', evenements: [42, null, 'ruche:created'] },
      { type: 'text', delta: 'suite' },
    ]);
    expect(vus).toEqual(['ruche:created']);
    avertir.mockRestore();
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 3. L'annulation aussi
// ═══════════════════════════════════════════════════════════════════════════

describe('« Annuler » se répercute comme l’écriture', () => {
  it('l’annulation d’une ruche retire la ruche des écrans', async () => {
    // Un écran en retard sur une écriture est gênant ; un écran qui GARDE une
    // ligne supprimée après « c'est annulé » est pire que l'inaction —
    // l'apiculteur ne sait plus laquelle des deux croire.
    const vus = await tour([
      { type: 'text', delta: 'C’est annulé.' },
      { type: 'invalider', evenements: ['ruche:deleted'] },
    ]);
    expect(vus).toEqual(['ruche:deleted']);
  });
});
