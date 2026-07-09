# Maya — Mode d'emploi : ce que TU fais + le prompt pour Claude Code

---

## A. Ce que tu fais, toi (3 gestes)

1. **Copie le dossier `handoff/` dans ton repo** (branche `v2`), par exemple à la racine sous `design/maya/`.
   Tu dois te retrouver avec, dans le repo : `design/maya/00_HANDOFF.md`, `design/maya/css/maya.css`, `design/maya/components/…`, et les logos dans `design/maya/assets/` (`maya-mark.svg`, `maya-icon.svg`, `maya-lockup.svg`).
   **Copie AUSSI le dossier `maya/` complet** (la maquette : `index.html` + les `.jsx` + `proto/`) sous `design/maya/mockup/`. Ce n'est pas optionnel : plusieurs composants fournis (surtout `MayaBubble.vue`) désignent le JSX de la maquette comme **source de vérité** du comportement et des valeurs exactes. Claude Code doit pouvoir le lire.

2. **Ouvre Claude Code à la racine du repo**, sur la branche `v2` (crée une branche de travail : `git checkout -b feat/maya-redesign`).

3. **Colle le prompt ci-dessous** (section B). Laisse-le bosser **phase par phase** : à la fin de chaque phase il s'arrête, tu lances `npm run dev`, tu regardes, tu dis « OK continue » ou tu corriges. Ne le laisse pas tout faire d'un coup.

> Règle simple pour toi : **1 phase = 1 commit = 1 revue**. Si une phase part de travers, `git checkout .` et tu relances la phase.

---

## B. Le prompt à coller dans Claude Code

```
Tu intègres un nouveau design ("Maya") dans ce repo Nuxt 4 / Vue 3 / TypeScript / Tailwind v4 + @nuxt/ui / ECharts, sur la branche v2.

AVANT TOUTE CHOSE :
1. Lis intégralement design/maya/00_HANDOFF.md. C'est ta spec. Respecte sa "règle d'or" et sa checklist (§11).
2. Lis ces fichiers du repo pour comprendre l'existant : app/assets/css/main.css, app/components/dashboard/MayaCard.vue, app/components/ia/CopiloteMessage.vue, app/components/ui/AppCommandPalette.vue, app/components/ui/BottomNav.vue, app/components/ui/KpiCard.vue, app/utils/echarts.ts.
3. Quand un détail visuel manque (espacement, copie, couleur), lis le JSX de la maquette indiqué dans la table §9 du handoff (design/maya/mockup/). Ne devine pas : reporte les valeurs exactes.

MÉTHODE (impérative) :
- Travaille PHASE PAR PHASE, dans l'ordre P0 → P4 (voir §10 du handoff).
- À la fin de CHAQUE phase : récapitule ce que tu as changé, fais UN commit avec un message clair, puis ARRÊTE-TOI et attends mon "OK continue". Ne démarre jamais la phase suivante sans mon feu vert.
- Ne refactore rien hors périmètre. Petits diffs lisibles. TypeScript strict, pas de `any`.
- Réutilise les composants existants quand le handoff le dit ; crée de nouveaux composants quand il le dit (n'hésite pas à en ajouter si nécessaire).

GARDE-FOUS (à vérifier à chaque phase) :
- Plus aucun `linear-gradient(..., var(--honey), var(--sage))` nulle part (grep le repo).
- Plus aucun `i-lucide-sparkles` en guise d'avatar Maya → c'est <IaMayaMark/>.
- `--sage` (vert) seulement pour la sémantique (santé, validation), jamais pour l'identité Maya.
- Cibles tactiles ≥ 46px. prefers-reduced-motion respecté.
- Maya est DÉTERMINISTE (pas un LLM) : pas de gros champ de texte libre "magique" mis en avant ; réponses au tap (chips/segmented) ou à la voix ; conseils étiquetés "règle". Ton chaleureux, tutoiement, première personne.

PHASE P0 — Fondations (commence ici, puis stop) :
1. Copie le bloc de design/maya/css/maya.css à la fin de app/assets/css/main.css.
2. Crée app/components/ia/MayaMark.vue à partir de design/maya/components/MayaMark.vue (c'est le logo VIVANT, utilisé dans toute l'UI).
3. Logos statiques (favicon / PWA / marketing) :
   - Copie design/maya/assets/maya-mark.svg, maya-icon.svg, maya-lockup.svg dans public/icons/.
   - Favicon : pointe le <link rel="icon"> (dans nuxt.config.ts → app.head.link, ou app/app.vue) vers /icons/maya-icon.svg.
   - Manifest PWA : remplace les icônes par le nouveau logo. Les icônes maskables réclament du PNG 192/512 — génère maya-icon-192.png et maya-icon-512.png depuis maya-icon.svg (ex. `npx sharp-cli` ou resvg) et mets à jour public/icons/icon-192.png, icon-512.png + le webmanifest (nuxt.config @vite-pwa/@nuxtjs/pwa).
   - Header / écran de connexion : utilise <IaMayaMark/> (UI) ou maya-lockup.svg (image statique) là où l'ancien logo/nom apparaît.
4. Dans app/components/dashboard/MayaCard.vue : remplace l'avatar (span.maya-avatar + i-lucide-sparkles) par <IaMayaMark :size="32" state="idle" /> ; supprime les règles .maya-avatar ; remplace l'épine dégradée .maya-card::before par `background: var(--honey)`.
5. Vérifie : `npm run dev`, la carte Maya du dashboard montre le rayon de miel animé, le favicon = la nouvelle marque, zéro dégradé orange-vert, build sans erreur TS.
Puis : commit "P0 — identité Maya (logo vivant + favicon/PWA, fin du dégradé)" et ARRÊTE-TOI.

ENSUITE (seulement sur mon feu vert), enchaîne P1 (surfaces Maya), P2 (formulaires), P3 (graphiques + thème ECharts), P4 (mobile/PWA terrain), exactement comme décrit en §7 et §10 du handoff. À chaque phase : commit + stop + attends mon OK.

EN P1, n'oublie pas le CŒUR de l'expérience — le MODE DE PRÉSENCE (§7bis du handoff) :
- Crée l'état global de présence (Pinia `app/stores/maya.ts` : 'partout' | 'discrete' | 'pause', persisté). Les surfaces proactives (MayaCard, briefings, cartes contextuelles) ne s'affichent QUE si presence === 'partout'.
- Dépose `ia/MayaBubble.vue` (fourni) et monte-le dans `app/layouts/default.vue` ; affiche-le si presence === 'discrete'. C'est le bouton noir qui se DÉPLIE en fenêtre. Comportement de référence exact : `design/maya/mockup/proto/MayaBubbleProto.jsx`.
- Dépose `ia/MayaPresenceSettings.vue` (fourni) ; ouvre-le depuis l'entrée sidebar « Maya · Assistant » ET depuis l'icône réglages de la bulle. Câble-le sur le store.
- Mobile : le bouton central de `BottomNav` ouvre la MÊME bulle (ne pas dupliquer).

Commence maintenant par lire le handoff, puis fais SEULEMENT la phase P0.
```

---

## C. Ce que tu regardes à chaque phase (revue express)

| Phase | Tu dois voir… | Drapeau rouge |
|---|---|---|
| **P0** | La carte Maya du dashboard = rayon de miel animé, accent honey plein, **favicon = la nouvelle marque** | Encore de l'orange→vert, ou un carré sparkles |
| **P1** | Maya pense (`think`) pendant une réponse, ⌘K a "Demander à Maya", bouton central de la tab bar = Maya, **la bulle discrète se déplie depuis son bouton**, les réglages de présence s'ouvrent depuis la sidebar | Champ de texte libre géant mis en avant ; cartes proactives visibles en mode "discrète" |
| **P2** | Un formulaire (VisiteRucher) en 46px, focus honey, état "pré-rempli par Maya" | Vieux style mélangé au neuf sur le même écran |
| **P3** | Jauges/sparklines sur le dashboard, charts ECharts re-harmonisés | Couleurs de charts hors palette |
| **P4** | Accueil mobile "Aujourd'hui", dictée → fiche, parcours au tap | Saisie clavier imposée sur le terrain |

Si un point cloche : dis-le en une phrase à Claude Code ("la jauge n'est pas honey, corrige") plutôt que de le laisser continuer.

---

## D. À la fin

- `git push` la branche `feat/maya-redesign`, ouvre une PR vers `v2`.
- Repasse la **checklist §11 du handoff** avant de merger.
- Garde `design/maya/` dans le repo : c'est ta source de vérité pour les évolutions futures.
