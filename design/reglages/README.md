# Handoff — Refonte page Paramètres (APIGO)

## Vue d'ensemble

Refonte de la page `/parametres` (profil utilisateur) du SaaS APIGO. L'écran existant
(`app/pages/parametres/index.vue`) est dense visuellement : trop de petites cards empilées en
deux colonnes, hiérarchie typographique plate, cinq couleurs d'icônes différentes, bouton
*Enregistrer* qui peut disparaître au scroll. Cette refonte privilégie une lecture calme
en page longue, une hiérarchie typographique forte et un sommaire latéral fixe.

> Direction retenue par le client : **B — Editorial** (parmi 3 directions explorées).

## À propos des fichiers de design

Les fichiers HTML / JSX livrés dans ce bundle sont des **références de design** : des prototypes
illustrant l'apparence et le comportement attendus, **pas du code de production à recopier
directement**. La tâche consiste à **recréer ce design dans la stack existante du projet APIGO**
(Nuxt 3 + Vue 3 + Tailwind + Nuxt UI), en réutilisant ses patterns établis :

- `<UInput>`, `<USwitch>`, `<UButton>` de Nuxt UI déjà utilisés partout
- Les variables CSS du design system « Warm Precision » dans `app/assets/css/main.css`
  (`--honey`, `--surface-card`, `--text-primary`, etc.)
- Le store `useAuthStore()` et le composable `useAuth()` pour profil / logout / reset
- Les notifications via `useNotifications()`
- Les types TypeScript existants (champs du profil, `Preferences`)

Le fichier source à remplacer est **`app/pages/parametres/index.vue`**.

## Fidélité

**Hi-fi.** Couleurs, typographie, espacements et tailles sont finaux. À reproduire au pixel près
en utilisant les composants Nuxt UI et les tokens CSS existants.

## Layout d'ensemble

La page est une **mise en page éditoriale longue** (scroll vertical, pas de tabs, pas de pagination)
avec un sommaire latéral fixe à gauche et le contenu à droite.

```
┌─────────┬─────────────────────────────────────────────────────────────┐
│ Sidebar │ Topbar (h=56, breadcrumb « Paramètres »)                   │
│ globale │─────────────────────────────────────────────────────────────│
│ APIGO   │                                                             │
│ (déjà   │   ┌────────┬───────────────────────────────────────────┐   │
│ exis-   │   │ Index  │  Hero (titre + lede + carte profil)       │   │
│ tante)  │   │ sticky │                                            │   │
│         │   │ width  │  01 — Identité (rows label · value · CTA) │   │
│         │   │  180   │  02 — Exploitation                         │   │
│         │   │        │  03 — Notifications (toggles)              │   │
│         │   │        │  04 — Abonnement                           │   │
│         │   │        │  05 — Équipe                               │   │
│         │   │        │  06 — Données + Danger zone               │   │
│         │   └────────┴───────────────────────────────────────────┘   │
│         │   max-width 1180, padding 40px 56px 80px, gap 56px         │
└─────────┴─────────────────────────────────────────────────────────────┘
```

- **Topbar** : hauteur 56 px, `border-bottom: 1px solid var(--border-default)`,
  contient juste un breadcrumb texte « Paramètres » (color `var(--text-tertiary)`, 13 px).
- **Layout intérieur** : `display: flex; gap: 56px; padding: 40px 56px 80px;
  max-width: 1180px; margin: 0 auto;`
- **Sommaire** (`<aside>`) : `width: 180px; position: sticky; top: 40px;`
- **Body** (`<div>`) : `flex: 1;` enfants en `display: flex; flex-direction: column; gap: 64px;`

## Sommaire latéral (Index)

Liste de liens d'ancrage, scroll-spy actif (lien en gras + barre honey à gauche quand la
section correspondante est visible).

- Étiquette « SUR CETTE PAGE » : 11 px, `font-weight: 600`, `color: var(--text-tertiary)`,
  `text-transform: uppercase`, `letter-spacing: 0.1em`, marge bottom 14 px.
- Liens : 13.5 px, `padding: 6px 0`, `padding-left: 12px`, `margin-left: -14px`.
  - Inactif : `color: var(--text-tertiary)`, `font-weight: 500`, `border-left: 2px solid transparent`.
  - Actif : `color: var(--text-primary)`, `font-weight: 600`, `border-left: 2px solid var(--honey)`.

Liens : Identité, Exploitation, Notifications, Sécurité, Abonnement, Équipe, Données.

## Hero

Titre + sous-titre + carte profil.

- **Titre** (`<h1>`) : `font-family: 'SF Pro Display'; font-size: 38px; font-weight: 600;
  letter-spacing: -0.025em; line-height: 1.05;` Texte : « Paramètres ».
- **Lede** (`<p>`) : 15 px, `color: var(--text-secondary)`, `line-height: 1.55;
  max-width: 600px;` Texte :
  > Votre profil, vos préférences et les coordonnées de votre exploitation. Ces informations
  > apparaissent sur vos factures et vos exports.

- **Carte profil** : `margin-top: 28px; padding: 24px 0;
  border-top: 1px solid var(--border-default); border-bottom: 1px solid var(--border-default);
  display: flex; align-items: center; gap: 20px;`

  - **Avatar** : 72×72, `border-radius: 999px`, `background: #1c1c1e`, `color: var(--honey)`,
    `font-family: 'SF Pro Display'; font-size: 24px; font-weight: 600;` Affiche les initiales.
  - **Bloc nom** : nom (22 px display 600), sous-ligne « {raison} · {ville} · membre depuis
    {date} » (14 px, `color: var(--text-secondary)`).
  - **Stat row** (à droite, `margin-left: auto; display: flex; gap: 36px;`) :
    - Trois stats : Ruches (chiffre), Ruchers (chiffre), Plan actif (label « Pro » en
      `var(--honey-deep)`).
    - Chiffre : 22 px display 600 `letter-spacing: -0.02em`.
    - Label : 11.5 px `color: var(--text-tertiary)` uppercase `letter-spacing: 0.08em` margin-top 4.

## Sections (01 → 06)

Chaque section suit le même pattern :

1. **Eyebrow** : `font-size: 11px; font-weight: 600; color: var(--honey-deep);
   text-transform: uppercase; letter-spacing: 0.12em; margin-bottom: 8px;`
   Format : « 01 — IDENTITÉ », « 02 — EXPLOITATION », etc.
2. **Titre** (`<h2>`) : 24 px display 600 `letter-spacing: -0.02em; margin-bottom: 6px;`
3. **Description** (`<p>`) : 14 px `color: var(--text-secondary); line-height: 1.55;
   max-width: 560px; margin-bottom: 24px;`
4. **Contenu** : grille de rows (voir ci-dessous).

### Pattern « Row » (utilisé dans Identité, Exploitation, Notifications, Données)

```
display: grid;
grid-template-columns: 180px 1fr auto;   /* label · value · action */
gap: 24px;
padding: 18px 0;
align-items: center;
border-bottom: 1px solid var(--border-default);
```

- Le **premier row** d'une section a aussi `border-top: 1px solid var(--border-default);`
  (donc on encadre la section).
- **Label** : 13.5 px, `color: var(--text-secondary)`, `font-weight: 500`.
- **Value** : 14.5 px, `color: var(--text-primary)`. Si la valeur est manquante, mettre
  « Non renseigné » en `color: var(--text-tertiary); font-style: italic`.
- **Hint** (optionnel sous la value) : 12.5 px `color: var(--text-tertiary); margin-top: 2px`.
- **Action** (à droite) : texte cliquable, 13 px, `color: var(--text-tertiary);
  font-weight: 500; cursor: pointer;` Actions courantes : « Modifier », « Changer »,
  « Vérifier », « Lire », « Exporter », « Gérer ».

### Pattern « Toggle row »

```
display: grid;
grid-template-columns: 1fr auto;
gap: 24px;
padding: 18px 0;
align-items: flex-start;
border-bottom: 1px solid var(--border-default);
```

- **Titre** : 14.5 px `font-weight: 500; margin-bottom: 4px;`
- **Description** : 13 px `color: var(--text-secondary); line-height: 1.5; max-width: 520px;`
- **Toggle** (à droite) : 38×22, `border-radius: 99px`, `background: #1c1c1e` (on) ou `#d6d3d1` (off),
  pastille 18×18 blanche `box-shadow: 0 1px 3px rgba(0,0,0,0.2)`, transition `left 0.2s`.
  → Réutiliser `<USwitch>` de Nuxt UI, juste vérifier que la couleur active est `#1c1c1e`
  (et non pas honey) pour cette page. Si Nuxt UI ne le permet pas, override via `:ui` slot.

## Contenu détaillé par section

### 01 — Identité

> **Description** : Ces informations restent privées. Elles ne sont visibles que par vous et les
> membres de votre équipe.

Rows (label / value / action) :

| Label | Value | Hint | Action |
|---|---|---|---|
| Prénom | `profil.prenom` | — | Modifier |
| Nom | `profil.nom` | — | Modifier |
| Email | `profil.email` | Identifiant de connexion — modification protégée | Vérifier |
| Téléphone | `profil.telephone` | — | Modifier |
| Mot de passe | `••••••••••••` | Modifié il y a {n} mois | Changer |

L'action « Modifier » ouvre soit un inline-edit (input qui remplace le span), soit une
slide-over `<USlideover>`. À discuter — le prototype montre seulement le mode lecture.

### 02 — Exploitation

> **Description** : Coordonnées légales utilisées sur vos factures, exports comptables et
> déclarations sanitaires.

| Label | Value | Hint |
|---|---|---|
| Raison sociale | `profil.raisonSociale` | — |
| Adresse | `{adresse}, {codePostal} {ville}` | — |
| NAPI | `profil.napi` | Numéro d'apiculteur — GDSA / DDPP |
| SIRET | `profil.siret` formatté `XXX XXX XXX XXXXX` | — |

Puis un **toggle row** :
- Titre : « Option TVA sur les débits »
- Description : « Si activé, la mention "Option pour le paiement de la taxe d'après les débits"
  est ajoutée automatiquement à toutes vos factures. »
- Lié à `form.optionTvaDebits`.

### 03 — Notifications

> **Description** : Choisissez les événements qui vous envoient une alerte. Les autres restent
> consultables dans le journal d'activité.

Six toggle rows (clés du store `prefs`) :

| Clé | Titre | Description |
|---|---|---|
| `alertesStock` | Stocks bas | Quand un stock passe sous le seuil défini. |
| `rappelsInterventions` | Interventions à venir | Rappel le matin pour les visites planifiées dans la journée. |
| `alertesMeteo` | Météo critique | Gel sous -3 °C, canicule au-dessus de 36 °C, vents forts annoncés. |
| `alertesEssaim` | Risque d'essaimage | Détection à partir des cellules royales saisies en visite et de la phénologie locale. |
| `pushMobile` | Push mobile | Recevoir aussi sur l'app mobile, en plus des emails. |
| `digestHebdo` | Digest hebdomadaire | Résumé envoyé chaque lundi matin à 7 h. |

> ⚠️ Les clés `alertesEssaim` et `pushMobile` sont **nouvelles** par rapport au schéma actuel
> du profil. À ajouter au type `Preferences` (côté `app/types` et schéma drizzle si stocké en DB)
> avant ce sprint, ou les retirer pour cette première itération.

### 04 — Abonnement

> **Description** (dynamique) : « {prix} HT par mois. Renouvellement automatique le {date} sur
> {moyen de paiement}. »

Bloc de **3 stats égales** (`display: grid; grid-template-columns: 1fr 1fr 1fr;`) avec
`border-top` et `border-bottom`, séparées par `border-left` entre chaque colonne :

- 248 / 500 — Ruches utilisées
- 7 — Ruchers
- 3 / 3 — Sièges équipe

Ces chiffres viennent des stats du compte (à brancher sur les endpoints existants des
ruches/équipe).

Puis row de boutons (`display: flex; gap: 14px; margin-top: 20px;`) :

- **Gérer le plan** (primary) : 38 px de haut, `padding: 0 18px;
  background: #1c1c1e; color: #fff; border: none; border-radius: 8px;
  font-size: 13.5px; font-weight: 600;` → route `/parametres/facturation`.
- **Voir les factures (14)** (secondary) : même taille, `background: transparent;
  color: var(--text-primary); border: 1px solid var(--border-default);` → route facturation aussi.

### 05 — Équipe

> **Description** : « Trois sièges utilisés sur trois disponibles avec votre plan Pro. »

Grille spéciale par row :

```
display: grid;
grid-template-columns: 1fr 200px auto;
gap: 24px; padding: 16px 0;
border-bottom: 1px solid var(--border-default);
```

Pour chaque membre :

- **Bloc gauche** : nom (14.5 px 500) + email (13 px `var(--text-tertiary)` margin-top 2).
  Si c'est l'utilisateur courant, ajouter ` · Vous` après le nom (12 px `var(--text-tertiary)`).
- **Centre** : rôle (13.5 px `var(--text-secondary)`). Rôles : Propriétaire, Apiculteur·trice,
  Lecture seule.
- **Droite** : action « Gérer » (mêmes specs que les autres actions de row).

### 06 — Données

> **Description** : Vous restez propriétaire de vos données. Données hébergées en France,
> conformes RGPD.

Trois rows label/value :

| Label | Value | Action |
|---|---|---|
| Export complet | Archive ZIP au format CSV | Exporter |
| CGU | Version du {date} | Lire |
| Confidentialité | Conforme RGPD — hébergement OVH France | Lire |

L'action « Exporter » appelle `window.open('/api/finances/export?format=csv', '_blank')`
et déclenche `notifications.success('Export lancé')` (déjà implémenté).

#### Danger zone

Bloc séparé en bas, `margin-top: 24px; padding: 18px 22px;
border-radius: 12px; border: 1px solid #f0d4d4; background: #fdf6f6;
display: flex; align-items: flex-start; gap: 14px;`

- Icône `i-lucide-alert-triangle` 16 px en `color: #c54545` (`margin-top: 2px`).
- Bloc texte central :
  - Titre : 14 px 600 `color: #9a2f2f`. « Supprimer mon compte »
  - Description : 13 px `color: #a85555; line-height: 1.5; max-width: 460px;`
    « Action irréversible. Toutes vos ruches, interventions et factures seront effacées sous 30 jours. »
- Bouton à droite : « Supprimer », 34 px, `background: #fff; border: 1px solid #e8c5c5;
  color: #9a2f2f; border-radius: 8px; font-size: 13px; font-weight: 600;`
  → comportement actuel : `notifications.error('Contactez le support pour supprimer votre compte')`.

## Comportement de save

**Important** — la maquette ne montre pas de barre « Enregistrer » globale. Deux options :

1. **(recommandé)** Édition par row : chaque action « Modifier » ouvre un inline-edit (l'input
   remplace le span de valeur, deux boutons sous le row : « Annuler » texte + « Enregistrer »
   primary noir). Save individuel par champ.
2. Conserver le `<form>` + bouton global comme aujourd'hui, mais le rendre **sticky en bas**
   du viewport quand `hasChanges === true` (transition slide-up depuis le bas, fond
   `rgba(255,255,255,0.92); backdrop-filter: blur(10px); border-top: 1px solid var(--border-default);`).

À choisir avec le PM avant l'implémentation.

## Tokens utilisés (déjà dans `app/assets/css/main.css`)

```css
--honey:        #f5a623;
--honey-soft:   #fef6e4;          /* nouveau — à ajouter */
--honey-deep:   #a86a13;          /* nouveau — à ajouter */
--surface-primary:  #fafaf8;
--surface-card:     #ffffff;
--surface-muted:    #f5f4f1;      /* nouveau — à ajouter */

--text-primary:     #1c1c1e;
--text-secondary:   #57534e;
--text-tertiary:    #a8a29e;
--text-quaternary:  #d6d3d1;      /* nouveau — à ajouter */

--border-default:   rgba(214, 211, 209, 0.6);

--radius-sm:  8px;
--radius-md:  12px;
--radius-lg:  16px;
```

Couleurs « danger zone » (à scoper localement, pas besoin de tokens globaux) :
`#9a2f2f` (texte fort), `#a85555` (texte secondaire), `#c54545` (icône),
`#e8c5c5` (border bouton), `#f0d4d4` (border bloc), `#fdf6f6` (background bloc).

## Typographie

- Display : `'SF Pro Display', -apple-system, BlinkMacSystemFont, ...` (déjà en place).
- Text : `'SF Pro Text', -apple-system, ...` (déjà en place).
- Tailles utilisées : 38 / 24 / 22 / 17 / 16 / 15 / 14.5 / 14 / 13.5 / 13 / 12.5 / 12 / 11.5 / 11.

## Iconographie

Toutes les icônes sont des **lucide** (déjà via `<UIcon>`). Aucune icône colorée dans cette
direction : on garde le glyphe en `currentColor` hérité de la text color de son contexte
(`var(--text-tertiary)` la plupart du temps).

Icônes utilisées dans la page : `i-lucide-alert-triangle` (danger zone uniquement).

## Animations / interactions

- Scroll smooth déjà actif globalement.
- Scroll-spy sur le sommaire latéral (toggle de la classe `.active` selon
  `IntersectionObserver` sur les `<section>`).
- Transitions sur les actions hover : `color 150ms` de `var(--text-tertiary)` →
  `var(--text-primary)` au survol des « Modifier », `background 120ms` sur les rows
  (très subtil — `transparent` → `rgba(0,0,0,0.02)`).
- Pas de gradient nulle part, sauf optionnellement la pill « Pro » (mais le proto la garde
  en couleur plate).

## Responsive

Le proto cible 1280 px. Pour le responsive :

- ≥ 1024 px : layout actuel.
- 768–1023 px : sommaire latéral devient horizontal (collé sous la topbar, scrollable
  horizontalement, hauteur ~44 px).
- < 768 px : sommaire en `<USelect>` natif fixé en haut, `padding` réduit à 24 px,
  les grids 3-colonnes (« Abonnement ») passent en `grid-template-columns: 1fr` empilé.

## State & data

Réutiliser tel quel :

- `useAuthStore().profil` → identité + exploitation
- `useAuthStore().updateProfil(payload)` → save
- `useAuth().resetPassword(email)` → flow « Changer mot de passe »
- `useAuth().logout()`
- `useNotifications()` pour les toasts
- `getApiErrorMessage()` pour les erreurs

À ajouter :

- Endpoint pour les **stats du plan** (ruches utilisées / max, sièges utilisés / max,
  exports ce mois). S'il n'existe pas déjà, voir `server/api/finances/` pour le pattern.
- Endpoint pour la **liste des membres de l'équipe** (probablement déjà là sous
  `/parametres/equipe` — réutiliser).
- Champs `alertesEssaim` et `pushMobile` dans le type `Preferences` et le schéma drizzle
  si on garde ces toggles.

## Fichiers de la stack à modifier

- `app/pages/parametres/index.vue` — remplacer entièrement par le nouveau layout.
- `app/assets/css/main.css` — ajouter les nouvelles variables (`--honey-soft`, `--honey-deep`,
  `--surface-muted`, `--text-quaternary`).
- `app/types/profil.ts` (ou équivalent) — étendre `Preferences` avec `alertesEssaim` et
  `pushMobile` si retenus.
- `server/database/schema.ts` (drizzle) — idem si stockés.

## Fichiers de référence dans ce bundle

- `preview.html` — ouvre les 3 directions dans un design canvas (pour comparer A/B/C
  si besoin de revenir en arrière).
- `variation_b_only.html` — preview standalone de la variation retenue, sans canvas
  ni autres directions. **C'est celle-ci à utiliser comme référence visuelle.**
- `source/variation-b.jsx` — JSX du proto (lecture seulement, pas de copier-coller direct).
- `source/shared/tokens.css` — extraction des tokens utilisés.
- `source/shared/sidebar.jsx`, `icons.jsx`, `data.jsx` — dépendances du proto.

## Hors scope (ne pas implémenter ici)

- Sous-page `/parametres/facturation` (existe déjà, on lie juste vers elle).
- Sous-page `/parametres/equipe` (existe déjà aussi).
- Mode sombre (à designer plus tard).
- Mobile détaillé (specs ci-dessus en mode « directives », pas final).
