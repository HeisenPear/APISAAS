/**
 * ═══════════════════════════════════════════════════════════════════════════
 * CE QUE COÛTERAIT LA BASCULE DU STOCK — EN LECTURE SEULE.
 *
 * ─── POURQUOI CE SCRIPT EXISTE ─────────────────────────────────────────────
 * L'apiculteur a demandé que le stock d'un bon de livraison soit déduit à la
 * LIVRAISON et non à la création, « y compris pour les bons existants ».
 *
 * Ce second point n'est pas un réglage : c'est une ÉCRITURE dans la base de
 * PRODUCTION, sur des données déjà saisies, chez de vrais clients. Et elle est
 * difficilement réversible — jusqu'à ce chantier, aucune trace n'était écrite
 * à la déduction (`mouvements_stock` ne portait que les annulations), donc la
 * base ne dit pas ce qui est sorti : il faut le RECALCULER depuis les lignes
 * actuelles, en pariant qu'elles n'ont pas bougé depuis. Un pari invérifiable.
 *
 * On ne fait donc rien avant d'avoir les chiffres. Ce script les donne.
 *
 * ⚠️ IL N'ÉCRIT RIEN. Aucun `insert`, aucun `update`, aucun `delete` — la
 * lecture d'une base de production est sans danger, et c'est précisément la
 * raison d'être de cet outil : voir avant de décider.
 *
 *     DATABASE_URL="…" npx tsx scripts/etat-stock-bons-livraison.mts
 *
 * ─── CE QU'IL RÉPOND ───────────────────────────────────────────────────────
 *  1. combien de bons, dans quel état, sur combien d'exploitations ;
 *  2. ce qui serait RECRÉDITÉ si la déduction passait à la livraison —
 *     c'est-à-dire les seuls bons restés en `brouillon` ;
 *  3. les articles dont le stock est DÉJÀ négatif : le symptôme d'une
 *     sur-livraison passée, qu'il faut regarder avant d'ajouter quoi que ce
 *     soit ;
 *  4. les lignes qui désignent un article qui n'existe plus — un recrédit y
 *     serait perdu.
 * ═══════════════════════════════════════════════════════════════════════════
 */

import postgres from 'postgres';

const url = process.env.DATABASE_URL;
if (!url) {
  console.error(
    'DATABASE_URL manquant.\n' +
      'Ce script ne lit QUE. Donnez-lui l’URL de la base à inspecter :\n' +
      '  DATABASE_URL="…" npx tsx scripts/etat-stock-bons-livraison.mts',
  );
  process.exit(1);
}

const sql = postgres(url, { max: 1, prepare: false });

function titre(texte: string) {
  console.log(`\n${texte}\n${'─'.repeat(texte.length)}`);
}

function euros(v: unknown) {
  return new Intl.NumberFormat('fr-FR').format(Number(v ?? 0));
}

try {
  console.log('LECTURE SEULE — ce script n’écrit rien dans la base.');

  // ─── 1. La population ────────────────────────────────────────────────────
  titre('1 · Les bons de livraison, par état');
  const parStatut = await sql`
    SELECT statut,
           COUNT(*)                  AS bons,
           COUNT(DISTINCT user_id)   AS exploitations
      FROM bons_livraison
     GROUP BY statut
     ORDER BY statut
  `;
  if (!parStatut.length) console.log('  (aucun bon de livraison)');
  for (const l of parStatut) {
    console.log(
      `  ${String(l.statut).padEnd(12)} ${String(l.bons).padStart(6)} bons` +
        `   sur ${l.exploitations} exploitation(s)`,
    );
  }

  // ─── 2. Ce que la bascule recréditerait ──────────────────────────────────
  //
  // SEULS les brouillons. Un bon `livre` ou `facture` garde légitimement sa
  // déduction (la marchandise est partie) ; un `annule` a déjà été
  // contre-passé ; un bon supprimé n'existe plus.
  titre('2 · Ce qui serait RECRÉDITÉ si la déduction passait à la livraison');
  const aRecrediter = await sql`
    SELECT s.id,
           s.nom,
           s.unite,
           s.quantite                                   AS quantite_actuelle,
           SUM((ligne->>'quantite')::numeric)           AS a_recrediter,
           COUNT(DISTINCT bl.id)                        AS bons_concernes,
           COUNT(DISTINCT bl.user_id)                   AS exploitations
      FROM bons_livraison bl
      CROSS JOIN LATERAL jsonb_array_elements(COALESCE(bl.lignes, '[]'::jsonb)) AS ligne
      JOIN stocks s
        ON s.id = (ligne->>'stockId')::uuid
       AND s.user_id = bl.user_id
     WHERE bl.statut = 'brouillon'
       AND ligne ? 'stockId'
     GROUP BY s.id, s.nom, s.unite, s.quantite
     ORDER BY a_recrediter DESC
  `;
  if (!aRecrediter.length) {
    console.log('  Aucun bon en brouillon ne tient de stock : la bascule ne changerait RIEN.');
  } else {
    console.log(`  ${aRecrediter.length} article(s) concerné(s) :\n`);
    for (const l of aRecrediter) {
      console.log(
        `  ${String(l.nom).slice(0, 34).padEnd(34)} ` +
          `${euros(l.quantite_actuelle).padStart(9)} → ` +
          `${euros(Number(l.quantite_actuelle) + Number(l.a_recrediter)).padStart(9)} ` +
          `${String(l.unite ?? '').padEnd(6)} ` +
          `(+${euros(l.a_recrediter)}, ${l.bons_concernes} bon(s))`,
      );
    }
    const exploitations = new Set(aRecrediter.map((l) => String(l.exploitations)));
    console.log(`\n  Sur ${exploitations.size} valeur(s) distincte(s) d’exploitations touchées.`);
  }

  // ─── 3. Le stock déjà négatif ────────────────────────────────────────────
  //
  // Rien n'empêche aujourd'hui de livrer plus qu'on n'a : la saisie affiche un
  // maximum, mais le bouton de création vit hors du formulaire, donc la
  // validation du navigateur n'est jamais consultée. Un article négatif est le
  // symptôme, et il DISPARAÎT des listes d'ajout rapide (elles filtrent sur
  // `quantite > 0`) — l'apiculteur ne peut plus le remettre sur un bon.
  titre('3 · Les articles dont le stock est DÉJÀ négatif');
  const negatifs = await sql`
    SELECT nom, quantite, unite
      FROM stocks
     WHERE quantite::numeric < 0
     ORDER BY quantite::numeric ASC
     LIMIT 50
  `;
  if (!negatifs.length) console.log('  Aucun. ');
  for (const l of negatifs) {
    console.log(`  ${String(l.nom).slice(0, 40).padEnd(40)} ${euros(l.quantite)} ${l.unite ?? ''}`);
  }

  // ─── 4. Les lignes orphelines ────────────────────────────────────────────
  //
  // `stockId` est une valeur dans un jsonb : aucune clé étrangère ne la tient.
  // Un article supprimé laisse donc des lignes qui désignent le vide, et un
  // recrédit y serait purement perdu.
  titre('4 · Les lignes qui désignent un article disparu');
  const orphelines = await sql`
    SELECT bl.statut,
           COUNT(*) AS lignes
      FROM bons_livraison bl
      CROSS JOIN LATERAL jsonb_array_elements(COALESCE(bl.lignes, '[]'::jsonb)) AS ligne
     WHERE ligne ? 'stockId'
       AND NOT EXISTS (
             SELECT 1 FROM stocks s
              WHERE s.id = (ligne->>'stockId')::uuid
                AND s.user_id = bl.user_id
           )
     GROUP BY bl.statut
     ORDER BY bl.statut
  `;
  if (!orphelines.length) console.log('  Aucune.');
  for (const l of orphelines) {
    console.log(`  ${String(l.statut).padEnd(12)} ${l.lignes} ligne(s) sans article`);
  }

  console.log(
    '\n─────────────────────────────────────────────────────────────────\n' +
      'Rien n’a été modifié. La bascule elle-même reste à décider : elle\n' +
      'écrira dans la base de production sur des données déjà saisies.\n',
  );
} finally {
  await sql.end();
}
