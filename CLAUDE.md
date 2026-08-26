# CLAUDE.md — APIGO

## Projet

SaaS français de gestion apicole tout-en-un. Du rucher à la comptabilité.

## Stack — RÈGLE ABSOLUE

- **1 langage** : TypeScript (front + back + tests)
- **1 repo** : Nuxt 3 monorepo (Nitro pour l'API serverless)
- **1 déploiement** : Vercel (`git push` → auto-deploy)
- **ZÉRO Laravel, ZÉRO PHP, ZÉRO serveur dédié**

## Technos

- Nuxt 3 (Vue 3 + Nitro) — full-stack
- Supabase — PostgreSQL + Auth + Storage + Realtime
- Drizzle ORM — SQL-first, TypeScript strict
- Stripe SDK — abonnements
- Brevo — emails transactionnels
- Open-Meteo — météo gratuite
- Leaflet + OpenStreetMap — cartographie
- Apache ECharts — graphiques
- Capacitor — mobile natif (phase 3)

## Design

**"Warm Precision"** — style Apple.

- Couleur signature : Honey #F5A623
- Fonds : blanc cassé chaud #FAFAF8 (JAMAIS blanc pur)
- Sidebar : noir Apple #1C1C1E
- Typo : SF Pro (fallback système)
- Radius : 8-16px
- Animations fluides sur TOUT (250ms ease-out-expo)
- Détail complet : `docs/claude prompt/CLAUDE_CODE_PROMPT.md` §3 (hors dépôt, cf. ci-dessous)
- Référence design→code de la refonte Maya : `design/maya/` (maquettes, handoff, logos)

## Conventions

- TypeScript strict (zéro `any`, zéro `@ts-ignore`)
- Composants < 200 lignes
- Routes API < 50 lignes
- Validation Zod sur TOUS les inputs
- RLS Supabase sur TOUTES les tables
- Skeleton loaders sur tous les chargements
- Empty states sur toutes les listes vides
- Tailwind CSS uniquement (pas de CSS scopé)
- Commits conventionnels (feat: fix: docs: refactor: test:)

## Agents IA

| Agent                | Rôle                                         |
| -------------------- | -------------------------------------------- |
| @spec-orchestrator   | Coordination, specs, ADRs, quality gates     |
| @nitro-api-architect | Routes API Nitro, middlewares, intégrations  |
| @nuxt-frontend       | Pages, composants, design system, animations |
| @database-optimizer  | Schéma Drizzle, RLS, index, requêtes perf    |
| @test-engineer       | Tests Vitest + Playwright, coverage > 80%    |
| @security-auditor    | RLS, validation, OWASP, RGPD, rate-limit     |
| @code-reviewer       | Review, performance, documentation, deploy   |

## Specs complètes

**Lire `docs/claude prompt/CLAUDE_CODE_PROMPT.md`** — contient TOUT : schéma DB, API,
modules, design system, workflow.

⚠️ `docs/` est dans le `.gitignore` : ces specs vivent sur la machine, pas dans le
dépôt. Un agent qui travaille sur un clone frais ne les a PAS — il doit se fier au
code, aux tests et à `design/maya/`.

## Scripts

```bash
npm run dev          # Dev server
npm run build        # Build production
npm run lint         # ESLint
npm run typecheck    # TypeScript check
npm run test         # Vitest
npm run test:e2e     # Playwright
npm run db:push      # Push schema Drizzle → Supabase
npm run db:seed      # Seed données de démo
npm run db:studio    # Drizzle Studio (GUI DB)
```

---

# ⚑ RÈGLES PERMANENTES — à relire au début de chaque session

Ce bloc existe parce que le contexte d'une conversation se compacte et se perd.
Tout ce qui suit a été appris **à la dure, dans ce dépôt**, et chaque règle est
là parce que son absence a déjà coûté quelque chose. Elles ne sont pas des
préférences de style : ce sont des garde-fous.

## 1. Comment on travaille ensemble

### Ce qui est INTERDIT sans accord explicite

- **Ne jamais pousser sur `main`.** `main` est la production, avec de vrais
  clients qui paient derrière. Le développement se fait sur la branche désignée
  (aujourd'hui `claude/project-status-review-p5c3eg`), on y pousse librement, et
  on ouvre une PR en brouillon. Le passage en production est **une décision de
  l'apiculteur, jamais la mienne**.
- **Ne jamais écrire dans la base sans autorisation.** `.env` porte la base de
  **PRODUCTION** — pas une base de test. `scripts/garde-base.ts` bloque
  `db:push` et `db:seed` sans `APIGO_AUTORISE_ECRITURE_BASE=oui`. Le nom
  « test » dans un fichier d'environnement ne garantit rien : le seul `.env.test`
  ayant existé pointait la même base que `.env`.
- **Le déploiement preview tape aussi la base de PRODUCTION.** Un e2e qui écrit
  écrit chez de vrais clients. D'où : objets préfixés `E2E — `, nettoyés en
  `afterEach`.

### Ce qui est ATTENDU

- **Travailler à fond.** Pas de version courte, pas de « je pourrais aussi… ».
  On va au bout : le défaut, sa cause, la correction, le banc qui l'empêche de
  revenir, et la vérification complète.
- **Commiter tôt et pousser souvent.** Le conteneur d'exécution se réinitialise
  **sans prévenir** — c'est arrivé cinq fois en une journée, emportant à chaque
  fois du travail non poussé. Rien n'est acquis tant que ce n'est pas sur
  `origin`.
- **Dire ce qui n'a pas été fait.** Un travail livré à 90 % avec les 10 %
  nommés vaut mieux qu'un travail annoncé complet. Compter ce qui reste, dans
  un banc si possible.
- **Corriger ses propres affirmations.** Si une analyse antérieure était fausse,
  le dire simplement et continuer. Plusieurs diagnostics de cette session se
  sont révélés inexacts à la relecture du code ; les taire aurait été pire que
  l'erreur.

### Les décisions qui ne m'appartiennent pas

Ne jamais trancher seul : le **catalogue de plans** (ce que chaque formule
offre), la **véracité commerciale** d'une comparaison avec un concurrent, le
**registre de langue** du produit, et tout ce qui **bloquerait un compte
existant**. On expose le choix, on recommande, on attend.

## 2. La discipline des bancs

> **Un banc qu'on n'a pas vu ROUGE ne prouve rien.**

C'est LA règle. Dans cette seule session, elle a démasqué une dizaine de tests
qui ne mesuraient rien — dont plusieurs écrits quelques minutes plus tôt.

### La boucle obligatoire

1. Écrire le banc.
2. **Casser le code qu'il garde** (mutation) et vérifier qu'il devient rouge.
3. Restaurer, vérifier qu'il redevient vert.
4. Seulement alors, y croire.

⚠️ **COMMITER AVANT DE MUTER.** Un harnais de mutation qui restaure avec
`git checkout -- <fichier>` écrase le travail **non committé** du même fichier.
Ça s'est produit deux fois : des corrections entières perdues, à retaper.

### Les six formes de faux vert rencontrées ici

| Forme                                      | Exemple réel                                                                                                                     | Parade                                                                                 |
| ------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| **Le banc s'accuse lui-même**              | Une règle interdisant « probable à 78 % » trouvait la chaîne dans le commentaire qui EXPLIQUE la correction. Tombé **six fois**. | Blanchir les commentaires (`tests/helpers/sansCommentaires.ts`, `corpsDuComposant.ts`) |
| **Le mot au lieu de l'appel**              | `expect(source).toContain('annulationAutorisee')` restait vert quand on retirait l'appel : la chaîne survivait dans l'`import`.  | Viser le **corps de la fonction**, ou observer le comportement                         |
| **Le balayage vide**                       | Un chemin erroné rend la liste vide, donc la conformité « vérifiée ».                                                            | Un cas **garde-fou** en tête de chaque banc : « le balayage voit bien les fichiers »   |
| **La couverture qui s'arrête juste avant** | Le banc de gating testait `client`, `recolte`, `stock` — pas `vente`, la seule dont le plafond était cassé.                      | Itérer sur la **source de vérité**, jamais sur une liste recopiée                      |
| **La liste qui rétrécit en silence**       | Réduire un balayage « exhaustif » à deux cas ne déclenchait rien.                                                                | Exiger que la liste **soit** le catalogue, pas un extrait                              |
| **Le chiffre promis, pas mesuré**          | « J'ai défait les N actions » comptait le journal, pas les suppressions.                                                         | Faire **répondre** les fonctions (`Promise<number>`, pas `void`)                       |

### Écrire un banc ici

- Toujours un cas **garde-fou** en premier.
- Les messages d'échec expliquent **pourquoi c'est grave**, pas seulement ce qui
  diffère. Le lecteur sera quelqu'un qui n'a pas le contexte.
- Les commentaires disent **quel défaut réel** a produit ce banc. Un banc sans
  histoire finit par être supprimé comme du bruit.
- Un banc qui **ne peut pas atteindre** une branche l'annonce et la force
  (`vi.mock`) plutôt que de la laisser non traversée.
- Ce dépôt **compile** plutôt que de deviner : `espaceAutourDesBr.test.ts` passe
  les gabarits au vrai compilateur Vue au lieu d'une expression régulière.

### Les helpers de test

| Fichier               | À quoi il sert                                                                                                                                   |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `sansCommentaires.ts` | Blanchit les commentaires en conservant les numéros de ligne                                                                                     |
| `corpsDuComposant.ts` | Pour un `.vue` : découpe par section — le texte français est plein d'apostrophes droites qu'un analyseur de chaînes JS prend pour des ouvertures |
| `fauxDb.ts`           | Double de base : n'interprète pas le SQL, **enregistre les conditions** — c'est ce qui vérifie l'isolation entre exploitations                   |
| `simulateurRuche.mts` | Données de colonie pour les bancs de décision                                                                                                    |

## 3. Dériver, jamais recopier

**La source de la majorité des défauts de ce dépôt.** Deux tables qui décrivent
la même règle finissent toujours par diverger — et c'est la divergence, pas la
règle, qui ouvre les trous.

- `ActionId`, les domaines RBAC, les libellés d'action, l'énumération Zod de la
  route et le miroir client dérivent tous de **`app/config/maya-actions.ts`**.
  Il ne contient **que des données** : aucune fonction, aucun import de serveur —
  c'est ce qui lui permet de traverser la frontière client/serveur.
- Les types d'intervention dictables dérivent de `SLOTS_PAR_TYPE`.
- Le gating de Maya **lit** `ROUTE_GATES` via la route équivalente.
- Les compteurs de plafond sont partagés (`server/utils/compteursDePlan.ts`)
  entre le middleware, la porte de Maya **et la jauge d'abonnement**.
- Les chiffres montrés au client se **calculent** : « 13 types d'intervention »
  vient de `CATEGORIES_INTERVENTION.length`, jamais d'un littéral.

### Deux corollaires durement acquis

> **Un type qui se dérive de la liste qu'il est censé garder ne garde rien.**
> `ActionGatee = keyof typeof ROUTE_EQUIVALENTE` : oublier une action ne
> produisait aucune erreur — elle devenait simplement **non gatée**.

> **`null`, `default:` et « inconnu » ne doivent JAMAIS valoir « laisse
> passer ».** Un `default: return 0` sur un compteur de plafond = plafond
> jamais appliqué, en silence. Devant une porte qu'on ne sait pas mesurer, on
> refuse — avec une porte de sortie.

## 4. Les pièges de ce dépôt

### Vue / CSS

- **`whitespace: 'condense'` SUPPRIME** (ne condense pas) un nœud de texte
  purement blanc situé **entre deux éléments** et contenant un saut de ligne.
  `Votre rucher<br /><span>dans…` → les mots se touchent. Correctif : `{{ ' ' }}`.
- Une piste de grille `1fr` ne descend jamais sous la largeur intrinsèque de son
  contenu → `minmax(0, 1fr)`.
- `shrink-0` sur le bloc **secondaire** d'une rangée flex reporte toute la
  contrainte sur le texte, ou le fait déborder.
- Convention affichée « Tailwind uniquement », mais les chapitres de `/maya`
  sont en **CSS scopé** de bout en bout. Suivre le style **du fichier** qu'on
  touche.

### Temps et fuseau

- Les lambdas Vercel tournent en **UTC**. Tout `getMonth()` / `getHours()` posé
  sur un `Date` lit l'heure du **serveur**. Passer par
  **`server/utils/horloge.ts`** — c'est sa raison d'être.
- Les **crons Vercel ne tournent QUE sur le déploiement de production**. Une
  fonctionnalité planifiée ne s'observe pas en preview.

### Base de données

- Toutes les clés étrangères des tables satellites d'intervention sont en
  **`ON DELETE SET NULL`** : supprimer une intervention **détache** les lignes
  filles, il ne les supprime pas. D'où `server/utils/annulationRegle.ts` — seuls
  `controle`, `nourrissement` et `commentaire` n'écrivent que dans le hub, donc
  seuls ceux-là sont annulables.

### Outillage

- `page.addStyleTag` **pend indéfiniment** quand `javaScriptEnabled: false` —
  utiliser `page.evaluate`.
- `requestAnimationFrame` ne se résout jamais en headless sans JS.
- `pkill -f '<motif>'` fait correspondre **sa propre ligne de commande** et
  s'auto-tue. Tuer par PID.
- L'audit de mise en page mesure le **contenu** (plages de texte, éléments
  atteignables), pas les boîtes : un décor `position:absolute` gonfle un
  `scrollWidth` sans rien couper.

## 5. Ce qui ne se négocie pas côté produit

- **Ne jamais bloquer sans porte de sortie.** Tout refus nomme la formule qui
  débloque et dit où changer (Réglages › Abonnement). Un refus qui s'arrête au
  « non » laisse l'apiculteur devant un mur.
- **Le refus est une PHRASE, jamais un code.** Et jamais un identifiant
  technique : « 10 factures ce mois-ci », pas « 10 facturesParMois ».
- **Rien ne s'écrit sans accord**, sauf ce qui sait se défaire entièrement.
  `auto ⟹ annulable`, vérifié par un banc.
- **Zéro appel à un modèle de langage.** C'est l'engagement affiché en grand sur
  `/maya` ; `tests/unit/zeroModeleDeLangage.test.ts` ferme la dépendance ET
  l'adresse.
- **Le gating marche dans les DEUX sens** : ce que le plan inclut doit passer,
  ce qu'il exclut doit être refusé. Tester un seul sens ne prouve rien.
- **`rucherdemael@gmail.com`** (Pro, sans Stripe) est un **cadeau commercial
  délibéré** — aucun script de correction ne doit le « réparer ».

## 6. Vérifier avant de dire que c'est fait

```bash
npm run lint                 # 0 erreur (quelques avertissements no-console tolérés)
npm run typecheck
npm run test                 # ~1 900 bancs unitaires
npm run mesurer:maya         # corpus + perturbateur, avec leurs cliquets
npm run controle:sonde       # la sonde de mise en page se teste elle-même
npm run build:e2e
PLAYWRIGHT_CHROMIUM_PATH=/opt/pw-browsers/chromium-1194/chrome-linux/chrome \
  npm run audit:mise-en-page # 273 scénarios — 79 pages × plusieurs largeurs
PLAYWRIGHT_CHROMIUM_PATH=… npx playwright test --project=chromium
```

Le corpus de Maya se lit en deux temps : **`mayaCorpus`** mesure ce qu'elle
comprend (planchers par famille, cliquet auto-serrant, anti-corpus à zéro dur),
**`mayaPerturbations`** mesure ce qu'elle tient quand la phrase est abîmée. Le
second existe parce que le premier, écrit à la main, finissait par se mesurer
lui-même : il affichait 102/102 pendant qu'une simple inversion de deux lettres
faisait tomber 54 % des questions.
