import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import icones from '@iconify-json/lucide/icons.json';

/**
 * TOUTES les icônes `i-lucide-…` du code doivent exister dans la collection.
 *
 * Le bundle d'icônes tourne en mode `local` (nuxt.config) : rien n'est
 * téléchargé au runtime. Un nom absent ne provoque donc aucune erreur — il
 * affiche un VIDE, en production, sans que rien ne le signale. Typecheck, lint
 * et build passent tous les trois.
 *
 * Trouvé en vrai : `i-lucide-bee` (inexistant) sur le bandeau de bienvenue, le
 * tout premier écran d'un nouvel inscrit ; et `i-lucide-arrow-top-right-on-square`
 * — un nom heroicons porté par le préfixe lucide — sur la navigation mobile du
 * site public. Seule une ligne de journal du serveur de dev les trahissait.
 */
const RACINES = ['app', 'server'];
const EXTENSIONS = /\.(vue|ts)$/;

function fichiers(dossier: string): string[] {
  const out: string[] = [];
  for (const e of readdirSync(dossier, { withFileTypes: true })) {
    const p = join(dossier, e.name);
    if (e.isDirectory()) out.push(...fichiers(p));
    else if (EXTENSIONS.test(e.name)) out.push(p);
  }
  return out;
}

describe('icônes lucide', () => {
  const racine = resolve(__dirname, '../../../..');
  const disponibles = new Set([
    ...Object.keys((icones as { icons?: Record<string, unknown> }).icons ?? {}),
    ...Object.keys((icones as { aliases?: Record<string, unknown> }).aliases ?? {}),
  ]);

  /** Chaque nom référencé → les fichiers qui l'emploient (pour un échec lisible). */
  const references = new Map<string, string[]>();
  for (const dossier of RACINES) {
    for (const f of fichiers(join(racine, dossier))) {
      const src = readFileSync(f, 'utf8');
      for (const m of src.matchAll(/i-lucide-([a-z0-9-]+)/g)) {
        const nom = m[1]!;
        const liste = references.get(nom) ?? [];
        const relatif = f.slice(racine.length + 1);
        if (!liste.includes(relatif)) liste.push(relatif);
        references.set(nom, liste);
      }
    }
  }

  it('la collection locale est bien chargée', () => {
    // Filet : si l'import venait à rendre un objet vide, le banc passerait en
    // déclarant « aucune icône manquante » — et ne protègerait plus rien.
    expect(disponibles.size).toBeGreaterThan(1000);
    expect(references.size).toBeGreaterThan(50);
  });

  it('n’en référence aucune qui n’existe pas', () => {
    const manquantes = [...references.entries()]
      .filter(([nom]) => !disponibles.has(nom))
      .map(([nom, fs]) => `i-lucide-${nom} (${fs.join(', ')})`);
    expect(manquantes).toEqual([]);
  });
});
