# Maya — Intégration de l'onboarding cinématique

> **But** : remplacer l'écran `app/pages/onboarding.vue` par le parcours **cinématique Maya**
> (maquette : `design/maya/mockup/onboarding/Maya - La naissance.html` + `cinematic.jsx`),
> **sans casser la logique métier existante** (Stripe, création rucher/ruches, préférences,
> complétion). On garde le **cerveau** de l'onboarding actuel ; on remplace **la peau**.
>
> Réf. comportement/visuel exact : `design/maya/mockup/onboarding/` (le `.jsx` fait foi pour
> l'ordre des scènes, les durées, les transitions, l'ancre-logo fixe, la typo cinétique).

---

## 0. La règle d'or de cette intégration

**Ne réécris pas la logique — enrobe-la.** `onboarding.vue` contient déjà, testé en prod, tout
ce qui compte : le checkout Stripe, la reprise après paiement, la création rucher + ruches en
batch, la persistance de progression, `completeOnboarding()`, l'analytics. Le cinématique n'est
qu'une **nouvelle présentation** de cette même machine à états. Copie la logique telle quelle,
change uniquement le rendu.

---

## 1. LE point qui casse si tu l'ignores : le paiement Stripe est au milieu

Dans mon mockup, choisir une formule est purement visuel. **Dans la vraie app, l'étape "plan"
sort de l'app vers Stripe et revient.** C'est la contrainte n°1.

Flux réel (extrait de `onboarding.vue → nextStep()`), à préserver **tel quel** :

- Formule `decouverte` (gratuit) → on continue en interne, pas de redirection.
- Formule `trial` → `startTrialCheckout()` → `POST /api/stripe/trial-checkout` → **redirection externe**.
- Formules `starter | pro | expert` → `useSubscription().checkout(plan,'mois','onboarding',acceptCgv)`
  → **redirection externe** vers Stripe.
- Retour de Stripe : l'utilisateur revient sur **`/onboarding?checkout=success`** (géré par
  `middleware/onboarding.global.ts`, qui préserve ce signal). L'onboarding doit alors **reprendre
  automatiquement** après l'étape plan, via `waitForPlanActive()` (poll du profil jusqu'à ce que
  le plan soit actif), puis sauter à la construction du rucher.

➡️ **Conséquence pour le cinématique** : la scène `plan` n'est pas un simple choix animé. Au clic
sur "Valider ma formule" :
1. si `decouverte` → on avance à la scène `rucher` en interne ;
2. sinon → on appelle le checkout (redirection) et **on quitte la page**. Au retour, on ré-entre
   dans le cinématique en **mode reprise** : on rejoue une courte transition ("C'est réglé, on
   construit ton rucher") puis on démarre directement à la scène `rucher`. **Ne rejoue pas la
   naissance ni l'intro** quand `route.query.checkout === 'success'` (ou `trial === 'activated'`).

---

## 2. Réconcilier les scènes du mockup avec les 5 vraies étapes

| Cinématique (mockup) | Étape réelle `onboarding.vue` | Action au passage |
|---|---|---|
| `hello`, `apigo`, `watch`, `propose` | *(aucune — pure présentation)* | Rien. Auto-défilement. Sautable ("Passer l'intro"). |
| **`profil`** *(À AJOUTER)* | **Step 1 — profil apicole** | `form.profilApicole = …` (loisir / pro / pluri-actif). Détermine les modules recommandés + la redirection finale. |
| `presence` | *(nouveau — propre à Maya)* | `presence = 'partout' | 'discrete' | 'pause'`. Persisté au compte (voir §4). |
| `plan` | **Step 2 — formule** | **Stripe** (voir §1). `decouverte` inline, sinon redirection + reprise. |
| `rucher` | **Step 3a — rucher** | À la validation : `POST /api/ruchers` (voir §3). |
| `ruches` | **Step 3b — ruches** | À la validation : `POST /api/ruches` batch, borné au plan (voir §3). |
| *(à intégrer)* | **Step 4 — modules** | `form.modulesActifs`. Pré-cochés selon le profil. Peut devenir une scène `modules` OU être déplacé en post-onboarding (voir §5). |
| `ready` | **Step 5 — final** | `finishOnboarding()` : préférences + `completeOnboarding()` + redirection (voir §3). |

**À faire côté cinématique** : ajouter une scène **`profil`** (3 cartes tap : Loisir / Pro /
Pluri-actif) juste après `apigo`, sur le même modèle visuel que `presence`. Sans elle, tu perds la
personnalisation (modules recommandés + redirection finale loisir→`/interventions/nouvelle`).

---

## 3. Contrats d'API exacts (ne pas inventer)

### Créer le rucher — sortie de la scène `rucher`
```ts
const res = await $fetch<{ data: { id: string } }>('/api/ruchers', {
  method: 'POST',
  body: {
    nom: rucher.nom,                          // requis
    commune: rucher.commune || undefined,
    departement: rucher.departement || undefined,
    environnement: rucher.environnement || undefined,  // verger | garrigue | montagne | plaine | forêt | urbain
    latitude: rucher.latitude,                // optionnel (GPS)
    longitude: rucher.longitude,
  },
});
createdRucherId.value = res.data.id;
analytics.capture('rucher_created', { source: 'onboarding' });
```
> Ou, mieux, via le composable : `const { createRucher } = useRuchers(); await createRucher(payload)`
> — même endpoint, et il émet `rucher:created` sur le DataBus (rafraîchit les compteurs).

### Créer les ruches en batch — sortie de la scène `ruches`
```ts
const nb = Math.min(form.nbRuches, maxRuches.value);   // maxRuches = plafond du plan (voir §6)
if (nb > 0) {
  const ruches = Array.from({ length: nb }, (_, i) => ({
    rucherId: createdRucherId.value,
    numero: `Ruche ${i + 1}`,
    type: form.rucheType,                     // dadant_10 | langstroth | warre | voirnot | …
  }));
  await $fetch('/api/ruches', { method: 'POST', body: { ruches } });
  analytics.capture('ruche_created', { source: 'onboarding', count: nb });
}
```
> Composable équivalent : `const { createRuchesBatch } = useRuches(); await createRuchesBatch(ruches)`.

### Finaliser — scène `ready`
```ts
await authStore.updateProfil({
  preferences: {
    ...(authStore.profil?.preferences ?? {}),
    profilApicole: form.profilApicole,
    mayaPresence: presence,                   // ← NOUVEAU (voir §4)
    modulesActifs: form.modulesActifs,
    alertesEssaim: form.alertesEssaim,
    alertesMeteo: form.alertesMeteo,
    rappelsInterventions: form.rappelsInterventions,
    onboardingCompletedAt: new Date().toISOString(),
    tutorialsCompleted: [],
    tutorialsDismissed: false,
  },
});
await authStore.completeOnboarding();
clearProgress();
// redirection : loisir/pluri-actif → /interventions/nouvelle ; sinon → /dashboard
```

---

## 4. Persistance du mode de présence (le lien avec le store Maya)

Le choix fait à la scène `presence` doit :
1. être écrit dans **`preferences.mayaPresence`** au moment du `finishOnboarding()` (bloc ci-dessus) ;
2. **initialiser le store `app/stores/maya.ts`** (créé en P1 du handoff principal) dès l'entrée dans
   l'app. Au boot, `maya.presence` s'hydrate depuis `authStore.profil.preferences.mayaPresence`
   (défaut : **`'partout'`** — décision produit du 22/07/2026).

Ainsi le mode choisi à l'onboarding pilote immédiatement l'app : `'partout'` → cartes proactives +
bulle ; `'discrete'` → bulle seule ; `'pause'` → rien tant que l'utilisateur ne l'appelle pas.

---

## 5. Modules (Step 4) — deux options, à toi de trancher

- **Option recommandée (fidèle)** : garder une scène `modules` juste avant `ready`, avec les modules
  **pré-cochés** selon `RECOMMENDED_BY_PROFIL[form.profilApicole]` (repris tel quel de `onboarding.vue`).
  Tap pour ajouter/retirer. C'est un vrai choix produit, ne le perds pas.
- **Option "zéro friction"** : appliquer directement les modules recommandés (sans écran) et laisser
  l'utilisateur les ajuster plus tard dans Paramètres. Plus court, mais moins transparent.

Par défaut, prends l'option recommandée sauf consigne contraire.

---

## 6. Plafond de ruches selon la formule (source de vérité : `plans.ts`)

Le mockup code `PLAN_CAPS = { decouverte:1, starter:10, pro:999, expert:999, trial:999 }`.
**N'utilise pas ces chiffres en dur.** Lis les vraies limites depuis `app/config/plans.ts`
(`PLAN_CONFIGS[plan].limites.ruches`, `Infinity` pour illimité) — exactement comme
`useSubscription().currentLimits`. Le stepper de la scène `ruches` doit :
- accepter la **saisie clavier** (un pro peut taper `300`) — pas 300 clics ;
- proposer des **préréglages** (10/25/50/100/200) ;
- **borner** au plafond du plan ; si le plan est bas (Découverte 1, Starter 10) et l'utilisateur
  bute sur le plafond, afficher l'upsell "passe à l'essai Pro".

---

## 7. Reprise de progression + garde middleware (ne pas régresser)

- **Progression** : `onboarding.vue` sauvegarde à chaque changement (`saveProgress()`, débouncé via
  `watch`) et restaure au montage. Conserve ce mécanisme : sérialise `{ scene, form, rucher,
  presence }` et restaure-le, pour que la reprise après Stripe (ou un refresh) reparte au bon endroit.
- **Middleware** : `middleware/onboarding.global.ts` redirige vers `/onboarding` tant que
  `authStore.isOnboarded` est faux, et préserve `?checkout=success`. Ne le touche pas ; assure juste
  que le cinématique lit `route.query` au montage pour entrer en **mode reprise** (voir §1).

---

## 8. Ce que Claude Code doit produire

1. **`app/pages/onboarding.vue`** — remplacé par la coquille cinématique (scaffold fourni :
   `design/maya/components/MayaOnboarding.vue`). Il réutilise `<IaMayaMark/>`, `maya.css`,
   et porte la machine à états ci-dessus.
2. Extraire les visuels de scène en petits composants sous `app/components/ia/onboarding/`
   (`SceneHello.vue`, `SceneApigo.vue`, `SceneProfil.vue`, `ScenePresence.vue`, `ScenePlan.vue`,
   `SceneRucher.vue`, `SceneRuches.vue`, `SceneModules.vue`, `SceneReady.vue`) — un par scène,
   valeurs/copie reportées du `.jsx`.
3. Câbler la persistance `mayaPresence` (§4) dans le store `maya.ts` et le `updateProfil` final.
4. Vérifs : découverte (gratuit) va au bout sans Stripe ; un plan payant part à Stripe et **reprend**
   à la construction au retour ; rucher + N ruches réellement créés (vérifie en base / dashboard) ;
   `prefers-reduced-motion` coupe les animations ; le logo ne se recharge pas entre scènes.
5. **`app/components/ia/MayaSeuil.vue`** (nouveau) — l'entrée dans APIGO + le premier geste (voir §9).

---

## 9. Le Seuil — entrée dans APIGO + premier geste (par formule)

Juste après `finishOnboarding()`, on ne fait plus un `router.push` sec. On joue un **court seuil**
(≈ 2 s) qui fait passer de l'onboarding au tableau de bord, puis Maya propose **le bon premier geste
selon la formule**. Réf. visuel/timings exacts : `design/maya/mockup/onboarding/` (composant `Seuil`
+ règles CSS `.seuil-*`).

### 9.1 L'animation (sobre, chaleureuse — c'est l'ADN de Maya)
Pas de spectacle. Trois choses simples et lentes, easing doux :
1. **Une onde de miel unique** part du rayon et se dissout (`.seuil-wash`) — la chaleur qui se répand.
2. **Deux hexagones** s'ouvrent depuis le rayon puis s'effacent (`.seuil-ring`) — écho discret de la ruche.
3. **Cross-dissolve** vers le tableau de bord (fond sombre → surface claire), et **le rayon glisse
   vers son coin** de présence (haut-gauche si `partout`, bulle bas-droite si `discrete`), après un
   court temps de présence au centre.

> Volontairement **pas** de pavage nid-d'abeille plein écran (trop tape-à-l'œil). Reste sobre.

### 9.2 Où ça vit en prod
Le seuil **recouvre le vrai dashboard pendant son chargement** — ce n'est pas un squelette figé.
Deux implémentations possibles, au choix :
- **(recommandé)** `finishOnboarding()` redirige vers `/dashboard?welcome=1`. Un overlay global
  `MayaSeuil.vue` (monté dans `app/layouts/default.vue`) détecte `?welcome=1`, joue l'anim une fois
  par-dessus le dashboard réel qui s'hydrate dessous, puis affiche le panneau premier geste.
- **(alternative)** un composant plein écran affiché à la dernière scène de `MayaOnboarding.vue`
  avant le `router.push`. Plus simple, mais l'utilisateur ne voit pas encore le vrai dashboard derrière.

Dans les deux cas : le panneau « premier geste » se ferme via un CTA (navigation) ou « Plus tard »,
et on nettoie le flag (`?welcome`) pour ne pas rejouer au refresh.

### 9.3 Le premier geste — matrice par formule (routes réelles du SaaS)
Le **1ᵉʳ item est la recommandation de Maya** (badge « Conseillé », anneau honey). Les suivants sont
des alternatives. Toutes pointent vers des routes existantes :

| Formule | 1 · Conseillé | 2 | 3 |
|---|---|---|---|
| **Découverte** | Ta première visite → `/interventions/nouvelle` | Colorie tes ruches → `/ruches` | — |
| **Starter** | Ta première visite → `/interventions/nouvelle` | Planifie ta semaine → `/calendrier` | Colorie tes ruches → `/ruches` |
| **Pro / Essai** | Prépare la récolte → `/production` | Ton premier client → `/clients` | Ta première visite → `/interventions/nouvelle` |
| **Expert** | Invite ton équipe → `/parametres` (équipe) | Prépare la transhumance → `/transhumance` | Ton premier client → `/clients` |

Source des routes/plans : `plans.ts` (features par plan) + l'arbo `app/pages/`. **Filtre par
`hasFeature(plan, …)`** avant d'afficher : ne propose jamais un geste verrouillé pour la formule
(ex. `clients`/`production` requièrent la feature `clients`/`production` — absente en Découverte).
Nuance possible par `profilApicole` (un `loisir` en Pro : mettre « Première visite » en tête plutôt
que « Client »). La copie d'accompagnement de Maya (`SEUIL_SAY`) change aussi selon la formule.

### 9.4 Câblage
- Plan : `useSubscription().currentPlan`. Présence : store `maya.ts`. Profil :
  `authStore.profil.preferences.profilApicole`.
- Chaque carte = `<NuxtLink :to="act.to">` (ou `navigateTo`). « Plus tard » → reste sur `/dashboard`.
- Respecte `prefers-reduced-motion` (coupe onde/anneaux/cross-dissolve, garde l'affichage direct).
- Cibles tactiles ≥ 46px ; le panneau est une bottom-sheet en mobile, une carte centrée en web.
