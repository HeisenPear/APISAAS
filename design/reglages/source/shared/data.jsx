/* Mocked profile data shared across all variations */
const MOCK_PROFIL = {
  prenom: 'Marc',
  nom: 'Lefèvre',
  email: 'marc.lefevre@apigo.fr',
  telephone: '06 24 18 73 92',
  initials: 'ML',
  plan: 'pro',
  napi: 'NAPI 84-219',
  raison: 'Miellerie du Mont Ventoux',
  adresse: '142 chemin des Cigales',
  codePostal: '84410',
  ville: 'Bédoin',
  siret: '83217409600018',
  optionTvaDebits: true,
  ruches: 248,
  ruchers: 7,
  miellerie: 'Atelier Lefèvre',
};

const MOCK_PREFS = {
  alertesStock: true,
  rappelsInterventions: true,
  alertesMeteo: true,
  digestHebdo: false,
  alertesEssaim: true,
  pushMobile: true,
};

const PLANS = {
  decouverte: { label: 'Découverte', accent: '#a8a29e' },
  starter:    { label: 'Starter',    accent: '#5b8def' },
  pro:        { label: 'Pro',        accent: '#d4891a' },
  expert:     { label: 'Expert',     accent: '#7b5cd6' },
};

window.MOCK_PROFIL = MOCK_PROFIL;
window.MOCK_PREFS = MOCK_PREFS;
window.PLANS = PLANS;
