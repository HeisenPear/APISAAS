/**
 * Les neuf widgets montrés dans le simulateur de la page d'accueil.
 *
 * POURQUOI UN MODULE ET PAS DES DONNÉES DANS LE GABARIT. Le banc qui vérifie
 * que ces widgets existent bien au catalogue lisait le `.vue` À LA REGEX. Un
 * banc qui lit du texte source valide du texte source : il restait vert si la
 * liste changeait de forme, et il ne pouvait rien dire des valeurs affichées.
 * Sorties ici, les neuf entrées s'importent et s'exécutent — le banc compare
 * des objets au catalogue réel au lieu de deviner leur graphie.
 *
 * ⚠️ `nom` doit être le LIBELLÉ EXACT du catalogue (`app/config/widgets.ts`).
 * `plan` doit être le plan qui déverrouille réellement la fonctionnalité. Les
 * deux sont vérifiés — une page d'accueil qui promet un widget inexistant, ou
 * qui le range sous le mauvais plan, est un mensonge commercial avant d'être
 * un défaut d'affichage.
 */
export type PlanWidget = 'Découverte' | 'Starter' | 'Pro';

interface Base {
  /** Libellé exact du catalogue. */
  nom: string;
  /** Plan qui déverrouille le widget. */
  plan: PlanWidget;
}

export type WidgetMini = Base &
  (
    | { genre: 'kpi'; valeur: string; suffixe?: string; sous: string }
    | { genre: 'sante'; score: number; ruchers: Array<{ nom: string; score: number }> }
    | { genre: 'alertes'; lignes: Array<{ texte: string; priorite: 'haute' | 'moyenne' }> }
    | { genre: 'barres'; total: string; valeurs: number[]; mois: string[] }
    | { genre: 'balance'; poids: string; delta: string; courbe: string }
    | {
        genre: 'finance';
        lignes: Array<{ libelle: string; montant: string; couleur: string }>;
      }
    | { genre: 'activite'; evenements: Array<{ texte: string; quand: string }> }
  );

/**
 * Un jeu de données COHÉRENT, pas neuf séries indépendantes : 48 ruches
 * réparties sur 3 ruchers, une saison à 214 kg, un chiffre d'affaires qui
 * correspond à cette récolte. Un visiteur qui lit deux cartes côte à côte ne
 * doit pas y trouver deux exploitations différentes.
 */
export const COLONNES: WidgetMini[][] = [
  [
    {
      nom: 'Ruches',
      plan: 'Découverte',
      genre: 'kpi',
      valeur: '48',
      sous: 'sur 52 · 3 ruchers',
    },
    {
      nom: 'Santé du cheptel',
      plan: 'Découverte',
      genre: 'sante',
      score: 82,
      ruchers: [
        { nom: 'Grand Pré', score: 91 },
        { nom: 'Les Chênes', score: 64 },
      ],
    },
    {
      nom: 'Balances connectées',
      plan: 'Starter',
      genre: 'balance',
      poids: '38,2',
      delta: '+1,4 kg / 24 h',
      courbe: '0,22 14,20 28,21 42,16 56,14 70,9 85,6 100,3',
    },
  ],
  [
    {
      nom: 'Alertes à traiter',
      plan: 'Découverte',
      genre: 'alertes',
      lignes: [
        { texte: 'Essaimage probable — R12', priorite: 'haute' },
        { texte: 'Réserves basses — Les Chênes', priorite: 'moyenne' },
      ],
    },
    {
      nom: 'Production',
      plan: 'Starter',
      genre: 'barres',
      total: '214 kg',
      valeurs: [22, 38, 61, 84, 100, 72],
      mois: ['Avr', 'Mai', 'Juin', 'Juil', 'Aoû', 'Sep'],
    },
    {
      nom: 'Reines actives',
      plan: 'Starter',
      genre: 'kpi',
      valeur: '44',
      sous: '9 à remplacer',
    },
  ],
  [
    {
      nom: "Chiffre d'affaires",
      plan: 'Découverte',
      genre: 'kpi',
      valeur: '4 280',
      suffixe: ' €',
      sous: '+12 % vs 2025',
    },
    {
      nom: 'Activité récente',
      plan: 'Découverte',
      genre: 'activite',
      evenements: [
        { texte: 'Visite — Grand Pré', quand: '2 h' },
        { texte: 'Récolte 18 kg', quand: 'hier' },
        { texte: 'Vente — Épicerie Roux', quand: '3 j' },
      ],
    },
    {
      nom: 'Trésorerie',
      plan: 'Pro',
      genre: 'finance',
      lignes: [
        { libelle: 'Recettes', montant: '+4 280 €', couleur: 'var(--sage-deep)' },
        { libelle: 'Dépenses', montant: '−1 610 €', couleur: 'var(--clay-deep)' },
        { libelle: 'Solde', montant: '2 670 €', couleur: 'var(--text-primary)' },
      ],
    },
  ],
];
