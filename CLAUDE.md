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

## 2. La carte du dépôt — les sources de vérité

`docs/` est hors du dépôt : sur un clone frais, **le code est la seule
documentation**. Voici où sont les décisions, pour ne pas les réinventer ailleurs.

### Ce qui fait autorité (`app/config/`)

Ces fichiers ne contiennent que des **données** — pas de fonction, pas d'import
de serveur. C'est ce qui leur permet d'être lus des deux côtés de la frontière.

| Fichier                                     | Autorité sur                                                                                                        |
| ------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `plans.ts`                                  | Les quatre formules, leurs `features`, leurs `limites`, le catalogue commercial. **Intouchable sans accord.**       |
| `route-gates.ts`                            | Quelle route exige quelle feature, quel plafond. Le gating de Maya **lit** cette table.                             |
| `roles.ts`                                  | RBAC de l'espace de travail (`rolePeutEcrire`, `DOMAINES_ECRITURE`)                                                 |
| `maya-actions.ts`                           | Le catalogue des actions d'écriture de Maya. Tout en dérive : `ActionId`, domaines, énumération Zod, miroir client. |
| `navigation.ts` · `widgets.ts`              | La barre latérale et le tableau de bord configurable                                                                |
| `medicaments-apicoles.ts` · `floraisons.ts` | Référentiels métier                                                                                                 |

`app/types/interventions.ts` porte `CATEGORIES_INTERVENTION` (les **treize**
gestes) et `CATEGORIES_META` (leurs libellés d'interface).

`app/composables/porteDeRejeu.ts` porte les **portes de rejeu** : trois
séquences ne se montrent qu'une fois (le film d'onboarding, la présentation de
Maya, les notes de patch), et l'équipe doit pouvoir les relire.

| URL                             | Ce qu'on revoit                  |
| ------------------------------- | -------------------------------- |
| `/onboarding?rejouer`           | le film d'ouverture              |
| `/dashboard?rejouer=maya`       | la présentation de Maya          |
| `/dashboard?rejouer=patch`      | les notes de patch               |
| `?rejouer=tout` (ou `?rejouer`) | tout ce que la page sait rejouer |

Deux propriétés, tenues par `tests/unit/app/composables/porteDeRejeu.test.ts` :
**réservée à l'équipe** (`isAdmin`) et **sans écriture** — porte ouverte,
`marquerVu()` / `marquerVue()` ne gravent rien. Sans ça, relire une annonce la
consomme et on ne peut plus jamais vérifier ce que voit un apiculteur au premier
passage. C'est la transposition du mode `apercu` d'`onboarding.vue`, qui existe
parce que revoir l'intro depuis son propre compte y créait un second rucher.
Il faut **recharger la page** avec le paramètre : les deux séquences se décident
au montage.

### Le moteur de Maya (`server/utils/copilote-*`)

Déterministe, sans réseau sortant. Le découpage compte :

| Module                     | Rôle                                                                                                                                                     |
| -------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `copilote-local.ts`        | Le chef d'orchestre : classification d'un tour, détection d'intention, recherche de savoir, réponses                                                     |
| `copilote-actions.ts`      | Analyse d'une phrase en écriture, aperçu, primitives transactionnelles, slots du remplissage guidé                                                       |
| `copilote-executeur.ts`    | Les plans (lots et séquences) et leur annulation                                                                                                         |
| `copilote-savoir.ts`       | 117 fiches de connaissance apicole, purement statiques                                                                                                   |
| `copilote-gating.ts`       | Les portes de plan, en lecture ET en écriture                                                                                                            |
| `copilote-orthographe.ts`  | Correcteur de première ligne, sur lexique **curé**                                                                                                       |
| `copilote-repercussion.ts` | Ce qu'une écriture fait bouger à l'écran. **Sans arête vers la base**, pour que le banc de route puisse doubler `copilote-actions` sans doubler la règle |
| `annulationRegle.ts`       | La règle unique d'annulation, partagée par les deux chemins                                                                                              |
| `compteursDePlan.ts`       | Les compteurs d'usage, partagés par le middleware, Maya et la jauge                                                                                      |
| `horloge.ts`               | **La seule source de vérité du fuseau.** Tout calcul de date passe par là.                                                                               |
| `recurrence.ts`            | L'échéance suivante d'une charge récurrente, ancrée au jour d'origine                                                                                    |
| `numerotation.ts`          | **Les quatre séquences numérotées** (FA, AC, BL, hausses) — une seule mécanique                                                                          |
| `santeScore.ts`            | Le score de colonie 0–100, avec ses seuils nommés                                                                                                        |

### Les instruments de mesure (`scripts/` + `tests/`)

| Outil                                            | Ce qu'il tient                                                                             |
| ------------------------------------------------ | ------------------------------------------------------------------------------------------ |
| `scripts/audit-mise-en-page.mjs`                 | 273 scénarios : débordements, contrastes, libellés, hiérarchie de titres                   |
| `scripts/sonde-mise-en-page.mjs`                 | La sonde elle-même, extraite pour être testable                                            |
| `scripts/controle-sonde.mjs`                     | Six cas fabriqués : la sonde voit ce qu'elle doit voir, **et rien d'autre**                |
| `scripts/garde-base.ts`                          | Empêche `db:push` / `db:seed` de toucher une base distante sans autorisation               |
| `tests/corpus/mayaQuestions.mts`                 | 102 questions, huit familles, avec leur réponse ATTENDUE                                   |
| `tests/corpus/perturbations.mts`                 | Dix transformations déterministes du corpus                                                |
| `tests/unit/urlsQrCanoniques.test.ts`            | Les URL imprimées sur un objet physique : hôte canonique, fabrique unique, page qui existe |
| `tests/unit/server/collisionsAutoImport.test.ts` | Aucun nom exporté par deux modules d'un même espace d'auto-import                          |
| `tests/unit/server/argentUneSeuleRegle.test.ts`  | Aucune formule monétaire hors `pricing.ts`, aucun total en champ d'entrée                  |

## 3. La discipline des bancs

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

### Les formes de faux vert rencontrées ici

| Forme                                            | Exemple réel                                                                                                                                                                                                                                                                                          | Parade                                                                                                               |
| ------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| **Le banc s'accuse lui-même**                    | Une règle interdisant « probable à 78 % » trouvait la chaîne dans le commentaire qui EXPLIQUE la correction. Tombé **six fois**.                                                                                                                                                                      | Blanchir les commentaires (`tests/helpers/sansCommentaires.ts`, `corpsDuComposant.ts`)                               |
| **Le mot au lieu de l'appel**                    | `expect(source).toContain('annulationAutorisee')` restait vert quand on retirait l'appel : la chaîne survivait dans l'`import`.                                                                                                                                                                       | Viser le **corps de la fonction**, ou observer le comportement                                                       |
| **Le balayage vide**                             | Un chemin erroné rend la liste vide, donc la conformité « vérifiée ».                                                                                                                                                                                                                                 | Un cas **garde-fou** en tête de chaque banc : « le balayage voit bien les fichiers »                                 |
| **La couverture qui s'arrête juste avant**       | Le banc de gating testait `client`, `recolte`, `stock` — pas `vente`, la seule dont le plafond était cassé.                                                                                                                                                                                           | Itérer sur la **source de vérité**, jamais sur une liste recopiée                                                    |
| **La liste qui rétrécit en silence**             | Réduire un balayage « exhaustif » à deux cas ne déclenchait rien.                                                                                                                                                                                                                                     | Exiger que la liste **soit** le catalogue, pas un extrait                                                            |
| **Le chiffre promis, pas mesuré**                | « J'ai défait les N actions » comptait le journal, pas les suppressions.                                                                                                                                                                                                                              | Faire **répondre** les fonctions (`Promise<number>`, pas `void`)                                                     |
| **La dispense plus large que son motif**         | Un fichier dispensé « pour son découpage hebdomadaire » couvrait aussi un `getFullYear()` corrigeable trois lignes plus haut.                                                                                                                                                                         | Dispenser **par règle**, jamais par fichier ; exiger un motif écrit                                                  |
| **Le harnais qui neutralise la branche**         | `import.meta.client` valait `undefined` sous Vitest : tout composable client renvoyait au **retour anticipé**, jamais la branche livrée.                                                                                                                                                              | Fixer le drapeau dans le harnais, et le muter pour voir le banc rougir                                               |
| **Le message dont la condition est morte**       | Le diagnostic micro durable exigeait un **2ᵉ** échec réseau — mais le 1ᵉʳ est fatal et coupe la relance, et la mémoire repartait à zéro à chaque chargement de page. Jamais affiché.                                                                                                                  | Vérifier que la condition d'escalade est **atteignable**, pas seulement correcte                                     |
| **L'échec rhabillé en réponse polie**            | 17 cas verts pendant que CHAQUE écriture levait : le `catch` de la route poussait un `{type:'error'}`, la boucle d'attente s'en satisfaisait, et les assertions portaient sur un tableau rempli AVANT la levée.                                                                                       | Le harnais **refuse** l'événement d'erreur, sauf cas qui l'attend explicitement                                      |
| **Le double plus permissif que le réel**         | Le faux `SpeechRecognition` livrait des résultats sur une session ARRÊTÉE et ignorait `interimResults` : rendre le micro trop tôt, ou revenir à la config lente, ne faisait rien tomber.                                                                                                              | Le double refuse **ce que le vrai refuserait**, et un cas le vérifie                                                 |
| **La règle pure enfermée dans un module doublé** | Les fonctions de répercussion vivaient dans `copilote-actions.ts`, que le banc de route DOIT doubler (il ouvre la base). Le banc mesurait donc sa propre recopie de la règle.                                                                                                                         | Extraire la règle dans un module **sans arête vers la base** (`copilote-repercussion.ts`)                            |
| **La porte fermée, la valeur oubliée**           | `choisirVoix` refusait bien les voix SERVIES À DISTANCE, et `dire()` refusait de parler sans voix embarquée — mais retirer `enonce.voice = voix` laissait le bloc entier VERT. Or un énoncé sans voix laisse le navigateur choisir : sur Chrome, exactement la voix distante qu'on venait de refuser. | Un banc sur la DÉCISION ne suffit pas : en exiger un sur son EMPLOI — que la valeur retenue soit bien celle qui part |
| **Le garde mort**                                | `reveil ? commande : ''` gardait une branche impossible ; `!mots.length` aussi. Aucune mutation ne les tuait. Un garde mort donne l'illusion d'une protection et **détourne** de celle qui manque.                                                                                                    | Muter le garde : s'il survit, le retirer et garder l'invariant **par un banc**                                       |

> **UN COMPOSANT SE MONTE, ET PERSONNE NE LE FAISAIT.** `@vue/test-utils` et
> `happy-dom` sont installés depuis toujours ; aucun banc ne s'en servait, si bien
> que toute décision vivant dans un `<script setup>` était **hors couverture, sans
> que rien ne le dise**. Le mode vocal en a fait les frais quatre fois de suite :
> Maya parlait dans un micro ouvert et s'entendait se relancer, le bouton
> « Quitter le mode vocal » OUVRAIT le micro, une panne micro laissait un mode
> fantôme, un échec de requête faisait relire la réponse précédente.
> `tests/unit/app/components/boucleVocaleMontee.test.ts` monte la vraie bulle,
> double le NAVIGATEUR (`SpeechRecognition`, `speechSynthesis`) et le transport,
> et garde tout le reste réel. Deux pièges du montage, payés sur place :
> les minuteurs doivent être faux **dès le `beforeEach`** (basculer après ne
> reprend pas la main sur ceux déjà posés), et le réveil doit livrer sa commande
> **au tour suivant** — les deux dans le même tour font passer `transfertVocal`
> de `false` à `false`, et l'observateur ne se déclenche jamais.
>
> Ce qui n'empêche pas de faire descendre une **règle** dans `app/utils/` quand
> elle en est une : `paroleDeLaReponse`, `decisionVocale` y sont mieux mesurées,
> et le composant ne fait plus qu'exécuter.

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

## 4. Dériver, jamais recopier

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

> **Décomposer une expression en jetons PERD l'expression.** « c'est bon »
> découpé en `c` + `est` + `bon` a versé `bon` dans le vocabulaire d'accord :
> « bon alors » — une hésitation, ce qu'on dit en réfléchissant juste avant de
> se taire — validait une écriture en base de production. Même cause que
> « dériver, jamais recopier », vue de l'autre bout : la contrainte de
> co-occurrence ne survit pas au découpage. On canonicalise les **expressions
> entières** d'abord ; n'entre ensuite dans un jeu de mots que ce qui est sans
> ambiguïté **prononcé seul**.

> **Un événement que personne n'écoute est un no-op — le même silence exactement
> qu'un nom mal orthographié.** `emit('alerte:created')` ne levait rien, ne
> rafraîchissait rien, ne traçait rien : aucun abonné. Brancher l'émetteur n'est
> que la moitié du travail ; un banc balaie les abonnements et refuse tout
> événement orphelin.

> **Deux modules ne peuvent pas exporter le même nom.** Nuxt et Nitro
> auto-importent **par nom** : ils en retiennent un, ignorent l'autre, et le
> disent dans un avertissement de build que personne ne lit. Le dépôt en portait
> six, dont deux **déjà divergents** — un `PointGeo` à deux champs contre un à
> trois, un `PushPayload` strict contre un laxiste (c'est le **laxiste** qui
> gagnait). Et un **réexport n'est pas neutre** : `copilote-executeur`
> réexportait trois noms de `annulationRegle`, et c'est donc le module qui fait
> autorité sur l'annulation qui se faisait ignorer. On importe, on ne réexporte
> pas. `collisionsAutoImport.test.ts` refuse désormais toute nouvelle collision.

## 5. Les pièges de ce dépôt

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
  **`server/utils/horloge.ts`** — c'est sa raison d'être. Un banc l'exige
  désormais : `getFullYear`, `getMonth`, `getDay`, `getHours` et `setFullYear`
  sont **refusés dans `server/`** (les variantes `getUTC*` restent permises,
  elles disent dans quel fuseau elles lisent).
- **`setMonth` et `setFullYear` NE BORNENT PAS LE JOUR.** Le 31 mars moins onze
  mois donne « le 31 avril », reporté au 1er MAI. La formule est juste
  vingt-quatre jours sur trente et un — la pire des proportions : jamais
  reproduite à la demande, vue plusieurs fois par an. Trois endroits l'avaient
  écrite. Utiliser `debutDuMoisDecaleParis` (fenêtre) ou `moisDecaleParis`
  (jour constant).
- **Une BORNE et une VALEUR ne se posent pas au même endroit** — la distinction
  a déjà coûté une régression, introduite par un correctif :
  - une **borne** de requête (« depuis le 1er du mois ») se pose à **minuit à
    Paris** (`minuitParis`) : l'apiculteur change de mois à minuit chez lui ;
  - une **valeur date-seule stockée** (une échéance, une date d'intervention) se
    pose à **minuit UTC** (`jourUtc`). Minuit UTC du jour J se relit « jour J »
    des deux côtés ; minuit à Paris se relit « jour J−1 » en UTC. Une échéance
    du 1er du mois posée à minuit à Paris était projetée dans le mois PRÉCÉDENT.
- Les **crons Vercel ne tournent QUE sur le déploiement de production**. Une
  fonctionnalité planifiée ne s'observe pas en preview.
- **Un lot parallèle qui calcule un numéro est un doublon garanti.** Le cron des
  achats récurrents traitait ses échéances par lots de dix : les dix lectures du
  « dernier numéro » partaient avant la première insertion. Ce n'est pas une
  course rare, c'est déterministe — les charges mensuelles sont ancrées au même
  jour. On attribue les numéros AVANT le lot, par apiculteur.

### Dépendances

- **`npm ci` et `npm install` exigent `--legacy-peer-deps` ici.** Sans ce
  drapeau, le résolveur d'npm tombe sur `Cannot read properties of null
(reading 'edgesOut')` — un bug de son propre graphe de dépendances _peer_,
  pas un défaut du projet. La CI l'utilise déjà ; toute commande manuelle doit
  faire pareil, sinon on croit le dépôt cassé alors qu'il ne l'est pas.
- **`vue-tsc` est FIGÉ sur `~3.2.4`, délibérément.** La 3.3 durcit la lecture
  des gestionnaires d'événements et refuse tout handler qui **renvoie une
  valeur** — `@click="x = true"` renvoie `true`. Quatre-vingts erreurs, dans
  quarante fichiers, sur du code qui tourne parfaitement : Vue ignore la valeur
  de retour d'un handler. Vérifié en isolant les deux — Vue 3.5.42 avec
  vue-tsc 3.2.4 donne **zéro** erreur, donc c'est le vérificateur qui a bougé,
  pas le framework. **Relâcher ce fige demande de corriger les 80 sites
  d'abord** ; le faire sans ça rendrait le typecheck rouge et donnerait envie
  de le contourner.
- **Quatre failles restent ouvertes, toutes derrière une montée MAJEURE** :
  `drizzle-orm` (injection SQL par identifiants mal échappés — c'est l'ORM,
  la montée touche toutes les requêtes), `@nuxt/ui` (le formulaire d'auth rendu
  en SSR omet `method`, donc identifiants en GET si soumis avant hydratation),
  `echarts` (XSS), et `exceljs`/`uuid` — dont le « correctif » proposé par npm
  est une **rétrogradation**, à regarder de près avant de le suivre. Ces quatre
  montées ne se font pas à la veille d'une mise en production.

### Cloisonnement entre exploitations

- **La RLS ne protège RIEN côté serveur.** `db.ts` ouvre une connexion
  service-role qui la contourne : l'isolation repose entièrement sur les
  `eq(table.userId, ownerId)` écrits à la main, route par route.
- **La liste des tables cloisonnées se DÉRIVE du schéma.** Elle a été écrite à
  la main, et s'était arrêtée à **28 noms sur 51** — laissant hors couverture
  les mouvements bancaires, `membres`, `auditLog`, les mesures de balance et
  tous les satellites d'intervention. Une table déclarant `userId` est
  cloisonnée par construction ; c'est la seule définition qui ne prend pas de
  retard.
- **Un `insert` et un `select` ne se gardent pas pareil.** `from`, `update` et
  `delete` ont un WHERE : il leur faut un **prédicat** (`eq(x.userId, …)`). Un
  `insert` n'en a pas : c'est la **valeur écrite** qui cloisonne. Confondre les
  deux laisse passer un `where` qui ne filtre que sur l'identifiant de ligne.
- **Chercher `userId` dans un fichier ne prouve rien.** Le mot apparaît dans un
  `set()` (valeur écrite), dans une annotation de type (`userId: string`),
  dans un import. Deux règles de ce dépôt sont tombées dessus, l'une après
  l'autre. Exiger une **forme** : comparaison pour un prédicat, identité à
  droite du deux-points pour une valeur.
- **Une seconde chaîne de propriété existe** : les campagnes groupées passent
  par `organisations.ownerId`, pas par un `userId` de ligne. Elle n'a pas
  encore sa règle.
- **Le contrôle et l'écriture doivent être le MÊME ordre SQL.** `accepter.post.ts`
  vérifiait par un `select` puis écrivait par un `update` filtré seulement sur
  l'identifiant : entre les deux, l'invitation pouvait être révoquée et
  l'acceptation passait quand même. Un seul ordre conditionnel, dont le `where`
  EST le contrôle — la forme que portait déjà sa jumelle `refuser.post.ts`.

### Argent

- **Une seule formule, dans `server/utils/pricing.ts`.** `ligneTotalHt`,
  `ligneTva`, `computeFactureTotals`, `totauxDepuisLignes`. Toute autre
  arithmétique monétaire est un doublon en attente de diverger : le dépôt en
  portait cinq, dont deux fausses.
- **`quantité × prixUnitaire` IGNORE le tarif au poids.** Dix seaux de 25 kg à
  10 €/kg valent 2 500 €, pas 100. C'est « le bug d'origine » nommé dans
  `pricing.ts` — il est revenu **trois fois** par d'autres portes : la saisie
  admin d'une campagne, l'export de campagne, et surtout la **ventilation
  Factur-X**, qui déclarait 100 € de base à côté de totaux de 2 500 €. Une
  ventilation incohérente rend la facture électronique rejetable.
- **Le serveur ne signe jamais un total qu'il n'a pas calculé.** `total` n'est
  un champ d'entrée d'aucun schéma : Zod retire les clés inconnues, donc un
  total envoyé est jeté sans bruit et recalculé. Un `total` accepté puis écrasé
  fait croire au client qu'il le choisit — jusqu'à la route qui oublie de
  l'écraser.
- **L'arrondi se fait PAR LIGNE quand le document affiche un montant par
  ligne** (bon de commande, facture) : ce qui est affiché doit s'additionner à
  ce qui est affiché. Ce n'est pas un détail : les deux portes d'une campagne
  divergeaient d'un centime, et stockaient toutes deux leur version.
- **Deux portes vers le même document doivent appeler la même fonction.**
  `commandeCampagne.ts` pour une commande de campagne (formulaire public et
  saisie admin), `bonLivraison.ts` pour les lignes d'un bon (création et
  édition — leurs deux schémas avaient déjà divergé, et l'édition effaçait
  `modePrix` et `contenance` à chaque passage).
- **Ce qui reste ouvert** : sur une facture à taux **mixtes**, la TVA du
  document (somme puis un seul arrondi) peut différer d'un centime de la somme
  des ventilations arrondies par taux — mesuré à 14,97 contre 14,96. La norme
  veut que le total soit la somme des ventilations. Changer cela change des
  montants sur des factures déjà émises : **décision de l'apiculteur**.

### URL, domaines et QR

- **Une URL imprimée sur un objet physique survit des années à son
  déploiement.** Elle se construit sur `SITE_URL` — jamais sur
  `window.location.origin` (elle porterait l'URL de la preview ou de
  `localhost`), jamais sur `resolveAppOrigin` (même problème côté serveur, et
  la preview écrit dans la base de PRODUCTION), jamais sur un hôte écrit à la
  main. Les QR de hausse pointaient vers un **sous-domaine qui n'a jamais eu
  d'enregistrement DNS** : pas une page d'erreur de l'application, une erreur
  de résolution sur le téléphone, en plein rucher. L'URL était en plus
  **écrite en base**. La même hausse avait deux QR différents selon l'écran
  d'où on l'imprimait.
- La règle était pourtant écrite, juste, et depuis le début — dans le
  **commentaire** d'un seul fichier. Une règle dans un commentaire ne
  s'applique qu'à ce fichier. `app/utils/urlQr.ts` est désormais la seule
  fabrique d'URL de QR du dépôt.
- `resolveAppOrigin` reste correct pour ce qui est **éphémère et par
  déploiement** : retours Stripe, callback bancaire, endpoint d'ingestion.
- **Aucun correctif ne rattrape le papier.** Les étiquettes déjà imprimées
  restent mortes tant que le sous-domaine n'est pas aliasé — décision
  d'infrastructure, pas de code.

### Base de données

- Toutes les clés étrangères des tables satellites d'intervention sont en
  **`ON DELETE SET NULL`** : supprimer une intervention **détache** les lignes
  filles, il ne les supprime pas. D'où `server/utils/annulationRegle.ts` — seuls
  `controle`, `nourrissement` et `commentaire` n'écrivent que dans le hub, donc
  seuls ceux-là sont annulables.

### La voix

- **Un résultat FINAL n'arrive qu'après un silence** : le moteur attend d'être
  sûr. Lire les seuls finals coûtait une à deux secondes avant que la bulle
  s'ouvre. Les **intermédiaires** arrivent en deux à quatre dixièmes — mais ils
  se **révisent** (« salut maya » → « salut mais y a »), et celui qui porte le
  réveil ne porte pas encore la question. D'où deux temps : **ouvrir** sur un
  intermédiaire confirmé, **livrer** sur le final seul, et **garder le micro**
  entre les deux.
- **La fin d'un énoncé n'est PAS le premier résultat final.** Le moteur en clôt
  un à chaque respiration : « j'ai vu la reine… [souffle] …sur le cadre 4 » en
  produit deux. Seul un **silence** après le dernier mot mesure honnêtement la
  fin d'une phrase.
- **L'écoute continue se referme d'elle-même à chaque silence** : c'est son
  fonctionnement normal, pas une panne. Compter ces fermetures faisait mourir la
  dictée après six respirations, en accusant le micro de quelqu'un dont le micro
  venait de marcher. On ne compte que les sessions **mort-nées** (micro jamais
  obtenu, ou moins de 700 ms).
- **Deux reconnaissances sur le même micro : le navigateur en tue une**, sur-le-
  champ. Tout passage de relais entre le réveil et la dictée passe par un
  drapeau du magasin, jamais par « je démarre, il s'arrêtera bien ».
- **Le micro se tait pendant que Maya parle.** Sur un téléphone posé près d'une
  ruche, haut-parleur allumé, il l'entend — sans coupure, elle se répond à
  elle-même, indéfiniment.
- **Un micro ne se rouvre JAMAIS tout seul après qu'on l'a éteint.** Les quatre
  gestes qui veulent dire « je reprends la main » — fermer la bulle, couper le
  micro, taper, mettre Maya en pause — passent tous par `quitterModeVocal`.

### Outillage

- **La dictée de Maya ne peut pas marcher sur un Chromium qui n'est pas Chrome.**
  L'API Web Speech envoie l'audio à un service **distant** de Google, et la clé
  n'est embarquée que dans Google Chrome. Arc, Brave, les Chromium de
  distribution, les vues web intégrées : `webkitSpeechRecognition` **existe**
  (donc le bouton s'affiche, `speechSupporte()` dit oui) et l'appel se fait
  refuser — `onstart` réussi, puis `onerror:network` ~570 ms plus tard. C'est la
  signature, et elle est définitive : aucun correctif de notre côté n'y changera
  rien. Ce qui est à nous, c'est de le **dire** (`erreurMicro.ts`) et de nommer
  l'issue qui marche : la dictée **système**, qui ne passe par aucun service
  distant — micro du clavier sur téléphone, 🌐/Fn sur Mac, Windows + H ailleurs.

- **`import.meta.client` n'existe pas sous Vitest** — c'est Nuxt qui le pose,
  pas Vite. Il valait donc `undefined` (faux), et **tout composable client
  importé par un banc s'arrêtait à son `if (!import.meta.client) return`** :
  vert, et vide. Pire, `define: { 'import.meta.client': 'true' }` **ne corrige
  rien en silence** — la transformation SSR réécrit `import.meta` en
  `__vite_ssr_import_meta__` avant que `define` ne le voie. `vitest.config.ts`
  passe par un greffon `enforce: 'pre'` (`drapeauxNuxt`), limité à `app/` :
  `server/` n'écrit jamais `import.meta.client`, et `tests/` doit garder son
  texte intact — plusieurs bancs y cherchent des motifs dans des sources.

- `page.addStyleTag` **pend indéfiniment** quand `javaScriptEnabled: false` —
  utiliser `page.evaluate`.
- `requestAnimationFrame` ne se résout jamais en headless sans JS.
- `pkill -f '<motif>'` fait correspondre **sa propre ligne de commande** et
  s'auto-tue. Tuer par PID.
- L'audit de mise en page mesure le **contenu** (plages de texte, éléments
  atteignables), pas les boîtes : un décor `position:absolute` gonfle un
  `scrollWidth` sans rien couper.

## 6. Ce qui ne se négocie pas côté produit

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

## 7. Vérifier avant de dire que c'est fait

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
