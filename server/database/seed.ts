/* eslint-disable no-console */
/**
 * Seed script for APIGO
 * Run: pnpm db:seed  (or npm run db:seed)
 *
 * Creates demo data for development and testing.
 */

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';
import { exigerAutorisation } from '../../scripts/garde-base';

// AVANT toute connexion : ce script écrit des données de démonstration. Dans ce
// dépôt, `.env` porte la base de PRODUCTION — semer dedans mêlerait des ruchers
// fictifs aux données de vrais clients, sans retour possible.
exigerAutorisation('db:seed — écriture de données de démonstration');

const DATABASE_URL = process.env.DATABASE_URL!;

const sql = postgres(DATABASE_URL, { max: 1 });
const db = drizzle(sql, { schema });

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

function daysAgo(days: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d;
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomItem<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]!;
}

// ─────────────────────────────────────────────
// Fixed IDs for referential integrity
// ─────────────────────────────────────────────

const DEMO_USER_ID = '00000000-0000-0000-0000-000000000001';

const RUCHER_IDS = [
  '10000000-0000-0000-0000-000000000001', // Foret de Chinon
  '10000000-0000-0000-0000-000000000002', // Vignoble Vouvray
  '10000000-0000-0000-0000-000000000003', // Prairie Touraine
] as const;

const RUCHE_IDS = Array.from(
  { length: 15 },
  (_, i) => `20000000-0000-0000-0000-${String(i + 1).padStart(12, '0')}`,
);

const CLIENT_IDS = [
  '30000000-0000-0000-0000-000000000001',
  '30000000-0000-0000-0000-000000000002',
  '30000000-0000-0000-0000-000000000003',
] as const;

const STOCK_IDS = [
  '40000000-0000-0000-0000-000000000001',
  '40000000-0000-0000-0000-000000000002',
  '40000000-0000-0000-0000-000000000003',
  '40000000-0000-0000-0000-000000000004',
  '40000000-0000-0000-0000-000000000005',
  '40000000-0000-0000-0000-000000000006',
  '40000000-0000-0000-0000-000000000007',
] as const;

// ─────────────────────────────────────────────
// SEED
// ─────────────────────────────────────────────

async function seed() {
  console.log('Seeding database...\n');

  // ── 1. Profil demo ──────────────────────────
  console.log('  Creating demo user...');
  await db
    .insert(schema.profils)
    .values({
      id: DEMO_USER_ID,
      email: 'demo@apigo.fr',
      nom: 'Dupont',
      prenom: 'Jean',
      telephone: '06 12 34 56 78',
      adresse: '12 Rue des Abeilles',
      codePostal: '37000',
      ville: 'Tours',
      siret: '12345678901234',
      napi: 'A37-1234',
      plan: 'pro',
      onboardingComplete: true,
      preferences: {
        theme: 'light',
        notifications: true,
        uniteTemperature: 'celsius',
      },
    })
    .onConflictDoNothing();

  // ── 2. Ruchers ──────────────────────────────
  console.log('  Creating ruchers...');
  const ruchersData: (typeof schema.ruchers.$inferInsert)[] = [
    {
      id: RUCHER_IDS[0],
      userId: DEMO_USER_ID,
      nom: 'Foret de Chinon',
      description: 'Rucher principal en lisiere de la foret de Chinon, exposition sud-ouest.',
      latitude: '47.1667',
      longitude: '0.2333',
      adresse: 'Chemin de la Foret',
      codePostal: '37500',
      commune: 'Chinon',
      departement: '37',
      environnement: 'Foret de chenes, acacias, chataigniers. Zone protegee.',
      notesAcces: 'Prendre le chemin apres le pont, cle du portail sur le clou.',
      actif: true,
    },
    {
      id: RUCHER_IDS[1],
      userId: DEMO_USER_ID,
      nom: 'Vignoble Vouvray',
      description: 'Rucher installe au coeur du vignoble AOC Vouvray.',
      latitude: '47.4128',
      longitude: '0.7986',
      adresse: 'Lieu-dit Les Coteaux',
      codePostal: '37210',
      commune: 'Vouvray',
      departement: '37',
      environnement: 'Vignes, haies bocageres, prairies fleuries.',
      notesAcces: 'Acces par la D46, parking a 200m.',
      actif: true,
    },
    {
      id: RUCHER_IDS[2],
      userId: DEMO_USER_ID,
      nom: 'Prairie de Touraine',
      description: 'Rucher en plaine, ideal pour le miel toutes fleurs.',
      latitude: '47.3941',
      longitude: '0.6848',
      adresse: 'Route des Prairies',
      codePostal: '37230',
      commune: 'Fondettes',
      departement: '37',
      environnement: 'Prairie naturelle, bordure de Loire, colza au printemps.',
      notesAcces: 'Portail vert au bout du chemin de terre.',
      actif: true,
    },
  ];
  await db.insert(schema.ruchers).values(ruchersData).onConflictDoNothing();

  // ── 3. Ruches ───────────────────────────────
  console.log('  Creating ruches...');

  const rucheTypes: (typeof schema.ruches.$inferInsert)['type'][] = [
    'dadant_10',
    'dadant_10',
    'dadant_10',
    'dadant_10',
    'dadant_10',
    'dadant_12',
    'dadant_12',
    'langstroth',
    'langstroth',
    'langstroth',
    'warre',
    'warre',
    'dadant_10',
    'langstroth',
    'dadant_12',
  ];

  const statuts: (typeof schema.ruches.$inferInsert)['statut'][] = [
    'active',
    'active',
    'active',
    'active',
    'faible',
    'active',
    'active',
    'active',
    'orpheline',
    'active',
    'active',
    'active',
    'active',
    'active',
    'essaimee',
  ];

  const races: (typeof schema.ruches.$inferInsert)['raceAbeille'][] = [
    'noire',
    'noire',
    'buckfast',
    'noire',
    'noire',
    'buckfast',
    'buckfast',
    'carnica',
    'carnica',
    'buckfast',
    'noire',
    'noire',
    'italienne',
    'buckfast',
    'noire',
  ];

  // Distribute: 6 first to Chinon, 5 to Vouvray, 4 to Prairie
  const rucherAssignment = [0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 2, 2, 2, 2];

  const ruchesData: (typeof schema.ruches.$inferInsert)[] = RUCHE_IDS.map((id, i) => ({
    id,
    userId: DEMO_USER_ID,
    rucherId: RUCHER_IDS[rucherAssignment[i]!]!,
    numero: `R${String(i + 1).padStart(2, '0')}`,
    type: rucheTypes[i]!,
    statut: statuts[i]!,
    raceAbeille: races[i]!,
    qualiteReine: randomItem(['excellente', 'bonne', 'bonne', 'moyenne'] as const),
    dateInstallation: daysAgo(randomInt(90, 730)),
    origineEssaim: randomItem(['Elevage personnel', 'Achat nuclei', 'Essaim capture', 'Division']),
    marquageReine: randomItem(['Bleu 2025', 'Blanc 2024', 'Jaune 2024', null]),
    nombreCadres: randomInt(8, 10),
    nombreHausses: randomInt(0, 2),
    notes: null,
  }));
  await db.insert(schema.ruches).values(ruchesData).onConflictDoNothing();

  // ── 4. Recoltes ─────────────────────────────
  console.log('  Creating recoltes...');

  const recoltesData: (typeof schema.recoltes.$inferInsert)[] = [
    {
      userId: DEMO_USER_ID,
      rucherId: RUCHER_IDS[0],
      dateRecolte: daysAgo(120),
      typeMiel: 'Acacia',
      quantiteKg: '18.5',
      humidite: '17.2',
      nombreHausses: 3,
      numeroLot: 'LOT-2025-001',
      notes: 'Recolte de printemps, miel clair et liquide.',
    },
    {
      userId: DEMO_USER_ID,
      rucherId: RUCHER_IDS[0],
      dateRecolte: daysAgo(90),
      typeMiel: 'Chataignier',
      quantiteKg: '12.0',
      humidite: '18.0',
      nombreHausses: 2,
      numeroLot: 'LOT-2025-002',
      notes: 'Miel fonce, gout prononce.',
    },
    {
      userId: DEMO_USER_ID,
      rucherId: RUCHER_IDS[1],
      dateRecolte: daysAgo(80),
      typeMiel: 'Toutes fleurs',
      quantiteKg: '22.3',
      humidite: '16.8',
      nombreHausses: 4,
      numeroLot: 'LOT-2025-003',
      notes: 'Excellente recolte du vignoble.',
    },
    {
      userId: DEMO_USER_ID,
      rucherId: RUCHER_IDS[2],
      dateRecolte: daysAgo(60),
      typeMiel: 'Toutes fleurs',
      quantiteKg: '15.7',
      humidite: '17.5',
      nombreHausses: 3,
      numeroLot: 'LOT-2025-004',
      notes: 'Miel cremeux, bonne qualite.',
    },
    {
      userId: DEMO_USER_ID,
      rucherId: RUCHER_IDS[1],
      dateRecolte: daysAgo(30),
      typeMiel: 'Acacia',
      quantiteKg: '20.0',
      humidite: '16.5',
      nombreHausses: 4,
      numeroLot: 'LOT-2025-005',
      notes: 'Deuxieme recolte acacia, tres clair.',
    },
  ];
  await db.insert(schema.recoltes).values(recoltesData);

  // ── 6. Stocks ───────────────────────────────
  console.log('  Creating stocks...');

  const stocksData: (typeof schema.stocks.$inferInsert)[] = [
    {
      id: STOCK_IDS[0],
      userId: DEMO_USER_ID,
      nom: 'Cadres Dadant cires',
      categorie: 'cadres',
      quantite: '45',
      unite: 'pieces',
      seuilAlerte: '10',
      prixUnitaire: '2.80',
      fournisseur: 'Thomas Apiculture',
      emplacement: 'Atelier',
    },
    {
      id: STOCK_IDS[1],
      userId: DEMO_USER_ID,
      nom: 'Hausses Dadant',
      categorie: 'hausses',
      quantite: '12',
      unite: 'pieces',
      seuilAlerte: '5',
      prixUnitaire: '18.50',
      fournisseur: 'ICKO Apiculture',
      emplacement: 'Atelier',
    },
    {
      id: STOCK_IDS[2],
      userId: DEMO_USER_ID,
      nom: 'Acide oxalique',
      categorie: 'traitement',
      quantite: '3',
      unite: 'flacons',
      seuilAlerte: '1',
      prixUnitaire: '12.00',
      fournisseur: 'Veto-pharma',
      emplacement: 'Pharmacie',
    },
    {
      id: STOCK_IDS[3],
      userId: DEMO_USER_ID,
      nom: 'Apivar',
      categorie: 'traitement',
      quantite: '10',
      unite: 'lanieres',
      seuilAlerte: '4',
      prixUnitaire: '3.50',
      fournisseur: 'Veto-pharma',
      emplacement: 'Pharmacie',
    },
    {
      id: STOCK_IDS[4],
      userId: DEMO_USER_ID,
      nom: 'Pots 500g',
      categorie: 'conditionnement',
      quantite: '200',
      unite: 'pieces',
      seuilAlerte: '50',
      prixUnitaire: '0.45',
      fournisseur: 'Apidis',
      emplacement: 'Miellerie',
    },
    {
      id: STOCK_IDS[5],
      userId: DEMO_USER_ID,
      nom: 'Pots 250g',
      categorie: 'conditionnement',
      quantite: '150',
      unite: 'pieces',
      seuilAlerte: '30',
      prixUnitaire: '0.35',
      fournisseur: 'Apidis',
      emplacement: 'Miellerie',
    },
    {
      id: STOCK_IDS[6],
      userId: DEMO_USER_ID,
      nom: 'Sirop nourrissement',
      categorie: 'nourrissement',
      quantite: '25',
      unite: 'litres',
      seuilAlerte: '5',
      prixUnitaire: '1.80',
      fournisseur: 'Thomas Apiculture',
      emplacement: 'Atelier',
    },
  ];
  await db.insert(schema.stocks).values(stocksData).onConflictDoNothing();

  // ── 7. Mouvements stock ─────────────────────
  console.log('  Creating mouvements stock...');

  const mouvementsData: (typeof schema.mouvementsStock.$inferInsert)[] = [
    {
      stockId: STOCK_IDS[0]!,
      userId: DEMO_USER_ID,
      type: 'entree',
      quantite: '50',
      motif: 'Commande Thomas Apiculture',
    },
    {
      stockId: STOCK_IDS[0]!,
      userId: DEMO_USER_ID,
      type: 'sortie',
      quantite: '5',
      motif: 'Remplacement cadres rucher Chinon',
    },
    {
      stockId: STOCK_IDS[4]!,
      userId: DEMO_USER_ID,
      type: 'entree',
      quantite: '200',
      motif: 'Commande Apidis',
    },
    {
      stockId: STOCK_IDS[2]!,
      userId: DEMO_USER_ID,
      type: 'sortie',
      quantite: '1',
      motif: 'Traitement hiver rucher Vouvray',
    },
  ];
  await db.insert(schema.mouvementsStock).values(mouvementsData);

  // ── 8. Clients ──────────────────────────────
  console.log('  Creating clients...');

  const clientsData: (typeof schema.clients.$inferInsert)[] = [
    {
      id: CLIENT_IDS[0],
      userId: DEMO_USER_ID,
      type: 'particulier',
      nom: 'Martin',
      prenom: 'Sophie',
      email: 'sophie.martin@email.fr',
      telephone: '06 98 76 54 32',
      adresse: '5 Rue de la Paix',
      codePostal: '37000',
      ville: 'Tours',
      notes: 'Cliente fidele, commande regulierement.',
    },
    {
      id: CLIENT_IDS[1],
      userId: DEMO_USER_ID,
      type: 'professionnel',
      nom: 'Leroy',
      prenom: 'Michel',
      entreprise: 'Epicerie Fine du Val de Loire',
      email: 'contact@epicerie-valdeloire.fr',
      telephone: '02 47 12 34 56',
      adresse: '18 Place du Grand Marche',
      codePostal: '37000',
      ville: 'Tours',
      siret: '98765432109876',
      notes: 'Revendeur local, prix grossiste.',
    },
    {
      id: CLIENT_IDS[2],
      userId: DEMO_USER_ID,
      type: 'particulier',
      nom: 'Dubois',
      prenom: 'Pierre',
      email: 'p.dubois@gmail.com',
      telephone: '07 11 22 33 44',
      adresse: '42 Avenue de Grammont',
      codePostal: '37000',
      ville: 'Tours',
      notes: 'Prefere le miel de chataignier.',
    },
  ];
  await db.insert(schema.clients).values(clientsData).onConflictDoNothing();

  // ── 9. Transactions (5 ventes) ──────────────
  console.log('  Creating transactions...');

  const transactionsData: (typeof schema.transactions.$inferInsert)[] = [
    {
      userId: DEMO_USER_ID,
      clientId: CLIENT_IDS[0],
      type: 'vente',
      numero: 'FA-2025-001',
      dateTransaction: daysAgo(90),
      statut: 'payee',
      sousTotal: '30.00',
      tva: '1.65',
      total: '31.65',
      lignes: [{ description: 'Miel Acacia 500g', quantite: 3, prixUnitaire: 10.0, total: 30.0 }],
      categorie: 'miel',
    },
    {
      userId: DEMO_USER_ID,
      clientId: CLIENT_IDS[1],
      type: 'vente',
      numero: 'FA-2025-002',
      dateTransaction: daysAgo(75),
      statut: 'payee',
      sousTotal: '180.00',
      tva: '9.90',
      total: '189.90',
      lignes: [
        { description: 'Miel Toutes Fleurs 500g', quantite: 12, prixUnitaire: 8.0, total: 96.0 },
        { description: 'Miel Chataignier 500g', quantite: 8, prixUnitaire: 10.5, total: 84.0 },
      ],
      categorie: 'miel',
    },
    {
      userId: DEMO_USER_ID,
      clientId: CLIENT_IDS[2],
      type: 'vente',
      numero: 'FA-2025-003',
      dateTransaction: daysAgo(45),
      statut: 'payee',
      sousTotal: '21.00',
      tva: '1.16',
      total: '22.16',
      lignes: [
        { description: 'Miel Chataignier 500g', quantite: 2, prixUnitaire: 10.5, total: 21.0 },
      ],
      categorie: 'miel',
    },
    {
      userId: DEMO_USER_ID,
      clientId: CLIENT_IDS[0],
      type: 'vente',
      numero: 'FA-2025-004',
      dateTransaction: daysAgo(15),
      statut: 'envoyee',
      sousTotal: '40.00',
      tva: '2.20',
      total: '42.20',
      lignes: [
        { description: 'Miel Acacia 250g', quantite: 4, prixUnitaire: 6.0, total: 24.0 },
        { description: 'Miel Toutes Fleurs 250g', quantite: 4, prixUnitaire: 4.0, total: 16.0 },
      ],
      categorie: 'miel',
    },
    {
      userId: DEMO_USER_ID,
      clientId: CLIENT_IDS[1],
      type: 'vente',
      numero: 'FA-2025-005',
      dateTransaction: daysAgo(5),
      dateEcheance: daysAgo(-25),
      statut: 'envoyee',
      sousTotal: '240.00',
      tva: '13.20',
      total: '253.20',
      lignes: [
        { description: 'Miel Acacia 500g', quantite: 12, prixUnitaire: 10.0, total: 120.0 },
        { description: 'Miel Toutes Fleurs 500g', quantite: 15, prixUnitaire: 8.0, total: 120.0 },
      ],
      categorie: 'miel',
    },
  ];
  await db.insert(schema.transactions).values(transactionsData);

  // ── 10. Alertes ─────────────────────────────
  console.log('  Creating alertes...');

  const alertesData: (typeof schema.alertes.$inferInsert)[] = [
    {
      userId: DEMO_USER_ID,
      type: 'sante',
      titre: 'Colonie faible detectee',
      message:
        'La ruche R05 du rucher Foret de Chinon presente des signes de faiblesse. Inspection recommandee.',
      priorite: 'haute',
      lue: false,
      actionUrl: '/ruches/' + RUCHE_IDS[4],
      referenceType: 'ruche',
      referenceId: RUCHE_IDS[4],
    },
    {
      userId: DEMO_USER_ID,
      type: 'stock',
      titre: 'Stock bas : Acide oxalique',
      message:
        "Le stock d'acide oxalique est proche du seuil d'alerte (3 flacons restants, seuil: 1).",
      priorite: 'moyenne',
      lue: false,
      actionUrl: '/stocks',
      referenceType: 'stock',
      referenceId: STOCK_IDS[2],
    },
    {
      userId: DEMO_USER_ID,
      type: 'recolte',
      titre: 'Hausse pleine sur R03',
      message:
        'La derniere inspection de R03 indique une hausse presque pleine. Planifiez la recolte.',
      priorite: 'moyenne',
      lue: true,
      actionUrl: '/ruches/' + RUCHE_IDS[2],
      referenceType: 'ruche',
      referenceId: RUCHE_IDS[2],
    },
    {
      userId: DEMO_USER_ID,
      type: 'meteo',
      titre: 'Vague de froid annoncee',
      message:
        'Temperatures prevues sous 5 degres cette semaine. Verifiez le nourrissement de vos colonies.',
      priorite: 'haute',
      lue: false,
    },
    {
      userId: DEMO_USER_ID,
      type: 'finance',
      titre: 'Facture FA-2025-004 en attente',
      message: "La facture FA-2025-004 envoyee a Sophie Martin n'a pas encore ete reglee.",
      priorite: 'basse',
      lue: false,
      actionUrl: '/finances',
      referenceType: 'transaction',
    },
  ];
  await db.insert(schema.alertes).values(alertesData);

  console.log('\nSeed completed successfully!');
  console.log('  - 1 user (demo@apigo.fr)');
  console.log('  - 3 ruchers');
  console.log('  - 15 ruches');
  console.log('  - 5 recoltes');
  console.log('  - 7 stocks + 4 mouvements');
  console.log('  - 3 clients');
  console.log('  - 5 transactions');
  console.log('  - 5 alertes');
}

seed()
  .catch((error: unknown) => {
    console.error('Seed failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await sql.end();
  });
