# Maya — Handoff d'intégration pour Claude Code

> **But.** Intégrer dans le SaaS (branche `v2`) le nouveau design : l'identité **Maya** (logo vivant + états animés), les **graphiques produit**, les **formulaires unifiés**, les **boutons**, et le design des **surfaces Maya** (page, dashboard, ⌘K, panneau, mobile/terrain, voix).
>
> **Source visuelle de vérité.** La maquette interactive `maya/index.html` (React/JSX) dans ce projet. Ce dossier `handoff/` contient des **composants Vue prêts à déposer** + ce plan. Quand un détail manque, **lis le JSX correspondant** (table de correspondance en §9) et reporte les valeurs exactes — ne devine pas.
>
> **Stack cible.** Nuxt 4 · Vue 3 `<script setup lang="ts">` · Tailwind v4 + `@nuxt/ui` · ECharts (`app/utils/echarts.ts`) · Pinia. Tokens dans `app/assets/css/main.css`.

---

## 0. La règle d'or (à appliquer partout)

1. **Mort au dégradé honey→sage.** L'ancien `.maya-avatar` (`linear-gradient(135deg, var(--honey), var(--sage))` + icône `i-lucide-sparkles`) et l'épine `.maya-card::before` (`linear-gradient(90deg, var(--honey), var(--sage))`) **disparaissent**. Maya = le **rayon de miel** (`IaMayaMark`). Tout accent Maya hors-logo = **honey plein** (`var(--honey)`), jamais un dégradé. Le **vert (`--sage`) reste réservé à la sémantique** (santé/vivant), jamais à l'identité.
2. **Maya est déterministe, pas un LLM.** Pas de champ de texte libre "magique" mis en avant. On répond **au tap** (chips, segmented) ou **à la voix**. Les conseils sont étiquetés comme des **règles** ("Règle : …", "Repéré par mes règles"). C'est un argument de **confiance**, pas une limite.
3. **Maya est un binôme humain.** Ton chaleureux, tutoiement, première personne. Elle veille, célèbre, s'inquiète avec mesure, prend soin de l'apiculteur ("Repose-toi, je veille la nuit"). Jamais un robot de service.
4. **Terrain d'abord.** Cibles ≥ **46px**, gros doigts/gants, mobile (layout `terrain.vue` existant). Maya **pré-remplit** ce qu'elle peut, l'apiculteur valide.

---

## 1. Décisions à acter (rapides)

| Sujet | Recommandation |
|---|---|
| **Valeur du honey** | Garder `--honey: #f5a623` pour l'app. Le logo Maya utilise ses **ambres internes** (`#e6982c → #c47c1b`, encodés dans le SVG). Ne PAS propager `--maya-honey` au global sans raison. |
| **BeeIcon** | Reste l'icône "trait" générique (puces, listes). **L'avatar/identité de Maya = `IaMayaMark`**, pas BeeIcon. |
| **Nom des composants** | Préfixe par dossier (auto-import Nuxt) : `app/components/ia/MayaMark.vue` → `<IaMayaMark/>` ; `app/components/ui/RingGauge.vue` → `<UiRingGauge/>`. |
| **Animations en liste** | Une seule mark animée par écran "héros". Dans les listes/tableaux, `state="static"`. Voir §Perf. |

---

## 2. Fichiers fournis dans ce handoff (prêts à déposer)

```
handoff/
├── 00_HANDOFF.md                ← ce doc
├── css/maya.css                 → coller dans app/assets/css/main.css (keyframes + tokens Maya)
├── components/
│   ├── MayaMark.vue             → app/components/ia/MayaMark.vue   (LE logo vivant)
│   ├── RingGauge.vue            → app/components/ui/RingGauge.vue  (jauge anneau)
│   ├── Sparkline.vue            → app/components/ui/Sparkline.vue  (micro-courbe)
│   └── forms/
│       ├── UiField.vue          → app/components/ui/UiField.vue    (enveloppe de champ + états)
│       ├── UiSegmented.vue      → app/components/ui/UiSegmented.vue
│       ├── UiStepper.vue        → app/components/ui/UiStepper.vue
│       ├── UiChips.vue          → app/components/ui/UiChips.vue
│       └── UiToggle.vue         → app/components/ui/UiToggle.vue
```

Chaque fichier a un en-tête de commentaire avec son emplacement cible et un exemple d'usage.

---

## 3. Le logo Maya — `IaMayaMark` (cœur de l'identité)

Géométrie : un hexagone-base + **7 alvéoles** (1 centre, 6 couronne). Le mouvement raconte l'état.

**États (`state`)** — chacun a un sens, ne les invente pas au hasard :

| state | Quand l'utiliser | Lecture |
|---|---|---|
| `idle` | présence au repos (header, accueil, panneau ouvert) | respiration + scintillement |
| `think` | Maya calcule / déroule ses règles (réponse en cours) | vague centre → couronne |
| `listen` | capture vocale active | onde concentrique |
| `alert` | une priorité précise à regarder | une alvéole s'embrase |
| `loading` | attente (fetch d'un brief, génération) | lueur qui tourne |
| `success` | récolte / action réussie / confirmation | le miel monte |
| `static` | listes denses, favicon, tableaux | figé |

**Brancher les états sur de vrais moments** (exemple avec le composable Maya existant) :

```vue
<IaMayaMark :size="26" :glow="true"
  :state="copilote.status === 'streaming' ? 'think'
        : copilote.status === 'recording' ? 'listen'
        : 'idle'" />
```

**Remplacements à faire dans l'existant** :
- `app/components/dashboard/MayaCard.vue` → remplacer `<span class="maya-avatar"><UIcon i-lucide-sparkles/></span>` par `<IaMayaMark :size="32" state="idle" />`. Supprimer les règles `.maya-avatar` et le dégradé `.maya-card::before` → épine **honey plein** : `background: var(--honey);`.
- `app/components/ia/CopiloteMessage.vue` → l'en-tête de message assistant doit afficher `<IaMayaMark :size="26" />` + "Maya".
- Tout autre `i-lucide-sparkles` servant d'avatar Maya → `IaMayaMark`.

> Détails d'animation, géométrie, board de démo : voir `maya/pages/identity.jsx` et `maya/shared/maya-ui.jsx` (fonction `MayaMark` + bloc `maya-anim`).

---

## 4. Boutons (uniformisation)

Trois variantes principales + deux sémantiques. **Planche visuelle dédiée** : `maya/pages/system.jsx` (`ButtonsBoard`) — montre variantes, tailles, états (défaut/loading/disabled), icône seule, FAB Maya, et la déclinaison sur fond sombre. Crée `app/components/ui/UiButton.vue` (nouveau) OU des classes utilitaires globales. Specs :

| Variante | Style | Emploi |
|---|---|---|
| **Primary** | fond `#1c1c1e` (ink), texte blanc, radius 11px, hauteur 46 (terrain) / 32–36 (inline) | action principale, confirmations |
| **Ghost** | fond `var(--surface-card)`, bord `1.5px var(--border-strong)`, texte `--text-secondary` | action secondaire |
| **Honey-link** | fond `var(--honey-soft)`, texte `var(--honey-deep)`, radius 9–10px | liens d'action Maya (déjà le motif dans CopiloteMessage) |

- Icône optionnelle à gauche, `gap: 8px`, `font-weight: 600`.
- Hover : `translateY(-1px)` + `shadow-sm` (cohérent avec l'existant).
- **Important** : le bouton "confirmer une écriture" garde le vert **sage** (`--sage-deep`) — c'est sémantique (validation), pas l'identité Maya. (Déjà le cas dans `CopiloteMessage.vue`, à conserver.)

> Référence visuelle : boutons de `ActionCard` et des formulaires dans `maya/shared/maya-ui.jsx` (`fmS.btnPrimary`, `fmS.btnGhost`) et `maya/pages/forms.jsx`.

---

## 5. Formulaires unifiés

**Principe** : une seule grammaire. `UiField` enveloppe **tout** champ (label, requis, hint, message d'état). Les contrôles : `<UInput class="maya-input">` (Nuxt UI restylé) + nos `UiSegmented / UiStepper / UiChips / UiToggle`. `PhotoUploader.vue` et `MobileDatePicker.vue` existent déjà — garde-les, enveloppe-les dans `UiField`.

**4 états visuels** (gérés par `UiField` `status` + classe `.maya-input.is-*`) :
- `default` · `error` (rouge `--status-bad`) · `success` (sage) · **`maya`** (le rayon + "Pré-rempli par Maya").

**L'état `maya` est la signature** : quand Maya pré-remplit un champ (depuis une dictée, une règle, l'historique), le champ porte `status="maya"` avec un court message. Voir la dictée → fiche dans `maya/pages/pwa2.jsx` (`MayaPwaVoiceResult`).

**Patterns de formulaire** (tous dérivés du même kit — voir `maya/pages/forms.jsx`) :
- **Modale desktop** "Nouvelle intervention" (`FormDesktop`).
- **Fiche terrain mobile** "Compte-rendu" (`FormMobile`), pré-remplie par la voix.
- **Connexion** pleine page (`FormArchetypes`) — Maya en accueil.
- **Assistant multi-étapes** "Nouvelle ruche" (`FormArchetypes`) — stepper 4 étapes, reco Maya inline. **Crée `app/components/ui/UiStepperFlow.vue`** (nouveau) pour le bandeau d'étapes.

**À migrer progressivement** vers ce kit (gros formulaires existants) : `interventions/VisiteRucherForm.vue`, `interventions/FormReine.vue`, `finances/VenteForm.vue`, `finances/BonLivraisonForm.vue`, `interventions/forms/*`. Commence par **un** formulaire pilote (VisiteRucherForm) pour valider le kit, puis propage.

---

## 6. Graphiques produit

Deux niveaux, ne pas confondre. **Planche visuelle dédiée** : `maya/pages/system.jsx` (`GraphicsBoard`) — jauges, sparkline, tuile KPI, barres comparées (prévision hachurée), palette de séries.

- **Micro / inline (SVG, zéro dépendance)** → nos composants : `UiRingGauge` (butinage, % objectif, force colonie) et `UiSparkline` (tendance récolte, KPI). Légers, parfaits en carte et en liste. `KpiCard.vue` a déjà une sparkline de fond — `UiSparkline` est la version premier-plan avec point final.
- **Macro (séries, comparaisons, distributions)** → **ECharts** via `app/utils/echarts.ts` (déjà en place : Bar/Line/Pie). Les composants `dashboard/ProductionChart.vue`, `dashboard/SanteChart.vue`, `finances/RevenueChart.vue`, `ia/MayaChart.vue` existent — **réharmonise leur thème** sur la palette (voir ci-dessous), ne les réécris pas.

**Thème ECharts "Warm Precision"** (crée `app/utils/echarts-theme.ts`, nouveau, et applique-le à l'init de chaque chart) :

```ts
export const warmPrecision = {
  color: ['#f5a623', '#7a9676', '#b87959', '#5e7ba8', '#c87f2a'],
  textStyle: { fontFamily: 'SF Pro Text, -apple-system, sans-serif', color: '#57534e' },
  grid: { left: 8, right: 12, top: 16, bottom: 8, containLabel: true },
  categoryAxis: { axisLine: { lineStyle: { color: 'rgba(214,211,209,0.6)' } },
    axisTick: { show: false }, axisLabel: { color: '#a8a29e', fontSize: 11 },
    splitLine: { show: false } },
  valueAxis: { axisLine: { show: false }, axisTick: { show: false },
    axisLabel: { color: '#a8a29e', fontSize: 11 },
    splitLine: { lineStyle: { color: 'rgba(214,211,209,0.3)' } } },
  // barres : coins arrondis honey ; prévisions en hachuré (voir maya-b.jsx)
};
```

> Style des graphes (barres arrondies honey, série "prévision" en hachuré, "lecture de Maya") : `maya/pages/maya-b.jsx`. Mini-barres dashboard : `MiniBars` dans `maya/shared/maya-ui.jsx`.

---

## 7. Surfaces Maya (où elle vit)

| Surface | Cible Vue | Action | Réf. maquette |
|---|---|---|---|
| **Carte dashboard** | `dashboard/MayaCard.vue` *(existe)* | Restyle : `IaMayaMark`, épine honey, briefing 3 priorités | `MayaCtxDash` (contextual.jsx), `MayaC` (maya-c.jsx) |
| **Page conversation** | page `/copilote` + `ia/CopiloteMessage.vue` *(existe)* | Garde les blocs riches (stats/tableau/graphe/carte). Ajoute en pied une **barre guidée** (chips de réponse), pas un gros champ libre | `MayaA` (maya-a.jsx) |
| **Atelier (split canvas)** | **nouveau** `ia/MayaWorkspace.vue` | Conversation à gauche, artefact construit à droite (graphe + "lecture de Maya") | `MayaB` (maya-b.jsx) |
| **Briefing proactif** | **nouveau** `ia/MayaBriefing.vue` (ou enrichir `/copilote`) | Cartes-first, priorités du jour, ton humain | `MayaC` (maya-c.jsx) |
| **⌘K** | `ui/AppCommandPalette.vue` *(existe)* | Ajoute une section "Demander à Maya" (questions déterministes + nav) | `MayaCommandK` (contextual.jsx) |
| **Panneau latéral** | **nouveau** `ia/MayaPanel.vue` | Slide-over contextuel (sur une fiche ruche), `IaMayaMark` + 1 carte d'action | `MayaSidePanel` (contextual.jsx) |
| **Launcher flottant** | **nouveau** `ui/MayaLauncher.vue` | FAB ink + mark, menu rapide | `MayaLauncherFull` (contextual.jsx) |
| **PWA — tab bar** | `ui/BottomNav.vue` *(existe)* | Bouton central Maya (FAB ink + `IaMayaMark`) | tab bar dans `pwa.jsx` |
| **PWA — accueil** | page mobile "Aujourd'hui" | Présence ("J'ai veillé cette nuit"), pouls (RingGauge), sparkline récolte, priorités, actions guidées | `MayaPwaHome` (pwa.jsx) |
| **PWA — onboarding** | **nouveau** `pages/maya-onboarding` | "Bonjour, moi c'est Maya" — déterminisme = confiance, relation, "Maya propose, tu décides" | `MayaPwaMeet` (pwa2.jsx) |
| **Capture vocale** | **nouveau** `ia/MayaVoice.vue` | Plein écran sombre, `IaMayaMark state="listen"`, waveform, transcription → champs structurés | `MayaMobVoice` (mobile.jsx), `MayaPwaVoiceResult` (pwa2.jsx) |
| **Bilan / moment humain** | **nouveau** `ia/MayaRecap.vue` | "On a bien travaillé", célébration, carte "Repose-toi, je veille" | `MayaPwaRecap` (pwa.jsx) |

---

## 8. Perf (important pour le terrain)

Les marks animées tournent en boucle. Pour les longues listes/feeds :
1. `state="static"` par défaut dans les items répétés.
2. Pour les marks animées visibles, **pause hors écran** via `IntersectionObserver` qui pose la classe `.maya-paused` (déjà gérée par `maya.css`). Implémente-le dans un petit composable `useMayaViewport()` ou directement dans `MayaMark.vue` (`onMounted` + observer sur `$el`). Réf. : bloc `injectMaya`/IntersectionObserver dans `maya/shared/maya-ui.jsx`.
3. Respecte déjà `prefers-reduced-motion` (géré dans `maya.css`).

---

## 9. Table de correspondance maquette → code

Lis le JSX quand tu as besoin des valeurs exactes (espacements, copies, couleurs).

| Élément | Fichier maquette (ce projet) | Cible Vue |
|---|---|---|
| Logo + états | `maya/shared/maya-ui.jsx` (`MayaMark`, bloc `maya-anim`), `maya/pages/identity.jsx` | `ia/MayaMark.vue` *(fourni)* + `main.css` |
| Tokens / keyframes | `maya/shared/tokens.css` | `app/assets/css/main.css` + `handoff/css/maya.css` *(fourni)* |
| Bulle + blocs riches | `MayaMessage`, `HiveTable`, `ActionCard`, `SourceChips`, `MiniBars` (maya-ui.jsx) | `ia/CopiloteMessage.vue` *(existe, enrichir)* |
| Barre de prompt / guidée | `PromptBar`, `SuggestionChip` (maya-ui.jsx) | **nouveau** `ia/MayaPromptBar.vue` |
| Jauge / courbe | `RingGauge`, `Sparkline` (maya-ui.jsx) | `ui/RingGauge.vue`, `ui/Sparkline.vue` *(fournis)* |
| Kit formulaires | `maya/pages/forms.jsx` (`fmS`, `FField`, `FInput`, `FSeg`, `FStepper`, `FChips`, `FToggle`, `FSlider`, `FPhoto`) | `ui/UiField.vue` + `UiSegmented/UiStepper/UiChips/UiToggle` *(fournis)* + `UInput` restylé |
| **Boutons** | `maya/pages/system.jsx` (`ButtonsBoard`) — planche dédiée | **nouveau** `ui/UiButton.vue` |
| Surfaces | `maya/pages/{maya-a,maya-b,maya-c,contextual,pwa,pwa2,mobile}.jsx` | voir §7 |

---

## 10. Plan d'intégration (par phases)

**P0 — Fondations (½ j).**
1. Coller `handoff/css/maya.css` dans `main.css`.
2. Déposer `MayaMark.vue` → `app/components/ia/`.
3. Remplacer `.maya-avatar` (sparkles + dégradé) par `IaMayaMark` dans `MayaCard.vue` ; épine honey plein. → **Le dégradé orange-vert a disparu, le logo vit.**

**P1 — Surfaces Maya (1–2 j).** Brancher les états (`think`/`listen`/`idle`) sur `useCopilote`. Restyler `MayaCard` (briefing). ⌘K : section "Demander à Maya". Créer `MayaPanel.vue` + `MayaLauncher.vue`. BottomNav : bouton central Maya.

**P2 — Formulaires (2–3 j).** Déposer les primitives (`UiField`, `UiSegmented`, `UiStepper`, `UiChips`, `UiToggle`) + classes `.maya-input` dans `main.css`. Migrer **un** formulaire pilote (`VisiteRucherForm.vue`), valider, puis propager (`FormReine`, `VenteForm`, `BonLivraisonForm`, `interventions/forms/*`). Ajouter l'état `maya` là où Maya pré-remplit.

**P3 — Graphiques & finitions (1–2 j).** `RingGauge`/`Sparkline` sur dashboard + PWA accueil. `echarts-theme.ts` appliqué à tous les charts. Capture vocale (`MayaVoice.vue`), bilan (`MayaRecap.vue`), onboarding. Perf : `IntersectionObserver`.

**P4 — Mobile/PWA terrain.** Accueil "Aujourd'hui", parcours guidé (tap), dictée → fiche. Layout `terrain.vue`.

---

## 11. Garde-fous (revue avant merge)

- [ ] Plus aucun `linear-gradient(..., var(--honey), var(--sage))` (cherche-le dans tout le repo).
- [ ] Plus aucun `i-lucide-sparkles` en guise d'avatar Maya.
- [ ] `--sage` n'apparaît que pour la sémantique (santé, validation), jamais dans l'identité Maya.
- [ ] Toutes les cibles tactiles ≥ 44–46px.
- [ ] `prefers-reduced-motion` respecté (déjà dans `maya.css`).
- [ ] Une seule mark animée "héros" par écran ; listes en `static` ; pause hors écran.
- [ ] Aucun champ de texte libre "magique" mis en avant ; réponses au tap/voix ; conseils étiquetés "règle".
- [ ] Ton Maya : tutoiement, première personne, chaleureux (relire les copies des maquettes).
