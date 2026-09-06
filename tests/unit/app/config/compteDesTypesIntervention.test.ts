import { describe, it, expect } from 'vitest';
import { readFileSync, globSync } from 'node:fs';
import { CATEGORIES_INTERVENTION } from '~/types/interventions';
import { sansCommentaires } from '~~/tests/helpers/sansCommentaires';

/**
 * LE CHIFFRE LE PLUS VISIBLE DE LA PAGE D'ACCUEIL ÉTAIT FAUX.
 *
 * La barre de statistiques annonçait « 14 · types d'interventions » en gras, et
 * quatre autres endroits reprenaient « 14 formulaires » ou « Plus de 14 types ».
 * Le produit en a TREIZE : `CATEGORIES_INTERVENTION` compte 13 entrées, et il y
 * a 13 fichiers de formulaire dans `app/components/interventions/forms/`.
 *
 * ⚠️ LE 14ᵉ N'EN EST PAS UN, ET C'EST LE PIÈGE. `server/services/interventions`
 * expose bien un gestionnaire `reine` — mais il vit sur une autre route
 * (`POST /api/ruches/{id}/evenements-reine`, gaté `moduleReine`), il n'est pas une
 * catégorie d'intervention et il n'a pas de formulaire. Compter 14 en le
 * regardant, c'est additionner deux choses différentes.
 *
 * LA VRAIE CORRECTION N'EST PAS D'ÉCRIRE 13. Un nombre recopié dans une page
 * commerciale est faux au prochain type ajouté, et personne ne pense à le
 * relire — ce dépôt en a déjà fait deux fois l'expérience (« 1 789
 * vérifications » devenu faux dans le même commit ; « 16 météo » qui en comptait
 * 22). Le chiffre se DÉRIVE de la liste, et ce banc interdit qu'on le réécrive.
 */

const FICHIERS = [...globSync('app/**/*.vue'), ...globSync('app/**/*.ts')].sort();

/** Ce que le produit fait vraiment. */
const RÉEL = CATEGORIES_INTERVENTION.length;

/** Le chiffre s'écrit parfois en lettres — un mot dérive aussi. */
const EN_LETTRES: Record<number, string> = {
  11: 'onze',
  12: 'douze',
  13: 'treize',
  14: 'quatorze',
  15: 'quinze',
  16: 'seize',
};

describe('le nombre de types d’intervention annoncé au client', () => {
  it('le balayage voit bien les fichiers (garde-fou du banc)', () => {
    expect(FICHIERS.length).toBeGreaterThan(200);
    expect(RÉEL).toBeGreaterThan(5);
  });

  it('les trois annonces de la landing le DÉRIVENT au lieu de l’écrire', () => {
    // Ces trois-là sont les plus lues : la barre de stats du hero, la carte
    // « Intervenir en 30 secondes », et la section « Application mobile ».
    for (const f of [
      'app/components/landing/LandingHero.vue',
      'app/components/landing/LandingFeatures.vue',
      'app/components/landing/LandingAppPreview.vue',
    ]) {
      expect(
        readFileSync(f, 'utf-8'),
        `${f} doit lire CATEGORIES_INTERVENTION plutôt qu’annoncer un nombre`,
      ).toContain('CATEGORIES_INTERVENTION.length');
    }
  });

  it('aucun fichier n’écrit un nombre de types ou de formulaires en dur', () => {
    /**
     * On cherche le MOTIF, pas le mot « 14 » : un nombre collé à « types
     * d'intervention », « formulaires », ou « types au total ». Interdire la
     * chaîne « 14 » aurait été absurde — il y a des « 14 ruches actives »
     * parfaitement légitimes dans les maquettes.
     */
    const MOTIFS = [
      /(\d+)\s*(?:\+\s*)?types?\s+d['’]interventions?/gi,
      /(\d+)\s*(?:\+\s*)?formulaires?/gi,
      /(\d+)\s*(?:\+\s*)?types?\s+(?:au total|disponibles?)/gi,
    ];
    const fautes: string[] = [];
    for (const f of FICHIERS) {
      const source = readFileSync(f, 'utf-8');
      for (const motif of MOTIFS) {
        for (const m of source.matchAll(motif)) {
          fautes.push(`${f} — « ${m[0]} »`);
        }
      }
    }
    expect(
      fautes,
      'dérive le nombre de CATEGORIES_INTERVENTION.length au lieu de l’écrire',
    ).toEqual([]);
  });

  it('le nombre écrit EN LETTRES suit le vrai compte', () => {
    /**
     * Le guide et le tutoriel disent « Treize types ». C'est juste aujourd'hui,
     * et un mot dérive aussi silencieusement qu'un chiffre — davantage, même :
     * personne ne pense à relire une lettre.
     *
     * ⚠️ DEUX PRÉCAUTIONS, ET LA PREMIÈRE M'A DÉJÀ PIÉGÉ ICI. Ma version naïve
     * a dénoncé « onze types » dans `MayaRaisonne.vue` — une note de rédaction,
     * dans un COMMENTAIRE, qui parle des types d'ALERTE pouvant sonner la nuit.
     * D'où : on blanchit les commentaires (le dépôt a déjà l'outil, extrait
     * après s'être fait avoir trois fois), et on exige que la phrase parle
     * bien d'interventions.
     */
    const attendu = EN_LETTRES[RÉEL];
    expect(attendu, `ajoute ${RÉEL} à EN_LETTRES`).toBeDefined();

    const autres = Object.entries(EN_LETTRES)
      .filter(([n]) => Number(n) !== RÉEL)
      .map(([, mot]) => mot);

    const fautes: string[] = [];
    for (const f of FICHIERS) {
      const source = sansCommentaires(readFileSync(f, 'utf-8'));
      for (const ligne of source.split('\n')) {
        if (!/intervention|formulaire/i.test(ligne)) continue;
        for (const mot of autres) {
          const motif = new RegExp(`\\b${mot}\\s+types?\\b`, 'gi');
          for (const m of ligne.matchAll(motif)) {
            fautes.push(`${f} — « ${m[0]} » (réel : ${RÉEL})`);
          }
        }
      }
    }
    expect(fautes, `le produit a ${RÉEL} types, soit « ${attendu} »`).toEqual([]);
  });

  it('les exemples cités sont de VRAIES catégories', () => {
    /**
     * La carte « Intervenir en 30 secondes » citait « reine » et
     * « transhumance » comme types d'intervention. Ni l'un ni l'autre n'en est
     * un : les catégories voisines s'appellent `deplacement` et `sanitaire`. Un
     * exemple faux coûte plus cher qu'un chiffre faux — il décrit un geste que
     * l'apiculteur cherchera dans l'application sans jamais le trouver.
     */
    const INTERDITS = ['reine', 'transhumance', 'mortalité'];
    const fautes: string[] = [];
    for (const f of [
      'app/components/landing/LandingFeatures.vue',
      'app/components/landing/LandingAppPreview.vue',
      'app/components/guide/GuideInterventions.vue',
      'app/config/tutorials.ts',
    ]) {
      const source = readFileSync(f, 'utf-8');
      // On ne regarde que les phrases qui ÉNUMÈRENT des types.
      for (const phrase of source.split('\n')) {
        if (!/formulaires adapt|types? d['’]intervention|le type \(/i.test(phrase)) continue;
        for (const mot of INTERDITS) {
          if (new RegExp(`\\b${mot}\\b`, 'i').test(phrase)) fautes.push(`${f} — « ${mot} »`);
        }
      }
    }
    expect(
      fautes,
      'ces mots ne sont pas des catégories d’intervention : ' + CATEGORIES_INTERVENTION.join(', '),
    ).toEqual([]);
  });
});
