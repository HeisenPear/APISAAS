/**
 * Génère docs/ROADMAP.xlsx — tableau de bord du projet APIGO.
 * Exécuter : node scripts/generate-roadmap.mjs
 * À mettre à jour à chaque session de travail.
 */
import ExcelJS from 'exceljs';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT = path.join(__dirname, '..', 'docs', 'ROADMAP.xlsx');

// ─── Palette ──────────────────────────────────────────────────────────────────
const C = {
  honey:      'FFFFA520',
  honeyLight: 'FFFFF3DC',
  dark:       'FF1C1C1E',
  white:      'FFFFFFFF',
  gray:       'FFF5F4F1',
  grayText:   'FF57534E',
  green:      'FF22C55E',
  greenLight: 'FFD1FAE5',
  blue:       'FF3B82F6',
  blueLight:  'FFDBEAFE',
  red:        'FFEF4444',
  redLight:   'FFFEE2E2',
  orange:     'FFF97316',
  orangeLight:'FFFFEDD5',
  sage:       'FF7A9676',
  sageLight:  'FFEEF2EB',
};

function headerStyle(bgColor = C.dark, fontColor = C.white) {
  return {
    font: { bold: true, color: { argb: fontColor }, size: 11 },
    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: bgColor } },
    alignment: { vertical: 'middle', horizontal: 'center', wrapText: true },
    border: {
      bottom: { style: 'medium', color: { argb: C.honey } },
    },
  };
}

function cellStyle(bg = C.white, fontColor = C.dark, bold = false) {
  return {
    font: { color: { argb: fontColor }, size: 10, bold },
    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: bg } },
    alignment: { vertical: 'middle', wrapText: true },
    border: {
      bottom: { style: 'thin', color: { argb: 'FFE7E5E0' } },
      right:  { style: 'thin', color: { argb: 'FFE7E5E0' } },
    },
  };
}

function sectionHeader(ws, text, cols, rowNum) {
  ws.mergeCells(rowNum, 1, rowNum, cols);
  const cell = ws.getCell(rowNum, 1);
  cell.value = text;
  cell.style = {
    font: { bold: true, color: { argb: C.white }, size: 11 },
    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: C.honey } },
    alignment: { vertical: 'middle', indent: 1 },
  };
  ws.getRow(rowNum).height = 22;
}

// ─── Données ──────────────────────────────────────────────────────────────────

const sessions = [
  // [session, date, catégorie, résumé, commit, statut]
  ['Sprint 1–8',  'Oct–Nov 2025', 'Foundation', 'Auth Supabase, Ruchers, Ruches, Interventions, Production, Comptabilité, Alertes, PWA', '—', '✅ Livré'],
  ['Phase 2',     'Nov 2025',     'Cheptel',    '14 catégories interventions, bulk, timeline, données spécialisées', '—', '✅ Livré'],
  ['Phase 3',     'Nov 2025',     'Features',   'Module Reine, Templates interventions, Capacitor config, Analytics basique, export ICS/XLSX', '—', '✅ Livré'],
  ['Phase 4',     'Nov 2025',     'Features',   'Hausses QR code, Organisations multi-exploitation, Campagnes (schéma DB)', '—', '✅ Livré'],
  ['Sprint UX',   'Nov 2025',     'UX',         'DataBus event bus, redirections intelligentes, pré-remplissage cross-module', '—', '✅ Livré'],
  ['Sprint Abo',  'Déc 2025',     'Business',   'Feature gating 4 plans (decouverte/starter/pro/expert), admin bypass, trial Pro 60j', '—', '✅ Livré'],
  ['Beta 02',     'Déc 2025',     'Qualité',    'Sécurité 10/10, perf ECharts/Leaflet, Vercel analytics', '—', '✅ Livré'],
  ['Beta 03',     'Déc 2025',     'Qualité',    'error.vue, WelcomeBanner, FeedbackButton, Sentry, Plausible, trial auto inscription', '—', '✅ Livré'],
  ['Session 25',  'Avr 2026',     'Business',   'Factur-X XML 2026, UX Ventes améliorée, messages erreurs API en français', '—', '✅ Livré'],
  ['Session 26',  '1 Mai 2026',   'Mobile/Auth','Landing mobile-first, auth persistante PKCE, refonte Paramètres éditorial', '—', '✅ Livré'],
  ['Session 27',  '2 Mai 2026',   'Cheptel',    'Transhumance (plans, emplacements, floraisons) + Élevage reines (lignées, greffage, tests perf) — 7 tables, 25 routes, 5 pages', '—', '✅ Livré'],
  ['Session 28',  '2 Mai 2026',   'Design/UX',  '"Warm Precision v2" sur toutes les pages, Onboarding 7 étapes, Tutoriels interactifs, Guide page', '—', '✅ Livré'],
  ['Session 29',  '3 Mai 2026',   'Qualité',    'CI lint 0 erreurs, redesign Login split-screen (layout: false), 21 erreurs ESLint résolues', '—', '✅ Livré'],
  ['Session 30',  'Mai 2026',     'Qualité',    'ESLint 0 erreurs/warnings, fix auth inscription Supabase PKCE', '213571b', '✅ Livré'],
  ['Session 31',  '12 Mai 2026',  'Business',   'Bons de livraison (6 routes, 2 pages, form), traçabilité miel ventes+factures, stats par variété', '—', '✅ Livré'],
  ['Session 32',  '13 Mai 2026',  'Qualité',    'Système photos (4 routes, UiPhotoUploader, 4 buckets Supabase Storage), cron alertes, PWA icons, corrections design', '7268e3d', '✅ Livré'],
  ['Session 33',  'Mai 2026',     'Mobile',     'Mobile UI fixes, admin delete profil cascade, activer-essai redesign, Vite build fix, Nitro routing fix', '1b8c8c5', '✅ Livré'],
  ['Session 34',  'Mai 2026',     'Bug fixes',  'Détail interventions Phase 2 (donnees camelCase), timeline récolte links, réactivité DataBus, stocks 100% miel', '—', '✅ Livré'],
  ['Session 35',  'Mai 2026',     'Mobile',     'PWA iOS : safe area notch, offline auto-redirect, dashboard compact, suppression bulles flottantes, viewport max-scale=1', '—', '✅ Livré'],
  ['Session 36',  '26 Mai 2026',  'Perf/Plans', 'Lazy loading 12 pages, plans Pro/Expert, landing sans bêta, ESLint clean', '09ed520', '✅ Livré'],
  ['Session 37',  '2 Juin 2026',  'Mobile/UX',  'Sync PRs #19–24, pricing miel uniforme, delete optimiste, NuxtLoadingIndicator, retour header mobile, tab bar, + 48px', '90946c9', '✅ Livré'],
  ['Session 38',  '3 Juin 2026',  'Analytics',  'PR #25 : evenements_activite, plugin activity-tracker, admin dashboard analytics, calendrier mobile Apple, PWA fixes', '049d347', '✅ Livré'],
  ['Session 39',  '4 Juin 2026',  'Push/Infra', 'PR #26 Web Push : PushToggle, useWebPush, push-sw.js, 3 routes /api/push/, santeScore étendu + 56 tests — VAPID vars Vercel', 'f281d92', '✅ Livré'],
  ['Session 40',  '6 Juin 2026',  'Bug fixes',  'PostHog consent SSR fix, 4 bugs PWA (tooltip, menu gauche, swipe, retour), BottomNav in-flow --app-height, alertes refonte (resolvedAt + autoResoudre + notif prefs), sidebar comme menu mobile', '03d52f4', '✅ Livré'],
  ['Session 41',  '7 Juin 2026',  'Qualité',    'Check-up code complet (typecheck/lint/56 tests verts). Fix bruit console prod : /api/alertes/generate fail-safe + casts JSON sûrs (plus de 500), reverse-proxy PostHog first-party /relay-h7q (anti ad-block, zéro DNS) + sanitisation clé phc_, suppression Plausible (redondant), AnalyticsConsent en <ClientOnly> (fix hydration mismatch)', 'ae41471', '✅ Livré'],
];

const roadmap = [
  // [priorité, catégorie, tâche, description, effort, statut]
  ['🔴 P1', 'Tests', 'Tests E2E Playwright', 'Smoke test en place (tests/e2e/smoke.spec.ts). Reste : parcours critiques auth / création ruche / intervention / paiement. Objectif coverage > 80%.', 'L', '🟡 En cours'],
  ['🔴 P1', 'Business', 'Stripe abonnements réels', 'FAIT : Checkout, Portail facturation (portal), trial-checkout, webhook (5 events : checkout.completed, subscription.updated/deleted/trial_will_end, payment_failed). Reste : tests de bout en bout en mode live.', 'L', '✅ Livré'],
  ['🔴 P1', 'Qualité', 'Monitoring erreurs prod', 'Sentry initialisé en prod (plugins/sentry.client.ts) + capture_exceptions PostHog. Reste : alertes Slack, dashboard erreurs par version.', 'S', '🟡 En cours'],
  ['🟠 P2', 'Mobile', 'App Capacitor iOS/Android', 'Config Capacitor en place. Reste : build natif, publication App Store + Play Store, push notifications natives, biométrie.', 'XL', '⬜ À faire'],
  ['🟠 P2', 'Cheptel', 'IA santé des abeilles', 'Score santé par règles métier déjà actif (computeScore + alertes sante_critique). Reste : ML léger / prédictif, tendances.', 'L', '🟡 En cours'],
  ['🟠 P2', 'Business', 'Multi-exploitation', 'FAIT : tables organisations + membres, routes invitation/acceptation/gestion rôles. Reste : partage fin de ruchers entre membres + UI dédiée.', 'L', '🟡 En cours'],
  ['🟠 P2', 'Conformité', 'Registre DGAL automatique', 'Génération automatique déclaration DGAL, connexion API sanitaire si disponible, export PDF conforme.', 'M', '⬜ À faire'],
  ['🟡 P3', 'Features', 'Rapports périodiques email', 'FAIT : cron weekly-report (KPIs + push admin). + 6 crons actifs (alertes, napi-reminders, trial-expiry/warning, achats-recurrents). Reste : rapport hebdo par utilisateur (Resend HTML).', 'M', '✅ Livré'],
  ['🟡 P3', 'Features', 'Export PDF rapport ruche', 'PDF par ruche ou rucher : historique interventions, courbes santé, production, photos. WeasyPrint ou Puppeteer.', 'M', '⬜ À faire'],
  ['🟡 P3', 'Features', 'Module météo enrichi', 'Prévisions 7j par rucher (Open-Meteo), alertes gel/canicule/vent, intégration calendrier butinage.', 'M', '⬜ À faire'],
  ['🟡 P3', 'UX', 'Onboarding amélioré', 'Wizard 1ère connexion avec création guidée rucher+ruche, import données (CSV), démo interactive.', 'M', '⬜ À faire'],
  ['🟡 P3', 'Analytics', 'Dashboard analytics étendu', 'Entonnoir conversion trial→payant, rétention par cohorte, NPS in-app, export CSV données analytics admin.', 'M', '⬜ À faire'],
  ['🟢 P4', 'Features', 'API publique REST', 'API documentée (Swagger), tokens API par utilisateur, webhooks configurables, intégration IFTTT/Zapier.', 'XL', '⬜ À faire'],
  ['🟢 P4', 'Communauté', 'Espace communauté', 'Forum/fil discussions entre apiculteurs, partage pratiques, marché (essaims/reines), événements locaux.', 'XL', '⬜ À faire'],
  ['🟢 P4', 'Mobile', 'Mode hors-ligne complet', 'Synchro offline-first pour interventions sur le terrain (PouchDB ou service worker cache), merge au retour réseau.', 'L', '⬜ À faire'],
  ['🟢 P4', 'Features', 'Traçabilité DLC/lots miel', 'Numéros de lot automatiques, DLC calculée, étiquettes PDF GS1, QR code traçabilité consommateur.', 'M', '⬜ À faire'],
  ['🟢 P4', 'Business', 'Marketplace fournisseurs', 'Annuaire fournisseurs matériel apicole, commandes groupées, négociation collective via plateforme.', 'XL', '⬜ À faire'],
  ['🔵 P5', 'Qualité', 'Performance Lighthouse 90+', 'Optimisation images (WebP), code splitting poussé, prefetch routes fréquentes, CDN assets.', 'M', '⬜ À faire'],
  ['🔵 P5', 'Qualité', 'Accessibilité RGAA', 'Audit accessibilité, contraste, navigation clavier, lecteurs écran, conformité RGAA niveau AA.', 'M', '⬜ À faire'],
  ['🔵 P5', 'Internationalisation', 'i18n anglais/espagnol', 'Traduction interface, adaptation formats dates/monnaies, SEO multilingue, documentation EN.', 'L', '⬜ À faire'],
];

const stack = [
  ['Frontend', 'Nuxt 3 + Vue 3', 'app/', '✅ Stable', 'Composition API, auto-imports, `<ClientOnly>` pour PWA'],
  ['Backend', 'Nitro (Nuxt)', 'server/api/', '✅ Stable', 'Routes serverless Vercel, middleware auth, rate-limit'],
  ['Base de données', 'Supabase PostgreSQL 16', 'server/database/', '✅ Stable', 'RLS sur toutes les tables, pooler port 6543'],
  ['ORM', 'Drizzle ORM', 'server/database/schema.ts', '✅ Stable', 'SQL-first, TS strict — drizzle-kit KO sur CHECK constraints (workaround psql)'],
  ['Auth', 'Supabase Auth (PKCE)', 'server/api/auth/', '✅ Stable', 'PKCE flow, supabaseAdmin pour register côté serveur'],
  ['Déploiement', 'Vercel', 'vercel.json', '✅ Stable', 'Auto-deploy sur push main, région cdg1, framework nuxtjs'],
  ['CSS', 'Tailwind CSS v4', 'app/assets/css/main.css', '✅ Stable', 'Design system Warm Precision v2, tokens CSS custom props'],
  ['Paiements', 'Stripe SDK', 'server/api/stripe/', '✅ Stable', 'Checkout, Portail, trial-checkout, webhook (5 events) + feature gating 4 plans'],
  ['Emails', 'Resend', 'server/utils/email.ts', '✅ Stable', 'Templates HTML maison, weekly-report — domaine noreply@apigo.fr à vérifier (SPF/DKIM)'],
  ['Push notifs', 'Web Push VAPID', 'server/api/push/', '✅ Stable', '3 routes, push-sw.js, PushToggle.vue — VAPID vars Vercel ✅'],
  ['Analytics', 'PostHog EU', 'plugins/', '✅ Stable', 'Reverse-proxy first-party /relay-h7q (anti ad-block), consentement RGPD, DataBus bridge, admin dashboard — Plausible retiré (redondant)'],
  ['Monitoring', 'Sentry', 'app/plugins/sentry.client.ts', '🟡 Partiel', 'Init prod @sentry/vue@10.x — alertes/dashboard par version à faire'],
  ['Météo', 'Open-Meteo', 'server/api/meteo/', '✅ Stable', 'Gratuit, pas de clé API'],
  ['Cartographie', 'Leaflet + OpenStreetMap', 'app/pages/', '✅ Stable', '<ClientOnly>, import dynamique'],
  ['Graphiques', 'Apache ECharts', 'app/components/', '✅ Stable', 'lazy-loaded, hideTip() sur touchend mobile'],
  ['Mobile/PWA', 'PWA + Capacitor config', 'public/', '🟡 Partiel', 'PWA fonctionnelle, Capacitor configuré mais pas publié store'],
  ['Tests', 'Vitest + Playwright', 'tests/', '✅ 56 tests', '56 unit (pricing, stockMiel, errors, santeScore) + 1 e2e smoke (Playwright) — parcours critiques E2E à étendre'],
  ['Stockage', 'Supabase Storage', 'server/api/photos/', '✅ Stable', '4 buckets privés, URLs signées 7j TTL'],
];

// ─── Génération ────────────────────────────────────────────────────────────────

const wb = new ExcelJS.Workbook();
wb.creator = 'APIGO';
wb.created = new Date();

// ── Sheet 1 : Historique ──────────────────────────────────────────────────────
{
  const ws = wb.addWorksheet('📋 Historique', {
    views: [{ state: 'frozen', ySplit: 3 }],
    properties: { defaultRowHeight: 40 },
  });

  ws.columns = [
    { key: 'session',  width: 14 },
    { key: 'date',     width: 16 },
    { key: 'cat',      width: 18 },
    { key: 'resume',   width: 72 },
    { key: 'commit',   width: 12 },
    { key: 'statut',   width: 12 },
  ];

  // Titre
  ws.mergeCells('A1:F1');
  const title = ws.getCell('A1');
  title.value = '🐝  APIGO — Historique des sessions de développement';
  title.style = {
    font: { bold: true, size: 14, color: { argb: C.white } },
    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: C.dark } },
    alignment: { vertical: 'middle', horizontal: 'center' },
  };
  ws.getRow(1).height = 36;

  // En-têtes colonnes
  const headers = ['Session', 'Date', 'Catégorie', 'Résumé des travaux', 'Commit', 'Statut'];
  ws.getRow(2).values = ['', ...headers];
  ws.getRow(2).height = 28;
  headers.forEach((_, i) => {
    ws.getCell(2, i + 1).style = headerStyle();
  });

  // Lignes
  sessions.forEach(([session, date, cat, resume, commit, statut], idx) => {
    const row = ws.addRow([session, date, cat, resume, commit, statut]);
    row.height = 44;
    const isEven = idx % 2 === 0;
    const bg = isEven ? C.white : C.gray;
    row.eachCell((cell) => { cell.style = cellStyle(bg); });

    // Statut coloré
    const statutCell = row.getCell(6);
    statutCell.style = {
      ...cellStyle(C.greenLight, C.dark, true),
      alignment: { vertical: 'middle', horizontal: 'center' },
    };

    // Session en gras
    row.getCell(1).style = { ...cellStyle(bg), font: { bold: true, size: 10 } };
  });

  // Ligne métriques du code (vérifiées au 7 Juin 2026)
  const metricsRow = ws.addRow(['', '', '', '📊  47 tables DB · 212 routes API · 75 pages · 113 composants · 56 tests unit + 1 e2e', '', '']);
  metricsRow.getCell(4).style = { font: { bold: true, color: { argb: C.honeyDeep ?? C.grayText }, size: 9 } };

  // Ligne mise à jour
  const lastRow = ws.addRow(['', '', '', `Dernière mise à jour : ${new Date().toLocaleDateString('fr-FR')}`, '', '']);
  lastRow.getCell(4).style = { font: { italic: true, color: { argb: C.grayText }, size: 9 } };
}

// ── Sheet 2 : Roadmap ─────────────────────────────────────────────────────────
{
  const ws = wb.addWorksheet('🗺️ Roadmap', {
    views: [{ state: 'frozen', ySplit: 3 }],
    properties: { defaultRowHeight: 40 },
  });

  ws.columns = [
    { key: 'prio',   width: 10 },
    { key: 'cat',    width: 20 },
    { key: 'tache',  width: 32 },
    { key: 'desc',   width: 60 },
    { key: 'effort', width: 10 },
    { key: 'statut', width: 14 },
  ];

  ws.mergeCells('A1:F1');
  const title = ws.getCell('A1');
  title.value = '🗺️  APIGO — Roadmap & Prochaines tâches';
  title.style = {
    font: { bold: true, size: 14, color: { argb: C.white } },
    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: C.dark } },
    alignment: { vertical: 'middle', horizontal: 'center' },
  };
  ws.getRow(1).height = 36;

  const headers = ['Priorité', 'Catégorie', 'Tâche', 'Description', 'Effort', 'Statut'];
  ws.getRow(2).values = ['', ...headers];
  ws.getRow(2).height = 28;
  headers.forEach((_, i) => { ws.getCell(2, i + 1).style = headerStyle(); });

  // Légende effort
  ws.addRow(['Effort : S = 0,5j   M = 1–2j   L = 3–5j   XL = +1 semaine']);
  ws.mergeCells(3, 1, 3, 6);
  ws.getRow(3).height = 18;
  ws.getCell('A3').style = { font: { italic: true, size: 9, color: { argb: C.grayText } }, fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: C.honeyLight } } };

  const prioBg = { '🔴 P1': C.redLight, '🟠 P2': C.orangeLight, '🟡 P3': C.honeyLight, '🟢 P4': C.greenLight, '🔵 P5': C.blueLight };

  roadmap.forEach(([prio, cat, tache, desc, effort, statut]) => {
    const row = ws.addRow([prio, cat, tache, desc, effort, statut]);
    row.height = 48;
    const bg = prioBg[prio] ?? C.white;
    row.eachCell((cell) => { cell.style = cellStyle(bg); });
    row.getCell(1).style = { ...cellStyle(bg), font: { bold: true, size: 10 }, alignment: { vertical: 'middle', horizontal: 'center' } };
    row.getCell(5).style = { ...cellStyle(bg), alignment: { vertical: 'middle', horizontal: 'center' }, font: { bold: true, size: 10 } };
    row.getCell(6).style = { ...cellStyle(bg), alignment: { vertical: 'middle', horizontal: 'center' }, font: { size: 10 } };
  });
}

// ── Sheet 3 : Stack technique ─────────────────────────────────────────────────
{
  const ws = wb.addWorksheet('⚙️ Stack technique', {
    views: [{ state: 'frozen', ySplit: 2 }],
    properties: { defaultRowHeight: 36 },
  });

  ws.columns = [
    { key: 'module',  width: 22 },
    { key: 'techno',  width: 28 },
    { key: 'path',    width: 28 },
    { key: 'etat',    width: 14 },
    { key: 'notes',   width: 58 },
  ];

  ws.mergeCells('A1:E1');
  const title = ws.getCell('A1');
  title.value = '⚙️  APIGO — Stack technique & état des modules';
  title.style = {
    font: { bold: true, size: 14, color: { argb: C.white } },
    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: C.dark } },
    alignment: { vertical: 'middle', horizontal: 'center' },
  };
  ws.getRow(1).height = 36;

  const headers = ['Module', 'Technologie', 'Chemin', 'État', 'Notes'];
  ws.getRow(2).values = headers;
  ws.getRow(2).height = 28;
  headers.forEach((_, i) => { ws.getCell(2, i + 1).style = headerStyle(); });

  stack.forEach(([module, techno, pathStr, etat, notes], idx) => {
    const row = ws.addRow([module, techno, pathStr, etat, notes]);
    row.height = 38;
    const bg = idx % 2 === 0 ? C.white : C.gray;
    row.eachCell((cell) => { cell.style = cellStyle(bg); });
    row.getCell(1).style = { ...cellStyle(bg), font: { bold: true, size: 10 } };

    const etatCell = row.getCell(4);
    if (etat.includes('✅')) etatCell.style = { ...cellStyle(C.greenLight), font: { bold: true, size: 10, color: { argb: 'FF166534' } }, alignment: { vertical: 'middle', horizontal: 'center' } };
    else if (etat.includes('🟡')) etatCell.style = { ...cellStyle(C.honeyLight), font: { bold: true, size: 10, color: { argb: 'FF92400E' } }, alignment: { vertical: 'middle', horizontal: 'center' } };
  });
}

// ── Sheet 4 : Design System ───────────────────────────────────────────────────
{
  const ws = wb.addWorksheet('🎨 Design System', {
    properties: { defaultRowHeight: 28 },
  });

  ws.columns = [
    { key: 'token',   width: 30 },
    { key: 'valeur',  width: 24 },
    { key: 'usage',   width: 52 },
  ];

  ws.mergeCells('A1:C1');
  const title = ws.getCell('A1');
  title.value = '🎨  APIGO — Design System "Warm Precision v2"';
  title.style = {
    font: { bold: true, size: 14, color: { argb: C.white } },
    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: C.dark } },
    alignment: { vertical: 'middle', horizontal: 'center' },
  };
  ws.getRow(1).height = 36;

  const sections = [
    ['COULEURS', [
      ['--honey', '#F5A623', 'Couleur signature APIGO — CTA, accents, indicateurs actifs'],
      ['--honey-soft', '#FEF6E4', 'Fond doux honey — backgrounds highlights'],
      ['--honey-dark', '#D4891A', 'Honey foncé — hover états, texte sur fond clair'],
      ['--honey-deep', '#A86A13', 'Honey profond — labels section, eyebrows'],
      ['--sage', '#7A9676', 'Vert naturel — badges succès, nature'],
      ['--sage-soft', '#EEF2EB', 'Fond sage doux'],
      ['--clay', '#B87959', 'Terre chaude — états warning léger'],
      ['--surface-primary', '#FAFAF8', 'Fond principal — JAMAIS blanc pur'],
      ['--surface-muted', '#F5F4F1', 'Fond atténué — pill nav, inputs disabled'],
      ['--surface-card', '#FFFFFF', 'Fond cartes'],
      ['--surface-sidebar', '#1C1C1E', 'Sidebar sombre Apple style'],
      ['--text-primary', '#1C1C1E', 'Texte principal'],
      ['--text-secondary', '#57534E', 'Texte secondaire'],
      ['--text-tertiary', '#A8A29E', 'Texte tertiaire / placeholder'],
      ['--border-default', 'rgba(214,211,209,0.6)', 'Bordure par défaut'],
      ['--border-hover', 'rgba(214,211,209,0.9)', 'Bordure au hover'],
    ]],
    ['TYPOGRAPHIE', [
      ['Titre page', 'text-[26px] font-semibold tracking-[-0.02em]', 'Style SF Pro Display — h1 des pages'],
      ['Label section', 'text-[11px] font-semibold uppercase tracking-[0.12em] text-[--honey-deep]', 'Eyebrow / catégorie'],
      ['Corps', 'text-[15px]', 'Texte courant'],
      ['Caption', 'text-[13px] text-[--text-secondary]', 'Labels, légendes'],
      ['Badge', 'text-[11px] font-semibold', 'Statuts, tags'],
    ]],
    ['COMPOSANTS', [
      ['Cards', 'rounded-[14px] border border-[--border-default] bg-white p-5 hover:-translate-y-0.5 hover:shadow-md', 'Cartes standard avec micro-interaction'],
      ['Tables', 'bg-white border border-[--border-default] rounded-[12px] overflow-hidden', 'Tables de données'],
      ['Pill nav', 'rounded-[10px] border border-[--border-default] bg-[--surface-muted] p-0.5', 'Navigation par onglets'],
      ['Inputs', 'h-11 rounded-[10px] border border-[--border-default] bg-white px-4 text-[15px]', 'Champs de saisie'],
      ['Focus ring', 'box-shadow: 0 0 0 3px color-mix(in srgb, var(--honey) 15%, transparent)', 'Focus accessibility'],
      ['Radius', '8–16px (8px boutons, 12px tables, 14px cards, 16px modales)', 'Système de rayons'],
      ['Animations', '250ms ease-out-expo sur TOUT', 'Fluide et natif'],
    ]],
  ];

  let currentRow = 2;
  sections.forEach(([sectionTitle, rows]) => {
    sectionHeader(ws, `  ${sectionTitle}`, 3, currentRow);
    currentRow++;

    const headers = ['Token / Élément', 'Valeur', 'Usage'];
    ws.getRow(currentRow).values = headers;
    ws.getRow(currentRow).height = 24;
    headers.forEach((_, i) => { ws.getCell(currentRow, i + 1).style = headerStyle(C.honey, C.dark); });
    currentRow++;

    rows.forEach(([token, val, usage], idx) => {
      const row = ws.getRow(currentRow);
      row.values = [token, val, usage];
      row.height = 28;
      const bg = idx % 2 === 0 ? C.white : C.honeyLight;
      row.eachCell((cell) => { cell.style = cellStyle(bg); });
      row.getCell(1).style = { ...cellStyle(bg), font: { bold: true, size: 10, name: 'Courier New' } };
      currentRow++;
    });
    currentRow++;
  });
}

// ── Écriture du fichier ───────────────────────────────────────────────────────
await wb.xlsx.writeFile(OUTPUT);
console.warn(`✅  Fichier généré : ${OUTPUT}`);
