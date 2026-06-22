# MAYA — Spécification minimale (parité IA Beekube)

> **But de ce fichier** : servir de référence à Claude Code (dev local) pour développer **Maya**,
> l'assistant IA apicole d'APIGO (pack **Pro**). Il décrit ce que Maya doit faire **au minimum**
> pour égaler l'IA de Beekube. **Pas de code ici** — uniquement le périmètre et les exigences.
>
> Maya est déjà en cours de développement : ce doc cadre le **socle minimum** à ne pas rater.

---

## 0. Contexte & positionnement

- **Maya** = assistant IA apicole d'APIGO, réservé **Pro+** (cohérent avec la roadmap tarifs).
- **Provider** : le projet privilégie les **modèles Claude récents** (cf. `CLAUDE.md`), dont un
  modèle **multimodal** pour l'analyse photo. Aucun provider LLM n'est encore câblé dans le repo.
- Maya s'appuie sur les données **déjà présentes** dans APIGO : interventions (14 types),
  ruches / ruchers, météo (Open-Meteo), score prédictif santé, suggestions nationales, photos,
  stocks / production, calendrier & alertes.

---

## 1. Les 4 capacités minimales (= ce que fait l'IA de Beekube)

| #   | Capacité (parité Beekube)               | Ce que Maya doit faire au minimum                                                                                                                                    | Entrées (données APIGO)                   | Sortie                                                           | Brique technique                       |
| --- | --------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------- | ---------------------------------------------------------------- | -------------------------------------- |
| 1   | **Conseils contextuels**                | Répondre « que faire sur cette ruche / ce rucher maintenant ? » en croisant historique d'interventions + saison + météo + score santé                                | interventions, météo, score santé, saison | 1–3 recommandations **priorisées** + justification courte        | Modèle Claude (texte)                  |
| 2   | **Saisie vocale des observations**      | L'apiculteur **dicte** sur le terrain ; Maya transcrit puis **structure** en intervention prête à enregistrer (type, constats, actions, ruche concernée)             | audio + contexte ruche                    | intervention **pré-remplie** à valider                           | STT (hors Claude) + Claude (structure) |
| 3   | **Diagnostic santé par photo**          | L'apiculteur **photographie** un cadre ; Maya détecte/score : couvain, réserves miel/pollen, présence reine/cellules royales, suspicion varroa / maladies du couvain | photo de cadre + historique ruche         | labels + **niveau de confiance** + reco + « voir véto si doute » | Claude **multimodal** (vision)         |
| 4   | **Fenêtres d'intervention prédictives** | Croiser historique + météo **prévue** + saison pour proposer les meilleures dates de visite / traitement / récolte / nourrissement                                   | historique, météo prévue, saison          | créneaux suggérés + **création d'alertes/tâches**                | Réutilise la corrélation météo         |

---

## 2. Au-delà de Beekube (différenciation APIGO — bonus, non bloquant)

- Maya branchée sur la **compta / facturation** : « quelle rentabilité par rucher ? », aide à la
  facturation, rappels de **conformité** (NAPI, registre d'élevage, traçabilité des lots).
- Maya **conversationnelle** sur toute l'exploitation (un seul chat).
- Conseils de **conformité réglementaire FR** (déclarations, ordonnances vétérinaires).

---

## 3. Exigences transverses (minimum)

- 🇫🇷 **Français**, ton clair, **cite les données sources** (« d'après ta visite du 12/06… »).
- ⚡ **Terrain** : latence raisonnable, tolérer la connexion faible (file d'attente offline pour
  le vocal et la photo, envoi différé).
- 🔒 **RGPD** : photo/voix traitées avec consentement, pas de stockage superflu.
- ⚖️ **Garde-fous** : pas de diagnostic vétérinaire définitif ; recommander un véto en cas de
  doute. Maya **propose**, l'apiculteur **valide** (l'intervention dictée est relue avant
  enregistrement).
- 🤖 **Modèles** : privilégier Claude — un modèle **multimodal** pour la photo, un modèle
  **rapide/économe** pour la structuration du vocal, un modèle de **raisonnement** pour le
  conseil/chat. Choisir la famille selon le coût/latence de chaque usage.
- 🔐 **Gating** : réservé **Pro+** (à câbler avec `PLAN_CONFIGS` dans `app/config/plans.ts`).

---

## 4. Données & intégrations nécessaires

- **Lecture** : interventions, ruches, ruchers, météo, score santé, photos, stocks, calendrier.
- **Briques externes** : moteur **STT** (saisie vocale), **vision** (Claude multimodal).
- **Écriture** : créer une **intervention pré-remplie** (depuis le vocal), créer des
  **alertes/tâches** (depuis les fenêtres prédictives).

---

## 5. MVP recommandé (ordre de réalisation)

1. **Conseils contextuels (texte)** — le plus rapide ; réutilise score santé + météo.
2. **Fenêtres d'intervention prédictives** — réutilise la corrélation météo existante.
3. **Saisie vocale** — STT + structuration en intervention.
4. **Diagnostic photo** — le plus lourd (vision + jeu de données à constituer).

---

## 6. Definition of Done minimale (parité Beekube atteinte)

- [ ] 1 — Conseils contextuels opérationnels
- [ ] 2 — Saisie vocale → intervention structurée et validable
- [ ] 3 — Diagnostic santé par photo (avec niveau de confiance + garde-fou véto)
- [ ] 4 — Fenêtres d'intervention prédictives + création d'alertes
- [ ] Gating **Pro+** + garde-fous + conformité RGPD

> Quand 1→4 sont faites, Maya **égale l'IA de Beekube**. Le reste (§2) nous fait **passer devant**.

---

## Sources

- Roadmap & comparatif complet : [`ROADMAP-tarifs-comparatif-beekube.md`](./ROADMAP-tarifs-comparatif-beekube.md)
- IA Beekube (conseils contextuels, vocal, diagnostic photo, prédictif) :
  [outils numériques apiculteur connecté](https://www.beekube.com/apiculture/guide-apiculture/outils-logiciels-apiculteurs/outils-numeriques-apiculteur-connecte/)
  · [application apiculture](https://www.beekube.com/apiculture/guide-apiculture/application-apiculture/)
