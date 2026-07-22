// ═══════════════════════════════════════════════════════════════════════════
// IMPORT CSV — la voie de secours des marques à cloud FERMÉ.
//
// Optibee, Bee2Beep, Label Abeille, API&CO, Capaz n'exposent AUCUNE API
// publique : leurs clients ne peuvent sortir leurs données que par le bouton
// « exporter » de leur appli. Sans ce parseur, ces apiculteurs — la majorité du
// marché français — n'auraient tout simplement rien dans APIGO.
//
// Aucune dépendance ajoutée : tokeniseur maison (guillemets, `,` et `;`, BOM
// UTF-8, CRLF), détection automatique des colonnes via la table de
// correspondance du normaliseur, dates FR (JJ/MM/AAAA) et ISO.
// Fonctions PURES, testables.
// ═══════════════════════════════════════════════════════════════════════════

import {
  champPourCle,
  estCleHorodatage,
  normaliserCle,
  normaliserPayload,
  valeursPoidsBrutes,
  type ChampMesure,
  type MesureNormalisee,
  type OptionsNormalisation,
} from './normaliser';

/** Plafond d'un import : au-delà, la recomputation SQL des variations risque le timeout. */
export const MAX_LIGNES_CSV = 20_000;

const SEPARATEURS_CANDIDATS = [';', ',', '\t', '|'] as const;

/** Colonnes reconnues comme « heure seule », à recoller à une colonne date. */
const CLES_HEURE = ['heure', 'hour', 'hh', 'heuremesure'];

export interface ResultatCsvBalance {
  mesures: MesureNormalisee[];
  /** Lignes de données non exploitables (vides, sans horodatage lisible, sans valeur). */
  ignorees: number;
  /** Lignes de données lues (hors en-tête). */
  lignesLues: number;
  separateur: string;
  /** Diagnostic pour l'UI : champ reconnu → nom de colonne d'origine. */
  colonnes: Partial<Record<ChampMesure | 'horodatage', string>>;
  /**
   * Poids tels qu'écrits dans le fichier, AVANT conversion d'unité. Permet
   * d'apprendre l'unité de la balance au premier import (cf. balances/unite.ts).
   */
  poidsBruts: number[];
}

/** Compte les occurrences d'un caractère hors guillemets. */
function compterHorsGuillemets(ligne: string, c: string): number {
  let n = 0;
  let dansGuillemets = false;
  for (const ch of ligne) {
    if (ch === '"') dansGuillemets = !dansGuillemets;
    else if (ch === c && !dansGuillemets) n += 1;
  }
  return n;
}

/** Devine le séparateur depuis la ligne d'en-tête (`;` par défaut — export FR). */
export function detecterSeparateur(entete: string): string {
  let best = ';';
  let max = 0;
  for (const c of SEPARATEURS_CANDIDATS) {
    const n = compterHorsGuillemets(entete, c);
    if (n > max) {
      max = n;
      best = c;
    }
  }
  return best;
}

/**
 * Tokenise un CSV complet en lignes de cellules. Gère les guillemets (y compris
 * `""` échappé et un saut de ligne À L'INTÉRIEUR d'une cellule) et les fins de
 * ligne LF / CRLF.
 */
export function decouperCsv(contenu: string, separateur: string): string[][] {
  const lignes: string[][] = [];
  let ligne: string[] = [];
  let cellule = '';
  let dansGuillemets = false;

  for (let i = 0; i < contenu.length; i += 1) {
    const c = contenu[i]!;
    if (dansGuillemets) {
      if (c === '"') {
        if (contenu[i + 1] === '"') {
          cellule += '"';
          i += 1;
        } else {
          dansGuillemets = false;
        }
      } else {
        cellule += c;
      }
      continue;
    }
    if (c === '"') {
      dansGuillemets = true;
      continue;
    }
    if (c === separateur) {
      ligne.push(cellule);
      cellule = '';
      continue;
    }
    if (c === '\n' || c === '\r') {
      if (c === '\r' && contenu[i + 1] === '\n') i += 1;
      ligne.push(cellule);
      lignes.push(ligne);
      ligne = [];
      cellule = '';
      continue;
    }
    cellule += c;
  }
  if (cellule !== '' || ligne.length > 0) {
    ligne.push(cellule);
    lignes.push(ligne);
  }
  return lignes;
}

/** Retire le BOM UTF-8 s'il est présent (Excel en met un systématiquement). */
export function retirerBom(contenu: string): string {
  return contenu.charCodeAt(0) === 0xfeff ? contenu.slice(1) : contenu;
}

/**
 * Parse un export CSV de balance en mesures normalisées.
 *
 * Chaque ligne est reconstruite en objet `{ en-tête d'origine → cellule }` puis
 * passée au NORMALISEUR : détection des colonnes, unités, dates et plages de
 * plausibilité sont ainsi rigoureusement les mêmes que pour un webhook.
 */
export function parserCsvBalance(
  contenu: string,
  opts: OptionsNormalisation = {},
): ResultatCsvBalance {
  const texte = retirerBom(contenu);
  const premiereLigne = texte.split(/\r?\n/, 1)[0] ?? '';
  const separateur = detecterSeparateur(premiereLigne);
  const brut = decouperCsv(texte, separateur);

  const vide: ResultatCsvBalance = {
    mesures: [],
    ignorees: 0,
    lignesLues: 0,
    separateur,
    colonnes: {},
    poidsBruts: [],
  };

  const lignes = brut.filter((l) => l.some((c) => c.trim() !== ''));
  const entetes = lignes.shift();
  if (!entetes) return vide;

  const noms = entetes.map((h) => h.trim());
  const colonnes: Partial<Record<ChampMesure | 'horodatage', string>> = {};
  let idxDate = -1;
  let idxHeure = -1;

  noms.forEach((nom, i) => {
    const cle = normaliserCle(nom);
    if (!cle) return;
    if (CLES_HEURE.includes(cle)) {
      if (idxHeure < 0) idxHeure = i;
      return;
    }
    if (estCleHorodatage(cle)) {
      if (idxDate < 0) {
        idxDate = i;
        colonnes.horodatage = nom;
      }
      return;
    }
    const champ = champPourCle(cle);
    if (champ && !colonnes[champ]) colonnes[champ] = nom;
  });

  const mesures: MesureNormalisee[] = [];
  const poidsBruts: number[] = [];
  let ignorees = 0;
  let lignesLues = 0;

  for (const cellules of lignes) {
    if (lignesLues >= MAX_LIGNES_CSV) break;
    lignesLues += 1;

    const objet: Record<string, unknown> = {};
    noms.forEach((nom, i) => {
      const v = (cellules[i] ?? '').trim();
      if (v !== '') objet[nom || `col${i}`] = v;
    });
    if (Object.keys(objet).length === 0) {
      ignorees += 1;
      continue;
    }

    // Colonnes « Date » et « Heure » séparées → un seul horodatage recomposé.
    // `horodatage` est l'alias prioritaire du normaliseur, il l'emporte.
    const source: Record<string, unknown> = { ...objet };
    if (idxDate >= 0 && idxHeure >= 0) {
      const d = (cellules[idxDate] ?? '').trim();
      const h = (cellules[idxHeure] ?? '').trim();
      if (d && h) source.horodatage = `${d} ${h}`;
    }

    poidsBruts.push(...valeursPoidsBrutes(source));

    const mesure = normaliserPayload(source, opts);
    if (!mesure) {
      ignorees += 1;
      continue;
    }
    // On garde la ligne d'origine dans `raw`, sans la clé recomposée.
    mesures.push({ ...mesure, raw: objet });
  }

  return { mesures, ignorees, lignesLues, separateur, colonnes, poidsBruts };
}
