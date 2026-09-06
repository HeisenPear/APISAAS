// ═══════════════════════════════════════════════════════════════════════════
// SIX COPIES DE LA MÊME VÉRITÉ, ET RIEN QUI LES COMPARE.
//
// Le cycle de vie d'un signalement de frelon est écrit six fois :
//
//   1. le type `FrelonStatut`                    (app/config/frelon.ts)
//   2. la liste d'options `FRELON_STATUTS`       (app/config/frelon.ts)
//   3. l'énumération PostgreSQL `frelonStatutEnum` (server/database/schema.ts)
//   4. les quatre clés en dur de `StatsFrelon`   (app/utils/frelon.ts)
//   5. les onglets de filtre                     (app/pages/frelon.vue)
//   6. le `z.enum` réduit du PUT                 (server/api/frelon/[id].put.ts)
//
// Rien ne les compare. L'ORDRE diffère d'ailleurs DÉJÀ entre la liste
// d'affichage (a_verifier, confirme, detruit, rejete) et l'énumération SQL
// (a_verifier, confirme, rejete, detruit) — sans conséquence, mais c'est le
// signe que les deux vivent leur vie.
//
// ─── POURQUOI ÇA COMPTE ICI ────────────────────────────────────────────────
// La péremption a été conçue comme une PROPRIÉTÉ DU TEMPS précisément parce
// qu'un cinquième statut serait dangereux : `estActif()` ne rejette que
// `detruit` et `rejete`, donc tout statut inconnu est compté ACTIF et
// déclenche un bandeau d'alerte de proximité pour un nid réputé disparu.
//
// Ce banc rend ce danger visible : ajouter une valeur d'un seul côté tombe le
// jour même, au lieu de se découvrir sur une carte qui alerte pour rien.
//
// ─── MUTATION QUI DOIT FAIRE ROUGIR ────────────────────────────────────────
// Retirer (ou ajouter) une valeur d'un seul des deux côtés.
// ═══════════════════════════════════════════════════════════════════════════

import { describe, expect, it } from 'vitest';
import { FRELON_STATUTS } from '~~/app/config/frelon';
import { frelonStatutEnum } from '~~/server/database/schema';
import { estActif, statsFrelon } from '~~/app/utils/frelon';

const COTE_ECRAN = FRELON_STATUTS.map((s) => s.value);
const COTE_BASE = frelonStatutEnum.enumValues;

describe('les statuts de frelon ne divergent pas', () => {
  it('GARDE-FOU : les deux sources livrent bien des valeurs', () => {
    // « Le balayage vide » : deux listes vides seraient trivialement égales.
    expect(COTE_ECRAN.length).toBeGreaterThanOrEqual(4);
    expect(COTE_BASE.length).toBeGreaterThanOrEqual(4);
  });

  it('LA RÈGLE : mêmes valeurs des deux côtés', () => {
    // Triées : l'ordre diffère déjà (affichage contre déclaration SQL) et ce
    // n'est pas un défaut — c'est le CONTENU qui doit coïncider.
    expect([...COTE_ECRAN].sort()).toEqual([...COTE_BASE].sort());
  });

  it('chaque statut porte un libellé et une couleur', () => {
    // Un statut sans libellé s'affiche sous son identifiant technique — « le
    // refus est une phrase, jamais un identifiant » vaut aussi pour un badge.
    for (const s of FRELON_STATUTS) {
      expect(s.label.length, `${s.value} doit avoir un libellé`).toBeGreaterThan(2);
      expect(s.label, `${s.value} ne doit pas afficher son identifiant`).not.toBe(s.value);
      expect(s.couleur, `${s.value} doit avoir une couleur`).toMatch(/^#[0-9a-f]{6}$/i);
    }
  });

  it('chaque statut connu est classé actif OU inactif, jamais par défaut', () => {
    // `estActif` est une liste NOIRE (`!== detruit && !== rejete`) : elle
    // classe l'inconnu comme actif. Tant que les statuts sont ces quatre-là,
    // c'est exact — ce cas le vérifie, et il tombera le jour où on en ajoute un.
    const attendu: Record<string, boolean> = {
      a_verifier: true,
      confirme: true,
      rejete: false,
      detruit: false,
    };
    for (const v of COTE_ECRAN) {
      expect(Object.keys(attendu), `statut non classé : ${v}`).toContain(v);
      expect(estActif(v), `${v}`).toBe(attendu[v]);
    }
  });

  it('le compteur connaît une clé par statut', () => {
    // `StatsFrelon` a quatre clés en dur. Un cinquième statut y tomberait dans
    // une clé fantôme — sans casser l'affichage, mais sans être compté.
    const un = Object.fromEntries(COTE_ECRAN.map((v) => [v, 0]));
    const s = statsFrelon(COTE_ECRAN.map((statut) => ({ statut })));
    for (const v of COTE_ECRAN) {
      expect(
        (s as unknown as Record<string, number>)[v],
        `« ${v} » n’est compté nulle part dans statsFrelon`,
      ).toBe(1);
    }
    expect(Object.keys(un).length).toBe(COTE_ECRAN.length);
    expect(s.total).toBe(COTE_ECRAN.length);
  });
});
