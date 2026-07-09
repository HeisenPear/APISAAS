/* Mock data for APIGO v2 — coherent across all pages */

const TODAY = new Date('2026-05-02');
const fmtDate = (d) => d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });

const RUCHERS = [
  { id: 'R01', name: 'Mont Ventoux Sud', commune: 'Bédoin', altitude: 380, ruches: 42, prod2025: 1180, sante: 'good', flore: 'Lavande, romarin, châtaignier', lastVisit: '28 avr.' },
  { id: 'R02', name: 'Plaine de l\'Ouvèze', commune: 'Vaison-la-Romaine', altitude: 220, ruches: 38, prod2025: 920, sante: 'good', flore: 'Tilleul, acacia, polyfloral', lastVisit: '25 avr.' },
  { id: 'R03', name: 'Garrigue de Sault', commune: 'Sault', altitude: 760, ruches: 36, prod2025: 1340, sante: 'warn', flore: 'Lavande fine, sarriette', lastVisit: '21 avr.' },
  { id: 'R04', name: 'Forêt du Comtat', commune: 'Méthamis', altitude: 540, ruches: 34, prod2025: 780, sante: 'good', flore: 'Châtaignier, ronce, miellat', lastVisit: '30 avr.' },
  { id: 'R05', name: 'Coteaux d\'Apt', commune: 'Apt', altitude: 410, ruches: 32, prod2025: 860, sante: 'good', flore: 'Lavande, thym', lastVisit: '27 avr.' },
  { id: 'R06', name: 'Prés de la Sorgue', commune: 'Fontaine-de-Vaucluse', altitude: 95, ruches: 30, prod2025: 640, sante: 'bad', flore: 'Polyfloral, peuplier', lastVisit: '15 avr.' },
  { id: 'R07', name: 'Hauts de Buoux', commune: 'Buoux', altitude: 680, ruches: 36, prod2025: 1020, sante: 'good', flore: 'Lavande, romarin', lastVisit: '29 avr.' },
];

const INTERVENTIONS = [
  { id: 1, date: '2 mai', heure: '06:30', rucher: 'R01', ruche: 'V-014', type: 'Visite de printemps', etat: 'planned' },
  { id: 2, date: '2 mai', heure: '07:15', rucher: 'R01', ruche: 'V-018', type: 'Visite de printemps', etat: 'planned' },
  { id: 3, date: '3 mai', heure: '06:00', rucher: 'R03', ruche: 'V-021', type: 'Pose de hausse', etat: 'planned' },
  { id: 4, date: '4 mai', heure: '17:00', rucher: 'R02', ruche: '—', type: 'Traitement varroa', etat: 'planned' },
  { id: 5, date: '30 avr.', heure: '06:45', rucher: 'R04', ruche: 'V-009', type: 'Visite sanitaire', etat: 'done', notes: 'Couvain compact, 6 cadres' },
  { id: 6, date: '28 avr.', heure: '07:00', rucher: 'R01', ruche: 'V-002', type: 'Récolte miel printemps', etat: 'done', notes: '14,2 kg' },
];

const ALERTES = [
  { sev: 'bad', t: 'Rucher Sorgue · 3 ruches affaiblies', d: 'Dernière visite : il y a 17 jours', age: '2 h' },
  { sev: 'warn', t: 'Stock cires gaufrées sous le seuil', d: 'Reste 8 plaques · seuil 20', age: '5 h' },
  { sev: 'warn', t: 'Risque d\'essaimage · Ventoux Sud', d: '4 cellules royales détectées', age: '1 j' },
  { sev: 'info', t: 'Météo : gel possible nuit du 4 mai', d: 'Sault, Buoux — minimum -2 °C', age: '1 j' },
];

const METEO_7J = [
  { jour: 'Sam', d: '02', tmin: 8, tmax: 19, icon: 'sun', pluie: 0, butinage: 92 },
  { jour: 'Dim', d: '03', tmin: 7, tmax: 17, icon: 'cloud', pluie: 0, butinage: 78 },
  { jour: 'Lun', d: '04', tmin: -1, tmax: 14, icon: 'snow', pluie: 0, butinage: 38, alert: true },
  { jour: 'Mar', d: '05', tmin: 4, tmax: 16, icon: 'cloud', pluie: 2, butinage: 55 },
  { jour: 'Mer', d: '06', tmin: 9, tmax: 21, icon: 'sun', pluie: 0, butinage: 95 },
  { jour: 'Jeu', d: '07', tmin: 11, tmax: 24, icon: 'sun', pluie: 0, butinage: 98 },
  { jour: 'Ven', d: '08', tmin: 12, tmax: 22, icon: 'cloud', pluie: 5, butinage: 60 },
];

/* Production mensuelle 2025 — kg de miel */
const PROD_2025 = [
  { m: 'Avr', kg: 420 }, { m: 'Mai', kg: 1180 }, { m: 'Juin', kg: 1840 },
  { m: 'Juil', kg: 2150 }, { m: 'Août', kg: 1320 }, { m: 'Sept', kg: 380 },
];

const STATS = {
  ruches: 248,
  ruchersCount: 7,
  prodAnnee: 6740, // kg
  prodObjectif: 8000,
  ca: 38420, // €
  caEvol: 12,
  intervSemaine: 18,
  alertes: 4,
};

const PROFIL = {
  prenom: 'Marc', nom: 'Lefèvre', initials: 'ML',
  email: 'marc.lefevre@apigo.fr',
  raison: 'Miellerie du Mont Ventoux',
  ville: 'Bédoin (84)',
  plan: 'Pro',
};

window.APIGO_DATA = { TODAY, RUCHERS, INTERVENTIONS, ALERTES, METEO_7J, PROD_2025, STATS, PROFIL, fmtDate };
