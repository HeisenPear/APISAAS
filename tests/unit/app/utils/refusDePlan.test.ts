// ═══════════════════════════════════════════════════════════════════════════
// JAMAIS DE BLOCAGE SANS PORTE DE SORTIE.
//
// C'est une règle produit, pas une préférence : quand APIGO refuse quelque
// chose faute de formule, l'apiculteur doit lire CE QUI manque, QUELLE formule
// le débloque, et pouvoir s'abonner dans la foulée. Un refus qui s'arrête à
// « non » est un client qui s'en va.
//
// Le mécanisme tient en deux pièces :
//  · le serveur lève un 402 dont la charge utile porte `code`, `requiredPlan`
//    et une phrase rédigée ;
//  · `upgrade-interceptor.client.ts` reconnaît ce `code` et ouvre le modal
//    d'abonnement.
//
// Elles ne tenaient ensemble que par convention. Le serveur émet TROIS codes de
// refus ; l'intercepteur n'en connaissait que deux.
//
// ─── LE DÉFAUT QUE CE BANC VERROUILLE ──────────────────────────────────────
// `RUCHE_VERROUILLEE` — levé par le middleware 06 quand un compte rétrogradé
// touche une ruche au-delà de son plafond — n'était reconnu NULLE PART côté
// client. Ni par l'intercepteur (donc pas de modal), ni par
// `getApiErrorMessage` (donc la phrase soignée du serveur était remplacée par
// le `statusMessage` de trois mots : « Ruche verrouillée »).
//
// L'apiculteur voyait donc : un refus sec, aucune formule nommée, aucun bouton.
// Alors que le serveur avait préparé, mot pour mot : « Cette ruche reste
// enregistrée : un abonnement vous rend l'intégralité de votre cheptel, là où
// vous l'aviez laissé. »
// ═══════════════════════════════════════════════════════════════════════════

import { globSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { getApiErrorMessage } from '../../../../app/utils/apiError';
import { lireRefusDePlan } from '../../../../app/utils/refusDePlan';

/**
 * Tous les codes de refus que le SERVEUR sait émettre, relevés dans les charges
 * utiles des `createError` de statut 402. On les lit dans le code plutôt que de
 * les recopier : un quatrième code ajouté demain entre seul dans ce banc.
 */
function codesDeRefusServeur(): string[] {
  const codes = new Set<string>();
  for (const fichier of globSync('server/**/*.ts')) {
    const source = readFileSync(fichier, 'utf-8');
    if (!source.includes('statusCode: 402')) continue;
    // On ne retient que les `code:` situés dans les ~400 caractères suivant un
    // 402 — le fichier peut en contenir d'autres, sans rapport.
    for (const bloc of source.split('statusCode: 402').slice(1)) {
      const m = /code:\s*'([A-Z_]+)'/.exec(bloc.slice(0, 400));
      if (m?.[1]) codes.add(m[1]);
    }
  }
  return [...codes].sort();
}

describe('refus de plan — la porte de sortie', () => {
  it('le relevé des codes serveur n’est pas vide (garde-fou du banc)', () => {
    // Un motif qui ne trouve plus rien rendrait tous les cas suivants verts sur
    // une liste vide, ce qui est le pire résultat possible pour un banc de
    // couverture inverse.
    const codes = codesDeRefusServeur();
    expect(codes.length).toBeGreaterThanOrEqual(3);
    expect(codes).toContain('LIMIT_REACHED');
  });

  it('TOUT code de refus émis par le serveur ouvre le modal d’abonnement', () => {
    // L'invariant. `lireRefusDePlan` est le seul chemin vers le modal : un code
    // qu'elle ignore est un refus sans issue, quelle que soit la richesse de la
    // charge utile préparée côté serveur.
    //
    // On APPELLE la fonction, on ne cherche plus le nom du code dans le source.
    // La première version faisait l'inverse et une mutation l'a réfutée : en
    // retirant la prise en charge du verrou, le banc restait vert parce que le
    // nom survivait dans le commentaire qui l'expliquait.
    const ignores = codesDeRefusServeur().filter(
      (code) => lireRefusDePlan({ data: { code } }) === null,
    );

    // Une exception assumée, et une seule : le webhook des balances. Un capteur
    // pousse ses relevés sans qu'aucun humain regarde — il n'y a pas de modal à
    // ouvrir, et son 402 ne porte d'ailleurs aucun code.
    expect(ignores).toEqual([]);
  });

  it('un 402 sans code de formule n’ouvre rien', () => {
    // Contre-test : sans lui, une fonction qui dirait « oui » à tout
    // satisferait le cas précédent.
    expect(lireRefusDePlan({ message: 'Plan insuffisant' })).toBeNull();
    expect(lireRefusDePlan({ data: { code: 'INCONNU' } })).toBeNull();
    expect(lireRefusDePlan(undefined)).toBeNull();
  });

  it('le verrou de cheptel devient un refus de LIMITE, avec sa charge utile', () => {
    // Le cœur du correctif : le modal ne connaît que deux codes, et la forme du
    // verrou est celle d'une limite. On vérifie la conversion ET le fait que
    // rien de ce que le serveur a préparé ne se perd en route.
    const lu = lireRefusDePlan({
      data: {
        code: 'RUCHE_VERROUILLEE',
        limit: 'ruches',
        max: 1,
        currentPlan: 'decouverte',
        requiredPlan: 'starter',
        message: 'Cette ruche reste enregistrée.',
      },
    });

    expect(lu?.code).toBe('LIMIT_REACHED');
    expect(lu?.limit).toBe('ruches');
    expect(lu?.max).toBe(1);
    expect(lu?.requiredPlan, 'sans lui, le modal ne sait pas quoi proposer').toBe('starter');
    expect(lu?.message).toMatch(/reste enregistrée/);
  });

  it('le verrou de cheptel affiche SA phrase, pas le libellé de statut', () => {
    // Cas concret du défaut. `getApiErrorMessage` ne connaissait que deux codes
    // et rendait « Ruche verrouillée » — trois mots qui n'expliquent rien et
    // n'indiquent aucune suite.
    const erreur = {
      data: {
        statusCode: 402,
        message: 'Ruche verrouillée',
        data: {
          code: 'RUCHE_VERROUILLEE',
          limit: 'ruches',
          max: 1,
          currentPlan: 'decouverte',
          requiredPlan: 'starter',
          message:
            'Votre plan Découverte donne accès à 1 ruche. Cette ruche reste enregistrée : un abonnement vous rend l’intégralité de votre cheptel, là où vous l’aviez laissé.',
        },
      },
    };

    const message = getApiErrorMessage(erreur);

    expect(message).toMatch(/reste enregistrée/);
    expect(message, 'le libellé de statut ne doit pas gagner').not.toBe('Ruche verrouillée');
  });

  it('les deux autres codes gardent le comportement qu’ils avaient', () => {
    // Contre-test : la correction ne doit pas s'être faite au détriment des
    // codes déjà pris en charge.
    for (const code of ['PLAN_REQUIRED', 'LIMIT_REACHED']) {
      const message = getApiErrorMessage({
        data: {
          statusCode: 402,
          message: 'Paiement requis',
          data: { code, message: `refus ${code}` },
        },
      });
      expect(message).toBe(`refus ${code}`);
    }
  });

  it('une erreur ordinaire n’est pas prise pour un refus de plan', () => {
    // Sans ce cas, une extraction trop large rendrait le banc précédent vrai
    // pour de mauvaises raisons.
    expect(getApiErrorMessage({ data: { statusCode: 500, message: 'Boum' } })).toBe('Boum');
    expect(getApiErrorMessage(new Error('réseau injoignable'))).toBe('réseau injoignable');
  });
});
