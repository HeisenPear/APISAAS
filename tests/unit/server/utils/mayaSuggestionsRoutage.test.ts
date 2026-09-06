import { describe, it, expect } from 'vitest';
import { classifier, normaliser } from '~~/server/utils/copilote-local';
import { detecterNavigation } from '~~/server/utils/copilote-actions';

// ═══════════════════════════════════════════════════════════════════════════
// ROUTAGE DES SUGGESTIONS — chaque phrase proposée par Maya (chips cliquables)
// doit re-rentrer dans le moteur et atterrir au BON endroit. Une suggestion qui
// tombe en « inconnu » est un bouton mort : ce banc verrouille l'inventaire.
// (Leçon du banc de compréhension : toujours tester la phrase EXACTE émise.)
// ═══════════════════════════════════════════════════════════════════════════

/** Vérité attendue : intent (Classification.kind='action') OU navigation. */
const CAS: Array<{ phrase: string; attendu: string }> = [
  // Suggestions « données » (intents)
  { phrase: 'Quelles ruches visiter en priorité ?', attendu: 'intent:ruches_visiter' },
  { phrase: 'Fais-moi un point santé', attendu: 'intent:sante' },
  { phrase: 'La météo est-elle favorable ?', attendu: 'intent:meteo' },
  { phrase: 'Résumé de mes finances cette année', attendu: 'intent:finances' },
  { phrase: 'Mes finances de cette année', attendu: 'intent:finances' },
  { phrase: 'Compare 2025 vs 2026', attendu: 'intent:finances' },
  { phrase: 'Mes ruchers', attendu: 'intent:ruchers' },
  { phrase: 'Mes stocks', attendu: 'intent:stocks' },
  // Suggestions « navigation / action »
  { phrase: 'Ouvre une nouvelle vente', attendu: 'nav:vente-nouvelle' },
  { phrase: 'Ouvre un nouvel achat', attendu: 'nav:achat-nouveau' },
  { phrase: 'Ouvre mes stocks', attendu: 'nav:stocks' },
  { phrase: 'Ouvre ma facturation', attendu: 'nav:facturation' },
  { phrase: 'Crée un nouveau rucher', attendu: 'nav:rucher-nouveau' },
];

function router(phrase: string): string {
  const norm = normaliser(phrase);
  const nav = detecterNavigation(norm);
  if (nav) return `nav:${nav.id}`;
  const c = classifier(phrase);
  if (c.kind === 'action') return `intent:${c.intent}`;
  return c.kind;
}

describe('suggestions Maya — routage (zéro bouton mort)', () => {
  for (const cas of CAS) {
    it(`« ${cas.phrase} » → ${cas.attendu}`, () => {
      expect(router(cas.phrase)).toBe(cas.attendu);
    });
  }
});
